import { useEffect, useCallback, useState, useRef } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { Sidebar } from './Sidebar';
import type { SidebarView } from './Sidebar';
import { TopBar } from './TopBar';
import { KanbanBoard } from '../board/KanbanBoard';
import { MyTasksView } from '../tasks/MyTasksView';
import { InboxView } from '../tasks/InboxView';
import { AllProjectsView } from '../projects/AllProjectsView';
import { ProjectForm } from '../projects/ProjectForm';
import { CommandPalette } from '../command-palette/CommandPalette';

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 400;
const SIDEBAR_DEFAULT = 256;

type AppView = SidebarView;

export function AppShell() {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const [activeView, setActiveView] = useState<AppView>('project');
  const [showNewProject, setShowNewProject] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const isResizing = useRef(false);

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

  const handleSelectProject = (projectId: string) => {
    setActiveProject(projectId);
    setActiveView('project');
  };

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth + (e.clientX - startX)));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [sidebarWidth]);

  const renderMainContent = () => {
    if (activeView === 'my-tasks') {
      return <MyTasksView />;
    }

    if (activeView === 'all-projects') {
      return (
        <AllProjectsView
          onSelectProject={handleSelectProject}
          onNewProject={() => setShowNewProject(true)}
        />
      );
    }

    if (activeView === 'inbox') {
      return <InboxView />;
    }

    if (activeProject) {
      return (
        <>
          <TopBar project={activeProject} />
          <KanbanBoard />
        </>
      );
    }

    return (
      <EmptyState
        hasProjects={projects.length > 0}
        onCreateProject={() => setShowNewProject(true)}
      />
    );
  };

  return (
    <div className="flex h-screen bg-surface-0">
      <Sidebar activeView={activeView} onViewChange={setActiveView} width={sidebarWidth} />
      <div
        onMouseDown={handleResizeStart}
        className="w-1 shrink-0 cursor-col-resize hover:bg-accent/30 active:bg-accent/50 transition-colors"
      />
      <div className="flex flex-1 flex-col min-w-0">
        {renderMainContent()}
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
