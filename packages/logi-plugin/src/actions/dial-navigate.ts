import { AdjustmentAction } from '@logitech/plugin-sdk';
import type { BridgeClient } from '../bridge/bridge-client';

export class DialNavigateAction extends AdjustmentAction {
  readonly name = 'kiro_dial_navigate';
  displayName = 'Session Navigate';
  description = 'Navigate between Kiro sessions with the dial';
  readonly hasReset = true;

  private bridge: BridgeClient;

  constructor(bridge: BridgeClient) {
    super();
    this.bridge = bridge;
  }

  execute(event: { tick: number }): void {
    this.bridge.send({
      type: 'dial_rotate',
      ticks: event.tick,
    });
  }
}
