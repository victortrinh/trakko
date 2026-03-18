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

// Search types
export interface TaskSearchResult extends Task {
  projectName: string;
}

// Git types
export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  dirty: number;
  staged: number;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}

// AI types
export interface AiDelegateInput {
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  projectName: string;
  gitRepoPath?: string;
  userPrompt?: string;
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
  search: {
    tasks: (query: string) => Promise<TaskSearchResult[]>;
  };
  git: {
    getStatus: (repoPath: string) => Promise<GitStatus | null>;
    getRecentCommits: (repoPath: string, limit?: number) => Promise<GitCommit[]>;
    isValidRepo: (repoPath: string) => Promise<boolean>;
  };
  ai: {
    setApiKey: (key: string) => Promise<void>;
    hasApiKey: () => Promise<boolean>;
    removeApiKey: () => Promise<void>;
    delegateTask: (input: AiDelegateInput) => Promise<string>;
    cancelJob: (jobId: string) => Promise<void>;
    onChunk: (callback: (jobId: string, chunk: string) => void) => () => void;
    onDone: (callback: (jobId: string) => void) => () => void;
    onError: (callback: (jobId: string, error: string) => void) => () => void;
  };
  appState: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<void>;
  };
}
