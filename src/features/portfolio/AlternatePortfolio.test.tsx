import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetSharedAudioElementForTests } from "@/shared/media/audio-controller";
import {
  AlternatePortfolio,
  getAlternatePortfolioBadgeEntries,
  getAlternatePortfolioBadges,
  getAlternatePortfolioProjects,
} from "./AlternatePortfolio";

describe("AlternatePortfolio", () => {
  afterEach(() => resetSharedAudioElementForTests());
  afterEach(() => vi.restoreAllMocks());

  it("renders the 13 projects in source order with real destinations and honest statuses", async () => {
    window.sessionStorage.clear();
    render(<AlternatePortfolio />);

    const cards = screen.getAllByRole("article");
    const projects = getAlternatePortfolioProjects();

    expect(screen.getByRole("heading", { name: "Proyectos" })).toBeInTheDocument();
    expect(screen.queryByText("13 proyectos · una mirada técnica y humana", { exact: true })).not.toBeInTheDocument();
    expect(cards).toHaveLength(13);
    expect(
      new Set(
        cards.map((card) => within(card).getByRole("heading").textContent),
      ).size,
    ).toBe(13);
    expect(
      cards.map((card) => within(card).getByRole("heading").textContent),
    ).toEqual(projects.map((project) => project.name));
    expect(
      cards.map((card) => within(card).getByText(/./, { selector: ".portfolio-alternate-card-description" }).textContent),
    ).toEqual(projects.map((project) => project.overviewDescription));
    expect(
      cards.map((card) => card.getAttribute("data-destination")),
    ).toEqual(projects.map((project) => (
      project.productionUrl ?? project.stackPresentation?.cta?.href
    ) !== undefined ? "linked" : "development"));
    expect(
      document.querySelectorAll(".portfolio-alternate-card-cta"),
    ).toHaveLength(8);
    expect(screen.getAllByText("EN DESARROLLO", { exact: true })).toHaveLength(
      5,
    );
    expect(screen.getByRole("link", { name: "Volver" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.queryByText("Volver a la bóveda", { exact: true })).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem("kuroneko:bug-cesante-player")).toBeNull();
    expect(
      await screen.findByRole("complementary", {
        name: "Reproductor persistente de Bug Cesante",
      }),
    ).toBeVisible();
    const player = screen.getByRole("complementary", {
      name: "Reproductor persistente de Bug Cesante",
    });
    expect(player.querySelector(".bug-cesante-player-title")).not.toBeInTheDocument();
    expect(within(player).getByRole("button", { name: "Reproducir canción" })).toBeInTheDocument();
    expect(within(player).getByRole("button", { name: "Mostrar letra" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/marco-povea-b21038258/",
    );
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/DevMPoveaCL",
    );
  });

  it("reveals existing project badges through one accessible disclosure at a time", async () => {
    const user = userEvent.setup();
    render(<AlternatePortfolio />);

    const projects = getAlternatePortfolioProjects();
    const firstCard = screen.getAllByRole("article")[0];
    const secondCard = screen.getAllByRole("article")[1];
    if (
      firstCard === undefined ||
      secondCard === undefined ||
      projects[0] === undefined ||
      projects[1] === undefined
    ) {
      throw new Error(
        "Alternate portfolio test requires the first two projects.",
      );
    }
    const firstToggle = within(firstCard).getByRole("button", {
      name: `Ver tecnologías de ${projects[0]?.name}`,
    });
    const secondToggle = within(secondCard).getByRole("button", {
      name: `Ver tecnologías de ${projects[1]?.name}`,
    });

    expect(firstToggle).toHaveAttribute("aria-expanded", "false");
    await user.click(firstToggle);
    expect(firstToggle).toHaveAttribute("aria-expanded", "true");
    expect(
      within(firstCard).getByRole("region", {
        name: `Tecnologías de ${projects[0]?.name}`,
      }),
    ).toBeVisible();
    for (const badge of getAlternatePortfolioBadges([projects[0]!])) {
      expect(firstCard).toHaveTextContent(badge);
    }

    await user.click(secondToggle);
    expect(firstToggle).toHaveAttribute("aria-expanded", "false");
    expect(secondToggle).toHaveAttribute("aria-expanded", "true");
  });

  it.each([0, 8, 12])("uses the restored presentation badges for alternate project %i", async (projectIndex) => {
    const user = userEvent.setup();
    render(<AlternatePortfolio />);

    const project = getAlternatePortfolioProjects()[projectIndex];
    const card = screen.getAllByRole("article")[projectIndex];
    if (project === undefined || card === undefined) throw new Error("Alternate badge test requires the requested project.");

    await user.click(within(card).getByRole("button", { name: `Ver tecnologías de ${project.name}` }));
    const panel = within(card).getByRole("region", { name: `Tecnologías de ${project.name}` });
    for (const badge of getAlternatePortfolioBadges([project])) {
      expect(within(panel).getByText(badge, { exact: true })).toBeVisible();
    }
  });

  it("renders the approved Project 1 and Project 4 descriptions in their cards", () => {
    window.sessionStorage.clear();
    render(<AlternatePortfolio />);

    const cards = screen.getAllByRole("article");
    const projectOneDescription = within(cards[0]!).getByText(/./, {
      selector: ".portfolio-alternate-card-description",
    });
    const projectFourDescription = within(cards[3]!).getByText(/./, {
      selector: ".portfolio-alternate-card-description",
    });

    expect(projectOneDescription.textContent).toBe(
      "Guía que organiza fundamentos de ingeniería de software en rutas de aprendizaje progresivas y aplicables. Cada tema conecta arquitectura, testing y decisiones de entrega para convertir estudio disperso en un criterio de construcción revisable.",
    );
    expect(projectFourDescription.textContent).toBe(
      "Landing narrativa para un juego de cartas táctico, construida con Astro. La interfaz convierte mitología, estrategia y exploración visual en una entrada clara hacia el sistema del juego.",
    );
  });

  it("derives the readable ticker from project presentations and freezes it for reduced motion", async () => {
    const matchMedia = vi
      .spyOn(window, "matchMedia")
      .mockImplementation((query) => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      }));
    render(<AlternatePortfolio />);

    const ticker = screen.getByRole("region", {
      name: "Tecnologías presentes en los proyectos",
    });
    for (const badge of getAlternatePortfolioBadges()) {
      expect(ticker).toHaveTextContent(badge);
    }
    await waitFor(() =>
      expect(
        ticker.querySelector(".portfolio-alternate-ticker-track"),
      ).toHaveAttribute("data-motion", "static"),
    );
    expect(matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");

    const entries = getAlternatePortfolioBadgeEntries();
    expect(entries.map(({ label }) => label)).toContain("Architecture & SOLID");
    expect(entries.map(({ label }) => label)).toContain("Cloudflare Pages");
    expect(entries.filter(({ label }) => label.toLowerCase() === "react")).toHaveLength(1);
    expect(entries.some(({ label }) => label.includes(" + "))).toBe(false);
  });

  it("disables selection only on the alternate route", () => {
    const css = readFileSync(
      join(process.cwd(), "src/app/globals.css"),
      "utf8",
    );

    expect(css).toMatch(/\.portfolio-alternate\s*\{[\s\S]*user-select: none;/);
    expect(css).toMatch(
      /\.portfolio-alternate \*\s*\{[\s\S]*user-select: none;/,
    );
    expect(css).toContain(
      '.portfolio-alternate-ticker-track[data-motion="static"]',
    );
    expect(css).toContain("animation: portfolio-alternate-ticker-right 75s linear infinite;");
    expect(css).toContain('.portfolio-alternate-card[data-destination="linked"]');
    expect(css).toContain('.portfolio-alternate-card[data-destination="development"]');
    expect(css).toContain('inline-size: min(24rem, calc(100vw - 2rem));');
    expect(css).toContain("outline: none;");
    expect(css).toContain("box-shadow: inset 0 0 0 0.1875rem var(--focus);");
    expect(css).not.toContain('inline-size: min(38rem, calc(100vw - 2rem));');
    expect(css).not.toContain("-webkit-line-clamp");
  });

  it("pauses alternate transport synchronously before Volver navigates away", async () => {
    const user = userEvent.setup();
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) {
      Object.defineProperty(this, "paused", { configurable: true, value: false });
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    });
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (this: HTMLMediaElement) {
      Object.defineProperty(this, "paused", { configurable: true, value: true });
      this.dispatchEvent(new Event("pause"));
    });

    render(<AlternatePortfolio />);
    await user.click(await screen.findByRole("button", { name: "Reproducir canción" }));
    expect(play).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("link", { name: "Volver" }));

    expect(pause).toHaveBeenCalled();
    expect(document.querySelector<HTMLAudioElement>(".bug-cesante-audio")?.paused).toBe(true);
  });
});
