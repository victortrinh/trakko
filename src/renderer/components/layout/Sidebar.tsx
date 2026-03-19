import { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { ProjectForm } from '../projects/ProjectForm';
import type { Project } from '../../../shared/types';

export type SidebarView = 'project' | 'my-tasks' | 'all-projects' | 'inbox';

interface SidebarProps {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  width?: number;
}

export function Sidebar({ activeView, onViewChange, width }: SidebarProps) {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; project: Project } | null>(null);
  const [inboxCount, setInboxCount] = useState(0);

  // Fetch inbox count (overdue + due-today tasks)
  useEffect(() => {
    async function fetchInboxCount() {
      try {
        const tasks = await window.electronAPI.tasks.listAll();
        const today = new Date().toLocaleDateString('en-CA');
        const count = tasks.filter(
          (t) => !t.archivedAt && t.dueDate && t.dueDate <= today && t.status !== 'done'
        ).length;
        setInboxCount(count);
      } catch {
        // ignore
      }
    }

    fetchInboxCount();
    const interval = setInterval(fetchInboxCount, 30_000);
    return () => clearInterval(interval);
  }, [projects]);

  const handleContextMenu = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, project });
  };

  const handleDelete = async (project: Project) => {
    setContextMenu(null);
    if (confirm(`Delete "${project.name}" and all its tasks?`)) {
      await deleteProject(project.id);
    }
  };

  return (
    <>
      <div className="h-screen flex flex-col bg-surface-1 shrink-0" style={{ width: width ?? 256 }}>
        {/* Logo — pt-11 clears macOS traffic light buttons */}
        <div className="pt-11 px-6" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="bg-accent rounded-lg p-1.5 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white" opacity="0.9" />
                <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" opacity="0.6" />
                <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.6" />
                <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">Trakko</h1>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="px-3 space-y-0.5 mb-8">
          <button
            onClick={() => onViewChange('all-projects')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
              activeView === 'all-projects'
                ? 'bg-surface-3 text-text-primary'
                : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            All Projects
          </button>

          <button
            onClick={() => onViewChange('my-tasks')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
              activeView === 'my-tasks'
                ? 'bg-surface-3 text-text-primary'
                : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3" />
              <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            My Tasks
          </button>

          <button
            onClick={() => onViewChange('inbox')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
              activeView === 'inbox'
                ? 'bg-surface-3 text-text-primary'
                : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 8l2.8-2.8a1.5 1.5 0 011.06-.44h6.28c.4 0 .78.16 1.06.44L17 8M3 8v6a1.5 1.5 0 001.5 1.5h11A1.5 1.5 0 0017 14V8M3 8h4l1.25 2h3.5L13 8h4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Inbox
            {inboxCount > 0 && (
              <span className="ml-auto text-[10px] font-bold bg-accent/10 text-accent px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {inboxCount}
              </span>
            )}
          </button>
        </nav>

        {/* Projects Header */}
        <div className="flex items-center justify-between px-6 mb-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Projects</h3>
          <button
            onClick={() => setShowNewProject(true)}
            className="text-text-tertiary hover:text-accent transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => { setActiveProject(project.id); onViewChange('project'); }}
              onContextMenu={(e) => handleContextMenu(e, project)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                project.id === activeProjectId && activeView === 'project'
                  ? 'bg-surface-3 text-text-primary'
                  : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
              }`}
            >
              {project.icon && <span className="text-sm shrink-0">{project.icon}</span>}
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <span className="truncate">{project.name}</span>
            </button>
          ))}
        </div>

        {/* Bottom spacer */}
        <div className="pb-4" />
      </div>

      {contextMenu && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setContextMenu(null)}
        >
          <div
            className="absolute bg-surface-2 border border-border rounded-lg py-1 shadow-xl min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                setEditingProject(contextMenu.project);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-3 hover:text-text-primary"
            >
              Edit Project
            </button>
            <button
              onClick={() => handleDelete(contextMenu.project)}
              className="w-full text-left px-3 py-1.5 text-sm text-danger hover:bg-surface-3"
            >
              Delete Project
            </button>
          </div>
        </div>
      )}

      {(showNewProject || editingProject) && (
        <ProjectForm
          project={editingProject ?? undefined}
          onClose={() => {
            setShowNewProject(false);
            setEditingProject(null);
          }}
        />
      )}
    </>
  );
}
