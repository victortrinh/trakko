import { useState, useEffect, useMemo } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { DueDateBadge } from '../shared/DueDateBadge';
import { TaskDetail } from './TaskDetail';
import type { Task, TaskStatus, TaskPriority } from '../../../shared/types';

const STATUS_BADGE_CLASSES: Record<TaskStatus, string> = {
  todo: 'bg-text-tertiary/20 text-text-tertiary',
  in_progress: 'bg-accent/20 text-accent',
  done: 'bg-success/20 text-success',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
};

const PRIORITY_DOT_CLASSES: Record<TaskPriority, string> = {
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

export function InboxView() {
  const projects = useProjectStore((s) => s.projects);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of projects) {
      map[p.id] = p.name;
    }
    return map;
  }, [projects]);

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      try {
        const tasks = await window.electronAPI.tasks.listAll();
        setAllTasks(tasks);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [projects]);

  const inboxTasks = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA');
    return allTasks.filter(
      (t) => !t.archivedAt && t.dueDate && t.dueDate <= today && t.status !== 'done'
    );
  }, [allTasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseDetail = () => {
    setSelectedTask(null);
    // Refresh tasks after closing detail (in case of edits)
    window.electronAPI.tasks.listAll().then((tasks) => setAllTasks(tasks));
  };

  return (
    <div className="flex flex-col h-full bg-surface-0">
      {/* Header */}
      <div
        className="h-14 flex items-center px-6 border-b border-border bg-surface-0 shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <h2 className="text-base font-semibold text-text-primary">Inbox</h2>
        <span className="ml-3 text-xs text-text-tertiary">{inboxTasks.length} tasks</span>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-text-tertiary text-sm">
            Loading tasks...
          </div>
        ) : inboxTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-text-tertiary">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mb-3 opacity-50"
            >
              <path
                d="M4 8l3.7-3.7A2 2 0 019.1 3.6h5.8a2 2 0 011.4.6L20 8M4 8v10a2 2 0 002 2h12a2 2 0 002-2V8M4 8h5l1.5 2h3L15 8h5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm">Inbox is empty</span>
            <span className="text-xs mt-1">No overdue or due-today tasks</span>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider w-[40%]">
                  Title
                </th>
                <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider w-[20%]">
                  Project
                </th>
                <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider w-[12%]">
                  Status
                </th>
                <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider w-[12%]">
                  Priority
                </th>
                <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider w-[16%]">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody>
              {inboxTasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="border-b border-border bg-surface-1 hover:bg-surface-2 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-2.5 text-sm text-text-primary truncate max-w-0">
                    {task.title}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-text-secondary truncate max-w-0">
                    {projectMap[task.projectId] || 'Unknown'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE_CLASSES[task.status]}`}
                    >
                      {STATUS_LABELS[task.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {task.priority ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${PRIORITY_DOT_CLASSES[task.priority]}`}
                        />
                        <span className="text-xs text-text-secondary">
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-text-tertiary">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {task.dueDate ? (
                      <DueDateBadge dueDate={task.dueDate} />
                    ) : (
                      <span className="text-xs text-text-tertiary">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetail task={selectedTask} onClose={handleCloseDetail} />
      )}
    </div>
  );
}
