# MX Kiro — Physical AI Coding Companion

A physical AI coding companion that connects **Logitech MX Creative Console** to **Kiro IDE**. Press LCD buttons to send prompts, navigate sessions with the dial, see Kiro's status via ghost animations, and capture screenshots directly into chat.

![Architecture](https://img.shields.io/badge/Architecture-C%23_%2B_Node.js_%2B_AppleScript-purple)
![Platform](https://img.shields.io/badge/Platform-macOS-blue)
![Status](https://img.shields.io/badge/Status-Working_on_Hardware-green)

## What It Does

| Feature | Description |
|---------|-------------|
| 🎨 **Ghost Animation** | 9-tile animated Kiro ghost walks across LCD while Kiro is working |
| 🔥 **Context Health** | Ghost changes appearance based on real context window usage (normal → thinking → worried → fire) |
| 📸 **Screenshot → Chat** | One button: crosshair → select area → auto-paste into Kiro chat |
| ⏹️ **Stop/Cancel** | Physical button to cancel Kiro's active generation |
| 🔄 **Session Navigate** | Dial rotation to switch between Kiro chat sessions |
| 🆕 **New Session** | Button to open a fresh Kiro chat tab |
| ✏️ **Inline Chat** | Button to open inline AI editing at cursor position |
| ⌨️ **Terminal → Chat** | Button to send terminal errors to Kiro for analysis |
| 📝 **Prompt Buttons** | 9 quick prompts that work on the active file: Explain, Criticize, Document, Fix Bug, Optimize, Refactor, Review, Simplify, Write Tests. Press any button and Kiro analyzes the currently open file. |
| 📐 **Struct Prompt** | Rewrites your messy prompt into a clear, structured one |

## Architecture

```
MX Creative Console → C# Plugin (Logi SDK) → HTTP → Bridge Service (Node.js) → Kiro IDE (AppleScript)
```

- **C# Plugin** — Runs inside Logi Plugin Service, renders LCD animations, sends HTTP requests
- **Bridge Service** — Node.js orchestrator on `localhost:9848`, routes commands to Kiro IDE
- **Kiro Hooks** — IDE events (`promptSubmit`, `agentStop`) notify Bridge of state changes
- **AppleScript** — Keyboard simulation for Kiro IDE interaction (Cmd+L, Ctrl+C, Cmd+Shift+4, etc.)

## Requirements

- macOS (AppleScript-based, macOS only)
- [Kiro IDE](https://kiro.dev) installed
- [Logitech MX Creative Console](https://www.logitech.com/products/keyboards/mx-creative-console.html)
- [Logi Options+](https://www.logitech.com/software/logi-options-plus.html) installed
- [.NET 10 SDK](https://dotnet.microsoft.com/download) (`/usr/local/share/dotnet/dotnet`)
- [Node.js](https://nodejs.org) (v20+)
- [kiro-cli](https://kiro.dev/cli/) installed and authenticated
- macOS Accessibility permission for Terminal

## Quick Start

```bash
# 1. Clone
git clone https://github.com/memetcircus/mxkiro.git
cd mxkiro

# 2. Install dependencies
npm install

# 3. Build C# plugin
cd KiroMxConsolePlugin && /usr/local/share/dotnet/dotnet build src/KiroMxConsolePlugin.csproj

# 4. Generate sprite animations
npx tsx scripts/generate-sprites.ts

# 5. Install Bridge as auto-start service
./scripts/install-bridge-service.sh

# 6. Restart Logi Plugin Service to load the plugin
pkill -f LogiPluginService; sleep 4; open -a logioptionsplus
```

After setup, assign actions in Logi Options+ under **KiroMxConsole Actions**.

## LCD Button Layout (Recommended)

**Page 1 — Prompt Commands (9 buttons):**

Each button sends a concise prompt to Kiro about the currently active file in the editor. Kiro automatically uses the open file as context — no need to specify which file.

| | Col 1 | Col 2 | Col 3 |
|---|-------|-------|-------|
| Row 1 | Criticize | Document | Explain |
| Row 2 | Fix Bug | Optimize | Refactor |
| Row 3 | Review | Simplify | Write Tests |

All 9 buttons display the ghost walk animation while Kiro is working.

**Page 2 — Controls & Snippets:**
- Screen Capture (screenshot → chat)
- Screen Record (5 frames → chat)
- Ask Kiro (selected text → chat)
- New Session
- Stop Kiro
- Inline Chat
- Terminal → Chat
- Struct Prompt
- Snippet modifiers (Be Honest, Don't Code Yet, Keep Short, No Tests, etc.)

**Dial:** Session Navigate (18 notch threshold)
**Roller:** Assign Logi native action (Volume, Zoom, etc.)

## Context Health Indicator

The ghost animation changes based on real Kiro context window usage:

| Usage | Ghost | Meaning |
|-------|-------|---------|
| 0-50% | Normal 👻 | Plenty of context remaining |
| 50-75% | Thinking 🤔 | Getting used up |
| 75-90% | Worried 😰 | Running low |
| 90%+ | On Fire 🔥 | Consider starting a new session |

## Development

```bash
# Build C# plugin (auto-reloads in Logi Options+)
cd KiroMxConsolePlugin && /usr/local/share/dotnet/dotnet build src/KiroMxConsolePlugin.csproj

# Start Bridge manually (instead of LaunchAgent)
cd packages/bridge && npx tsx src/index.ts

# Regenerate sprites after changing ghost icons
npx tsx scripts/generate-sprites.ts

# Plugin restart
pkill -f LogiPluginService; sleep 4; open -a logioptionsplus

# Bridge restart (LaunchAgent)
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.mxkiro.bridge.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.mxkiro.bridge.plist

# Check Bridge health
curl -s http://localhost:9848/health | python3 -m json.tool

# Bridge logs
tail -f /tmp/mxkiro-bridge.log
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "node" in macOS Privacy settings | This is the MX Kiro Bridge service. It needs Accessibility and Screen Recording permissions to send keystrokes and capture screenshots. |
| Bridge not responding | Check: `curl -s http://localhost:9848/health`. If offline: `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.mxkiro.bridge.plist` |
| Plugin not loading | Restart Logi: `pkill -f LogiPluginService; sleep 4; open -a logioptionsplus` |
| Non-ASCII characters garbled | Known Kiro/Electron clipboard bug when copying FROM Kiro chat. Non-English characters (ö, ü, ñ, é, etc.) get corrupted. Works fine when copying from other apps (browser, Notes, VS Code). |

## Known Limitations

- **macOS only** — relies on AppleScript and CGEvent for IDE interaction
- **Clipboard trade-off** — prompts and screenshots use clipboard for paste
- **Non-ASCII clipboard** — clipboard copy from Kiro chat corrupts non-English characters (Kiro/Electron bug)
- **Multi-session animation** — when multiple sessions are active, animation reflects any working session
- **Nested scroll areas** — CGEvent scroll targets element under cursor, can't reliably target chat panel only

## Project Structure

```
mxkiro/
├── KiroMxConsolePlugin/     # C# Logi Plugin (LCD animations, buttons, dial)
│   └── src/
│       ├── Actions/         # Button commands, dial adjustments
│       ├── Animation/       # Ghost walk animation manager
│       ├── Bridge/          # HTTP client to Bridge
│       └── Helpers/         # Logging utilities
├── packages/
│   ├── bridge/              # Node.js Bridge service
│   │   └── src/
│   │       ├── index.ts          # Main orchestrator
│   │       ├── http-server.ts    # HTTP endpoints
│   │       ├── shortcut-executor.ts  # AppleScript automation
│   │       ├── acp-client.ts     # Kiro CLI ACP connection
│   │       └── session-monitor.ts    # Session file reader
│   └── shared/              # Shared types and constants
├── assets/                  # Ghost icons and sprite sheets
├── scripts/                 # Sprite generator, install scripts
└── .kiro/                   # Hooks and steering files
```

## License

MIT
