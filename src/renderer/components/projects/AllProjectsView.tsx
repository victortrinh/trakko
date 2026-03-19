import { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import type { Project } from '../../../shared/types';

interface AllProjectsViewProps {
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
}

export function AllProjectsView({ onSelectProject, onNewProject }: AllProjectsViewProps) {
  const projects = useProjectStore((s) => s.projects);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchTaskCounts() {
      const counts: Record<string, number> = {};
      await Promise.all(
        projects.map(async (p) => {
          const tasks = await window.electronAPI.tasks.listByProject(p.id);
          counts[p.id] = tasks.filter((t) => !t.archivedAt).length;
        })
      );
      setTaskCounts(counts);
    }

    if (projects.length > 0) {
      fetchTaskCounts();
    }
  }, [projects]);

  return (
    <div className="flex flex-col h-full bg-surface-0">
      {/* Header */}
      <div
        className="h-14 flex items-center px-6 border-b border-border bg-surface-0 shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <h2 className="text-base font-semibold text-text-primary">All Projects</h2>
        <span className="ml-3 text-xs text-text-tertiary">{projects.length} projects</span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              taskCount={taskCounts[project.id] ?? 0}
              onClick={() => onSelectProject(project.id)}
            />
          ))}

          {/* New Project card */}
          <button
            onClick={onNewProject}
            className="flex flex-col items-center justify-center rounded-xl p-4 border-2 border-dashed border-border hover:border-border-hover transition-colors cursor-pointer min-h-[140px] text-text-tertiary hover:text-text-secondary"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-sm mt-2">New Project</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  taskCount,
  onClick,
}: {
  project: Project;
  taskCount: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-surface-1 border border-border rounded-xl p-4 hover:border-border-hover transition-colors cursor-pointer text-left flex flex-col gap-2"
    >
      <div className="flex items-center gap-2">
        {project.icon && <span className="text-base">{project.icon}</span>}
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: project.color }}
        />
        <span className="text-sm font-medium text-text-primary truncate">
          {project.name}
        </span>
      </div>

      {project.description && (
        <p className="text-xs text-text-secondary line-clamp-2">{project.description}</p>
      )}

      <div className="mt-auto pt-1">
        <span className="text-[11px] text-text-tertiary">
          {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
        </span>
      </div>
    </button>
  );
}
