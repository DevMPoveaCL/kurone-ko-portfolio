import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../shared/media/image-readiness", () => ({
  prepareImageReadiness: vi.fn((src: string) =>
    Promise.resolve({ phase: "degraded" as const, src })),
}));

import { MainHall } from "./MainHall";
import { PROJECT_UNLOCK_CHALLENGE_ID, PROJECT_UNLOCK_SUCCESS } from "./hidden-project-unlock";
import {
  createInitialSessionProgression,
  markIntroCompleted,
  unlockHiddenChallenge,
  writeSessionProgression,
} from "./session-progression";

describe("MainHall showcase integration", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
    window.localStorage.clear();
    window.history.replaceState(null, "", "/");
  });
  it("uses only eligible projects and derives its taxonomy from them", async () => {
    render(<MainHall />);

    expect(await screen.findByRole("heading", { name: "Kurone-ko Timer" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Next.js" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Portfolio" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Información sobre Kurone-ko Timer/ })).not.toBeInTheDocument();
  });

  it("applies OR filters, preserves filter focus, falls back to the first match, and clears back to all results", async () => {
    const user = userEvent.setup();
    render(<MainHall />);

    await user.click(await screen.findByRole("button", { name: /Filtros/ }, { timeout: 15000 }));
    await screen.findByRole("checkbox", { name: "React" });
    for (let index = 0; index < 4; index += 1) await user.click(screen.getByRole("button", { name: "Proyecto siguiente" }));
    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Proyecto activo: Kurone-ko Alarm"))).toBe(true);

    const react = screen.getByRole("checkbox", { name: "React" });
    await user.click(react);
    expect(react).toHaveFocus();

    await user.click(screen.getByRole("checkbox", { name: "Flutter" }));
    await user.click(screen.getByRole("button", { name: /APLICAR/ }));
    expect(screen.getByRole("heading", { name: "Kurone-ko Timer" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Kurone-ko Alarm" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /LIMPIAR FILTROS/ }));
    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Sin filtros activos"))).toBe(true);
    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Proyecto activo: Kurone-ko Alarm"))).toBe(true);
  });

  it("solves the unlock from filter search immediately without applying draft filters", async () => {
    const user = userEvent.setup({ delay: 1 });
    render(<MainHall />);

    await user.click(await screen.findByRole("button", { name: /Filtros/ }));
    await user.click(screen.getByRole("checkbox", { name: "React" }));
    const lockedPosCard = document.querySelector<HTMLElement>('.project-card[data-project-id="kuroneko-pos"]');
    expect(lockedPosCard).toHaveAttribute("data-locked", "true");
    expect(lockedPosCard).toHaveAccessibleDescription(/Proyecto oculto y bloqueado/i);
    const filterDialog = screen.getByRole("dialog", { name: /UN GRAN PODER CONLLEVA UNA GRAN RESPONSABILIDAD/ }) as HTMLDialogElement;
    const searchbox = screen.getByRole("searchbox", { name: "Buscar tecnología" });
    await user.type(searchbox, "BeN");

    await waitFor(() => expect(filterDialog.open).toBe(false));
    expect(searchbox).toHaveValue("");
    await waitFor(() => {
      const successDialog = screen.getByRole("dialog", { name: "PROYECTOS DESBLOQUEADOS" }) as HTMLDialogElement;
      expect(successDialog.open).toBe(true);
    });
    const successDialog = screen.getByRole("dialog", { name: "PROYECTOS DESBLOQUEADOS" }) as HTMLDialogElement;
    expect(document.querySelectorAll("dialog[open]")).toHaveLength(1);
     expect(successDialog).toHaveTextContent("Status: 200 OK | LOGRO ARÁCNIDO DESBLOQUEADO");
     expect(successDialog).toHaveTextContent("Hay 10 tipos de personas en el mundo: las que entienden binario... y las que no");
      expect(successDialog).toHaveTextContent("Y entre ellos... también existen seres que tienen el gran poder y la enorme responsabilidad de tomar decisiones clave. Encontrar el talento real es un arte, y supongo que por eso no es fácil engañarte.");
      expect(successDialog).toHaveTextContent("¡Felicidades por desbloquear los proyectos ocultos!");
       const copy = successDialog.querySelector<HTMLElement>(".project-unlock-success-copy");
       const quote = successDialog.querySelector<HTMLElement>("blockquote.project-unlock-success-quote");
        const paragraphs = [...successDialog.querySelectorAll<HTMLElement>(".project-unlock-success-copy > p")];
        const actions = successDialog.querySelector<HTMLElement>(".project-unlock-success-actions");
        const layout = successDialog.querySelector<HTMLElement>(".project-unlock-success-layout");
        if (copy === null || quote === null || actions === null || layout === null) throw new Error("Success composition nodes are unavailable.");
        expect([...copy.children].map((child) => child.className)).toEqual([
          "project-unlock-success-quote",
          "project-unlock-success-normal",
           "project-unlock-success-divider",
           "project-unlock-success-emphasis",
        ]);
        expect([...layout.children].map((child) => child.className)).toEqual([
          "project-unlock-success-copy",
          "project-unlock-success-art",
          "project-unlock-success-actions",
        ]);
        expect(quote.textContent).toBe(`“${PROJECT_UNLOCK_SUCCESS.quote}”`);
        expect((quote.textContent?.match(/[“”]/gu) ?? [])).toHaveLength(2);
         expect(quote.querySelectorAll("[aria-hidden='true']")).toHaveLength(0);
         expect(quote.querySelectorAll(".project-unlock-success-quote-mark")).toHaveLength(0);
         expect(quote.querySelector(".project-unlock-success-quote-frame")).not.toBeInTheDocument();
        expect(paragraphs.map((paragraph) => ({ className: paragraph.className, text: paragraph.textContent }))).toEqual([
          { className: "project-unlock-success-normal", text: PROJECT_UNLOCK_SUCCESS.normal },
          { className: "project-unlock-success-emphasis", text: PROJECT_UNLOCK_SUCCESS.emphasis },
        ]);
         const divider = successDialog.querySelector(".project-unlock-success-divider");
         expect(divider).toHaveAttribute("aria-hidden", "true");
         expect(divider?.previousElementSibling).toBe(paragraphs[0]);
         expect(divider?.nextElementSibling).toBe(paragraphs[1]);
        expect(actions.previousElementSibling).toHaveClass("project-unlock-success-art");
        expect(successDialog.querySelector(".project-unlock-success-divider-mark")).toBeInTheDocument();
        expect(paragraphs[1]?.innerHTML).toBe(PROJECT_UNLOCK_SUCCESS.emphasis);
       expect(paragraphs[1]?.querySelector("*")).toBeNull();
        expect(actions.parentElement).toBe(layout);
       expect(successDialog.querySelector(".project-card-modal-actions")).not.toBeInTheDocument();
       const successArt = successDialog.querySelector(".project-unlock-success-art");
       expect(successArt).toBeInTheDocument();
       if (successArt instanceof HTMLImageElement) {
         expect(successArt).toHaveAttribute("src", expect.stringContaining("acertijos.webp"));
       } else {
         expect(successArt).toHaveAttribute("data-image-fallback", "true");
       }
     await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "CONTINUAR" })));
    await user.click(screen.getByRole("button", { name: "CONTINUAR" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "PROYECTOS DESBLOQUEADOS" })).not.toBeInTheDocument());
    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Sin filtros activos"))).toBe(true);
    expect(screen.getByRole("button", { name: "Ver stack de Kurone-ko POS" })).toBeInTheDocument();
    const unlockedPosCard = document.querySelector<HTMLElement>('.project-card[data-project-id="kuroneko-pos"]');
    expect(unlockedPosCard).toHaveAttribute("data-locked", "false");
    expect(unlockedPosCard).toHaveAccessibleDescription(/Proyecto oculto y desbloqueado/i);
     await waitFor(() => expect(document.activeElement).toHaveAttribute("data-carousel-focus-target", "true"));
      expect(document.activeElement).not.toHaveClass("project-card");
   });

  it("suppresses stray outside Space but natively activates focused CONTINUAR once", async () => {
    const user = userEvent.setup();
    render(<MainHall />);

    await user.click(await screen.findByRole("button", { name: /Filtros/ }));
    await user.type(screen.getByRole("searchbox", { name: "Buscar tecnología" }), "narrador");
    const successDialog = await screen.findByRole("dialog", { name: "PROYECTOS DESBLOQUEADOS" });
    const continueButton = screen.getByRole("button", { name: "CONTINUAR" });
    const carousel = document.querySelector<HTMLElement>(".project-carousel[data-carousel-focus-target='true']");
    if (carousel === null) throw new Error("Showcase carousel focus target is unavailable.");

    await waitFor(() => expect(continueButton).toHaveFocus());

    const straySpace = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: " " });
    window.dispatchEvent(straySpace);
    expect(straySpace.defaultPrevented).toBe(true);
    expect(successDialog).toBeInTheDocument();
    expect(continueButton).toHaveFocus();

    const closeSpy = vi.spyOn(HTMLDialogElement.prototype, "close");
    const spaceDown = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, code: "Space", key: " " });
    continueButton.dispatchEvent(spaceDown);
    expect(spaceDown.defaultPrevented).toBe(false);
    continueButton.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, code: "Space", key: " " }));
    // jsdom does not implement the browser's native Space-button default action.
    continueButton.click();

    await waitFor(() => expect(successDialog).not.toBeInTheDocument());
    expect(closeSpy).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(carousel).toHaveFocus());
  });

  it("keeps the unlock success modal bounded to Continue and X, then restores card navigation", async () => {
    const user = userEvent.setup();
    render(<MainHall />);

    await user.click(await screen.findByRole("button", { name: /Filtros/ }));
    await user.type(screen.getByRole("searchbox", { name: "Buscar tecnología" }), "narrador");
    const dialog = await screen.findByRole("dialog", { name: "PROYECTOS DESBLOQUEADOS" });
    const continueButton = screen.getByRole("button", { name: "CONTINUAR" });
    const closeButton = screen.getByRole("button", { name: "Cerrar confirmación de desbloqueo" });

    await waitFor(() => expect(continueButton).toHaveFocus());
     await user.keyboard("{Tab}");
     expect(closeButton).toHaveFocus();
     await user.keyboard("{Tab}");
     expect(continueButton).toHaveFocus();
     await user.keyboard("{Shift>}{Tab}{/Shift}");
     expect(closeButton).toHaveFocus();
     await user.keyboard("{Tab}");
     expect(continueButton).toHaveFocus();
     await user.keyboard("{ArrowLeft}");
     expect(closeButton).toHaveFocus();
     await user.keyboard("{ArrowRight}");
     expect(continueButton).toHaveFocus();
     await user.keyboard("{ArrowUp}");
     expect(closeButton).toHaveFocus();
     await user.keyboard("{ArrowDown}");
     expect(continueButton).toHaveFocus();
     await user.click(closeButton);

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
     expect(document.activeElement).toHaveAttribute("data-carousel-focus-target", "true");
     expect(document.activeElement).not.toHaveClass("project-card");
     await user.keyboard("{ArrowRight}");
     expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Kurone-ko Timer"))).toBe(true);
     await user.keyboard("{ArrowLeft}");
     expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Software Engineering Playbook"))).toBe(true);
  });

  it("closes the unlock success modal with Escape and leaves no modal keyboard block", async () => {
    const user = userEvent.setup();
    render(<MainHall />);

    await user.click(await screen.findByRole("button", { name: /Filtros/ }));
    await user.type(screen.getByRole("searchbox", { name: "Buscar tecnología" }), "narrador");
    const dialog = await screen.findByRole("dialog", { name: "PROYECTOS DESBLOQUEADOS" });
    await waitFor(() => expect(screen.getByRole("button", { name: "CONTINUAR" })).toHaveFocus());

    fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
     expect(document.activeElement).toHaveAttribute("data-carousel-focus-target", "true");
     expect(document.activeElement).not.toHaveClass("project-card");
     await user.keyboard("{ArrowRight}");
     expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Kurone-ko Timer"))).toBe(true);
     await user.keyboard("{ArrowLeft}");
     expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Software Engineering Playbook"))).toBe(true);
  });

  it("restores hidden challenge state from the session progression across mounts", () => {
    const progression = unlockHiddenChallenge(
      markIntroCompleted(createInitialSessionProgression()),
      PROJECT_UNLOCK_CHALLENGE_ID,
      [PROJECT_UNLOCK_CHALLENGE_ID],
    );
    if (progression === null) throw new Error("Expected a valid challenge progression.");
    writeSessionProgression(progression);
    const firstRender = render(<MainHall />);
    expect(document.querySelector('.project-card[data-project-id="teacher"]')).toHaveAttribute("data-locked", "false");
    firstRender.unmount();

    render(<MainHall />);
    expect(document.querySelector('.project-card[data-project-id="teacher"]')).toHaveAttribute("data-locked", "false");
  });

  it("keeps ordered rail navigation circular", async () => {
    const user = userEvent.setup();
    render(<MainHall />);

    await screen.findByRole("button", { name: "Proyecto anterior" });
    await user.click(screen.getByRole("button", { name: "Proyecto anterior" }));
    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Proyecto activo: Kurone-ko Teacher"))).toBe(true);
  });

  it("owns the first showcase reveal and does not replay it during navigation", async () => {
    const user = userEvent.setup();
    render(<MainHall />);

    await screen.findByRole("list", { name: "Proyectos filtrados" });
    const showcase = document.querySelector<HTMLElement>(".project-showcase");
    const rail = document.querySelector<HTMLElement>(".project-showcase-rail");
    const navigation = document.querySelector<HTMLElement>(".project-carousel-navigation");
    const filters = document.querySelector<HTMLElement>(".project-filter-actions");
    const identity = document.querySelector<HTMLElement>(".project-showcase-identity");
    if (showcase === null || rail === null || navigation === null || filters === null || identity === null) throw new Error("Showcase reveal nodes are unavailable.");

    expect(rail.querySelector(".project-card")).toBeInTheDocument();
    expect(rail.querySelector(".project-card-seals")).toBeInTheDocument();
    expect(navigation.querySelectorAll(".project-carousel-arrow")).toHaveLength(2);
    expect(navigation.querySelector("p")).toBeInTheDocument();

    await waitFor(() => expect(showcase).toHaveAttribute("data-showcase-reveal", "settled"));
    expect(showcase).not.toHaveAttribute("inert");

    await user.click(screen.getByRole("button", { name: "Proyecto siguiente" }));
    expect(showcase).toHaveAttribute("data-showcase-reveal", "settled");
  });

  it("settles the first reveal immediately for reduced motion", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      addEventListener: vi.fn(),
      matches: true,
      removeEventListener: vi.fn(),
    })));
    render(<MainHall />);

    const showcase = await screen.findByRole("list", { name: "Proyectos filtrados" });
    const owner = showcase.closest<HTMLElement>(".project-showcase");
    if (owner === null) throw new Error("Showcase owner is unavailable.");

    expect(owner).toHaveAttribute("data-showcase-reveal", "settled");
    expect(owner).not.toHaveAttribute("inert");
  });

  it("navigates from the filter control while leaving the control itself non-conflicting", async () => {
    const user = userEvent.setup();
    render(<MainHall />);

    const filterButton = await screen.findByRole("button", { name: /Filtros/ });
    filterButton.focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Proyecto activo: Kurone-ko Timer"))).toBe(true);
  });

  it("opens an eligible history, restores the showcase heading with filters, and safely recovers hidden URLs", async () => {
    const user = userEvent.setup();
    render(<MainHall />);

    await user.click(screen.getByRole("button", { name: /Filtros/ }));
    const typescript = await screen.findByRole("checkbox", { name: "TypeScript" });
    await user.click(typescript);
    await user.click(screen.getByRole("button", { name: /APLICAR/ }));
    await user.click(screen.getByRole("button", { name: "Proyecto siguiente" }));
    expect(screen.getByRole("heading", { name: "Kurone-ko Timer" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "E-commerce Farmacia" })).toBeInTheDocument();
  });

  it("locks showcase interaction behind a project modal and restores the seal focus", async () => {
    const user = userEvent.setup();
    render(<MainHall />);

    const infoSeal = screen.getByRole("button", {
      name: /Ver historia de Software Engineering Playbook/,
    });
    await user.click(infoSeal);

    const modal = screen.getByRole("dialog", { name: "Software Engineering Playbook" });
    const nextButton = screen.getByRole("button", { name: "Proyecto siguiente" });
    const activeStatus = () => screen.getAllByRole("status").find((status) => status.textContent?.includes("Proyecto activo:"))?.textContent;

    expect(modal).toBeVisible();
    expect(screen.getByRole("button", { name: /Filtros/ })).toBeDisabled();
    expect(activeStatus()).toContain("Software Engineering Playbook");

    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.click(nextButton);
    fireEvent.wheel(window, { deltaY: 1200 });
    fireEvent.keyDown(window, { key: "f" });
    fireEvent.keyDown(window, { key: "Home" });
    fireEvent.keyDown(window, { key: "End" });
    fireEvent.keyDown(window, { key: "c" });

    expect(activeStatus()).toContain("Software Engineering Playbook");
    expect(screen.queryByRole("dialog", { name: /Filtros/ })).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Software Engineering Playbook" })).not.toBeInTheDocument();
    expect(infoSeal).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(activeStatus()).toContain("Kurone-ko Timer");
  });

  it("closes and switches Project One shortcut modals, then keeps carousel arrows active", async () => {
    const user = userEvent.setup();
    render(<MainHall />);
    const carousel = await screen.findByRole("list", { name: "Proyectos filtrados" });
    const focusTarget = carousel.closest<HTMLElement>("[data-carousel-focus-target='true']");
    if (focusTarget === null) throw new Error("Showcase focus target is unavailable.");
    focusTarget.focus();
    const activeStatus = () => screen.getAllByRole("status").find((status) => status.textContent?.includes("Proyecto activo:"))?.textContent;

    await user.keyboard("s");
    expect(screen.getByRole("dialog", { name: "ARQUITECTURA" })).toBeVisible();
    await user.keyboard("i");
    expect(screen.getByRole("dialog", { name: "Software Engineering Playbook" })).toBeVisible();
    expect(screen.queryByRole("dialog", { name: "ARQUITECTURA" })).not.toBeInTheDocument();
    await user.keyboard("i");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(focusTarget).toHaveFocus();

    const beforeArrow = activeStatus();
    await user.keyboard("{ArrowRight}");
    expect(activeStatus()).not.toBe(beforeArrow);
  });

  it("keeps Void actions visible while hiding the passive legend and focusing LinkedIn", async () => {
    window.history.replaceState(null, "", "/?view=showcase&tech=void");
    render(<MainHall />);

    const linkedin = await screen.findByRole("link", { name: "LinkedIn" });
    await waitFor(() => expect(linkedin).toHaveFocus());

    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /LIMPIAR FILTROS/ })).toBeInTheDocument();
    expect(document.querySelector(".project-showcase-legend")).not.toBeInTheDocument();
    const movementLegend = screen.getByRole("complementary", { name: "Guía para mover el reproductor" });
    expect(movementLegend.querySelector(".player-movement-instruction")).toHaveTextContent("Para mover la posición del reproductor de música");
    expect(movementLegend.querySelectorAll("img")).toHaveLength(5);
    expect(document.querySelectorAll(".player-movement-legend")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Marco Povea" })).not.toHaveFocus();
  });

  it("unlocks movement on Void and keeps the legend after returning to ordinary showcases", async () => {
    const user = userEvent.setup();
    render(<MainHall />);

    expect(screen.queryByRole("complementary", { name: "Guía para mover el reproductor" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Filtros/ }));
    await user.click(screen.getByRole("checkbox", { name: "Vacío" }));
    await user.click(screen.getByRole("button", { name: /APLICAR/ }));
    await screen.findByRole("link", { name: "LinkedIn" });
    expect(screen.getByRole("complementary", { name: "Guía para mover el reproductor" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /LIMPIAR FILTROS/ }));
    expect(screen.getByRole("complementary", { name: "Guía para mover el reproductor" })).toBeInTheDocument();
  });

  it("routes Void focus through the explicit social and player state machine", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?view=showcase&tech=void");
    render(<MainHall />);

    const linkedin = await screen.findByRole("link", { name: "LinkedIn" });
    const github = screen.getByRole("link", { name: "GitHub" });
    await waitFor(() => expect(linkedin).toHaveFocus());

    await user.keyboard("{ArrowRight}");
    expect(github).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(linkedin).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    const play = await screen.findByRole("button", { name: "Reproducir canción" });
    expect(play).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Reiniciar canción" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Mostrar letra" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(play).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    const minimize = screen.getByRole("button", { name: "Minimizar reproductor" });
    expect(minimize).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(play).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(linkedin).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(play).toHaveFocus());
    await user.keyboard("{ArrowRight}");
    const reset = screen.getByRole("button", { name: "Reiniciar canción" });
    expect(reset).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Minimizar reproductor" }));
    expect(screen.queryByRole("button", { name: "Reiniciar canción" })).not.toBeInTheDocument();
    await user.keyboard("{ArrowDown}");
    const restoredReset = await screen.findByRole("button", { name: "Reiniciar canción" });
    await waitFor(() => expect(restoredReset).toHaveFocus());

    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("button", { name: "Minimizar reproductor" })).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(linkedin).toHaveFocus();
  });

  it("restores Void filter-dialog focus to LinkedIn", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?view=showcase&tech=void");
    render(<MainHall />);

    const linkedin = await screen.findByRole("link", { name: "LinkedIn" });
    await waitFor(() => expect(linkedin).toHaveFocus());
    await user.click(screen.getByRole("button", { name: /Filtros/ }));
    expect(screen.getByRole("searchbox", { name: "Buscar tecnología" })).toHaveFocus();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(linkedin).toHaveFocus());
  });

  it("moves the Void player only while M is held and restores the origin focus", async () => {
    window.history.replaceState(null, "", "/?view=showcase&tech=void");
    render(<MainHall />);

    const linkedin = await screen.findByRole("link", { name: "LinkedIn" });
    const player = await screen.findByRole("complementary", { name: "Reproductor persistente de Bug Cesante" });
    await waitFor(() => expect(linkedin).toHaveFocus());

    fireEvent.keyDown(linkedin, { code: "KeyM", key: "m" });
    fireEvent.keyDown(linkedin, { code: "ArrowRight", key: "ArrowRight" });
    expect(player).toHaveAttribute("data-positioned", "true");

    fireEvent.keyUp(linkedin, { code: "KeyM", key: "m" });
    expect(linkedin).toHaveFocus();
  });

  it("does not hijack the hold-M mode from the filter dialog search", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?view=showcase&tech=void");
    render(<MainHall />);

    const filterButton = await screen.findByRole("button", { name: /Filtros/ });
    await user.click(filterButton);
    const search = screen.getByRole("searchbox", { name: "Buscar tecnología" });
    const player = screen.getByRole("complementary", { name: "Reproductor persistente de Bug Cesante" });

    fireEvent.keyDown(search, { code: "KeyM", key: "m" });
    fireEvent.keyDown(search, { code: "ArrowRight", key: "ArrowRight" });

    expect(search).toHaveFocus();
    expect(player).not.toHaveAttribute("data-positioned");
  });

  it("restores the last Void action after window focus loss without overriding a clicked target", async () => {
    window.history.replaceState(null, "", "/?view=showcase&tech=void");
    render(<MainHall />);

    const linkedin = await screen.findByRole("link", { name: "LinkedIn" });
    const github = screen.getByRole("link", { name: "GitHub" });
    await waitFor(() => expect(linkedin).toHaveFocus());

    document.body.tabIndex = -1;
    fireEvent.blur(window);
    document.body.focus();
    fireEvent.focus(window);
    await waitFor(() => expect(linkedin).toHaveFocus());

    fireEvent.blur(window);
    document.body.focus();
    fireEvent.focus(window);
    fireEvent.pointerDown(github);
    github.focus();
    expect(github).toHaveFocus();
  });
});
