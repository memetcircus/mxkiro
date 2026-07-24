import { exec } from 'node:child_process';
import { platform } from 'node:os';

/**
 * Executes keyboard shortcuts via OS-level commands.
 * Uses AppleScript on macOS to send key events to the active application.
 */
export class ShortcutExecutor {
  /**
   * Send a keyboard shortcut to the active application.
   * Format: "cmd+shift+p", "f5", "ctrl+`"
   */
  async execute(shortcut: string): Promise<void> {
    if (platform() === 'darwin') {
      await this.executeMacOS(shortcut);
    } else {
      console.warn(`⚠️ Shortcut execution not yet implemented for ${platform()}`);
    }
  }

  private async executeMacOS(shortcut: string): Promise<void> {
    const parts = shortcut.toLowerCase().split('+');
    const key = parts.pop() || '';
    const modifiers = parts;

    // Build AppleScript keystroke
    const modifierMap: Record<string, string> = {
      'cmd': 'command down',
      'shift': 'shift down',
      'ctrl': 'control down',
      'alt': 'option down',
      'opt': 'option down',
    };

    const appleModifiers = modifiers
      .map((m) => modifierMap[m])
      .filter(Boolean)
      .join(', ');

    // Handle special keys
    const specialKeys: Record<string, string> = {
      'f5': 'key code 96',
      'f1': 'key code 122',
      'f2': 'key code 120',
      '`': 'key code 50',
      'escape': 'key code 53',
      'return': 'key code 36',
      'tab': 'key code 48',
      'space': 'key code 49',
    };

    let script: string;

    if (specialKeys[key]) {
      if (appleModifiers) {
        script = `tell application "System Events" to ${specialKeys[key]} using {${appleModifiers}}`;
      } else {
        script = `tell application "System Events" to ${specialKeys[key]}`;
      }
    } else {
      if (appleModifiers) {
        script = `tell application "System Events" to keystroke "${key}" using {${appleModifiers}}`;
      } else {
        script = `tell application "System Events" to keystroke "${key}"`;
      }
    }

    return new Promise((resolve, reject) => {
      exec(`osascript -e '${script}'`, (error) => {
        if (error) {
          console.error(`❌ Shortcut failed: ${shortcut}`, error.message);
          reject(error);
        } else {
          console.log(`⌨️ Shortcut sent: ${shortcut}`);
          resolve();
        }
      });
    });
  }
}
