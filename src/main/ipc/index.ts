import { ipcMain, dialog, shell } from 'electron';
import { getDb } from '../database/connection';
import { registerProjectHandlers } from './projects.ipc';
import { registerTaskHandlers } from './tasks.ipc';
import { registerSearchHandlers } from './search.ipc';
import { registerGitHandlers } from './git.ipc';
import { registerAiHandlers } from './ai.ipc';
import { registerLabelHandlers } from './labels.ipc';

function registerAppStateHandlers(): void {
  ipcMain.handle('app-state:get', (_event, key: string) => {
    const db = getDb();
    const row = db.prepare('SELECT value FROM app_state WHERE key = ?').get(key) as
      | { value: string }
      | undefined;
    return row?.value ?? null;
  });

  ipcMain.handle('app-state:set', (_event, key: string, value: string) => {
    const db = getDb();
    db.prepare('INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)').run(key, value);
  });
}

function registerDialogHandlers(): void {
  ipcMain.handle('dialog:select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Git Repository',
    });
    return result.canceled ? null : result.filePaths[0] ?? null;
  });
}

function registerShellHandlers(): void {
  ipcMain.handle('shell:open-external', (_event, url: string) => {
    return shell.openExternal(url);
  });
}

export function registerAllHandlers(): void {
  registerProjectHandlers();
  registerTaskHandlers();
  registerSearchHandlers();
  registerGitHandlers();
  registerAiHandlers();
  registerLabelHandlers();
  registerDialogHandlers();
  registerShellHandlers();
  registerAppStateHandlers();
}
