---
title: "feat: Command Palette (Cmd+K)"
type: feat
status: active
date: 2026-03-17
origin: docs/brainstorms/2026-03-17-trakko-brainstorm.md
---

# Command Palette (Cmd+K)

## Overview

Add a Linear-style command palette triggered by Cmd/Ctrl+K that lets users quickly search tasks, switch projects, and run actions without leaving the keyboard.

## Motivation

The brainstorm identified "keyboard-first" as a core UX principle and listed command palette as a future feature. It's the highest-impact, lowest-scope addition — it makes the entire app navigable by keyboard.

## Proposed Solution

A modal overlay with a search input that filters across projects, tasks, and actions. Results are grouped by category and navigable via arrow keys + Enter.

## Implementation

### New Files

- `src/renderer/components/command-palette/CommandPalette.tsx` — main modal component
- `src/renderer/components/command-palette/CommandPaletteItem.tsx` — result row component
- `src/main/ipc/search.ipc.ts` — cross-project task search handler
- `src/main/database/search.repo.ts` — SQL search queries

### IPC Extension

Add to `src/shared/types.ts`:

```typescript
// Add to ElectronAPI
search: {
  tasks: (query: string) => Promise<(Task & { projectName: string })[]>;
};
```

Add `src/main/database/search.repo.ts`:

```typescript
// SQL: SELECT t.*, p.name as project_name FROM tasks t
//      JOIN projects p ON t.project_id = p.id
//      WHERE t.title LIKE ? OR t.description LIKE ?
//      ORDER BY t.updated_at DESC LIMIT 20
```

### Keyboard & UI

- **Trigger**: Cmd/Ctrl+K — add to `AppShell.tsx` `handleKeyDown`
- **Close**: Escape, click outside, or selecting an item
- **Navigation**: Arrow up/down to move, Enter to select
- **UI**: Fixed overlay (`z-50`), follows existing modal pattern from `TaskDetail.tsx`
- **Search input**: Large, prominent, auto-focused with placeholder "Search tasks, projects, or actions..."

### Result Categories

1. **Projects** — filter by name, action: switch to project
2. **Tasks** (current project) — filter by title, action: open TaskDetail
3. **Tasks** (all projects) — cross-project search via IPC, action: switch project + open task
4. **Actions** — static list: "New Project", "New Task", toggled by query match

### Wiring

- Extend `registerAllHandlers()` in `src/main/ipc/index.ts`
- Extend `preload.ts` with `search` namespace
- Extend `electron.d.ts` global type
- Render `<CommandPalette />` in `AppShell.tsx`

## Acceptance Criteria

- [ ] Cmd/Ctrl+K opens the command palette from anywhere in the app
- [ ] Typing filters results instantly (local filter for projects, IPC for cross-project tasks)
- [ ] Arrow keys navigate results, Enter selects
- [ ] Selecting a project switches to it
- [ ] Selecting a task opens its detail panel
- [ ] Selecting an action executes it (e.g., opens new project form)
- [ ] Escape or click-outside closes the palette
- [ ] Empty state shows recent tasks or helpful hint
- [ ] Follows existing dark theme / design token conventions

## Key Files to Modify

- `src/shared/types.ts` — extend ElectronAPI with `search` namespace
- `src/main/preload.ts` — add search IPC methods
- `src/main/ipc/index.ts` — register search handlers
- `src/renderer/components/layout/AppShell.tsx` — add Cmd+K shortcut + render CommandPalette
- `src/renderer/electron.d.ts` — update Window type

## Sources

- **Origin brainstorm:** [docs/brainstorms/2026-03-17-trakko-brainstorm.md](../brainstorms/2026-03-17-trakko-brainstorm.md) — "Command palette (Cmd+K)" listed as future feature
- Modal pattern: `src/renderer/components/tasks/TaskDetail.tsx`
- Keyboard shortcut pattern: `src/renderer/components/layout/AppShell.tsx:14-26`
- Store selector pattern: `src/renderer/stores/taskStore.ts`
