import { useState, useEffect, useRef } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { useLabelStore } from '../../stores/labelStore';
import { AiPanel } from '../ai/AiPanel';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';
import { CalendarPicker } from '../shared/CalendarPicker';
import { formatDueDate, getDueDateStatus, getDueDateColor } from '../../utils/dateUtils';
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

const LABEL_COLORS = ['#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4', '#84cc16', '#f43f5e'];

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority | null>(task.priority);
  const [dueDate, setDueDate] = useState<string | null>(task.dueDate);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [previewMode, setPreviewMode] = useState(!!task.description);
  const [taskLabels, setTaskLabels] = useState<Label[]>(task.labels || []);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);

  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const archiveTask = useTaskStore((s) => s.archiveTask);

  const dueDateTriggerRef = useRef<HTMLButtonElement>(null);
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
      dueDate,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-surface-1 w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono">
            TRK-{task.taskNumber}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleArchive}
              className="w-7 h-7 flex items-center justify-center rounded-md text-text-tertiary hover:text-text-secondary hover:bg-surface-2 transition-colors"
              title="Archive"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12v1H2zM3 5v7.5a1.5 1.5 0 001.5 1.5h7a1.5 1.5 0 001.5-1.5V5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M6.5 8h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="w-7 h-7 flex items-center justify-center rounded-md text-text-tertiary hover:text-danger hover:bg-danger/10 transition-colors"
              title="Delete"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4v8.5a1.5 1.5 0 001.5 1.5h3a1.5 1.5 0 001.5-1.5V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors"
              title="Close"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left column — title + description */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="text-2xl font-bold bg-transparent border-none p-0 w-full text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-0"
                placeholder="Task title"
              />
              <div className="text-xs text-text-tertiary mt-2 flex gap-4">
                <span>Created {new Date(task.createdAt + 'Z').toLocaleDateString()}</span>
                <span>Updated {new Date(task.updatedAt + 'Z').toLocaleDateString()}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-text-secondary">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 4h10M3 8h7M3 12h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  <span className="text-xs font-medium">Description</span>
                </div>
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
                  className="w-full bg-surface-2/50 rounded-lg p-4 border border-border min-h-[120px] text-sm text-text-primary cursor-text"
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
                  rows={6}
                  autoFocus
                  className="w-full bg-surface-2/50 rounded-lg p-4 border border-border min-h-[120px] text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent resize-none"
                />
              )}
            </div>
          </div>

          {/* Right sidebar — metadata */}
          <div className="w-72 border-l border-border p-6 space-y-6 bg-surface-0/50 overflow-y-auto">
            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Priority — radio-style list */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-2">Priority</label>
              <div className="space-y-1">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setPriority(opt.value)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      priority === opt.value
                        ? 'bg-surface-2 text-text-primary'
                        : 'text-text-secondary hover:bg-surface-2/50 hover:text-text-primary'
                    }`}
                  >
                    {opt.color ? (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: opt.color,
                          boxShadow: priority === opt.value ? `0 0 6px ${opt.color}` : 'none',
                        }}
                      />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-border" />
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-2">Due Date</label>
              <div className="flex items-center gap-2">
                <button
                  ref={dueDateTriggerRef}
                  onClick={() => setShowCalendar(!showCalendar)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5 ${
                    dueDate
                      ? `bg-surface-2 ${getDueDateColor(getDueDateStatus(dueDate))}`
                      : 'bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3'
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  {dueDate ? formatDueDate(dueDate) : 'Set due date'}
                </button>
                {dueDate && (
                  <button
                    onClick={() => setDueDate(null)}
                    className="text-text-tertiary hover:text-text-primary text-xs transition-colors"
                  >
                    x
                  </button>
                )}
              </div>
              {showCalendar && (
                <CalendarPicker
                  value={dueDate}
                  onChange={(d) => setDueDate(d)}
                  onClose={() => setShowCalendar(false)}
                  triggerRef={dueDateTriggerRef}
                />
              )}
            </div>

            {/* Labels */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-2">Labels</label>
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
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="New label..."
                      className="w-full bg-surface-1 border border-border rounded px-2 py-1 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateLabel()}
                    />
                    <div className="flex items-center gap-1.5">
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
                </div>
              )}
            </div>

            {/* Save + Claude Code */}
            <div className="pt-2 space-y-2">
              <button
                onClick={handleSave}
                className="w-full px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors font-medium"
              >
                Save
              </button>
              <button
                onClick={() => setShowAi(true)}
                className="w-full px-4 py-2 text-sm text-accent hover:bg-surface-2 rounded-lg transition-colors"
              >
                Open Claude Code
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
