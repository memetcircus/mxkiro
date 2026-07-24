import { CommandAction } from '@logitech/plugin-sdk';
import type { BridgeClient } from '../bridge/bridge-client';

export class AutopilotToggleAction extends CommandAction {
  readonly name = 'kiro_autopilot_toggle';
  displayName = 'Autopilot';
  description = 'Toggle Kiro Autopilot mode';
  groupName = 'Kiro';

  private bridge: BridgeClient;

  constructor(bridge: BridgeClient) {
    super();
    this.bridge = bridge;
  }

  onKeyDown(): void {
    this.bridge.send({ type: 'autopilot_toggle' });
  }
}
