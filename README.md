# 👻 Kiro × MX Creative Console

Physical AI coding companion — turn your Logitech MX Creative Console into a Kiro command center.

![Kiro Ghost](assets/sprites/ghost-faces/normal.png)

## ✨ Features

- **🎛️ Prompt Shortcuts** — 9 LCD buttons with customizable prompts/skills
- **👻 Ghost Animation** — Kiro's ghost mascot walks across LCD when working
- **🔥 Session Health** — Fire animation warns when session is too long
- **✅ Dynamic Responses** — Trust/Cancel/Keep Iterating buttons appear automatically
- **🔄 Session Navigation** — Dial through 30+ sessions smoothly
- **🤖 Model Selection** — Roller to switch between Opus/Sonnet/Haiku
- **⌨️ IDE Shortcuts** — Open Chat, Command Palette, Debug from hardware
- **📦 Git Actions** — Commit, Push, Pull, Create PR with one press
- **💡 Context-Aware** — Button set changes based on file type (.tsx → React prompts)
- **💓 LCD Pulse** — Buttons breathe when Kiro needs your attention

## 🏗️ Architecture

```
MX Creative Console ←→ Logi Plugin ←→ Bridge Service ←→ Kiro (ACP/MCP/Hooks)
```

| Component | Role |
|-----------|------|
| **Logi Plugin** | Talks to MX hardware via Logi Actions SDK |
| **Bridge Service** | WebSocket + HTTP bridge between plugin and Kiro |
| **MCP Server** | Lets Kiro agent write to LCD directly |
| **Hooks** | Captures IDE events (prompt submit, turn end, etc.) |
| **Power** | Packages everything for one-click Kiro install |

## 📋 Requirements

- macOS or Windows
- Logitech MX Creative Console
- Logi Options+ installed
- Kiro IDE or CLI
- Node.js 20+

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/memetcircus/mxkiro.git
cd mxkiro

# Install dependencies
npm install

# Run setup (installs steering, skills, config)
npm run setup

# Start bridge service
npm run dev:bridge

# In another terminal, start the Logi plugin (watch mode)
npm run dev:plugin
```

## 📁 Project Structure

```
mxkiro/
├── packages/
│   ├── shared/           # Types, constants, message definitions
│   ├── bridge/           # Bridge service (WS + HTTP + ACP + MCP)
│   ├── logi-plugin/      # Logi Actions SDK plugin
│   └── kiro-power/       # Kiro Power (hooks, steering, skills)
├── assets/
│   └── sprites/          # Generated PNG sprites (520 files)
├── scripts/
│   ├── generate-sprites.ts   # Regenerate all sprite assets
│   └── setup.ts              # One-time setup script
└── .kiro/
    └── specs/            # Project requirements, design, tasks
```

## 🎮 Hardware Mapping

### Dialpad (Left Device)

| Control | Function |
|---------|----------|
| Dial rotate | Navigate between sessions |
| Dial click | Open/confirm active session |
| Roller | Switch AI model |
| Top-left buttons | Undo / Redo |
| Bottom-left button | Autopilot toggle |
| Bottom-right button | Stop / Cancel |

### Keypad (Right Device)

| Control | Function |
|---------|----------|
| 9 LCD buttons (idle) | Prompt shortcuts |
| 9 LCD buttons (working) | Ghost walk animation |
| 9 LCD buttons (waiting) | Dynamic response options |
| < > buttons | Page navigation |

### Pages

| Page | Content |
|------|---------|
| 1 | Prompts (Eleştir, Refactor, Test, ...) |
| 2 | IDE Controls (Open Chat, Debug, ...) |
| 3 | Git (Commit, Push, Pull, PR) |
| 4 | Agent Selection |
| Auto | Context-aware (React, Python, CSS, Test) |

## 🔧 Configuration

Config file: `~/.kiro-mx/config.json`

Customize button layouts, session health thresholds, animation speeds, and model list.

## 📸 Sprites

Regenerate all sprite assets:

```bash
npm run generate:sprites
```

Generates 520 PNGs: ghost walk (30 frames × 9 tiles), fire (20 frames × 9 tiles), face variants, button templates.

## 🆚 vs Codex Micro

| | Codex Micro | Kiro × MX Creative Console |
|---|---|---|
| Display | None (static keycaps) | 9 LCD buttons (dynamic) |
| Status | RGB LEDs | Full animations + expressions |
| Buttons | Fixed | Context-aware, per-file-type |
| Sessions | Limited | Dial navigation (30+) |
| Price | $230 extra | Already own MX Console |
| Platform | Codex only | Kiro (open ecosystem) |

## 📄 License

MIT
