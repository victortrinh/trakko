export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Project {
  id: string;
  name: string;
  description: string;
  gitRepoPath: string | null;
  createdAt: string;
  updatedAt: string;
  sortOrder: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  gitRepoPath?: string | null;
}

export interface UpdateProjectInput {
  id: string;
  name?: string;
  description?: string;
  gitRepoPath?: string | null;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  sortOrder?: number;
}

export interface ReorderTaskInput {
  id: string;
  status: TaskStatus;
  sortOrder: number;
}

export interface ElectronAPI {
  projects: {
    list: () => Promise<Project[]>;
    create: (input: CreateProjectInput) => Promise<Project>;
    update: (input: UpdateProjectInput) => Promise<Project>;
    delete: (id: string) => Promise<void>;
  };
  tasks: {
    listByProject: (projectId: string) => Promise<Task[]>;
    create: (input: CreateTaskInput) => Promise<Task>;
    update: (input: UpdateTaskInput) => Promise<Task>;
    delete: (id: string) => Promise<void>;
    reorder: (input: ReorderTaskInput) => Promise<void>;
  };
  appState: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<void>;
  };
}
