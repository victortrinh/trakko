import { useRef, useCallback } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { useTaskStore } from '../../stores/taskStore';
import { KanbanColumn } from './KanbanColumn';
import type { Task, TaskStatus } from '../../../shared/types';

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'Todo' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
];

export function KanbanBoard() {
  const tasks = useTaskStore((s) => s.tasks);
  const setTasks = useTaskStore((s) => s.setTasks);
  const moveTask = useTaskStore((s) => s.moveTask);
  const snapshotRef = useRef<Task[]>([]);

  // Group tasks by status into the shape @dnd-kit/helpers expects
  const getColumns = useCallback(() => {
    const columns: Record<string, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    for (const task of [...tasks].sort((a, b) => a.sortOrder - b.sortOrder)) {
      columns[task.status]?.push(task);
    }
    return columns;
  }, [tasks]);

  const columns = getColumns();

  const handleDragStart = () => {
    snapshotRef.current = [...tasks];
  };

  const handleDragOver = (event: Parameters<NonNullable<React.ComponentProps<typeof DragDropProvider>['onDragOver']>>[0]) => {
    const result = move(columns, event);
    // Flatten back to a tasks array with updated statuses
    const updated: Task[] = [];
    for (const [status, columnTasks] of Object.entries(result)) {
      for (let i = 0; i < (columnTasks as Task[]).length; i++) {
        updated.push({
          ...(columnTasks as Task[])[i],
          status: status as TaskStatus,
          sortOrder: i,
        });
      }
    }
    setTasks(updated);
  };

  const handleDragEnd = (event: Parameters<NonNullable<React.ComponentProps<typeof DragDropProvider>['onDragEnd']>>[0]) => {
    if (event.canceled) {
      setTasks(snapshotRef.current);
      return;
    }

    // Find what changed and persist
    const snapshot = snapshotRef.current;
    for (const task of tasks) {
      const original = snapshot.find((t) => t.id === task.id);
      if (original && (original.status !== task.status || original.sortOrder !== task.sortOrder)) {
        moveTask(task.id, task.status, task.sortOrder);
      }
    }
  };

  return (
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 gap-4 p-6 overflow-x-auto">
        {COLUMNS.map(({ status, label }) => (
          <KanbanColumn
            key={status}
            status={status}
            label={label}
            tasks={columns[status] || []}
          />
        ))}
      </div>
    </DragDropProvider>
  );
}
