export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: string;
  name: string;
  description: string;
  gitRepoPath: string | null;
  createdAt: string;
  updatedAt: string;
  sortOrder: number;
}

export interface Label {
  id: string;
  projectId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  sortOrder: number;
  priority: TaskPriority | null;
  dueDate: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  labels?: Label[];
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
  priority?: TaskPriority | null;
  dueDate?: string | null;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  sortOrder?: number;
  priority?: TaskPriority | null;
  dueDate?: string | null;
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
export interface AiSessionInput {
  taskTitle: string;
  taskDescription: string;
  projectName: string;
  gitRepoPath?: string;
  initialPrompt?: string;
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
    archive: (id: string) => Promise<void>;
    restore: (id: string) => Promise<void>;
    listArchived: (projectId: string) => Promise<Task[]>;
    bulkArchiveDone: (projectId: string) => Promise<void>;
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
    startSession: (sessionId: string, input: AiSessionInput) => Promise<void>;
    sendInput: (sessionId: string, input: string) => Promise<void>;
    resize: (sessionId: string, cols: number, rows: number) => Promise<void>;
    killSession: (sessionId: string) => Promise<void>;
    onOutput: (cb: (sessionId: string, data: string) => void) => () => void;
    onExit: (cb: (sessionId: string, exitCode: number) => void) => () => void;
  };
  labels: {
    list: (projectId: string) => Promise<Label[]>;
    create: (projectId: string, name: string, color: string) => Promise<Label>;
    delete: (id: string) => Promise<void>;
    addToTask: (taskId: string, labelId: string) => Promise<void>;
    removeFromTask: (taskId: string, labelId: string) => Promise<void>;
    getForTasks: (taskIds: string[]) => Promise<Record<string, Label[]>>;
  };
  dialog: {
    selectFolder: () => Promise<string | null>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
  };
  appState: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<void>;
  };
}
