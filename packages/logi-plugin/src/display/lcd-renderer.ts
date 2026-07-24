import { KiroState, LCD_BUTTON_COUNT } from '@mxkiro/shared';
import type { ButtonConfig, PageConfig } from '@mxkiro/shared';

/**
 * LCD Renderer — manages what's displayed on the 9 LCD buttons.
 * In a real implementation, this would use Logi SDK's image APIs.
 * For now, it logs what would be rendered.
 */
export class LcdRenderer {
  /**
   * Render prompt buttons on LCD (IDLE state).
   */
  renderPage(page: PageConfig, pageIndex: number, totalPages: number): void {
    console.log(`🖥️ LCD: Page "${page.name}" (${pageIndex + 1}/${totalPages})`);
    for (const button of page.buttons) {
      console.log(`   [${button.index}] ${button.icon ?? ''} ${button.label}`);
    }
    // TODO: Use Logi SDK to set actual button images
    // Each button needs a rendered image (icon + label text on colored background)
  }

  /**
   * Render dynamic response buttons (WAITING state).
   */
  renderWaitingOptions(options: string[]): void {
    console.log('🖥️ LCD: Waiting for response');
    options.forEach((opt, i) => {
      console.log(`   [${i}] ${opt}`);
    });
    // TODO: Render actual button images with option text
  }

  /**
   * Render a single animation frame across all 9 buttons (WORKING state).
   * The frame is a full canvas split into 3x3 tiles.
   */
  renderAnimationFrame(tiles: Buffer[]): void {
    if (tiles.length !== LCD_BUTTON_COUNT) {
      console.warn(`⚠️ Expected ${LCD_BUTTON_COUNT} tiles, got ${tiles.length}`);
      return;
    }
    // TODO: Send each tile to corresponding LCD button via Logi SDK
    // For each i in 0..8: setButtonImage(i, tiles[i])
  }

  /**
   * Render session info overlay (shown briefly when dial is rotated).
   */
  renderSessionInfo(name: string, index: number, total: number): void {
    console.log(`🖥️ LCD: Session "${name}" (${index + 1}/${total})`);
    // TODO: Render overlay showing session name and position
  }

  /**
   * Render model change overlay (shown briefly when roller is used).
   */
  renderModelInfo(modelName: string): void {
    console.log(`🖥️ LCD: Model → ${modelName}`);
    // TODO: Render overlay showing model name
  }

  /**
   * Clear all LCD buttons.
   */
  clear(): void {
    console.log('🖥️ LCD: Clear');
    // TODO: Set all buttons to black/empty
  }
}
