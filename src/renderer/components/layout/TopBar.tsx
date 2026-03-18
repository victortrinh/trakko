import type { Project } from '../../../shared/types';
import { useTaskStore } from '../../stores/taskStore';
import { GitStatusBadge } from '../git/GitStatusBadge';

interface TopBarProps {
  project: Project;
}

export function TopBar({ project }: TopBarProps) {
  const tasks = useTaskStore((s) => s.tasks);
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="h-14 flex items-center justify-between px-6 border-b border-border bg-surface-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-text-primary">{project.name}</h2>
        {totalTasks > 0 && (
          <span className="text-xs text-text-tertiary">
            {doneTasks}/{totalTasks} done
          </span>
        )}
      </div>
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {project.gitRepoPath && (
          <GitStatusBadge repoPath={project.gitRepoPath} />
        )}
      </div>
    </div>
  );
}
