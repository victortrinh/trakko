import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from '../shared/types';

const api: ElectronAPI = {
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    create: (input) => ipcRenderer.invoke('projects:create', input),
    update: (input) => ipcRenderer.invoke('projects:update', input),
    delete: (id) => ipcRenderer.invoke('projects:delete', id),
  },
  tasks: {
    listByProject: (projectId) => ipcRenderer.invoke('tasks:list-by-project', projectId),
    create: (input) => ipcRenderer.invoke('tasks:create', input),
    update: (input) => ipcRenderer.invoke('tasks:update', input),
    delete: (id) => ipcRenderer.invoke('tasks:delete', id),
    reorder: (input) => ipcRenderer.invoke('tasks:reorder', input),
    archive: (id) => ipcRenderer.invoke('tasks:archive', id),
    restore: (id) => ipcRenderer.invoke('tasks:restore', id),
    listArchived: (projectId) => ipcRenderer.invoke('tasks:list-archived', projectId),
    bulkArchiveDone: (projectId) => ipcRenderer.invoke('tasks:bulk-archive-done', projectId),
  },
  search: {
    tasks: (query) => ipcRenderer.invoke('search:tasks', query),
  },
  git: {
    getStatus: (repoPath) => ipcRenderer.invoke('git:get-status', repoPath),
    getRecentCommits: (repoPath, limit) => ipcRenderer.invoke('git:get-recent-commits', repoPath, limit),
    isValidRepo: (repoPath) => ipcRenderer.invoke('git:is-valid-repo', repoPath),
  },
  ai: {
    startSession: (sessionId, input) => ipcRenderer.invoke('ai:start-session', sessionId, input),
    sendInput: (sessionId, input) => ipcRenderer.invoke('ai:send-input', sessionId, input),
    resize: (sessionId, cols, rows) => ipcRenderer.invoke('ai:resize', sessionId, cols, rows),
    killSession: (sessionId) => ipcRenderer.invoke('ai:kill-session', sessionId),
    onOutput: (cb) => {
      const handler = (_e: Electron.IpcRendererEvent, sessionId: string, data: string) => cb(sessionId, data);
      ipcRenderer.on('ai:output', handler);
      return () => { ipcRenderer.removeListener('ai:output', handler); };
    },
    onExit: (cb) => {
      const handler = (_e: Electron.IpcRendererEvent, sessionId: string, exitCode: number) => cb(sessionId, exitCode);
      ipcRenderer.on('ai:exit', handler);
      return () => { ipcRenderer.removeListener('ai:exit', handler); };
    },
  },
  labels: {
    list: (projectId) => ipcRenderer.invoke('labels:list', projectId),
    create: (projectId, name, color) => ipcRenderer.invoke('labels:create', projectId, name, color),
    delete: (id) => ipcRenderer.invoke('labels:delete', id),
    addToTask: (taskId, labelId) => ipcRenderer.invoke('labels:add-to-task', taskId, labelId),
    removeFromTask: (taskId, labelId) => ipcRenderer.invoke('labels:remove-from-task', taskId, labelId),
    getForTasks: (taskIds) => ipcRenderer.invoke('labels:get-for-tasks', taskIds),
  },
  dialog: {
    selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),
  },
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  },
  appState: {
    get: (key) => ipcRenderer.invoke('app-state:get', key),
    set: (key, value) => ipcRenderer.invoke('app-state:set', key, value),
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
