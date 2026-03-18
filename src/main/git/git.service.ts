import { execFile } from 'child_process';
import { promisify } from 'util';
import type { GitStatus, GitCommit } from '../../shared/types';

const execFileAsync = promisify(execFile);

async function runGit(repoPath: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd: repoPath,
    timeout: 10000,
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim();
}

export async function isValidRepo(repoPath: string): Promise<boolean> {
  try {
    const result = await runGit(repoPath, ['rev-parse', '--is-inside-work-tree']);
    return result === 'true';
  } catch {
    return false;
  }
}

export async function getStatus(repoPath: string): Promise<GitStatus | null> {
  try {
    const output = await runGit(repoPath, ['status', '--porcelain=v2', '--branch']);
    const lines = output.split('\n');

    let branch = '';
    let ahead = 0;
    let behind = 0;
    let dirty = 0;
    let staged = 0;

    for (const line of lines) {
      if (line.startsWith('# branch.head ')) {
        branch = line.replace('# branch.head ', '');
      } else if (line.startsWith('# branch.ab ')) {
        const match = line.match(/\+(\d+) -(\d+)/);
        if (match) {
          ahead = parseInt(match[1], 10);
          behind = parseInt(match[2], 10);
        }
      } else if (line.startsWith('1 ') || line.startsWith('2 ')) {
        const xy = line.split(' ')[1];
        if (xy && xy[0] !== '.') staged++;
        if (xy && xy[1] !== '.') dirty++;
      } else if (line.startsWith('? ')) {
        dirty++;
      }
    }

    return { branch, ahead, behind, dirty, staged };
  } catch {
    return null;
  }
}

export async function getRecentCommits(
  repoPath: string,
  limit = 10
): Promise<GitCommit[]> {
  try {
    const output = await runGit(repoPath, [
      'log',
      `--max-count=${limit}`,
      '--format=%H|%h|%s|%an|%aI',
    ]);
    if (!output) return [];

    return output.split('\n').map((line) => {
      const [hash, shortHash, message, author, date] = line.split('|');
      return { hash, shortHash, message, author, date };
    });
  } catch {
    return [];
  }
}
