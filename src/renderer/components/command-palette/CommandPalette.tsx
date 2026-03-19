import { useState, useEffect, useRef, useCallback } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useTaskStore } from '../../stores/taskStore';
import type { Project, TaskSearchResult } from '../../../shared/types';

interface CommandPaletteProps {
  onClose: () => void;
}

type ResultItem =
  | { type: 'project'; project: Project }
  | { type: 'task'; task: TaskSearchResult }
  | { type: 'action'; label: string; action: () => void };

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const projects = useProjectStore((s) => s.projects);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const tasks = useTaskStore((s) => s.tasks);
  const [showNewProject, setShowNewProject] = useState(false);

  // Build results
  useEffect(() => {
    const items: ResultItem[] = [];
    const q = query.toLowerCase().trim();

    if (!q) {
      // Show projects + actions when empty
      projects.forEach((p) => items.push({ type: 'project', project: p }));
      items.push({ type: 'action', label: 'New Project', action: () => setShowNewProject(true) });
    } else {
      // Filter projects
      projects
        .filter((p) => p.name.toLowerCase().includes(q))
        .forEach((p) => items.push({ type: 'project', project: p }));

      // Filter current project tasks locally
      tasks
        .filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
        .slice(0, 10)
        .forEach((t) => items.push({
          type: 'task',
          task: { ...t, projectName: projects.find((p) => p.id === t.projectId)?.name || '' },
        }));

      // Cross-project search via IPC
      const searchRemote = async () => {
        if (q.length >= 2) {
          const remote = await window.electronAPI.search.tasks(q);
          // Dedupe with local results
          const localIds = new Set(items.filter((i) => i.type === 'task').map((i) => (i as { task: TaskSearchResult }).task.id));
          const newResults = remote.filter((t) => !localIds.has(t.id)).slice(0, 5);
          if (newResults.length > 0) {
            setResults((prev) => [
              ...prev,
              ...newResults.map((t) => ({ type: 'task' as const, task: t })),
            ]);
          }
        }
      };
      searchRemote();

      // Actions
      if ('new project'.includes(q)) {
        items.push({ type: 'action', label: 'New Project', action: () => setShowNewProject(true) });
      }
    }

    setResults(items);
    setSelectedIndex(0);
  }, [query, projects, tasks, setShowNewProject]);

  const handleSelect = useCallback(
    (item: ResultItem) => {
      switch (item.type) {
        case 'project':
          setActiveProject(item.project.id);
          onClose();
          break;
        case 'task':
          setActiveProject(item.task.projectId);
          onClose();
          break;
        case 'action':
          item.action();
          onClose();
          break;
      }
    },
    [setActiveProject, onClose]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'todo':
        return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="#666666" strokeWidth="1.3"/></svg>;
      case 'in_progress':
        return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="#3b82f6" strokeWidth="1.3"/><path d="M8 4v4l2.5 1.5" stroke="#3b82f6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
      case 'done':
        return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="#22c55e" strokeWidth="1.3"/><path d="M5.5 8l1.75 1.75L10.5 6.5" stroke="#22c55e" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
      default:
        return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="#666666" strokeWidth="1.3"/></svg>;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-1 border border-border rounded-xl w-[520px] shadow-2xl overflow-hidden">
        <div className="p-3 border-b border-border">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, projects, or actions..."
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
        </div>

        <div className="max-h-[320px] overflow-y-auto py-1">
          {results.length === 0 && query && (
            <div className="px-3 py-6 text-center text-xs text-text-tertiary">
              No results found
            </div>
          )}
          {results.map((item, index) => (
            <button
              key={`${item.type}-${index}`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-3 py-2 flex items-center gap-3 text-sm transition-colors ${
                index === selectedIndex
                  ? 'bg-surface-3 text-text-primary'
                  : 'text-text-secondary hover:bg-surface-2'
              }`}
            >
              {item.type === 'project' && (
                <>
                  <span className="text-accent text-xs w-5 text-center">#</span>
                  <span className="truncate">{item.project.name}</span>
                  <span className="ml-auto text-xs text-text-tertiary">Project</span>
                </>
              )}
              {item.type === 'task' && (
                <>
                  <span className="flex w-5 justify-center"><StatusIcon status={item.task.status} /></span>
                  <span className="truncate">{item.task.title}</span>
                  <span className="ml-auto text-xs text-text-tertiary truncate max-w-[120px]">
                    {item.task.projectName}
                  </span>
                </>
              )}
              {item.type === 'action' && (
                <>
                  <span className="text-xs w-5 text-center">+</span>
                  <span className="truncate">{item.label}</span>
                  <span className="ml-auto text-xs text-text-tertiary">Action</span>
                </>
              )}
            </button>
          ))}
        </div>

        <div className="px-3 py-2 border-t border-border flex gap-3 text-[10px] text-text-tertiary">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>esc Close</span>
        </div>
      </div>
    </div>
  );
}
