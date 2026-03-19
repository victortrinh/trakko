import { ipcMain } from 'electron';
import * as tasksRepo from '../database/tasks.repo';
import type { CreateTaskInput, UpdateTaskInput, ReorderTaskInput } from '../../shared/types';

export function registerTaskHandlers(): void {
  ipcMain.handle('tasks:list-by-project', (_event, projectId: string) => {
    return tasksRepo.listTasksByProject(projectId);
  });

  ipcMain.handle('tasks:list-all', () => {
    return tasksRepo.listAllTasks();
  });

  ipcMain.handle('tasks:create', (_event, input: CreateTaskInput) => {
    return tasksRepo.createTask(input);
  });

  ipcMain.handle('tasks:update', (_event, input: UpdateTaskInput) => {
    return tasksRepo.updateTask(input);
  });

  ipcMain.handle('tasks:delete', (_event, id: string) => {
    tasksRepo.deleteTask(id);
  });

  ipcMain.handle('tasks:reorder', (_event, input: ReorderTaskInput) => {
    tasksRepo.reorderTask(input);
  });

  ipcMain.handle('tasks:archive', (_event, id: string) => {
    tasksRepo.archiveTask(id);
  });

  ipcMain.handle('tasks:restore', (_event, id: string) => {
    tasksRepo.restoreTask(id);
  });

  ipcMain.handle('tasks:list-archived', (_event, projectId: string) => {
    return tasksRepo.listArchivedTasks(projectId);
  });

  ipcMain.handle('tasks:bulk-archive-done', (_event, projectId: string) => {
    tasksRepo.bulkArchiveDone(projectId);
  });
}
