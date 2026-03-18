# Future Enhancements

## AI Integration
- [x] **AI Task Delegation via Claude API** — delegate tasks to Claude with streaming responses, API key management via safeStorage *(completed — see plan)*
- [x] Task context injection (repo path, task description, related files)
- [x] **Claude Code sessions instead of API key** — spawn a Claude Code CLI session from within Trakko instead of requiring a separate API key. Opens a terminal-like panel with a live Claude Code session scoped to the task/project context. *(completed — replaced API key approach with node-pty + xterm.js)*

## UI / UX
- [x] **Richer inline task creation** — move the create form to the top of the Todo column (under the title) and expand it beyond title-only to include description, priority, labels, and due date at creation time *(completed — inline form with description, priority, labels)*
- [ ] Light mode toggle
- [x] Markdown support in task descriptions *(completed — react-markdown + remark-gfm with Write/Preview toggle)*
- [x] Task labels / tags / priority levels *(completed — priority picker, user-created labels with colors)*
- [ ] Due dates with calendar picker
- [ ] Notifications / reminders
- [ ] Multi-window support
- [ ] Customizable columns (beyond Todo/In Progress/Done)

## Data
- [ ] Data export / import (JSON or CSV)
- [ ] Data backup UI (copy SQLite file)
- [x] Task archiving (hide completed tasks without deleting) *(completed — archive/restore/bulk-archive with ArchivedTasksPanel)*

## Platform
- [x] **GitHub Releases with versioned artifacts** — publish Mac + Windows builds as GitHub Release assets with proper semver tagging via CI or electron-forge *(completed — release.yml + ci.yml workflows)*

## Git Integration
- [x] **Git status & commit history per project** — branch name, dirty count, recent commits panel *(completed — see plan)*
- [ ] Show file diffs per commit
- [ ] Create branches from tasks
- [ ] Git worktree management per task
- [ ] Pull/push from within the app

## Productivity
- [x] **Command Palette (Cmd/Ctrl+K)** — search projects, tasks, and actions from anywhere *(completed — see plan)*
- [ ] Time tracking per task
- [ ] Task templates
- [ ] Keyboard shortcuts throughout (vim-style navigation)
- [ ] Global search with filters (status, project, date range)
