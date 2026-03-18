import * as pty from 'node-pty';
import * as os from 'os';

interface PtySession {
  pty: pty.IPty;
  alive: boolean;
}

const sessions = new Map<string, PtySession>();

export function startSession(
  sessionId: string,
  opts: { cwd?: string; initialPrompt?: string },
  onData: (data: string) => void,
  onExit: (exitCode: number) => void
): void {
  const shell = os.platform() === 'win32' ? 'cmd.exe' : '/bin/zsh';
  const args = os.platform() === 'win32'
    ? ['/c', 'claude']
    : ['-l', '-c', `claude${opts.initialPrompt ? ` "${opts.initialPrompt.replace(/"/g, '\\"')}"` : ''}`];

  const ptyProcess = pty.spawn(shell, args, {
    name: 'xterm-256color',
    cols: 120,
    rows: 30,
    cwd: opts.cwd || os.homedir(),
    env: { ...process.env } as Record<string, string>,
  });

  const session: PtySession = { pty: ptyProcess, alive: true };
  sessions.set(sessionId, session);

  ptyProcess.onData((data) => {
    onData(data);
  });

  ptyProcess.onExit(({ exitCode }) => {
    session.alive = false;
    sessions.delete(sessionId);
    onExit(exitCode);
  });
}

export function sendInput(sessionId: string, data: string): void {
  const session = sessions.get(sessionId);
  if (session?.alive) {
    session.pty.write(data);
  }
}

export function resizeSession(sessionId: string, cols: number, rows: number): void {
  const session = sessions.get(sessionId);
  if (session?.alive) {
    session.pty.resize(cols, rows);
  }
}

export function killSession(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session?.alive) {
    session.pty.kill();
    session.alive = false;
    sessions.delete(sessionId);
  }
}
