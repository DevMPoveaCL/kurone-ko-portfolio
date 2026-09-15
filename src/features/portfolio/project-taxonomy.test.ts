import { describe, expect, it } from "vitest";
import { PROJECTS } from "./project-data";
import { deriveTaxonomy, filterProjects, getActiveProjectId, getFilterLabel, getProjectPresentationBadges, validateFilterIds } from "./project-taxonomy";
import type { FilterId } from "./vault-types";

const EXPECTED_PROJECT_TECHNOLOGY = {
  "software-engineering-playbook": { stacks: [], technologies: [] },
  timer: { stacks: ["tauri"], technologies: ["react", "typescript", "vite", "zustand", "rust", "vitest", "playwright"] },
  "elemental-tcg": { stacks: ["astro"], technologies: ["typescript", "tailwind-css", "vite", "playwright"] },
  alarm: { stacks: ["flutter", "android"], technologies: ["dart", "riverpod", "sqlite", "drift", "google-ml-kit", "kotlin"] },
  "filter-calls": { stacks: ["android"], technologies: ["kotlin", "jetpack-compose"] },
  "github-activity": { stacks: [], technologies: ["react", "typescript", "vite", "vitest"] },
  portfolio: { stacks: ["next-js"], technologies: ["react", "typescript", "tailwind-css"] },
  translator: { stacks: ["go"], technologies: [] },
  "farmacia-linlin": { stacks: [], technologies: ["angular", "typescript", "ionic", "firebase", "capacitor", "playwright"] },
  pymeflow: { stacks: ["java"], technologies: ["spring-boot", "postgresql"] },
  "kuroneko-pos": { stacks: ["go", "wails"], technologies: ["typescript", "vite", "sqlite", "vitest", "playwright"] },
  "kuroneko-sii": { stacks: [], technologies: [] },
  "kuroneko-explorermcp": { stacks: ["dotnet"], technologies: ["c-sharp"] },
  teacher: { stacks: [], technologies: [] },
} as const;

const EXPECTED_SHOWCASE_ELIGIBILITY = {
  "software-engineering-playbook": true,
  timer: true,
  "elemental-tcg": true,
  alarm: true,
  "filter-calls": true,
  "github-activity": true,
  portfolio: false,
  translator: true,
  "farmacia-linlin": true,
  pymeflow: true,
  "kuroneko-pos": true,
  "kuroneko-sii": true,
  "kuroneko-explorermcp": true,
  teacher: true,
} as const;

const EXPECTED_PRESENTATION_BADGES = {
  "software-engineering-playbook": ["Architecture & SOLID", "API & Interface Design", "React", "Spring Boot", "Docker", "Networking", "UX/UI Accessibility"],
  timer: ["Tauri 2", "React 19", "TypeScript", "Zustand", "Rust", "Vitest", "Playwright"],
  "farmacia-linlin": ["Angular 18", "Ionic 8", "TypeScript", "RxJS", "Firebase", "Capacitor", "Playwright"],
  "elemental-tcg": ["Astro 6", "TypeScript", "Tailwind CSS 4", "Vite 7", "Playwright", "WCAG", "Cloudflare Pages"],
  alarm: ["Flutter", "Dart", "Riverpod", "Drift", "SQLite", "Excel", "Kotlin", "Android"],
  pymeflow: ["Java 21", "Spring Boot 3", "PostgreSQL 16", "Flyway", "OpenAPI", "Docker", "JUnit 5", "ArchUnit"],
  "filter-calls": ["Android", "Kotlin", "Jetpack Compose", "Material 3", "DataStore", "Coroutines", "Gradle"],
  "github-activity": ["React", "TypeScript", "Vite", "Bash", "Git", "GitHub", "Vitest"],
  "kuroneko-pos": ["Go", "Wails", "TypeScript", "Vite", "SQLite", "Vitest", "Playwright"],
  "kuroneko-sii": ["POS", "PYMEFLOW", "DTE", "IVA", "F29", "IA"],
  "kuroneko-explorermcp": ["C#", ".NET", "MCP", "UIA", "WIN32", "WEBSOCKET", "XUNIT"],
  translator: ["GO", "DEEPGRAM", "WEBSOCKET", "WINMM", "SSE", "LLM"],
  teacher: ["NOVELA VISUAL", "PEDAGOGÍA", "SOLID", "CLEAN", "HEXAGONAL", "TESTING"],
} as const;

describe("project taxonomy", () => {
  it("derives only metadata that is available in the supplied projects", () => {
    expect(deriveTaxonomy(PROJECTS).map((option) => option.id)).toEqual([
      "android", "angular", "astro", "capacitor", "c-sharp", "dart", "drift", "firebase", "dotnet", "flutter", "go", "google-ml-kit", "ionic", "java", "jetpack-compose", "kotlin", "postgresql", "playwright", "react", "riverpod", "rust", "spring-boot", "sqlite", "typescript", "tailwind-css", "tauri", "vite", "vitest", "wails", "zustand", "void",
    ]);
    expect(deriveTaxonomy(PROJECTS).map((option) => option.id)).not.toContain("next-js");
  });

  it("drops stale query values while preserving valid unique selections", () => {
    expect(validateFilterIds(PROJECTS, ["react", "not-a-real-technology", "react"])).toEqual(["react"]);
  });

  it("rejects case-sensitive unknown filter IDs", () => {
    expect(validateFilterIds(PROJECTS, ["React", "REACT", "react"])).toEqual(["react"]);
  });

  it("records evidence for every filterable project claim", () => {
    for (const project of PROJECTS) {
      const filterIds = [...project.technologyMetadata.stacks, ...project.technologyMetadata.technologies];

      expect(project.technologyMetadata.evidence.map((evidence) => evidence.filterId)).toEqual(filterIds);
    }
  });

  it("pins the audited stacks and technologies for every portfolio project", () => {
    expect(Object.fromEntries(PROJECTS.map((project) => [project.id, {
      stacks: project.technologyMetadata.stacks,
      technologies: project.technologyMetadata.technologies,
    }]))).toEqual(EXPECTED_PROJECT_TECHNOLOGY);
  });

  it("pins showcase eligibility separately from legacy tiers", () => {
    expect(Object.fromEntries(PROJECTS.map((project) => [project.id, project.showcaseEligible]))).toEqual(EXPECTED_SHOWCASE_ELIGIBILITY);
  });

  it("preserves the authored presentation badges independently from filter metadata", () => {
    for (const [projectId, expectedBadges] of Object.entries(EXPECTED_PRESENTATION_BADGES)) {
      const project = PROJECTS.find((candidate) => candidate.id === projectId);
      expect(project).toBeDefined();
      expect(getProjectPresentationBadges(project!)).toEqual(expectedBadges);
      expect(getProjectPresentationBadges(project!).some((badge) => badge.includes(" + "))).toBe(false);
    }

    const playbook = PROJECTS.find((project) => project.id === "software-engineering-playbook");
    expect(playbook?.technologyMetadata.stacks).toEqual([]);
    expect(playbook?.technologyMetadata.technologies).toEqual([]);
    expect(getProjectPresentationBadges(playbook!)).toContain("Architecture & SOLID");

    const portfolio = PROJECTS.find((project) => project.id === "portfolio");
    expect(getProjectPresentationBadges(portfolio!)).toEqual(["Next.js", "React", "TypeScript", "Tailwind CSS"]);
  });

  it("normalizes only the two authored plus compounds and preserves other punctuation", () => {
    const timer = PROJECTS.find((project) => project.id === "timer");
    if (timer?.stackPresentation === undefined) throw new Error("Compound badge test requires Timer presentation.");

    const projectWithCompounds = {
      ...timer,
      stackPresentation: {
        ...timer.stackPresentation,
        badges: ["React + Spring Boot", "Vitest + Playwright", "A & B", "C/D"],
      },
    };

    expect(getProjectPresentationBadges(projectWithCompounds)).toEqual([
      "React",
      "Spring Boot",
      "Vitest",
      "Playwright",
      "A & B",
      "C/D",
    ]);
  });

  it("uses canonical technology labels only when authored presentation badges are absent", () => {
    const timer = PROJECTS.find((project) => project.id === "timer");
    if (timer === undefined) throw new Error("Fallback badge test requires Timer.");

    expect(getProjectPresentationBadges({
      technologyMetadata: timer.technologyMetadata,
    })).toEqual(["Tauri 2", "React 19", "TypeScript", "Vite", "Zustand", "Rust", "Vitest", "Playwright"]);
  });

  it("keeps descriptive presentation labels out of the filter taxonomy", () => {
    const taxonomyLabels = deriveTaxonomy(PROJECTS).map((option) => option.label);

    expect(taxonomyLabels).not.toContain("Architecture & SOLID");
    expect(taxonomyLabels).not.toContain("WCAG");
    expect(taxonomyLabels).not.toContain("POS");
    expect(taxonomyLabels).not.toContain("MCP");
  });

  it("labels the factual POS and PymeFlow filters", () => {
    expect(["java", "spring-boot", "wails", "vite", "sqlite"].map((id) => getFilterLabel(id as FilterId))).toEqual([
      "Java", "Spring Boot", "Wails", "Vite", "SQLite",
    ]);
  });

  it("labels and filters the Timer test technologies", () => {
    expect(["rust", "vitest", "playwright"].map((id) => getFilterLabel(id as FilterId))).toEqual([
      "Rust", "Vitest", "Playwright",
    ]);
    expect(filterProjects(PROJECTS, ["rust"]).map((project) => project.id)).toEqual(["timer"]);
    expect(filterProjects(PROJECTS, ["vitest"]).map((project) => project.id)).toEqual(["timer", "github-activity", "kuroneko-pos"]);
    expect(filterProjects(PROJECTS, ["playwright"]).map((project) => project.id)).toEqual([
      "timer",
      "farmacia-linlin",
      "elemental-tcg",
      "kuroneko-pos",
    ]);
  });

  it("matches corrected technology filters in stable project order", () => {
    expect(filterProjects(PROJECTS, ["vitest"]).map((project) => project.id)).toEqual([
      "timer",
      "github-activity",
      "kuroneko-pos",
    ]);
    expect(filterProjects(PROJECTS, ["android"]).map((project) => project.id)).toEqual([
      "alarm",
      "filter-calls",
    ]);
    expect(filterProjects(PROJECTS, ["kotlin"]).map((project) => project.id)).toEqual([
      "alarm",
      "filter-calls",
    ]);
    expect(filterProjects(PROJECTS, ["c-sharp"]).map((project) => project.id)).toEqual([
      "kuroneko-explorermcp",
    ]);
    expect(filterProjects(PROJECTS, ["dotnet"]).map((project) => project.id)).toEqual([
      "kuroneko-explorermcp",
    ]);
  });

  it("matches any selected technology in stable source order", () => {
    const results = filterProjects(PROJECTS, ["tailwind-css", "react"]);

    expect(results.map((project) => project.id)).toEqual(["timer", "elemental-tcg", "github-activity"]);
  });

  it("returns every project for an empty selection without mutating inputs", () => {
    const projects = [...PROJECTS];
    const emptySelection: FilterId[] = [];
    const selectedIds = ["react"] as const;
    const originalProjectIds = projects.map((project) => project.id);

    const results = filterProjects(projects, emptySelection);

    filterProjects(projects, selectedIds);

    expect(results.map((project) => project.id)).toEqual(projects.filter((project) => project.showcaseEligible).map((project) => project.id));
    expect(results).not.toBe(projects);
    expect(projects.map((project) => project.id)).toEqual(originalProjectIds);
    expect(emptySelection).toEqual([]);
    expect(selectedIds).toEqual(["react"]);
  });

  it("falls back to the first result when the active project is excluded", () => {
    const results = filterProjects(PROJECTS, ["flutter"]);

    expect(getActiveProjectId(results, "timer")).toBe("alarm");
    expect(getActiveProjectId([], "portfolio")).toBeNull();
  });

  it("excludes Portfolio while including locked showcase entries in inclusive OR results", () => {
    expect(filterProjects(PROJECTS, ["next-js", "java", "wails"]).map((project) => project.id)).toEqual(["pymeflow", "kuroneko-pos"]);
    expect(filterProjects(PROJECTS, ["go"]).map((project) => project.id)).toEqual(["kuroneko-pos", "translator"]);
    expect(filterProjects(PROJECTS, ["typescript", "sqlite"]).map((project) => project.id)).toContain("kuroneko-pos");
  });

});
