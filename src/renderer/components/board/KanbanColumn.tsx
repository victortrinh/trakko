import { useDroppable } from '@dnd-kit/react';
import { TaskCard } from './TaskCard';
import { InlineTaskCreate } from './InlineTaskCreate';
import { useTaskStore } from '../../stores/taskStore';
import { useProjectStore } from '../../stores/projectStore';
import type { Task, TaskStatus } from '../../../shared/types';

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-text-tertiary',
  in_progress: 'bg-accent',
  done: 'bg-success',
};

export function KanbanColumn({ status, label, tasks }: KanbanColumnProps) {
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

  return (
    <div className="flex flex-col w-72 min-w-[288px] shrink-0">
      <div className="flex items-center gap-2 px-1 pb-3">
        <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
        <h3 className="text-sm font-medium text-text-secondary">{label}</h3>
        <span className="text-xs text-text-tertiary">{tasks.length}</span>
        {status === 'done' && tasks.length > 0 && (
          <button
            onClick={handleArchiveAll}
            className="ml-auto text-[10px] text-text-tertiary hover:text-text-secondary transition-colors"
          >
            Archive all
          </button>
        )}
      </div>

      <div
        ref={ref}
        className={`flex flex-col gap-2 flex-1 p-1 rounded-lg transition-colors min-h-[100px] ${
          isDropTarget ? 'bg-surface-2/50' : ''
        }`}
      >
        {tasks.map((task, index) => (
          <TaskCard key={task.id} task={task} index={index} column={status} />
        ))}

        {tasks.length === 0 && !isDropTarget && (
          <div className="flex items-center justify-center py-8 text-xs text-text-tertiary">
            No tasks
          </div>
        )}

        {status === 'todo' && <InlineTaskCreate />}
      </div>
    </div>
  );
}
