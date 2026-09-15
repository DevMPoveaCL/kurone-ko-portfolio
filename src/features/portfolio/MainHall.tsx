import type { Ref } from "react";
import dynamic from "next/dynamic";
import { PROJECTS } from "./project-data";
import { HiddenChamberTrigger } from "./HiddenChamberTrigger";
import { ProjectRoomBackground } from "./ProjectRoomBackground";
import { BugCesantePlayerProvider } from "./BugCesantePlayer";
import { PROJECT_TIER, type ProjectEntry } from "./vault-types";
import type { SessionProgression } from "./session-progression";

const ProjectShowcase = dynamic(() => import("./ProjectShowcase").then((module) => module.ProjectShowcase));

export interface MainHallProps {
  hiddenChamberEnabled?: boolean;
  isProjectModalOpen?: boolean;
  onHiddenChamberTrigger?: (projectId: string) => void;
  onProjectModalChange?: (isOpen: boolean) => void;
  onProgressionChange?: (progression: SessionProgression) => void;
  progression?: SessionProgression;
  projects?: ProjectEntry[];
  ref?: Ref<HTMLElement>;
}

function getHiddenChamberProjects() {
  return PROJECTS.filter((project) => project.tier !== PROJECT_TIER.VISIBLE && project.tier !== PROJECT_TIER.DEFERRED);
}

export function MainHall({
  hiddenChamberEnabled = false,
  isProjectModalOpen,
  onHiddenChamberTrigger,
  onProjectModalChange,
  onProgressionChange,
  progression,
  projects = PROJECTS,
  ref,
}: MainHallProps) {
  const hiddenChamberProjects = getHiddenChamberProjects();

  return (
      <section aria-label="Sala principal de proyectos" className="main-hall" ref={ref} tabIndex={-1}>
      <ProjectRoomBackground />
      <div className="main-hall-interaction-surface" data-interaction-blocked={isProjectModalOpen} inert={isProjectModalOpen || undefined}>
          <BugCesantePlayerProvider>
          <ProjectShowcase
            projects={projects}
            {...(isProjectModalOpen === undefined ? {} : { isProjectModalOpen })}
            {...(onProjectModalChange === undefined ? {} : { onProjectModalChange })}
            {...(onProgressionChange === undefined ? {} : { onProgressionChange })}
            {...(progression === undefined ? {} : { progression })}
          />
        </BugCesantePlayerProvider>
        {hiddenChamberEnabled ? <div aria-label="Controles accesibles de cámaras ocultas" className="hidden-chamber-controls">
          {hiddenChamberProjects.map((project) => (
            <HiddenChamberTrigger
              environmentalHint={`Un sello tenue apunta a ${project.name}: ${project.accessibleHint}`}
              key={project.id}
              label={`Explorar cámara oculta: ${project.name}`}
              onTrigger={() => onHiddenChamberTrigger?.(project.id)}
            />
          ))}
        </div> : null}
      </div>
    </section>
  );
}
