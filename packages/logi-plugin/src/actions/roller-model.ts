import { AdjustmentAction } from '@logitech/plugin-sdk';
import type { AdjustmentActionExecuteEvent } from '@logitech/plugin-sdk';
import type { BridgeClient } from '../bridge/bridge-client.js';

/**
 * Handles roller rotation for AI model selection.
 * Scroll up/down through available models.
 */
export class RollerModelAction extends AdjustmentAction {
  readonly name = 'kiro_roller_model';
  displayName = 'Model Select';
  description = 'Switch AI model';
  readonly hasReset = false;

  private bridge: BridgeClient;

  constructor(bridge: BridgeClient) {
    super();
    this.bridge = bridge;
  }

  execute(event: AdjustmentActionExecuteEvent): void {
    this.bridge.send({
      type: 'roller_rotate',
      ticks: event.tick,
    });
  }
}
