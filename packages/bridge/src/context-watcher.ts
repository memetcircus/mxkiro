import type { PageConfig } from '@mxkiro/shared';

/**
 * Context Watcher — monitors active file type and suggests appropriate button sets.
 * 
 * When the active file in Kiro changes, this module determines which
 * prompt page is most relevant and notifies the plugin to switch.
 */

interface ContextRule {
  pattern: RegExp;
  pageName: string;
  buttons: Array<{ index: number; type: 'skill'; value: string; label: string; icon: string }>;
}

const CONTEXT_RULES: ContextRule[] = [
  {
    pattern: /\.(tsx|jsx)$/,
    pageName: 'React',
    buttons: [
      { index: 0, type: 'skill', value: '/criticize', label: 'Eleştir', icon: '🔍' },
      { index: 1, type: 'skill', value: '/refactor', label: 'Refactor', icon: '♻️' },
      { index: 2, type: 'skill', value: '/test-write', label: 'Test Yaz', icon: '🧪' },
      { index: 3, type: 'skill', value: 'Extract this into a reusable component', label: 'Extract', icon: '📦' },
      { index: 4, type: 'skill', value: 'Add proper TypeScript types to this component', label: 'Type it', icon: '🏷️' },
      { index: 5, type: 'skill', value: 'Make this component accessible (WCAG)', label: 'A11y', icon: '♿' },
      { index: 6, type: 'skill', value: 'Add error boundaries and loading states', label: 'Error UI', icon: '🛡️' },
      { index: 7, type: 'skill', value: 'Optimize re-renders with memo/useMemo/useCallback', label: 'Perf', icon: '⚡' },
      { index: 8, type: 'skill', value: 'Add Storybook stories for this component', label: 'Stories', icon: '📖' },
    ],
  },
  {
    pattern: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
    pageName: 'Testing',
    buttons: [
      { index: 0, type: 'skill', value: 'Add more edge case tests', label: 'Edge Cases', icon: '🔀' },
      { index: 1, type: 'skill', value: 'Add error/failure scenario tests', label: 'Error Tests', icon: '💥' },
      { index: 2, type: 'skill', value: 'Improve test descriptions to be more readable', label: 'Describe', icon: '✏️' },
      { index: 3, type: 'skill', value: 'Add mock for external dependencies', label: 'Mock', icon: '🎭' },
      { index: 4, type: 'skill', value: 'Add integration test that covers the full flow', label: 'Integration', icon: '🔗' },
      { index: 5, type: 'skill', value: 'Check test coverage and add missing tests', label: 'Coverage', icon: '📊' },
      { index: 6, type: 'skill', value: '/criticize', label: 'Eleştir', icon: '🔍' },
      { index: 7, type: 'skill', value: '/simplify', label: 'Basitleştir', icon: '✂️' },
      { index: 8, type: 'skill', value: 'Run tests and fix any failures', label: 'Fix Tests', icon: '🩹' },
    ],
  },
  {
    pattern: /\.(py)$/,
    pageName: 'Python',
    buttons: [
      { index: 0, type: 'skill', value: '/criticize', label: 'Eleştir', icon: '🔍' },
      { index: 1, type: 'skill', value: '/refactor', label: 'Refactor', icon: '♻️' },
      { index: 2, type: 'skill', value: '/test-write', label: 'Test Yaz', icon: '🧪' },
      { index: 3, type: 'skill', value: 'Add type hints to all functions', label: 'Type Hints', icon: '🏷️' },
      { index: 4, type: 'skill', value: 'Add docstrings following Google style', label: 'Docstring', icon: '📝' },
      { index: 5, type: 'skill', value: '/optimize', label: 'Optimize', icon: '⚡' },
      { index: 6, type: 'skill', value: 'Make this async with asyncio', label: 'Async', icon: '🔄' },
      { index: 7, type: 'skill', value: '/security', label: 'Security', icon: '🔒' },
      { index: 8, type: 'skill', value: '/simplify', label: 'Basitleştir', icon: '✂️' },
    ],
  },
  {
    pattern: /\.(css|scss|sass|less)$/,
    pageName: 'Styles',
    buttons: [
      { index: 0, type: 'skill', value: 'Convert to CSS modules/Tailwind', label: 'Modernize', icon: '🎨' },
      { index: 1, type: 'skill', value: 'Add responsive breakpoints', label: 'Responsive', icon: '📱' },
      { index: 2, type: 'skill', value: 'Add dark mode support', label: 'Dark Mode', icon: '🌙' },
      { index: 3, type: 'skill', value: 'Reduce CSS specificity issues', label: 'Specificity', icon: '⬇️' },
      { index: 4, type: 'skill', value: 'Add CSS variables for theming', label: 'Variables', icon: '🎯' },
      { index: 5, type: 'skill', value: '/optimize', label: 'Optimize', icon: '⚡' },
      { index: 6, type: 'skill', value: '/explain', label: 'Açıkla', icon: '💡' },
      { index: 7, type: 'skill', value: 'Fix accessibility (contrast, focus styles)', label: 'A11y', icon: '♿' },
      { index: 8, type: 'skill', value: '/simplify', label: 'Basitleştir', icon: '✂️' },
    ],
  },
];

export class ContextWatcher {
  private currentFile: string | null = null;
  private onContextChange: ((page: PageConfig) => void) | null = null;

  onPageSuggestion(callback: (page: PageConfig) => void): void {
    this.onContextChange = callback;
  }

  /**
   * Called when the active file changes in the editor.
   */
  setActiveFile(filePath: string): void {
    if (filePath === this.currentFile) return;
    this.currentFile = filePath;

    const rule = CONTEXT_RULES.find((r) => r.pattern.test(filePath));
    if (rule) {
      this.onContextChange?.({
        name: rule.pageName,
        buttons: rule.buttons,
      });
    }
  }

  getCurrentFile(): string | null {
    return this.currentFile;
  }
}
