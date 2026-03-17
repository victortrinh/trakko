import { useProjectStore } from '../../stores/projectStore';

export function ProjectList() {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);

  return (
    <div className="flex flex-col gap-0.5">
      {projects.map((project) => (
        <button
          key={project.id}
          onClick={() => setActiveProject(project.id)}
          className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            project.id === activeProjectId
              ? 'bg-surface-3 text-text-primary'
              : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
          }`}
        >
          {project.name}
        </button>
      ))}
    </div>
  );
}
