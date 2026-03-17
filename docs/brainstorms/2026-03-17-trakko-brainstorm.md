---
date: 2026-03-17
topic: trakko-personal-board
---

# Trakko — Personal Project Board

## What We're Building

A cross-platform desktop app (Mac + Windows) for managing multiple projects and their tasks in a Kanban-style board. Think a lightweight, offline-first alternative to Jira/Trello designed for individual developers.

Each project can optionally link to a Git repository. Tasks flow through Todo / In Progress / Done columns with drag-and-drop. All data is stored locally — no backend, no accounts, no cloud dependency for the MVP.

## Why This Approach

### Runtime: Electron
- Mature, battle-tested (VS Code, Slack, Discord)
- Huge ecosystem and community support
- Straightforward path to App Store / .exe distribution
- Tauri considered but rejected for MVP — smaller ecosystem, Rust knowledge required for native extensions

### Storage: SQLite (via better-sqlite3)
- Real relational database with proper querying
- Scales well for future features (search, filtering, reporting)
- Single file, easy to backup/move
- Native module, but well-supported in Electron

### UI: Linear-inspired + 21st.dev components
- Minimal, keyboard-first, dark theme by default
- Sharp, professional aesthetic suited for developer tools
- 21st.dev provides beautiful shadcn/ui-compatible components
- TailwindCSS for utility-first styling

### State: Zustand
- Lightweight, minimal boilerplate
- Works great with React + TypeScript
- Easy to persist/hydrate from SQLite
- Scales well without Redux ceremony

### Frontend: React + TypeScript
- Industry standard, huge ecosystem
- Component-based architecture
- TypeScript for type safety and better DX

## Key Decisions

- **App name**: Trakko
- **Runtime**: Electron
- **Frontend**: React + TypeScript
- **Styling**: TailwindCSS + 21st.dev (shadcn/ui-compatible components)
- **State management**: Zustand
- **Data persistence**: SQLite via better-sqlite3
- **UI aesthetic**: Linear-inspired — dark mode default, minimal, keyboard-first
- **Architecture**: Clean separation of UI / State / Data layers
- **MVP scope**: Projects CRUD, Tasks CRUD with Kanban board, drag-and-drop, local persistence

## Future Features (designed for, not built in MVP)
- Git repository integration per project
- AI task delegation (Claude integration)
- Git worktree management
- Command palette (Cmd+K)
- Keyboard shortcuts throughout
- Script/automation hooks
- Light mode toggle

## Resolved Questions

- **Drag-and-drop library**: @dnd-kit — modern, well-maintained, great React integration, most popular in 2026
- **Electron packaging**: electron-forge — official Electron toolchain, best maintained and documented

## Next Steps

-> `/workflows:plan` for implementation details
