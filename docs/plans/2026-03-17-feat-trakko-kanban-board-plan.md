---
title: "feat: Trakko — Cross-Platform Kanban Board Desktop App"
type: feat
status: completed
date: 2026-03-17
origin: docs/brainstorms/2026-03-17-trakko-brainstorm.md
---

# Trakko — Cross-Platform Kanban Board Desktop App

## Overview

Build "Trakko", a cross-platform (Mac + Windows) Electron desktop app for managing multiple projects and their tasks in a Kanban-style board. Lightweight, offline-first, no backend. Linear-inspired aesthetic with dark mode default.

## Problem Statement / Motivation

Managing personal dev projects across multiple repos requires a lightweight, fast, local-first tool. Existing solutions (Jira, Trello, Linear) are cloud-based, team-oriented, and overkill for individual use. Trakko fills the gap: a beautiful, offline Kanban board that lives on your machine.

## Tech Stack (see brainstorm: docs/brainstorms/2026-03-17-trakko-brainstorm.md)

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Electron + electron-forge | Latest (v7.x forge) |
| Frontend | React + TypeScript | React 19, TS 5.x |
| Styling | TailwindCSS v4 + 21st.dev (shadcn/ui) | v4.1.x |
| State | Zustand | v5.x |
| Database | SQLite via better-sqlite3 | v12.x |
| Drag & Drop | @dnd-kit/react + @dnd-kit/helpers | v0.3.x |
| Packaging | electron-forge makers | DMG (mac), Squirrel (win) |

## Installed Skills

The following skills from skills.sh are installed globally to guide implementation:

1. `jezweb/claude-skills@electron-base` — Electron fundamentals
2. `jwynia/agent-skills@electron-best-practices` — Electron best practices
3. `jezweb/claude-skills@tailwind-v4-shadcn` — Tailwind v4 + shadcn/ui patterns
4. `jezweb/claude-skills@zustand-state-management` — Zustand state patterns
5. `supercent-io/skills-template@vibe-kanban` — Kanban board patterns
6. `ihlamury/design-skills@linear-ui-skills` — Linear-style UI design system
7. `giuseppe-trisciuoglio/developer-kit@tailwind-css-patterns` — Tailwind CSS patterns

## Key Design Decisions

### UX Decisions (from SpecFlow analysis)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Navigation | Left sidebar with project list | Linear-inspired, natural for multi-project |
| Task creation | Inline quick-create (title only) at bottom of Todo column | Fast, minimal friction like Linear |
| Task editing | Click card → slide-out detail panel | Shows full task without leaving board |
| Within-column reorder | Yes, supported via @dnd-kit sortable | Would feel broken without it |
| Delete confirmation | Yes, for both tasks and projects | No undo system in MVP — must confirm |
| App reopen behavior | Restore last-viewed project | Track via `app_state` table |
| Project editing | Yes, rename + change git path | Full CRUD as specified in brainstorm |
| Task description format | Plain text (stored as TEXT for future markdown) | YAGNI — markdown editor adds complexity |
| Window minimum size | 900×600px | 3 columns + sidebar need space |
| Title bar | Native title bar for MVP | Custom frameless is polish, not MVP |
| Default task column | Todo | New tasks always start in Todo |
| Git repo path validation | Basic path-exists check only | Full git validation deferred to git integration feature |

### Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| SQLite access | Main process only via IPC | Security best practice — contextIsolation: true |
| IPC pattern | ipcRenderer.invoke / ipcMain.handle | Request-response with Promises, type-safe via contextBridge |
| State hydration | Zustand stores call IPC on mount | Stores are UI cache; SQLite is source of truth |
| Drag-drop persistence | Optimistic update → persist on dragEnd | Instant feel; revert on failure |
| Sort order | REAL fractional indexing | Avoids rewriting all positions on each drag |
| DB migrations | Version table + migration scripts on startup | Future-proof from day one |
| Native module handling | webpack externals + electron-rebuild + asar unpack | better-sqlite3 cannot be bundled by webpack |

## Database Schema

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_state (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Stores: 'last_active_project_id', 'window_bounds', 'schema_version'

CREATE TABLE IF NOT EXISTS projects (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT DEFAULT '',
  git_repo_path TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tasks (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done')),
  sort_order    REAL NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
```

**Key schema notes:**
- `sort_order REAL` on tasks enables fractional indexing: drop between positions 2.0 and 3.0 → assign 2.5
- `app_state` key-value table for lightweight app preferences
- UUIDs via `crypto.randomUUID()` — client-generated, no autoincrement conflicts
- `ON DELETE CASCADE` — deleting a project removes all its tasks
- Schema version tracked in `app_state` for future migrations

## Folder Structure

```
trakko/
├── forge.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── package.json
├── src/
│   ├── main/                        # Electron main process
│   │   ├── index.ts                 # App entry, creates BrowserWindow
│   │   ├── preload.ts               # contextBridge API
│   │   ├── ipc/
│   │   │   ├── index.ts             # Register all handlers
│   │   │   ├── projects.ipc.ts      # Project CRUD handlers
│   │   │   └── tasks.ipc.ts         # Task CRUD handlers
│   │   └── database/
│   │       ├── connection.ts        # SQLite singleton (userData/trakko.db)
│   │       ├── migrations.ts        # Schema versioning + creation
│   │       ├── projects.repo.ts     # Project prepared statements
│   │       └── tasks.repo.ts        # Task prepared statements
│   │
│   ├── renderer/                    # React app
│   │   ├── index.html
│   │   ├── index.tsx                # React 19 createRoot entry
│   │   ├── App.tsx                  # Root component
│   │   ├── index.css                # Tailwind v4 @import + @theme
│   │   ├── electron.d.ts           # window.electronAPI types
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/21st.dev primitives
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx     # Sidebar + content layout
│   │   │   │   ├── Sidebar.tsx      # Project list + new project
│   │   │   │   └── TopBar.tsx       # Project name + new task button
│   │   │   ├── board/
│   │   │   │   ├── KanbanBoard.tsx  # DragDropProvider + 3 columns
│   │   │   │   ├── KanbanColumn.tsx # Droppable column
│   │   │   │   ├── TaskCard.tsx     # Sortable/draggable card
│   │   │   │   └── InlineTaskCreate.tsx  # Quick-create input
│   │   │   ├── projects/
│   │   │   │   ├── ProjectList.tsx
│   │   │   │   └── ProjectForm.tsx  # Create/Edit dialog
│   │   │   └── tasks/
│   │   │       └── TaskDetail.tsx   # Slide-out detail panel
│   │   ├── stores/
│   │   │   ├── projectStore.ts
│   │   │   └── taskStore.ts
│   │   └── lib/
│   │       └── types.ts             # Renderer-side type helpers
│   │
│   └── shared/
│       └── types.ts                 # Project, Task, TaskStatus, IPC API type
│
└── docs/
    ├── brainstorms/
    └── plans/
```

## Implementation Phases

### Phase 0: Skills & Scaffolding Setup

**Files created:** `package.json`, `forge.config.ts`, `tsconfig.json`, `postcss.config.mjs`, webpack configs, `.gitignore`, `CLAUDE.md`

1. Scaffold with electron-forge webpack-typescript template:
   ```bash
   npx create-electron-app@latest trakko --template=webpack-typescript
   ```
2. Install all dependencies:
   ```bash
   # Core
   npm install react react-dom zustand better-sqlite3 @dnd-kit/react @dnd-kit/helpers
   # Dev
   npm install -D @types/react @types/react-dom @types/better-sqlite3 \
     tailwindcss @tailwindcss/postcss postcss postcss-loader \
     @electron-forge/plugin-auto-unpack-natives
   ```
3. Configure TypeScript: `"jsx": "react-jsx"`, `"strict": true`, `"moduleResolution": "bundler"`
4. Configure webpack:
   - Add `postcss-loader` to CSS rule chain in `webpack.rules.ts`
   - Add `better-sqlite3` to `externals` in `webpack.main.config.ts`
   - Add `AutoUnpackNativesPlugin` to `forge.config.ts`
5. Run `npx electron-rebuild -f -w better-sqlite3`
6. Set up Tailwind v4 CSS-first config:
   ```css
   /* src/renderer/index.css */
   @import "tailwindcss";
   @theme {
     --color-surface-0: #0a0a0f;
     --color-surface-1: #12121a;
     --color-surface-2: #1a1a26;
     --color-surface-3: #24243a;
     --color-accent: #6366f1;
     --color-text-primary: #e4e4ef;
     --color-text-secondary: #8b8ba3;
     --color-border: #2a2a3e;
     --font-sans: "Inter", system-ui, sans-serif;
   }
   ```
7. Declare TypeScript globals for webpack magic variables (`.d.ts` file)
8. Verify `npm start` launches an Electron window
9. Create `CLAUDE.md` with project conventions

**Gotchas to watch for:**
- `@vercel/webpack-asset-relocator-loader` version must be pinned (per electron-forge docs)
- `asar.unpack: '**/*.node'` in `packagerConfig` is required for better-sqlite3 in production
- Tailwind v4 uses `@import "tailwindcss"` not `@tailwind base/components/utilities`
- No `tailwind.config.js` — everything in CSS via `@theme`

### Phase 1: Database Layer (Main Process)

**Files:** `src/shared/types.ts`, `src/main/database/connection.ts`, `src/main/database/migrations.ts`, `src/main/database/projects.repo.ts`, `src/main/database/tasks.repo.ts`

1. Create `src/shared/types.ts` — canonical types shared across processes:
   - `TaskStatus = 'todo' | 'in_progress' | 'done'`
   - `Project`, `Task`, `CreateProjectInput`, `CreateTaskInput`, `UpdateTaskInput`
   - `ElectronAPI` interface (the full IPC contract)
2. Create `connection.ts` — SQLite singleton:
   - DB path: `path.join(app.getPath('userData'), 'trakko.db')`
   - Enable WAL mode + foreign keys
   - Expose `getDb()` function
3. Create `migrations.ts`:
   - Check `schema_version` in `app_state`
   - Run CREATE TABLE statements if version 0
   - Future migrations keyed by version number
4. Create `projects.repo.ts` — prepared statements:
   - `listProjects()`, `getProject(id)`, `createProject(input)`, `updateProject(input)`, `deleteProject(id)`, `reorderProjects(ids[])`
5. Create `tasks.repo.ts` — prepared statements:
   - `listTasksByProject(projectId)`, `createTask(input)`, `updateTask(input)`, `deleteTask(id)`, `moveTask(id, status, sortOrder)`, `reorderTasks(updates[])`
   - All mutations update `updated_at`
   - `moveTask` uses a transaction to update both status and sort_order

**Verification:** App starts, `trakko.db` created in userData, tables verified via sqlite3 CLI.

### Phase 2: IPC Bridge

**Files:** `src/main/preload.ts`, `src/main/ipc/index.ts`, `src/main/ipc/projects.ipc.ts`, `src/main/ipc/tasks.ipc.ts`, `src/renderer/electron.d.ts`

1. Create `preload.ts` — expose typed `window.electronAPI` via contextBridge:
   ```typescript
   contextBridge.exposeInMainWorld('electronAPI', {
     projects: { list, create, update, delete },
     tasks: { listByProject, create, update, delete, reorder },
     appState: { get, set },
   });
   ```
   - Never expose raw `ipcRenderer` — one function per channel
   - Return cleanup functions for any event subscriptions
2. Create IPC handlers using `ipcMain.handle()`:
   - Each handler calls the corresponding repo function
   - Returns serializable data only
3. Create `src/renderer/electron.d.ts` — declare `window.electronAPI` type globally
4. Register all handlers in `src/main/ipc/index.ts`, called from `src/main/index.ts`

**IPC Channels:**
- `projects:list`, `projects:create`, `projects:update`, `projects:delete`
- `tasks:list-by-project`, `tasks:create`, `tasks:update`, `tasks:delete`, `tasks:reorder`
- `app-state:get`, `app-state:set`

**Verification:** Open DevTools console, run `window.electronAPI.projects.list()` — should return empty array.

### Phase 3: Zustand Stores

**Files:** `src/renderer/stores/projectStore.ts`, `src/renderer/stores/taskStore.ts`

1. Create `projectStore.ts`:
   - State: `projects: Project[]`, `activeProjectId: string | null`, `loading: boolean`
   - Actions: `fetchProjects()`, `createProject(input)`, `updateProject(input)`, `deleteProject(id)`, `setActiveProject(id)`
   - On `setActiveProject`, also persist to `app-state:set('last_active_project_id', id)`
   - On `fetchProjects`, auto-select last active project or first in list

2. Create `taskStore.ts`:
   - State: `tasks: Task[]`, `loading: boolean`
   - Derived: computed getters for `todoTasks`, `inProgressTasks`, `doneTasks` (filtered + sorted by sort_order)
   - Actions: `fetchTasks(projectId)`, `createTask(input)`, `updateTask(input)`, `deleteTask(id)`, `moveTask(id, newStatus, newSortOrder)`
   - `moveTask` does optimistic update: snapshot state → update locally → persist via IPC → revert on failure

**Verification:** Mount a debug component that dumps store state. Create/fetch projects and tasks via the store actions.

### Phase 4: UI Shell & Layout

**Files:** `src/renderer/App.tsx`, `src/renderer/components/layout/AppShell.tsx`, `Sidebar.tsx`, `TopBar.tsx`, `src/renderer/components/ui/*.tsx`

1. Set up `App.tsx` — initializes stores on mount, renders `AppShell`
2. Copy/install shadcn-compatible primitives from 21st.dev:
   - Button, Input, Textarea, Dialog, DropdownMenu, Separator, ScrollArea
   ```bash
   npx shadcn@latest add "https://21st.dev/r/shadcn/button"
   npx shadcn@latest add "https://21st.dev/r/shadcn/input"
   npx shadcn@latest add "https://21st.dev/r/shadcn/dialog"
   npx shadcn@latest add "https://21st.dev/r/shadcn/dropdown-menu"
   ```
3. Build `AppShell.tsx` — flex layout: `w-64 sidebar` + `flex-1 content`
4. Build `Sidebar.tsx`:
   - Project list with active indicator
   - "New Project" button
   - Right-click context menu (edit, delete) via DropdownMenu
5. Build `TopBar.tsx`:
   - Active project name
   - "New Task" button (or Cmd/Ctrl+N shortcut)
6. Empty states:
   - No projects: centered prompt "Create your first project"
   - No tasks: subtle guidance in each empty column

**Verification:** App renders with sidebar + content area. Dark theme applied. Can see empty states.

### Phase 5: Kanban Board (Core Feature)

**Files:** `src/renderer/components/board/KanbanBoard.tsx`, `KanbanColumn.tsx`, `TaskCard.tsx`, `InlineTaskCreate.tsx`

1. Build `KanbanBoard.tsx`:
   ```tsx
   <DragDropProvider
     onDragStart={() => { /* snapshot state */ }}
     onDragOver={(event) => { /* optimistic reorder via move() */ }}
     onDragEnd={(event) => {
       if (event.canceled) { /* revert to snapshot */ return; }
       /* persist new positions to SQLite via taskStore.moveTask() */
     }}
   >
     <div className="flex gap-6 h-full px-6 py-4">
       <KanbanColumn status="todo" tasks={todoTasks} />
       <KanbanColumn status="in_progress" tasks={inProgressTasks} />
       <KanbanColumn status="done" tasks={doneTasks} />
     </div>
   </DragDropProvider>
   ```

2. Build `KanbanColumn.tsx`:
   - Uses `useSortable({ id: status, type: 'column', accept: 'item' })`
   - Header: status label + task count badge
   - Renders `TaskCard` children sorted by `sort_order`
   - Drop zone indicator when hovering
   - `InlineTaskCreate` at bottom of Todo column

3. Build `TaskCard.tsx`:
   - Uses `useSortable({ id: task.id, index, group: status, type: 'item', accept: 'item' })`
   - Shows title + truncated description (max 2 lines)
   - `opacity-50` while dragging
   - `transition: { duration: 250, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }`
   - Click → opens TaskDetail

4. Build `InlineTaskCreate.tsx`:
   - Simple input field, Enter to create, Escape to cancel
   - Creates task with status 'todo', sort_order = max + 1

**Drag-drop persistence strategy:**
- `onDragStart`: `snapshot = structuredClone(tasks)`
- `onDragOver`: `setTasks(move(tasks, event))` — visual only
- `onDragEnd`: calculate new sort_order using fractional indexing, call `taskStore.moveTask(id, newStatus, newSortOrder)`
- On IPC failure: revert to snapshot, show error toast

**Verification:** Create 5+ tasks. Drag between columns — status updates and persists. Drag within column — order persists. Reload app — positions preserved.

### Phase 6: CRUD Flows

**Files:** `src/renderer/components/projects/ProjectForm.tsx`, `src/renderer/components/tasks/TaskDetail.tsx`

1. Build `ProjectForm.tsx` (Dialog):
   - Fields: name (required), description, git repo path (optional file picker)
   - Used for both create and edit (detect via `project` prop)
   - On submit: `projectStore.createProject()` or `projectStore.updateProject()`

2. Build `TaskDetail.tsx` (slide-out panel or dialog):
   - Shows full task with inline-editable title and description
   - Status selector (dropdown or segmented control)
   - Delete button with confirmation dialog
   - Created/updated timestamps displayed

3. Wire delete flows:
   - Task delete: confirmation dialog → `taskStore.deleteTask(id)`
   - Project delete: confirmation showing task count → `projectStore.deleteProject(id)` → cascade → select next project or show empty state

**Verification:** Full CRUD cycle: create project → create tasks → edit task → move task → delete task → delete project. Restart app — all changes persisted.

### Phase 7: Polish & Platform

**Files:** Various modifications across components

1. Keyboard shortcuts:
   - `Cmd/Ctrl+N`: New task (when project is selected)
   - `Escape`: Close detail panel / cancel inline create
   - Platform-aware: detect `navigator.platform` for Mac vs Windows labels
2. Window management:
   - Set `minWidth: 900`, `minHeight: 600` in BrowserWindow options
   - Save/restore window bounds via `app_state` table
   - Proper Cmd+Q / Alt+F4 handling
3. Animations:
   - Card drag transitions via @dnd-kit transition config
   - Panel slide-in/out with CSS transitions
   - Subtle hover effects on cards and sidebar items
4. Error handling:
   - SQLite write failures: show toast, revert optimistic state
   - Invalid git repo path: show validation message in form
5. Typography & spacing:
   - Inter font loaded (or system-ui fallback)
   - Consistent spacing scale via Tailwind theme
   - Text truncation on card titles

**Verification:** Resize window → columns adapt. Close and reopen → window position restored. Try keyboard shortcuts. Test on both Mac and Windows if possible.

## Acceptance Criteria

### Functional Requirements
- [x] Can create, edit, and delete projects
- [x] Can create, edit, and delete tasks within projects
- [x] Tasks display in Kanban columns (Todo / In Progress / Done)
- [x] Can drag tasks between columns — status updates
- [x] Can drag tasks within a column — order updates
- [x] Projects optionally store a git repo path
- [x] Data persists across app restarts (SQLite)
- [x] App remembers last-viewed project
- [x] Sidebar shows all projects with active indicator
- [x] Empty states for no-projects and no-tasks scenarios
- [x] Delete confirmations for both tasks and projects

### Non-Functional Requirements
- [x] App launches in under 2 seconds
- [x] Drag-and-drop feels instant (optimistic updates)
- [x] Dark mode by default, Linear-inspired aesthetic
- [x] Minimum window size 900×600
- [x] Window position/size restored on relaunch
- [x] Works on macOS and Windows
- [x] Clean TypeScript with strict mode, no `any` types

### Quality Gates
- [x] `npm start` launches successfully
- [x] All IPC channels type-safe end-to-end
- [x] No console errors during normal operation
- [x] SQLite WAL mode enabled
- [x] Native modules properly handled (asar unpack)

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| better-sqlite3 native module issues | High | Blocks app | Use webpack externals + electron-rebuild + auto-unpack-natives plugin. Test early. |
| @dnd-kit/react API instability (pre-1.0) | Medium | Rework DnD | Pin version. API is stable enough for kanban use case. |
| Tailwind v4 CSS-first config unfamiliar | Low | Slow styling | Fall back to `@tailwindcss/postcss` which is well-tested |
| Cross-platform path differences | Medium | Bug on Windows | Use `path.join()` everywhere, never hardcode separators |
| 21st.dev components may need adaptation | Low | Extra styling work | They're copy-paste — can be modified freely |

## Future Considerations (not in MVP)

- **Git integration**: `Project.gitRepoPath` is already in schema. Future `src/main/ipc/git.ipc.ts` can use `simple-git`.
- **AI delegation**: Future `src/main/ipc/ai.ipc.ts` for Claude API calls. Keys stay in main process (secure).
- **Command palette**: Mount `CommandPalette.tsx` at AppShell root, trigger with Cmd+K.
- **Keyboard shortcuts throughout**: Extend with more shortcuts as features grow.
- **Light mode toggle**: Tailwind v4 `dark:` variants already in place.
- **Data export/backup**: SQLite file is self-contained — add UI for backup/restore.
- **Auto-update**: electron-forge publishers + electron-updater.

## Sources & References

### Origin
- **Brainstorm document:** [docs/brainstorms/2026-03-17-trakko-brainstorm.md](../brainstorms/2026-03-17-trakko-brainstorm.md) — Key decisions: Electron runtime, SQLite storage, Linear-inspired UI, Zustand state, @dnd-kit drag-and-drop

### External References
- [Electron Forge Webpack Plugin](https://www.electronforge.io/config/plugins/webpack)
- [Electron Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [Electron IPC Tutorial](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Electron Native Modules](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules)
- [@dnd-kit/react docs](https://dndkit.com/)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [Zustand v5 docs](https://zustand.docs.pmnd.rs/)
- [better-sqlite3 API](https://github.com/WiseLibs/better-sqlite3)
- [21st.dev component registry](https://21st.dev)
