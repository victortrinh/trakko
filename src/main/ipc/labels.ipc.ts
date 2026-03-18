import { ipcMain } from 'electron';
import * as labelsRepo from '../database/labels.repo';

export function registerLabelHandlers(): void {
  ipcMain.handle('labels:list', (_event, projectId: string) => {
    return labelsRepo.listLabels(projectId);
  });

  ipcMain.handle('labels:create', (_event, projectId: string, name: string, color: string) => {
    return labelsRepo.createLabel(projectId, name, color);
  });

  ipcMain.handle('labels:delete', (_event, id: string) => {
    labelsRepo.deleteLabel(id);
  });

  ipcMain.handle('labels:add-to-task', (_event, taskId: string, labelId: string) => {
    labelsRepo.addLabelToTask(taskId, labelId);
  });

  ipcMain.handle('labels:remove-from-task', (_event, taskId: string, labelId: string) => {
    labelsRepo.removeLabelFromTask(taskId, labelId);
  });

  ipcMain.handle('labels:get-for-tasks', (_event, taskIds: string[]) => {
    return labelsRepo.getLabelsForTasks(taskIds);
  });
}
