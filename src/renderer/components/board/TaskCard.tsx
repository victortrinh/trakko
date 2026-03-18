import { useState } from 'react';
import { useSortable } from '@dnd-kit/react/sortable';
import type { Task, TaskStatus, TaskPriority } from '../../../shared/types';
import { TaskDetail } from '../tasks/TaskDetail';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';

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

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function TaskCard({ task, index, column }: TaskCardProps) {
  const [showDetail, setShowDetail] = useState(false);
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

  return (
    <>
      <div
        ref={ref}
        onClick={() => !isDragSource && setShowDetail(true)}
        className={`bg-surface-1 border border-border rounded-lg p-3 cursor-pointer
          hover:border-border-hover hover:bg-surface-2 transition-all
          ${isDragSource ? 'opacity-50 shadow-lg scale-[1.02]' : ''}`}
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          {task.priority && (
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_COLORS[task.priority]}`}
              title={PRIORITY_LABELS[task.priority]}
            />
          )}
          <p className="text-sm text-text-primary font-medium leading-snug">{task.title}</p>
        </div>
        {task.description && (
          <div className="text-xs text-text-tertiary mt-1 line-clamp-2">
            <MarkdownRenderer content={task.description} compact />
          </div>
        )}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {task.labels.map((label) => (
              <span
                key={label.id}
                className="inline-block px-1.5 py-0.5 text-[10px] rounded-full font-medium"
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

      {showDetail && (
        <TaskDetail task={task} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}
