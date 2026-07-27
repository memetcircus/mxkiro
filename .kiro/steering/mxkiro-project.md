---
inclusion: always
---

# MX Kiro Project Context

## What is this project?
A physical AI coding companion that connects Logitech MX Creative Console to Kiro IDE. Users press LCD buttons to send prompts, navigate sessions with the dial, and see Kiro's status via animations.

## Architecture
```
MX Creative Console → C# Plugin (Logi SDK) → HTTP → Bridge Service (Node.js) → Kiro ACP/CLI
```

## Key Components

### C# Plugin (`KiroMxConsolePlugin/`)
- Built with Logi Actions SDK (C#, .NET 10)
- Runs inside Logi Plugin Service
- Actions: prompt commands, session dial, model dial, stop, git, IDE shortcuts
- Communicates with Bridge via HTTP (`localhost:9848`)

### Bridge Service (`packages/bridge/`)
- Node.js/TypeScript
- HTTP server on port 9848 (receives from C# plugin + Kiro hooks)
- WebSocket server on port 9847 (future: real-time state push)
- ACP client (connects to `kiro-cli acp` for session/prompt/cancel)
- Session monitor (reads `~/.kiro/sessions/cli/`)

### Kiro Power (`packages/kiro-power/`)
- POWER.md, hooks, steering files, skills
- Hooks notify Bridge of Kiro state changes

## Current Status
- ✅ C# plugin loads in Logi Plugin Service
- ✅ Actions visible on MX Creative Console LCD buttons
- ✅ Button press → Bridge HTTP → Kiro IDE chat (AppleScript, Cmd+L)
- ✅ Ghost walk animation on LCD (real Kiro icon, 30 frames, soldan sağa + mirror)
- ✅ State sync via agentStop hook (animation starts/stops with Kiro working state)
- ✅ Short prompts (explain this file, criticize this code, etc.)
- ✅ kiro-cli installed and authenticated
- ✅ Session health monitor fire effect (message count proxy, fire ghost at critical)
- ✅ Stop/Cancel physical button (Ctrl+C cancel, 2s suppression guard)
- ✅ Dial session navigation (18 notch threshold, Cmd+Alt+Arrow)
- ✅ Screenshot → Kiro chat (native crosshair, NSPasteboard file paste)
- 🔲 Model selector roller
- 🔲 Context-aware button pages (file type based)
- 🔲 Bridge auto-start with Logi Plugin Service

## Tech Stack
- C# / .NET 10 — Logi plugin
- TypeScript / Node.js — Bridge service
- Kiro ACP — JSON-RPC over stdio (`kiro-cli acp`)
- Kiro Hooks — IDE event → HTTP notification

## Development Commands
```bash
# Build C# plugin (auto-reloads in Logi Options+)
cd KiroMxConsolePlugin && dotnet build

# Start Bridge service
cd packages/bridge && npx tsx src/index.ts

# Generate sprites
npm run generate:sprites
```

## Code Style
- All code, comments, and UI text in English
- Communication with user in Turkish
- Follow existing patterns in each package

## Spec Location
`.kiro/specs/kiro-mx-console/` — requirements.md, design.md, tasks.md

## Next Priority Tasks
1. Model selector roller
2. Context-aware button pages (file type based)
3. Bridge auto-start with Logi Plugin Service
4. Page layout redesign (utility actions on page 1, prompts on page 2)
