import type { GitStatus, GitCommit } from '../../../shared/types';

interface GitPanelProps {
  status: GitStatus;
  commits: GitCommit[];
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function GitPanel({ status, commits, onClose }: GitPanelProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 z-50 w-[360px] bg-surface-1 border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">Git Status</h3>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-primary text-xs"
            >
              x
            </button>
          </div>
          <div className="flex gap-3 mt-2 text-xs text-text-secondary">
            <span>Branch: <span className="text-text-primary">{status.branch}</span></span>
            {status.dirty > 0 && <span className="text-accent">{status.dirty} changed</span>}
            {status.staged > 0 && <span className="text-success">{status.staged} staged</span>}
            {status.ahead > 0 && <span>↑ {status.ahead} ahead</span>}
            {status.behind > 0 && <span>↓ {status.behind} behind</span>}
          </div>
        </div>

        {/* Commits */}
        <div className="max-h-[300px] overflow-y-auto">
          {commits.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-text-tertiary">No commits</div>
          ) : (
            commits.map((commit) => (
              <div
                key={commit.hash}
                className="px-4 py-2.5 border-b border-border/50 hover:bg-surface-2 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-accent font-mono mt-0.5 shrink-0">
                    {commit.shortHash}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-primary truncate">{commit.message}</p>
                    <p className="text-[10px] text-text-tertiary mt-0.5">
                      {commit.author} · {timeAgo(commit.date)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
