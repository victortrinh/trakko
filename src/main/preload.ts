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
  appState: {
    get: (key) => ipcRenderer.invoke('app-state:get', key),
    set: (key, value) => ipcRenderer.invoke('app-state:set', key, value),
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
