import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDisplayedOpeningProgress, getOpeningCompletionCrossfade, getVisualOpeningCompletionProgress } from "./intro-progress";
import { createIntroFrameCoordinator } from "./intro-frame-coordinator";
import { SESSION_RELOAD_RESET_MARKER, SESSION_PROGRESSION_KEY } from "./session-progression";
import { VaultShell } from "./VaultShell";

interface MatchMediaQueryList {
  matches: boolean;
  media: string;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

function mockMedia(options: { reducedMotion?: boolean; mobile?: boolean }) {
  window.matchMedia = vi.fn().mockImplementation(
    (query: string): MatchMediaQueryList => ({
      matches: query.includes("prefers-reduced-motion") ? (options.reducedMotion ?? false) : (options.mobile ?? false),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

function mockLoadedIntroFrames() {
  class TestImage {
    complete = true;
    decoding = "async";
    naturalHeight = 100;
    naturalWidth = 100;
    onerror: (() => void) | null = null;
    onload: (() => void) | null = null;

    set src(_value: string) {
      queueMicrotask(() => this.onload?.());
    }
  }

  Object.defineProperty(window, "Image", { configurable: true, writable: true, value: TestImage });
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { configurable: true, value: vi.fn(() => null) });
}

function mockFailedIntroFrames() {
  class FailingImage {
    complete = false;
    decoding = "async";
    naturalHeight = 0;
    naturalWidth = 0;
    onerror: (() => void) | null = null;
    onload: (() => void) | null = null;

    set src(_value: string) {
      queueMicrotask(() => this.onerror?.());
    }
  }

  Object.defineProperty(window, "Image", { configurable: true, writable: true, value: FailingImage });
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { configurable: true, value: vi.fn(() => null) });
}

function mockCachedSealImages() {
  class CachedSealImage {
    static instances: CachedSealImage[] = [];
    decoding = "async";
    complete = false;
    naturalHeight = 100;
    naturalWidth = 100;
    onerror: (() => void) | null = null;
    onload: (() => void) | null = null;
    private source = "";

    constructor() {
      CachedSealImage.instances.push(this);
    }

    decode() {
      return Promise.resolve();
    }

    set src(value: string) {
      this.source = value;
      if (value.includes("/sello")) {
        this.complete = true;
        return;
      }

      queueMicrotask(() => this.onload?.());
    }

    get src() {
      return this.source;
    }
  }

  Object.defineProperty(window, "Image", { configurable: true, writable: true, value: CachedSealImage });
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { configurable: true, value: vi.fn(() => null) });

  return CachedSealImage;
}

function mockIntroFramesExceptDelayedFinalFrame() {
  class DelayedImage {
    static instances: DelayedImage[] = [];
    decoding = "async";
    naturalHeight = 100;
    naturalWidth = 100;
    onerror: (() => void) | null = null;
    onload: (() => void) | null = null;
    private source = "";

    constructor() {
      DelayedImage.instances.push(this);
    }

    get src() {
      return this.source;
    }

    set src(value: string) {
      this.source = value;

      if (!value.endsWith("intro_0032.webp")) {
        queueMicrotask(() => this.onload?.());
      }
    }
  }

  Object.defineProperty(window, "Image", { configurable: true, writable: true, value: DelayedImage });
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { configurable: true, value: vi.fn(() => null) });

  return DelayedImage;
}

function mockControlledIntroFrames() {
  class ControlledImage {
    static instances: ControlledImage[] = [];
    decoding = "async";
    naturalHeight = 100;
    naturalWidth = 100;
    onerror: (() => void) | null = null;
    onload: (() => void) | null = null;
    private source = "";

    constructor() {
      ControlledImage.instances.push(this);
    }

    get src() {
      return this.source;
    }

    set src(value: string) {
      this.source = value;

      if (value.endsWith("intro_0001.webp")) {
        queueMicrotask(() => this.onload?.());
      }
    }
  }

  const drawImage = vi.fn();
  Object.defineProperty(window, "Image", { configurable: true, writable: true, value: ControlledImage });
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: vi.fn(() => ({ clearRect: vi.fn(), drawImage, setTransform: vi.fn() })),
  });

  return { ControlledImage, drawImage };
}

function mockViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
  Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: height });
}

async function waitForVaultInterface() {
  await screen.findByRole("button", { name: "Mis obras en construcción" });
}

async function unlockAllSeals(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ }));
  await user.click(screen.getByRole("button", { name: "Cerrar sello" }));
  await user.click(screen.getByRole("button", { name: /Sello 2 — La Garra.*Bloqueado/ }));
  await user.click(screen.getByRole("button", { name: "Cerrar sello" }));
  await user.click(screen.getByRole("button", { name: /Sello 3 — La Cerradura.*Bloqueado/ }));
  await user.click(screen.getByRole("button", { name: "Cerrar sello" }));
}

describe("VaultShell", () => {
  afterEach(() => Object.defineProperty(window, "navigation", { configurable: true, value: undefined }));

  beforeEach(() => {
    window.sessionStorage.clear();
    delete (window as unknown as Record<string, unknown>)[SESSION_RELOAD_RESET_MARKER];
    mockViewport(1280, 720);
    mockMedia({ reducedMotion: false, mobile: false });
    mockLoadedIntroFrames();
  });

  it("maps opening copy to perceived mobile visual completion", () => {
    const viewport = { width: 390, height: 844 };

    expect(getVisualOpeningCompletionProgress(viewport)).toBeCloseTo(0.45, 2);
    expect(getDisplayedOpeningProgress(0.225, viewport)).toBeCloseTo(0.5, 2);
    expect(getDisplayedOpeningProgress(0.45, viewport)).toBe(1);
  });

  it("draws only the latest desired frame when asynchronous resolutions arrive out of order", () => {
    const guard = createIntroFrameCoordinator();
    const draws: number[] = [];
    const firstRequest = guard.requestDesiredFrame(12);
    const latestRequest = guard.requestDesiredFrame(38);
    const resolve = (request: { frameIndex: number; generation: number }) => {
      if (guard.isCurrent(request)) {
        draws.push(request.frameIndex);
      }
    };

    resolve(latestRequest);
    resolve(firstRequest);

    expect(draws).toEqual([38]);
  });

  it("maps opening copy to perceived tablet visual completion", () => {
    const viewport = { width: 768, height: 1024 };

    expect(getVisualOpeningCompletionProgress(viewport)).toBeCloseTo(0.7, 2);
    expect(getDisplayedOpeningProgress(0.35, viewport)).toBeCloseTo(0.5, 2);
    expect(getDisplayedOpeningProgress(0.7, viewport)).toBe(1);
  });

  it("maps opening copy to perceived near-square responsive tablet visual completion", () => {
    const viewport = { width: 886, height: 906 };

    expect(getVisualOpeningCompletionProgress(viewport)).toBeCloseTo(0.65, 2);
    expect(getDisplayedOpeningProgress(0.325, viewport)).toBeCloseTo(0.5, 2);
    expect(getDisplayedOpeningProgress(0.65, viewport)).toBe(1);
  });

  it("keeps desktop opening copy aligned with the full technical progress", () => {
    const viewport = { width: 1280, height: 720 };

    expect(getVisualOpeningCompletionProgress(viewport)).toBe(1);
    expect(getDisplayedOpeningProgress(0.5, viewport)).toBe(0.5);
    expect(getDisplayedOpeningProgress(1, viewport)).toBe(1);
  });

  it("eases the final perceived opening into the vault scene", () => {
    expect(getOpeningCompletionCrossfade(0.9)).toBe(0);
    expect(getOpeningCompletionCrossfade(0.96)).toBeGreaterThan(0);
    expect(getOpeningCompletionCrossfade(0.98)).toBeGreaterThan(getOpeningCompletionCrossfade(0.96));
    expect(getOpeningCompletionCrossfade(1)).toBe(1);
  });

  it("does not render pause or reduced-motion controls in the post-opening seal scene", async () => {
    mockMedia({ reducedMotion: true, mobile: false });

    render(<VaultShell />);
    await waitForVaultInterface();

    expect(await screen.findByRole("status", { name: "Recorre los sellos con las flechas izquierda y derecha, o haz click sobre ellos." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Pausar movimiento|Reanudar movimiento/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Usar movimiento reducido|Usar movimiento estándar/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Movimiento reducido|Movimiento estándar/)).not.toBeInTheDocument();
  });

  it("renders an unstarted three-seal interface after opening", async () => {
    mockMedia({ reducedMotion: true, mobile: false });

    render(<VaultShell />);
    await waitForVaultInterface();

    expect(screen.getByRole("heading", { name: "Tres sellos antes de entrar." })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sello 1 — El Ojo" })).not.toBeInTheDocument();
    expect(screen.queryByText(/A veces es muy difícil comenzar algo/)).not.toBeInTheDocument();
    expect(screen.getByText("Desbloqueado 0/3")).toBeInTheDocument();
    expect(screen.getByText("Desbloqueado 0/3")).toHaveAccessibleName("Progreso de sellos: Desbloqueado 0 de 3");
    expect(screen.getByRole("status", { name: "Recorre los sellos con las flechas izquierda y derecha, o haz click sobre ellos." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sello anterior" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Siguiente sello" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Recorre los sellos con las flechas o haz click sobre ellos.");
    expect(screen.getByRole("status")).not.toHaveTextContent(/izquierda\s+o\s+derecha/);
    expect(screen.queryByText(/Umbral/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Conecta con/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/marca/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /Sello 2 — La Garra.*Bloqueado/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mis obras en construcción" })).toBeDisabled();
  });

  it("resets a reloaded document once before hydrating protected content", async () => {
    window.history.replaceState(null, "", "/?view=showcase");
    window.sessionStorage.setItem(SESSION_PROGRESSION_KEY, JSON.stringify({
      alternateHandoff: null,
      alternateResidency: "inactive",
      hiddenChallengeIds: [],
      introCompleted: true,
      mainHallUnlocked: true,
      unlockedSealIds: ["seal-eye", "seal-claw", "seal-lock"],
      version: 1,
    }));
    Object.defineProperty(window.performance, "getEntriesByType", {
      configurable: true,
      value: () => [{ type: "reload" }],
    });
    const removeItem = vi.spyOn(Storage.prototype, "removeItem");
    const protectedAdds: Element[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        protectedAdds.push(...[...record.addedNodes].flatMap((node) => (
          node instanceof Element && (node.matches(".main-hall") || node.querySelector(".main-hall") !== null) ? [node] : []
        )));
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    render(<StrictMode><VaultShell /></StrictMode>);
    await act(async () => undefined);
    observer.disconnect();

    expect(removeItem).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem(SESSION_PROGRESSION_KEY)).toBeNull();
    expect(window.location.pathname).toBe("/");
    expect(screen.getByRole("heading", { name: "¿Qué hay detrás?" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Sala principal de proyectos" })).not.toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Reproductor persistente de Bug Cesante" })).not.toBeInTheDocument();
    expect(protectedAdds).toHaveLength(0);
  });

  it("preserves valid progression on a normal mount without reload timing", async () => {
    window.sessionStorage.setItem(SESSION_PROGRESSION_KEY, JSON.stringify({
      alternateHandoff: null,
      alternateResidency: "inactive",
      hiddenChallengeIds: [],
      introCompleted: true,
      mainHallUnlocked: true,
      unlockedSealIds: ["seal-eye", "seal-claw", "seal-lock"],
      version: 1,
    }));
    Object.defineProperty(window.performance, "getEntriesByType", {
      configurable: true,
      value: () => [{ type: "navigate" }],
    });

    render(<StrictMode><VaultShell /></StrictMode>);

    await waitFor(() => expect(screen.getByRole("region", { name: "Sala principal de proyectos" })).toBeInTheDocument());
    expect(window.sessionStorage.getItem(SESSION_PROGRESSION_KEY)).not.toBeNull();
  });

  it("renders cached-complete seal images without waiting for a later load event", async () => {
    mockMedia({ reducedMotion: true, mobile: false });
    const CachedSealImage = mockCachedSealImages();

    render(<VaultShell />);
    await waitForVaultInterface();

    const sealImages = document.querySelectorAll<HTMLImageElement>(".vault-seal-hotspot img");
    expect(sealImages).toHaveLength(3);
    const cachedSeals = CachedSealImage.instances.filter((image) => image.src.includes("/sello"));
    expect(cachedSeals).toHaveLength(3);
    expect(cachedSeals.every((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  });

  it("restarts seal preload after Strict Mode cleanup without rendering fallbacks", async () => {
    mockMedia({ reducedMotion: true, mobile: false });
    const CachedSealImage = mockCachedSealImages();

    render(<StrictMode><VaultShell /></StrictMode>);
    await waitForVaultInterface();

    const cachedSeals = CachedSealImage.instances.filter((image) => image.src.includes("/sello"));
    expect(cachedSeals).toHaveLength(6);
    expect(document.querySelectorAll(".vault-seal-hotspot img")).toHaveLength(3);
    expect(document.querySelectorAll(".vault-seal-fallback")).toHaveLength(0);
  });

  it("uses portfolio-scoped selection disabling without removing pointer or focus semantics", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

    expect(css).toMatch(/\.vault-shell\s*{[\s\S]*user-select: none;/);
    expect(css).toMatch(/\.vault-shell \*,[\s\S]*user-select: none;/);
    expect(css).not.toMatch(/\.vault-shell\s*{[^}]*pointer-events: none;/);
    expect(css).toContain(":focus-visible");
  });

  it("activates the first seal with ArrowRight from the unstarted 0/3 state", async () => {
    mockMedia({ reducedMotion: true, mobile: false });

    render(<VaultShell />);
    await waitForVaultInterface();

    await waitFor(() => expect(screen.getByText("Desbloqueado 0/3")).toBeInTheDocument());
    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(await screen.findByRole("dialog", { name: "Sello 1 — El Ojo" })).toBeInTheDocument();
    expect(screen.getByText("Desbloqueado 1/3")).toBeInTheDocument();
  });

  it("wraps visible seal arrow controls as a carousel and keeps them outside the bottom panel", async () => {
    mockMedia({ reducedMotion: true, mobile: false });
    const user = userEvent.setup();

    render(<VaultShell />);
    await waitForVaultInterface();

    const riddlePanel = document.querySelector(".vault-riddle-panel");
    const previousControl = screen.getByRole("button", { name: "Sello anterior" });
    const nextControl = screen.getByRole("button", { name: "Siguiente sello" });

    expect(riddlePanel?.contains(previousControl)).toBe(false);
    expect(riddlePanel?.contains(nextControl)).toBe(false);

    await user.click(previousControl);
    expect(screen.getByRole("dialog", { name: "Sello 3 — La Cerradura" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar sello" }));

    await user.click(nextControl);
    expect(screen.getByRole("dialog", { name: "Sello 1 — El Ojo" })).toBeInTheDocument();
  });

  it("keeps hotspot, button, and ArrowRight navigation equal to canonical storage", async () => {
    mockMedia({ reducedMotion: true, mobile: false });
    const user = userEvent.setup();

    render(<VaultShell />);
    await waitForVaultInterface();

    const readSealIds = () => JSON.parse(window.sessionStorage.getItem("kuroneko:session-progression:v1") ?? "{}").unlockedSealIds;

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("dialog", { name: "Sello 1 — El Ojo" })).toBeInTheDocument();
    expect(readSealIds()).toEqual(["seal-eye"]);
    await user.click(screen.getByRole("button", { name: "Cerrar sello" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Sello 1 — El Ojo" })).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Siguiente sello" }));
    expect(screen.getByRole("dialog", { name: "Sello 2 — La Garra" })).toBeInTheDocument();
    expect(readSealIds()).toEqual(["seal-eye", "seal-claw"]);
    await user.click(screen.getByRole("button", { name: "Cerrar sello" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Sello 2 — La Garra" })).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Sello 3 — La Cerradura.*Bloqueado/ }));
    expect(screen.getByRole("dialog", { name: "Sello 3 — La Cerradura" })).toBeInTheDocument();
    expect(readSealIds()).toEqual(["seal-eye", "seal-claw", "seal-lock"]);
    expect(screen.getByText("Desbloqueado 3/3")).toBeInTheDocument();
  });

  it("uses the art-plane lower safe zone and a viewport HUD instead of placing progress in the dialogue panel", async () => {
    mockMedia({ reducedMotion: true, mobile: false });
    render(<VaultShell />);
    await waitForVaultInterface();

    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    const progress = screen.getByText("Desbloqueado 0/3");

    expect(progress).toHaveClass("vault-unlock-progress-hud");
    expect(document.querySelector(".vault-riddle-panel")?.contains(progress)).toBe(false);
    expect(css).toMatch(/\.vault-seal-carousel-controls \{[\s\S]*inset-block-start: clamp\(/);
    expect(css).toContain("var(--vault-art-top) + var(--vault-art-height) * 0.61");
    expect(css).toContain("var(--vault-dialogue-safe-reserve)");
    expect(css).toMatch(/@media \(min-width: 64\.0625rem\) \{[\s\S]*\.vault-unlock-progress-hud[\s\S]*font-size: var\(--vault-type-hud-desktop\)/);
  });

  it("ignores repeated ArrowRight handoff after opening until key release", async () => {
    mockMedia({ reducedMotion: false, mobile: false });

    render(<VaultShell />);

    await screen.findByText("Apertura 0%");
    fireEvent.keyDown(window, { key: "ArrowRight", repeat: false });

    for (let index = 0; index < Math.ceil(1 / 0.08); index += 1) {
      fireEvent.wheel(window, { deltaY: 1800 });
    }

    await waitForVaultInterface();
    fireEvent.keyDown(window, { key: "ArrowRight", repeat: true });

    expect(screen.queryByRole("dialog", { name: "Sello 1 — El Ojo" })).not.toBeInTheDocument();
    expect(screen.getByText("Desbloqueado 0/3")).toBeInTheDocument();

    fireEvent.keyUp(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowRight", repeat: false });

    expect(await screen.findByRole("dialog", { name: "Sello 1 — El Ojo" })).toBeInTheDocument();
  });

  it("uses neutral desktop intro guidance before opening", async () => {
    mockMedia({ reducedMotion: false, mobile: false });

    render(<VaultShell />);

    expect(await screen.findByRole("status", { name: "Puedes navegar con scroll, flecha izquierda o flecha derecha." })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: /Podés/ })).not.toBeInTheDocument();
  });

  it("shows the alternate portfolio entry only on the closed curtain without entering the gesture flow", async () => {
    mockMedia({ reducedMotion: false, mobile: false });

    render(<VaultShell />);

    const alternateEntry = await screen.findByRole("link", { name: "VERSIÓN MINIMALISTA" });
    expect(alternateEntry).toHaveAttribute("href", "/portfolio");
    expect(alternateEntry).toHaveClass("button", "button-primary");
    expect(document.querySelector(".vault-visual-stage")).toHaveAttribute("data-intro-phase", "closed");

    fireEvent.pointerDown(alternateEntry, { button: 0, pointerId: 1, pointerType: "mouse" });
    fireEvent.pointerUp(alternateEntry, { button: 0, pointerId: 1, pointerType: "mouse" });

    expect(document.querySelector(".vault-visual-stage")).toHaveAttribute("data-intro-phase", "closed");
    await screen.findByRole("status", { name: "Puedes navegar con scroll, flecha izquierda o flecha derecha." });
    fireEvent.wheel(window, { deltaY: 1800 });
    expect(await screen.findByText("Apertura 8%")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "VERSIÓN MINIMALISTA" })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Transición a la sala principal" })).not.toBeInTheDocument();
  });

  it("continues into a usable degraded intro when the first frame fails", async () => {
    mockFailedIntroFrames();

    render(<VaultShell />);

    expect(await screen.findByRole("status", { name: "Puedes navegar con scroll, flecha izquierda o flecha derecha." })).toBeInTheDocument();
    expect(screen.queryByText(/Cargando 0 de 96 cuadros/)).not.toBeInTheDocument();

    for (let index = 0; index < 13; index += 1) {
      fireEvent.wheel(window, { deltaY: 1800 });
    }

    await waitForVaultInterface();
    expect(document.querySelector(".vault-curtain-opening")).toBeNull();
  });

  it("retries the current same-frame request after its superseded in-flight load fails", async () => {
    const { ControlledImage } = mockControlledIntroFrames();

    render(<VaultShell />);
    await screen.findByText("Apertura 0%");
    vi.useFakeTimers();

    try {
      fireEvent.wheel(window, { deltaY: 1800 });
      fireEvent.wheel(window, { deltaY: 0 });

      const target = "intro_0017.webp";
      expect(ControlledImage.instances.filter((image) => image.src.endsWith(target))).toHaveLength(1);
      ControlledImage.instances.find((image) => image.src.endsWith(target))?.onerror?.();
      await vi.advanceTimersByTimeAsync(120);

      expect(ControlledImage.instances.filter((image) => image.src.endsWith(target))).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders the intentional lower ArrowLeft frame and rejects the stale forward resolution", async () => {
    const { ControlledImage, drawImage } = mockControlledIntroFrames();
    const animationFrames: FrameRequestCallback[] = [];
    const requestAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    });

    render(<VaultShell />);
    await screen.findByText("Apertura 0%");
    fireEvent.keyDown(window, { key: "ArrowRight" });
    act(() => {
      animationFrames.shift()?.(0);
      animationFrames.shift()?.(50);
    });
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    act(() => {
      animationFrames.shift()?.(100);
    });

    const forward = ControlledImage.instances.find((image) => image.src.endsWith("intro_0012.webp"));
    const backward = ControlledImage.instances.find((image) => image.src.endsWith("intro_0011.webp"));
    expect(forward).toBeDefined();
    expect(backward).toBeDefined();

    act(() => {
      forward?.onload?.();
      backward?.onload?.();
    });

    await waitFor(() => expect(document.querySelector(".vault-curtain-opening")).toHaveAttribute("data-rendered-frame", "10"));
    expect(drawImage.mock.calls.some(([frame]) => (frame as { src: string }).src.endsWith("intro_0012.webp"))).toBe(false);
    window.requestAnimationFrame = requestAnimationFrame;
  });

  it("draws a desired frame once when its in-flight preload completes", async () => {
    const { ControlledImage, drawImage } = mockControlledIntroFrames();
    const animationFrames: FrameRequestCallback[] = [];
    const requestAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    });

    try {
      render(<VaultShell />);
      await screen.findByText("Apertura 0%");
      fireEvent.keyDown(window, { key: "ArrowRight" });
      act(() => {
        animationFrames.shift()?.(0);
        animationFrames.shift()?.(50);
      });

      const desiredPreload = ControlledImage.instances.find((image) => image.src.endsWith("intro_0012.webp"));
      expect(desiredPreload).toBeDefined();
      act(() => desiredPreload?.onload?.());

      await waitFor(() => expect(document.querySelector(".vault-curtain-opening")).toHaveAttribute("data-rendered-frame", "11"));
      expect(drawImage.mock.calls.filter(([frame]) => (frame as { src: string }).src.endsWith("intro_0012.webp"))).toHaveLength(1);
    } finally {
      window.requestAnimationFrame = requestAnimationFrame;
    }
  });

  it("hands off at mobile 100% without waiting for a delayed final frame", async () => {
    mockViewport(390, 844);
    mockMedia({ reducedMotion: false, mobile: true });
    const DelayedImage = mockIntroFramesExceptDelayedFinalFrame();

    render(<VaultShell />);
    await act(async () => { await Promise.resolve(); fireEvent.resize(window); });
    expect(screen.getByRole("status", { name: "Desliza hacia arriba para abrir la bóveda o hacia abajo para revertir la apertura." })).toBeInTheDocument();
    expect(screen.getByText("Apertura 0%")).toBeInTheDocument();

    await act(async () => {
      for (let index = 0; index < Math.ceil(1 / 0.08); index += 1) fireEvent.wheel(window, { deltaY: 1800 });
      await Promise.resolve();
    });

    expect(document.querySelector(".vault-curtain-opening")).toBeNull();
    expect(screen.getByText("Desbloqueado 0/3")).toBeInTheDocument();

    const delayedFinalFrame = DelayedImage.instances.find((image) => image.src.endsWith("intro_0032.webp"));
    expect(delayedFinalFrame).toBeDefined();
    await act(async () => {
      delayedFinalFrame?.onload?.();
    });
  });

  it("advances the mobile intro from a tap and keeps the handoff from selecting a seal", async () => {
    mockViewport(390, 844);
    mockMedia({ reducedMotion: false, mobile: true });

    render(<VaultShell />);

    await screen.findByRole("status", { name: "Desliza hacia arriba para abrir la bóveda o hacia abajo para revertir la apertura." });
    const shell = await screen.findByRole("region", { name: "¿Qué hay detrás?" });
    fireEvent.pointerDown(shell, { pointerId: 1, pointerType: "touch", clientX: 120, clientY: 400 });
    fireEvent.pointerMove(shell, { pointerId: 1, pointerType: "touch", clientX: 120, clientY: 350 });
    fireEvent.pointerUp(shell, { pointerId: 1, pointerType: "touch", clientX: 120, clientY: 350 });

    expect(await screen.findByText("Apertura 18%")).toBeInTheDocument();
  });

  it("unlocks each unique seal once while preserving unlocked state", async () => {
    mockMedia({ reducedMotion: true, mobile: false });
    const user = userEvent.setup();

    render(<VaultShell />);
    await waitForVaultInterface();

    await user.click(screen.getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ }));
    expect(screen.getByRole("dialog", { name: "Sello 1 — El Ojo" })).toBeInTheDocument();
    expect(screen.queryByText(/A veces es muy difícil comenzar algo/)).toBeInTheDocument();
    expect(screen.getByText("Desbloqueado 1/3")).toBeInTheDocument();
    expect(screen.queryByText(/Umbral/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sello 1 — El Ojo.*Desbloqueado/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Mis obras en construcción" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /Sello 1 — El Ojo.*Desbloqueado/ }));
    expect(screen.getByText("Desbloqueado 1/3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Sello 2 — La Garra.*Bloqueado/ }));

    expect(screen.getByRole("heading", { name: "Sello 2 — La Garra" })).toBeInTheDocument();
    expect(screen.getByText("Desbloqueado 2/3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sello 1 — El Ojo.*Desbloqueado/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mis obras en construcción" })).toBeDisabled();
    expect(screen.queryByRole("region", { name: "Sala principal de proyectos" })).not.toBeInTheDocument();
  });

  it("uses mobile guidance and enables opened interaction at the visual 45% threshold", async () => {
    mockViewport(390, 844);
    mockMedia({ reducedMotion: false, mobile: true });

    render(<VaultShell />);

    expect(await screen.findByRole("status", { name: "Desliza hacia arriba para abrir la bóveda o hacia abajo para revertir la apertura." })).toBeInTheDocument();
    expect(screen.getByText("Abrir")).toBeVisible();
    expect(screen.queryByRole("status", { name: /flecha/i })).not.toBeInTheDocument();
    await screen.findByText("Apertura 0%");

    for (let index = 0; index < Math.ceil(1 / 0.08); index += 1) {
      fireEvent.wheel(window, { deltaY: 1800 });
    }

    expect(await screen.findByText("Pulsa sobre los sellos para activarlos.")).toBeInTheDocument();
    expect(screen.getByText("Desbloqueado 0/3")).toBeInTheDocument();
    expect(screen.getByText("Desbloqueado 0/3")).toHaveClass("vault-unlock-progress-hud");
    expect(screen.queryByText(/swipe|desliza/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sello 1 — El Ojo" })).not.toBeInTheDocument();
  });

  it("centers the mobile and tablet dialogue title and instruction", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

    expect(css).toMatch(/@media \(max-width: 64rem\) {[\s\S]*\.vault-interface-title-row,[\s\S]*\.vault-interface-guidance {[\s\S]*text-align: center;/);
    expect(css).toContain("--vault-panel-inline-safe-padding");
    expect(css).toContain("padding-inline: var(--vault-panel-inline-safe-padding);");
  });

  it("enables opened interaction at the near-square responsive tablet visual threshold", async () => {
    const nearSquareTabletViewport = { width: 886, height: 906 };

    mockViewport(nearSquareTabletViewport.width, nearSquareTabletViewport.height);
    mockMedia({ reducedMotion: false, mobile: false });

    render(<VaultShell />);

    await screen.findByText("Apertura 0%");
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    for (let index = 0; index < Math.ceil(1 / 0.08); index += 1) {
      fireEvent.wheel(window, { deltaY: 1800 });
    }

    expect(await screen.findByRole("status", { name: "Recorre los sellos con las flechas izquierda y derecha, o haz click sobre ellos." })).toBeInTheDocument();
    expect(screen.getByText("Desbloqueado 0/3")).toBeInTheDocument();
    expect(screen.queryByText(/Apertura 65%/)).not.toBeInTheDocument();
  });

  it("uses direct tap-only mobile seal guidance without swipe wording", async () => {
    mockMedia({ reducedMotion: true, mobile: true });
    const user = userEvent.setup();

    render(<VaultShell />);
    await waitForVaultInterface();

    await user.click(screen.getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ }));
    expect(screen.getByText("Desbloqueado 1/3")).toBeInTheDocument();
    expect(screen.getByText("Desbloqueado 1/3")).toHaveClass("vault-unlock-progress-hud");
    expect(screen.getByRole("status")).toHaveTextContent("Pulsa sobre los sellos para activarlos.");
    expect(screen.getByRole("status")).not.toHaveTextContent(/swipe|desliza/i);
    expect(screen.getByRole("dialog", { name: "Sello 1 — El Ojo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar sello" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar sello" }));
    expect(screen.queryByRole("dialog", { name: "Sello 1 — El Ojo" })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /Sello 1 — El Ojo.*Desbloqueado/ })).toHaveFocus());
    await user.click(screen.getByRole("button", { name: /Sello 3 — La Cerradura.*Bloqueado/ }));
    expect(screen.getByRole("dialog", { name: "Sello 3 — La Cerradura" })).toBeInTheDocument();
    expect(screen.getByText("Desbloqueado 2/3")).toBeInTheDocument();

    fireEvent.touchStart(screen.getByRole("region", { name: /Tres sellos antes de entrar/ }), {
      changedTouches: [{ clientX: 120 }],
    });
    fireEvent.touchEnd(screen.getByRole("region", { name: /Tres sellos antes de entrar/ }), {
      changedTouches: [{ clientX: 220 }],
    });

    expect(screen.queryByRole("heading", { name: "Sello 2 — La Garra" })).not.toBeInTheDocument();
    expect(screen.getByText("Desbloqueado 2/3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Sello 2 — La Garra.*Bloqueado/ }));
    expect(screen.getByText("Desbloqueado 3/3")).toBeInTheDocument();
  });

  it("opens the seal narrative in a desktop modal instead of the bottom panel", async () => {
    mockMedia({ reducedMotion: true, mobile: false });
    const user = userEvent.setup();

    render(<VaultShell />);
    await waitForVaultInterface();

    await user.click(screen.getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ }));

    expect(screen.getByRole("dialog", { name: "Sello 1 — El Ojo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar sello" })).toHaveFocus();
    expect(document.querySelector(".vault-riddle-panel")?.textContent).not.toContain("A veces es muy difícil comenzar algo");
  });

  it("closes the seal modal with close button, outside click, Escape, and browser back", async () => {
    mockMedia({ reducedMotion: true, mobile: false });
    const user = userEvent.setup();

    render(<VaultShell />);
    await waitForVaultInterface();

    const firstSeal = screen.getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ });
    await user.click(firstSeal);
    expect(screen.getByRole("dialog", { name: "Sello 1 — El Ojo" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar sello" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Sello 1 — El Ojo" })).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: /Sello 1 — El Ojo.*Desbloqueado/ })).toHaveFocus());

    await user.click(screen.getByRole("button", { name: /Sello 2 — La Garra.*Bloqueado/ }));
    fireEvent.mouseDown(document.querySelector(".vault-seal-modal") as Element);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Sello 2 — La Garra" })).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Sello 3 — La Cerradura.*Bloqueado/ }));
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Sello 3 — La Cerradura" })).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Sello 1 — El Ojo.*Desbloqueado/ }));
    fireEvent.popState(window);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Sello 1 — El Ojo" })).not.toBeInTheDocument());
  });

  it("traps forward and reverse Tab inside the seal dialog and makes the background inert", async () => {
    mockMedia({ reducedMotion: true, mobile: false });
    const user = userEvent.setup();

    render(<VaultShell />);
    await waitForVaultInterface();
    await user.click(screen.getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ }));

    const closeButton = screen.getByRole("button", { name: "Cerrar sello" });
    expect(document.querySelector(".vault-interface-content")).toHaveAttribute("inert");
    await user.tab();
    expect(closeButton).toHaveFocus();
    await user.tab({ shift: true });
    expect(closeButton).toHaveFocus();
  });

  it("activates the enabled Main Hall CTA with Enter or Space without unlocking seals early", async () => {
    mockMedia({ reducedMotion: true, mobile: false });
    const user = userEvent.setup();

    render(<VaultShell />);
    await waitForVaultInterface();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.queryByRole("region", { name: "Sala principal de proyectos" })).not.toBeInTheDocument();
    expect(screen.getByText("Desbloqueado 0/3")).toBeInTheDocument();

    await unlockAllSeals(user);
    expect(screen.getByText("Desbloqueado 3/3")).toBeInTheDocument();

    screen.getByRole("region", { name: "Tres sellos antes de entrar." }).focus();
    fireEvent.keyDown(window, { key: " " });
    expect(screen.getByRole("region", { name: "Sala principal de proyectos" })).toHaveFocus();
  });

  it("adds completion emphasis without dimming the CTA or an open seal modal", async () => {
    mockMedia({ reducedMotion: true, mobile: false });
    const user = userEvent.setup();

    render(<VaultShell />);
    await waitForVaultInterface();
    await unlockAllSeals(user);

    const shell = screen.getByRole("region", { name: "Tres sellos antes de entrar." });
    const cta = screen.getByRole("button", { name: "Mis obras en construcción" });

    expect(shell).toHaveAttribute("data-vault-complete", "true");
    expect(shell).toHaveAttribute("data-seal-dialog-open", "false");
    expect(cta).toBeEnabled();
    expect(cta).toHaveClass("vault-mainhall-action");

    await user.click(screen.getByRole("button", { name: /Sello 1 — El Ojo.*Desbloqueado/ }));
    expect(screen.getByRole("dialog", { name: "Sello 1 — El Ojo" })).toBeInTheDocument();
    expect(shell).toHaveAttribute("data-seal-dialog-open", "true");

    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    expect(css).toMatch(/\.vault-shell\[data-vault-complete="true"\]:not\(\[data-seal-dialog-open="true"\]\)[\s\S]*\.vault-mainhall-action/);
    expect(css).toMatch(/\.vault-shell\[data-vault-complete="true"\]:not\(\[data-seal-dialog-open="true"\]\)[\s\S]*\.vault-visual-stage/);
  });

  it("unlocks the main hall and moves focus to its landmark", async () => {
    const user = userEvent.setup();
    mockMedia({ reducedMotion: true, mobile: false });

    render(<VaultShell />);
    await waitForVaultInterface();

    await user.click(screen.getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ }));
    expect(screen.getByText("Desbloqueado 1/3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar sello" }));
    await user.click(screen.getByRole("button", { name: /Sello 2 — La Garra.*Bloqueado/ }));
    expect(screen.getByText("Desbloqueado 2/3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar sello" }));
    await user.click(screen.getByRole("button", { name: /Sello 3 — La Cerradura.*Bloqueado/ }));
    expect(screen.getByText("Desbloqueado 3/3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar sello" }));
    await user.click(screen.getByRole("button", { name: "Mis obras en construcción" }));

    expect(screen.getByRole("region", { name: "Sala principal de proyectos" })).toHaveFocus();
    expect(screen.getByRole("region", { name: "Kuroneko abre la bóveda." })).toHaveAccessibleName(
      "Kuroneko abre la bóveda.",
    );
    expect(screen.getByRole("region", { name: "Kuroneko abre la bóveda." })).not.toHaveAttribute("aria-describedby");
    expect(JSON.parse(window.sessionStorage.getItem("kuroneko:session-progression:v1") ?? "{}")).toMatchObject({ mainHallUnlocked: true });
  });

  it("isolates parent input and hands the cinematic off to Main Hall", async () => {
    const user = userEvent.setup();
    Object.defineProperty(HTMLVideoElement.prototype, "canPlayType", { configurable: true, value: () => "probably" });
    Object.defineProperty(window, "navigation", { configurable: true, value: new EventTarget() });
    render(<VaultShell />);
    await waitFor(() => expect(document.querySelector('[data-first-frame-drawn="true"]')).toBeInTheDocument());
    for (let step = 0; step < 20; step += 1) fireEvent.wheel(window, { deltaY: 100 });
    await waitForVaultInterface();
    await unlockAllSeals(user);
    await user.click(screen.getByRole("button", { name: "Mis obras en construcción" }));

    expect(screen.getByRole("dialog", { name: "Transición a la sala principal" })).toBeInTheDocument();
    expect(document.querySelector(".vault-shell-panel")).toHaveAttribute("inert");
    fireEvent.keyDown(window, { key: "ArrowRight" }); fireEvent.wheel(window, { deltaY: 100 });
    fireEvent.touchStart(screen.getByRole("region", { name: "Tres sellos antes de entrar." })); fireEvent.click(document.querySelector('[aria-label="Sello anterior"]') as Element);
    expect(screen.queryByRole("dialog", { name: /Sello \d/ })).not.toBeInTheDocument();
    expect(document.querySelector(".vault-shell")).toHaveAttribute("data-seal-dialog-open", "false");
    await user.click(screen.getByRole("button", { name: "Saltar introducción" }));
    await waitFor(() => expect(screen.getByRole("region", { name: "Sala principal de proyectos" })).toHaveFocus());
  });

  it.each(["ended", "skip", "error", "abort"] as const)("persists the canonical Main Hall grant before %s dismisses the cinematic", async (completion) => {
    const user = userEvent.setup();
    Object.defineProperty(HTMLVideoElement.prototype, "canPlayType", { configurable: true, value: () => "probably" });
    render(<VaultShell />);
    await waitFor(() => expect(document.querySelector('[data-first-frame-drawn="true"]')).toBeInTheDocument());
    for (let step = 0; step < 20; step += 1) fireEvent.wheel(window, { deltaY: 100 });
    await waitForVaultInterface();
    await unlockAllSeals(user);
    await user.click(screen.getByRole("button", { name: "Mis obras en construcción" }));

    const cinematic = screen.getByRole("dialog", { name: "Transición a la sala principal" });
    const video = cinematic.querySelector("video");
    if (completion === "skip") {
      await user.click(screen.getByRole("button", { name: "Saltar introducción" }));
    } else if (video !== null) {
      if (completion === "ended") fireEvent.ended(video);
      if (completion === "error") fireEvent.error(video);
      if (completion === "abort") fireEvent.abort(video);
    }

    await waitFor(() => expect(screen.getByRole("region", { name: "Sala principal de proyectos" })).toBeInTheDocument());
    expect(screen.queryByRole("dialog", { name: "Transición a la sala principal" })).not.toBeInTheDocument();
    expect(JSON.parse(window.sessionStorage.getItem("kuroneko:session-progression:v1") ?? "{}")).toMatchObject({ mainHallUnlocked: true });
  });

  it("bypasses the cinematic for save-data and still commits the canonical grant", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } });
    Object.defineProperty(HTMLVideoElement.prototype, "canPlayType", { configurable: true, value: () => "probably" });
    render(<VaultShell />);
    await waitFor(() => expect(document.querySelector('[data-first-frame-drawn="true"]')).toBeInTheDocument());
    for (let step = 0; step < 20; step += 1) fireEvent.wheel(window, { deltaY: 100 });
    await waitForVaultInterface();
    await unlockAllSeals(user);
    await user.click(screen.getByRole("button", { name: "Mis obras en construcción" }));

    await waitFor(() => expect(screen.getByRole("region", { name: "Sala principal de proyectos" })).toBeInTheDocument());
    expect(screen.queryByRole("dialog", { name: "Transición a la sala principal" })).not.toBeInTheDocument();
    expect(JSON.parse(window.sessionStorage.getItem("kuroneko:session-progression:v1") ?? "{}")).toMatchObject({ mainHallUnlocked: true });
    Reflect.deleteProperty(navigator, "connection");
  });

  it.each(["Enter", " "])("starts one cinematic from the focused Main Hall CTA with %s", async (activationKey) => {
    const user = userEvent.setup();
    Object.defineProperty(HTMLVideoElement.prototype, "canPlayType", { configurable: true, value: () => "probably" });
    Object.defineProperty(window, "navigation", { configurable: true, value: new EventTarget() });
    render(<VaultShell />);
    await waitFor(() => expect(document.querySelector('[data-first-frame-drawn="true"]')).toBeInTheDocument());
    for (let step = 0; step < 20; step += 1) fireEvent.wheel(window, { deltaY: 100 });
    await waitForVaultInterface();
    await unlockAllSeals(user);

    const action = screen.getByRole("button", { name: "Mis obras en construcción" });
    expect(action).toBeEnabled();
    action.focus();
    if (activationKey === " ") {
      fireEvent.keyDown(action, { key: " ", code: "Space", repeat: false });
      fireEvent.keyUp(action, { key: " ", code: "Space" });
    } else {
      await user.keyboard("{Enter}");
    }

    await waitFor(() => expect(screen.getByRole("dialog", { name: "Transición a la sala principal" })).toBeInTheDocument());
    expect(screen.getAllByRole("dialog", { name: "Transición a la sala principal" })).toHaveLength(1);
    expect(screen.queryByRole("region", { name: "Sala principal de proyectos" })).not.toBeInTheDocument();
  });

  it("keeps the vault scene CSS monochrome without the old blue/cyan accent", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

    expect(css).not.toMatch(/7dd3fc|125, 211, 252|cyan|blue/i);
    expect(css).toContain("--accent: #f4f2ec;");
  });

  it("keeps locked seal hotspots visibly illuminated while respecting reduced motion", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

    expect(css).toContain('.vault-seal-hotspot:not([data-unlocked="true"])::before');
    expect(css).toContain("animation: vault-seal-locked-breathe 2600ms ease-in-out infinite;");
    expect(css).toContain("@keyframes vault-seal-locked-shimmer");
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.vault-seal-hotspot::before,[\s\S]*animation: none;/);
    expect(css).toContain('.vault-seal-hotspot[data-unlocked="true"] img');
  });
});
