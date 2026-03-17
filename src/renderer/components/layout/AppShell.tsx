import { useProjectStore } from '../../stores/projectStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { KanbanBoard } from '../board/KanbanBoard';

export function AppShell() {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div className="flex h-screen bg-surface-0">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        {activeProject ? (
          <>
            <TopBar project={activeProject} />
            <KanbanBoard />
          </>
        ) : (
          <EmptyState hasProjects={projects.length > 0} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ hasProjects }: { hasProjects: boolean }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">
          {hasProjects ? '👈' : '✨'}
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          {hasProjects ? 'Select a project' : 'Welcome to Trakko'}
        </h2>
        <p className="text-text-secondary">
          {hasProjects
            ? 'Choose a project from the sidebar to get started'
            : 'Create your first project to start tracking tasks'}
        </p>
      </div>
    </div>
  );
}
