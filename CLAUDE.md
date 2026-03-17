# Trakko

A cross-platform (Mac + Windows) Electron desktop app for personal project/task management with Kanban board.

## Tech Stack

- **Runtime**: Electron + electron-forge (webpack-typescript template)
- **Frontend**: React 19 + TypeScript 5.x
- **Styling**: TailwindCSS v4 (CSS-first config) — no tailwind.config.js
- **State**: Zustand v5
- **Database**: SQLite via better-sqlite3 (main process only, accessed via IPC)
- **Drag & Drop**: @dnd-kit/react + @dnd-kit/helpers
- **Packaging**: electron-forge makers

## Commands

- `npm start` — Launch in dev mode with hot reload
- `npm run package` — Package the app
- `npm run make` — Build distributable installers
- `npm run rebuild` — Rebuild native modules (better-sqlite3) for Electron

## Architecture

- `src/main/` — Electron main process (Node.js)
  - `database/` — SQLite connection, migrations, repository modules
  - `ipc/` — IPC handler registration
  - `preload.ts` — contextBridge API exposed to renderer
- `src/renderer/` — React app (browser context)
  - `components/` — UI components (layout, board, projects, tasks)
  - `stores/` — Zustand stores (projectStore, taskStore)
- `src/shared/types.ts` — Canonical TypeScript types shared between processes

## Key Conventions

- SQLite is ONLY accessed from the main process via IPC
- contextIsolation: true, nodeIntegration: false
- IPC uses invoke/handle pattern (request-response with Promises)
- Tailwind v4 uses `@import "tailwindcss"` + `@theme {}` in CSS (no JS config)
- better-sqlite3 is a webpack external — never bundled, loaded at runtime
- Dark mode by default — Linear-inspired aesthetic
- UUIDs generated client-side via crypto.randomUUID()
- Fractional sort_order (REAL) for drag-and-drop positioning
