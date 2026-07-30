import { BRIDGE_PORT, AVAILABLE_MODELS, HealthLevel, KiroState } from '@mxkiro/shared';
import { WsServer } from './ws-server.js';
import { HttpServer } from './http-server.js';
import { AcpClient } from './acp-client.js';
import { ConfigManager } from './config-manager.js';
import { SessionMonitor } from './session-monitor.js';
import { ShortcutExecutor } from './shortcut-executor.js';
import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';

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
const CANCEL_WORKING_SUPPRESSION_MS = 5000;

// Real context usage from Kiro IDE session files
let contextUsagePercent = 0;

// Health thresholds based on real context window usage percentage
const HEALTH_THINKING_MIN = 50;  // 50%+
const HEALTH_WORRIED_MIN = 75;   // 75%+
const HEALTH_CRITICAL_MIN = 90;  // 90%+

function getHealthLevel(): string {
  if (contextUsagePercent >= HEALTH_CRITICAL_MIN) return 'critical';
  if (contextUsagePercent >= HEALTH_WORRIED_MIN) return 'worried';
  if (contextUsagePercent >= HEALTH_THINKING_MIN) return 'thinking';
  return 'normal';
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

// --- Context Usage Reader ---
// Reads real context window usage from Kiro IDE workspace session files.
// Path: ~/Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent/workspace-sessions/<base64-workspace>/

const KIRO_SESSIONS_BASE = join(
  homedir(),
  'Library', 'Application Support', 'Kiro', 'User', 'globalStorage',
  'kiro.kiroagent', 'workspace-sessions'
);

async function readContextUsage(): Promise<number> {
  try {
    if (!existsSync(KIRO_SESSIONS_BASE)) return 0;

    // Find workspace folders
    const workspaceDirs = await readdir(KIRO_SESSIONS_BASE);

    let latestUsage = 0;
    let latestMtime = 0;

    for (const wsDir of workspaceDirs) {
      const wsPath = join(KIRO_SESSIONS_BASE, wsDir);
      const files = await readdir(wsPath);

      // Find most recently modified session JSON (not sessions.json)
      for (const file of files) {
        if (file === 'sessions.json' || !file.endsWith('.json')) continue;
        const filePath = join(wsPath, file);

        try {
          const { mtimeMs } = await import('node:fs').then(fs => fs.statSync(filePath));
          if (mtimeMs > latestMtime) {
            const raw = await readFile(filePath, 'utf-8');
            const data = JSON.parse(raw);
            if (typeof data.contextUsagePercentage === 'number') {
              latestUsage = data.contextUsagePercentage;
              latestMtime = mtimeMs;
            }
          }
        } catch {
          // Skip unreadable files
        }
      }
    }

    return latestUsage;
  } catch {
    return 0;
  }
}

// Poll context usage every 2 seconds when working
let contextPollTimer: ReturnType<typeof setInterval> | null = null;

function startContextPolling() {
  if (contextPollTimer) return;
  contextPollTimer = setInterval(async () => {
    const usage = await readContextUsage();
    if (usage !== contextUsagePercent) {
      contextUsagePercent = usage;
      const level = getHealthLevel();
      httpServer.setHealth(Math.round(usage), level);
      console.log(`📊 Context usage: ${usage.toFixed(1)}% (health: ${level})`);
    }
  }, 2000);
}

function stopContextPolling() {
  if (contextPollTimer) {
    clearInterval(contextPollTimer);
    contextPollTimer = null;
  }
}

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

  // Start/stop context usage polling based on state
  if (state === KiroState.WORKING && previousState !== KiroState.WORKING) {
    messageCount++;
    startContextPolling();
    // Read context usage immediately on state change
    void readContextUsage().then((usage) => {
      contextUsagePercent = usage;
      httpServer.setHealth(Math.round(usage), getHealthLevel());
    });
  } else if (state === KiroState.IDLE) {
    // One final read when going idle, then stop polling
    void readContextUsage().then((usage) => {
      contextUsagePercent = usage;
      httpServer.setHealth(Math.round(usage), getHealthLevel());
      console.log(`📊 Context usage: ${usage.toFixed(1)}% (health: ${getHealthLevel()})`);
    });
    stopContextPolling();
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
  contextUsagePercent = 0;
  bridgeState = KiroState.IDLE;
  suppressWorkingUntil = 0;
  httpServer.setHealth(0, 'normal');
  stopContextPolling();
  console.log('📊 Session reset — context usage cleared');
});

httpServer.onNewSession(() => {
  messageCount = 0;
  contextUsagePercent = 0;
  bridgeState = KiroState.IDLE;
  suppressWorkingUntil = 0;
  httpServer.setHealth(0, 'normal');
  stopContextPolling();
  // Open new session in Kiro IDE via Shift+Cmd+L
  void shortcuts.execute('shift+cmd+l').catch((error: Error) => {
    console.error('❌ Failed to open new Kiro IDE session:', error.message);
  });
  console.log('🆕 New session opened in Kiro IDE');
});

httpServer.onSnippet((text) => {
  shortcuts.appendToChat(text);
});

httpServer.onStruct(() => {
  shortcuts.structPrompt();
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

acpClient.onNotification((notification) => {
  console.log('📡 ACP →', notification.type);
  wsServer.broadcast(notification);
});

// --- Start everything ---

await wsServer.start();
await httpServer.start();
await acpClient.connect();

// Disable macOS screenshot floating thumbnail (required for instant screen capture)
import { exec } from 'node:child_process';
exec('defaults write com.apple.screencapture show-thumbnail -bool false');

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

// Read initial context usage on startup
const initialUsage = await readContextUsage();
if (initialUsage > 0) {
  contextUsagePercent = initialUsage;
  httpServer.setHealth(Math.round(initialUsage), getHealthLevel());
  console.log(`   📊 Context usage: ${initialUsage.toFixed(1)}% (health: ${getHealthLevel()})`);
}
