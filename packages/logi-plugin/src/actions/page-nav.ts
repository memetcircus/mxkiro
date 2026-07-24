import { CommandAction } from '@logitech/plugin-sdk';
import type { PageManager } from '../state/page-manager.js';

/**
 * Handles the < > navigation buttons at the bottom of the keypad.
 * Switches between prompt pages.
 */
export class PageNavAction extends CommandAction {
  readonly name = 'kiro_page_nav';
  displayName = 'Page Navigation';
  description = 'Navigate between prompt pages';
  groupName = 'Kiro';

  private pageManager: PageManager;

  constructor(pageManager: PageManager) {
    super();
    this.pageManager = pageManager;
  }

  onKeyDown(): void {
    // TODO: Determine if this is < or > based on Logi SDK context
    // For now, always go next
    this.pageManager.nextPage();
  }
}
