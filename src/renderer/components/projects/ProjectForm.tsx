import { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import type { Project } from '../../../shared/types';

interface ProjectFormProps {
  project?: Project;
  onClose: () => void;
}

const PROJECT_COLORS = ['#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4', '#84cc16', '#f43f5e'];
const PROJECT_ICONS = ['🚀', '🐛', '⭐', '📁', '📚', '⚡', '❤️', '🎯', '🌐', '💻', '🎨', '🎵'];

export function ProjectForm({ project, onClose }: ProjectFormProps) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [gitRepoPath, setGitRepoPath] = useState(project?.gitRepoPath || '');
  const [selectedColor, setSelectedColor] = useState(project?.color || PROJECT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(project?.icon || null);
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
        color: selectedColor,
        icon: selectedIcon,
      });
    } else {
      await createProject({
        name: name.trim(),
        description: description.trim(),
        gitRepoPath: gitRepoPath.trim() || null,
        color: selectedColor,
        icon: selectedIcon,
      });
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-[rgba(20,20,20,0.8)] backdrop-blur-[12px] border border-white/10 rounded-xl p-6 w-[420px] shadow-2xl">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          {isEditing ? 'Edit Project' : 'Create new project'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Name</label>
            <div className="relative">
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedColor }}
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                autoFocus
                className="w-full bg-surface-2 border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Color</label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full transition-all ${
                    selectedColor === color
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-1'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Icon</label>
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedIcon(null)}
                className={`w-8 h-8 rounded-lg text-xs transition-all flex items-center justify-center ${
                  selectedIcon === null
                    ? 'bg-surface-3 ring-1 ring-accent'
                    : 'bg-surface-2 hover:bg-surface-3 text-text-tertiary'
                }`}
              >
                -
              </button>
              {PROJECT_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-8 h-8 rounded-lg text-base transition-all flex items-center justify-center ${
                    selectedIcon === icon
                      ? 'bg-surface-3 ring-1 ring-accent'
                      : 'bg-surface-2 hover:bg-surface-3'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
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
              {isEditing ? 'Save' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
