import { BRIDGE_PORT, AVAILABLE_MODELS, HealthLevel } from '@mxkiro/shared';
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
        acpClient.sendSkillPrompt(button.value);
      } else if (button.type === 'shortcut') {
        shortcuts.execute(button.value);
      } else if (button.type === 'command') {
        acpClient.sendCommand(button.value);
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
  console.log('🔔 Kiro hook →', state);
  wsServer.broadcast({ type: 'state_change', state });

  // Check session health on state changes
  const health = sessionMonitor.checkHealth();
  if (health.level !== HealthLevel.NORMAL) {
    wsServer.broadcast({
      type: 'session_health',
      tokenCount: health.tokenCount,
      messageCount: health.messageCount,
      level: health.level,
    });
  }
});

acpClient.onNotification((notification) => {
  console.log('📡 ACP →', notification.type);
  wsServer.broadcast(notification);
});

// --- Start everything ---

await wsServer.start();
await httpServer.start();

console.log('');
console.log(`✅ MX Kiro Bridge ready!`);
console.log(`   WebSocket: ws://localhost:${BRIDGE_PORT}`);
console.log(`   HTTP (hooks): http://localhost:${BRIDGE_PORT + 1}`);
console.log(`   Sessions: ${sessionMonitor.getSessionCount()} found`);
console.log('');
console.log('   Waiting for plugin connection...');
