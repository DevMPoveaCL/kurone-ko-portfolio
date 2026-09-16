import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, useEffect, useEffectEvent } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetSharedAudioElementForTests } from "@/shared/media/audio-controller";
import { BugCesantePlayerProvider, parseWebVtt, PLAYER_PRESENTATION, PlayerMovementLegend, reconcileLyricCues, useBugCesantePlayer } from "./BugCesantePlayer";

const PRIMARY_PLAYER_STORAGE_KEY = "kuroneko:bug-cesante-player";

function PlayerHarness() {
  const { activatePlayer } = useBugCesantePlayer();

  return <button onClick={() => activatePlayer()} type="button">Activar reproductor</button>;
}

function AutoActivatingPlayerHarness() {
  const { activatePlayer } = useBugCesantePlayer();
  const activate = useEffectEvent(activatePlayer);

  useEffect(() => {
    activate();
  }, []);

  return null;
}

function TransportHarness() {
  const { isPlaying, releaseTransport } = useBugCesantePlayer();

  return (
    <>
      <span data-testid="transport-state">{isPlaying ? "playing" : "paused"}</span>
      <button onClick={releaseTransport} type="button">Liberar transporte</button>
    </>
  );
}

function MovementHarness() {
  const { activatePlayer, movementUnlocked, unlockPlayerMovement } = useBugCesantePlayer();

  return <>
    <button onClick={() => activatePlayer()} type="button">Activar reproductor</button>
    <button onClick={unlockPlayerMovement} type="button">Desbloquear movimiento</button>
    {movementUnlocked ? <PlayerMovementLegend /> : null}
  </>;
}

function stubSuccessfulPlayback() {
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) {
    Object.defineProperty(this, "paused", { configurable: true, value: false });
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  });
  const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (this: HTMLMediaElement) {
    Object.defineProperty(this, "paused", { configurable: true, value: true });
    this.dispatchEvent(new Event("pause"));
  });

  return { pause, play };
}

describe("BugCesantePlayerProvider", () => {
  beforeEach(() => {
    resetSharedAudioElementForTests();
    window.sessionStorage.clear();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("Lyrics are not needed for this test."))));
  });

  afterEach(() => vi.unstubAllGlobals());

  afterEach(() => vi.restoreAllMocks());

  it("minimizes without unmounting and restores the controls", async () => {
    const user = userEvent.setup();
    render(<BugCesantePlayerProvider><PlayerHarness /></BugCesantePlayerProvider>);

    await user.click(screen.getByRole("button", { name: "Activar reproductor" }));
    const player = screen.getByRole("complementary", { name: "Reproductor persistente de Bug Cesante" });
    const minimize = screen.getByRole("button", { name: "Minimizar reproductor" });

    await user.click(minimize);
    expect(player).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restaurar reproductor" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Reproducir canción" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Restaurar reproductor" }));
    expect(screen.getByRole("button", { name: "Minimizar reproductor" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Reproducir canción" })).toBeInTheDocument();
  });

  it("mounts the mobile safe zone only with the activated player", async () => {
    const user = userEvent.setup();
    render(<BugCesantePlayerProvider><PlayerHarness /></BugCesantePlayerProvider>);

    expect(screen.queryByRole("complementary", { name: "Reproductor persistente de Bug Cesante" })).not.toBeInTheDocument();
    expect(document.querySelector(".mobile-control-safe-zone")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Activar reproductor" }));
    expect(document.querySelector(".mobile-control-safe-zone[data-presentation='primary']")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Minimizar reproductor" }));
    expect(document.querySelector(".mobile-control-safe-zone[data-presentation='primary']")).toBeInTheDocument();
  });

  it("supports alternate presentation without changing primary discovery activation", async () => {
    const forced = render(
      <BugCesantePlayerProvider presentation={PLAYER_PRESENTATION.ALTERNATE}>
        <PlayerHarness />
      </BugCesantePlayerProvider>,
    );

    expect(await screen.findByRole("complementary", { name: "Reproductor persistente de Bug Cesante" })).toBeInTheDocument();
    expect(document.querySelector(".mobile-control-safe-zone[data-presentation='alternate']")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("kuroneko:bug-cesante-player:alternate")).toBeNull();
    forced.unmount();

    window.sessionStorage.setItem("kuroneko:bug-cesante-player", JSON.stringify({
      activated: true,
      currentTime: 0,
      hidden: false,
      lyricsExpanded: false,
      paused: true,
      position: null,
    }));
    render(<BugCesantePlayerProvider><PlayerHarness /></BugCesantePlayerProvider>);

    expect(await screen.findByRole("complementary", { name: "Reproductor persistente de Bug Cesante" })).toBeInTheDocument();
  });

  it("does not attempt alternate playback on mount", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

    render(
      <BugCesantePlayerProvider presentation={PLAYER_PRESENTATION.ALTERNATE}>
        <PlayerHarness />
      </BugCesantePlayerProvider>,
    );

    expect(await screen.findByRole("button", { name: "Reproducir canción" })).toBeInTheDocument();
    expect(play).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Pausar canción" })).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem(PRIMARY_PLAYER_STORAGE_KEY)).toBeNull();
  });

  it("starts alternate playback only after explicit Play", async () => {
    const user = userEvent.setup();
    const { pause, play } = stubSuccessfulPlayback();

    render(
      <BugCesantePlayerProvider presentation={PLAYER_PRESENTATION.ALTERNATE}>
        <PlayerHarness />
      </BugCesantePlayerProvider>,
    );

    const playButton = await screen.findByRole("button", { name: "Reproducir canción" });
    expect(play).not.toHaveBeenCalled();
    await user.click(playButton);
    expect(play).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Pausar canción" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pausar canción" }));
    expect(pause).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Reproducir canción" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reproducir canción" }));
    expect(play).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Pausar canción" })).toBeInTheDocument();
    expect(window.sessionStorage.getItem(PRIMARY_PLAYER_STORAGE_KEY)).toBeNull();
  });

  it("pauses on alternate release and defensively pauses again on unmount", async () => {
    const user = userEvent.setup();
    const { pause, play } = stubSuccessfulPlayback();
    const view = render(
      <BugCesantePlayerProvider presentation={PLAYER_PRESENTATION.ALTERNATE}>
        <TransportHarness />
      </BugCesantePlayerProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Reproducir canción" }));
    expect(play).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Liberar transporte" }));
    expect(pause).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("transport-state")).toHaveTextContent("paused");

    view.unmount();
    const mounted = render(
      <BugCesantePlayerProvider presentation={PLAYER_PRESENTATION.ALTERNATE}>
        <TransportHarness />
      </BugCesantePlayerProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Reproducir canción" }));
    const pauseCountBeforeUnmount = pause.mock.calls.length;
    mounted.unmount();
    expect(pause.mock.calls.length).toBeGreaterThan(pauseCountBeforeUnmount);
  });

  it("pauses the current owner for a new provider and restores its own paused time", async () => {
    const { pause, play } = stubSuccessfulPlayback();
    const alternate = render(
      <BugCesantePlayerProvider presentation={PLAYER_PRESENTATION.ALTERNATE}>
        <TransportHarness />
      </BugCesantePlayerProvider>,
    );
    await userEvent.setup().click(screen.getByRole("button", { name: "Reproducir canción" }));
    expect(screen.getByTestId("transport-state")).toHaveTextContent("playing");

    window.sessionStorage.setItem(PRIMARY_PLAYER_STORAGE_KEY, JSON.stringify({
      activated: true,
      currentTime: 8.5,
      hidden: false,
      lyricsExpanded: false,
      paused: false,
      position: null,
    }));
    render(
      <BugCesantePlayerProvider>
        <TransportHarness />
      </BugCesantePlayerProvider>,
    );

    expect(pause).toHaveBeenCalled();
    expect(play).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getAllByTestId("transport-state").at(-1)).toHaveTextContent("paused"));
    expect(await screen.findByText("0:08 / 0:00", { exact: true })).toBeInTheDocument();
    alternate.unmount();
  });

  it("pauses and persists without resuming when the document is hidden or paged away", async () => {
    const user = userEvent.setup();
    const { pause } = stubSuccessfulPlayback();
    render(
      <BugCesantePlayerProvider presentation={PLAYER_PRESENTATION.ALTERNATE}>
        <PlayerHarness />
      </BugCesantePlayerProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Reproducir canción" }));

    await act(async () => {
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("pagehide"));
    });

    expect(pause).toHaveBeenCalled();
    expect(JSON.parse(window.sessionStorage.getItem("kuroneko:bug-cesante-player:alternate") ?? "{}")).toMatchObject({ paused: true });
    expect(screen.getByRole("button", { name: "Reproducir canción" })).toBeInTheDocument();
  });

  it("keeps an alternate stored playing state paused on mount", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    window.sessionStorage.setItem("kuroneko:bug-cesante-player:alternate", JSON.stringify({
      activated: true,
      currentTime: 12.5,
      hidden: false,
      lyricsExpanded: false,
      paused: false,
      position: null,
    }));

    render(
      <BugCesantePlayerProvider presentation={PLAYER_PRESENTATION.ALTERNATE}>
        <PlayerHarness />
      </BugCesantePlayerProvider>,
    );

    expect(await screen.findByRole("button", { name: "Reproducir canción" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pausar canción" })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("0:12 / 0:00", { exact: true })).toBeInTheDocument());
    expect(play).not.toHaveBeenCalled();
  });

  it("preserves primary storage byte-for-byte through alternate player interactions", async () => {
    const primaryState = '{ "activated": true, "currentTime": 12.5, "hidden": false, "lyricsExpanded": false, "paused": true, "position": null }';
    window.sessionStorage.setItem(PRIMARY_PLAYER_STORAGE_KEY, primaryState);
    const user = userEvent.setup();
    stubSuccessfulPlayback();

    render(
      <BugCesantePlayerProvider presentation={PLAYER_PRESENTATION.ALTERNATE}>
        <PlayerHarness />
      </BugCesantePlayerProvider>,
    );

    const playButton = await screen.findByRole("button", { name: "Reproducir canción" });
    await user.click(playButton);
    expect(screen.getByRole("button", { name: "Pausar canción" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pausar canción" }));
    await user.click(screen.getByRole("button", { name: "Reproducir canción" }));
    await user.click(screen.getByRole("button", { name: "Reiniciar canción" }));
    await user.click(screen.getByRole("button", { name: "Mostrar letra" }));
    await user.click(screen.getByRole("button", { name: "Ocultar letra" }));

    expect(window.sessionStorage.getItem(PRIMARY_PLAYER_STORAGE_KEY)).toBe(primaryState);
  });

  it("keeps the first client snapshot equal to SSR before restoring persisted state", async () => {
    window.sessionStorage.setItem(
      "kuroneko:bug-cesante-player",
      JSON.stringify({
        activated: true,
        currentTime: 12.5,
        hidden: false,
        lyricsExpanded: false,
        paused: true,
        position: null,
      }),
    );
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    const serverMarkup = renderToString(
      <BugCesantePlayerProvider>
        <AutoActivatingPlayerHarness />
      </BugCesantePlayerProvider>,
    );
    getItem.mockRestore();

    const container = document.createElement("div");
    container.innerHTML = serverMarkup;
    document.body.appendChild(container);
    const hydrationErrors: unknown[] = [];
    const consoleError = vi.spyOn(console, "error").mockImplementation((...args) => {
      hydrationErrors.push(args);
    });
    const root = hydrateRoot(
      container,
      <BugCesantePlayerProvider>
        <AutoActivatingPlayerHarness />
      </BugCesantePlayerProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(hydrationErrors).toEqual([]);
    expect(screen.queryByRole("complementary", { name: "Reproductor persistente de Bug Cesante" })).toBeInTheDocument();
    expect(JSON.parse(window.sessionStorage.getItem("kuroneko:bug-cesante-player") ?? "{}")).toMatchObject({ currentTime: 12.5 });
    root.unmount();
    container.remove();
    consoleError.mockRestore();
  });

  it("focuses the remembered bottom control after ArrowDown restores a minimized player", async () => {
    const user = userEvent.setup();
    render(<BugCesantePlayerProvider><PlayerHarness /></BugCesantePlayerProvider>);

    await user.click(screen.getByRole("button", { name: "Activar reproductor" }));
    const play = screen.getByRole("button", { name: "Reproducir canción" });
    play.focus();
    await user.keyboard("{ArrowUp}");

    const minimize = screen.getByRole("button", { name: "Minimizar reproductor" });
    expect(minimize).toHaveFocus();
    await user.keyboard("{Enter}");

    const restore = screen.getByRole("button", { name: "Restaurar reproductor" });
    expect(restore).toHaveFocus();
    await user.keyboard("{ArrowDown}");

    const restoredPlay = await screen.findByRole("button", { name: "Reproducir canción" });
    await waitFor(() => expect(restoredPlay).toHaveFocus());
  });

  it("keeps lyrics inside the player on desktop", async () => {
    const user = userEvent.setup();
    render(<BugCesantePlayerProvider><PlayerHarness /></BugCesantePlayerProvider>);

    await user.click(screen.getByRole("button", { name: "Activar reproductor" }));
    await user.click(screen.getByRole("button", { name: "Mostrar letra" }));

    const player = screen.getByRole("complementary", { name: "Reproductor persistente de Bug Cesante" });
    expect(screen.queryByRole("dialog", { name: "Letra de Bug Cesante" })).not.toBeInTheDocument();
    expect(player.querySelector("#bug-cesante-lyrics-surface")).toBeInTheDocument();
  });

  it("parses the authorized lyrics with valid monotonic cues and copy anchors", () => {
    const source = readFileSync(resolve(process.cwd(), "public/assets/audio/bug-cesante.lyrics.vtt"), "utf8");
    const cues = parseWebVtt(source);
    const timingLines = source.match(/^\S+\s+-->\s+\S+$/gmu) ?? [];
    const startTimes = timingLines.map((line) => {
      const timestamp = line.split("-->")[0]?.trim() ?? "";
      return timestamp.split(":").reduce((total, part) => total * 60 + Number(part), 0);
    });

    expect(source.startsWith("WEBVTT")).toBe(true);
    expect(cues).toHaveLength(timingLines.length);
    expect(startTimes.slice(1).every((start, index) => start >= (startTimes[index] ?? 0))).toBe(true);
    expect(cues.every((cue) => cue.end > cue.start)).toBe(true);
    expect(cues.slice(1).every((cue, index) => cue.start >= (cues[index]?.start ?? 0))).toBe(true);
    expect(cues[0]?.text).toBe("Desde el mejor país de Chile...");
    expect(cues.some((cue) => cue.text.includes("¡QUÉ BUEN DESARROLLADOR!"))).toBe(true);
    expect(cues.at(-1)?.text).toBe("Nos vemos el lunes.");
  });

  it("keeps lyric seeking pending until media confirms it and supports keyboard activation", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      text: () => Promise.resolve("WEBVTT\n\n1\n00:00:01.000 --> 00:00:03.000\nPrimera línea\n"),
    })));
    let actualTime = 0;

    render(
      <BugCesantePlayerProvider presentation={PLAYER_PRESENTATION.ALTERNATE}>
        <PlayerHarness />
      </BugCesantePlayerProvider>,
    );

    const audio = document.querySelector<HTMLAudioElement>(".bug-cesante-audio");
    if (audio === null) throw new Error("Expected the shared audio element.");
    Object.defineProperties(audio, {
      buffered: { configurable: true, value: { end: () => 360, length: 1, start: () => 0 } },
      currentTime: { configurable: true, get: () => actualTime, set: (value: number) => { actualTime = value; } },
      duration: { configurable: true, value: 360 },
      readyState: { configurable: true, value: HTMLMediaElement.HAVE_ENOUGH_DATA },
      seekable: { configurable: true, value: { end: () => 360, length: 1, start: () => 0 } },
    });
    fireEvent.loadedMetadata(audio);

    await user.click(await screen.findByRole("button", { name: "Mostrar letra" }));
    const cue = await screen.findByRole("button", { name: "Ir a 0:01: Primera línea" });
    expect(cue).not.toHaveAttribute("aria-current");
    await user.click(cue);

    const range = screen.getByRole("slider", { name: "Posición de la canción" });
    expect(range).toHaveAttribute("data-seek-status", "pending");
    expect(screen.getByText("0:00 / 6:00", { exact: true })).toBeInTheDocument();

    fireEvent.seeked(audio);
    await waitFor(() => expect(range).toHaveAttribute("data-seek-status", "confirmed"));
    expect(cue).toHaveAttribute("aria-current", "true");
    expect(JSON.parse(window.sessionStorage.getItem("kuroneko:bug-cesante-player:alternate") ?? "{}")).toMatchObject({ currentTime: 1 });

    cue.focus();
    await user.keyboard(" ");
    expect(range).toHaveAttribute("data-seek-status", "pending");
  });

  it("clears a failed seek without persisting its target and announces the recovery", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      text: () => Promise.resolve("WEBVTT\n\n1\n00:00:01.000 --> 00:00:03.000\nPrimera línea\n"),
    })));
    let actualTime = 0;

    render(
      <BugCesantePlayerProvider presentation={PLAYER_PRESENTATION.ALTERNATE}>
        <PlayerHarness />
      </BugCesantePlayerProvider>,
    );

    const audio = document.querySelector<HTMLAudioElement>(".bug-cesante-audio");
    if (audio === null) throw new Error("Expected the shared audio element.");
    Object.defineProperties(audio, {
      buffered: { configurable: true, value: { end: () => 360, length: 1, start: () => 0 } },
      currentTime: { configurable: true, get: () => actualTime, set: (value: number) => { actualTime = value; } },
      duration: { configurable: true, value: 359.879979 },
      readyState: { configurable: true, value: HTMLMediaElement.HAVE_ENOUGH_DATA },
      seekable: { configurable: true, value: { end: () => 359.879979, length: 1, start: () => 0 } },
    });
    fireEvent.loadedMetadata(audio);

    await user.click(await screen.findByRole("button", { name: "Mostrar letra" }));
    const cue = await screen.findByRole("button", { name: "Ir a 0:01: Primera línea" });
    await user.click(cue);
    expect(screen.getByRole("slider", { name: "Posición de la canción" })).toHaveAttribute("data-seek-status", "pending");

    actualTime = 0;
    fireEvent.seeked(audio);

    await waitFor(() => {
      expect(screen.getByRole("slider", { name: "Posición de la canción" })).toHaveAttribute("data-seek-status", "failed");
      expect(screen.getByRole("status", { name: "No se pudo buscar esa posición; se mantuvo el tiempo confirmado." })).toBeInTheDocument();
    });
    expect(screen.getByText("0:00 / 5:59", { exact: true })).toBeInTheDocument();
    expect(JSON.parse(window.sessionStorage.getItem("kuroneko:bug-cesante-player:alternate") ?? "{}")).toMatchObject({ currentTime: 0 });
    expect(screen.getByRole("slider", { name: "Posición de la canción" })).not.toHaveAttribute("aria-valuetext", "Solicitando 0:01. Tiempo actual 0:00.");
  });

  it("clips lyric cues defensively to the confirmed media duration", () => {
    expect(reconcileLyricCues([
      { end: 5, id: "one", start: 1, text: "one" },
      { end: 12, id: "two", start: 10, text: "two" },
    ], 8)).toEqual([{ end: 5, id: "one", start: 1, text: "one" }]);
  });

  it("locks focus in the mobile lyrics surface and restores it after Escape", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: true,
      media: "(max-width: 48rem), (pointer: coarse)",
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })));
    const user = userEvent.setup();
    render(<BugCesantePlayerProvider><PlayerHarness /></BugCesantePlayerProvider>);

    await user.click(screen.getByRole("button", { name: "Activar reproductor" }));
    const lyricsButton = screen.getByRole("button", { name: "Mostrar letra" });
    await user.click(lyricsButton);

    const lyricsSurface = await screen.findByRole("dialog", { name: "Letra de Bug Cesante" });
    expect(lyricsSurface).toHaveAttribute("aria-modal", "true");
    await waitFor(() => expect(within(lyricsSurface).getByRole("button", { name: "Ocultar letra" })).toHaveFocus());

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Letra de Bug Cesante" })).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Mostrar letra" })).toHaveFocus();
  });

  it("opens the alternate lyrics surface without restoring the primary title", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: true,
      media: "(max-width: 48rem), (pointer: coarse)",
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })));
    const user = userEvent.setup();
    render(
      <BugCesantePlayerProvider presentation={PLAYER_PRESENTATION.ALTERNATE}>
        <PlayerHarness />
      </BugCesantePlayerProvider>,
    );

    const player = await screen.findByRole("complementary", {
      name: "Reproductor persistente de Bug Cesante",
    });
    expect(player.querySelector(".bug-cesante-player-title")).not.toBeInTheDocument();
    const lyricsButton = screen.getByRole("button", { name: "Mostrar letra" });
    await user.click(lyricsButton);

    const lyricsSurface = await screen.findByRole("dialog", { name: "Letra de Bug Cesante" });
    expect(lyricsSurface).toHaveAttribute("data-presentation", PLAYER_PRESENTATION.ALTERNATE);
    expect(within(lyricsSurface).queryByText("BUG CESANTE", { exact: true })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Ocultar letra" })).toHaveLength(1);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Letra de Bug Cesante" })).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Mostrar letra" })).toHaveFocus();
  });

  it("gates the movement legend and M+arrow mode until Void unlocks it", async () => {
    const user = userEvent.setup();
    render(<BugCesantePlayerProvider><MovementHarness /></BugCesantePlayerProvider>);

    expect(screen.queryByRole("complementary", { name: "Guía para mover el reproductor" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Activar reproductor" }));
    const player = screen.getByRole("complementary", { name: "Reproductor persistente de Bug Cesante" });
    fireEvent.keyDown(window, { code: "KeyM", key: "m" });
    fireEvent.keyDown(window, { code: "ArrowRight", key: "ArrowRight" });
    expect(player).not.toHaveAttribute("data-positioned");
    fireEvent.keyUp(window, { code: "KeyM", key: "m" });

    await user.click(screen.getByRole("button", { name: "Desbloquear movimiento" }));
    await waitFor(() => expect(screen.getByRole("complementary", { name: "Guía para mover el reproductor" })).toBeInTheDocument());
    fireEvent.keyDown(window, { code: "KeyM", key: "m" });
    fireEvent.keyDown(window, { code: "ArrowRight", key: "ArrowRight" });
    expect(player).toHaveAttribute("data-positioned", "true");
    fireEvent.keyUp(window, { code: "KeyM", key: "m" });
  });

  it("keeps the Void movement unlock through a provider remount but resets when its session key is absent", async () => {
    const { unmount } = render(<BugCesantePlayerProvider><MovementHarness /></BugCesantePlayerProvider>);
    const unlock = screen.getByRole("button", { name: "Desbloquear movimiento" });
    await userEvent.setup().click(unlock);
    expect(window.sessionStorage.getItem("kuroneko:bug-cesante-player-movement:v1")).toBe("unlocked");
    unmount();

    const secondRender = render(<BugCesantePlayerProvider><MovementHarness /></BugCesantePlayerProvider>);
    await waitFor(() => expect(screen.getByRole("complementary", { name: "Guía para mover el reproductor" })).toBeInTheDocument());

    window.sessionStorage.removeItem("kuroneko:bug-cesante-player-movement:v1");
    secondRender.unmount();
    render(<BugCesantePlayerProvider><MovementHarness /></BugCesantePlayerProvider>);
    expect(screen.queryByRole("complementary", { name: "Guía para mover el reproductor" })).not.toBeInTheDocument();
  });
});
