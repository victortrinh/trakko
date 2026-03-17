import { ipcMain } from 'electron';
import * as projectsRepo from '../database/projects.repo';
import type { CreateProjectInput, UpdateProjectInput } from '../../shared/types';

export function registerProjectHandlers(): void {
  ipcMain.handle('projects:list', () => {
    return projectsRepo.listProjects();
  });

  ipcMain.handle('projects:create', (_event, input: CreateProjectInput) => {
    return projectsRepo.createProject(input);
  });

  ipcMain.handle('projects:update', (_event, input: UpdateProjectInput) => {
    return projectsRepo.updateProject(input);
  });

  ipcMain.handle('projects:delete', (_event, id: string) => {
    projectsRepo.deleteProject(id);
  });
}
