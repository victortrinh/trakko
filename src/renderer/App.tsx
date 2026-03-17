import { useEffect } from 'react';
import { useProjectStore } from './stores/projectStore';
import { useTaskStore } from './stores/taskStore';
import { AppShell } from './components/layout/AppShell';

export function App() {
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (activeProjectId) {
      fetchTasks(activeProjectId);
    }
  }, [activeProjectId, fetchTasks]);

  return <AppShell />;
}
