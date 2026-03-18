import { useState, useEffect } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { useLabelStore } from '../../stores/labelStore';
import { AiPanel } from '../ai/AiPanel';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';
import type { Task, TaskStatus, TaskPriority, Label } from '../../../shared/types';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS: { value: TaskPriority | null; label: string; color: string }[] = [
  { value: null, label: 'None', color: '' },
  { value: 'low', label: 'Low', color: 'var(--color-priority-low)' },
  { value: 'medium', label: 'Medium', color: 'var(--color-priority-medium)' },
  { value: 'high', label: 'High', color: 'var(--color-priority-high)' },
  { value: 'urgent', label: 'Urgent', color: 'var(--color-priority-urgent)' },
];

const LABEL_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4', '#84cc16', '#f43f5e'];

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority | null>(task.priority);
  const [showAi, setShowAi] = useState(false);
  const [previewMode, setPreviewMode] = useState(!!task.description);
  const [taskLabels, setTaskLabels] = useState<Label[]>(task.labels || []);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);

  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const archiveTask = useTaskStore((s) => s.archiveTask);

  const labels = useLabelStore((s) => s.labels);
  const fetchLabels = useLabelStore((s) => s.fetchLabels);
  const createLabel = useLabelStore((s) => s.createLabel);
  const addLabelToTask = useLabelStore((s) => s.addLabelToTask);
  const removeLabelFromTask = useLabelStore((s) => s.removeLabelFromTask);

  useEffect(() => {
    fetchLabels(task.projectId);
  }, [task.projectId]);

  const handleSave = async () => {
    await updateTask({
      id: task.id,
      title: title.trim() || task.title,
      description: description.trim(),
      status,
      priority,
    });
    onClose();
  };

  const handleDelete = async () => {
    if (confirm('Delete this task?')) {
      await deleteTask(task.id);
      onClose();
    }
  };

  const handleArchive = async () => {
    await archiveTask(task.id);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  const handleAddLabel = async (label: Label) => {
    if (!taskLabels.find((l) => l.id === label.id)) {
      await addLabelToTask(task.id, label.id);
      setTaskLabels([...taskLabels, label]);
    }
    setShowLabelPicker(false);
  };

  const handleRemoveLabel = async (labelId: string) => {
    await removeLabelFromTask(task.id, labelId);
    setTaskLabels(taskLabels.filter((l) => l.id !== labelId));
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    const label = await createLabel(task.projectId, newLabelName.trim(), newLabelColor);
    await addLabelToTask(task.id, label.id);
    setTaskLabels([...taskLabels, label]);
    setNewLabelName('');
    setShowLabelPicker(false);
  };

  const availableLabels = labels.filter((l) => !taskLabels.find((tl) => tl.id === l.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-surface-1 border border-border rounded-xl p-6 w-[520px] shadow-2xl max-h-[85vh] overflow-y-auto">
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs text-text-secondary">Description</label>
              <div className="flex gap-1">
                <button
                  onClick={() => setPreviewMode(false)}
                  className={`px-2 py-0.5 text-[10px] rounded ${!previewMode ? 'bg-surface-3 text-text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}
                >
                  Write
                </button>
                <button
                  onClick={() => setPreviewMode(true)}
                  className={`px-2 py-0.5 text-[10px] rounded ${previewMode ? 'bg-surface-3 text-text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}
                >
                  Preview
                </button>
              </div>
            </div>
            {previewMode ? (
              <div
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary min-h-[96px] cursor-text"
                onClick={() => setPreviewMode(false)}
              >
                {description ? (
                  <MarkdownRenderer content={description} />
                ) : (
                  <span className="text-text-tertiary">Add a description...</span>
                )}
              </div>
            ) : (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description... (supports Markdown)"
                rows={4}
                autoFocus
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent resize-none"
              />
            )}
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

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Priority</label>
            <div className="flex gap-1">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setPriority(opt.value)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5 ${
                    priority === opt.value
                      ? 'bg-accent text-white'
                      : 'bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3'
                  }`}
                >
                  {opt.color && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: opt.color }}
                    />
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Labels</label>
            <div className="flex flex-wrap gap-1.5">
              {taskLabels.map((label) => (
                <span
                  key={label.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
                  style={{
                    backgroundColor: label.color + '22',
                    color: label.color,
                  }}
                >
                  {label.name}
                  <button
                    onClick={() => handleRemoveLabel(label.id)}
                    className="hover:opacity-70 text-[10px] leading-none"
                  >
                    x
                  </button>
                </span>
              ))}
              <button
                onClick={() => setShowLabelPicker(!showLabelPicker)}
                className="px-2 py-0.5 text-xs text-text-tertiary hover:text-text-secondary hover:bg-surface-2 rounded-full transition-colors"
              >
                + Add
              </button>
            </div>

            {showLabelPicker && (
              <div className="mt-2 bg-surface-2 border border-border rounded-lg p-2">
                {availableLabels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {availableLabels.map((label) => (
                      <button
                        key={label.id}
                        onClick={() => handleAddLabel(label)}
                        className="px-2 py-0.5 text-xs rounded-full hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: label.color + '22',
                          color: label.color,
                        }}
                      >
                        {label.name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="New label..."
                    className="flex-1 bg-surface-1 border border-border rounded px-2 py-1 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateLabel()}
                  />
                  <div className="flex gap-0.5">
                    {LABEL_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewLabelColor(c)}
                        className={`w-4 h-4 rounded-full ${newLabelColor === c ? 'ring-1 ring-white ring-offset-1 ring-offset-surface-2' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleCreateLabel}
                    disabled={!newLabelName.trim()}
                    className="px-2 py-1 text-[10px] bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
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
              {status === 'done' && (
                <button
                  onClick={handleArchive}
                  className="px-3 py-2 text-sm text-text-secondary hover:bg-surface-2 rounded-lg transition-colors"
                >
                  Archive
                </button>
              )}
              <button
                onClick={() => setShowAi(true)}
                className="px-3 py-2 text-sm text-accent hover:bg-surface-2 rounded-lg transition-colors"
              >
                Open Claude Code
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
