import { ipcMain } from 'electron';
import * as gitService from '../git/git.service';

export function registerGitHandlers(): void {
  ipcMain.handle('git:get-status', (_event, repoPath: string) => {
    return gitService.getStatus(repoPath);
  });

  ipcMain.handle('git:get-recent-commits', (_event, repoPath: string, limit?: number) => {
    return gitService.getRecentCommits(repoPath, limit);
  });

  ipcMain.handle('git:is-valid-repo', (_event, repoPath: string) => {
    return gitService.isValidRepo(repoPath);
  });
}
