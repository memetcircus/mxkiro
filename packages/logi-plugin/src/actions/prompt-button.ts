import { CommandAction } from '@logitech/plugin-sdk';
import type { BridgeClient } from '../bridge/bridge-client';

export class PromptButtonAction extends CommandAction {
  readonly name = 'kiro_prompt_button';
  displayName = 'Kiro Prompt';
  description = 'Send a prompt or skill to Kiro';
  groupName = 'Kiro';

  private bridge: BridgeClient;

  constructor(bridge: BridgeClient) {
    super();
    this.bridge = bridge;
  }

  onKeyDown(): void {
    this.bridge.send({
      type: 'button_press',
      buttonIndex: 0,
      page: 0,
    });
  }
}
