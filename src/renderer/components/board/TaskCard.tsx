import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSortable } from '@dnd-kit/react/sortable';
import type { Task, TaskStatus, TaskPriority } from '../../../shared/types';
import { TaskDetail } from '../tasks/TaskDetail';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';
import { formatDueDate } from '../../utils/dateUtils';
import { useTaskStore } from '../../stores/taskStore';

interface TaskCardProps {
  task: Task;
  index: number;
  column: TaskStatus;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: 'bg-priority-urgent',
  high: 'bg-priority-high',
  medium: 'bg-priority-medium',
  low: 'bg-priority-low',
};

const PRIORITY_TEXT_COLORS: Record<TaskPriority, string> = {
  urgent: 'text-priority-urgent',
  high: 'text-priority-high',
  medium: 'text-priority-medium',
  low: 'text-priority-low',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function TaskCard({ task, index, column }: TaskCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const archiveTask = useTaskStore((s) => s.archiveTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const { ref, isDragSource } = useSortable({
    id: task.id,
    index,
    group: column,
    type: 'item',
    accept: 'item',
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        menuButtonRef.current && !menuButtonRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    await archiveTask(task.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    await deleteTask(task.id);
  };

  return (
    <>
      <div
        ref={ref}
        onClick={() => !isDragSource && setShowDetail(true)}
        className={`group relative bg-surface-1 border border-border rounded-xl p-5 cursor-pointer overflow-hidden
          hover:border-border-hover hover:bg-surface-2 transition-all
          ${isDragSource ? 'opacity-50 shadow-lg scale-[1.02]' : ''}`}
      >
        {/* Three-dot menu button */}
        <div className="absolute top-4 right-4">
          <button
            ref={menuButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              if (!showMenu && menuButtonRef.current) {
                const rect = menuButtonRef.current.getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 4, left: rect.right - 144 });
              }
              setShowMenu(!showMenu);
            }}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-text-primary hover:bg-surface-3 transition-all text-sm"
          >
            &#x22EF;
          </button>
        </div>

        {/* Top row: priority label + due date */}
        {(task.priority || task.dueDate) && (
          <div className="flex items-center justify-between mb-3">
            {task.priority ? (
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_COLORS[task.priority]}`} />
                <span className={`text-[11px] font-bold uppercase tracking-wide ${PRIORITY_TEXT_COLORS[task.priority]}`}>
                  {PRIORITY_LABELS[task.priority]}
                </span>
              </div>
            ) : (
              <div />
            )}
            {task.dueDate && (
              <span className="text-xs text-text-tertiary">{formatDueDate(task.dueDate)}</span>
            )}
          </div>
        )}

        {/* Title */}
        <p className="text-[15px] text-text-primary font-semibold leading-snug break-words min-w-0">
          {task.title}
        </p>

        {/* Description */}
        {task.description && (
          <div className="text-sm text-text-secondary mt-2 line-clamp-2">
            <MarkdownRenderer content={task.description} compact />
          </div>
        )}

        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {task.labels.map((label) => (
              <span
                key={label.id}
                className="inline-block px-2 py-0.5 text-[10px] rounded-full font-medium"
                style={{
                  backgroundColor: label.color + '22',
                  color: label.color,
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {showMenu && menuPos && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] w-36 bg-surface-2 border border-border rounded-lg shadow-xl py-1"
          style={{ top: menuPos.top, left: menuPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleArchive}
            className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
          >
            Archive
          </button>
          <button
            onClick={handleDelete}
            className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-surface-3 transition-colors"
          >
            Delete
          </button>
        </div>,
        document.body
      )}

      {showDetail && (
        <TaskDetail task={task} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}
