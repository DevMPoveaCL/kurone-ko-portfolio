import { SPECIAL_FILTER_ID } from "./vault-types";
import type { FilterId, ProjectEntry, TechnologyFilterId } from "./vault-types";

export interface TaxonomyOption {
  id: FilterId;
  label: string;
}

export interface ProjectTechnologyBadge {
  id: TechnologyFilterId;
  label: string;
}

const PRESENTATION_PLUS_COMPOUNDS = {
  "React + Spring Boot": ["React", "Spring Boot"],
  "Vitest + Playwright": ["Vitest", "Playwright"],
} as const;

const FILTER_LABELS: Record<FilterId, string> = {
  android: "Android",
  angular: "Angular",
  astro: "Astro",
  capacitor: "Capacitor",
  "c-sharp": "C#",
  dart: "Dart",
  drift: "Drift",
  firebase: "Firebase",
  dotnet: ".NET",
  flutter: "Flutter",
  go: "Go",
  "google-ml-kit": "Google ML Kit",
  ionic: "Ionic",
  java: "Java",
  "jetpack-compose": "Jetpack Compose",
  kotlin: "Kotlin",
  postgresql: "PostgreSQL",
  playwright: "Playwright",
  "next-js": "Next.js",
  react: "React",
  riverpod: "Riverpod",
  rust: "Rust",
  "spring-boot": "Spring Boot",
  sqlite: "SQLite",
  typescript: "TypeScript",
  "tailwind-css": "Tailwind CSS",
  tauri: "Tauri",
  vite: "Vite",
  vitest: "Vitest",
  wails: "Wails",
  zustand: "Zustand",
  [SPECIAL_FILTER_ID.VOID]: "Vacío",
};

export function getFilterLabel(id: FilterId): string {
  return FILTER_LABELS[id];
}

export function getProjectTechnologyIds(project: Pick<ProjectEntry, "technologyMetadata">): TechnologyFilterId[] {
  return [...new Set([
    ...project.technologyMetadata.stacks,
    ...project.technologyMetadata.technologies,
  ])];
}

export function getProjectTechnologyBadges(project: Pick<ProjectEntry, "technologyMetadata">): ProjectTechnologyBadge[] {
  const labels = project.technologyMetadata.labels ?? {};

  return getProjectTechnologyIds(project).map((id) => ({
    id,
    label: labels[id] ?? getFilterLabel(id),
  }));
}

export function getProjectPresentationBadges(
  project: Pick<ProjectEntry, "technologyMetadata" | "stackPresentation">,
): string[] {
  const authoredBadges = project.stackPresentation?.badges;
  if (authoredBadges !== undefined) {
    return authoredBadges.flatMap((badge) =>
      PRESENTATION_PLUS_COMPOUNDS[badge as keyof typeof PRESENTATION_PLUS_COMPOUNDS] ?? [badge],
    );
  }

  return getProjectTechnologyBadges(project).map(({ label }) => label);
}

export function deriveTaxonomy(projects: readonly ProjectEntry[]): TaxonomyOption[] {
  const availableIds = new Set(projects.filter((project) => project.showcaseEligible).flatMap(getProjectTechnologyIds));

  return (Object.keys(FILTER_LABELS) as FilterId[])
    .filter((id) => id === SPECIAL_FILTER_ID.VOID || availableIds.has(id as TechnologyFilterId))
    .map((id) => ({ id, label: getFilterLabel(id) }));
}

export function validateFilterIds(projects: readonly ProjectEntry[], candidateIds: readonly string[]): FilterId[] {
  const availableIds = new Set(deriveTaxonomy(projects).map((option) => option.id));
  const seenIds = new Set<FilterId>();

  const validatedIds = candidateIds.filter((id): id is FilterId => {
    if (!availableIds.has(id as FilterId) || seenIds.has(id as FilterId)) {
      return false;
    }

    seenIds.add(id as FilterId);
    return true;
  });

  return validatedIds.includes(SPECIAL_FILTER_ID.VOID) ? [SPECIAL_FILTER_ID.VOID] : validatedIds;
}

export function filterProjects(projects: readonly ProjectEntry[], selectedIds: readonly FilterId[]): ProjectEntry[] {
  const eligibleProjects = projects.filter((project) => project.showcaseEligible);

  if (selectedIds.length === 0) {
    return eligibleProjects;
  }

  if (selectedIds.includes(SPECIAL_FILTER_ID.VOID)) return [];

  const selectedIdSet = new Set(selectedIds);

  return eligibleProjects.filter((project) => getProjectTechnologyIds(project).some((id) => selectedIdSet.has(id)));
}

export function getActiveProjectId(projects: readonly ProjectEntry[], activeProjectId: string | null): string | null {
  return projects.some((project) => project.id === activeProjectId) ? activeProjectId : (projects[0]?.id ?? null);
}
