import { AdjustmentAction } from '@logitech/plugin-sdk';
import type { BridgeClient } from '../bridge/bridge-client';

export class RollerModelAction extends AdjustmentAction {
  readonly name = 'kiro_roller_model';
  displayName = 'Model Select';
  description = 'Switch AI model with the roller';
  readonly hasReset = false;

  private bridge: BridgeClient;

  constructor(bridge: BridgeClient) {
    super();
    this.bridge = bridge;
  }

  execute(event: { tick: number }): void {
    this.bridge.send({
      type: 'roller_rotate',
      ticks: event.tick,
    });
  }
}
