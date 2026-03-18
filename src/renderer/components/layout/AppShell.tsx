import { useEffect, useCallback, useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { KanbanBoard } from '../board/KanbanBoard';
import { ProjectForm } from '../projects/ProjectForm';
import { CommandPalette } from '../command-palette/CommandPalette';

export function AppShell() {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Global keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+K: Command palette
      if (isMod && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette((show) => !show);
        return;
      }

      // Cmd/Ctrl+N: New project (when no project selected)
      if (isMod && e.key === 'n' && !activeProject) {
        e.preventDefault();
        setShowNewProject(true);
      }
    },
    [activeProject]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
          <EmptyState
            hasProjects={projects.length > 0}
            onCreateProject={() => setShowNewProject(true)}
          />
        )}
      </div>
      {showNewProject && (
        <ProjectForm onClose={() => setShowNewProject(false)} />
      )}
      {showCommandPalette && (
        <CommandPalette onClose={() => setShowCommandPalette(false)} />
      )}
    </div>
  );
}

function EmptyState({
  hasProjects,
  onCreateProject,
}: {
  hasProjects: boolean;
  onCreateProject: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          {hasProjects ? 'Select a project' : 'Welcome to Trakko'}
        </h2>
        <p className="text-text-secondary mb-4">
          {hasProjects
            ? 'Choose a project from the sidebar to get started'
            : 'Create your first project to start tracking tasks'}
        </p>
        <p className="text-xs text-text-tertiary mb-6">
          Press <kbd className="px-1.5 py-0.5 bg-surface-2 border border-border rounded text-[10px]">Cmd+K</kbd> to search
        </p>
        {!hasProjects && (
          <button
            onClick={onCreateProject}
            className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            Create Project
          </button>
        )}
      </div>
    </div>
  );
}
