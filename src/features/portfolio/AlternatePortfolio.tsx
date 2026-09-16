"use client";

import Link from "next/link";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import {
  MotionPreferenceProvider,
  useMotionPreferences,
} from "@/shared/a11y/motion-preferences";
import {
  BugCesantePlayerProvider,
  PLAYER_PRESENTATION,
  useBugCesantePlayer,
} from "./BugCesantePlayer";
import { ExternalLink, ExternalNavigationProvider } from "./ExternalNavigation";
import { PROFESSIONAL_PROFILE_URLS } from "./ProfessionalVoidState";
import { getProjectPresentationBadges } from "./project-taxonomy";
import { PROJECTS } from "./project-data";
import type { ProjectEntry } from "./vault-types";
import { PROJECT_UNLOCK_CHALLENGES } from "./hidden-project-unlock";
import {
  clearAlternateResidency,
  readSessionProgression,
  writeSessionProgression,
} from "./session-progression";
import { VAULT_SEALS } from "./vault-seals";

const ALTERNATE_PORTFOLIO_PROJECT_ID = "portfolio";

interface AlternatePresentationBadge {
  key: string;
  label: string;
}

export function getAlternatePortfolioProjects(): ProjectEntry[] {
  return PROJECTS.filter(
    (project) => project.id !== ALTERNATE_PORTFOLIO_PROJECT_ID,
  );
}

export function getAlternatePortfolioBadges(
  projects: readonly ProjectEntry[] = getAlternatePortfolioProjects(),
): string[] {
  return getAlternatePortfolioBadgeEntries(projects).map(({ label }) => label);
}

export function getAlternatePortfolioBadgeEntries(
  projects: readonly ProjectEntry[] = getAlternatePortfolioProjects(),
): AlternatePresentationBadge[] {
  const badges = new Map<string, AlternatePresentationBadge>();

  for (const project of projects) {
    for (const label of getProjectPresentationBadges(project)) {
      const key = label.trim().replace(/\s+/gu, " ").toLowerCase();
      if (!badges.has(key)) badges.set(key, { key, label });
    }
  }

  return [...badges.values()];
}

function getProjectBadges(project: ProjectEntry): string[] {
  return getProjectPresentationBadges(project);
}

function getProjectDescription(project: ProjectEntry): string {
  return (
    project.overviewDescription ??
    project.front.summary[0] ??
    project.reason
  );
}

function getProjectDestination(project: ProjectEntry): string | undefined {
  return project.productionUrl ?? project.stackPresentation?.cta?.href;
}

function getProjectCtaLabel(
  project: ProjectEntry,
  destination: string,
): string {
  return (
    project.stackPresentation?.cta?.label ??
    (project.productionUrl === destination ? "Ver proyecto" : "Ver demo")
  );
}

function clearAlternateAccess(event: MouseEvent<HTMLAnchorElement>) {
  if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const progression = readSessionProgression({
    challengeIds: PROJECT_UNLOCK_CHALLENGES.map((challenge) => challenge.id),
    sealIds: VAULT_SEALS.map((seal) => seal.id),
  });
  writeSessionProgression(clearAlternateResidency(progression));
}

function PortfolioHeader() {
  const { focusBottomPlayerControl, registerSocialFocus, releaseTransport } =
    useBugCesantePlayer();
  const backRef = useRef<HTMLAnchorElement>(null);
  const linkedinRef = useRef<HTMLAnchorElement>(null);
  const githubRef = useRef<HTMLAnchorElement>(null);
  const registerFocus = useEffectEvent(() =>
    registerSocialFocus(linkedinRef.current),
  );
  const clearFocus = useEffectEvent(() => registerSocialFocus(null));

  useEffect(() => {
    registerFocus();
    return clearFocus;
  }, []);

  function handleSocialKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    const target = event.target;
    if (!(target instanceof HTMLAnchorElement)) return;

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const navigationLinks = [backRef, linkedinRef, githubRef];
      const currentIndex = navigationLinks.findIndex((ref) => ref.current === target);
      const nextIndex = (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + navigationLinks.length) % navigationLinks.length;
      navigationLinks[nextIndex]?.current?.focus({ preventScroll: true });
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      focusBottomPlayerControl();
    }
  }

  function handleBackClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    releaseTransport();
    clearAlternateAccess(event);
  }

  return (
    <header className="portfolio-alternate-header">
      <div className="portfolio-alternate-identity">
        <p className="portfolio-alternate-name">Marco Povea</p>
        <p className="portfolio-alternate-role">
          INGENIERO EN INFORMÁTICA · UNIVERSIDAD UNIACC
        </p>
      </div>
      <nav
        aria-label="Perfiles profesionales"
        className="portfolio-alternate-social"
        onKeyDown={handleSocialKeyDown}
      >
        <Link className="portfolio-alternate-back" href="/" onClick={handleBackClick} prefetch={false} ref={backRef}>
          Volver
        </Link>
        <ExternalLink
          confirmationPurpose="Redirección a mi perfil de LinkedIn"
          href={PROFESSIONAL_PROFILE_URLS.LINKEDIN}
          ref={linkedinRef}
        >
          LinkedIn
        </ExternalLink>
        <ExternalLink
          confirmationPurpose="Redirección a mi perfil de GitHub"
          href={PROFESSIONAL_PROFILE_URLS.GITHUB}
          ref={githubRef}
        >
          GitHub
        </ExternalLink>
      </nav>
    </header>
  );
}

interface AlternateProjectCardProps {
  isOpen: boolean;
  onToggle: () => void;
  position: number;
  project: ProjectEntry;
}

function AlternateProjectCard({
  isOpen,
  onToggle,
  position,
  project,
}: AlternateProjectCardProps) {
  const destination = getProjectDestination(project);
  const cardId = `alternate-project-${project.id}`;
  const technologyPanelId = `${cardId}-technologies`;
  const projectBadges = getProjectBadges(project);

  return (
    <article
      aria-labelledby={`${cardId}-name`}
      className="portfolio-alternate-card"
      data-destination={destination === undefined ? "development" : "linked"}
      data-open={isOpen}
    >
              <div className="portfolio-alternate-card-content">
        <p className="portfolio-alternate-card-index">
          {String(position).padStart(2, "0")} / 13
        </p>
        <h2 id={`${cardId}-name`}>{project.name}</h2>
        <p className="portfolio-alternate-card-description">
          {getProjectDescription(project)}
        </p>
        <div className="portfolio-alternate-card-footer">
          {destination === undefined ? (
            <span className="portfolio-alternate-card-status">
              EN DESARROLLO
            </span>
          ) : (
          <ExternalLink
              className="portfolio-alternate-card-cta"
              {...(project.stackPresentation?.cta?.confirmationPurpose ===
              undefined
                ? {}
                : {
                    confirmationPurpose:
                      project.stackPresentation.cta.confirmationPurpose,
                  })}
              href={destination}
            >
              {getProjectCtaLabel(project, destination)}
            </ExternalLink>
          )}
        </div>
      </div>
      <div
        aria-label={`Tecnologías de ${project.name}`}
        className="portfolio-alternate-card-technologies"
        id={technologyPanelId}
        role="region"
        hidden={!isOpen}
      >
        <p className="portfolio-alternate-card-tech-kicker">Tecnologías</p>
        <ul>
          {projectBadges.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </div>
      <button
        aria-controls={technologyPanelId}
        aria-expanded={isOpen}
        aria-label={
          isOpen
            ? `Cerrar tecnologías de ${project.name}`
            : `Ver tecnologías de ${project.name}`
        }
        className="portfolio-alternate-card-toggle"
        onClick={onToggle}
        type="button"
      >
        <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>
    </article>
  );
}

function PortfolioTicker({ badges }: { badges: readonly AlternatePresentationBadge[] }) {
  const { isMotionAllowed } = useMotionPreferences();
  const sequence = badges.map(({ key, label }) => (
    <span className="portfolio-alternate-ticker-badge" data-badge-key={key} key={key}>
      {label}
    </span>
  ));

  return (
    <div
      aria-label="Tecnologías presentes en los proyectos"
      className="portfolio-alternate-ticker"
      role="region"
    >
      <div
        className="portfolio-alternate-ticker-track"
        data-motion={isMotionAllowed ? "moving" : "static"}
      >
        <div className="portfolio-alternate-ticker-sequence">{sequence}</div>
        <div aria-hidden="true" className="portfolio-alternate-ticker-sequence">
          {sequence}
        </div>
      </div>
    </div>
  );
}

function PortfolioIsland() {
  const projects = getAlternatePortfolioProjects();
  const badges = getAlternatePortfolioBadgeEntries(projects);
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);

  return (
    <div
      className="portfolio-alternate"
      data-motion={useMotionPreferences().isMotionAllowed ? "moving" : "static"}
    >
      <PortfolioHeader />
      <PortfolioTicker badges={badges} />
      <main id="main-content" className="portfolio-alternate-main">
        <div className="portfolio-alternate-showcase-intro">
          <h1>Proyectos</h1>
        </div>
        <section
          aria-label="Proyectos de Marco Povea"
          className="portfolio-alternate-grid"
        >
          {projects.map((project, index) => (
            <AlternateProjectCard
              isOpen={openProjectId === project.id}
              key={project.id}
              onToggle={() =>
                setOpenProjectId((currentId) =>
                  currentId === project.id ? null : project.id,
                )
              }
              position={index + 1}
              project={project}
            />
          ))}
        </section>
      </main>
    </div>
  );
}

export function AlternatePortfolio() {
  return (
    <MotionPreferenceProvider>
      <ExternalNavigationProvider>
        <BugCesantePlayerProvider presentation={PLAYER_PRESENTATION.ALTERNATE}>
          <PortfolioIsland />
        </BugCesantePlayerProvider>
      </ExternalNavigationProvider>
    </MotionPreferenceProvider>
  );
}
