import { exec } from 'node:child_process';
import { platform } from 'node:os';

/**
 * Executes keyboard shortcuts and sends prompts to Kiro IDE.
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

  /**
   * Send a prompt to Kiro IDE chat.
   * Activates Kiro, opens chat panel, types the prompt, and sends it.
   */
  async sendToKiroChat(prompt: string): Promise<void> {
    if (platform() !== 'darwin') {
      console.warn(`⚠️ sendToKiroChat not implemented for ${platform()}`);
      return;
    }

    // Escape special characters for AppleScript
    const escaped = prompt
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');

    // 1. Activate Kiro
    // 2. Focus existing chat input (Cmd+L) — does NOT open new session
    // 3. Small delay for UI to settle
    // 4. Set clipboard to prompt text and paste (more reliable than keystroke for long text)
    // 5. Press Enter to send
    const script = `
tell application "Kiro" to activate
delay 0.3
tell application "System Events"
  keystroke "l" using {command down}
  delay 0.5
  set the clipboard to "${escaped}"
  keystroke "v" using {command down}
  delay 0.2
  keystroke return
end tell
    `.trim();

    return new Promise((resolve, reject) => {
      exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, (error) => {
        if (error) {
          console.error(`❌ sendToKiroChat failed:`, error.message);
          reject(error);
        } else {
          console.log(`🎯 Prompt sent to Kiro IDE chat`);
          resolve();
        }
      });
    });
  }

  /**
   * Cancel the active Kiro chat request using Kiro's chat cancel shortcut.
   * Kiro must have chat focus for Ctrl+C to resolve to workbench.action.chat.cancel.
   */
  async cancelKiroGeneration(): Promise<void> {
    if (platform() !== 'darwin') {
      console.warn(`⚠️ cancelKiroGeneration not implemented for ${platform()}`);
      return;
    }

    const script = `
tell application "Kiro" to activate
delay 0.2
tell application "System Events"
  keystroke "l" using {command down}
  delay 0.2
  keystroke "c" using {control down}
end tell
    `.trim();

    return new Promise((resolve, reject) => {
      exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, (error) => {
        if (error) {
          console.error(`❌ cancelKiroGeneration failed:`, error.message);
          reject(error);
        } else {
          console.log(`🛑 Cancel shortcut sent to Kiro IDE`);
          resolve();
        }
      });
    });
  }

  /**
   * Navigate between Kiro session tabs.
   * Activates Kiro, focuses chat, then sends Cmd+Alt+Right or Cmd+Alt+Left.
   * Optimized for rapid sequential calls (dial rotation).
   */
  async navigateKiroSession(direction: 'left' | 'right'): Promise<void> {
    if (platform() !== 'darwin') {
      console.warn(`⚠️ navigateKiroSession not implemented for ${platform()}`);
      return;
    }

    // key code 123 = Left arrow, 124 = Right arrow
    const keyCode = direction === 'right' ? 124 : 123;

    // Minimal delay — Kiro should already be active from prior interaction
    const script = `
tell application "Kiro" to activate
tell application "System Events"
  key code ${keyCode} using {command down, option down}
end tell
    `.trim();

    return new Promise((resolve, reject) => {
      exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, (error) => {
        if (error) {
          console.error(`❌ navigateKiroSession failed:`, error.message);
          reject(error);
        } else {
          console.log(`🔄 Session tab: ${direction}`);
          resolve();
        }
      });
    });
  }

  /**
   * Take an interactive screenshot and attach it to the active Kiro chat input.
   * Uses Cmd+Shift+4 (native macOS crosshair) → waits for file → copies to clipboard → pastes into Kiro.
   */
  async screenshotToChat(): Promise<void> {
    if (platform() !== 'darwin') {
      console.warn(`⚠️ screenshotToChat not implemented for ${platform()}`);
      return;
    }

    // Full flow in one JXA script:
    // 1. Find existing screenshots on Desktop to compare later
    // 2. Simulate Cmd+Shift+4 (native crosshair, no toolbar)
    // 3. Wait for new screenshot file to appear
    // 4. Copy it to clipboard as file URL
    // 5. Activate Kiro, focus chat, paste
    const script = `
ObjC.import('AppKit');
ObjC.import('Foundation');

// Get Desktop path
var fm = $.NSFileManager.defaultManager;
var desktopPath = ObjC.unwrap($.NSHomeDirectory()) + '/Desktop';

// Get screenshot save location from defaults
var pipe = $.NSPipe.pipe;
var task = $.NSTask.alloc.init;
task.launchPath = '/usr/bin/defaults';
task.arguments = $(['read', 'com.apple.screencapture', 'location']);
task.standardOutput = pipe;
try {
  task.launch;
  task.waitUntilExit;
  var data = pipe.fileHandleForReading.readDataToEndOfFile;
  var output = ObjC.unwrap($.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding)).trim();
  if (output && output.length > 0) desktopPath = output;
} catch(e) {}

// List existing files before screenshot
var beforeFiles = ObjC.unwrap(fm.contentsOfDirectoryAtPathError(desktopPath, null)) || [];
var beforeSet = {};
for (var i = 0; i < beforeFiles.length; i++) {
  beforeSet[ObjC.unwrap(beforeFiles[i])] = true;
}

// Simulate Cmd+Shift+4 for native crosshair
ObjC.import('CoreGraphics');
// key code 21 = '4'
var keyDown = $.CGEventCreateKeyboardEvent(null, 21, true);
var keyUp = $.CGEventCreateKeyboardEvent(null, 21, false);
var flags = $.kCGEventFlagMaskCommand | $.kCGEventFlagMaskShift;
$.CGEventSetFlags(keyDown, flags);
$.CGEventSetFlags(keyUp, flags);
$.CGEventPost($.kCGHIDEventTap, keyDown);
$.CGEventPost($.kCGHIDEventTap, keyUp);

// Wait for new screenshot file (up to 30 seconds)
var newFile = null;
for (var attempt = 0; attempt < 300; attempt++) {
  delay(0.1);
  var afterFiles = ObjC.unwrap(fm.contentsOfDirectoryAtPathError(desktopPath, null)) || [];
  for (var j = 0; j < afterFiles.length; j++) {
    var fname = ObjC.unwrap(afterFiles[j]);
    if (!beforeSet[fname] && fname.indexOf('Screen') !== -1 && fname.indexOf('.png') !== -1) {
      newFile = desktopPath + '/' + fname;
      break;
    }
  }
  if (newFile) break;
}

if (!newFile) {
  // User cancelled
  'cancelled';
} else {
  // Copy file to clipboard
  var fileURL = $.NSURL.fileURLWithPath(newFile);
  var pasteboard = $.NSPasteboard.generalPasteboard;
  pasteboard.clearContents;
  pasteboard.writeObjects($.NSArray.arrayWithObject(fileURL));

  // Activate Kiro and paste
  var kiro = Application('Kiro');
  kiro.activate();
  delay(0.3);
  var se = Application('System Events');
  se.keystroke('l', {using: 'command down'});
  delay(0.3);
  se.keystroke('v', {using: 'command down'});
  
  'done';
}
    `.trim();

    return new Promise((resolve, reject) => {
      exec(`osascript -l JavaScript -e '${script.replace(/'/g, "'\\''")}'`, { timeout: 35000 }, (error, stdout) => {
        if (error) {
          console.error(`❌ screenshotToChat failed:`, error.message);
          reject(error);
        } else if (stdout.trim() === 'cancelled') {
          console.log('📸 Screenshot cancelled by user');
          reject(new Error('cancelled'));
        } else {
          console.log(`📸 Screenshot pasted into Kiro chat`);
          resolve();
        }
      });
    });
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
