import type { ButtonConfig, PageConfig } from '@mxkiro/shared';

type PageChangeCallback = (page: PageConfig, pageIndex: number, totalPages: number) => void;

/**
 * Manages keypad page navigation.
 * Tracks current page and provides button config for display.
 */
export class PageManager {
  private pages: PageConfig[] = [];
  private currentIndex = 0;
  private listeners: PageChangeCallback[] = [];

  setPages(pages: PageConfig[]): void {
    this.pages = pages;
    this.currentIndex = 0;
    this.notifyListeners();
  }

  onPageChange(callback: PageChangeCallback): void {
    this.listeners.push(callback);
  }

  nextPage(): void {
    if (this.pages.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.pages.length;
    this.notifyListeners();
  }

  prevPage(): void {
    if (this.pages.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.pages.length) % this.pages.length;
    this.notifyListeners();
  }

  getCurrentPage(): PageConfig | null {
    return this.pages[this.currentIndex] ?? null;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getPageCount(): number {
    return this.pages.length;
  }

  getButton(index: number): ButtonConfig | null {
    const page = this.getCurrentPage();
    if (!page) return null;
    return page.buttons.find((b) => b.index === index) ?? null;
  }

  private notifyListeners(): void {
    const page = this.getCurrentPage();
    if (!page) return;
    for (const listener of this.listeners) {
      listener(page, this.currentIndex, this.pages.length);
    }
  }
}
