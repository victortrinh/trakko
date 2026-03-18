import { ipcMain } from 'electron';
import { searchTasks } from '../database/search.repo';

export function registerSearchHandlers(): void {
  ipcMain.handle('search:tasks', (_event, query: string) => {
    return searchTasks(query);
  });
}
