"use client";

import { useLayoutEffect } from "react";
import { ExternalLink } from "./ExternalNavigation";
import { getProjectTechnologyBadges } from "./project-taxonomy";
import type { ProjectEntry } from "./vault-types";

export interface ProjectDetailProps {
  onBack: () => void;
  project: ProjectEntry;
}

export interface ProjectInformationProps {
  project: ProjectEntry;
}

function getConciseOutcome(project: ProjectEntry) {
  const outcome = project.back.outcome ?? project.back.details[0] ?? project.reason;
  return outcome.match(/^.*?[.!?](?:\s|$)/u)?.[0].trim() ?? outcome;
}

export function ProjectInformation({ project }: ProjectInformationProps) {
  const technologies = getProjectTechnologyBadges(project);
  const outcome = getConciseOutcome(project);

  return (
    <div className="project-information">
      <section aria-labelledby={`${project.id}-context-title`}>
        <h2 id={`${project.id}-context-title`}>Contexto</h2>
        <p>{project.reason}</p>
      </section>
      <section aria-labelledby={`${project.id}-outcome-title`}>
        <h2 id={`${project.id}-outcome-title`}>Resultado / aprendizaje</h2>
        <p>{outcome}</p>
      </section>
      <section aria-labelledby={`${project.id}-status-title`}>
        <h2 id={`${project.id}-status-title`}>Estado</h2>
        <p>{project.status}</p>
      </section>
      <section aria-labelledby={`${project.id}-technology-title`}>
        <h2 id={`${project.id}-technology-title`}>Tecnologías</h2>
        {technologies.length === 0 ? <p>No hay tecnologías registradas.</p> : <ul aria-label={`Tecnologías de ${project.name}`}>{technologies.map(({ id, label }) => <li data-technology-id={id} key={id}>{label}</li>)}</ul>}
      </section>
      {project.productionUrl === undefined ? null : <ExternalLink className="project-detail-production-link" href={project.productionUrl}>Visitar producción <span aria-hidden="true">↗</span></ExternalLink>}
    </div>
  );
}

export function ProjectDetail({ onBack, project }: ProjectDetailProps) {
  useLayoutEffect(() => {
    const heading = document.getElementById("project-detail-title");
    heading?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onBack]);

  return (
    <article className="project-detail" aria-labelledby="project-detail-title">
      <button className="project-detail-back" onClick={onBack} type="button">Volver a la sala principal</button>
      <p className="eyebrow">{project.front.eyebrow}</p>
      <h1 id="project-detail-title" tabIndex={-1}>{project.name}</h1>
      <ProjectInformation project={project} />
    </article>
  );
}
