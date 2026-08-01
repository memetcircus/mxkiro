import { exec, spawn } from 'node:child_process';
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
   * Append text to Kiro chat input WITHOUT sending Enter.
   * Useful for snippet buttons that add suffix text to user's prompt.
   */
  async appendToChat(text: string): Promise<void> {
    if (platform() !== 'darwin') {
      console.warn(`⚠️ appendToChat not implemented for ${platform()}`);
      return;
    }

    const escaped = text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');

    // 1. Activate Kiro
    // 2. Focus chat input (Cmd+L)
    // 3. Move cursor to end (Cmd+End)
    // 4. Add a space + paste snippet text
    // 5. Do NOT press Enter — user will send manually
    const script = `
tell application "Kiro" to activate
delay 0.2
tell application "System Events"
  keystroke "l" using {command down}
  delay 0.3
  key code 119 using {command down}
  delay 0.1
  set the clipboard to " ${escaped}"
  keystroke "v" using {command down}
end tell
    `.trim();

    return new Promise((resolve, reject) => {
      exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, (error) => {
        if (error) {
          console.error(`❌ appendToChat failed:`, error.message);
          reject(error);
        } else {
          console.log(`📝 Snippet appended to Kiro chat`);
          resolve();
        }
      });
    });
  }

  /**
   * Read the current text from Kiro chat input.
   * Activates Kiro, selects all text in input, copies to clipboard, returns it.
   */
  async readChatInput(): Promise<string> {
    if (platform() !== 'darwin') {
      return '';
    }

    // Select all and copy
    const script = `
tell application "Kiro" to activate
delay 0.2
tell application "System Events"
  keystroke "l" using {command down}
  delay 0.2
  keystroke "a" using {command down}
  delay 0.1
  keystroke "c" using {command down}
  delay 0.2
end tell
    `.trim();

    await new Promise<void>((resolve, reject) => {
      exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    // Read clipboard directly from Node with explicit UTF-8
    return new Promise((resolve, reject) => {
      exec('pbpaste', { encoding: 'buffer' }, (error, stdout) => {
        if (error) reject(error);
        else resolve((stdout as unknown as Buffer).toString('utf8').trim());
      });
    });
  }

  /**
   * Replace the current Kiro chat input text with new text.
   * Does NOT press Enter — user reviews and sends manually.
   */
  async replaceChatInput(text: string): Promise<void> {
    if (platform() !== 'darwin') {
      return;
    }

    // Copy text to clipboard via Node.js spawn (proper UTF-8)
    await new Promise<void>((resolve, reject) => {
      const pbcopy = spawn('pbcopy', [], { stdio: ['pipe', 'ignore', 'ignore'] });
      pbcopy.stdin.write(text, 'utf8');
      pbcopy.stdin.end();
      pbcopy.on('close', () => resolve());
      pbcopy.on('error', reject);
    });

    // Select all in chat input and paste
    const script = `
tell application "Kiro" to activate
delay 0.2
tell application "System Events"
  keystroke "l" using {command down}
  delay 0.2
  keystroke "a" using {command down}
  delay 0.1
  keystroke "v" using {command down}
end tell
    `.trim();

    return new Promise((resolve, reject) => {
      exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, (error) => {
        if (error) {
          console.error(`❌ replaceChatInput failed:`, error.message);
          reject(error);
        } else {
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
   * Send vertical scroll to Kiro IDE chat panel.
   * Moves cursor to chat area, clicks to acquire focus, scrolls, then restores cursor.
   */
  async scrollKiro(ticks: number): Promise<void> {
    if (platform() !== 'darwin') {
      return;
    }

    const scrollLines = -ticks * 12;

    const script = `
ObjC.import('CoreGraphics');

// Save current mouse position
var currentEvent = $.CGEventCreate(null);
var currentPos = $.CGEventGetLocation(currentEvent);
var savedX = currentPos.x;
var savedY = currentPos.y;

// Get Kiro window bounds via System Events
var kiroApp = Application('System Events').processes.byName('Kiro');
var win = kiroApp.windows[0];
var pos = win.position();
var sz = win.size();
var winX = pos[0];
var winY = pos[1];
var winW = sz[0];
var winH = sz[1];

// Target: chat panel area (right 75%, height 40%)
var targetX = winX + winW * 0.75;
var targetY = winY + winH * 0.4;
var targetPoint = $.CGPointMake(targetX, targetY);

// Move mouse to chat area
var moveEvent = $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, targetPoint, 0);
$.CGEventPost($.kCGHIDEventTap, moveEvent);

delay(0.02);

// Click to acquire focus on chat panel
var mouseDown = $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseDown, targetPoint, 0);
var mouseUp = $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseUp, targetPoint, 0);
$.CGEventPost($.kCGHIDEventTap, mouseDown);
delay(0.01);
$.CGEventPost($.kCGHIDEventTap, mouseUp);

delay(0.02);

// Scroll
var scrollEvent = $.CGEventCreateScrollWheelEvent(null, 0, 1, ${scrollLines});
$.CGEventPost($.kCGHIDEventTap, scrollEvent);

// Restore mouse position
delay(0.02);
var restorePoint = $.CGPointMake(savedX, savedY);
var restoreEvent = $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, restorePoint, 0);
$.CGEventPost($.kCGHIDEventTap, restoreEvent);
    `.trim();

    return new Promise((resolve, reject) => {
      exec(`osascript -l JavaScript -e '${script.replace(/'/g, "'\\''")}'`, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Copy currently selected text from any app and send it to Kiro chat.
   * Like ChatGPT's "Ask ChatGPT" — select text anywhere, press button, Kiro answers.
   */
  async askKiro(): Promise<void> {
    if (platform() !== 'darwin') {
      console.warn(`⚠️ askKiro not implemented for ${platform()}`);
      return;
    }

    // 1. Clear clipboard first, then copy — if clipboard stays empty, nothing was selected
    await new Promise<void>((resolve) => {
      const pbcopy = spawn('pbcopy', [], { stdio: ['pipe', 'ignore', 'ignore'] });
      pbcopy.stdin.write('', 'utf8');
      pbcopy.stdin.end();
      pbcopy.on('close', () => resolve());
    });

    // 2. Copy selected text from whatever app is active (Cmd+C)
    const script = `
tell application "System Events"
  keystroke "c" using {command down}
end tell
delay 0.3
    `.trim();

    await new Promise<void>((resolve, reject) => {
      exec(`osascript -e '${script}'`, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    // 3. Read clipboard
    const text = await new Promise<string>((resolve, reject) => {
      exec('pbpaste', { encoding: 'buffer' }, (error, stdout) => {
        if (error) reject(error);
        else resolve((stdout as unknown as Buffer).toString('utf8').trim());
      });
    });

    if (!text) {
      console.warn('❓ Ask Kiro: no text selected');
      return;
    }

    // 4. Send to Kiro chat as-is
    await this.sendToKiroChat(text);
    console.log(`❓ Ask Kiro: sent "${text.substring(0, 50)}..."`);
  }

  /**
   * Record the screen for 5 seconds by taking periodic screenshots.
   * Takes 5 full-screen screenshots at 1-second intervals, resizes them to max 1280px width,
   * and converts to JPEG to stay well under Kiro's 10MB image size limit.
   * Pastes all frames into Kiro chat.
   */
  async screenRecordToChat(): Promise<void> {
    if (platform() !== 'darwin') {
      console.warn(`⚠️ screenRecordToChat not implemented for ${platform()}`);
      return;
    }

    const framesDir = '/tmp/kiro-screen-frames';
    // Show a dialog with mode selection
    // Quick: 5 frames, 2s interval (~8s total)
    // Long: 10 frames, 2s interval (~18s total)
    const modeResult = await new Promise<string>((resolve, reject) => {
      exec(`osascript -e 'display dialog "Screen Recording" & return & return & "Quick: 5 frames (~2s)" & return & "Long: 10 frames (~7s)" buttons {"Cancel", "Long", "Quick"} default button "Quick" with title "Kiro Screen Record" with icon caution'`, { timeout: 30000 }, (error, stdout) => {
        if (error) {
          reject(new Error('cancelled'));
        } else {
          resolve(stdout.trim());
        }
      });
    });

    const isLong = modeResult.includes('Long');
    const frameCount = isLong ? 10 : 5;
    const intervalMs = isLong ? 800 : 500;
    const maxWidth = 1280;

    const { existsSync, mkdirSync, readdirSync, rmSync } = await import('node:fs');

    if (existsSync(framesDir)) {
      rmSync(framesDir, { recursive: true });
    }
    mkdirSync(framesDir, { recursive: true });

    console.log(`🎬 User selected ${isLong ? 'Long' : 'Quick'} mode (${frameCount} frames, ${intervalMs}ms interval)...`);

    // Notify recording start
    exec(`osascript -e 'display notification "Recording ${frameCount} frames..." with title "🎬 Started"'`);

    // Phase 1: Capture all frames as fast as possible (PNG only)
    for (let i = 1; i <= frameCount; i++) {
      if (i > 1) {
        await new Promise(r => setTimeout(r, intervalMs));
      }

      const framePng = `${framesDir}/frame-${String(i).padStart(2, '0')}.png`;

      // Capture full screen silently
      await new Promise<void>((resolve) => {
        exec(`/usr/sbin/screencapture -x "${framePng}"`, { env: { ...process.env, PATH: '/usr/sbin:/usr/bin:/bin:/usr/local/bin:' + (process.env.PATH || '') } }, () => resolve());
      });
    }

    console.log(`🎬 All ${frameCount} frames captured, resizing...`);

    // Phase 2: Resize and convert to JPEG (no time pressure)
    for (let i = 1; i <= frameCount; i++) {
      const framePng = `${framesDir}/frame-${String(i).padStart(2, '0')}.png`;
      const frameJpg = `${framesDir}/frame-${String(i).padStart(2, '0')}.jpg`;

      await new Promise<void>((resolve) => {
        exec(`sips --resampleWidth ${maxWidth} --setProperty format jpeg --setProperty formatOptions 70 "${framePng}" --out "${frameJpg}"`, () => resolve());
      });

      // Remove the large PNG
      try { rmSync(framePng); } catch {}
    }

    // Get frame files
    const frames = readdirSync(framesDir)
      .filter(f => f.endsWith('.jpg'))
      .sort()
      .map(f => `${framesDir}/${f}`);

    console.log(`🎬 Captured ${frames.length} frames, sending to Kiro...`);

    // Show completion notification
    exec(`osascript -e 'display notification "Sending ${frames.length} frames to Kiro..." with title "🎬 Recording Complete"'`);

    // Paste frames one by one into Kiro chat
    // Extra activation and delay to ensure Kiro is truly focused
    const pasteScript = `
ObjC.import('AppKit');

var kiro = Application('Kiro');
kiro.activate();
delay(0.5);
kiro.activate();
delay(0.3);
var se = Application('System Events');
se.keystroke('l', {using: 'command down'});
delay(0.5);

var files = [${frames.map(f => `"${f}"`).join(', ')}];
var pasteboard = $.NSPasteboard.generalPasteboard;

for (var i = 0; i < files.length; i++) {
  pasteboard.clearContents;
  var fileURL = $.NSURL.fileURLWithPath(files[i]);
  pasteboard.writeObjects($.NSArray.arrayWithObject(fileURL));
  delay(0.3);
  se.keystroke('v', {using: 'command down'});
  delay(0.5);
}

'done';
    `.trim();

    await new Promise<void>((resolve, reject) => {
      exec(`osascript -l JavaScript -e '${pasteScript.replace(/'/g, "'\\''")}'`, { timeout: 20000 }, (error) => {
        if (error) {
          console.error('❌ screenRecordToChat paste failed:', error.message);
          reject(error);
        } else {
          resolve();
        }
      });
    });

    // Cleanup after 30 seconds
    setTimeout(() => {
      try { rmSync(framesDir, { recursive: true }); } catch {}
    }, 30000);

    console.log('🎬 Screen recording frames sent to Kiro chat');
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

  // Wait for Kiro to read the file, then delete it
  delay(2);
  fm.removeItemAtPathError(newFile, null);
  
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
