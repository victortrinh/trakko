import { create } from 'zustand';
import type { Label } from '../../shared/types';

interface LabelState {
  labels: Label[];
  fetchLabels: (projectId: string) => Promise<void>;
  createLabel: (projectId: string, name: string, color: string) => Promise<Label>;
  deleteLabel: (id: string) => Promise<void>;
  addLabelToTask: (taskId: string, labelId: string) => Promise<void>;
  removeLabelFromTask: (taskId: string, labelId: string) => Promise<void>;
}

export const useLabelStore = create<LabelState>()((set) => ({
  labels: [],

  fetchLabels: async (projectId) => {
    const labels = await window.electronAPI.labels.list(projectId);
    set({ labels });
  },

  createLabel: async (projectId, name, color) => {
    const label = await window.electronAPI.labels.create(projectId, name, color);
    set((state) => ({ labels: [...state.labels, label] }));
    return label;
  },

  deleteLabel: async (id) => {
    await window.electronAPI.labels.delete(id);
    set((state) => ({ labels: state.labels.filter((l) => l.id !== id) }));
  },

  addLabelToTask: async (taskId, labelId) => {
    await window.electronAPI.labels.addToTask(taskId, labelId);
  },

  removeLabelFromTask: async (taskId, labelId) => {
    await window.electronAPI.labels.removeFromTask(taskId, labelId);
  },
}));
