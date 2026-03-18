import { useState, useEffect, useCallback } from 'react';
import type { GitStatus, GitCommit } from '../../../shared/types';
import { GitPanel } from './GitPanel';

interface GitStatusBadgeProps {
  repoPath: string;
}

export function GitStatusBadge({ repoPath }: GitStatusBadgeProps) {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [commits, setCommits] = useState<GitCommit[]>([]);

  const fetchStatus = useCallback(async () => {
    const result = await window.electronAPI.git.getStatus(repoPath);
    setStatus(result);
  }, [repoPath]);

  useEffect(() => {
    fetchStatus();

    // Refresh on window focus
    const handleFocus = () => fetchStatus();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchStatus]);

  const handleClick = async () => {
    if (!showPanel) {
      const recentCommits = await window.electronAPI.git.getRecentCommits(repoPath, 8);
      setCommits(recentCommits);
    }
    setShowPanel(!showPanel);
  };

  if (!status) return null;

  return (
    <div className="relative" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-tertiary bg-surface-2 rounded hover:bg-surface-3 hover:text-text-secondary transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Z" />
        </svg>
        <span>{status.branch}</span>
        {status.dirty > 0 && (
          <span className="bg-accent/20 text-accent px-1 rounded text-[10px]">
            {status.dirty}
          </span>
        )}
        {status.ahead > 0 && (
          <span className="text-[10px]">↑{status.ahead}</span>
        )}
        {status.behind > 0 && (
          <span className="text-[10px]">↓{status.behind}</span>
        )}
      </button>

      {showPanel && (
        <GitPanel
          status={status}
          commits={commits}
          onClose={() => setShowPanel(false)}
        />
      )}
    </div>
  );
}
