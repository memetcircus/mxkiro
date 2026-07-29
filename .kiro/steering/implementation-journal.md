---
inclusion: always
---

# Implementation Journal

## What Works (Verified on Real Hardware)

### 1. Button Press → Kiro IDE Chat (✅ Complete)
**Flow:** MX Console button → C# Plugin HTTP → Bridge → AppleScript → Kiro IDE chat input

- C# plugin sends `GET /prompt?text=...` to Bridge on `localhost:9848`
- Bridge receives prompt, activates Kiro app, focuses chat input (`Cmd+L`), pastes text, sends Enter
- Prompt appears in the **active** Kiro chat session (not a new one)

**Key insight:** `Cmd+L` = focus existing chat input without new session. `Shift+Cmd+L` = new session (wrong).
Found this by inspecting `/Applications/Kiro.app/.../kiro.kiro-agent/package.json` keybindings.

### 2. Ghost Walk Animation on LCD (✅ Complete)
**Flow:** Bridge state=working → Plugin polls `/health` → GhostAnimationManager starts → LCD shows ghost frames

- 30 frames, split into 3x3 tiles (270 PNGs total), 120x120 each
- Ghost walks left→right (normal), then right→left (mirrored)
- Uses the real Kiro ghost icon (`assets/ghost-icon.png`, 1200x1200)
- Background color sampled from PNG (`#9046ff`) to avoid visible seams
- Timer at 100ms intervals (~10fps)
- Plugin polls bridge `/health` endpoint every 500ms for state

### 3. State Management (✅ Complete)
- Bridge tracks `currentState` (idle/working)
- `agentStop` Kiro hook sends `curl http://localhost:9848/state/idle`
- Plugin stops animation immediately when state returns to idle
- 2-minute fallback timeout if hook never fires

### 4. Short Prompts (✅ Complete)
- Buttons send concise prompts: `explain this file`, `criticize this code`, etc.
- Bridge has a `shortenPrompt()` mapping for backward compatibility with old C# plugin builds
- Kiro uses the active editor file as context automatically

### 5. Animation Triggers From Any Prompt (✅ Complete)
- `promptSubmit` hook → `state/working` → animation starts
- `agentStop` hook → `state/idle` → animation stops
- Works whether prompt comes from MX Console button OR keyboard typing
- MX Console is now a true status display, not just a trigger

### 6. Session Health Indicator (✅ Complete)
- Bridge counts messages (each `working` state = +1)
- Health levels: normal (0-15), thinking (15-25), worried (25-35), critical (35+)
- `/health` endpoint reports `messageCount` + `healthLevel`
- `/session/reset` clears counter for new session
- **Visual:** Critical health → ghost with flaming hair (`ghost_icon_onfire.png`)
- **Speed:** Subtle increase per level (100ms → 70ms). Speed alone is a weak signal;
  the fire icon is the primary indicator. Message-count is a proxy for context window fill
  (Kiro IDE doesn't expose real token count externally).

### 7. Stop/Cancel Physical Button (✅ Complete)
**Flow:** MX Console Stop button → `GET /cancel` → Bridge sets idle + suppresses stale hooks → AppleScript `Ctrl+C` to Kiro

- Kiro's actual cancel keybinding is `Ctrl+C` (when `chatSessionRequestInProgress && inChat`)
- Bridge activates Kiro, focuses chat (`Cmd+L`), sends `Ctrl+C`
- 2-second suppression window: late `promptSubmit` hooks arriving after cancel are ignored
- Prevents animation restart from stale working hooks
- `idleTimer` cleared on cancel
- WebSocket broadcast ensures plugin gets idle state immediately

### 8. Dial Session Navigation (✅ Complete)
**Flow:** MX Console dial rotation → C# accumulates notches → threshold reached → `GET /session/navigate?ticks=1` → Bridge sends `Cmd+Alt+Right/Left` to Kiro

- Kiro IDE keybindings: `Cmd+Alt+Right` (next session tab), `Cmd+Alt+Left` (previous)
- Threshold: 18 notches in same direction within 4 seconds to fire
- Direction change resets accumulator
- Dial press resets accumulator
- Display shows progress `(N/18)` during accumulation, "Sessions" when idle
- Threshold logic lives in C# plugin (not Bridge) for reliable timing

### 9. Screenshot → Kiro Chat (✅ Complete)
**Flow:** MX Console button → `GET /screenshot` → CGEvent `Cmd+Shift+4` → native crosshair → user selects area → file detected → NSPasteboard file URL → Kiro activate → `Cmd+L` → `Cmd+V`

- Uses macOS native `Cmd+Shift+4` crosshair (no toolbar, instant selection)
- Detects new screenshot file on Desktop (or custom screencapture location)
- Copies file as NSURL to NSPasteboard (not image data — Kiro needs file reference)
- Activates Kiro, focuses existing chat input, pastes attachment
- User types their prompt text and sends — screenshot is already embedded
- 30-second timeout for user to complete selection
- Cancelled selection (Escape) handled gracefully

### 10. Scroll (❌ Removed → Native Solution)
- Custom scroll via CGEvent worked but had nested scroll area issues
- Logi Options+ has native "Mouse Scroll" action that handles inertia, nested areas, everything
- Decision: remove custom scroll code, user assigns native Mouse Scroll to roller

## What Failed / Lessons Learned

### ACP Client Approach (❌ Abandoned)
**Tried:** `kiro-cli acp` to send prompts directly to Kiro agent.
**Result:** Works — but sends to a **headless CLI agent**, not the IDE chat.
**Why:** `kiro-cli acp` is a separate runtime. There's no API to inject prompts into a running IDE session.
**Lesson:** Kiro IDE and kiro-cli are isolated worlds. No bridge between them exists yet.

### AppleScript Keyboard Simulation (✅ Works but hacky)
**Tried:** `osascript` to send keystrokes to Kiro IDE.
**Issues encountered:**
1. Accessibility permission needed for Terminal.app (not just the process)
2. `Shift+Cmd+L` opens new session instead of focusing existing chat
3. Clipboard gets overwritten (paste-based approach)
4. Focus stealing when user is doing something else

**Mitigation:** Use `Cmd+L` (focus existing input), accept clipboard trade-off.

### BitmapImage Constructor (❌ → Fixed)
**Tried:** `new BitmapImage(stream)` — doesn't exist in Logi SDK.
**Fix:** `BitmapImage.FromArray(byte[])` is the correct factory method.

### .NET Version Mismatch
- Logi Plugin Service requires .NET 10 (PluginApi.dll references System.Runtime v10)
- Build machine had only .NET 8 — needed `/usr/local/share/dotnet/dotnet` (v10.0.201)
- Cannot downgrade target framework; must use .NET 10 SDK

### Sprite Path Resolution (❌ → Fixed)
**Issue:** `Assembly.Location` returns null inside Logi Plugin Service context.
**Fix:** Use `Environment.SpecialFolder.UserProfile` + hardcoded relative path as fallback.

### Device Family (❌ → Fixed)
**Issue:** Plugin used `LoupedeckCtFamily` — wrong device.
**Fix:** MX Creative Console = `LogitechCreativeFamily` (found via `strings PluginApi.dll`).

### Ghost Animation Residue (❌ → Fixed)
**Issue:** When animation stops, last frame stays on LCD.
**Fix:** `ActionImageChanged()` must be called after `IsRunning = false`, and `GetCommandImage` returns null → Logi renders text label instead.

### Escape for Cancel (❌ → Fixed)
**Tried:** `Escape` key to cancel Kiro generation.
**Result:** Escape only dismisses focus/UI, doesn't cancel active chat request.
**Fix:** Kiro's real cancel is `Ctrl+C` when `chatSessionRequestInProgress && inChat`.
Must activate Kiro → focus chat (`Cmd+L`) → send `Ctrl+C`.

### Late Hook Race Condition (❌ → Fixed)
**Issue:** After physical cancel, a delayed `promptSubmit` hook sends `state/working` and restarts animation.
**Fix:** 2-second suppression window (`suppressWorkingUntil`) after cancel. Bridge ignores stale working hooks during this window.

### Bridge-side Dial Threshold (❌ → Moved to C#)
**Tried:** Accumulating dial ticks in Bridge with timer-based threshold.
**Result:** HTTP requests arrive with 1-3s gaps between individual ticks. Timer resets before threshold is reached.
**Fix:** Move threshold logic into C# plugin where Logi SDK delivers ticks instantly without network delay.

### screencapture -i Toolbar (❌ → Workaround)
**Tried:** `screencapture -i` for interactive screenshot.
**Result:** New macOS versions show a toolbar UI instead of direct crosshair.
**Fix:** Simulate `Cmd+Shift+4` via CGEvent (same as keyboard shortcut) → native crosshair, no toolbar.

### Clipboard Image Paste to Kiro (❌ → Workaround)
**Tried:** `screencapture -ic` (to clipboard) + `Cmd+V` in Kiro chat.
**Result:** Kiro chat input doesn't accept raw image data from clipboard.
**Fix:** Save screenshot to file, copy file URL via NSPasteboard, paste file reference into Kiro.

### Custom Scroll via CGEvent (❌ → Abandoned)
**Tried:** CGEvent scroll wheel events sent to Kiro.
**Result:** Works but targets nested scroll areas (code blocks, terminal outputs) when mouse is over them.
**Fix:** Abandoned custom scroll. Logi's native "Mouse Scroll" action handles this correctly at OS level.

## Architecture Decisions

| Decision | Why |
|----------|-----|
| AppleScript over ACP | ACP = headless agent, can't inject into IDE session |
| Polling over WebSocket | Plugin lives in Logi process, can't initiate WS from there easily |
| 500ms poll interval | Balance between responsiveness and CPU usage |
| Sprite on disk (not embedded) | Faster iteration, no rebuild needed for art changes |
| Hook-based state sync | agentStop hook is the most reliable signal Kiro provides |
| Short prompts | Less noise in chat, Kiro infers context from active file |
| Ctrl+C for cancel | Kiro's actual `workbench.action.chat.cancel` keybinding |
| 2s cancel suppression | Prevents stale promptSubmit hooks from restarting animation |
| Dial threshold in C# | Plugin receives instant ticks; Bridge HTTP has latency/timing issues |
| 18 notch threshold | ~half turn for deliberate session switch, prevents accidental triggers |
| Native Mouse Scroll | Logi's built-in action handles inertia + nested scroll areas perfectly |
| Cmd+Shift+4 for screenshot | Native crosshair without toolbar; screencapture -i shows toolbar in new macOS |
| NSPasteboard file URL | Kiro doesn't accept raw image paste; needs file reference on clipboard |

## File Locations

| File | Purpose |
|------|---------|
| `packages/bridge/src/index.ts` | Main orchestrator — wires HTTP, WS, ACP, shortcuts |
| `packages/bridge/src/shortcut-executor.ts` | AppleScript keystroke sender + `sendToKiroChat()` + `cancelKiroGeneration()` + `navigateKiroSession()` + `screenshotToChat()` |
| `packages/bridge/src/http-server.ts` | HTTP endpoints with state tracking |
| `KiroMxConsolePlugin/src/Animation/GhostAnimationManager.cs` | Singleton animation controller |
| `KiroMxConsolePlugin/src/Actions/Prompts/AnimatedPromptCommand.cs` | Base class for LCD-animated buttons |
| `KiroMxConsolePlugin/src/Actions/KiroSessionDial.cs` | Dial with 18-notch threshold for session nav |
| `KiroMxConsolePlugin/src/Actions/KiroStopCommand.cs` | Stop button → `/cancel` with error handling |
| `KiroMxConsolePlugin/src/Actions/NewSessionCommand.cs` | New Session → `/session/new` |
| `KiroMxConsolePlugin/src/Actions/ScreenshotToChat.cs` | Screenshot button → `/screenshot` |
| `scripts/generate-sprites.ts` | Generates ghost walk tiles from ghost-icon.png |
| `.kiro/hooks/notify-bridge-idle.kiro.hook` | agentStop → bridge idle notification |
| `.kiro/hooks/notify-bridge-working.kiro.hook` | promptSubmit → bridge working notification |

## Next Priority Tasks

1. **Page 1 redesign + snippet buttons** — New layout with 3 utility + 6 snippet append buttons:
   ```
   Tile 0: Screen Capture    Tile 1: Be Honest      Tile 2: Just Do It
   Tile 3: Show Options      Tile 4: Explain Why    Tile 5: Stop
   Tile 6: Keep Short        Tile 7: No Tests       Tile 8: New Session
   ```
   - Utility buttons (Screen Capture, New Session, Stop): immediate action
   - Snippet buttons (Be Honest, Just Do It, etc.): paste text to chat WITHOUT sending Enter
   - All 9 buttons show ghost animation when working
   - Snippet texts configurable from `~/.kiro-mx/config.json`
   - Default snippets:
     - Be Honest: "Be honest, criticize. Suggest better alternatives."
     - Just Do It: "Don't ask questions, just implement it."
     - Keep Short: "Be concise, short answer."
     - Explain Why: "Explain your reasoning."
     - No Tests: "Don't add tests unless I ask."
     - Show Options: "Give me 2-3 options to choose from."
2. **Model selector roller** — Roller to switch between Claude models
3. **Bridge auto-start** — Launch bridge automatically when Logi Plugin Service starts
