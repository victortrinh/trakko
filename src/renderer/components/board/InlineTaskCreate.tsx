import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useTaskStore } from '../../stores/taskStore';
import { useLabelStore } from '../../stores/labelStore';
import { CalendarPicker } from '../shared/CalendarPicker';
import { formatDueDate, getDueDateStatus, getDueDateColor } from '../../utils/dateUtils';
import type { TaskPriority, Label } from '../../../shared/types';

const PRIORITY_OPTIONS: { value: TaskPriority | null; label: string; color: string }[] = [
  { value: null, label: 'None', color: '' },
  { value: 'low', label: 'Low', color: 'var(--color-priority-low)' },
  { value: 'medium', label: 'Med', color: 'var(--color-priority-medium)' },
  { value: 'high', label: 'High', color: 'var(--color-priority-high)' },
  { value: 'urgent', label: 'Urg', color: 'var(--color-priority-urgent)' },
];

const LABEL_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4', '#84cc16', '#f43f5e'];

export function InlineTaskCreate() {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedLabelIds, setSelectedLabelIds] = useState<Set<string>>(new Set());
  const [showNewLabel, setShowNewLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dueDateTriggerRef = useRef<HTMLButtonElement>(null);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const createTask = useTaskStore((s) => s.createTask);

  const labels = useLabelStore((s) => s.labels);
  const fetchLabels = useLabelStore((s) => s.fetchLabels);
  const createLabel = useLabelStore((s) => s.createLabel);
  const addLabelToTask = useLabelStore((s) => s.addLabelToTask);

  useEffect(() => {
    if (isCreating) {
      inputRef.current?.focus();
      if (activeProjectId) {
        fetchLabels(activeProjectId);
      }
    }
  }, [isCreating]);

  useEffect(() => {
    if (!isCreating) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleCancel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCreating]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority(null);
    setDueDate(null);
    setShowCalendar(false);
    setSelectedLabelIds(new Set());
    setShowNewLabel(false);
    setNewLabelName('');
    setNewLabelColor(LABEL_COLORS[0]);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !activeProjectId) return;
    const task = await createTask({
      projectId: activeProjectId,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate,
    });
    for (const labelId of selectedLabelIds) {
      await addLabelToTask(task.id, labelId);
    }
    resetForm();
    inputRef.current?.focus();
  };

  const handleCancel = () => {
    setIsCreating(false);
    resetForm();
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleDescKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds((prev) => {
      const next = new Set(prev);
      if (next.has(labelId)) {
        next.delete(labelId);
      } else {
        next.add(labelId);
      }
      return next;
    });
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim() || !activeProjectId) return;
    const label = await createLabel(activeProjectId, newLabelName.trim(), newLabelColor);
    setSelectedLabelIds((prev) => new Set(prev).add(label.id));
    setNewLabelName('');
    setShowNewLabel(false);
  };

  if (!isCreating) {
    return (
      <button
        onClick={() => setIsCreating(true)}
        className="mt-2 px-3 py-2 text-sm text-text-tertiary hover:text-text-secondary hover:bg-surface-2 rounded-lg transition-colors text-left w-full"
      >
        + Add task
      </button>
    );
  }

  return (
    <div ref={containerRef} className="mt-2 bg-surface-1 border border-border rounded-lg p-3 flex flex-col gap-2.5">
      {/* Title */}
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleTitleKeyDown}
        placeholder="Task title..."
        className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
      />

      {/* Description */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={handleDescKeyDown}
        placeholder="Description (supports Markdown)"
        rows={2}
        className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent resize-none"
      />

      {/* Priority */}
      <div>
        <label className="block text-xs text-text-secondary mb-1">Priority</label>
        <div className="flex gap-1">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setPriority(opt.value)}
              className={`px-2 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${
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

      {/* Due Date */}
      <div>
        <label className="block text-xs text-text-secondary mb-1">Due Date</label>
        <div className="flex items-center gap-1.5">
          <button
            ref={dueDateTriggerRef}
            onClick={() => setShowCalendar(!showCalendar)}
            className={`px-2 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${
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
            {dueDate ? formatDueDate(dueDate) : 'Set date'}
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
        <label className="block text-xs text-text-secondary mb-1">Labels</label>
        <div className="flex flex-wrap gap-1">
          {labels.map((label) => (
            <button
              key={label.id}
              onClick={() => toggleLabel(label.id)}
              className={`px-2 py-0.5 text-xs rounded-full transition-opacity ${
                selectedLabelIds.has(label.id) ? 'ring-1 ring-white/50' : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                backgroundColor: label.color + '22',
                color: label.color,
              }}
            >
              {label.name}
            </button>
          ))}
          <button
            onClick={() => setShowNewLabel(!showNewLabel)}
            className="px-2 py-0.5 text-xs text-text-tertiary hover:text-text-secondary hover:bg-surface-2 rounded-full transition-colors"
          >
            + New
          </button>
        </div>

        {showNewLabel && (
          <div className="mt-1.5 flex gap-1.5 items-center">
            <input
              type="text"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="Label name..."
              className="flex-1 bg-surface-2 border border-border rounded px-2 py-1 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateLabel()}
            />
            <div className="flex gap-0.5">
              {LABEL_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewLabelColor(c)}
                  className={`w-3.5 h-3.5 rounded-full ${newLabelColor === c ? 'ring-1 ring-white ring-offset-1 ring-offset-surface-1' : ''}`}
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
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-0.5">
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-2 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="px-3 py-1.5 text-xs bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          Create
        </button>
      </div>
    </div>
  );
}
