import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useTaskStore } from '../../stores/taskStore';

export function InlineTaskCreate() {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const createTask = useTaskStore((s) => s.createTask);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleSubmit = async () => {
    if (!title.trim() || !activeProjectId) return;
    await createTask({ projectId: activeProjectId, title: title.trim() });
    setTitle('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setTitle('');
    }
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
    <div className="mt-2">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!title.trim()) setIsCreating(false);
        }}
        placeholder="Task title..."
        className="w-full bg-surface-1 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
      />
    </div>
  );
}
