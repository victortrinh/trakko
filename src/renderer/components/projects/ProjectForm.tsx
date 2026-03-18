import { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import type { Project } from '../../../shared/types';

interface ProjectFormProps {
  project?: Project;
  onClose: () => void;
}

export function ProjectForm({ project, onClose }: ProjectFormProps) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [gitRepoPath, setGitRepoPath] = useState(project?.gitRepoPath || '');
  const createProject = useProjectStore((s) => s.createProject);
  const updateProject = useProjectStore((s) => s.updateProject);

  const isEditing = !!project;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing) {
      await updateProject({
        id: project.id,
        name: name.trim(),
        description: description.trim(),
        gitRepoPath: gitRepoPath.trim() || null,
      });
    } else {
      await createProject({
        name: name.trim(),
        description: description.trim(),
        gitRepoPath: gitRepoPath.trim() || null,
      });
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-surface-1 border border-border rounded-xl p-6 w-[420px] shadow-2xl">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          {isEditing ? 'Edit Project' : 'New Project'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              autoFocus
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Git Repository Path</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={gitRepoPath}
                onChange={(e) => setGitRepoPath(e.target.value)}
                placeholder="/path/to/repo (optional)"
                className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={async () => {
                  const path = await window.electronAPI.dialog.selectFolder();
                  if (path) setGitRepoPath(path);
                }}
                className="px-3 py-2 text-sm text-text-secondary bg-surface-2 border border-border rounded-lg hover:bg-surface-3 hover:text-text-primary transition-colors shrink-0"
              >
                Browse
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
