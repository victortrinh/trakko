import { useState } from 'react';
import type { Project } from '../../../shared/types';
import { useTaskStore } from '../../stores/taskStore';
import { GitStatusBadge } from '../git/GitStatusBadge';
import { ArchivedTasksPanel } from '../board/ArchivedTasksPanel';

interface TopBarProps {
  project: Project;
}

export function TopBar({ project }: TopBarProps) {
  const [showArchived, setShowArchived] = useState(false);
  const tasks = useTaskStore((s) => s.tasks);
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;

  return (
    <>
      <div className="h-14 flex items-center gap-4 px-6 border-b border-border bg-surface-0 shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="flex items-center gap-2 shrink-0">
          <h2 className="text-base font-semibold text-text-primary truncate">{project.name}</h2>
          {totalTasks > 0 && (
            <span className="text-xs text-text-tertiary whitespace-nowrap">
              {doneTasks}/{totalTasks} done
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={() => setShowArchived(true)}
            className="px-2 py-1 text-xs text-text-tertiary hover:text-text-secondary hover:bg-surface-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Archived
          </button>
          {project.gitRepoPath && (
            <GitStatusBadge repoPath={project.gitRepoPath} />
          )}
        </div>
      </div>

      {showArchived && (
        <ArchivedTasksPanel
          projectId={project.id}
          onClose={() => setShowArchived(false)}
        />
      )}
    </>
  );
}
