import { PluginSDK } from '@logitech/plugin-sdk';
import { PromptButtonAction } from './src/actions/prompt-button';
import { DialNavigateAction } from './src/actions/dial-navigate';
import { RollerModelAction } from './src/actions/roller-model';
import { StopAction } from './src/actions/stop-action';
import { AutopilotToggleAction } from './src/actions/autopilot-toggle';
import { BridgeClient } from './src/bridge/bridge-client';

// Initialize bridge connection
const bridge = new BridgeClient();

// Create plugin SDK instance
const pluginSDK = new PluginSDK();

// Register all actions
pluginSDK.registerAction(new PromptButtonAction(bridge));
pluginSDK.registerAction(new DialNavigateAction(bridge));
pluginSDK.registerAction(new RollerModelAction(bridge));
pluginSDK.registerAction(new StopAction(bridge));
pluginSDK.registerAction(new AutopilotToggleAction(bridge));

// Connect to Logi Plugin Service
await pluginSDK.connect();

// Connect to Bridge (non-blocking — will retry if bridge isn't running yet)
bridge.connect().catch(() => {
  console.log('⚠️ Bridge not running. Start it with: npm run dev:bridge');
});

console.log('👻 Kiro MX Console Plugin ready!');
