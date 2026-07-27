import { BRIDGE_PORT, AVAILABLE_MODELS, HealthLevel, KiroState } from '@mxkiro/shared';
import { WsServer } from './ws-server.js';
import { HttpServer } from './http-server.js';
import { AcpClient } from './acp-client.js';
import { ConfigManager } from './config-manager.js';
import { SessionMonitor } from './session-monitor.js';
import { ShortcutExecutor } from './shortcut-executor.js';

console.log('🌉 MX Kiro Bridge starting...');

// Load configuration
const config = new ConfigManager();
await config.load();
console.log(`📋 Config loaded (${config.getPageCount()} pages)`);

// Session monitor
const sessionMonitor = new SessionMonitor();
await sessionMonitor.loadSessions();
console.log(`📂 Found ${sessionMonitor.getSessionCount()} sessions`);

// Shortcut executor
const shortcuts = new ShortcutExecutor();

// Model tracking
let currentModelIndex = 0;

// Session health — active IDE chat counter
let messageCount = 0;
let bridgeState = KiroState.IDLE;
let suppressWorkingUntil = 0;
const CANCEL_WORKING_SUPPRESSION_MS = 2000;

// Health thresholds
const HEALTH_NORMAL_MAX = 15;
const HEALTH_THINKING_MAX = 25;
const HEALTH_WORRIED_MAX = 35;
// Above 35 = angry/panic

function getHealthLevel(): string {
  if (messageCount <= HEALTH_NORMAL_MAX) return 'normal';
  if (messageCount <= HEALTH_THINKING_MAX) return 'thinking';
  if (messageCount <= HEALTH_WORRIED_MAX) return 'worried';
  return 'critical';
}

// WebSocket server — Logi Plugin connects here
const wsServer = new WsServer(BRIDGE_PORT);

// HTTP endpoints — Kiro Hooks call these
const httpServer = new HttpServer(BRIDGE_PORT + 1);

// ACP client — connects to Kiro CLI
const acpClient = new AcpClient();

// --- Wire Plugin → Bridge → Kiro ---

wsServer.onMessage((msg) => {
  console.log('📥 Plugin →', msg.type);

  switch (msg.type) {
    case 'button_press': {
      const button = config.getButtonForPress(msg.page, msg.buttonIndex);
      if (!button) {
        console.warn(`⚠️ No button config for page=${msg.page} index=${msg.buttonIndex}`);
        return;
      }

      if (button.type === 'skill' || button.type === 'steering') {
        shortcuts.sendToKiroChat(button.value);
      } else if (button.type === 'shortcut') {
        shortcuts.execute(button.value);
      } else if (button.type === 'command') {
        shortcuts.sendToKiroChat(button.value);
      }
      break;
    }

    case 'dial_rotate': {
      const session = sessionMonitor.navigateBy(msg.ticks);
      if (session) {
        acpClient.loadSession(session.id);
        wsServer.broadcast({
          type: 'session_loaded',
          session,
          index: sessionMonitor.getActiveIndex(),
          total: sessionMonitor.getSessionCount(),
        });
      }
      break;
    }

    case 'dial_click': {
      const active = sessionMonitor.getActiveSession();
      if (active) {
        acpClient.loadSession(active.id);
      }
      break;
    }

    case 'roller_rotate': {
      currentModelIndex += msg.ticks > 0 ? 1 : -1;
      if (currentModelIndex < 0) currentModelIndex = AVAILABLE_MODELS.length - 1;
      if (currentModelIndex >= AVAILABLE_MODELS.length) currentModelIndex = 0;

      const model = AVAILABLE_MODELS[currentModelIndex]!;
      acpClient.setModel(model.id);
      wsServer.broadcast({
        type: 'model_changed',
        modelId: model.id,
        modelName: model.name,
      });
      break;
    }

    case 'cancel':
      acpClient.cancelSession();
      break;

    case 'response':
      acpClient.sendResponse(msg.value);
      break;

    case 'autopilot_toggle':
      acpClient.toggleAutopilot();
      break;
  }
});

// --- Wire Kiro → Bridge → Plugin ---

httpServer.onStateChange((state) => {
  // A promptSubmit hook can arrive just after a physical cancel request.
  // Ignore only that stale working event so cancellation remains authoritative.
  if (state === KiroState.WORKING && Date.now() < suppressWorkingUntil) {
    console.log('🛑 Ignored stale working hook after cancel');
    httpServer.setState(KiroState.IDLE);
    return;
  }

  console.log('🔔 Kiro hook →', state);
  const previousState = bridgeState;
  bridgeState = state;
  httpServer.setState(state);

  // Count one exchange only when entering working state.
  if (state === KiroState.WORKING && previousState !== KiroState.WORKING) {
    messageCount++;
    httpServer.setHealth(messageCount, getHealthLevel());
    console.log(`📊 Message count: ${messageCount} (health: ${getHealthLevel()})`);
  }

  // Clear auto-idle timer when hook reports state
  if (idleTimer && state === KiroState.IDLE) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }

  wsServer.broadcast({ type: 'state_change', state });
});

// Auto-idle timer — fallback if hook doesn't fire
let idleTimer: ReturnType<typeof setTimeout> | null = null;

httpServer.onPrompt((text) => {
  // Shorten long prompts from C# plugin (until plugin is rebuilt with short prompts)
  const shortPrompt = shortenPrompt(text);
  console.log('💬 Sending prompt to Kiro IDE:', shortPrompt);
  httpServer.setState('working');
  shortcuts.sendToKiroChat(shortPrompt);

  // Reset any existing timer, set long fallback (2 min) in case hook never fires
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    httpServer.setState('idle');
    console.log('⏱️ Auto-idle fallback (2min)');
  }, 120000);
});

function shortenPrompt(text: string): string {
  const mapping: [RegExp, string][] = [
    [/^Explain this code/i, 'explain this file'],
    [/^Be honest and critical/i, 'criticize this code'],
    [/^Simplify this code/i, 'simplify this code'],
    [/^Document this code/i, 'document this code'],
    [/^Find and fix the bug/i, 'find and fix the bug'],
    [/^Optimize the performance/i, 'optimize this code'],
    [/^Review this code/i, 'review this code'],
    [/^Refactor this code/i, 'refactor this code'],
    [/^Write comprehensive tests/i, 'write tests for this code'],
  ];

  for (const [pattern, short] of mapping) {
    if (pattern.test(text)) return short;
  }
  return text;
}

httpServer.onSessionReset(() => {
  messageCount = 0;
  bridgeState = KiroState.IDLE;
  suppressWorkingUntil = 0;
  console.log('📊 Message counter reset to 0');
});

httpServer.onNewSession(() => {
  messageCount = 0;
  bridgeState = KiroState.IDLE;
  suppressWorkingUntil = 0;
  // Open new session in Kiro IDE via Shift+Cmd+L
  void shortcuts.execute('shift+cmd+l').catch((error: Error) => {
    console.error('❌ Failed to open new Kiro IDE session:', error.message);
  });
  console.log('🆕 New session opened in Kiro IDE');
});

httpServer.onCancel(() => {
  suppressWorkingUntil = Date.now() + CANCEL_WORKING_SUPPRESSION_MS;
  bridgeState = KiroState.IDLE;
  httpServer.setState(KiroState.IDLE);

  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }

  wsServer.broadcast({ type: 'state_change', state: KiroState.IDLE });

  void shortcuts.cancelKiroGeneration().catch((error: Error) => {
    console.error('❌ Failed to cancel Kiro IDE generation:', error.message);
  });
});

httpServer.onScreenshot(() => {
  void shortcuts.screenshotToChat().catch((error: Error) => {
    console.error('❌ Screenshot failed:', error.message);
  });
});

// Session navigation — direct, no threshold
httpServer.onSessionNavigate((ticks) => {
  const direction = ticks > 0 ? 'right' : 'left';
  void shortcuts.navigateKiroSession(direction).catch((error: any) => {
    console.error('❌ Session navigation failed:', error.message);
  });
  console.log(`🔄 Session navigate: ${direction}`);
});

httpServer.onModelSwitch((ticks) => {
  currentModelIndex += ticks > 0 ? 1 : -1;
  if (currentModelIndex < 0) currentModelIndex = AVAILABLE_MODELS.length - 1;
  if (currentModelIndex >= AVAILABLE_MODELS.length) currentModelIndex = 0;
  const model = AVAILABLE_MODELS[currentModelIndex]!;
  acpClient.setModel(model.id);
  console.log(`🤖 Model → ${model.name}`);
});

// Scroll — removed; users assign Logi's native "Mouse Scroll" to the roller instead

acpClient.onNotification((notification) => {
  console.log('📡 ACP →', notification.type);
  wsServer.broadcast(notification);
});

// --- Start everything ---

await wsServer.start();
await httpServer.start();
await acpClient.connect();

console.log('');
console.log(`✅ MX Kiro Bridge ready!`);
console.log(`   WebSocket: ws://localhost:${BRIDGE_PORT}`);
console.log(`   HTTP (hooks): http://localhost:${BRIDGE_PORT + 1}`);
console.log(`   ACP: ${acpClient.isConnected() ? '🟢 connected' : '🟡 offline mode'}`);
console.log(`   Sessions: ${sessionMonitor.getSessionCount()} found`);
console.log('');
if (acpClient.isConnected()) {
  console.log('   🎮 Ready — button presses will reach Kiro!');
} else {
  console.log('   ⚠️  Kiro CLI not available — prompts will be queued');
  console.log('   Install: curl -fsSL https://cli.kiro.dev/install | bash');
}
