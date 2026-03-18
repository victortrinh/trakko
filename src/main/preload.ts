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
    setApiKey: (key) => ipcRenderer.invoke('ai:set-api-key', key),
    hasApiKey: () => ipcRenderer.invoke('ai:has-api-key'),
    removeApiKey: () => ipcRenderer.invoke('ai:remove-api-key'),
    delegateTask: (input) => ipcRenderer.invoke('ai:delegate-task', input),
    cancelJob: (jobId) => ipcRenderer.invoke('ai:cancel-job', jobId),
    onChunk: (callback) => {
      const handler = (_e: Electron.IpcRendererEvent, jobId: string, chunk: string) => callback(jobId, chunk);
      ipcRenderer.on('ai:chunk', handler);
      return () => { ipcRenderer.removeListener('ai:chunk', handler); };
    },
    onDone: (callback) => {
      const handler = (_e: Electron.IpcRendererEvent, jobId: string) => callback(jobId);
      ipcRenderer.on('ai:done', handler);
      return () => { ipcRenderer.removeListener('ai:done', handler); };
    },
    onError: (callback) => {
      const handler = (_e: Electron.IpcRendererEvent, jobId: string, error: string) => callback(jobId, error);
      ipcRenderer.on('ai:error', handler);
      return () => { ipcRenderer.removeListener('ai:error', handler); };
    },
  },
  appState: {
    get: (key) => ipcRenderer.invoke('app-state:get', key),
    set: (key, value) => ipcRenderer.invoke('app-state:set', key, value),
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
