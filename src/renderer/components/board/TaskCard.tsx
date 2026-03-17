import { useState } from 'react';
import { useSortable } from '@dnd-kit/react/sortable';
import type { Task, TaskStatus } from '../../../shared/types';
import { TaskDetail } from '../tasks/TaskDetail';

interface TaskCardProps {
  task: Task;
  index: number;
  column: TaskStatus;
}

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
        <p className="text-sm text-text-primary font-medium leading-snug">{task.title}</p>
        {task.description && (
          <p className="text-xs text-text-tertiary mt-1 line-clamp-2">{task.description}</p>
        )}
      </div>

      {showDetail && (
        <TaskDetail task={task} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}
