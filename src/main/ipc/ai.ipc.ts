import { ipcMain } from 'electron';
import * as claudeCode from '../ai/claude-code.service';
import type { AiSessionInput } from '../../shared/types';

export function registerAiHandlers(): void {
  ipcMain.handle('ai:start-session', (event, sessionId: string, input: AiSessionInput) => {
    const sender = event.sender;

    const cwd = input.gitRepoPath || undefined;
    const prompt = input.initialPrompt ||
      `I'm working on the project "${input.projectName}". Task: "${input.taskTitle}". ${input.taskDescription ? `Description: ${input.taskDescription}` : ''}`;

    claudeCode.startSession(
      sessionId,
      { cwd, initialPrompt: prompt },
      (data) => {
        if (!sender.isDestroyed()) {
          sender.send('ai:output', sessionId, data);
        }
      },
      (exitCode) => {
        if (!sender.isDestroyed()) {
          sender.send('ai:exit', sessionId, exitCode);
        }
      }
    );

  });

  ipcMain.handle('ai:send-input', (_event, sessionId: string, input: string) => {
    claudeCode.sendInput(sessionId, input);
  });

  ipcMain.handle('ai:resize', (_event, sessionId: string, cols: number, rows: number) => {
    claudeCode.resizeSession(sessionId, cols, rows);
  });

  ipcMain.handle('ai:kill-session', (_event, sessionId: string) => {
    claudeCode.killSession(sessionId);
  });
}
