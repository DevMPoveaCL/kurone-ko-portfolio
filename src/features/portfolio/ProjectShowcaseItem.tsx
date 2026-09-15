import type { ProjectEntry } from "./vault-types";

export interface ProjectShowcaseItemProps {
  isActive: boolean;
  onOpen?: (projectId: string) => void;
  project: ProjectEntry;
}

export function ProjectShowcaseItem({ isActive, onOpen, project }: ProjectShowcaseItemProps) {
  return (
    <li aria-current={isActive ? "true" : undefined} className="project-showcase-item">
      <article aria-labelledby={`${project.id}-showcase-title`}>
        <p className="eyebrow">{project.front.eyebrow}</p>
        <h3 id={`${project.id}-showcase-title`}>{project.front.title}</h3>
        <p>{project.front.summary[0]}</p>
        <p className="project-card-status">{project.status}</p>
        {onOpen === undefined ? null : <button onClick={() => onOpen(project.id)} type="button">Abrir {project.name}</button>}
      </article>
    </li>
  );
}
