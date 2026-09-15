import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PROJECTS } from "./project-data";
import { ProjectCard } from "./ProjectCard";
import { PROJECT_UNLOCK_CHALLENGE_ID, PROJECT_UNLOCK_CHALLENGES } from "./hidden-project-unlock";
import { getProjectPresentationBadges } from "./project-taxonomy";

const project = PROJECTS[0];
const informationProject = PROJECTS.find(
  (candidate) => candidate.id === "translator",
);
const filterCallsProject = PROJECTS.find((candidate) => candidate.id === "filter-calls");
const githubActivityProject = PROJECTS.find((candidate) => candidate.id === "github-activity");
const timerProject = PROJECTS.find((candidate) => candidate.id === "timer");
const farmaciaProject = PROJECTS.find(
  (candidate) => candidate.id === "farmacia-linlin",
);
const elementalProject = PROJECTS.find(
  (candidate) => candidate.id === "elemental-tcg",
);
const alarmProject = PROJECTS.find((candidate) => candidate.id === "alarm");
const pymeflowProject = PROJECTS.find((candidate) => candidate.id === "pymeflow");

describe("ProjectCard", () => {
  it.each([
    ["stack", "Ver stack de Kurone-ko Translator"],
    ["info", "Ver historia de Kurone-ko Translator"],
  ])("opens the shared riddle from the locked %s seal and restores focus", async (_seal, label) => {
    if (informationProject === undefined) throw new Error("ProjectCard test requires Kurone-ko Translator.");

    const user = userEvent.setup();
    const { container } = render(<ProjectCard project={informationProject} />);
    expect(container.querySelector("#translator-hint")).toHaveTextContent("Proyecto oculto y bloqueado");
    const seal = screen.getByRole("button", { name: label });
    await user.click(seal);

    const dialog = screen.getByRole("dialog", { name: "ACERTIJO" });
    const banner = dialog.querySelector<HTMLElement>(".project-unlock-riddle-banner");
    const bannerImage = banner?.querySelector<HTMLImageElement>("img");
    const bannerSource = banner?.querySelector<HTMLSourceElement>("source");
    const kicker = dialog.querySelector<HTMLElement>(".project-card-modal-kicker");
    const finalLine = dialog.querySelector<HTMLElement>(".project-unlock-riddle-line:last-child");
    const finalLineGlow = finalLine?.querySelector<HTMLElement>(".project-unlock-filter-glow");
    expect(kicker).toHaveTextContent("Tipea en la búsqueda de FILTROS la respuesta");
    expect(dialog.querySelector(".project-card-modal-kicker .project-unlock-filter-glow")).toHaveTextContent("FILTROS");
    expect(dialog.querySelectorAll(".project-unlock-filter-glow")).toHaveLength(2);
    expect(banner).toHaveClass("project-filter-title-banner");
    expect(banner?.previousElementSibling).toHaveClass("project-card-modal-header");
    expect(banner?.nextElementSibling).toHaveClass("project-card-modal-content");
    expect(bannerImage).toHaveAttribute("src", expect.stringContaining("filter-title.webp"));
    expect(bannerImage).toHaveAttribute("alt", PROJECT_UNLOCK_CHALLENGES[0]?.bannerAlt);
    expect(bannerSource).toHaveAttribute("media", "(max-width: 48rem), (pointer: coarse)");
    expect(bannerSource).toHaveAttribute("srcset", expect.stringContaining("titlemobile2.webp"));
    expect(dialog.querySelector(".project-unlock-riddle-content")).toHaveClass("project-unlock-riddle-content");
    expect(dialog.querySelectorAll(".project-unlock-riddle-line")).toHaveLength(2);
     expect(dialog.querySelectorAll(".project-unlock-riddle-line")[0]).toHaveTextContent("¿Quién dijo esta frase? Descubrirlo debes.");
    expect(dialog.querySelectorAll(".project-unlock-riddle-line")[1]).toHaveTextContent("En la búsqueda de FILTROS, su nombre escribirás, y así a los proyectos bloqueados accederás.");
    expect(finalLine).toHaveTextContent("En la búsqueda de FILTROS, su nombre escribirás, y así a los proyectos bloqueados accederás.");
    expect(finalLineGlow).toHaveTextContent("FILTROS");
    expect(finalLine?.style.opacity).toBe("");
    expect(dialog).not.toHaveTextContent("Un gran poder conlleva una gran responsabilidad");
    expect(dialog).not.toHaveTextContent("Joker no es");
    expect(screen.getByRole("heading", { name: "ACERTIJO" })).toBeInTheDocument();
     expect(dialog).toHaveTextContent("¿Quién dijo esta frase?");
    fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));
    await waitFor(() => expect(dialog).not.toBeVisible());
    await waitFor(() => expect(seal).toHaveFocus());
  });

  it("uses the honest fallback modal contracts after challenge unlock", async () => {
    if (informationProject === undefined) throw new Error("ProjectCard test requires Kurone-ko Translator.");

    const user = userEvent.setup();
    const { container } = render(<ProjectCard project={informationProject} unlockedChallengeIds={[PROJECT_UNLOCK_CHALLENGE_ID]} />);
    expect(container.querySelector("#translator-hint")).toHaveTextContent("Proyecto oculto y desbloqueado");
    expect(container.querySelector(".project-card-joker")).not.toBeInTheDocument();
    expect(container.querySelector(".project-card-preview")).toHaveAttribute("data-preview-fit", "contain");
    expect(container.querySelector(".project-card-preview")).toHaveAttribute("data-preview-source", "unlocked");
    expect(container.querySelector(".project-card-preview img")).toHaveAttribute("src", expect.stringContaining("joker2.webp"));
    expect(container.querySelector('[data-card-frame="ornate"]')).toBeInTheDocument();
    expect(container.querySelector('[data-card-presentation="media-title-bands"]')).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ver stack de Kurone-ko Translator" }));
    expect(screen.getByRole("dialog", { name: "ENTENDER A TIEMPO PARA PODER RESPONDER" })).toHaveTextContent("Deepgram");
  });

  it("renders a preview-first visible card with concise identity content", async () => {
    if (project === undefined) {
      throw new Error("ProjectCard test requires at least one project.");
    }

    const { container } = render(<ProjectCard isActive project={project} />);
    expect(
      container.querySelector(".project-card-preview img"),
    ).toHaveAttribute("src", expect.stringContaining("project1-preview.webp"));
    expect(container.querySelector(".project-card-preview")).toHaveAttribute(
      "data-preview-source",
      "demo",
    );
    const preview = container.querySelector<HTMLElement>(
      ".project-card-preview",
    );
    expect(preview?.style.cssText).toBe("");
    expect(
      container.querySelector(".project-card-joker"),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(
        ".project-card-subtitle .fitted-band-text-content",
      ),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-card-presentation="media-title-bands"]'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: project.front.title }),
    ).toBeVisible();
    expect(container.querySelector('[data-card-band="top"]')).toHaveTextContent(
      "Software Engineering Playbook",
    );
    expect(
      container.querySelector('[data-card-band="bottom"]'),
    ).toHaveTextContent("Los caminos que me gustaría recorrer");
    expect(container.querySelector("video")).not.toBeInTheDocument();
    expect(
      screen.queryByText(project.front.summary[0] ?? ""),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(project.status)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ver reverso" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: `Ver stack de ${project.name}`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: `Ver historia de ${project.name}`,
      }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".project-card-seal[data-paint-safe='true']")).toHaveLength(2);
  });

  it("declares a reusable mobile source without changing the poster-first contract", async () => {
    if (
      project === undefined ||
      project.preview.video === undefined ||
      project.preview.video.mobile === undefined
    ) {
      throw new Error(
        "ProjectCard test requires the project one mobile video source.",
      );
    }

    const { container } = render(<ProjectCard isActive project={project} />);
    await waitFor(() =>
      expect(container.querySelector("video")).toBeInTheDocument(),
    );
    const mobileSource = container.querySelector(
      'video source[media="(max-width: 48rem)"]',
    );

    expect(mobileSource).toHaveAttribute(
      "src",
      project.preview.video.mobile.src,
    );
    expect(mobileSource).toHaveAttribute(
      "type",
      project.preview.video.mobile.type,
    );
    expect(
      container.querySelector(".project-card-preview img"),
    ).toBeInTheDocument();
  });

  it("renders Project 6 through the shared media-title-band card contract", async () => {
    if (pymeflowProject === undefined || pymeflowProject.preview.video === undefined) {
      throw new Error("ProjectCard test requires the Kurone-ko PymeFlow project preview.");
    }

    const { container } = render(<ProjectCard isActive project={pymeflowProject} />);
    await waitFor(() => expect(container.querySelector("video")).toBeInTheDocument());

    expect(container.querySelector(".project-card-preview")).toHaveAttribute(
      "data-preview-source",
      "demo",
    );
    expect(container.querySelector(".project-card-preview img")).toHaveAttribute(
      "src",
      expect.stringContaining("project6-preview.webp"),
    );
    expect(container.querySelector("video source:not([media])")).toHaveAttribute(
      "src",
      pymeflowProject.preview.video.src,
    );
    expect(container.querySelector("video source[media]")).not.toBeInTheDocument();
    expect(container.querySelector('[data-card-frame="ornate"]')).toBeInTheDocument();
    expect(
      container.querySelector('[data-card-presentation="media-title-bands"]'),
    ).toBeInTheDocument();
  });

  it("renders Project 7 through the shared media-title-band card contract", async () => {
    if (filterCallsProject === undefined || filterCallsProject.preview.video === undefined) {
      throw new Error("ProjectCard test requires the Kurone-ko FilterCalls project preview.");
    }

    const { container } = render(<ProjectCard isActive project={filterCallsProject} />);
    await waitFor(() => expect(container.querySelector("video")).toBeInTheDocument());

    expect(container.querySelector(".project-card-preview img")).toHaveAttribute(
      "src",
      expect.stringContaining("project7-preview.webp"),
    );
    expect(container.querySelector(".project-card-preview")).toHaveAttribute(
      "data-preview-source",
      "demo",
    );
    expect(container.querySelector("video source:not([media])")).toHaveAttribute(
      "src",
      filterCallsProject.preview.video.src,
    );
    expect(container.querySelector("video source[media]")).not.toBeInTheDocument();
    expect(container.querySelector('[data-card-frame="ornate"]')).toBeInTheDocument();
    expect(
      container.querySelector('[data-card-presentation="media-title-bands"]'),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".project-card-seal")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Kurone-ko FilterCalls" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: /^FilterCalls$/ })).not.toBeInTheDocument();
  });

  it("renders Project 8 through the shared media-title-band card contract", async () => {
    if (githubActivityProject === undefined || githubActivityProject.preview.video === undefined) {
      throw new Error("ProjectCard test requires the Kurone-ko GitHub Activity project preview.");
    }

    const { container } = render(<ProjectCard isActive project={githubActivityProject} />);
    await waitFor(() => expect(container.querySelector("video")).toBeInTheDocument());

    expect(container.querySelector(".project-card-preview img")).toHaveAttribute(
      "src",
      expect.stringContaining("project8-preview.webp"),
    );
    expect(container.querySelector(".project-card-preview")).toHaveAttribute(
      "data-preview-source",
      "demo",
    );
    expect(container.querySelector("video source:not([media])")).toHaveAttribute(
      "src",
      githubActivityProject.preview.video.src,
    );
    expect(container.querySelector("video source[media]")).not.toBeInTheDocument();
    expect(container.querySelector('[data-card-frame="ornate"]')).toBeInTheDocument();
    expect(
      container.querySelector('[data-card-presentation="media-title-bands"]'),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".project-card-seal")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Kurone-ko GitHub Activity" })).toBeVisible();
    expect(container.querySelector('[data-card-band="bottom"]')).toHaveTextContent(
      "DIBUJAR FRASES CON COMMITS",
    );
  });

  it("maps Kurone-ko GitHub Activity to the shared Stack-then-Info seals and exact modal content", async () => {
    if (githubActivityProject === undefined) {
      throw new Error("ProjectCard test requires the Kurone-ko GitHub Activity project.");
    }

    const user = userEvent.setup();
    const { container } = render(<ProjectCard isActive project={githubActivityProject} />);
    const seals = [...container.querySelectorAll<HTMLButtonElement>(".project-card-seal")];
    const modalPresentation = githubActivityProject.modalPresentation;
    const stackPresentation = githubActivityProject.stackPresentation;

    if (modalPresentation === undefined || stackPresentation === undefined) {
      throw new Error("ProjectCard test requires the GitHub Activity modal presentations.");
    }

    expect(seals.map((seal) => seal.className)).toEqual([
      "project-card-seal project-card-seal-stack",
      "project-card-seal project-card-seal-info",
    ]);
    expect(seals.map((seal) => seal.getAttribute("aria-keyshortcuts"))).toEqual(["S", "I"]);
    expect(seals.every((seal) => seal.dataset.paintSafe === "true")).toBe(true);
    expect(seals[0]?.querySelector("img")).toHaveAttribute("src", modalPresentation.stackAsset);
    expect(seals[1]?.querySelector("img")).toHaveAttribute("src", modalPresentation.infoAsset);
    expect(container.querySelector('[class*="github-activity"]')).not.toBeInTheDocument();
    expect(container.querySelector('[class*="project8"]')).not.toBeInTheDocument();

    await user.click(seals[0]!);
    const stackDialog = screen.getByRole("dialog", { name: stackPresentation.title });
    expect(stackDialog).toBeVisible();
    expect(within(stackDialog).getByText(stackPresentation.kicker, { exact: true })).toBeVisible();
    expect(stackDialog.querySelector(".project-card-modal-description")).toHaveTextContent(
      stackPresentation.introduction,
    );
    expect(
      [...within(stackDialog).getByRole("list", { name: "Tecnologías del proyecto" }).querySelectorAll("li")].map(
        (badge) => badge.textContent,
      ),
    ).toEqual(["React", "TypeScript", "Vite", "Bash", "Git", "GitHub", "Vitest"]);
    expect([...stackDialog.querySelectorAll(".project-one-stack-block")].map((block) => ({
      heading: block.querySelector("h3")?.textContent,
      description: block.querySelector("p")?.textContent,
    }))).toEqual(
      stackPresentation.blocks.map(({ heading, description }) => ({ heading, description })),
    );
    expect(stackDialog.querySelector(".project-one-stack-evidence")).toHaveTextContent(
      "HUMAN IN THE LOOP - PREVISUALIZACIÓN - CSV + BASH REVISABLES",
    );
    expect(within(stackDialog).getByRole("link", { name: "Ver repositorio" })).toHaveAttribute(
      "href",
      "https://github.com/DevMPoveaCL/kurone-ko-github-activity",
    );
    expect([...stackDialog.querySelectorAll(".project-inline-highlight")].map((node) => node.textContent)).toEqual([
      ...(stackPresentation.introductionHighlights ?? []).map(({ text }) => text),
      ...stackPresentation.blocks.flatMap((block) =>
        [...(block.descriptionHighlights ?? [])]
          .sort((left, right) => block.description.indexOf(left.text) - block.description.indexOf(right.text))
          .map(({ text }) => text),
      ),
    ]);
    expect(stackDialog.querySelector(".project-card-modal-close")).toHaveFocus();

    await user.keyboard("i");
    const infoDialog = screen.getByRole("dialog", { name: modalPresentation.infoTitle ?? "" });
    expect(infoDialog).toBeVisible();
    expect(screen.queryByRole("dialog", { name: stackPresentation.title })).not.toBeInTheDocument();
    expect(within(infoDialog).getByText(modalPresentation.infoKicker ?? "", { exact: true })).toBeVisible();
    expect(infoDialog.querySelector(".project-card-modal-info-quote")).toHaveTextContent(
      modalPresentation.infoQuote ?? "",
    );
    expect([...infoDialog.querySelectorAll(".project-one-modal-sections h3")].map((heading) => heading.textContent)).toEqual([
      "ZETESIS",
      "POIESIS",
    ]);
    for (const section of githubActivityProject.loreSections ?? []) {
      for (const paragraph of section.paragraphs) {
        expect(
          [...infoDialog.querySelectorAll(".project-one-modal-sections p")].filter(
            (node) => node.textContent === paragraph,
          ),
        ).toHaveLength(1);
      }
    }
    expect([...infoDialog.querySelectorAll(".project-inline-highlight")].map((node) => node.textContent)).toEqual(
      githubActivityProject.loreSections?.flatMap((section) =>
        section.paragraphs.flatMap((paragraph, index) =>
          section.paragraphHighlights?.[index]
            ?.filter(({ text }) => paragraph.includes(text))
            .map(({ text }) => text) ?? [],
        ),
      ),
    );

    await user.keyboard("s");
    expect(screen.getByRole("dialog", { name: stackPresentation.title })).toBeVisible();
    await user.keyboard("s");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(seals[0]).toHaveFocus();
  });

  it("maps Kurone-ko FilterCalls to the shared Stack-then-Info seals and exact modal behavior", async () => {
    if (filterCallsProject === undefined) {
      throw new Error("ProjectCard test requires the Kurone-ko FilterCalls project.");
    }

    const user = userEvent.setup();
    const { container } = render(<ProjectCard isActive project={filterCallsProject} />);
    const seals = [...container.querySelectorAll<HTMLButtonElement>(".project-card-seal")];

    expect(seals.map((seal) => seal.className)).toEqual([
      "project-card-seal project-card-seal-stack",
      "project-card-seal project-card-seal-info",
    ]);
    expect(seals.map((seal) => seal.getAttribute("aria-keyshortcuts"))).toEqual(["S", "I"]);
    expect(seals.every((seal) => seal.dataset.paintSafe === "true")).toBe(true);
    expect(seals[0]?.querySelector("img")).toHaveAttribute(
      "src",
      filterCallsProject.modalPresentation?.stackAsset,
    );
    expect(seals[1]?.querySelector("img")).toHaveAttribute(
      "src",
      filterCallsProject.modalPresentation?.infoAsset,
    );
    expect(container.querySelector('[class*="filtercalls"]')).not.toBeInTheDocument();
    expect(container.querySelector('[class*="project7"]')).not.toBeInTheDocument();

    await user.click(seals[0]!);
    const stackPresentation = filterCallsProject.stackPresentation;
    if (stackPresentation === undefined) {
      throw new Error("ProjectCard test requires the FilterCalls Stack presentation.");
    }
    const stackDialog = screen.getByRole("dialog", { name: stackPresentation.title });
    expect(stackDialog).toBeVisible();
    expect(stackDialog).toHaveAttribute("aria-modal", "true");
    expect(within(stackDialog).getByText(stackPresentation.kicker, { exact: true })).toBeVisible();
    expect(stackDialog.querySelector(".project-card-modal-description")).toHaveTextContent(
      stackPresentation.introduction,
    );
    expect([...within(stackDialog).getByRole("list", { name: "Tecnologías del proyecto" }).querySelectorAll("li")].map((badge) => badge.textContent)).toEqual([
      "Android",
      "Kotlin",
      "Jetpack Compose",
      "Material 3",
      "DataStore",
      "Coroutines",
      "Gradle",
    ]);
    expect([...stackDialog.querySelectorAll(".project-one-stack-block")].map((block) => ({
      heading: block.querySelector("h3")?.textContent,
      description: block.querySelector("p")?.textContent,
    }))).toEqual(
      stackPresentation.blocks.map(({ heading, description }) => ({ heading, description })),
    );
    expect(stackDialog.querySelector(".project-one-stack-evidence")).toHaveTextContent(
      "600/809 · 4 CRITERIOS DE FILTRADO · EVALUACIÓN LOCAL AL RECIBIR LA LLAMADA.",
    );
    expect(stackDialog.querySelector(".project-one-stack-evidence")).not.toContainHTML(
      '<span class="project-inline-highlight">',
    );
    const stackCta = within(stackDialog).getByRole("link", { name: "Ver repositorio" });
    expect(stackCta).toHaveAttribute("href", "https://github.com/DevMPoveaCL/kurone-ko-filtercalls");
    expect(stackCta).toHaveAttribute("target", "_blank");
    expect(stackCta).toHaveAttribute("rel", "noopener noreferrer");
    expect([...stackDialog.querySelectorAll(".project-inline-highlight")].map((node) => node.textContent)).toEqual([
      ...(stackPresentation.introductionHighlights ?? []).map(({ text }) => text),
      ...stackPresentation.blocks.flatMap((block) => (block.descriptionHighlights ?? []).map(({ text }) => text)),
    ]);
    expect([...stackDialog.querySelectorAll(".project-inline-highlight")].map((node) => node.textContent)).not.toContain(
      stackPresentation.introduction,
    );
    expect(stackDialog.querySelector(".project-card-modal-close")).toHaveFocus();

    await user.keyboard("i");
    const infoPresentation = filterCallsProject.modalPresentation;
    if (infoPresentation === undefined) {
      throw new Error("ProjectCard test requires the FilterCalls Info presentation.");
    }
    const infoDialog = screen.getByRole("dialog", { name: infoPresentation.infoTitle ?? "" });
    expect(infoDialog).toBeVisible();
    expect(screen.queryByRole("dialog", { name: stackPresentation.title })).not.toBeInTheDocument();
    expect(within(infoDialog).getByText(infoPresentation.infoKicker ?? "", { exact: true })).toBeVisible();
    expect(infoDialog.querySelector(".project-card-modal-info-quote")).toHaveTextContent(
      infoPresentation.infoQuote ?? "",
    );
    expect([...infoDialog.querySelectorAll(".project-one-modal-sections h3")].map((heading) => heading.textContent)).toEqual([
      "THORYBOS",
      "PHYLAXIS",
    ]);
    for (const section of filterCallsProject.loreSections ?? []) {
      for (const paragraph of section.paragraphs) {
        expect(
          [...infoDialog.querySelectorAll(".project-one-modal-sections p")].filter(
            (node) => node.textContent === paragraph,
          ),
        ).toHaveLength(1);
      }
    }
    expect([...infoDialog.querySelectorAll(".project-inline-highlight")].map((node) => node.textContent)).toEqual(
      filterCallsProject.loreSections?.flatMap((section) =>
        section.paragraphs.flatMap((paragraph, index) =>
          section.paragraphHighlights?.[index]?.filter(({ text }) => paragraph.includes(text)).map(({ text }) => text) ?? [],
        ),
      ),
    );
    expect([...infoDialog.querySelectorAll(".project-inline-highlight")].map((node) => node.textContent)).not.toContain(
      filterCallsProject.loreSections?.map((section) => section.paragraphs).flat().join(" "),
    );

    await user.keyboard("s");
    expect(screen.getByRole("dialog", { name: stackPresentation.title })).toBeVisible();
    await user.keyboard("s");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(seals[0]).toHaveFocus();
  });

  it("maps Kurone-ko PymeFlow to the shared Stack-then-Info seals and exact modal content", async () => {
    if (pymeflowProject === undefined) {
      throw new Error("ProjectCard test requires the Kurone-ko PymeFlow project.");
    }

    const user = userEvent.setup();
    const { container } = render(<ProjectCard isActive project={pymeflowProject} />);
    const seals = [...container.querySelectorAll<HTMLButtonElement>(".project-card-seal")];

    expect(seals.map((seal) => seal.className)).toEqual([
      "project-card-seal project-card-seal-stack",
      "project-card-seal project-card-seal-info",
    ]);
    expect(seals.every((seal) => seal.dataset.paintSafe === "true")).toBe(true);
    expect(seals[0]?.querySelector("img")).toHaveAttribute(
      "src",
      pymeflowProject.modalPresentation?.stackAsset,
    );
    expect(seals[1]?.querySelector("img")).toHaveAttribute(
      "src",
      pymeflowProject.modalPresentation?.infoAsset,
    );

    await user.click(seals[0]!);
    const stackDialog = screen.getByRole("dialog", { name: "DE MOVIMIENTOS A CAJA VISIBLE" });
    expect(stackDialog).toHaveAttribute("aria-modal", "true");
    expect(within(stackDialog).getByText("CONTROL PARA LA CAJA COTIDIANA", { exact: true })).toBeVisible();
    expect(stackDialog.querySelector(".project-card-modal-description")).toHaveTextContent(
      "Cuando una pyme mantiene movimientos sin clasificar, pierde claridad sobre su caja y las obligaciones próximas. Construí Kurone-ko PymeFlow como un cockpit que transforma esa incertidumbre en movimientos revisables, categorías de Entrada o Salida y proyecciones a 7 o 30 días, dejando visible que el MVP usa datos simulados.",
    );
    expect([...within(stackDialog).getByRole("list", { name: "Tecnologías del proyecto" }).querySelectorAll("li")].map((badge) => badge.textContent)).toEqual([
      "Java 21",
      "Spring Boot 3",
      "PostgreSQL 16",
      "Flyway",
      "OpenAPI",
      "Docker",
      "JUnit 5",
      "ArchUnit",
    ]);
    expect([...stackDialog.querySelectorAll(".project-one-stack-block")].map((block) => ({
      heading: block.querySelector("h3")?.textContent,
      description: block.querySelector("p")?.textContent,
    }))).toEqual(
      pymeflowProject.stackPresentation?.blocks.map(({ heading, description }) => ({
        heading,
        description,
      })),
    );
    expect(stackDialog.querySelectorAll(".project-one-stack-block")[1]?.querySelector("p")).toHaveTextContent(
      "Persistí movimientos, preferencias y sincronizaciones en PostgreSQL 16 mediante JDBC. Versioné el esquema con Flyway y generé una huella SHA-256 cuando faltaba una referencia segura, evitando duplicar registros.",
    );
    expect(stackDialog.querySelector(".project-one-stack-evidence")).toHaveTextContent(
      "PROYECCIÓN 7/30 DÍAS · HUELLA SHA-256 · 6 MIGRACIONES FLYWAY · 365 TESTS DOCUMENTADOS.",
    );
    expect(stackDialog.querySelector(".project-one-stack-evidence")).not.toContainHTML(
      '<span class="project-inline-highlight">',
    );
    const cta = within(stackDialog).getByRole("link", { name: "Ver repositorio" });
    expect(cta).toHaveAttribute("href", "https://github.com/DevMPoveaCL/kurone-ko-pymeflow");
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", "noopener noreferrer");
    expect([...stackDialog.querySelectorAll(".project-inline-highlight")].map((node) => node.textContent)).toEqual([
      "movimientos sin clasificar",
      "pierde claridad",
      "Kurone-ko PymeFlow",
      "Entrada o Salida",
      "7 o 30 días",
      "datos simulados",
      "Java 21",
      "Spring Boot 3",
      "puertos y adaptadores",
      "dominio separado",
      "PostgreSQL 16",
      "Flyway",
      "huella SHA-256",
      "evitando duplicar registros",
      "OpenAPI",
      "movimientos revisados",
      "pendientes",
      "datos sensibles bloqueados",
      "Docker",
      "entorno reproducible",
      "JUnit 5",
      "ArchUnit",
      "dependencias permitidas",
    ]);
    expect([...stackDialog.querySelectorAll(".project-inline-highlight")].map((node) => node.textContent)).not.toContain(
      pymeflowProject.stackPresentation?.introduction,
    );

    await user.keyboard("i");
    const infoDialog = screen.getByRole("dialog", { name: "KURONE-KO PYMEFLOW" });
    expect(screen.queryByRole("dialog", { name: "DE MOVIMIENTOS A CAJA VISIBLE" })).not.toBeInTheDocument();
    expect(within(infoDialog).getByText("UNA NECESIDAD DE PYME LLEVADA A SOFTWARE", { exact: true })).toBeVisible();
    expect(infoDialog.querySelector(".project-card-modal-info-quote")).toHaveTextContent(
      "Antes de intentar construir un sistema completo, decidí comprobar si podía ordenar movimientos y proyectar caja de una forma clara.",
    );
    expect([...infoDialog.querySelectorAll(".project-one-modal-sections h3")].map((heading) => heading.textContent)).toEqual([
      "GÉNESIS",
      "PRAXIS",
    ]);
    for (const section of pymeflowProject.loreSections ?? []) {
      for (const paragraph of section.paragraphs) {
        expect(
          [...infoDialog.querySelectorAll(".project-one-modal-sections p")].filter(
            (node) => node.textContent === paragraph,
          ),
        ).toHaveLength(1);
      }
    }
    expect([...infoDialog.querySelectorAll(".project-inline-highlight")].map((node) => node.textContent)).toEqual([
      "mercado laboral chileno",
      "Java",
      "Spring Boot",
      "Docker",
      "soluciones para pymes",
      "Kurone-ko POS",
      "Kurone-ko SII",
      "PymeFlow",
      "kit de software para pymes",
      "formación universitaria en contabilidad",
      "experiencia trabajando con pymes",
      "caja",
      "impuestos",
      "orden operativo",
      "representar mediante software",
      "acotar el alcance",
      "flujo de caja",
      "proveedores simulados",
      "saldo inicial manual",
      "7 o 30 días",
      "MVP",
      "decisiones de software",
      "Entradas y Salidas",
      "ingesta sin duplicados",
      "arquitectura verificable y mantenible",
    ]);
    expect([...infoDialog.querySelectorAll(".project-inline-highlight")].map((node) => node.textContent)).not.toContain(
      pymeflowProject.loreSections?.map((section) => section.paragraphs).flat().join(" "),
    );

    await user.keyboard("s");
    expect(screen.getByRole("dialog", { name: "DE MOVIMIENTOS A CAJA VISIBLE" })).toBeVisible();
    await user.keyboard("s");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(seals[0]).toHaveFocus();
  });

  it("opens the Translator Info and Stack modals with exact content and restores focus on close", async () => {
    if (informationProject === undefined) {
      throw new Error("ProjectCard test requires the information project.");
    }

    const user = userEvent.setup();
    render(
      <ProjectCard
        project={informationProject}
        unlockedChallengeIds={[PROJECT_UNLOCK_CHALLENGE_ID]}
      />,
    );

    const infoControl = screen.getByRole("button", {
      name: `Ver historia de ${informationProject.name}`,
    });
    await user.click(infoControl);

    const panel = screen.getByRole("dialog", { name: "KURONE-KO TRANSLATOR" });
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect(
      screen.getByRole("button", {
        name: `Cerrar información de ${informationProject.name}`,
      }),
    ).toHaveFocus();
    expect(screen.getByText("CUANDO NO ENTENDER A TIEMPO TAMBIÉN ES QUEDAR EXPUESTO")).toBeVisible();
    expect(screen.getByText("Quería que la tecnología me ayudara a permanecer en la conversación, no que hablara por mí.")).toBeVisible();
    expect(screen.getByRole("heading", { name: "HERMENEIA" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "METAXY" })).toBeVisible();

    const closeControl = screen.getByRole("button", {
      name: `Cerrar información de ${informationProject.name}`,
    });
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(closeControl).toHaveFocus();
    await user.keyboard("{Tab}");
    expect(closeControl).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(infoControl).toHaveFocus();

    const stackControl = screen.getByRole("button", {
      name: `Ver stack de ${informationProject.name}`,
    });
    await user.click(stackControl);
    const stackPanel = screen.getByRole("dialog", { name: "ENTENDER A TIEMPO PARA PODER RESPONDER" });
    expect(stackPanel.querySelector(".project-one-stack-evidence")).toHaveTextContent(
      "ALEMÁN + ESPAÑOL · CONTEXTO ACUMULADO · RESPUESTA SIN TTS · VOZ PROPIA",
    );

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(stackControl).toHaveFocus();
  });

  it("maps the project one stack seal to factual metadata and restores its focus", async () => {
    if (project === undefined) {
      throw new Error(
        "ProjectCard test requires the Software Engineering Playbook project.",
      );
    }

    const user = userEvent.setup();
    render(<ProjectCard project={project} />);

    const stackSeal = screen.getByRole("button", {
      name: `Ver stack de ${project.name}`,
    });
    await user.click(stackSeal);

    const stackDialog = screen.getByRole("dialog", { name: "ARQUITECTURA" });
    expect(stackDialog).toBeVisible();
    for (const badge of project.stackPresentation?.badges ?? []) {
      expect(screen.getByText(badge, { exact: true })).toBeVisible();
    }
    for (const block of project.stackPresentation?.blocks ?? []) {
      expect(screen.getByRole("heading", { name: block.heading })).toBeVisible();
    }
    const technicalBase = project.stackPresentation?.technicalBase;
    if (technicalBase === undefined) {
      throw new Error("ProjectCard test requires the Project One technical base.");
    }
    expect(stackDialog.querySelector(".project-one-stack-base p")).toHaveTextContent(
      technicalBase.value,
    );
      const evidence = stackDialog.querySelector(".project-one-stack-evidence");
      expect(evidence).toBeVisible();
      expect(evidence).toHaveClass("project-one-stack-evidence");
    expect(
      screen.getByRole("button", {
        name: `Cerrar stack de ${project.name}`,
      }),
    ).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(stackSeal).toHaveFocus();
  });

  it("toggles and switches Project One modals with S/I without leaving seal focus stuck", async () => {
    if (project === undefined) {
      throw new Error("ProjectCard test requires the Software Engineering Playbook project.");
    }

    const user = userEvent.setup();
    render(<><div className="project-carousel" data-carousel-focus-target="true" tabIndex={-1} /><ProjectCard isActive project={project} /></>);
    const carousel = document.querySelector<HTMLElement>(".project-carousel");
    if (carousel === null) throw new Error("ProjectCard test requires a focus fallback.");
    carousel.focus();

    await user.keyboard("s");
    expect(screen.getByRole("dialog", { name: "ARQUITECTURA" })).toBeVisible();
    await user.keyboard("s");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(carousel).toHaveFocus();

    await user.keyboard("i");
    expect(screen.getByRole("dialog", { name: project.name })).toBeVisible();
    await user.keyboard("s");
    expect(screen.getByRole("dialog", { name: "ARQUITECTURA" })).toBeVisible();
    expect(screen.queryByRole("dialog", { name: project.name })).not.toBeInTheDocument();
    await user.keyboard("i");
    expect(screen.getByRole("dialog", { name: project.name })).toBeVisible();
    await user.keyboard("i");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(carousel).toHaveFocus();
  });

  it("maps the project one info seal to the exact typed lore without duplication", async () => {
    if (project === undefined) {
      throw new Error(
        "ProjectCard test requires the Software Engineering Playbook project.",
      );
    }

    const user = userEvent.setup();
    render(<ProjectCard project={project} />);

    const infoSeal = screen.getByRole("button", {
      name: `Ver historia de ${project.name}`,
    });
    await user.click(infoSeal);

    const infoDialog = screen.getByRole("dialog", { name: project.name });
    expect(infoDialog).toBeVisible();
     const infoQuoteText =
       "A veces, el verdadero problema no es la falta de información, sino su inmensidad.";
     const infoKicker = infoDialog.querySelector(".project-card-modal-description-info");
     expect(infoKicker).toHaveTextContent("Los caminos que me gustaría recorrer");
     expect(infoKicker).not.toHaveTextContent(/[“”]/u);
     const infoQuote = infoDialog.querySelector(".project-card-modal-info-quote");
    expect(infoQuote?.querySelector("q")).toHaveAttribute("lang", "es");
    expect(infoQuote).toHaveClass("project-card-modal-info-quote");
    expect(infoQuote).toHaveTextContent(infoQuoteText);
    expect(infoDialog).toHaveAttribute(
      "aria-describedby",
      "software-engineering-playbook-project-modal-info-quote",
    );
    expect(infoDialog.querySelectorAll(".project-card-modal-info-quote q")).toHaveLength(1);
    expect(infoDialog.querySelectorAll(`[id="software-engineering-playbook-project-modal-info-quote"]`)).toHaveLength(1);
    const infoTitle = infoDialog.querySelector("h2");
    const closeButton = infoDialog.querySelector(".project-card-modal-close");
    expect(infoTitle?.compareDocumentPosition(infoQuote!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(infoQuote?.compareDocumentPosition(closeButton!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(infoQuote?.compareDocumentPosition(infoDialog.querySelector(".project-card-modal-content")!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(within(infoDialog).getAllByText(infoQuoteText, { exact: true })).toHaveLength(1);
    for (const section of project.loreSections ?? []) {
      expect(within(infoDialog).getByRole("heading", { name: section.heading })).toBeVisible();
      for (const paragraph of section.paragraphs) {
        expect(
          within(infoDialog).getAllByText((_, element) => element?.textContent === paragraph),
        ).toHaveLength(1);
      }
    }
    const genesisSection = within(infoDialog)
      .getByRole("heading", { name: "Génesis" })
      .closest("section");
    const firstGenesisParagraph = genesisSection?.querySelector("p");
    expect(firstGenesisParagraph).not.toHaveClass("project-card-modal-info-quote");
    expect(firstGenesisParagraph).not.toHaveClass("project-one-lore-thesis");
    expect(within(infoDialog).getAllByRole("heading", { level: 3 })).toHaveLength(2);
    expect(screen.queryByText("Contexto", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("Resumen", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("Estado", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("Historia del proyecto", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("Narrativa completa registrada para este proyecto.", { exact: true })).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: `Cerrar información de ${project.name}`,
      }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(infoSeal).toHaveFocus();
  });

  it("maps the Timer seals to its approved Stack and Info presentations", async () => {
    if (timerProject === undefined) {
      throw new Error("ProjectCard test requires the Kurone-ko Timer project.");
    }

    const user = userEvent.setup();
    render(<ProjectCard isActive project={timerProject} />);

    expect(document.querySelector('[data-card-band="top"] .fitted-band-text')).toHaveTextContent(
      "Kurone-ko Timer",
    );
    expect(document.querySelector('[data-card-band="bottom"] .fitted-band-text')).toHaveTextContent(
      "Retomar lo pendiente",
    );
    expect(screen.getByRole("button", { name: `Ver stack de ${timerProject.name}` })).toBeVisible();
    expect(screen.getByRole("button", { name: `Ver historia de ${timerProject.name}` })).toBeVisible();

    await user.click(screen.getByRole("button", { name: `Ver stack de ${timerProject.name}` }));
    const stackDialog = screen.getByRole("dialog", { name: "FOCO SIN DISTRACCIONES" });
    expect(stackDialog).toBeVisible();
    expect(screen.getByText("TECNOLOGÍAS Y FUNCIONAMIENTO", { exact: true })).toBeVisible();
    const introduction = stackDialog.querySelector(".project-card-modal-description");
    expect(introduction).toBeVisible();
    expect(introduction?.textContent).toBe(timerProject.stackPresentation?.introduction);
    expect(stackDialog.querySelector(".project-card-modal-info-quote")).not.toBeInTheDocument();
    expect(stackDialog).toHaveAttribute(
      "aria-describedby",
      "timer-project-modal-description",
    );
    expect(within(stackDialog).queryByRole("heading", { name: "Base técnica" })).not.toBeInTheDocument();
    for (const heading of [
      "Dashboard y widget flotante",
      "Interfaz y estados de sesión",
      "Ventanas nativas y datos locales",
      "Pruebas del comportamiento",
    ]) {
      expect(within(stackDialog).getByRole("heading", { name: heading })).toBeVisible();
    }
    expect(stackDialog.textContent).not.toContain("estado compartido de la interfaz y la aplicación");
    for (const heading of [
      "Dos ventanas, un mismo estado",
      "Sesiones y descansos",
      "Música e historial",
      "Control desde el teclado",
    ]) {
      expect(within(stackDialog).queryByRole("heading", { name: heading })).not.toBeInTheDocument();
    }
    for (const block of timerProject.stackPresentation?.blocks ?? []) {
      expect(
        [...stackDialog.querySelectorAll(".project-one-stack-block p")].some(
          (paragraph) => paragraph.textContent === block.description,
        ),
      ).toBe(true);
    }
    expect(within(stackDialog).queryByText(
      "Comandos Tauri para snapshot, historial, ajustes y posición de ventanas; smoke E2E sobre las dos ventanas.",
      { exact: true },
    )).not.toBeInTheDocument();
     const evidence = within(stackDialog).getByText(
       "Control completo con teclado o ratón · ventanas arrastrables.",
       { exact: true },
     );
    const githubLink = within(stackDialog).getByRole("link", {
      name: /Ver el proyecto en GitHub/,
    });
     expect(evidence).toBeVisible();
     expect(evidence).toHaveClass("project-one-stack-evidence");
    expect(
      evidence.compareDocumentPosition(githubLink) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(githubLink).toHaveAttribute(
      "href",
      "https://github.com/DevMPoveaCL/kurone-ko-timer",
    );
    await user.keyboard("{Escape}");

     await user.click(screen.getByRole("button", { name: `Ver historia de ${timerProject.name}` }));
      const infoDialog = screen.getByRole("dialog", { name: "KURONE-KO TIMER" });
      expect(infoDialog).toBeVisible();
      expect(screen.getByText("HISTORIA DEL PROYECTO", { exact: true })).toBeVisible();
       const infoQuote = infoDialog.querySelector(".project-card-modal-info-quote");
      const infoQuoteText =
        "Había una vez un equipo que quiso construir una herramienta de productividad con muchas funcionalidades, pero la deuda técnica atacó y la idea creció más rápido que nuestra capacidad de terminarla.";
       expect(infoQuote?.querySelector("q")).toHaveAttribute("lang", "es");
       expect(infoQuote).toHaveClass("project-card-modal-info-quote");
       expect(infoQuote).toHaveTextContent(infoQuoteText);
      expect(infoDialog).toHaveAttribute(
        "aria-describedby",
        "timer-project-modal-info-quote",
      );
      expect(infoDialog.querySelectorAll(".project-card-modal-info-quote q")).toHaveLength(1);
      expect(infoDialog.querySelectorAll(`[id="timer-project-modal-info-quote"]`)).toHaveLength(1);
      const infoTitle = infoDialog.querySelector("h2");
      const closeButton = infoDialog.querySelector(".project-card-modal-close");
      expect(infoTitle?.compareDocumentPosition(infoQuote!)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
      expect(infoQuote?.compareDocumentPosition(closeButton!)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
      expect(infoQuote?.compareDocumentPosition(infoDialog.querySelector(".project-card-modal-content")!)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
      const genesisSection = within(infoDialog)
        .getByRole("heading", { name: "Génesis" })
        .closest("section");
      expect(genesisSection).toHaveTextContent("Fui partícipe");
      const firstGenesisParagraph = genesisSection?.querySelector("p");
      expect(firstGenesisParagraph).not.toHaveClass("project-card-modal-info-quote");
      expect(firstGenesisParagraph).not.toHaveClass("project-one-lore-thesis");
      expect(infoDialog.querySelectorAll(`q`)).toHaveLength(1);
     for (const section of timerProject.loreSections ?? []) {
       expect(within(infoDialog).getByRole("heading", { name: section.heading })).toBeVisible();
      for (const paragraph of section.paragraphs) {
        expect(
          [...infoDialog.querySelectorAll(".project-one-modal-sections p")].filter(
            (element) => element.textContent === paragraph,
          ),
        ).toHaveLength(1);
      }
     }
      expect(within(infoDialog).getAllByText(infoQuoteText, { exact: true })).toHaveLength(1);
     });

  it("maps Farmacias LinLin to the shared Stack-then-Info seal structure and exact modal content", async () => {
    if (farmaciaProject === undefined) {
      throw new Error("ProjectCard test requires the Farmacias LinLin project.");
    }

    const user = userEvent.setup();
    const { container } = render(<ProjectCard isActive project={farmaciaProject} />);
    const seals = [...container.querySelectorAll<HTMLButtonElement>(".project-card-seal")];

    expect(seals).toHaveLength(2);
    expect(seals.map((seal) => seal.className)).toEqual([
      "project-card-seal project-card-seal-stack",
      "project-card-seal project-card-seal-info",
    ]);
    expect(seals.map((seal) => seal.getAttribute("aria-keyshortcuts"))).toEqual(["S", "I"]);
    expect(seals.every((seal) => seal.dataset.paintSafe === "true")).toBe(true);
    expect(seals.some((seal) => /farmacia|project3|project-three/u.test(seal.className))).toBe(false);
    expect(seals[0]?.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining(farmaciaProject.modalPresentation?.stackAsset ?? ""),
    );
    expect(seals[1]?.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining(farmaciaProject.modalPresentation?.infoAsset ?? ""),
    );

    await user.click(seals[0]!);
    const stackDialog = screen.getByRole("dialog", { name: "COMERCIO BAJO REGLAS REALES" });
    expect(stackDialog).toBeVisible();
    expect(within(stackDialog).getByText("TECNOLOGÍA Y OPERACIÓN FARMACÉUTICA", { exact: true })).toBeVisible();
    expect(stackDialog.querySelector(".project-card-modal-description")).toHaveTextContent(
      "Farmacias LinLin conecta la venta online con la operación de una farmacia física. El sistema organiza catálogo, pedidos, recetas y despachos aplicando condiciones de venta y permisos según cada rol.",
    );
    const badges = within(stackDialog).getByRole("list", { name: "Tecnologías del proyecto" });
    expect([...badges.querySelectorAll("li")].map((badge) => badge.textContent)).toEqual([
      "Angular 18",
      "Ionic 8",
      "TypeScript",
      "RxJS",
      "Firebase",
      "Capacitor",
      "Playwright",
    ]);
    expect([...stackDialog.querySelectorAll(".project-one-stack-block")].map((block) => ({
      heading: block.querySelector("h3")?.textContent,
      description: block.querySelector("p")?.textContent,
    }))).toEqual(
      farmaciaProject.stackPresentation?.blocks.map(({ heading, description }) => ({
        heading,
        description,
      })),
    );
      const evidence = stackDialog.querySelector(".project-one-stack-evidence");
      if (evidence === null) throw new Error("Farmacias LinLin stack evidence is required.");
      expect(evidence).toHaveTextContent(
        "Cada pedido conserva su estado, historial y evidencia durante todo el proceso.",
      );
    expect(evidence).toHaveClass("project-one-stack-evidence");
    const cta = within(stackDialog).getByRole("link", { name: /Ver aplicación/u });
    expect(cta).toHaveAttribute("href", "https://farmacialinlin.web.app");
    expect(evidence.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.keyboard("{Escape}");
    await user.click(seals[1]!);
    const infoDialog = screen.getByRole("dialog", { name: "FARMACIAS LINLIN" });
    expect(infoDialog).toBeVisible();
    expect(within(infoDialog).getByText("UNA FARMACIA, UN NUEVO CANAL", { exact: true })).toBeVisible();
    const quote = infoDialog.querySelector(".project-card-modal-info-quote");
    expect(quote?.querySelector("q")).toHaveAttribute("lang", "es");
    expect(quote).toHaveTextContent(
      "Hay proyectos que no nacen desde una idea llamativa, sino desde procesos cotidianos que necesitan encontrar una nueva forma de llegar a las personas.",
    );
    expect(infoDialog).toHaveAttribute(
      "aria-describedby",
      "farmacia-linlin-project-modal-info-quote",
    );
    expect(infoDialog.querySelectorAll(".project-card-modal-info-quote q")).toHaveLength(1);
    const loreSections = [...infoDialog.querySelectorAll(".project-one-modal-sections > section")];
    expect(loreSections.map((section) => ({
      heading: section.querySelector("h3")?.textContent,
      paragraphs: [...section.querySelectorAll("p")].map((paragraph) => paragraph.textContent),
    }))).toEqual(
      farmaciaProject.loreSections?.map(({ heading, paragraphs }) => ({
        heading,
        paragraphs,
      })),
    );
    expect(loreSections.map((section) => section.querySelector("h3")?.textContent)).toEqual([
      "ANANKE",
      "NOMOS",
    ]);
  });

  it("maps Elemental Queens to the shared Stack-then-Info seals and modal behavior", async () => {
    if (elementalProject === undefined) {
      throw new Error("ProjectCard test requires the Elemental Queens project.");
    }

    const user = userEvent.setup();
    const { container } = render(<ProjectCard isActive project={elementalProject} />);
    const seals = [...container.querySelectorAll<HTMLButtonElement>(".project-card-seal")];

    expect(seals.map((seal) => seal.className)).toEqual([
      "project-card-seal project-card-seal-stack",
      "project-card-seal project-card-seal-info",
    ]);
    expect(seals.every((seal) => seal.dataset.paintSafe === "true")).toBe(true);
    expect(container.querySelector('[class*="elemental"]')).not.toBeInTheDocument();
    expect(seals[0]?.querySelector("img")).toHaveAttribute(
      "src",
      elementalProject.modalPresentation?.stackAsset,
    );
    expect(seals[1]?.querySelector("img")).toHaveAttribute(
      "src",
      elementalProject.modalPresentation?.infoAsset,
    );

    await user.click(seals[0]!);
    const stackDialog = screen.getByRole("dialog", {
      name: "UN UNIVERSO TÁCTICO EN LA WEB",
    });
    expect(stackDialog).toBeVisible();
    expect(stackDialog).toHaveAttribute("aria-modal", "true");
    expect(within(stackDialog).getByText("TECNOLOGÍA Y NARRATIVA INTERACTIVA", { exact: true })).toBeVisible();
    expect(stackDialog.querySelector(".project-card-modal-description")).toHaveTextContent(
      "Construí Elemental Queens como una landing conceptual que presenta la identidad, las cartas y las reglas fundamentales de un futuro videojuego mediante una experiencia web navegable.",
    );
    expect(within(stackDialog).getByRole("list", { name: "Tecnologías del proyecto" })).toHaveTextContent(
      "Astro 6TypeScriptTailwind CSS 4Vite 7Playwright",
    );
    for (const block of elementalProject.stackPresentation?.blocks ?? []) {
      expect(
        [...stackDialog.querySelectorAll(".project-one-stack-block p")].some(
          (paragraph) => paragraph.textContent === block.description,
        ),
      ).toBe(true);
    }
    expect(stackDialog.querySelector(".project-one-stack-evidence")).toHaveTextContent(
      "E2E EN MÓVIL Y ESCRITORIO · ASSETS WEBP DE 300 A 1600 PX · DESPLIEGUE EN CLOUDFLARE PAGES.",
    );
    const cta = within(stackDialog).getByRole("link", { name: "Ver Landing Page" });
    expect(cta).toHaveAttribute("href", "https://kurone-ko-elementaltcg.pages.dev/");
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", "noopener noreferrer");

    await user.keyboard("i");
    expect(screen.getByRole("dialog", { name: "ELEMENTAL QUEENS" })).toBeVisible();
    expect(screen.queryByRole("dialog", { name: "UN UNIVERSO TÁCTICO EN LA WEB" })).not.toBeInTheDocument();
    await user.keyboard("s");
    expect(screen.getByRole("dialog", { name: "UN UNIVERSO TÁCTICO EN LA WEB" })).toBeVisible();
    await user.keyboard("{Escape}");

    await user.click(seals[1]!);
    const infoDialog = screen.getByRole("dialog", { name: "ELEMENTAL QUEENS" });
    expect(infoDialog).toBeVisible();
    expect(infoDialog).toHaveAttribute("aria-modal", "true");
    expect(within(infoDialog).getByText("UNA IDEA QUE CRECIÓ CONMIGO", { exact: true })).toBeVisible();
    expect(infoDialog.querySelector("h2")).toHaveTextContent("ELEMENTAL QUEENS");
    expect(
      [...infoDialog.querySelectorAll(".project-one-modal-sections h3")].map(
        (heading) => heading.textContent,
      ),
    ).toEqual(["MNEME", "POIESIS"]);
    expect(infoDialog.querySelector(".project-card-modal-info-quote")).toHaveTextContent(
      "Hay ideas que no desaparecen al crecer; esperan hasta que aprendemos cómo empezar a construirlas.",
    );
    for (const section of elementalProject.loreSections ?? []) {
      expect(within(infoDialog).getByRole("heading", { name: section.heading })).toBeVisible();
      for (const paragraph of section.paragraphs) {
        expect(
          [...infoDialog.querySelectorAll(".project-one-modal-sections p")].filter(
            (node) => node.textContent === paragraph,
          ),
        ).toHaveLength(1);
      }
    }
  });

  it("maps Kurone-ko Alarm to the shared Stack-then-Info seals and exact modal content", async () => {
    if (alarmProject === undefined) {
      throw new Error("ProjectCard test requires the Kurone-ko Alarm project.");
    }

    const user = userEvent.setup();
    const { container } = render(<ProjectCard isActive project={alarmProject} />);
    const seals = [...container.querySelectorAll<HTMLButtonElement>(".project-card-seal")];

    expect(seals.map((seal) => seal.className)).toEqual([
      "project-card-seal project-card-seal-stack",
      "project-card-seal project-card-seal-info",
    ]);
    expect(seals.every((seal) => seal.dataset.paintSafe === "true")).toBe(true);
    expect(container.querySelector('[class*="alarm"]')).not.toBeInTheDocument();
    expect(seals[0]?.querySelector("img")).toHaveAttribute(
      "src",
      alarmProject.modalPresentation?.stackAsset,
    );
    expect(seals[1]?.querySelector("img")).toHaveAttribute(
      "src",
      alarmProject.modalPresentation?.infoAsset,
    );

    await user.click(seals[0]!);
    const stackDialog = screen.getByRole("dialog", { name: "DE PLANILLA A ALARMA" });
    expect(stackDialog).toBeVisible();
    expect(within(stackDialog).getByText("SOLUCIÓN PARA UNA RUTINA COTIDIANA", { exact: true })).toBeVisible();
    expect(stackDialog.querySelector(".project-card-modal-description")).toHaveTextContent(
      alarmProject.stackPresentation?.introduction ?? "",
    );
    expect([...within(stackDialog).getByRole("list", { name: "Tecnologías del proyecto" }).querySelectorAll("li")].map((badge) => badge.textContent)).toEqual([
      "Flutter",
      "Dart",
      "Riverpod",
      "Drift",
      "SQLite",
      "Excel",
      "Kotlin",
      "Android",
    ]);
    expect([...stackDialog.querySelectorAll(".project-one-stack-block")].map((block) => ({
      heading: block.querySelector("h3")?.textContent,
      description: block.querySelector("p")?.textContent,
    }))).toEqual(
      alarmProject.stackPresentation?.blocks.map(({ heading, description }) => ({
        heading,
        description,
      })),
    );
    expect(stackDialog.querySelector(".project-one-stack-evidence")).toHaveTextContent(
      "EXCEL REVISABLE · SIN INTERNET NI LLM · PERSISTENCIA TRAS REINICIO · HISTORIAL ALARMAS 24 HORAS.",
    );
    expect(stackDialog.querySelector(".project-one-stack-evidence")).not.toHaveTextContent(
      /PREAVISO 1 MINUTO ANTES|RESTAURACIÓN TRAS EL REINICIO|HISTORIAL LOCAL DE 24 HORAS/iu,
    );
    expect(stackDialog.querySelector(".project-one-stack-evidence")).not.toContainHTML(
      '<span class="project-inline-highlight">',
    );
    const cta = within(stackDialog).getByRole("link", { name: "Ver repositorio" });
    expect(cta).toHaveAttribute("href", "https://github.com/DevMPoveaCL/kurone-ko-alarm");
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", "noopener noreferrer");
    expect([...stackDialog.querySelectorAll(".project-inline-highlight")].map((node) => node.textContent)).toEqual([
      "Kurone-ko Alarm",
      "turnos rotativos",
      "alarmas revisables",
      "dispositivo Android",
      "una por una",
      "Excel",
      "horarios editables",
      "OCR local",
      "Google ML Kit",
      "versión 1.0",
      "Flutter",
      "Dart",
      "Riverpod",
      "corregir fechas y horas",
        "bloqueé datos incompletos",
      "Drift",
      "SQLite",
      "alarmas activas",
      "historial local",
      "sin depender de cuentas",
      "Kotlin",
      "Android",
      "MethodChannel",
      "alarmas exactas",
        "restaurarlas",
      "flutter_test",
      "Mocktail",
    ]);

    await user.keyboard("i");
    expect(screen.getByRole("dialog", { name: "KURONE-KO ALARM" })).toBeVisible();
    expect(screen.queryByRole("dialog", { name: "DE PLANILLA A ALARMA" })).not.toBeInTheDocument();
    const infoDialog = screen.getByRole("dialog", { name: "KURONE-KO ALARM" });
    expect(within(infoDialog).getByText("AYUDANDO A UN AMIGO", { exact: true })).toBeVisible();
    expect(infoDialog.querySelector(".project-card-modal-info-quote")).toHaveTextContent(
      "Cada semana, una nueva planilla significaba volver a configurar todas las alarmas.",
    );
    expect([...infoDialog.querySelectorAll(".project-one-modal-sections h3")].map((heading) => heading.textContent)).toEqual([
      "GÉNESIS",
      "PARADOSIS",
    ]);
    expect(infoDialog).not.toHaveTextContent("AITIA");
    for (const section of alarmProject.loreSections ?? []) {
      for (const paragraph of section.paragraphs) {
        expect(
          [...infoDialog.querySelectorAll(".project-one-modal-sections p")].filter(
            (node) => node.textContent === paragraph,
          ),
        ).toHaveLength(1);
      }
    }
    expect([...infoDialog.querySelectorAll(".project-inline-highlight")].map((node) => node.textContent)).toEqual([
      "amigo cercano",
      "turnos rotativos",
      "planilla Excel",
      "una por una",
      "ayudarlo",
      "preparar las alarmas",
      "revisión manual",
      "cada planificación",
      "paso a paso",
      "MVP",
      "corrigiendo errores",
      "base funcional",
      "ordenar lo que sabía",
      "explicarlo con claridad",
      "otra persona pudiera comprender",
      "seguir desarrollando",
    ]);
    await user.keyboard("s");
    expect(screen.getByRole("dialog", { name: "DE PLANILLA A ALARMA" })).toBeVisible();
    await user.keyboard("s");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(seals[0]).toHaveFocus();
  });

  it.each([
    { expectedName: "Kurone-ko POS", projectId: "kuroneko-pos" },
    { expectedName: "Kurone-ko SII", projectId: "kuroneko-sii" },
  ] as const)("keeps $projectId behind the shared unlock gate and renders its CTA-free modals after unlock", async ({ expectedName, projectId }) => {
    const projectUnderTest = PROJECTS.find((candidate) => candidate.id === projectId);
    if (projectUnderTest?.modalPresentation === undefined || projectUnderTest.stackPresentation === undefined) {
      throw new Error(`ProjectCard test requires the ${expectedName} modal presentations.`);
    }

    const user = userEvent.setup();
    const { container, rerender } = render(<ProjectCard isActive project={projectUnderTest} />);
    const seals = [...container.querySelectorAll<HTMLButtonElement>(".project-card-seal")];
    const stackSeal = seals[0];
    const infoSeal = seals[1];
    if (stackSeal === undefined || infoSeal === undefined) throw new Error(`${expectedName} seals are unavailable.`);

    await user.click(stackSeal);
    expect(screen.getByRole("dialog", { name: "ACERTIJO" })).toBeVisible();
    expect(screen.queryByRole("dialog", { name: projectUnderTest.stackPresentation.title })).not.toBeInTheDocument();
    await user.keyboard("s");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "ACERTIJO" })).not.toBeInTheDocument());

    await user.click(infoSeal);
    expect(screen.getByRole("dialog", { name: "ACERTIJO" })).toBeVisible();
    expect(screen.queryByRole("dialog", { name: projectUnderTest.modalPresentation.infoTitle ?? "" })).not.toBeInTheDocument();
    await user.keyboard("i");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "ACERTIJO" })).not.toBeInTheDocument());

    rerender(<ProjectCard isActive project={projectUnderTest} unlockedChallengeIds={[PROJECT_UNLOCK_CHALLENGE_ID]} />);
    await user.click(screen.getByRole("button", { name: `Ver stack de ${expectedName}` }));
    const stackDialog = screen.getByRole("dialog", { name: projectUnderTest.stackPresentation.title });
    expect(stackDialog).toBeVisible();
    expect(within(stackDialog).getByText(projectUnderTest.stackPresentation.kicker, { exact: true })).toBeVisible();
    expect(stackDialog.querySelector(".project-card-modal-description")).toHaveTextContent(projectUnderTest.stackPresentation.introduction);
    expect([...stackDialog.querySelectorAll(".project-one-stack-badges li")].map((badge) => badge.textContent)).toEqual(getProjectPresentationBadges(projectUnderTest));
    expect([...stackDialog.querySelectorAll(".project-one-stack-block")].map((block) => ({
      heading: block.querySelector("h3")?.textContent,
      description: block.querySelector("p")?.textContent,
    }))).toEqual(projectUnderTest.stackPresentation.blocks.map(({ heading, description }) => ({ heading, description })));
    expect(stackDialog.querySelector(".project-one-stack-evidence")).toHaveTextContent(projectUnderTest.stackPresentation.evidence ?? "");
    expect(stackDialog.querySelector(".project-one-stack-cta")).not.toBeInTheDocument();

    await user.keyboard("i");
    const infoDialog = screen.getByRole("dialog", { name: projectUnderTest.modalPresentation.infoTitle ?? "" });
    expect(infoDialog).toBeVisible();
    expect(screen.queryByRole("dialog", { name: projectUnderTest.stackPresentation.title })).not.toBeInTheDocument();
    expect(within(infoDialog).getByText(projectUnderTest.modalPresentation.infoKicker ?? "", { exact: true })).toBeVisible();
    expect(infoDialog.querySelector(".project-card-modal-info-quote")).toHaveTextContent(projectUnderTest.modalPresentation.infoQuote ?? "");
    expect([...infoDialog.querySelectorAll(".project-one-modal-sections h3")].map((heading) => heading.textContent)).toEqual(projectUnderTest.loreSections?.map(({ heading }) => heading));
    expect([...infoDialog.querySelectorAll(".project-inline-highlight")].map((node) => node.textContent)).toEqual([
      ...(projectUnderTest.loreSections?.flatMap((section) => section.paragraphHighlights?.flatMap((highlights) => highlights.map(({ text }) => text)) ?? []) ?? []),
    ]);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(infoSeal).toHaveFocus();

    await user.click(stackSeal);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(stackSeal).toHaveFocus();
  });

  it("renders only the data-selected inline highlights in every implemented modal", async () => {
    if (
      project === undefined ||
      timerProject === undefined ||
      farmaciaProject === undefined ||
      elementalProject === undefined ||
      alarmProject === undefined ||
      filterCallsProject === undefined
    ) {
      throw new Error("ProjectCard highlight coverage requires the implemented modal projects.");
    }

    const user = userEvent.setup();
    const cases = [
      {
        info: ["«Khaos»", "“vacío primordial”", "«Khaos»", "arquitectura", "buenas prácticas"],
        project,
        stack: [
          "Markdown-first",
          "fundamentos",
          "aplicación",
          "integración",
          "GitHub Actions",
          "01/02/03",
          "voz",
          "secuencia",
          "coherencia",
        ],
      },
      {
        info: [
          "bootcamp de programación",
          "proyecto integrador",
          "herramienta de productividad",
          "alcance",
          "visión más simple",
        ],
        project: timerProject,
        stack: [
          "Kurone-ko Timer",
          "Pomodoro",
          "Windows",
          "objetivo diario",
          "historial",
          "música",
          "React",
          "TypeScript",
          "Zustand",
          "Tauri 2",
          "Rust",
          "JSON",
          "Vitest",
          "Playwright",
        ],
      },
      {
        info: [
          "Farmacias LinLin",
          "canal de venta electrónico",
          "reglas propias de una farmacia",
          "recetas",
          "retiro o despacho",
          "clientes",
          "administración",
          "químicos farmacéuticos",
          "personal de reparto",
          "validación a tiempo",
          "permiso bien definido",
        ],
        project: farmaciaProject,
        stack: [
          "Farmacias LinLin",
          "permisos según cada rol",
          "Angular e Ionic",
          "Firestore",
          "Angular y RxJS",
          "receta retenida",
          "Firebase",
          "Capacitor",
          "geolocalización y autenticación externa",
          "pruebas unitarias, E2E",
          "historial y evidencia",
        ],
      },
      {
        info: [
          "historias mitológicas",
          "Mitos y Leyendas",
          "Yu-Gi-Oh!",
          "Pokémon",
          "Magic",
          "ilustraciones",
          "historias que podían contar",
          "ajedrez",
          "estrategia y lógica",
          "pensar cada movimiento",
          "anticipar posibilidades",
          "ordenar mis ideas",
          "páginas web",
          "efectos visuales",
          "novedosos para la época",
          "nunca había visto",
          "frontend",
          "Elemental Queens",
          "landing page",
          "mis principales hobbies",
          "mitología",
          "juegos de cartas",
          "ajedrez",
          "experiencias web",
          "parte más personal de mí",
          "idea propia",
          "solución visual y funcional",
          "desarrollo frontend",
        ],
        project: elementalProject,
        stack: [
          "Elemental Queens",
          "landing conceptual",
          "criterios WCAG",
          "navegación por teclado",
          "aria-live",
          "movimiento reducido",
          "Astro 6",
          "Tailwind CSS 4",
          "Vite 7",
          "WebP responsive",
          "doble buffer",
          "TypeScript",
          "Queens",
          "aliados",
          "torres",
          "talismanes",
          "energías",
          "campo de batalla",
          "ajedrez",
          "Playwright",
          "contratos QA",
          "Cloudflare Pages",
        ],
      },
      {
        info: [
          "amigo cercano",
          "turnos rotativos",
          "planilla Excel",
          "una por una",
          "ayudarlo",
          "preparar las alarmas",
          "revisión manual",
          "cada planificación",
          "paso a paso",
          "MVP",
          "corrigiendo errores",
          "base funcional",
          "ordenar lo que sabía",
          "explicarlo con claridad",
          "otra persona pudiera comprender",
          "seguir desarrollando",
        ],
        project: alarmProject,
        stack: [
          "Kurone-ko Alarm",
          "turnos rotativos",
          "alarmas revisables",
          "dispositivo Android",
          "una por una",
          "Excel",
          "horarios editables",
          "OCR local",
          "Google ML Kit",
          "versión 1.0",
          "Flutter",
          "Dart",
          "Riverpod",
          "corregir fechas y horas",
          "bloqueé datos incompletos",
          "Drift",
          "SQLite",
          "alarmas activas",
          "historial local",
          "sin depender de cuentas",
          "Kotlin",
          "Android",
          "MethodChannel",
          "alarmas exactas",
          "restaurarlas",
          "flutter_test",
          "Mocktail",
        ],
      },
      {
        info: [
          "llamadas spam",
          "interrumpirme",
          "trabajaba",
          "concentrado",
          "dejar lo que estaba haciendo",
          "bloquear llamadas indiscriminadamente",
          "reglas claras",
          "podían pasar",
          "debían silenciarse",
          "Ley 21.719",
          "qué datos eran realmente necesarios",
          "garantía legal",
          "limitar desde el principio",
          "aplicación necesita conocer",
          "límite claro",
          "problema personal",
          "propio teléfono",
          "No planeo convertirla en un servicio comercial",
          "compartan datos",
          "forma parte de la solución",
        ],
        project: filterCallsProject,
        stack: [
          "evalúa llamadas entrantes",
          "en el dispositivo",
          "reglas configurables",
          "registro nativo",
          "Kotlin",
          "normaliza identidad",
          "origen internacional",
          "600 y 809",
          "Jetpack Compose",
          "Material 3",
          "tres modos",
          "dos reglas opcionales",
          "números no guardados",
          "internacionales",
          "DataStore",
          "READ_CONTACTS",
          "consulta temporal",
          "no se guarda el número",
          "Coroutines",
          "callback de Android",
          "permiso es incierto",
          "permite la llamada",
          "Gradle",
          "JUnit",
          "Robolectric",
          "pruebas instrumentadas",
        ],
      },
    ] as const;

    for (const testCase of cases) {
      const { unmount } = render(<ProjectCard project={testCase.project} />);

      await user.click(screen.getByRole("button", { name: `Ver stack de ${testCase.project.name}` }));
      const stackDialog = screen.getByRole("dialog", {
        name: testCase.project.stackPresentation?.title ?? "",
      });
      const stackHighlightTexts = [...stackDialog.querySelectorAll(".project-inline-highlight")].map(
        (node) => node.textContent,
      );
      expect(stackHighlightTexts).toEqual(testCase.stack);
      expect(stackHighlightTexts).not.toContain(testCase.project.stackPresentation?.introduction);

      await user.keyboard("{Escape}");
      await user.click(screen.getByRole("button", { name: `Ver historia de ${testCase.project.name}` }));
      const infoDialog = screen.getByRole("dialog", {
        name: testCase.project.modalPresentation?.infoTitle ?? testCase.project.name,
      });
      const infoHighlightTexts = [...infoDialog.querySelectorAll(".project-inline-highlight")].map(
        (node) => node.textContent,
      );
        expect(infoHighlightTexts).toEqual(testCase.info);
      expect(infoHighlightTexts).not.toContain(
        testCase.project.loreSections?.map((section) => section.paragraphs).flat().join(" "),
      );

      if (testCase.project.id === "elemental-tcg") {
        expect(infoHighlightTexts).not.toContain("jugar con mis amigos");
        for (const rejectedConcept of [
          "Con el tiempo también conocí Yu-Gi-Oh!, Pokémon y Magic",
          "alimentó ese gusto",
          "quise conocerme mejor",
          "me permitiera explorarlos",
          "En la adolescencia empecé a jugar ajedrez y encontré otra forma de disfrutar la estrategia. Me gustaba pensar cada movimiento con calma, anticipar posibilidades y ordenar mis ideas antes de decidir.",
          "En la adolescencia descubrí el ajedrez. Me gustaba pensar distintas jugadas, reconocer patrones y ordenar una estrategia antes de mover cada pieza.",
          "Por esos años también encontré páginas web con efectos visuales que, para la época, nunca había visto. Me llamaban la atención porque resolvían interacciones de una forma novedosa, ingeniosa y efectiva desde el frontend; por eso varias se quedaron en mi retina.",
          "intentar sorprender",
          "entraba en otro mundo",
          "provocar esa misma sensación",
          "fueron pasatiempos separados",
        ]) {
          expect(infoDialog).not.toHaveTextContent(rejectedConcept);
        }
      }

      unmount();
    }
  });

  it("sorts inline highlights by their copy position when data arrives out of order", async () => {
    if (farmaciaProject?.stackPresentation === undefined) {
      throw new Error("ProjectCard highlight ordering requires the Farmacias LinLin project.");
    }

    const user = userEvent.setup();
    const reorderedProject = {
      ...farmaciaProject,
      stackPresentation: {
        ...farmaciaProject.stackPresentation,
        introductionHighlights: [...(farmaciaProject.stackPresentation.introductionHighlights ?? [])].reverse(),
      },
    };
    render(<ProjectCard project={reorderedProject} />);

    await user.click(screen.getByRole("button", { name: `Ver stack de ${reorderedProject.name}` }));
    const stackDialog = screen.getByRole("dialog", { name: reorderedProject.stackPresentation.title });
    expect([...stackDialog.querySelectorAll(".project-inline-highlight")].map((node) => node.textContent)).toEqual([
      "Farmacias LinLin",
      "permisos según cada rol",
      "Angular e Ionic",
      "Firestore",
      "Angular y RxJS",
      "receta retenida",
      "Firebase",
      "Capacitor",
      "geolocalización y autenticación externa",
      "pruebas unitarias, E2E",
      "historial y evidencia",
    ]);
  });

  it("supports Timer S/I shortcuts, toggling, switching, and the filter guard", async () => {
    if (timerProject === undefined) {
      throw new Error("ProjectCard test requires the Kurone-ko Timer project.");
    }

    const user = userEvent.setup();
    const { rerender } = render(
      <>
        <div className="project-carousel" data-carousel-focus-target="true" tabIndex={-1} />
        <ProjectCard isActive project={timerProject} />
      </>,
    );
    const carousel = document.querySelector<HTMLElement>(".project-carousel");
    if (carousel === null) throw new Error("ProjectCard test requires a focus fallback.");
    carousel.focus();

    await user.keyboard("s");
    const stackDialog = screen.getByRole("dialog", { name: "FOCO SIN DISTRACCIONES" }) as HTMLDialogElement;
    expect(stackDialog).toBeVisible();
    expect(stackDialog.open).toBe(true);
    await user.keyboard("i");
    const infoDialog = screen.getByRole("dialog", { name: "KURONE-KO TIMER" }) as HTMLDialogElement;
    expect(infoDialog).toBeVisible();
    expect(infoDialog.open).toBe(true);
    await user.keyboard("i");
    expect(infoDialog.open).toBe(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(carousel).toHaveFocus();

    rerender(
      <>
        <div className="project-carousel" data-carousel-focus-target="true" tabIndex={-1} />
        <ProjectCard isActive isFilterDialogOpen project={timerProject} />
      </>,
    );
    const guardedCarousel = document.querySelector<HTMLElement>(".project-carousel");
    guardedCarousel?.focus();
    await user.keyboard("s");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("toggles the locked riddle with S,S, i,i, and S,i with the shared carousel focus state", async () => {
    if (informationProject === undefined) throw new Error("ProjectCard test requires Kurone-ko Translator.");

    const user = userEvent.setup();
    render(
      <>
        <div className="project-carousel" data-carousel-focus-target="true" tabIndex={-1} />
        <ProjectCard isActive project={informationProject} />
      </>,
    );
    const carousel = document.querySelector<HTMLElement>(".project-carousel");
    if (carousel === null) throw new Error("ProjectCard test requires a focus fallback.");
    carousel.focus();

    await user.keyboard("s");
    const stackStackDialog = screen.getByRole("dialog", { name: "ACERTIJO" }) as HTMLDialogElement;
    expect(stackStackDialog.open).toBe(true);
    await user.keyboard("s");
    expect(stackStackDialog.open).toBe(false);
    expect(screen.queryByRole("dialog", { name: "ACERTIJO" })).not.toBeInTheDocument();
    await waitFor(() => expect(carousel).toHaveFocus());
    expect(document.activeElement).not.toBe(document.querySelector<HTMLElement>(".project-card"));

    await user.keyboard("i");
    const infoInfoDialog = screen.getByRole("dialog", { name: "ACERTIJO" }) as HTMLDialogElement;
    expect(infoInfoDialog.open).toBe(true);
    await user.keyboard("i");
    expect(infoInfoDialog.open).toBe(false);
    expect(screen.queryByRole("dialog", { name: "ACERTIJO" })).not.toBeInTheDocument();
    await waitFor(() => expect(carousel).toHaveFocus());
    expect(document.activeElement).not.toBe(document.querySelector<HTMLElement>(".project-card"));

    carousel.focus();
    await user.keyboard("s");
    const mixedDialog = screen.getByRole("dialog", { name: "ACERTIJO" }) as HTMLDialogElement;
    expect(mixedDialog.open).toBe(true);
    await user.keyboard("i");
    expect(mixedDialog.open).toBe(false);
    expect(screen.queryByRole("dialog", { name: "ACERTIJO" })).not.toBeInTheDocument();
    await waitFor(() => expect(carousel).toHaveFocus());
    expect(document.activeElement).not.toBe(document.querySelector<HTMLElement>(".project-card"));
  });

  it("ignores locked S/I shortcuts from editable controls and other dialogs", async () => {
    if (informationProject === undefined) throw new Error("ProjectCard test requires Kurone-ko Translator.");

    const user = userEvent.setup();
    const { rerender } = render(
      <>
        <input aria-label="Editable test control" />
        <ProjectCard isActive project={informationProject} />
      </>,
    );

    const input = screen.getByRole("textbox", { name: "Editable test control" });
    await user.click(input);
    await user.keyboard("s");
    expect(screen.queryByRole("dialog", { name: "ACERTIJO" })).not.toBeInTheDocument();

    rerender(
      <>
        <dialog aria-label="Other dialog" open />
        <ProjectCard isActive project={informationProject} />
      </>,
    );
    const card = document.querySelector<HTMLElement>(".project-card");
    card?.focus();
    await user.keyboard("i");
    expect(screen.queryByRole("dialog", { name: "ACERTIJO" })).not.toBeInTheDocument();
  });

  it("renders challenge seals for locked projects and modal seals for rich projects", () => {
    expect(timerProject?.modalPresentation).toBeDefined();
    for (const candidate of PROJECTS.filter((project) => project.modalPresentation === undefined)) {
      const { container, unmount } = render(
        <ProjectCard project={candidate} />,
      );
      if (candidate.challengeId === undefined) expect(container.querySelector(".project-card-seals")).not.toBeInTheDocument();
      else expect(container.querySelectorAll(".project-card-seal")).toHaveLength(2);
      unmount();
    }
  });

  it("uses Joker exclusively for locked project previews", () => {
    const lockedProject = PROJECTS.find(
      (candidate) => candidate.challengeId === PROJECT_UNLOCK_CHALLENGE_ID,
    );
    if (lockedProject === undefined) {
      throw new Error("ProjectCard test requires a locked project.");
    }

    const { container } = render(<ProjectCard project={lockedProject} />);

    expect(container.querySelector(".project-card-joker img")).toHaveAttribute(
      "src",
      expect.stringContaining("joker.webp"),
    );
    expect(container.querySelector(".project-card-joker")).toHaveAttribute("data-preview-fit", "contain");
    expect(
      container.querySelector(".project-card-preview"),
    ).not.toBeInTheDocument();
  });

  it.each([
    {
      projectId: "translator",
        labels: ["GO", "DEEPGRAM", "WEBSOCKET", "WINMM", "SSE", "LLM"],
      internalIds: ["go"],
    },
  ])(
     "shows canonical Stack labels in the modal for $projectId",
    async ({ projectId, labels, internalIds }) => {
      const metadataProject = PROJECTS.find(
        (candidate) => candidate.id === projectId,
      );

      if (metadataProject === undefined) {
        throw new Error(`ProjectCard metadata test requires ${projectId}.`);
      }

      const user = userEvent.setup();
      render(
        <ProjectCard
          project={metadataProject}
          unlockedChallengeIds={[PROJECT_UNLOCK_CHALLENGE_ID]}
        />,
      );
      await user.click(screen.getByRole("button", { name: `Ver stack de ${metadataProject.name}` }));

      const metadataList = screen.getByRole("list", {
        name: "Tecnologías del proyecto",
      });

      for (const label of labels) {
        expect(
          within(metadataList).getByText(label, { exact: true }),
        ).toBeVisible();
      }

      for (const internalId of internalIds) {
        expect(
          within(metadataList).queryByText(internalId, { exact: true }),
        ).not.toBeInTheDocument();
      }
    },
  );
});
