import { useState, useEffect, useMemo, useRef } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useTaskStore } from '../../stores/taskStore';
import { DueDateBadge } from '../shared/DueDateBadge';
import { TaskDetail } from './TaskDetail';
import type { Task, TaskStatus, TaskPriority } from '../../../shared/types';

const STATUS_GROUPS: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'Todo' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS: { value: TaskPriority | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

type DueDateFilterValue = 'overdue' | 'today' | 'this_week' | 'no_date' | null;

const DUE_DATE_OPTIONS: { value: DueDateFilterValue; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'no_date', label: 'No Date' },
];

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

const STATUS_ICON_COLORS: Record<TaskStatus, string> = {
  todo: 'text-text-tertiary',
  in_progress: 'text-accent',
  done: 'text-success',
};

function StatusIcon({ status, size = 14 }: { status: TaskStatus; size?: number }) {
  const color = STATUS_ICON_COLORS[status];

  switch (status) {
    case 'todo':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={`flex-shrink-0 ${color}`}>
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'in_progress':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={`flex-shrink-0 ${color}`}>
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 1.5A6.5 6.5 0 0 1 14.5 8H8V1.5Z" fill="currentColor" />
        </svg>
      );
    case 'done':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={`flex-shrink-0 ${color}`}>
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" />
          <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

function getTodayStr(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getEndOfWeek(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const endOfWeek = new Date(date);
  endOfWeek.setDate(date.getDate() + daysUntilSunday);
  const yyyy = endOfWeek.getFullYear();
  const mm = String(endOfWeek.getMonth() + 1).padStart(2, '0');
  const dd = String(endOfWeek.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function RowMenu({
  task,
  onViewDetails,
}: {
  task: Task;
  onViewDetails: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const archiveTask = useTaskStore((s) => s.archiveTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-surface-2 transition-all text-text-tertiary hover:text-text-secondary"
      >
        <span className="text-sm leading-none">&#x22EF;</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-surface-1 border border-border rounded-lg shadow-xl z-50 py-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onViewDetails();
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-2 transition-colors"
          >
            View details
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              archiveTask(task.id);
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-2 transition-colors"
          >
            Archive
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              deleteTask(task.id);
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-surface-2 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function MyTasksView() {
  const projects = useProjectStore((s) => s.projects);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<TaskStatus>>(new Set());
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | null>(null);
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilterValue>(null);

  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of projects) {
      map[p.id] = p.name;
    }
    return map;
  }, [projects]);

  useEffect(() => {
    async function fetchAllTasks() {
      setLoading(true);
      try {
        const taskArrays = await Promise.all(
          projects.map((p) => window.electronAPI.tasks.listByProject(p.id))
        );
        setAllTasks(taskArrays.flat());
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setLoading(false);
      }
    }

    if (projects.length > 0) {
      fetchAllTasks();
    } else {
      setAllTasks([]);
      setLoading(false);
    }
  }, [projects]);

  const filteredTasks = useMemo(() => {
    let tasks = allTasks.filter((t) => !t.archivedAt);
    if (statusFilter) {
      tasks = tasks.filter((t) => t.status === statusFilter);
    }
    if (priorityFilter) {
      tasks = tasks.filter((t) => t.priority === priorityFilter);
    }
    if (dueDateFilter) {
      const today = getTodayStr();
      if (dueDateFilter === 'overdue') {
        tasks = tasks.filter((t) => t.dueDate && t.dueDate < today);
      } else if (dueDateFilter === 'today') {
        tasks = tasks.filter((t) => t.dueDate && t.dueDate === today);
      } else if (dueDateFilter === 'this_week') {
        const endOfWeek = getEndOfWeek(today);
        tasks = tasks.filter((t) => t.dueDate && t.dueDate <= endOfWeek);
      } else if (dueDateFilter === 'no_date') {
        tasks = tasks.filter((t) => !t.dueDate);
      }
    }
    return tasks;
  }, [allTasks, statusFilter, priorityFilter, dueDateFilter]);

  const groupedTasks = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    for (const task of filteredTasks) {
      groups[task.status].push(task);
    }
    return groups;
  }, [filteredTasks]);

  const toggleGroup = (status: TaskStatus) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseDetail = () => {
    setSelectedTask(null);
    // Refresh tasks after closing detail (in case of edits)
    if (projects.length > 0) {
      Promise.all(
        projects.map((p) => window.electronAPI.tasks.listByProject(p.id))
      ).then((taskArrays) => setAllTasks(taskArrays.flat()));
    }
  };

  const visibleGroups = statusFilter
    ? STATUS_GROUPS.filter((g) => g.key === statusFilter)
    : STATUS_GROUPS;

  return (
    <div className="flex flex-col h-full bg-surface-0">
      {/* Header */}
      <div className="h-14 flex items-center px-6 border-b border-border bg-surface-0 shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <h2 className="text-base font-semibold text-text-primary">My Tasks</h2>
        <span className="ml-3 text-xs text-text-tertiary">{filteredTasks.length} tasks</span>
      </div>

      {/* Filter bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-6 py-3 border-b border-border bg-surface-0">
        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          Status
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              statusFilter === null
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:bg-surface-2'
            }`}
          >
            All
          </button>
          {STATUS_GROUPS.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(statusFilter === s.key ? null : s.key)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                statusFilter === s.key
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-surface-2'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          Priority
        </span>
        <div className="flex items-center gap-1">
          {PRIORITY_OPTIONS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPriorityFilter(priorityFilter === p.value ? null : p.value)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                priorityFilter === p.value
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-surface-2'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          Due Date
        </span>
        <div className="flex items-center gap-1">
          {DUE_DATE_OPTIONS.map((d) => (
            <button
              key={d.label}
              onClick={() => setDueDateFilter(dueDateFilter === d.value ? null : d.value)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                dueDateFilter === d.value
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-surface-2'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-text-tertiary text-sm">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-text-tertiary text-sm">
            No tasks found
          </div>
        ) : (
          visibleGroups.map((group, groupIndex) => {
            const tasks = groupedTasks[group.key];
            if (tasks.length === 0) return null;
            const isCollapsed = collapsedGroups.has(group.key);

            return (
              <div key={group.key}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.key)}
                  className={`flex items-center gap-2 mb-3 ${groupIndex > 0 ? 'mt-0' : ''}`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className={`text-text-tertiary transition-transform ${
                      isCollapsed ? '-rotate-90' : ''
                    }`}
                  >
                    <path
                      d="M4 6l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <StatusIcon status={group.key} size={14} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    {group.label}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-2 text-text-tertiary">
                    {tasks.length}
                  </span>
                </button>

                {/* Task rows in card container */}
                {!isCollapsed && (
                  <div className="bg-surface-1 rounded-xl border border-border overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="px-6 py-3 text-[10px] font-medium text-text-tertiary uppercase tracking-wider w-1/2">
                            Task Name
                          </th>
                          <th className="px-4 py-3 text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                            Project
                          </th>
                          <th className="px-4 py-3 text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="px-4 py-3 text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-2 py-3 w-10" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {tasks.map((task) => (
                          <tr
                            key={task.id}
                            onClick={() => handleTaskClick(task)}
                            className="group hover:bg-white/[0.02] cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 text-sm font-medium text-text-primary truncate max-w-0 hover:text-accent">
                              {task.title}
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-xs px-2 py-1 rounded bg-surface-2 text-text-secondary">
                                {projectMap[task.projectId] || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              {task.priority ? (
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`w-2 h-2 rounded-full ${PRIORITY_DOT_CLASSES[task.priority]}`}
                                    style={task.priority === 'urgent' ? { boxShadow: '0 0 8px rgba(239,68,68,0.5)' } : undefined}
                                  />
                                  <span className="text-xs text-text-secondary">
                                    {PRIORITY_LABELS[task.priority]}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-text-tertiary">-</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {task.dueDate ? (
                                <DueDateBadge dueDate={task.dueDate} />
                              ) : (
                                <span className="text-xs text-text-tertiary">-</span>
                              )}
                            </td>
                            <td className="px-2 py-4">
                              <RowMenu
                                task={task}
                                onViewDetails={() => handleTaskClick(task)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Showing X tasks counter */}
      {!loading && filteredTasks.length > 0 && (
        <div className="shrink-0 px-6 py-2 border-t border-border bg-surface-0">
          <span className="text-xs text-text-tertiary">
            Showing {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetail task={selectedTask} onClose={handleCloseDetail} />
      )}
    </div>
  );
}
