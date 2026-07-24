import { AdjustmentAction } from '@logitech/plugin-sdk';
import type { AdjustmentActionExecuteEvent } from '@logitech/plugin-sdk';
import type { BridgeClient } from '../bridge/bridge-client.js';

/**
 * Handles dial rotation for session navigation.
 * Clockwise = next session, Counter-clockwise = previous session.
 */
export class DialNavigateAction extends AdjustmentAction {
  readonly name = 'kiro_dial_navigate';
  displayName = 'Session Navigate';
  description = 'Navigate between Kiro sessions';
  readonly hasReset = true;

  private bridge: BridgeClient;

  constructor(bridge: BridgeClient) {
    super();
    this.bridge = bridge;
  }

  execute(event: AdjustmentActionExecuteEvent): void {
    this.bridge.send({
      type: 'dial_rotate',
      ticks: event.tick,
    });
  }
}
