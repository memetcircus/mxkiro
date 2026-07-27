import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { PageConfig, ButtonConfig } from '@mxkiro/shared';

export interface MxKiroConfig {
  bridge: {
    port: number;
    host: string;
  };
  pages: PageConfig[];
  dialpad: {
    dial: string;
    roller: string;
    topLeft1: string;
    topLeft2: string;
    bottomLeft: string;
    bottomRight: string;
  };
  sessionHealth: {
    warnAt: number;
    alertAt: number;
    criticalAt: number;
  };
}

const CONFIG_DIR = join(homedir(), '.kiro-mx');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: MxKiroConfig = {
  bridge: { port: 9847, host: 'localhost' },
  pages: [
    {
      name: 'Prompts',
      buttons: [
        { index: 0, type: 'skill', value: 'criticize this code', label: 'Eleştir', icon: '🔍' },
        { index: 1, type: 'skill', value: 'refactor this code', label: 'Refactor', icon: '♻️' },
        { index: 2, type: 'skill', value: 'write tests for this code', label: 'Test Yaz', icon: '🧪' },
        { index: 3, type: 'skill', value: 'explain this file', label: 'Açıkla', icon: '💡' },
        { index: 4, type: 'skill', value: 'find and fix the bug', label: 'Fix Bug', icon: '🐛' },
        { index: 5, type: 'skill', value: 'optimize this code', label: 'Optimize', icon: '⚡' },
        { index: 6, type: 'skill', value: 'review this code', label: 'Review', icon: '👀' },
        { index: 7, type: 'skill', value: 'document this code', label: 'Dokümante', icon: '📝' },
        { index: 8, type: 'skill', value: 'simplify this code', label: 'Basitleştir', icon: '✂️' },
      ],
    },
    {
      name: 'IDE',
      buttons: [
        { index: 0, type: 'shortcut', value: 'shift+cmd+l', label: 'Open Chat' },
        { index: 1, type: 'shortcut', value: 'cmd+i', label: 'Inline Chat' },
        { index: 2, type: 'shortcut', value: 'shift+cmd+p', label: 'Commands' },
        { index: 3, type: 'shortcut', value: 'cmd+p', label: 'Go to File' },
        { index: 4, type: 'shortcut', value: 'shift+cmd+f', label: 'Find' },
        { index: 5, type: 'shortcut', value: 'f5', label: 'Debug' },
        { index: 6, type: 'shortcut', value: 'cmd+,', label: 'Settings' },
        { index: 7, type: 'shortcut', value: 'ctrl+`', label: 'Terminal' },
        { index: 8, type: 'shortcut', value: 'ctrl+cmd+f', label: 'Full Screen' },
      ],
    },
    {
      name: 'Git',
      buttons: [
        { index: 0, type: 'command', value: 'git-commit', label: 'Commit', icon: '📦' },
        { index: 1, type: 'command', value: 'git-push', label: 'Push', icon: '⬆️' },
        { index: 2, type: 'command', value: 'git-pull', label: 'Pull', icon: '⬇️' },
        { index: 3, type: 'command', value: 'create-pr', label: 'Create PR', icon: '🔀' },
      ],
    },
  ],
  dialpad: {
    dial: 'session-navigate',
    roller: 'model-select',
    topLeft1: 'undo',
    topLeft2: 'redo',
    bottomLeft: 'autopilot-toggle',
    bottomRight: 'stop-cancel',
  },
  sessionHealth: {
    warnAt: 30000,
    alertAt: 50000,
    criticalAt: 70000,
  },
};

export class ConfigManager {
  private config: MxKiroConfig = DEFAULT_CONFIG;

  async load(): Promise<MxKiroConfig> {
    if (existsSync(CONFIG_PATH)) {
      try {
        const raw = await readFile(CONFIG_PATH, 'utf-8');
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      } catch {
        console.warn('⚠️ Failed to load config, using defaults');
        this.config = DEFAULT_CONFIG;
      }
    } else {
      // Create default config
      await this.save();
    }
    return this.config;
  }

  async save(): Promise<void> {
    const { mkdir } = await import('node:fs/promises');
    await mkdir(CONFIG_DIR, { recursive: true });
    await writeFile(CONFIG_PATH, JSON.stringify(this.config, null, 2));
  }

  getConfig(): MxKiroConfig {
    return this.config;
  }

  getButtonForPress(page: number, buttonIndex: number): ButtonConfig | null {
    const pageConfig = this.config.pages[page];
    if (!pageConfig) return null;
    return pageConfig.buttons.find((b) => b.index === buttonIndex) ?? null;
  }

  getPageCount(): number {
    return this.config.pages.length;
  }
}
