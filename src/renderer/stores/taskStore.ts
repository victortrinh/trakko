import { create } from 'zustand';
import type {
  Task,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
} from '../../shared/types';

interface TaskState {
  tasks: Task[];
  archivedTasks: Task[];
  loading: boolean;
  fetchTasks: (projectId: string) => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (input: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, newStatus: TaskStatus, newSortOrder: number) => Promise<void>;
  setTasks: (tasks: Task[]) => void;
  getTasksByStatus: (status: TaskStatus) => Task[];
  archiveTask: (id: string) => Promise<void>;
  restoreTask: (id: string) => Promise<void>;
  fetchArchivedTasks: (projectId: string) => Promise<void>;
  bulkArchiveDone: (projectId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  archivedTasks: [],
  loading: false,

  fetchTasks: async (projectId) => {
    set({ loading: true });
    const tasks = await window.electronAPI.tasks.listByProject(projectId);
    // Batch-fetch labels for all tasks
    if (tasks.length > 0) {
      const taskIds = tasks.map((t) => t.id);
      const labelsMap = await window.electronAPI.labels.getForTasks(taskIds);
      for (const task of tasks) {
        task.labels = labelsMap[task.id] || [];
      }
    }
    set({ tasks, loading: false });
  },

  createTask: async (input) => {
    const task = await window.electronAPI.tasks.create(input);
    task.labels = [];
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  updateTask: async (input) => {
    const task = await window.electronAPI.tasks.update(input);
    // Preserve labels from existing task
    const existing = get().tasks.find((t) => t.id === task.id);
    task.labels = existing?.labels || [];
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

  archiveTask: async (id) => {
    await window.electronAPI.tasks.archive(id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },

  restoreTask: async (id) => {
    await window.electronAPI.tasks.restore(id);
    const task = get().archivedTasks.find((t) => t.id === id);
    set((state) => ({
      archivedTasks: state.archivedTasks.filter((t) => t.id !== id),
      tasks: task ? [...state.tasks, { ...task, archivedAt: null }] : state.tasks,
    }));
  },

  fetchArchivedTasks: async (projectId) => {
    const archivedTasks = await window.electronAPI.tasks.listArchived(projectId);
    set({ archivedTasks });
  },

  bulkArchiveDone: async (projectId) => {
    await window.electronAPI.tasks.bulkArchiveDone(projectId);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.status !== 'done'),
    }));
  },
}));
