import { useState, useRef, useEffect, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/react';
import { TaskCard } from './TaskCard';
import { useTaskStore } from '../../stores/taskStore';
import { useProjectStore } from '../../stores/projectStore';
import type { Task, TaskStatus } from '../../../shared/types';

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onCreateTask: (defaultStatus: TaskStatus) => void;
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-text-tertiary',
  in_progress: 'bg-accent',
  done: 'bg-success',
};

type SortOption = 'default' | 'priority' | 'dueDate';

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function KanbanColumn({ status, label, tasks, onCreateTask }: KanbanColumnProps) {
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const { ref, isDropTarget } = useDroppable({
    id: status,
    type: 'column',
    accept: 'item',
  });

  const bulkArchiveDone = useTaskStore((s) => s.bulkArchiveDone);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);

  const handleArchiveAll = async () => {
    if (activeProjectId && tasks.length > 0) {
      await bulkArchiveDone(activeProjectId);
    }
  };

  useEffect(() => {
    if (!showSortMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortMenu]);

  const sortedTasks = useMemo(() => {
    if (sortBy === 'default') return tasks;
    const sorted = [...tasks];
    if (sortBy === 'priority') {
      sorted.sort((a, b) => {
        const aOrder = a.priority ? PRIORITY_ORDER[a.priority] : 999;
        const bOrder = b.priority ? PRIORITY_ORDER[b.priority] : 999;
        return aOrder - bOrder;
      });
    } else if (sortBy === 'dueDate') {
      sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }
    return sorted;
  }, [tasks, sortBy]);

  return (
    <div className="flex flex-col flex-1 min-w-[280px] max-w-[420px]">
      <div className="group/header flex items-center gap-2 px-1 pb-3">
        <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
        <h3 className="text-sm font-medium text-text-secondary">{label}</h3>
        <span className="bg-surface-2 rounded-full px-1.5 text-xs text-text-tertiary">
          {tasks.length}
        </span>

        <div className="ml-auto flex items-center gap-1">
          {status === 'done' && tasks.length > 0 && (
            <button
              onClick={handleArchiveAll}
              className="text-[10px] text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Archive all
            </button>
          )}

          {/* Sort menu */}
          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="opacity-0 group-hover/header:opacity-100 w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-all text-sm"
            >
              &#x22EF;
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-7 z-50 w-44 bg-surface-2 border border-border rounded-lg shadow-xl py-1">
                <button
                  onClick={() => { setSortBy('priority'); setShowSortMenu(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    sortBy === 'priority'
                      ? 'text-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'
                  }`}
                >
                  Sort by priority
                </button>
                <button
                  onClick={() => { setSortBy('dueDate'); setShowSortMenu(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    sortBy === 'dueDate'
                      ? 'text-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'
                  }`}
                >
                  Sort by due date
                </button>
                {sortBy !== 'default' && (
                  <button
                    onClick={() => { setSortBy('default'); setShowSortMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-text-tertiary hover:text-text-primary hover:bg-surface-3 transition-colors border-t border-border mt-1 pt-1.5"
                  >
                    Reset sort
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Add task button */}
          <button
            onClick={() => onCreateTask(status)}
            className={`${status === 'todo' ? '' : 'opacity-0 group-hover/header:opacity-100'} w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-all text-sm`}
          >
            +
          </button>
        </div>
      </div>

      <div
        ref={ref}
        className={`flex flex-col gap-3 flex-1 p-1 rounded-lg transition-colors min-h-[100px] ${
          isDropTarget ? 'bg-surface-2/50' : ''
        }`}
      >
        {sortedTasks.map((task, index) => (
          <TaskCard key={task.id} task={task} index={index} column={status} />
        ))}

        {tasks.length === 0 && !isDropTarget && (
          <div className="flex items-center justify-center py-8 text-xs text-text-tertiary">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}
