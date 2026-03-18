import { net, safeStorage } from 'electron';
import { getDb } from '../database/connection';

const STORAGE_KEY = 'claude_api_key_encrypted';

export function setApiKey(key: string): void {
  const db = getDb();
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(key).toString('base64');
    db.prepare('INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)').run(STORAGE_KEY, encrypted);
  } else {
    db.prepare('INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)').run(STORAGE_KEY, key);
  }
}

export function getApiKey(): string | null {
  const db = getDb();
  const row = db.prepare('SELECT value FROM app_state WHERE key = ?').get(STORAGE_KEY) as
    | { value: string }
    | undefined;
  if (!row) return null;

  if (safeStorage.isEncryptionAvailable()) {
    try {
      const buffer = Buffer.from(row.value, 'base64');
      return safeStorage.decryptString(buffer);
    } catch {
      return row.value;
    }
  }
  return row.value;
}

export function hasApiKey(): boolean {
  return getApiKey() !== null;
}

export function removeApiKey(): void {
  const db = getDb();
  db.prepare('DELETE FROM app_state WHERE key = ?').run(STORAGE_KEY);
}

const activeJobs = new Map<string, AbortController>();

export function cancelJob(jobId: string): void {
  const controller = activeJobs.get(jobId);
  if (controller) {
    controller.abort();
    activeJobs.delete(jobId);
  }
}

export async function* streamDelegation(
  jobId: string,
  systemPrompt: string,
  userMessage: string
): AsyncGenerator<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No API key configured');

  const controller = new AbortController();
  activeJobs.set(jobId, controller);

  try {
    const response = await net.fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error ${response.status}: ${text}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          try {
            const event = JSON.parse(data);
            if (event.type === 'content_block_delta' && event.delta?.text) {
              yield event.delta.text;
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    }
  } finally {
    activeJobs.delete(jobId);
  }
}
