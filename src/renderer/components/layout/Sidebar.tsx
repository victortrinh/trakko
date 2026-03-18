import { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { ProjectForm } from '../projects/ProjectForm';
import type { Project } from '../../../shared/types';

export function Sidebar() {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; project: Project } | null>(null);

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
      <div className="w-64 h-screen flex flex-col bg-surface-1 border-r border-border">
        <div className="pt-9 pb-2 px-4 flex items-center gap-2" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
          <TrakkoLogo />
          <h1 className="text-sm font-bold text-text-primary tracking-wide uppercase">Trakko</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setActiveProject(project.id)}
              onContextMenu={(e) => handleContextMenu(e, project)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-0.5 text-sm transition-colors ${
                project.id === activeProjectId
                  ? 'bg-surface-3 text-text-primary'
                  : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
              }`}
            >
              <span className="truncate block">{project.name}</span>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-border">
          <button
            onClick={() => setShowNewProject(true)}
            className="w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors text-left"
          >
            + New Project
          </button>
        </div>
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

function TrakkoLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Three kanban columns */}
      <rect x="2" y="3" width="5" height="18" rx="1.5" stroke="#6366f1" strokeWidth="1.5" fill="none" />
      <rect x="9.5" y="3" width="5" height="12" rx="1.5" stroke="#6366f1" strokeWidth="1.5" fill="none" />
      <rect x="17" y="3" width="5" height="15" rx="1.5" stroke="#6366f1" strokeWidth="1.5" fill="none" />
      {/* Cards inside columns */}
      <rect x="3.25" y="5" width="2.5" height="2" rx="0.5" fill="#6366f1" opacity="0.6" />
      <rect x="3.25" y="9" width="2.5" height="2" rx="0.5" fill="#6366f1" opacity="0.6" />
      <rect x="3.25" y="13" width="2.5" height="2" rx="0.5" fill="#6366f1" opacity="0.6" />
      <rect x="10.75" y="5" width="2.5" height="2" rx="0.5" fill="#6366f1" opacity="0.6" />
      <rect x="10.75" y="9" width="2.5" height="2" rx="0.5" fill="#6366f1" opacity="0.6" />
      <rect x="18.25" y="5" width="2.5" height="2" rx="0.5" fill="#6366f1" opacity="0.6" />
    </svg>
  );
}
