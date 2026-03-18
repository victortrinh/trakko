import { ipcMain, BrowserWindow } from 'electron';
import * as claudeService from '../ai/claude.service';
import type { AiDelegateInput } from '../../shared/types';

export function registerAiHandlers(): void {
  ipcMain.handle('ai:set-api-key', (_event, key: string) => {
    claudeService.setApiKey(key);
  });

  ipcMain.handle('ai:has-api-key', () => {
    return claudeService.hasApiKey();
  });

  ipcMain.handle('ai:remove-api-key', () => {
    claudeService.removeApiKey();
  });

  ipcMain.handle('ai:cancel-job', (_event, jobId: string) => {
    claudeService.cancelJob(jobId);
  });

  ipcMain.handle('ai:delegate-task', async (event, input: AiDelegateInput) => {
    const jobId = crypto.randomUUID();

    const systemPrompt = `You are a helpful AI assistant integrated into Trakko, a personal project management app. The user is delegating a task to you. Provide a clear, actionable, and concise response. If the task involves code, include code examples. Format your response with markdown.`;

    const userMessage = [
      `**Task:** ${input.taskTitle}`,
      input.taskDescription ? `**Description:** ${input.taskDescription}` : '',
      `**Project:** ${input.projectName}`,
      input.gitRepoPath ? `**Git repo:** ${input.gitRepoPath}` : '',
      '',
      input.userPrompt ? `**Additional instructions:** ${input.userPrompt}` : 'Please help me complete this task.',
    ]
      .filter(Boolean)
      .join('\n');

    // Stream in background
    (async () => {
      try {
        const sender = event.sender;
        for await (const chunk of claudeService.streamDelegation(jobId, systemPrompt, userMessage)) {
          if (!sender.isDestroyed()) {
            sender.send('ai:chunk', jobId, chunk);
          }
        }
        if (!sender.isDestroyed()) {
          sender.send('ai:done', jobId);
        }
      } catch (err: unknown) {
        const sender = event.sender;
        if (!sender.isDestroyed()) {
          sender.send('ai:error', jobId, err instanceof Error ? err.message : 'Unknown error');
        }
      }
    })();

    return jobId;
  });
}
