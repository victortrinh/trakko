import { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useTaskStore } from '../../stores/taskStore';
import { useLabelStore } from '../../stores/labelStore';
import { CalendarPicker } from '../shared/CalendarPicker';
import { formatDueDate, getDueDateStatus, getDueDateColor } from '../../utils/dateUtils';
import type { TaskPriority, Label } from '../../../shared/types';

interface TaskCreateModalProps {
  onClose: () => void;
}

const PRIORITY_OPTIONS: { value: TaskPriority | null; label: string; color: string }[] = [
  { value: null, label: 'None', color: '' },
  { value: 'low', label: 'Low', color: 'var(--color-priority-low)' },
  { value: 'medium', label: 'Medium', color: 'var(--color-priority-medium)' },
  { value: 'high', label: 'High', color: 'var(--color-priority-high)' },
  { value: 'urgent', label: 'Urgent', color: 'var(--color-priority-urgent)' },
];

const LABEL_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4', '#84cc16', '#f43f5e'];

export function TaskCreateModal({ onClose }: TaskCreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);

  const dueDateTriggerRef = useRef<HTMLButtonElement>(null);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const createTask = useTaskStore((s) => s.createTask);

  const labels = useLabelStore((s) => s.labels);
  const fetchLabels = useLabelStore((s) => s.fetchLabels);
  const createLabel = useLabelStore((s) => s.createLabel);
  const addLabelToTask = useLabelStore((s) => s.addLabelToTask);

  useEffect(() => {
    if (activeProjectId) {
      fetchLabels(activeProjectId);
    }
  }, [activeProjectId]);

  const handleCreate = async () => {
    if (!title.trim() || !activeProjectId) return;
    const task = await createTask({
      projectId: activeProjectId,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate,
    });
    for (const label of selectedLabels) {
      await addLabelToTask(task.id, label.id);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  const handleAddLabel = (label: Label) => {
    if (!selectedLabels.find((l) => l.id === label.id)) {
      setSelectedLabels([...selectedLabels, label]);
    }
    setShowLabelPicker(false);
  };

  const handleRemoveLabel = (labelId: string) => {
    setSelectedLabels(selectedLabels.filter((l) => l.id !== labelId));
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim() || !activeProjectId) return;
    const label = await createLabel(activeProjectId, newLabelName.trim(), newLabelColor);
    setSelectedLabels([...selectedLabels, label]);
    setNewLabelName('');
    setShowLabelPicker(false);
  };

  const availableLabels = labels.filter((l) => !selectedLabels.find((sl) => sl.id === l.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-surface-1 border border-border rounded-xl p-6 w-full max-w-[520px] mx-4 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">New Task</h2>
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
              placeholder="Task title..."
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description... (supports Markdown)"
              rows={4}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent resize-none"
            />
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
            <label className="block text-xs text-text-secondary mb-1.5">Due Date</label>
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

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Labels</label>
            <div className="flex flex-wrap gap-1.5">
              {selectedLabels.map((label) => (
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

          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!title.trim()}
              className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
