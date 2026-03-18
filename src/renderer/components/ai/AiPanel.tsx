import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import type { Task } from '../../../shared/types';
import { useProjectStore } from '../../stores/projectStore';

interface AiPanelProps {
  task: Task;
  onClose: () => void;
}

export function AiPanel({ task, onClose }: AiPanelProps) {
  const termRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [sessionAlive, setSessionAlive] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [started, setStarted] = useState(false);
  const pendingPromptRef = useRef<string | undefined>(undefined);

  const projects = useProjectStore((s) => s.projects);
  const project = projects.find((p) => p.id === task.projectId);

  // Initialize terminal and start PTY session after the terminal div is mounted
  useEffect(() => {
    if (!started || !termRef.current) return;

    const terminal = new Terminal({
      theme: {
        background: '#0a0a0f',
        foreground: '#e4e4ef',
        cursor: '#e4e4ef',
        selectionBackground: '#6366f166',
      },
      fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
      fontSize: 13,
      cursorBlink: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    terminal.open(termRef.current);
    fitAddon.fit();

    // Generate sessionId client-side BEFORE the IPC call so the onOutput
    // listener can match events from the very first byte of PTY output.
    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;
    setSessionAlive(true);

    // Subscribe to events
    const unsubOutput = window.electronAPI.ai.onOutput((sid, data) => {
      if (sid === sessionId) {
        terminal.write(data);
      }
    });

    const unsubExit = window.electronAPI.ai.onExit((sid) => {
      if (sid === sessionId) {
        terminal.write('\r\n\x1b[90m[Session ended]\x1b[0m\r\n');
        setSessionAlive(false);
      }
    });

    // Forward terminal input to PTY
    terminal.onData((data) => {
      window.electronAPI.ai.sendInput(sessionId, data);
    });

    // Start the PTY session
    window.electronAPI.ai.startSession(sessionId, {
      taskTitle: task.title,
      taskDescription: task.description,
      projectName: project?.name || '',
      gitRepoPath: project?.gitRepoPath || undefined,
      initialPrompt: pendingPromptRef.current,
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      const { cols, rows } = terminal;
      window.electronAPI.ai.resize(sessionId, cols, rows);
    });
    resizeObserver.observe(termRef.current);

    return () => {
      resizeObserver.disconnect();
      unsubOutput();
      unsubExit();
      terminal.dispose();
    };
  }, [started]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionIdRef.current) {
        window.electronAPI.ai.killSession(sessionIdRef.current);
      }
    };
  }, []);

  const handleEndSession = () => {
    if (sessionIdRef.current) {
      window.electronAPI.ai.killSession(sessionIdRef.current);
      setSessionAlive(false);
    }
  };

  const handleClose = () => {
    if (sessionIdRef.current && sessionAlive) {
      window.electronAPI.ai.killSession(sessionIdRef.current);
    }
    onClose();
  };

  const handleStart = () => {
    pendingPromptRef.current = userPrompt.trim() || undefined;
    setStarted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-surface-1 border border-border rounded-xl w-[800px] h-[600px] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Claude Code</h2>
            <p className="text-xs text-text-tertiary mt-0.5 truncate max-w-[600px]">{task.title}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            x
          </button>
        </div>

        {!started ? (
          /* Pre-start screen */
          <div className="flex-1 flex flex-col p-5">
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <p className="text-sm text-text-secondary text-center max-w-md">
                Start a Claude Code session for this task. Claude will have context about your task and project.
              </p>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Custom instructions (optional)..."
                rows={3}
                className="w-full max-w-md bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent resize-none"
              />
              <button
                onClick={handleStart}
                className="px-6 py-2.5 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                Start Session
              </button>
            </div>
          </div>
        ) : (
          /* Terminal */
          <>
            <div ref={termRef} className="flex-1 p-1 overflow-hidden" />

            {/* Footer */}
            <div className="px-5 py-2 border-t border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${sessionAlive ? 'bg-success' : 'bg-text-tertiary'}`} />
                <span className="text-xs text-text-tertiary">
                  {sessionAlive ? 'Session active' : 'Session ended'}
                </span>
              </div>
              {sessionAlive && (
                <button
                  onClick={handleEndSession}
                  className="px-3 py-1.5 text-xs text-danger hover:bg-surface-2 rounded-lg transition-colors"
                >
                  End Session
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
