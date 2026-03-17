import { create } from 'zustand';
import type { Project, CreateProjectInput, UpdateProjectInput } from '../../shared/types';

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
  loading: boolean;
  fetchProjects: () => Promise<void>;
  createProject: (input: CreateProjectInput) => Promise<Project>;
  updateProject: (input: UpdateProjectInput) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  setActiveProject: (id: string | null) => void;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  activeProjectId: null,
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    const projects = await window.electronAPI.projects.list();
    const lastActiveId = await window.electronAPI.appState.get('last_active_project_id');
    const activeId = lastActiveId && projects.some((p) => p.id === lastActiveId)
      ? lastActiveId
      : projects[0]?.id ?? null;
    set({ projects, activeProjectId: activeId, loading: false });
  },

  createProject: async (input) => {
    const project = await window.electronAPI.projects.create(input);
    set((state) => ({
      projects: [...state.projects, project],
      activeProjectId: project.id,
    }));
    await window.electronAPI.appState.set('last_active_project_id', project.id);
    return project;
  },

  updateProject: async (input) => {
    const project = await window.electronAPI.projects.update(input);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === project.id ? project : p)),
    }));
    return project;
  },

  deleteProject: async (id) => {
    await window.electronAPI.projects.delete(id);
    const { projects, activeProjectId } = get();
    const remaining = projects.filter((p) => p.id !== id);
    const newActiveId =
      activeProjectId === id ? (remaining[0]?.id ?? null) : activeProjectId;
    set({ projects: remaining, activeProjectId: newActiveId });
    if (newActiveId) {
      await window.electronAPI.appState.set('last_active_project_id', newActiveId);
    }
  },

  setActiveProject: (id) => {
    set({ activeProjectId: id });
    if (id) {
      window.electronAPI.appState.set('last_active_project_id', id);
    }
  },
}));
