"use client";

import { createContext, useContext, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { acquireAudioTransportOwner, ownsAudioTransport, releaseAudioTransportOwner } from "@/shared/media/audio-controller";
import { resolveBugCesanteAudioSource } from "@/shared/media/audio-source";
import { withPublicPath } from "@/shared/routing/public-path";
import { KEYCAP_ASSET } from "./keycap-assets";

const LYRICS_SRC = "/assets/audio/bug-cesante.lyrics.vtt";
export const PLAYER_PRESENTATION = {
  PRIMARY: "primary",
  ALTERNATE: "alternate",
} as const;

export type PlayerPresentation = (typeof PLAYER_PRESENTATION)[keyof typeof PLAYER_PRESENTATION];

const PLAYER_STORAGE_KEYS: Record<PlayerPresentation, string> = {
  [PLAYER_PRESENTATION.PRIMARY]: "kuroneko:bug-cesante-player",
  [PLAYER_PRESENTATION.ALTERNATE]: "kuroneko:bug-cesante-player:alternate",
};
const MOVEMENT_UNLOCK_STORAGE_KEY = "kuroneko:bug-cesante-player-movement:v1";
const COARSE_VIEWPORT_QUERY = "(max-width: 48rem), (pointer: coarse)";
const PLAYER_MARGIN = 16;
const PLAYER_KEYBOARD_STEP = 32;
const MANUAL_SCROLL_TIMEOUT = 1600;
const SEEK_FAILURE_TIMEOUT = 1500;

const PLAYER_BOTTOM_CONTROL = {
  PLAY: "play",
  RESET: "reset",
  LYRICS: "lyrics",
} as const;

type BottomPlayerControl = (typeof PLAYER_BOTTOM_CONTROL)[keyof typeof PLAYER_BOTTOM_CONTROL];

const LYRICS_STATUS = {
  LOADING: "loading",
  READY: "ready",
  UNAVAILABLE: "unavailable",
} as const;

type LyricsStatus = (typeof LYRICS_STATUS)[keyof typeof LYRICS_STATUS];

const SEEK_STATUS = {
  CONFIRMED: "confirmed",
  FAILED: "failed",
  IDLE: "idle",
  PENDING: "pending",
} as const;

type SeekStatus = (typeof SEEK_STATUS)[keyof typeof SEEK_STATUS];

export interface LyricCue {
  end: number;
  id: string;
  start: number;
  text: string;
}

interface PlayerPosition {
  x: number;
  y: number;
}

interface StoredPlayerState {
  activated: boolean;
  currentTime: number;
  hidden: boolean;
  lyricsExpanded: boolean;
  paused: boolean;
  position: PlayerPosition | null;
}

interface PlayerActivationOptions {
  attemptPlay?: boolean;
}

interface BugCesantePlayerProviderProps {
  children: ReactNode;
  presentation?: PlayerPresentation;
}

const MOVEMENT_KEYCAP = {
  DOWN: "DOWN",
  M: "M",
  UP: "UP",
} as const;

type MovementKeycapName = (typeof MOVEMENT_KEYCAP)[keyof typeof MOVEMENT_KEYCAP];

interface PlayerMovementKeycapProps {
  className?: string;
  name: MovementKeycapName;
}

export interface PlayerMovementLegendProps {
  className?: string;
}

const PLAYER_MOVE_KEYS = {
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
} as const;

type PlayerMoveKey = keyof typeof PLAYER_MOVE_KEYS;

interface BugCesantePlayerContextValue {
  activatePlayer: (options?: PlayerActivationOptions) => void;
  activeCueIndex: number;
  currentTime: number;
  duration: number;
  focusBottomPlayerControl: (control?: BottomPlayerControl) => void;
  focusMinimize: () => void;
  focusSocial: () => void;
  hidden: boolean;
  isPlaying: boolean;
  lyrics: readonly LyricCue[];
  lyricsExpanded: boolean;
  lyricsStatus: LyricsStatus;
  movementUnlocked: boolean;
  unlockPlayerMovement: () => void;
  registerSocialFocus: (element: HTMLElement | null) => void;
  registerPlayerOutlet: (element: HTMLElement | null) => void;
  seekTo: (time: number) => void;
  seekStatus: SeekStatus;
  pendingSeekTime: number | null;
  releaseTransport: () => void;
  setLyricsExpanded: (expanded: boolean) => void;
  showPlayer: () => void;
  togglePlayback: () => void;
}

const BugCesantePlayerContext = createContext<BugCesantePlayerContextValue | null>(null);

function getStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function isCoarseViewport() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(COARSE_VIEWPORT_QUERY).matches;
}

function readStoredState(presentation: PlayerPresentation) {
  const storage = getStorage();
  if (storage === null) return null;

  try {
    const rawValue = storage.getItem(PLAYER_STORAGE_KEYS[presentation]);
    if (rawValue === null) return null;
    const value: unknown = JSON.parse(rawValue);
    if (typeof value !== "object" || value === null) return null;
    const candidate = value as Partial<StoredPlayerState>;
    const position = candidate.position;
    const validPosition = position !== null && typeof position === "object" && typeof position.x === "number" && Number.isFinite(position.x) && typeof position.y === "number" && Number.isFinite(position.y)
      ? { x: position.x, y: position.y }
      : null;

    return {
      activated: candidate.activated === true,
      currentTime: typeof candidate.currentTime === "number" && Number.isFinite(candidate.currentTime) ? Math.max(0, candidate.currentTime) : 0,
      hidden: candidate.hidden === true,
      lyricsExpanded: candidate.lyricsExpanded === true,
      paused: candidate.paused !== false,
      position: validPosition,
    };
  } catch {
    return null;
  }
}

function readMovementUnlock() {
  const storage = getStorage();
  if (storage === null) return false;

  try {
    return storage.getItem(MOVEMENT_UNLOCK_STORAGE_KEY) === "unlocked";
  } catch {
    return false;
  }
}

function writeMovementUnlock() {
  const storage = getStorage();
  if (storage === null) return;

  try {
    storage.setItem(MOVEMENT_UNLOCK_STORAGE_KEY, "unlocked");
  } catch {
    // A blocked session store must not make the player unusable.
  }
}

function writeStoredState(state: StoredPlayerState, presentation: PlayerPresentation) {
  const storage = getStorage();
  if (storage === null) return;

  try {
    storage.setItem(PLAYER_STORAGE_KEYS[presentation], JSON.stringify(state));
  } catch {
    // Storage can be unavailable or quota-limited; playback must remain usable.
  }
}

function parseTimestamp(value: string) {
  const parts = value.trim().split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return null;
  if (parts.length === 3) return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  return null;
}

export function parseWebVtt(source: string): LyricCue[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const cues: LyricCue[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? "";
    if (line === "" || line.startsWith("WEBVTT") || line.startsWith("NOTE") || line.startsWith("STYLE") || line.startsWith("REGION")) {
      index += 1;
      continue;
    }

    const cueId = line;
    const timingLine = line.includes("-->") ? line : lines[index + 1]?.trim() ?? "";
    const timingIndex = line.includes("-->") ? index : index + 1;
    const match = timingLine.match(/^(\S+)\s+-->\s+(\S+)/);
    if (match === null) {
      index += 1;
      continue;
    }

    const start = parseTimestamp(match[1] ?? "");
    const end = parseTimestamp(match[2] ?? "");
    if (start === null || end === null || end <= start) {
      index = timingIndex + 1;
      continue;
    }

    const textLines: string[] = [];
    index = timingIndex + 1;
    while (index < lines.length && (lines[index]?.trim() ?? "") !== "") {
      textLines.push(lines[index] ?? "");
      index += 1;
    }
    const text = textLines.join("\n");
    if (text.length > 0) cues.push({ end, id: cueId, start, text });
  }

  return cues.sort((left, right) => left.start - right.start || left.end - right.end);
}

function findCueIndex(cues: readonly LyricCue[], time: number) {
  let low = 0;
  let high = cues.length - 1;
  let result = -1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const cue = cues[middle];
    if (cue === undefined) break;
    if (time < cue.start) high = middle - 1;
    else {
      result = middle;
      low = middle + 1;
    }
  }

  const cue = result < 0 ? undefined : cues[result];
  return cue !== undefined && time < cue.end ? result : -1;
}

function formatTime(value: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const minutes = Math.floor(safeValue / 60);
  const seconds = String(safeValue % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getBufferedEnd(audio: HTMLAudioElement) {
  return audio.buffered.length === 0 ? 0 : audio.buffered.end(audio.buffered.length - 1);
}

function isSeekTargetAvailable(audio: HTMLAudioElement, target: number) {
  if (!Number.isFinite(audio.duration) || audio.readyState < HTMLMediaElement.HAVE_METADATA) return false;

  for (let index = 0; index < audio.buffered.length; index += 1) {
    if (target >= audio.buffered.start(index) - 0.05 && target <= audio.buffered.end(index) + 0.05) return true;
  }

  for (let index = 0; index < audio.seekable.length; index += 1) {
    if (target >= audio.seekable.start(index) - 0.05 && target <= audio.seekable.end(index) + 0.05) return true;
  }

  return audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA && getBufferedEnd(audio) >= audio.duration - 0.25;
}

export function reconcileLyricCues(cues: readonly LyricCue[], duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) return [...cues];

  return cues.flatMap((cue) => {
    if (cue.start >= duration) return [];
    const end = Math.min(cue.end, duration);
    return end > cue.start ? [{ ...cue, end }] : [];
  });
}

function clampPosition(position: PlayerPosition, width: number, height: number): PlayerPosition {
  const maxX = Math.max(PLAYER_MARGIN, window.innerWidth - width - PLAYER_MARGIN);
  const maxY = Math.max(PLAYER_MARGIN, window.innerHeight - height - PLAYER_MARGIN);
  return {
    x: Math.min(maxX, Math.max(PLAYER_MARGIN, position.x)),
    y: Math.min(maxY, Math.max(PLAYER_MARGIN, position.y)),
  };
}

function getPlayerMoveDelta(key: string): PlayerPosition | null {
  if (!(key in PLAYER_MOVE_KEYS)) return null;
  const delta = PLAYER_MOVE_KEYS[key as PlayerMoveKey];
  return { x: delta.x * PLAYER_KEYBOARD_STEP, y: delta.y * PLAYER_KEYBOARD_STEP };
}

function isKeyboardMovementBlockedTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return target.closest("input, textarea, select, [contenteditable='true'], dialog[open], [role='dialog']") !== null;
}

function getActionableFocusTarget(element: Element | null): HTMLElement | null {
  if (!(element instanceof HTMLElement)) return null;
  if (!element.isConnected || element.hasAttribute("disabled") || element.closest("[inert]") !== null) return null;
  if (isKeyboardMovementBlockedTarget(element)) return null;
  if (!element.matches("a[href], button, [role='button'], [tabindex]:not([tabindex='-1'])")) return null;
  if (element.closest(".professional-void-state, .project-showcase, .bug-cesante-player") === null) return null;
  return element;
}

function PlayerIcon({ name }: { name: "pause" | "play" | "reset" | "volume" }) {
  if (name === "pause") return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 5v14M17 5v14" /></svg>;
  if (name === "play") return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m8 5 11 7-11 7z" /></svg>;
  if (name === "reset") return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 8a8 8 0 1 1 1 9M5 8V3m0 5h5" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 10v4h4l5 4V6l-5 4zM17 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" /></svg>;
}

function PlayerMovementKeycap({ className, name }: PlayerMovementKeycapProps) {
  const asset = KEYCAP_ASSET[name];
  // The keycap artwork is decorative; the adjacent offscreen sentence carries the instruction.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt="" aria-hidden="true" className={className} decoding="sync" draggable={false} height={asset.height} src={withPublicPath(asset.src)} width={asset.width} />;
}

function LyricCueButton({ active, cue, inContext, index, onSeek }: { active: boolean; cue: LyricCue; inContext: boolean; index: number; onSeek: (time: number) => void }) {
  return (
    <button
      aria-current={active ? "true" : undefined}
      aria-label={`Ir a ${formatTime(cue.start)}: ${cue.text.replace(/\n/gu, " ")}`}
      className={active ? "bug-cesante-lyric is-active" : "bug-cesante-lyric"}
      data-context={inContext ? "true" : "false"}
      data-cue-index={index}
      onClick={() => onSeek(cue.start)}
      type="button"
    >
      <span className="visually-hidden">{active ? "Línea actual: " : ""}</span>{cue.text}
    </button>
  );
}

export function PlayerMovementLegend({ className }: PlayerMovementLegendProps) {
  const legendClassName = className === undefined ? "player-movement-legend" : `player-movement-legend ${className}`;

  return (
    <aside aria-describedby="player-movement-legend-description" aria-keyshortcuts="M+ArrowUp M+ArrowDown M+ArrowLeft M+ArrowRight" aria-label="Guía para mover el reproductor" className={legendClassName}>
      <span aria-hidden="true" className="player-movement-keys">
        <PlayerMovementKeycap className="player-movement-key-m" name={MOVEMENT_KEYCAP.M} />
        <span className="player-movement-plus">+</span>
        <span className="player-movement-arrow-keys">
          <PlayerMovementKeycap className="player-movement-arrow-up" name={MOVEMENT_KEYCAP.UP} />
          <PlayerMovementKeycap className="player-movement-arrow-left" name={MOVEMENT_KEYCAP.UP} />
          <PlayerMovementKeycap className="player-movement-arrow-down" name={MOVEMENT_KEYCAP.DOWN} />
          <PlayerMovementKeycap className="player-movement-arrow-right" name={MOVEMENT_KEYCAP.UP} />
        </span>
      </span>
      <span className="player-movement-instruction">Para mover la posición del reproductor de música</span>
      <span className="visually-hidden" id="player-movement-legend-description">Mantén presionada la tecla M y usa las teclas de flecha arriba, izquierda, abajo y derecha para mover la posición del reproductor de música.</span>
    </aside>
  );
}

function BugCesanteMobileSafeZone({ isActive, isMinimized, presentation }: { isActive: boolean; isMinimized: boolean; presentation: PlayerPresentation }) {
  const safeZoneRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isActive) return;

    const safeZone = safeZoneRef.current;
    const updateSafeZone = () => {
      const player = document.querySelector<HTMLElement>(".bug-cesante-player");
      if (safeZone === null || player === null) return;

      safeZone.style.setProperty(
        "--mobile-control-safe-zone-size",
        `${Math.max(0, Math.ceil(player.getBoundingClientRect().bottom))}px`,
      );
    };

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateSafeZone);
    const observePlayer = () => {
      const player = document.querySelector<HTMLElement>(".bug-cesante-player");
      if (player === null) return;
      resizeObserver?.observe(player);
      updateSafeZone();
    };
    window.addEventListener("resize", updateSafeZone);
    observePlayer();
    const frame = window.requestAnimationFrame(observePlayer);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateSafeZone);
    };
  }, [isActive, isMinimized]);

  if (!isActive) return null;

  return <div aria-hidden="true" className="mobile-control-safe-zone" data-presentation={presentation} ref={safeZoneRef} />;
}

export function BugCesantePlayerProvider({ children, presentation = PLAYER_PRESENTATION.PRIMARY }: BugCesantePlayerProviderProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLElement>(null);
  const minimizeRef = useRef<HTMLButtonElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);
  const lyricsToggleRef = useRef<HTMLButtonElement>(null);
  const socialFocusRef = useRef<HTMLElement | null>(null);
  const pendingBottomFocusRef = useRef<BottomPlayerControl | null>(null);
  const lastBottomControlRef = useRef<BottomPlayerControl>(PLAYER_BOTTOM_CONTROL.PLAY);
  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const lyricsCloseRef = useRef<HTMLButtonElement>(null);
  const lyricsReturnFocusRef = useRef<HTMLElement | null>(null);
  const lyricsReturnFocusPendingRef = useRef(false);
  const restoredTimeRef = useRef(0);
  const restoredStateRef = useRef<StoredPlayerState | null>(null);
  const lastPersistedAtRef = useRef(0);
  const manualScrollTimeoutRef = useRef<number | null>(null);
  const autoScrollingRef = useRef(false);
  const dragRef = useRef<{ offsetX: number; offsetY: number; pointerId: number } | null>(null);
  const confirmedTimeRef = useRef(0);
  const seekFailureTimeoutRef = useRef<number | null>(null);
  const [storedState, setStoredState] = useState<StoredPlayerState | null>(null);
  const [isCoarseLayout, setIsCoarseLayout] = useState(false);
  const isCoarseLayoutRef = useRef(isCoarseLayout);
  const [activated, setActivated] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<LyricCue[]>([]);
  const [lyricsExpanded, setLyricsExpandedState] = useState(false);
  const [lyricsStatus, setLyricsStatus] = useState<LyricsStatus>(LYRICS_STATUS.LOADING);
  const [activeCueIndex, setActiveCueIndex] = useState(-1);
  const [position, setPosition] = useState<PlayerPosition | null>(null);
  const [movementUnlocked, setMovementUnlocked] = useState(false);
  const [pendingSeekTime, setPendingSeekTime] = useState<number | null>(null);
  const [seekStatus, setSeekStatus] = useState<SeekStatus>(SEEK_STATUS.IDLE);
  const [seekFailureMessage, setSeekFailureMessage] = useState<string | null>(null);
  const [playerOutletElement, setPlayerOutletElement] = useState<HTMLElement | null>(null);
  const movementUnlockedRef = useRef(movementUnlocked);
  const keyboardMovementModeRef = useRef(false);
  const keyboardMovementReturnFocusRef = useRef<HTMLElement | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const seekAttemptedTargetRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    isCoarseLayoutRef.current = isCoarseLayout;
    movementUnlockedRef.current = movementUnlocked;
  }, [isCoarseLayout, movementUnlocked]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(COARSE_VIEWPORT_QUERY);
    const updateLayout = () => setIsCoarseLayout(mediaQuery.matches);
    updateLayout();
    mediaQuery.addEventListener("change", updateLayout);
    return () => mediaQuery.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    const restoredState = readStoredState(presentation);
    const movementWasUnlocked = readMovementUnlock();
    let cancelled = false;
    restoredStateRef.current = restoredState;

    queueMicrotask(() => {
      if (cancelled) return;
      setMovementUnlocked(movementWasUnlocked);
      if (restoredState === null) return;

      setStoredState(restoredState);
      setActivated(restoredState.activated);
      setHidden(restoredState.hidden);
      confirmedTimeRef.current = restoredState.currentTime;
      setCurrentTime(restoredState.currentTime);
      setLyricsExpandedState(restoredState.lyricsExpanded);
      setPosition(isCoarseViewport() ? null : restoredState.position);
    });

    return () => {
      cancelled = true;
    };
  }, [presentation]);

  const updateTimeEvent = useEffectEvent(updateTime);
  const persistEvent = useEffectEvent(persist);
  const attemptPendingSeekEvent = useEffectEvent(attemptPendingSeek);
  const confirmSeekIfSettledEvent = useEffectEvent(confirmSeekIfSettled);
  const restoreActualMediaTimeEvent = useEffectEvent(restoreActualMediaTime);
  const pauseAndPersistTransportEvent = useEffectEvent(pauseAndPersistTransport);

  useEffect(() => {
    const audio = acquireAudioTransportOwner(presentation, resolveBugCesanteAudioSource());
    audioRef.current = audio;
    const syncTime = () => {
      attemptPendingSeekEvent();
      if (pendingSeekRef.current !== null) return;
      updateTimeEvent(audio.currentTime);
    };
    const syncDuration = () => {
      const nextDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(nextDuration);
      setLyrics((currentLyrics) => reconcileLyricCues(currentLyrics, nextDuration));
      attemptPendingSeekEvent();
    };
    const syncPlayback = () => setIsPlaying(!audio.paused && !audio.ended);
    const handlePause = () => {
      syncPlayback();
      persistEvent({
        currentTime: pendingSeekRef.current === null
          ? Number.isFinite(audio.currentTime) ? audio.currentTime : 0
          : confirmedTimeRef.current,
        paused: true,
      });
    };
    const handlePlay = () => {
      syncPlayback();
      persistEvent({ paused: false });
    };
    const handleEnded = () => {
      clearSeekFailureTimeout();
      setIsPlaying(false);
      pendingSeekRef.current = null;
      seekAttemptedTargetRef.current = null;
      setPendingSeekTime(null);
      setSeekStatus(SEEK_STATUS.IDLE);
      setSeekFailureMessage(null);
      updateTimeEvent(0);
      persistEvent({ currentTime: 0, paused: true });
    };
    const handleError = () => {
      setIsPlaying(false);
      restoreActualMediaTimeEvent(audio, pendingSeekRef.current !== null);
    };

    audio.addEventListener("canplaythrough", attemptPendingSeekEvent);
    audio.addEventListener("durationchange", syncDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadedmetadata", syncDuration);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("playing", syncPlayback);
    audio.addEventListener("progress", attemptPendingSeekEvent);
    audio.addEventListener("seeked", confirmSeekIfSettledEvent);
    audio.addEventListener("timeupdate", syncTime);
    syncDuration();
    syncPlayback();

    return () => {
      audio.removeEventListener("canplaythrough", attemptPendingSeekEvent);
      audio.removeEventListener("durationchange", syncDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadedmetadata", syncDuration);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("playing", syncPlayback);
      audio.removeEventListener("progress", attemptPendingSeekEvent);
      audio.removeEventListener("seeked", confirmSeekIfSettledEvent);
      audio.removeEventListener("timeupdate", syncTime);
      clearSeekFailureTimeout();
      if (ownsAudioTransport(presentation)) pauseAndPersistTransportEvent();
      releaseAudioTransportOwner(presentation);
      audioRef.current = null;
    };
  }, [presentation]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") pauseAndPersistTransportEvent();
    };
    const handlePageHide = () => pauseAndPersistTransportEvent();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  function persist(next?: Partial<StoredPlayerState>) {
    const audio = audioRef.current;
    const nextState = {
      ...(restoredStateRef.current ?? {
        activated,
        currentTime,
        hidden,
        lyricsExpanded,
        paused: audio?.paused ?? !isPlaying,
        position,
      }),
      ...next,
    } satisfies StoredPlayerState;
    restoredStateRef.current = nextState;
    writeStoredState(nextState, presentation);
  }

  function updateTime(nextTime: number) {
    const safeTime = Number.isFinite(nextTime) ? Math.max(0, nextTime) : 0;
    confirmedTimeRef.current = safeTime;
    setCurrentTime(safeTime);
    setActiveCueIndex((currentIndex) => {
      const nextIndex = findCueIndex(lyrics, safeTime);
      return currentIndex === nextIndex ? currentIndex : nextIndex;
    });
  }

  function getSafeSeekTime(nextTime: number, audio: HTMLAudioElement) {
    return Math.min(Math.max(0, nextTime), Number.isFinite(audio.duration) ? audio.duration : Math.max(0, nextTime));
  }

  function clearSeekFailureTimeout() {
    if (seekFailureTimeoutRef.current === null) return;
    window.clearTimeout(seekFailureTimeoutRef.current);
    seekFailureTimeoutRef.current = null;
  }

  function restoreActualMediaTime(audio: HTMLAudioElement, failed = false, useConfirmedTime = false) {
    const actualTime = useConfirmedTime
      ? confirmedTimeRef.current
      : Number.isFinite(audio.currentTime) ? Math.max(0, audio.currentTime) : confirmedTimeRef.current;
    clearSeekFailureTimeout();
    pendingSeekRef.current = null;
    seekAttemptedTargetRef.current = null;
    setPendingSeekTime(null);
    setSeekStatus(failed ? SEEK_STATUS.FAILED : SEEK_STATUS.IDLE);
    setSeekFailureMessage(failed ? "No se pudo buscar esa posición; se mantuvo el tiempo confirmado." : null);
    if (useConfirmedTime) {
      try {
        audio.currentTime = actualTime;
      } catch {
        // Restoring the confirmed value is best effort when media metadata is unavailable.
      }
    }
    updateTime(actualTime);
    persist({ currentTime: actualTime, paused: audio.paused });
  }

  function attemptPendingSeek() {
    const audio = audioRef.current;
    const target = pendingSeekRef.current;
    if (audio === null || target === null || !isSeekTargetAvailable(audio, target)) return;
    if (seekAttemptedTargetRef.current === target) return;

    seekAttemptedTargetRef.current = target;
    try {
      audio.currentTime = target;
      clearSeekFailureTimeout();
      seekFailureTimeoutRef.current = window.setTimeout(() => {
        if (pendingSeekRef.current === target) restoreActualMediaTime(audio, true, true);
      }, SEEK_FAILURE_TIMEOUT);
    } catch {
      restoreActualMediaTime(audio, true);
    }
  }

  function confirmSeekIfSettled() {
    const audio = audioRef.current;
    const target = pendingSeekRef.current;
    const actualTime = audio?.currentTime;
    if (audio === null || target === null) return;
    if (typeof actualTime !== "number" || !Number.isFinite(actualTime) || Math.abs(actualTime - target) > 0.25) {
      restoreActualMediaTime(audio, true);
      return;
    }

    const confirmedTime = Math.max(0, actualTime);
    clearSeekFailureTimeout();
    pendingSeekRef.current = null;
    seekAttemptedTargetRef.current = null;
    setPendingSeekTime(null);
    setSeekStatus(SEEK_STATUS.CONFIRMED);
    setSeekFailureMessage(null);
    updateTime(confirmedTime);
    persist({ currentTime: confirmedTime, paused: audio.paused });
  }

  function seekTo(nextTime: number) {
    const audio = audioRef.current;
    if (audio === null) return;
    const safeTime = getSafeSeekTime(nextTime, audio);
    clearSeekFailureTimeout();
    setSeekFailureMessage(null);
    pendingSeekRef.current = safeTime;
    seekAttemptedTargetRef.current = null;
    setPendingSeekTime(safeTime);
    setSeekStatus(SEEK_STATUS.PENDING);
    if (audio.readyState < HTMLMediaElement.HAVE_METADATA) {
      audio.preload = "auto";
      audio.load();
    }
    attemptPendingSeek();
  }

  function attemptPlay() {
    const audio = audioRef.current;
    if (audio === null) return;
    void audio.play().catch(() => {
      setIsPlaying(false);
      // A rejected play attempt is expected on browsers with media policy.
    });
  }

  function activatePlayer(options: PlayerActivationOptions = {}) {
    if (restoredStateRef.current === null) {
      restoredStateRef.current = readStoredState(presentation);
    }
    setActivated(true);
    setHidden(false);
    persist({ activated: true, hidden: false });
    if (options.attemptPlay === true) attemptPlay();
  }

  function pauseAndPersistTransport() {
    if (!ownsAudioTransport(presentation)) return;
    const audio = audioRef.current;
    if (audio === null) return;

    const confirmedTime = pendingSeekRef.current === null && Number.isFinite(audio.currentTime)
      ? Math.max(0, audio.currentTime)
      : confirmedTimeRef.current;
    audio.pause();
    setIsPlaying(false);
    if (pendingSeekRef.current !== null) {
      clearSeekFailureTimeout();
      pendingSeekRef.current = null;
      seekAttemptedTargetRef.current = null;
      setPendingSeekTime(null);
      setSeekStatus(SEEK_STATUS.IDLE);
      setSeekFailureMessage(null);
      try {
        audio.currentTime = confirmedTime;
      } catch {
        // A background transition must not block pausing when media cannot seek yet.
      }
    }
    updateTime(confirmedTime);
    persist({ currentTime: confirmedTime, paused: true });
  }

  function releaseTransport() {
    if (!ownsAudioTransport(presentation)) return;
    pauseAndPersistTransport();
    clearSeekFailureTimeout();
    pendingSeekRef.current = null;
    seekAttemptedTargetRef.current = null;
    setPendingSeekTime(null);
    setSeekStatus(SEEK_STATUS.IDLE);
    releaseAudioTransportOwner(presentation);
  }

  function unlockPlayerMovement() {
    setMovementUnlocked((currentValue) => {
      if (currentValue) return true;
      writeMovementUnlock();
      return true;
    });
  }

  function showPlayer() {
    setHidden(false);
    persist({ hidden: false });
  }

  function togglePlayback() {
    const audio = audioRef.current;
    if (audio === null) return;
    if (audio.paused || audio.ended) {
      if (audio.ended) seekTo(0);
      attemptPlay();
    } else audio.pause();
  }

  function setLyricsExpanded(expanded: boolean) {
    if (expanded && isCoarseViewport()) setIsCoarseLayout(true);

    if (expanded) {
      lyricsReturnFocusPendingRef.current = false;
      lyricsReturnFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    } else {
      lyricsReturnFocusPendingRef.current = true;
    }

    setLyricsExpandedState(expanded);
    persist({ lyricsExpanded: expanded });
  }

  const setLyricsExpandedEvent = useEffectEvent(setLyricsExpanded);

  function getBottomControlRef(control: BottomPlayerControl) {
    if (control === PLAYER_BOTTOM_CONTROL.PLAY) return playRef;
    if (control === PLAYER_BOTTOM_CONTROL.RESET) return resetRef;
    return lyricsToggleRef;
  }

  function focusBottomPlayerControl(control = lastBottomControlRef.current) {
    lastBottomControlRef.current = control;
    if (hidden) {
      pendingBottomFocusRef.current = control;
      setHidden(false);
      persist({ hidden: false });
      return;
    }
    if (!activated && presentation !== PLAYER_PRESENTATION.ALTERNATE) {
      pendingBottomFocusRef.current = control;
      setActivated(true);
      persist({ activated: true, hidden: false });
      return;
    }

    getBottomControlRef(control).current?.focus({ preventScroll: true });
  }

  function focusMinimize() {
    minimizeRef.current?.focus({ preventScroll: true });
  }

  function focusSocial() {
    socialFocusRef.current?.focus({ preventScroll: true });
  }

  function registerSocialFocus(element: HTMLElement | null) {
    socialFocusRef.current = element;
  }

  useLayoutEffect(() => {
    const control = pendingBottomFocusRef.current;
    if (control === null || (!activated && presentation !== PLAYER_PRESENTATION.ALTERNATE) || hidden) return;
    pendingBottomFocusRef.current = null;
    getBottomControlRef(control).current?.focus({ preventScroll: true });
  }, [activated, hidden, presentation]);

  useLayoutEffect(() => {
    if (lyricsExpanded || !lyricsReturnFocusPendingRef.current) return;

    lyricsReturnFocusPendingRef.current = false;
    const returnFocus = lyricsReturnFocusRef.current;
    lyricsReturnFocusRef.current = null;
    const target = returnFocus?.isConnected === true
      ? returnFocus
      : presentation === PLAYER_PRESENTATION.ALTERNATE
        ? lyricsToggleRef.current ?? playRef.current
        : playRef.current;
    target?.focus({ preventScroll: true });
  }, [lyricsExpanded, presentation]);

  useEffect(() => {
    if (!lyricsExpanded) {
      return;
    }

     if (!isCoarseLayout && !isCoarseViewport()) return;

    const focusFrame = window.requestAnimationFrame(() => lyricsCloseRef.current?.focus({ preventScroll: true }));
    const handleLyricsKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setLyricsExpandedEvent(false);
        return;
      }

      if (event.key !== "Tab") return;
      const surface = lyricsCloseRef.current?.closest<HTMLElement>("[role='dialog']");
      if (surface === null || surface === undefined) return;
      const focusableElements = [...surface.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")].filter((element) => !element.hasAttribute("disabled"));
      const first = focusableElements[0];
      const last = focusableElements.at(-1);
      if (first === undefined || last === undefined) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    window.addEventListener("keydown", handleLyricsKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleLyricsKeyDown);
    };
  }, [isCoarseLayout, lyricsExpanded]);

  useEffect(() => {
    let cancelled = false;
      void fetch(withPublicPath(LYRICS_SRC))
      .then((response) => {
        if (!response.ok) throw new Error(`Lyrics request failed: ${response.status}`);
        return response.text();
      })
      .then((source) => {
        if (cancelled) return;
        const cues = parseWebVtt(source);
        if (cues.length === 0) throw new Error("Lyrics file has no cues");
        setLyrics(reconcileLyricCues(cues, audioRef.current?.duration ?? 0));
        setLyricsStatus(LYRICS_STATUS.READY);
      })
      .catch(() => {
        if (!cancelled) setLyricsStatus(LYRICS_STATUS.UNAVAILABLE);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    restoredTimeRef.current = storedState?.currentTime ?? 0;
    const audio = audioRef.current;
    if (audio === null) return;

    const syncMetadata = () => {
      const nextDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(nextDuration);
      setLyrics((currentLyrics) => reconcileLyricCues(currentLyrics, nextDuration));
      if (restoredTimeRef.current > 0 && audio.currentTime <= 0.05) {
        audio.currentTime = Math.min(restoredTimeRef.current, Number.isFinite(audio.duration) ? audio.duration : restoredTimeRef.current);
        updateTimeEvent(audio.currentTime);
      }
      restoredTimeRef.current = 0;
      attemptPendingSeekEvent();
    };
    audio.addEventListener("loadedmetadata", syncMetadata);
    if (audio.readyState >= 1) syncMetadata();
    return () => audio.removeEventListener("loadedmetadata", syncMetadata);
  }, [storedState]);

  useEffect(() => {
    let frame = 0;
    const tick = (timestamp: number) => {
      const audio = audioRef.current;
      if (audio !== null && !audio.paused && pendingSeekRef.current === null) {
        updateTimeEvent(audio.currentTime);
        if (timestamp - lastPersistedAtRef.current > 500) {
          lastPersistedAtRef.current = timestamp;
          persistEvent({ currentTime: audio.currentTime, paused: false });
        }
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    function clampPlayer() {
      const player = playerRef.current;
      if (player === null || position === null || isCoarseLayout) return;
      const nextPosition = clampPosition(position, player.offsetWidth, player.offsetHeight);
      if (nextPosition.x !== position.x || nextPosition.y !== position.y) {
        setPosition(nextPosition);
        persistEvent({ position: nextPosition });
      }
    }
    window.addEventListener("resize", clampPlayer);
    return () => window.removeEventListener("resize", clampPlayer);
  }, [isCoarseLayout, lyricsExpanded, position]);

  function movePlayerByKeyboard(delta: PlayerPosition) {
    if (isCoarseLayout || !movementUnlockedRef.current) return;
    const player = playerRef.current;
    if (player === null) return;
    const rect = player.getBoundingClientRect();
    const currentPosition = position ?? { x: rect.left, y: rect.top };
    const nextPosition = clampPosition({ x: currentPosition.x + delta.x, y: currentPosition.y + delta.y }, rect.width, rect.height);
    setPosition(nextPosition);
    persist({ position: nextPosition });
  }

  const movePlayerByKeyboardEvent = useEffectEvent(movePlayerByKeyboard);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.code === "KeyM") {
        if (isCoarseLayoutRef.current || !movementUnlockedRef.current || event.repeat || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || isKeyboardMovementBlockedTarget(event.target)) return;
        if (!keyboardMovementModeRef.current) {
          keyboardMovementModeRef.current = true;
          keyboardMovementReturnFocusRef.current = getActionableFocusTarget(document.activeElement);
        }
        return;
      }

      if (isCoarseLayoutRef.current || !movementUnlockedRef.current || !keyboardMovementModeRef.current || !Object.hasOwn(PLAYER_MOVE_KEYS, event.key)) return;
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || isKeyboardMovementBlockedTarget(event.target) || document.querySelector("dialog[open], [role='dialog']") !== null) return;
      const delta = getPlayerMoveDelta(event.key);
      if (delta === null) return;
      event.preventDefault();
      event.stopPropagation();
      movePlayerByKeyboardEvent(delta);
    };

    const onKeyUp = (event: globalThis.KeyboardEvent) => {
      if (event.code !== "KeyM" || !keyboardMovementModeRef.current) return;
      const returnFocus = keyboardMovementReturnFocusRef.current;
      keyboardMovementModeRef.current = false;
      keyboardMovementReturnFocusRef.current = null;
      if (returnFocus === null || isKeyboardMovementBlockedTarget(event.target) || document.querySelector("dialog[open], [role='dialog']") !== null) return;
      returnFocus.focus({ preventScroll: true });
    };

    const clearMode = () => {
      keyboardMovementModeRef.current = false;
      keyboardMovementReturnFocusRef.current = null;
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", clearMode);
    document.addEventListener("visibilitychange", clearMode);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", clearMode);
      document.removeEventListener("visibilitychange", clearMode);
      clearMode();
    };
  }, []);

  useEffect(() => {
    const lyricsContainer = lyricsScrollRef.current;
    if (lyricsContainer === null || activeCueIndex < 0 || !lyricsExpanded || manualScrollTimeoutRef.current !== null) return;
    const activeLine = lyricsContainer.querySelector<HTMLElement>(`[data-cue-index="${activeCueIndex}"]`);
    if (activeLine === null || typeof activeLine.scrollIntoView !== "function") return;
    autoScrollingRef.current = true;
    activeLine.scrollIntoView({ block: "nearest" });
    window.setTimeout(() => {
      autoScrollingRef.current = false;
    }, 0);
  }, [activeCueIndex, lyricsExpanded]);

  function markManualLyricsScroll() {
    if (autoScrollingRef.current) return;
    if (manualScrollTimeoutRef.current !== null) window.clearTimeout(manualScrollTimeoutRef.current);
    manualScrollTimeoutRef.current = window.setTimeout(() => {
      manualScrollTimeoutRef.current = null;
    }, MANUAL_SCROLL_TIMEOUT);
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (isCoarseLayout || event.button !== 0) return;
    const player = playerRef.current;
    if (player === null) return;
    const rect = player.getBoundingClientRect();
    const nextPosition = clampPosition({ x: rect.left, y: rect.top }, rect.width, rect.height);
    setPosition(nextPosition);
    dragRef.current = { offsetX: event.clientX - nextPosition.x, offsetY: event.clientY - nextPosition.y, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    const player = playerRef.current;
    if (drag === null || drag.pointerId !== event.pointerId || player === null) return;
    const nextPosition = clampPosition({ x: event.clientX - drag.offsetX, y: event.clientY - drag.offsetY }, player.offsetWidth, player.offsetHeight);
    setPosition(nextPosition);
  }

  function finishDrag(event: PointerEvent<HTMLElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    const player = playerRef.current;
    if (player === null || isCoarseLayout) return;
    const rect = player.getBoundingClientRect();
    const nextPosition = clampPosition({ x: rect.left, y: rect.top }, rect.width, rect.height);
    setPosition(nextPosition);
    persist({ position: nextPosition });
  }

  function handleHandleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (isCoarseLayout || !movementUnlockedRef.current) return;
    const direction = getPlayerMoveDelta(event.key);
    if (event.key === "Escape") {
      event.preventDefault();
      setPosition(null);
      persist({ position: null });
      return;
    }
    if (direction === null) return;
    event.preventDefault();
    movePlayerByKeyboard(direction);
  }

  function handlePlayerNavigationKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    const target = event.target;
    if (!(target instanceof HTMLElement) || target.matches("input[type='range'], .bug-cesante-player-drag-handle")) return;

    const bottomControls: readonly BottomPlayerControl[] = [PLAYER_BOTTOM_CONTROL.PLAY, PLAYER_BOTTOM_CONTROL.RESET, PLAYER_BOTTOM_CONTROL.LYRICS];
    const currentControl = target === playRef.current
      ? PLAYER_BOTTOM_CONTROL.PLAY
      : target === resetRef.current
        ? PLAYER_BOTTOM_CONTROL.RESET
        : target === lyricsToggleRef.current
          ? PLAYER_BOTTOM_CONTROL.LYRICS
          : null;

    if (target === minimizeRef.current) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "ArrowUp") focusSocial();
      else if (event.key === "ArrowDown") focusBottomPlayerControl();
      return;
    }

    if (currentControl === null) return;

    event.preventDefault();
    event.stopPropagation();

    if (event.key === "ArrowUp") {
      focusMinimize();
      return;
    }
    if (event.key === "ArrowDown") {
      focusSocial();
      return;
    }

    const currentIndex = bottomControls.indexOf(currentControl);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextControl = bottomControls[(currentIndex + direction + bottomControls.length) % bottomControls.length];
    if (nextControl !== undefined) focusBottomPlayerControl(nextControl);
  }

  const contextValue: BugCesantePlayerContextValue = {
    activatePlayer,
    activeCueIndex,
    currentTime,
    duration,
    focusBottomPlayerControl,
    focusMinimize,
    focusSocial,
    hidden,
    isPlaying,
    lyrics,
    lyricsExpanded,
    lyricsStatus,
    movementUnlocked,
    pendingSeekTime,
    releaseTransport,
    registerPlayerOutlet: setPlayerOutletElement,
    unlockPlayerMovement,
    registerSocialFocus,
    seekTo,
    seekStatus,
    setLyricsExpanded,
    showPlayer,
    togglePlayback,
  };
  const renderedPosition = isCoarseLayout || presentation === PLAYER_PRESENTATION.ALTERNATE ? null : position;
  const playerVisible = presentation === PLAYER_PRESENTATION.ALTERNATE || activated;
  const showLyricsSurface = playerVisible && lyricsExpanded && (isCoarseLayout || isCoarseViewport());
  const hideAlternateMobileLyricsToggle = presentation === PLAYER_PRESENTATION.ALTERNATE
    && lyricsExpanded
    && (isCoarseLayout || isCoarseViewport());
  const renderLyricCues = () => lyrics.map((cue, index) => (
    <LyricCueButton active={index === activeCueIndex} cue={cue} inContext={Math.abs(index - activeCueIndex) <= 1} index={index} key={`${cue.id}-${cue.start}`} onSeek={seekTo} />
  ));
  const sliderValue = pendingSeekTime ?? currentTime;

  const player = playerVisible ? (
    <aside
      aria-label="Reproductor persistente de Bug Cesante"
      className="bug-cesante-player"
      data-presentation={presentation === PLAYER_PRESENTATION.ALTERNATE ? presentation : undefined}
      data-minimized={hidden}
      data-positioned={renderedPosition === null ? undefined : "true"}
      onKeyDown={handlePlayerNavigationKeyDown}
      ref={(element) => {
        playerRef.current = element;
        element?.setAttribute("data-player-ready", "true");
      }}
      style={renderedPosition === null ? undefined : { inset: `${renderedPosition.y}px auto auto ${renderedPosition.x}px` }}
    >
      <header className="bug-cesante-player-handle">
        {presentation === PLAYER_PRESENTATION.ALTERNATE ? null : isCoarseLayout ? <div className="bug-cesante-player-drag-handle"><span className="bug-cesante-player-title">BUG CESANTE</span></div> : (
          <div
            aria-label="Mover reproductor. Usa las flechas para moverlo o Escape para restablecerlo."
            aria-roledescription="control de arrastre"
            className="bug-cesante-player-drag-handle"
            onKeyDown={handleHandleKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            role="button"
            tabIndex={0}
          >
            <span className="bug-cesante-player-title">BUG CESANTE <span>· canción laboral</span></span>
          </div>
        )}
        {presentation === PLAYER_PRESENTATION.PRIMARY ? <button aria-expanded={!hidden} aria-label={hidden ? "Restaurar reproductor" : "Minimizar reproductor"} className="bug-cesante-player-minimize" onClick={() => { const nextHidden = !hidden; setHidden(nextHidden); persist({ hidden: nextHidden }); }} ref={minimizeRef} type="button"><span aria-hidden="true">{hidden ? "+" : "−"}</span></button> : null}
      </header>
      {!hidden ? <div className="bug-cesante-player-controls">
        <button aria-label={isPlaying ? "Pausar canción" : "Reproducir canción"} className="bug-cesante-player-icon-button" onClick={togglePlayback} onFocus={() => { lastBottomControlRef.current = PLAYER_BOTTOM_CONTROL.PLAY; }} ref={playRef} type="button"><PlayerIcon name={isPlaying ? "pause" : "play"} /></button>
        <button aria-label="Reiniciar canción" className="bug-cesante-player-icon-button" onClick={() => seekTo(0)} onFocus={() => { lastBottomControlRef.current = PLAYER_BOTTOM_CONTROL.RESET; }} ref={resetRef} type="button"><PlayerIcon name="reset" /></button>
        <label className="bug-cesante-player-seek-label">
          <span className="visually-hidden">Posición de la canción</span>
          <input aria-label="Posición de la canción" aria-valuetext={pendingSeekTime === null ? formatTime(currentTime) : `Solicitando ${formatTime(pendingSeekTime)}. Tiempo actual ${formatTime(currentTime)}.`} className="bug-cesante-player-seek" data-seek-status={seekStatus} max={duration || 0} min="0" onChange={(event) => seekTo(Number(event.target.value))} step="0.01" type="range" value={Math.min(sliderValue, duration > 0 ? duration : sliderValue)} />
        </label>
        <span aria-live="off" className="bug-cesante-player-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
        {pendingSeekTime === null ? null : <span aria-live="polite" className="visually-hidden">Buscando {formatTime(pendingSeekTime)}. El tiempo confirmado sigue en {formatTime(currentTime)}.</span>}
        {seekFailureMessage === null ? null : <span aria-label={seekFailureMessage} aria-live="polite" className="visually-hidden" role="status">{seekFailureMessage}</span>}
        {hideAlternateMobileLyricsToggle ? null : <button aria-controls="bug-cesante-lyrics-surface" aria-expanded={lyricsExpanded} aria-label={lyricsExpanded ? "Ocultar letra" : "Mostrar letra"} className="bug-cesante-player-lyrics-toggle" onClick={() => setLyricsExpanded(!lyricsExpanded)} onFocus={() => { lastBottomControlRef.current = PLAYER_BOTTOM_CONTROL.LYRICS; }} ref={lyricsToggleRef} type="button">{lyricsExpanded ? "Ocultar letra" : "Letra"}</button>}
      </div> : null}
      {!hidden && lyricsExpanded && !isCoarseLayout && !isCoarseViewport() ? <div className="bug-cesante-player-lyrics" id="bug-cesante-lyrics-surface" onScroll={markManualLyricsScroll} ref={lyricsScrollRef}>
        {lyricsStatus === LYRICS_STATUS.LOADING ? <p role="status">Cargando letra…</p> : null}
        {lyricsStatus === LYRICS_STATUS.UNAVAILABLE ? <p role="status">La letra no está disponible, pero la reproducción sigue activa.</p> : null}
        {lyricsStatus === LYRICS_STATUS.READY ? renderLyricCues() : null}
      </div> : null}
    </aside>
  ) : null;

  return (
    <BugCesantePlayerContext.Provider value={contextValue}>
      <div className="bug-cesante-player-scope" inert={lyricsExpanded && (isCoarseLayout || isCoarseViewport()) ? true : undefined}>{children}</div>
      <BugCesanteMobileSafeZone isActive={playerVisible} isMinimized={hidden} presentation={presentation} />
      {playerOutletElement === null ? player : createPortal(player, playerOutletElement)}
       {showLyricsSurface ? <section aria-label="Letra de Bug Cesante" aria-modal="true" className="bug-cesante-lyrics-surface" data-presentation={presentation} id="bug-cesante-lyrics-surface" role="dialog">
         <header className="bug-cesante-lyrics-header">
           <div>
             <p className="bug-cesante-lyrics-kicker">BUG CESANTE</p>
            <h2>Letra</h2>
          </div>
          <button aria-label="Ocultar letra" className="bug-cesante-lyrics-close" onClick={() => setLyricsExpanded(false)} ref={lyricsCloseRef} type="button">Ocultar letra</button>
        </header>
        <div className="bug-cesante-player-lyrics" onScroll={markManualLyricsScroll} ref={lyricsScrollRef}>
          {lyricsStatus === LYRICS_STATUS.LOADING ? <p role="status">Cargando letra…</p> : null}
          {lyricsStatus === LYRICS_STATUS.UNAVAILABLE ? <p role="status">La letra no está disponible, pero la reproducción sigue activa.</p> : null}
           {lyricsStatus === LYRICS_STATUS.READY ? renderLyricCues() : null}
        </div>
      </section> : null}
    </BugCesantePlayerContext.Provider>
  );
}

export function BugCesantePlayerOutlet() {
  const { registerPlayerOutlet } = useBugCesantePlayer();

  return <div className="portfolio-alternate-player-outlet" ref={registerPlayerOutlet} />;
}

export function useBugCesantePlayer() {
  const context = useContext(BugCesantePlayerContext);
  if (context === null) throw new Error("useBugCesantePlayer must be used inside BugCesantePlayerProvider");
  return context;
}
