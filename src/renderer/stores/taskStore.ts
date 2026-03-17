import { create } from 'zustand';
import type {
  Task,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
} from '../../shared/types';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  fetchTasks: (projectId: string) => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (input: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, newStatus: TaskStatus, newSortOrder: number) => Promise<void>;
  setTasks: (tasks: Task[]) => void;
  getTasksByStatus: (status: TaskStatus) => Task[];
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  loading: false,

  fetchTasks: async (projectId) => {
    set({ loading: true });
    const tasks = await window.electronAPI.tasks.listByProject(projectId);
    set({ tasks, loading: false });
  },

  createTask: async (input) => {
    const task = await window.electronAPI.tasks.create(input);
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  updateTask: async (input) => {
    const task = await window.electronAPI.tasks.update(input);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
    }));
    return task;
  },

  deleteTask: async (id) => {
    await window.electronAPI.tasks.delete(id);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },

  moveTask: async (id, newStatus, newSortOrder) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status: newStatus, sortOrder: newSortOrder } : t
      ),
    }));
    try {
      await window.electronAPI.tasks.reorder({ id, status: newStatus, sortOrder: newSortOrder });
    } catch (err) {
      // Revert on failure — re-fetch from DB
      const task = get().tasks.find((t) => t.id === id);
      if (task) {
        const tasks = await window.electronAPI.tasks.listByProject(task.projectId);
        set({ tasks });
      }
    }
  },

  setTasks: (tasks) => set({ tasks }),

  getTasksByStatus: (status) => {
    return get()
      .tasks.filter((t) => t.status === status)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
}));
