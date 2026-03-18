---
title: "feat: AI Task Delegation via Claude API"
type: feat
status: active
date: 2026-03-17
origin: docs/brainstorms/2026-03-17-trakko-brainstorm.md
---

# AI Task Delegation via Claude API

## Overview

Allow users to delegate tasks to Claude for implementation suggestions, code generation, or task breakdown. The AI assistant runs in a panel within Trakko, with streaming responses and full task context.

## Motivation

The brainstorm envisioned "AI task delegation (Claude integration)" as a future capability. This turns Trakko from a passive tracker into an active productivity tool — select a task, hit "Delegate to Claude", and get actionable output.

## Proposed Solution

A side panel (or modal) where users can send a task to Claude with optional instructions. The response streams in real-time. The main process holds the API key securely and makes HTTP calls — the renderer never touches the API directly.

## Implementation

### New Files

- `src/main/ai/claude.service.ts` — Claude API HTTP client with streaming
- `src/main/ipc/ai.ipc.ts` — IPC handlers for AI operations
- `src/renderer/stores/aiStore.ts` — Zustand store for AI state
- `src/renderer/components/ai/AiPanel.tsx` — main AI interaction panel
- `src/renderer/components/ai/AiButton.tsx` — trigger button on TaskCard/TaskDetail

### Phase 1: API Key Management

**Storage**: Use Electron's `safeStorage` API for encrypting the API key at rest.

Add to `src/shared/types.ts`:

```typescript
// Add to ElectronAPI
ai: {
  setApiKey: (key: string) => Promise<void>;
  hasApiKey: () => Promise<boolean>;
  removeApiKey: () => Promise<void>;
  delegateTask: (input: AiDelegateInput) => Promise<string>;  // returns jobId
  cancelJob: (jobId: string) => Promise<void>;
};

export interface AiDelegateInput {
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  projectName: string;
  gitRepoPath?: string;
  userPrompt?: string;  // additional instructions
}
```

**API key UI**: Settings modal (or first-time setup) with a single input field. Key is encrypted via `safeStorage.encryptString()` and stored in `app_state`.

### Phase 2: Claude API Integration

**`src/main/ai/claude.service.ts`**:

```typescript
import { net } from 'electron';

export async function* streamChatCompletion(
  apiKey: string,
  systemPrompt: string,
  userMessage: string
): AsyncGenerator<string> {
  const response = await net.fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      stream: true,
    }),
  });
  // Parse SSE stream, yield text deltas
}
```

Use `net.fetch` (Electron's built-in, respects proxy settings) instead of `node-fetch`.

### Phase 3: Streaming IPC Pattern

The current codebase uses only `invoke`/`handle` (request-response). Streaming requires a new pattern:

**Main → Renderer streaming** via `webContents.send`:

```typescript
// In ai.ipc.ts
ipcMain.handle('ai:delegate-task', async (event, input: AiDelegateInput) => {
  const jobId = crypto.randomUUID();
  const apiKey = getDecryptedApiKey();

  // Start streaming in background
  (async () => {
    for await (const chunk of streamChatCompletion(apiKey, systemPrompt, buildUserMessage(input))) {
      event.sender.send('ai:chunk', jobId, chunk);
    }
    event.sender.send('ai:done', jobId);
  })();

  return jobId;
});
```

**Preload** — add subscription method:

```typescript
ai: {
  // ... existing methods
  onChunk: (callback: (jobId: string, chunk: string) => void) => {
    const handler = (_e: any, jobId: string, chunk: string) => callback(jobId, chunk);
    ipcRenderer.on('ai:chunk', handler);
    return () => ipcRenderer.removeListener('ai:chunk', handler);
  },
  onDone: (callback: (jobId: string) => void) => {
    const handler = (_e: any, jobId: string) => callback(jobId);
    ipcRenderer.on('ai:done', handler);
    return () => ipcRenderer.removeListener('ai:done', handler);
  },
},
```

### Phase 4: Renderer UI

**AiStore** (`src/renderer/stores/aiStore.ts`):
- State: `jobs: Record<string, { status, chunks, fullText }>`, `activeJobId`
- Actions: `startDelegation(input)`, `cancelJob(jobId)`
- Subscribes to `onChunk`/`onDone` in store init

**AiPanel** (`src/renderer/components/ai/AiPanel.tsx`):
- Slide-out panel (right side) or modal
- Shows task context at top (title, description, project)
- Text area for additional instructions
- "Delegate" button to start
- Streaming response area with markdown rendering (or plain text for MVP)
- Copy-to-clipboard button on the response

**AiButton** — small icon button on `TaskDetail.tsx`:
- Opens AiPanel pre-filled with task context

### System Prompt

```
You are a helpful assistant integrated into Trakko, a personal project management app.
The user is delegating a task to you. Provide a clear, actionable response.

Task: {title}
Description: {description}
Project: {projectName}
{gitRepoPath ? `Git repo: ${gitRepoPath}` : ''}

Additional instructions from user: {userPrompt}
```

## Acceptance Criteria

### Phase 1: API Key
- [ ] User can set Claude API key via settings UI
- [ ] API key is encrypted at rest via safeStorage
- [ ] App indicates whether an API key is configured
- [ ] User can remove/replace the API key

### Phase 2: Delegation
- [ ] User can delegate a task from TaskDetail panel
- [ ] Response streams in real-time (not waiting for full completion)
- [ ] Task context (title, description, project) is included automatically
- [ ] User can add additional instructions before delegating

### Phase 3: UX
- [ ] AI panel shows streaming response with proper text formatting
- [ ] User can copy the full response to clipboard
- [ ] User can cancel an in-progress delegation
- [ ] Error states handled (invalid key, network error, rate limit)
- [ ] No API calls made if no key is configured (button disabled with tooltip)

## Key Files to Modify

- `src/shared/types.ts` — add AiDelegateInput type + ai namespace on ElectronAPI
- `src/main/preload.ts` — add ai IPC methods including subscription pattern
- `src/main/ipc/index.ts` — register ai handlers
- `src/renderer/components/tasks/TaskDetail.tsx` — add "Delegate to AI" button
- `src/renderer/electron.d.ts` — update Window type

## Dependencies

- **No new npm packages** — uses Electron's `net.fetch` and `safeStorage`
- **Requires**: Claude API key from user (Anthropic account)
- **Optional**: Git integration (to include repo context in prompts)

## Risk Analysis

| Risk | Mitigation |
|------|-----------|
| API key exposure | safeStorage encryption, never sent to renderer, main-process only |
| Streaming SSE parsing | Well-documented format, simple line-by-line parser |
| Rate limiting | Show error message, suggest retry after delay |
| Large responses | Limit max_tokens to 4096, scrollable response area |
| Network failures | Timeout after 30s, show error state, allow retry |
| New IPC pattern (send/on) | Contained to ai namespace, cleanup functions prevent leaks |

## Sources

- **Origin brainstorm:** [docs/brainstorms/2026-03-17-trakko-brainstorm.md](../brainstorms/2026-03-17-trakko-brainstorm.md) — "AI task delegation (Claude integration)" listed as future feature
- IPC handler pattern: `src/main/ipc/tasks.ipc.ts`
- Store pattern: `src/renderer/stores/taskStore.ts`
- Modal/panel pattern: `src/renderer/components/tasks/TaskDetail.tsx`
- [Claude API Messages docs](https://docs.anthropic.com/en/api/messages)
- [Electron safeStorage API](https://www.electronjs.org/docs/latest/api/safe-storage)
- [Electron net.fetch](https://www.electronjs.org/docs/latest/api/net#netfetchinput-init)
