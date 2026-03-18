import { useState } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { AiPanel } from '../ai/AiPanel';
import type { Task, TaskStatus } from '../../../shared/types';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [showAi, setShowAi] = useState(false);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);

  const handleSave = async () => {
    await updateTask({
      id: task.id,
      title: title.trim() || task.title,
      description: description.trim(),
      status,
    });
    onClose();
  };

  const handleDelete = async () => {
    if (confirm('Delete this task?')) {
      await deleteTask(task.id);
      onClose();
    }
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
      <div className="bg-surface-1 border border-border rounded-xl p-6 w-[480px] shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Task Details</h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors text-lg leading-none"
          >
            x
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={4}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Status</label>
            <div className="flex gap-1">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    status === opt.value
                      ? 'bg-accent text-white'
                      : 'bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-text-tertiary flex gap-4">
            <span>Created: {new Date(task.createdAt + 'Z').toLocaleDateString()}</span>
            <span>Updated: {new Date(task.updatedAt + 'Z').toLocaleDateString()}</span>
          </div>

          <div className="flex justify-between mt-2">
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="px-3 py-2 text-sm text-danger hover:bg-surface-2 rounded-lg transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowAi(true)}
                className="px-3 py-2 text-sm text-accent hover:bg-surface-2 rounded-lg transition-colors"
              >
                Delegate to AI
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAi && (
        <AiPanel task={task} onClose={() => setShowAi(false)} />
      )}
    </div>
  );
}
