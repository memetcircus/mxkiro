import { CommandAction } from '@logitech/plugin-sdk';
import type { BridgeClient } from '../bridge/bridge-client.js';
import type { PageManager } from '../state/page-manager.js';

/**
 * Handles LCD button presses on the keypad.
 * Resolves which button was pressed based on the page manager,
 * then sends the appropriate command to Bridge.
 */
export class PromptButtonAction extends CommandAction {
  readonly name = 'kiro_prompt_button';
  displayName = 'Kiro Prompt';
  description = 'Send a prompt or skill to Kiro';
  groupName = 'Kiro';

  private bridge: BridgeClient;
  private pageManager: PageManager;

  constructor(bridge: BridgeClient, pageManager: PageManager) {
    super();
    this.bridge = bridge;
    this.pageManager = pageManager;
  }

  onKeyDown(): void {
    // TODO: The Logi SDK should provide button index context
    // For now we'll need to register separate actions per button
    // or use a different SDK mechanism to determine which button
    this.bridge.send({
      type: 'button_press',
      buttonIndex: 0, // Will be dynamic once we understand Logi SDK button identification
      page: this.pageManager.getCurrentIndex(),
    });
  }
}
