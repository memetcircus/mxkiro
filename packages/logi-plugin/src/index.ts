import { PluginSDK } from '@logitech/plugin-sdk';
import { KiroState, GHOST_ANIMATION_FRAMES } from '@mxkiro/shared';
import type { BridgeToPluginMessage } from '@mxkiro/shared';
import { PromptButtonAction } from './actions/prompt-button.js';
import { DialNavigateAction } from './actions/dial-navigate.js';
import { RollerModelAction } from './actions/roller-model.js';
import { StopAction } from './actions/stop-action.js';
import { AutopilotToggleAction } from './actions/autopilot-toggle.js';
import { PageNavAction } from './actions/page-nav.js';
import { BridgeClient } from './bridge/bridge-client.js';
import { KiroStateMachine } from './state/kiro-state-machine.js';
import { PageManager } from './state/page-manager.js';
import { LcdRenderer } from './display/lcd-renderer.js';
import { AnimationEngine } from './display/animation-engine.js';
import { PulseEffect } from './display/pulse-effect.js';

// --- Core systems ---
const stateMachine = new KiroStateMachine();
const pageManager = new PageManager();
const lcd = new LcdRenderer();
const bridge = new BridgeClient();
const animationEngine = new AnimationEngine();
const pulseEffect = new PulseEffect();

// Load animations
try {
  animationEngine.loadAnimation('ghost-walk', GHOST_ANIMATION_FRAMES);
  animationEngine.loadAnimation('fire', 20);
} catch {
  console.warn('⚠️ Could not load animation sprites (will use fallback)');
}

// Animation frame → LCD
animationEngine.onFrame((tiles, _frameIndex) => {
  lcd.renderAnimationFrame(tiles);
});

// Pulse → LCD brightness
pulseEffect.onBrightness((_brightness) => {
  // TODO: Apply brightness to LCD buttons via Logi SDK
});

// --- Default pages (will be overridden by bridge config) ---
pageManager.setPages([
  {
    name: 'Prompts',
    buttons: [
      { index: 0, type: 'skill', value: '/criticize', label: 'Eleştir', icon: '🔍' },
      { index: 1, type: 'skill', value: '/refactor', label: 'Refactor', icon: '♻️' },
      { index: 2, type: 'skill', value: '/test-write', label: 'Test Yaz', icon: '🧪' },
      { index: 3, type: 'skill', value: '/explain', label: 'Açıkla', icon: '💡' },
      { index: 4, type: 'skill', value: '/fix-bug', label: 'Fix Bug', icon: '🐛' },
      { index: 5, type: 'skill', value: '/optimize', label: 'Optimize', icon: '⚡' },
      { index: 6, type: 'skill', value: '/review', label: 'Review', icon: '👀' },
      { index: 7, type: 'skill', value: '/document', label: 'Dokümante', icon: '📝' },
      { index: 8, type: 'skill', value: '/simplify', label: 'Basitleştir', icon: '✂️' },
    ],
  },
]);

// --- State change → LCD update ---
stateMachine.onChange((newState, oldState) => {
  console.log(`👻 State: ${oldState} → ${newState}`);

  switch (newState) {
    case KiroState.IDLE: {
      // Stop animations, show prompt buttons
      animationEngine.stop();
      pulseEffect.stop();
      const page = pageManager.getCurrentPage();
      if (page) {
        lcd.renderPage(page, pageManager.getCurrentIndex(), pageManager.getPageCount());
      }
      break;
    }
    case KiroState.WORKING:
      // Start ghost walk animation
      pulseEffect.stop();
      animationEngine.play('ghost-walk');
      break;

    case KiroState.WAITING:
      // Show dynamic response buttons + pulse
      animationEngine.stop();
      lcd.renderWaitingOptions(stateMachine.getWaitingOptions());
      pulseEffect.startNormal();
      break;

    case KiroState.SUCCESS:
      // Brief success indicator, then back to IDLE
      animationEngine.stop();
      pulseEffect.stop();
      console.log('✅ Success!');
      setTimeout(() => stateMachine.transition(KiroState.IDLE), 2000);
      break;

    case KiroState.ERROR:
      animationEngine.stop();
      pulseEffect.startUrgent();
      console.log('❌ Error!');
      setTimeout(() => stateMachine.transition(KiroState.IDLE), 3000);
      break;
  }
});

// --- Page change → LCD update ---
pageManager.onPageChange((page, index, total) => {
  if (stateMachine.isIdle()) {
    lcd.renderPage(page, index, total);
  }
});

// --- Bridge messages → State updates ---
bridge.onMessage((msg: BridgeToPluginMessage) => {
  switch (msg.type) {
    case 'state_change':
      stateMachine.transition(msg.state, msg.options);
      break;
    case 'update_buttons':
      // TODO: Update page config dynamically
      break;
    case 'show_animation':
      // TODO: Trigger specific animation
      break;
    case 'session_loaded':
      lcd.renderSessionInfo(msg.session.name, msg.index, msg.total);
      break;
    case 'model_changed':
      lcd.renderModelInfo(msg.modelName);
      break;
    case 'session_health':
      // Show fire animation if critical
      if (msg.level === 'critical') {
        animationEngine.play('fire', 10);
      }
      console.log(`🔥 Session health: ${msg.level} (${msg.tokenCount} tokens)`);
      break;
  }
});

// --- Create plugin SDK and register actions ---
const pluginSDK = new PluginSDK();

pluginSDK.registerAction(new PromptButtonAction(bridge, pageManager));
pluginSDK.registerAction(new DialNavigateAction(bridge));
pluginSDK.registerAction(new RollerModelAction(bridge));
pluginSDK.registerAction(new StopAction(bridge));
pluginSDK.registerAction(new AutopilotToggleAction(bridge));
pluginSDK.registerAction(new PageNavAction(pageManager));

// --- Connect ---
await pluginSDK.connect();
await bridge.connect();

// Initial render
const page = pageManager.getCurrentPage();
if (page) {
  lcd.renderPage(page, 0, pageManager.getPageCount());
}

console.log('👻 Kiro MX Console Plugin ready!');
