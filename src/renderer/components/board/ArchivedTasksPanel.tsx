import { useEffect } from 'react';
import { useTaskStore } from '../../stores/taskStore';

interface ArchivedTasksPanelProps {
  projectId: string;
  onClose: () => void;
}

export function ArchivedTasksPanel({ projectId, onClose }: ArchivedTasksPanelProps) {
  const archivedTasks = useTaskStore((s) => s.archivedTasks);
  const fetchArchivedTasks = useTaskStore((s) => s.fetchArchivedTasks);
  const restoreTask = useTaskStore((s) => s.restoreTask);

  useEffect(() => {
    fetchArchivedTasks(projectId);
  }, [projectId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-1 border border-border rounded-xl w-[480px] max-h-[70vh] shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Archived Tasks</h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors text-lg leading-none"
          >
            x
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {archivedTasks.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-xs text-text-tertiary">
              No archived tasks
            </div>
          ) : (
            <div className="p-3 flex flex-col gap-1">
              {archivedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary truncate">{task.title}</p>
                    <p className="text-[10px] text-text-tertiary mt-0.5">
                      Archived {new Date(task.archivedAt + 'Z').toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => restoreTask(task.id)}
                    className="ml-3 px-2.5 py-1 text-xs text-accent hover:bg-surface-3 rounded-lg transition-colors shrink-0"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
