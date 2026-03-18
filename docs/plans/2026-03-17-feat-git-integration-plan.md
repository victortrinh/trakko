---
title: "feat: Git Integration per Project"
type: feat
status: active
date: 2026-03-17
origin: docs/brainstorms/2026-03-17-trakko-brainstorm.md
---

# Git Integration per Project

## Overview

Show git status, current branch, and recent commits for projects that have a linked git repository path. Surface this information in the UI so developers can see project context at a glance.

## Motivation

The brainstorm designed for this from day one — `gitRepoPath` already exists in the projects schema. Developers managing multiple repos need to see which branch they're on and what's changed without switching to a terminal.

## Proposed Solution

A new Git panel (expandable section in TopBar or sidebar) that shows branch name, dirty file count, and recent commits. All git operations run in the main process via `child_process.execFile` — never expose git CLI to the renderer.

## Implementation

### New Files

- `src/main/git/git.service.ts` — shell out to `git` binary, parse output
- `src/main/ipc/git.ipc.ts` — IPC handlers for git operations
- `src/renderer/components/git/GitStatusBadge.tsx` — compact badge in TopBar
- `src/renderer/components/git/GitPanel.tsx` — expanded panel with commits

### Types

Add to `src/shared/types.ts`:

```typescript
export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  dirty: number;       // count of modified/untracked files
  staged: number;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}

// Add to ElectronAPI
git: {
  getStatus: (repoPath: string) => Promise<GitStatus | null>;
  getRecentCommits: (repoPath: string, limit?: number) => Promise<GitCommit[]>;
  isValidRepo: (repoPath: string) => Promise<boolean>;
};
```

### Git Service (`src/main/git/git.service.ts`)

Use `child_process.execFile('git', [...args], { cwd: repoPath })` for safety (no shell injection):

- `getStatus`: Run `git status --porcelain -b` → parse branch name, dirty count, ahead/behind
- `getRecentCommits`: Run `git log --oneline --format="%H|%h|%s|%an|%aI" -n 10` → parse into `GitCommit[]`
- `isValidRepo`: Run `git rev-parse --is-inside-work-tree` → boolean

All functions return `null` or empty arrays on error (repo not found, git not installed, etc.).

### IPC Handlers (`src/main/ipc/git.ipc.ts`)

```typescript
export function registerGitHandlers(): void {
  ipcMain.handle('git:get-status', (_event, repoPath: string) => gitService.getStatus(repoPath));
  ipcMain.handle('git:get-recent-commits', (_event, repoPath: string, limit?: number) => gitService.getRecentCommits(repoPath, limit));
  ipcMain.handle('git:is-valid-repo', (_event, repoPath: string) => gitService.isValidRepo(repoPath));
}
```

### UI Components

**GitStatusBadge** (in TopBar, next to project name):
- Shows: branch icon + branch name + dirty count badge
- Click to expand GitPanel
- Only renders when `project.gitRepoPath` is set and valid
- Auto-refreshes on window focus (`document.addEventListener('visibilitychange')`)

**GitPanel** (dropdown or slide-out below TopBar):
- Recent commits list (hash, message, author, relative time)
- File change summary
- Close on Escape or click outside

### Validation in ProjectForm

Enhance the git repo path input in `ProjectForm.tsx`:
- On blur, call `window.electronAPI.git.isValidRepo(path)` to validate
- Show green check or red error indicator
- Don't block form submission — just warn

## Acceptance Criteria

- [ ] Projects with a valid `gitRepoPath` show branch name + dirty count in TopBar
- [ ] Clicking the git badge opens a panel with recent commits
- [ ] Git status auto-refreshes when the app window regains focus
- [ ] Invalid/missing repo paths are handled gracefully (badge hidden, no errors)
- [ ] ProjectForm validates git paths on blur with visual feedback
- [ ] Git operations do not block the UI (async IPC)
- [ ] Works on macOS and Windows (git binary path differences handled)
- [ ] No new npm dependencies — uses child_process.execFile directly

## Key Files to Modify

- `src/shared/types.ts` — add GitStatus, GitCommit types + git namespace on ElectronAPI
- `src/main/preload.ts` — add git IPC methods
- `src/main/ipc/index.ts` — register git handlers
- `src/renderer/components/layout/TopBar.tsx` — render GitStatusBadge
- `src/renderer/components/projects/ProjectForm.tsx` — add path validation
- `src/renderer/electron.d.ts` — update Window type

## Risk Analysis

| Risk | Mitigation |
|------|-----------|
| `git` binary not installed | Check with `which git` on init, hide git features if missing |
| Large repos slow `git log` | Use `--max-count` limit, cache results for 30s |
| Windows path differences | Use `path.join()`, handle both `/` and `\` separators |
| Repo path no longer valid | Return null from service, hide badge gracefully |

## Sources

- **Origin brainstorm:** [docs/brainstorms/2026-03-17-trakko-brainstorm.md](../brainstorms/2026-03-17-trakko-brainstorm.md) — "Git repository integration per project" listed as future feature, `gitRepoPath` schema column already exists
- IPC handler pattern: `src/main/ipc/tasks.ipc.ts`
- TopBar component: `src/renderer/components/layout/TopBar.tsx`
