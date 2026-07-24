import { CommandAction } from '@logitech/plugin-sdk';
import type { BridgeClient } from '../bridge/bridge-client.js';

/**
 * Stop/Cancel button — immediately cancels current Kiro operation.
 */
export class StopAction extends CommandAction {
  readonly name = 'kiro_stop';
  displayName = 'Stop Kiro';
  description = 'Cancel current Kiro operation';
  groupName = 'Kiro';

  private bridge: BridgeClient;

  constructor(bridge: BridgeClient) {
    super();
    this.bridge = bridge;
  }

  onKeyDown(): void {
    this.bridge.send({ type: 'cancel' });
  }
}
