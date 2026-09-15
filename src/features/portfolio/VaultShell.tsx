"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useEffectEvent, useLayoutEffect, useReducer, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { MotionPreferenceProvider, useMotionPreferences } from "@/shared/a11y/motion-preferences";
import { Button } from "@/shared/ui/Button";
import { VisuallyHidden } from "@/shared/ui/VisuallyHidden";
import { moveFocusToActiveVaultTarget } from "@/shared/a11y/focus";
import { reportBrowserObservation } from "@/app/Observability";
import { withPublicPath } from "@/shared/routing/public-path";
import { MainHall } from "./MainHall";
import { VaultCinematicTransition } from "./VaultCinematicTransition";
import { createIntroFrameCoordinator, type IntroFrameRequest } from "./intro-frame-coordinator";
import { PROJECT_UNLOCK_CHALLENGES } from "./hidden-project-unlock";
import { VAULT_SEALS } from "./vault-seals";
import { VAULT_INPUT } from "./vault-types";
import { getDisplayedOpeningProgress, getOpeningCompletionCrossfade, type OpeningProgressViewport } from "./intro-progress";
import {
  VAULT_ACTION,
  createInitialVaultState,
  getNextVaultIndex,
  normalizeActivationInput,
  normalizeKeyboardInput,
  normalizeWheelInput,
  vaultReducer,
} from "./vault-reducer";
import {
  completeMainHall,
  createInitialSessionProgression,
  issueAlternateHandoff,
  markIntroCompleted,
  readSessionProgression,
  resetSessionProgressionForDocumentReload,
  unlockSeal,
  writeSessionProgression,
  type SessionProgression,
} from "./session-progression";

function getVaultStep(activeIndex: number) {
  const step = VAULT_SEALS[activeIndex] ?? VAULT_SEALS[0];

  if (step === undefined) {
    throw new Error("Vault shell requires at least one step.");
  }

  return step;
}

const INTRO_PHASE = {
  CLOSED: "closed",
  OPENING: "opening",
  COMPLETE: "complete",
} as const;

type IntroPhase = (typeof INTRO_PHASE)[keyof typeof INTRO_PHASE];

const DESKTOP_INTRO_FRAME_COUNT = 96;
const MOBILE_INTRO_FRAME_COUNT = 60;
const INTRO_VISIBLE_START_PROGRESS = 0.1;
const SCRUB_MAX_VELOCITY = 0.52;
const SCRUB_MIN_VELOCITY = 0.004;
const SCRUB_FRICTION_PER_FRAME = 0.9;
const SCRUB_KEYBOARD_VELOCITY = 0.26;
const SCRUB_WHEEL_SENSITIVITY = 1 / 1800;
const SCRUB_MAX_WHEEL_PROGRESS_DELTA = 0.08;
const WHEEL_LINE_HEIGHT_PX = 16;
const MOBILE_VIEWPORT_QUERY = "(max-width: 48rem)";
const INTRO_FRAME_CACHE_SIZE = 16;
const INTRO_FRAME_AHEAD_WINDOW = 6;
const INTRO_FRAME_BEHIND_WINDOW = 2;
const INTRO_FRAME_WARM_CONCURRENCY = 3;
const INTRO_FRAME_LOAD_TIMEOUT_MS = 4_000;
const INTRO_FRAME_RETRY_LIMIT = 1;
const INTRO_FRAME_RETRY_DELAY_MS = 120;
// A sub-perceptual visual handoff buffer: enough to finish an in-flight decode,
// never long enough to make a completed curtain feel stalled.
const SEAL_HANDOFF_GRACE_MS = 400;
const WHEEL_DELTA_MODE = {
  PIXEL: 0,
  LINE: 1,
  PAGE: 2,
} as const;
const KEYBOARD_ACTIVATION_KEY = {
  ENTER: "Enter",
  SPACE: " ",
  SPACEBAR: "Spacebar",
} as const;

const SEAL_ASSETS = ["/assets/overlays/vault/sello1.webp", "/assets/overlays/vault/sello2.webp", "/assets/overlays/vault/sello3.webp"] as const;
const SEAL_ASSET_STATUS = {
  PENDING: "pending",
  READY: "ready",
  FAILED: "failed",
} as const;
type SealAssetStatus = (typeof SEAL_ASSET_STATUS)[keyof typeof SEAL_ASSET_STATUS];
const VAULT_BACKGROUND_INTRINSIC_SIZE = {
  WIDTH: 1672,
  HEIGHT: 941,
} as const;
const VAULT_BACKGROUND_SIZES = "(max-aspect-ratio: 1672/941) 177.7svh, 100vw";
const VAULT_SEAL_ART_COORDINATES = [
  { x: 43.2, y: 46.3 },
  { x: 49.95, y: 34.95 },
  { x: 56.6, y: 46.1 },
] as const;

interface IntroFrameConfig {
  frameCount: number;
  folder: string;
}

interface VaultArtRenderRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

type VaultArtPlaneStyle = CSSProperties & Record<"--vault-art-left" | "--vault-art-top" | "--vault-art-width" | "--vault-art-height", string>;
type VaultSealHotspotStyle = CSSProperties & Record<"--seal-art-x" | "--seal-art-y", string>;
type VaultVisualStageStyle = CSSProperties & Record<"--vault-opening-crossfade", string>;

function getCoveredImageRect(containerWidth: number, containerHeight: number, imageWidth: number, imageHeight: number): VaultArtRenderRect {
  const imageRatio = imageWidth / imageHeight;
  const containerRatio = containerWidth / containerHeight;
  const width = imageRatio > containerRatio ? containerHeight * imageRatio : containerWidth;
  const height = imageRatio > containerRatio ? containerHeight : containerWidth / imageRatio;

  return {
    left: (containerWidth - width) / 2,
    top: (containerHeight - height) / 2,
    width,
    height,
  };
}

function createVaultArtPlaneStyle(rect: VaultArtRenderRect): VaultArtPlaneStyle {
  return {
    "--vault-art-left": `${rect.left}px`,
    "--vault-art-top": `${rect.top}px`,
    "--vault-art-width": `${rect.width}px`,
    "--vault-art-height": `${rect.height}px`,
  };
}

function createSealHotspotStyle(stepIndex: number): VaultSealHotspotStyle {
  const coordinates = VAULT_SEAL_ART_COORDINATES[stepIndex] ?? VAULT_SEAL_ART_COORDINATES[0];

  return {
    "--seal-art-x": `${coordinates.x}%`,
    "--seal-art-y": `${coordinates.y}%`,
  };
}

function createVaultVisualStageStyle(crossfadeProgress: number): VaultVisualStageStyle {
  return {
    "--vault-opening-crossfade": crossfadeProgress.toFixed(3),
  };
}

function getIntroFrameConfig(): IntroFrameConfig {
  const isMobile = window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;

  return isMobile
    ? { frameCount: MOBILE_INTRO_FRAME_COUNT, folder: "mobile" }
    : { frameCount: DESKTOP_INTRO_FRAME_COUNT, folder: "desktop" };
}

function getIntroFrameSrc(folder: string, frameIndex: number) {
  return withPublicPath(`/assets/intro/open-vault-frames/${folder}/intro_${String(frameIndex + 1).padStart(4, "0")}.webp`);
}

function getSealAsset(stepIndex: number) {
  return withPublicPath(SEAL_ASSETS[stepIndex] ?? SEAL_ASSETS[0]);
}

function getIntroVisibleProgress(progress: number) {
  return INTRO_VISIBLE_START_PROGRESS + progress * (1 - INTRO_VISIBLE_START_PROGRESS);
}

function normalizeWheelDeltaPixels(event: globalThis.WheelEvent) {
  if (event.deltaMode === WHEEL_DELTA_MODE.LINE) {
    return event.deltaY * WHEEL_LINE_HEIGHT_PX;
  }

  if (event.deltaMode === WHEEL_DELTA_MODE.PAGE) {
    return event.deltaY * window.innerHeight;
  }

  return event.deltaY;
}

function isKeyboardActivationKey(key: string) {
  return key === KEYBOARD_ACTIVATION_KEY.ENTER || key === KEYBOARD_ACTIVATION_KEY.SPACE || key === KEYBOARD_ACTIVATION_KEY.SPACEBAR;
}

function loadIntroFrame(src: string, timeoutMs = INTRO_FRAME_LOAD_TIMEOUT_MS) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out loading intro frame: ${src}`));
    }, timeoutMs);
    const cleanup = () => window.clearTimeout(timeout);

    image.decoding = "async";
    image.onload = () => {
      cleanup();
      resolve(image);
    };
    image.onerror = () => {
      cleanup();
      reject(new Error(`Failed to load intro frame: ${src}`));
    };
    image.src = src;
  });
}

function warmIntroFrameCache(sources: readonly string[], signal: AbortSignal) {
  let nextSource = 0;
  const init = { cache: "force-cache", priority: "low", signal } as RequestInit & { priority: "low" };
  const warmNext = async () => {
    while (!signal.aborted) {
      const src = sources[nextSource];
      nextSource += 1;
      if (src === undefined) return;

      try {
        const response = await window.fetch(src, init);
        await response.arrayBuffer();
      } catch {
        // Exact-frame loading retains the existing timeout, retry, and telemetry path.
      }
    }
  };

  return Promise.all(Array.from({ length: Math.min(INTRO_FRAME_WARM_CONCURRENCY, sources.length) }, warmNext));
}

function preloadSealAsset(src: string, signal?: AbortSignal) {
  return new Promise<boolean>((resolve) => {
    const image = new window.Image();
    let settled = false;
    let loadStarted = false;
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal?.removeEventListener("abort", handleAbort);
    };
    const finish = (ready: boolean) => {
      if (settled) return;

      settled = true;
      cleanup();
      resolve(ready);
    };
    const handleLoad = () => {
      if (loadStarted || settled) return;
      loadStarted = true;
      void (typeof image.decode === "function" ? image.decode() : Promise.resolve())
        .catch(() => undefined)
        .then(() => finish(image.complete && image.naturalWidth > 0));
    };
    const handleAbort = () => finish(false);

    image.decoding = "async";
    image.onload = handleLoad;
    image.onerror = () => finish(false);
    signal?.addEventListener("abort", handleAbort, { once: true });
    if (signal?.aborted) {
      finish(false);
      return;
    }
    image.src = src;
    if (image.complete) handleLoad();
  });
}

function markSealPerformance(name: string) {
  window.performance.mark?.(name);
}

const PROGRESSION_SEAL_IDS = VAULT_SEALS.map((seal) => seal.id);
const PROGRESSION_CHALLENGE_IDS = PROJECT_UNLOCK_CHALLENGES.map((challenge) => challenge.id);

function VaultShellIsland() {
  const motionPreferences = useMotionPreferences();
  const [state, dispatch] = useReducer(vaultReducer, createInitialVaultState(motionPreferences.reducedMotion));
  const [progression, setProgression] = useState<SessionProgression>(createInitialSessionProgression);
  const progressionRef = useRef(progression);
  const [progressionHydrated, setProgressionHydrated] = useState(false);
  const [introProgress, setIntroProgress] = useState(0);
  const [openVaultReady, setOpenVaultReady] = useState(false);
  const [introLoadedFrames, setIntroLoadedFrames] = useState(0);
  const [introFrameCount, setIntroFrameCount] = useState(DESKTOP_INTRO_FRAME_COUNT);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [openingProgressViewport, setOpeningProgressViewport] = useState<OpeningProgressViewport>({ width: 1280, height: 720 });
  const openVaultCanvasRef = useRef<HTMLCanvasElement>(null);
  const openVaultFramesRef = useRef(new Map<number, HTMLImageElement>());
  const pendingIntroFramesRef = useRef(new Map<number, { desiredRequest?: IntroFrameRequest }>());
  const introFrameRetryCountsRef = useRef(new Map<number, number>());
  const introFrameCoordinatorRef = useRef(createIntroFrameCoordinator());
  const introDegradedRef = useRef(false);
  const introFrameConfigRef = useRef<IntroFrameConfig | null>(null);
  const introFrameProgressRef = useRef(0);
  const introLastDesiredFrameRef = useRef(0);
  const introVelocityRef = useRef(0);
  const introRafRef = useRef<number | null>(null);
  const introLastFrameTimeRef = useRef<number | null>(null);
  const lastRenderedIntroPercentRef = useRef(0);
  const introPointerRef = useRef<{ id: number; lastY: number } | null>(null);
  const touchIntroHandoffLockedRef = useRef(false);
  const shellRef = useRef<HTMLElement>(null);
  const mainHallRef = useRef<HTMLElement>(null);
  const vaultVisualStageRef = useRef<HTMLDivElement>(null);
  const vaultArtPlaneRef = useRef<HTMLDivElement>(null);
  const sealDialogRef = useRef<HTMLElement>(null);
  const sealDialogCloseRef = useRef<HTMLButtonElement>(null);
  const sealDialogHistoryStateRef = useRef(false);
  const keyboardHandoffLockedKeyRef = useRef<string | null>(null);
  const sealHotspotRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [vaultArtRect, setVaultArtRect] = useState<VaultArtRenderRect | null>(null);
  const [introFrameRenderState, setIntroFrameRenderState] = useState("loading");
  const [introFirstFrameDrawn, setIntroFirstFrameDrawn] = useState(false);
  const [introRenderedFrame, setIntroRenderedFrame] = useState(-1);
  const [isSealDialogOpen, setIsSealDialogOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [cinematicRequested, setCinematicRequested] = useState(false);
  const [cinematicFailure, setCinematicFailure] = useState(false);
  const [sealAssetStatuses, setSealAssetStatuses] = useState<SealAssetStatus[]>(() => SEAL_ASSETS.map(() => SEAL_ASSET_STATUS.PENDING));
  const [sealHandoffGraceElapsed, setSealHandoffGraceElapsed] = useState(false);
  const introCompleteMarkedRef = useRef(false);
  const sealUiMountedMarkedRef = useRef(false);
  const activeStep = getVaultStep(state.activeIndex);
  const unlockedSealCount = progression.unlockedSealIds.length;
  const hasSelectedSeal = unlockedSealCount > 0;
  const hasUnlockedAllSeals = unlockedSealCount === VAULT_SEALS.length;
  const introReady = motionPreferences.reducedMotion || openVaultReady;
  const displayedOpeningProgress = getDisplayedOpeningProgress(introProgress, openingProgressViewport);
  const openingCompletionCrossfade = motionPreferences.reducedMotion ? 1 : getOpeningCompletionCrossfade(displayedOpeningProgress);
  // The seal handoff must follow the progress shown to the user. Requiring raw
  // progress to reach 1 after the responsive meter already reads 100% strands
  // touch users on the completed curtain frame.
  const introComplete = progression.introCompleted || motionPreferences.reducedMotion || displayedOpeningProgress >= 1;
  const sealAssetsReady = sealAssetStatuses.every((status) => status === SEAL_ASSET_STATUS.READY);
  const sealAssetsSettled = sealAssetStatuses.every((status) => status !== SEAL_ASSET_STATUS.PENDING);
  const showSealInterface = introComplete && (sealAssetsReady || sealAssetsSettled || sealHandoffGraceElapsed);
  const displayedIntroPhase: IntroPhase = introComplete
    ? INTRO_PHASE.COMPLETE
    : introProgress > 0
      ? INTRO_PHASE.OPENING
      : INTRO_PHASE.CLOSED;
  const sealGuidance = hasSelectedSeal
    ? isMobileViewport
      ? "Pulsa sobre los sellos para activarlos."
      : "Recorre los sellos con las flechas izquierda y derecha, o haz click sobre ellos."
    : isMobileViewport
      ? "Pulsa sobre los sellos para activarlos."
      : "Recorre los sellos con las flechas izquierda y derecha, o haz click sobre ellos.";
  const vaultArtPlaneStyle = vaultArtRect === null ? undefined : createVaultArtPlaneStyle(vaultArtRect);

  const commitProgression = (next: SessionProgression) => {
    progressionRef.current = next;
    setProgression(next);
    writeSessionProgression(next);
  };

  useLayoutEffect(() => {
    let cancelled = false;
    const didResetForReload = resetSessionProgressionForDocumentReload();
    const loaded = didResetForReload
      ? createInitialSessionProgression()
      : readSessionProgression({
        challengeIds: PROGRESSION_CHALLENGE_IDS,
        sealIds: PROGRESSION_SEAL_IDS,
      });
    const query = new URLSearchParams(window.location.search);
    const isShowcaseUrl = query.get("view") === "showcase" || query.has("project") || query.has("tech");
    if (didResetForReload || (isShowcaseUrl && !loaded.mainHallUnlocked)) {
      window.history.replaceState(null, "", withPublicPath("/"));
    }
    queueMicrotask(() => {
      if (cancelled) return;

      progressionRef.current = loaded;
      setProgression(loaded);
      dispatch({
        type: VAULT_ACTION.RESTORE_PROGRESS,
        stepCount: VAULT_SEALS.length,
        unlocked: loaded.mainHallUnlocked,
        unlockedSealIndexes: loaded.unlockedSealIds.flatMap((sealId) => {
          const index = PROGRESSION_SEAL_IDS.indexOf(sealId);
          return index < 0 ? [] : [index];
        }),
      });
      setProgressionHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const revalidateShowcaseUrl = () => {
      const query = new URLSearchParams(window.location.search);
      const isShowcaseUrl = query.get("view") === "showcase" || query.has("project") || query.has("tech");
      if (!isShowcaseUrl) return;

      const current = readSessionProgression({
        challengeIds: PROGRESSION_CHALLENGE_IDS,
        sealIds: PROGRESSION_SEAL_IDS,
      });
      if (!current.mainHallUnlocked) window.history.replaceState(null, "", withPublicPath("/"));
    };

    window.addEventListener("popstate", revalidateShowcaseUrl);
    return () => window.removeEventListener("popstate", revalidateShowcaseUrl);
  }, []);

  useEffect(() => {
    if (!progressionHydrated || !introComplete || progression.introCompleted) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) commitProgression(markIntroCompleted(progression));
    });

    return () => {
      cancelled = true;
    };
  }, [introComplete, progression, progressionHydrated]);

  useEffect(() => {
    markSealPerformance("seal-preload-start");
    let cancelled = false;
    const preloadController = new AbortController();

    void Promise.all(SEAL_ASSETS.map(async (src, index) => {
      const ready = await preloadSealAsset(withPublicPath(src), preloadController.signal);

      if (cancelled) return;

      setSealAssetStatuses((statuses) => statuses.map((status, statusIndex) => (
        statusIndex === index ? (ready ? SEAL_ASSET_STATUS.READY : SEAL_ASSET_STATUS.FAILED) : status
      )));
    })).then(() => {
      if (!cancelled) markSealPerformance("seal-preload-complete");
    });

    return () => {
      cancelled = true;
      preloadController.abort();
    };
  }, []);

  useEffect(() => {
    if (!introComplete) {
      queueMicrotask(() => setSealHandoffGraceElapsed(false));
      return;
    }

    if (!introCompleteMarkedRef.current) {
      introCompleteMarkedRef.current = true;
      markSealPerformance("intro-complete");
    }

    if (sealAssetsReady || sealAssetsSettled) {
      queueMicrotask(() => setSealHandoffGraceElapsed(true));
      return;
    }

    const timeout = window.setTimeout(() => setSealHandoffGraceElapsed(true), SEAL_HANDOFF_GRACE_MS);

    return () => window.clearTimeout(timeout);
  }, [introComplete, sealAssetsReady, sealAssetsSettled]);

  useEffect(() => {
    if (!showSealInterface || sealUiMountedMarkedRef.current) {
      return;
    }

    sealUiMountedMarkedRef.current = true;
    markSealPerformance("seal-ui-mounted");
    window.performance.measure?.("intro-complete/seal-ui-mounted", "intro-complete", "seal-ui-mounted");
  }, [showSealInterface]);

  const commitIntroProgress = (progress: number) => {
    const renderedPercent = Math.round(getDisplayedOpeningProgress(progress, openingProgressViewport) * 100);
    const isSemanticBoundary = progress === 0 || progress === 1;

    if (!isSemanticBoundary && renderedPercent === lastRenderedIntroPercentRef.current) {
      return;
    }

    lastRenderedIntroPercentRef.current = renderedPercent;

    setIntroProgress(progress);
  };

  const drawIntroFrame = (request: IntroFrameRequest, renderedFrameIndex = request.frameIndex) => {
    const canvas = openVaultCanvasRef.current;
    const frames = openVaultFramesRef.current;
    const frame = frames.get(renderedFrameIndex);

    if (canvas === null || frame === undefined || !introFrameCoordinatorRef.current.isCurrent(request)) {
      return;
    }

    const context = canvas.getContext("2d");

    if (context === null) {
      return;
    }

    if (!introFrameCoordinatorRef.current.markRendered(request, renderedFrameIndex)) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const canvasWidth = Math.floor(width * pixelRatio);
    const canvasHeight = Math.floor(height * pixelRatio);

    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }

    const imageRatio = frame.naturalWidth / frame.naturalHeight;
    const canvasRatio = width / height;
    const drawWidth = imageRatio > canvasRatio ? height * imageRatio : width;
    const drawHeight = imageRatio > canvasRatio ? height : width / imageRatio;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.drawImage(frame, offsetX, offsetY, drawWidth, drawHeight);
    setIntroFrameRenderState("drawn");
    setIntroRenderedFrame(renderedFrameIndex);

    if (renderedFrameIndex === 0) {
      setIntroFirstFrameDrawn(true);
    }

    return true;
  };

  const drawNearestIntroFrame = (request: IntroFrameRequest) => {
    const nearestFrameIndex = [...openVaultFramesRef.current.keys()].reduce<number | undefined>((nearest, candidate) => (
      nearest === undefined || Math.abs(candidate - request.frameIndex) < Math.abs(nearest - request.frameIndex)
        ? candidate
        : nearest
    ), undefined);

    if (nearestFrameIndex !== undefined) drawIntroFrame(request, nearestFrameIndex);
  };

  const drawIntroProgress = (progress: number) => {
    const frameCount = introFrameConfigRef.current?.frameCount ?? introFrameCount;
    const visibleProgress = getIntroVisibleProgress(progress);
    const frameIndex = Math.min(frameCount - 1, Math.max(0, Math.round(visibleProgress * (frameCount - 1))));

    const request = introFrameCoordinatorRef.current.requestDesiredFrame(frameIndex);
    requestIntroFrame(request);
    if (!drawIntroFrame(request)) drawNearestIntroFrame(request);

    const direction = Math.sign(frameIndex - introLastDesiredFrameRef.current) || 1;
    introLastDesiredFrameRef.current = frameIndex;
    for (let offset = 1; offset <= INTRO_FRAME_AHEAD_WINDOW; offset += 1) {
      requestIntroFrameForEffect(frameIndex + direction * offset);
    }
    for (let offset = 1; offset <= INTRO_FRAME_BEHIND_WINDOW; offset += 1) {
      requestIntroFrameForEffect(frameIndex - direction * offset);
    }
  };

  const requestIntroFrame = (request: IntroFrameRequest) => {
    const config = introFrameConfigRef.current;
    const { frameIndex } = request;

    if (config === null) {
      return;
    }

    if (openVaultFramesRef.current.has(frameIndex)) {
      drawIntroFrame(request);
      return;
    }

    const pending = pendingIntroFramesRef.current.get(frameIndex);

    if (pending !== undefined) {
      pending.desiredRequest = request;
      return;
    }

    const pendingFrame = { desiredRequest: request };
    pendingIntroFramesRef.current.set(frameIndex, pendingFrame);
    void loadIntroFrame(getIntroFrameSrc(config.folder, frameIndex))
      .then((frame) => {
        const frames = openVaultFramesRef.current;
        frames.set(frameIndex, frame);
        introFrameRetryCountsRef.current.delete(frameIndex);

        const cacheCenter = introFrameCoordinatorRef.current.getCurrentRequest()?.frameIndex ?? frameIndex;
        while (frames.size > INTRO_FRAME_CACHE_SIZE) {
          const furthestFrame = [...frames.keys()].sort(
            (left, right) => Math.abs(right - cacheCenter) - Math.abs(left - cacheCenter),
          )[0];

          if (furthestFrame === undefined) {
            break;
          }

          frames.delete(furthestFrame);
        }

        setIntroLoadedFrames(frames.size);

        const latestRequest = pendingFrame.desiredRequest;

        if (latestRequest !== undefined && introFrameCoordinatorRef.current.isCurrent(latestRequest) && drawIntroFrame(latestRequest) && introDegradedRef.current) {
          introDegradedRef.current = false;
          reportBrowserObservation({ kind: "frame-recovery", name: "intro-frame", assetIndex: latestRequest.frameIndex, assetType: "intro-frame" });
        }
      })
      .catch((error: unknown) => {
        const isTimeout = error instanceof Error && error.message.startsWith("Timed out");
        reportBrowserObservation({
          kind: isTimeout ? "frame-timeout" : "frame-error",
          name: "intro-frame",
          assetIndex: frameIndex,
          assetType: "intro-frame",
        });

        const currentRequest = introFrameCoordinatorRef.current.getCurrentRequest();

        if (currentRequest?.frameIndex === frameIndex) {
          const retryCount = introFrameRetryCountsRef.current.get(frameIndex) ?? 0;

          if (retryCount < INTRO_FRAME_RETRY_LIMIT) {
            introFrameRetryCountsRef.current.set(frameIndex, retryCount + 1);
            window.setTimeout(() => {
              const latestRequest = introFrameCoordinatorRef.current.getCurrentRequest();

              if (latestRequest?.frameIndex === frameIndex) {
                requestIntroFrame(latestRequest);
              }
            }, INTRO_FRAME_RETRY_DELAY_MS);
          }
        }
      })
      .finally(() => {
        if (pendingIntroFramesRef.current.get(frameIndex) === pendingFrame) {
          pendingIntroFramesRef.current.delete(frameIndex);
        }
      });
  };

  const requestIntroFrameForEffect = (frameIndex: number) => {
    const config = introFrameConfigRef.current;

    if (config === null || frameIndex < 0 || frameIndex >= config.frameCount || openVaultFramesRef.current.has(frameIndex) || pendingIntroFramesRef.current.has(frameIndex)) {
      return;
    }

    const pendingFrame: { desiredRequest?: IntroFrameRequest } = {};
    pendingIntroFramesRef.current.set(frameIndex, pendingFrame);
    void loadIntroFrame(getIntroFrameSrc(config.folder, frameIndex))
      .then((frame) => {
        const frames = openVaultFramesRef.current;
        frames.set(frameIndex, frame);
        const cacheCenter = introFrameCoordinatorRef.current.getCurrentRequest()?.frameIndex ?? frameIndex;
        while (frames.size > INTRO_FRAME_CACHE_SIZE) {
          const furthestFrame = [...frames.keys()].sort(
            (left, right) => Math.abs(right - cacheCenter) - Math.abs(left - cacheCenter),
          )[0];
          if (furthestFrame === undefined) break;
          frames.delete(furthestFrame);
        }

        const latestRequest = pendingFrame.desiredRequest;

        if (latestRequest !== undefined && introFrameCoordinatorRef.current.isCurrent(latestRequest)) {
          drawIntroFrame(latestRequest);
        }
      })
        .catch((error: unknown) => {
          const isTimeout = error instanceof Error && error.message.startsWith("Timed out");
          reportBrowserObservation({ kind: isTimeout ? "frame-timeout" : "frame-error", name: "intro-frame", assetIndex: frameIndex, assetType: "intro-frame" });
          const retryCount = introFrameRetryCountsRef.current.get(frameIndex) ?? 0;
          if (retryCount < INTRO_FRAME_RETRY_LIMIT) {
            introFrameRetryCountsRef.current.set(frameIndex, retryCount + 1);
            window.setTimeout(() => requestIntroFrameForEffect(frameIndex), INTRO_FRAME_RETRY_DELAY_MS);
          }
        })
      .finally(() => {
        if (pendingIntroFramesRef.current.get(frameIndex) === pendingFrame) {
          pendingIntroFramesRef.current.delete(frameIndex);
        }
      });
  };

  const drawIntroProgressForEffect = useEffectEvent((progress: number) => {
    drawIntroProgress(progress);
  });

  const animateIntroScrub = (frameTime: number) => {
    const frameCount = introFrameConfigRef.current?.frameCount ?? introFrameCount;

    if (frameCount <= 0) {
      introRafRef.current = null;
      return;
    }

    const previousFrameTime = introLastFrameTimeRef.current ?? frameTime;
    const deltaSeconds = Math.min((frameTime - previousFrameTime) / 1000, 0.05);
    introLastFrameTimeRef.current = frameTime;

    const velocity = introVelocityRef.current;
    const nextProgress = Math.min(1, Math.max(0, introFrameProgressRef.current + velocity * deltaSeconds));

    introFrameProgressRef.current = nextProgress;
    drawIntroProgress(nextProgress);
    commitIntroProgress(nextProgress);

    const hitStart = nextProgress <= 0 && velocity < 0;
    const hitEnd = nextProgress >= 1 && velocity > 0;

    if (hitStart || hitEnd) {
      introVelocityRef.current = 0;
      introLastFrameTimeRef.current = null;
      introRafRef.current = null;
      return;
    }

    introVelocityRef.current = velocity * Math.pow(SCRUB_FRICTION_PER_FRAME, deltaSeconds * 60);

    if (Math.abs(introVelocityRef.current) < SCRUB_MIN_VELOCITY) {
      introVelocityRef.current = 0;
      introLastFrameTimeRef.current = null;
      introRafRef.current = null;
      return;
    }

    introRafRef.current = window.requestAnimationFrame(animateIntroScrub);
  };

  const startIntroScrubLoop = () => {
    if (introRafRef.current !== null) {
      return;
    }

    introRafRef.current = window.requestAnimationFrame(animateIntroScrub);
  };

  const scrubIntro = (direction: typeof VAULT_INPUT.NEXT | typeof VAULT_INPUT.PREVIOUS, velocity = SCRUB_KEYBOARD_VELOCITY) => {
    if (!introReady) {
      return;
    }

    if (motionPreferences.reducedMotion) {
      setIntroProgress(1);
      return;
    }

    introVelocityRef.current = Math.min(
      SCRUB_MAX_VELOCITY,
      Math.max(-SCRUB_MAX_VELOCITY, direction === VAULT_INPUT.NEXT ? velocity : -velocity),
    );
    startIntroScrubLoop();
  };

  const scrubIntroByWheel = (deltaY: number) => {
    if (!introReady) {
      return;
    }

    if (motionPreferences.reducedMotion) {
      setIntroProgress(1);
      return;
    }

    if (introRafRef.current !== null) {
      window.cancelAnimationFrame(introRafRef.current);
      introRafRef.current = null;
    }

    introVelocityRef.current = 0;
    introLastFrameTimeRef.current = null;

    const progressDelta = Math.min(
      SCRUB_MAX_WHEEL_PROGRESS_DELTA,
      Math.max(-SCRUB_MAX_WHEEL_PROGRESS_DELTA, deltaY * SCRUB_WHEEL_SENSITIVITY),
    );
    const nextProgress = Math.min(1, Math.max(0, introFrameProgressRef.current + progressDelta));

    introFrameProgressRef.current = nextProgress;
    drawIntroProgress(nextProgress);
    commitIntroProgress(nextProgress);
  };

  const scrubIntroByTouch = (deltaY: number) => {
    if (!introReady || motionPreferences.reducedMotion) {
      return;
    }

    if (introRafRef.current !== null) {
      window.cancelAnimationFrame(introRafRef.current);
      introRafRef.current = null;
    }

    introVelocityRef.current = 0;
    introLastFrameTimeRef.current = null;
    const progressDelta = -deltaY / Math.max(window.innerHeight * 0.72, 1);
    const nextProgress = Math.min(1, Math.max(0, introFrameProgressRef.current + progressDelta));

    introFrameProgressRef.current = nextProgress;
    drawIntroProgress(nextProgress);
    commitIntroProgress(nextProgress);
  };

  useEffect(() => {
    shellRef.current?.focus();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_VIEWPORT_QUERY);
    const syncViewport = () => {
      setIsMobileViewport(mediaQuery.matches);
      setOpeningProgressViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    window.addEventListener("resize", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const warmController = new AbortController();

    const preloadFrames = async () => {
      if (motionPreferences.reducedMotion) {
        setOpenVaultReady(true);
        return;
      }

      const config = getIntroFrameConfig();
      introFrameConfigRef.current = config;
      setIntroFrameCount(config.frameCount);
      setIntroLoadedFrames(0);
      setOpenVaultReady(false);
      openVaultFramesRef.current = new Map();
      pendingIntroFramesRef.current.clear();
      introFrameRetryCountsRef.current.clear();
      introFrameCoordinatorRef.current = createIntroFrameCoordinator();
      introLastDesiredFrameRef.current = 0;
      introDegradedRef.current = false;
      setIntroFrameRenderState("loading");
      setIntroFirstFrameDrawn(false);
      setIntroRenderedFrame(-1);

      let firstFrame: HTMLImageElement;

      try {
        firstFrame = await loadIntroFrame(getIntroFrameSrc(config.folder, 0));
      } catch (error: unknown) {
        if (!cancelled) {
          const isTimeout = error instanceof Error && error.message.startsWith("Timed out");
          introDegradedRef.current = true;
          setIntroFrameRenderState("degraded");
          reportBrowserObservation({ kind: isTimeout ? "frame-timeout" : "frame-error", name: "intro-frame", assetIndex: 0, assetType: "intro-frame" });
          reportBrowserObservation({ kind: "frame-degraded", name: "intro-frame", assetIndex: 0, assetType: "intro-frame" });
          setOpenVaultReady(true);
        }

        return;
      }

      if (cancelled) {
        return;
      }

      openVaultFramesRef.current.set(0, firstFrame);
      setIntroLoadedFrames(1);
      setIntroFirstFrameDrawn(true);
      drawIntroProgressForEffect(introFrameProgressRef.current);
      setOpenVaultReady(true);

      void warmIntroFrameCache(
        Array.from({ length: config.frameCount - 1 }, (_, index) => getIntroFrameSrc(config.folder, index + 1)),
        warmController.signal,
      );
    };

    void preloadFrames();

    return () => {
      cancelled = true;
      warmController.abort();
    };
  }, [motionPreferences.reducedMotion]);

  useEffect(() => {
    dispatch({ type: VAULT_ACTION.SET_PAUSED, paused: motionPreferences.paused });
  }, [motionPreferences.paused]);

  useEffect(() => {
    dispatch({ type: VAULT_ACTION.SET_REDUCED_MOTION, reducedMotion: motionPreferences.reducedMotion });
  }, [motionPreferences.reducedMotion]);

  useEffect(() => {
    if (state.unlocked) {
      mainHallRef.current?.focus();
      return;
    }

    if (introComplete && hasSelectedSeal && !isMobileViewport) {
      moveFocusToActiveVaultTarget(activeStep.id);
    }
  }, [activeStep.id, hasSelectedSeal, introComplete, isMobileViewport, state.unlocked]);

  useEffect(() => {
    if (!isSealDialogOpen) {
      return;
    }

    sealDialogCloseRef.current?.focus();
  }, [activeStep.id, isSealDialogOpen]);

  useEffect(() => {
    const handleWindowPopState = () => {
      if (!sealDialogHistoryStateRef.current) {
        return;
      }

      sealDialogHistoryStateRef.current = false;
      setIsSealDialogOpen(false);
      window.requestAnimationFrame(() => {
        sealHotspotRefs.current[state.activeIndex]?.focus();
      });
    };

    window.addEventListener("popstate", handleWindowPopState);

    return () => window.removeEventListener("popstate", handleWindowPopState);
  }, [state.activeIndex]);

  useEffect(() => {
    return () => {
      if (introRafRef.current !== null) {
        window.cancelAnimationFrame(introRafRef.current);
      }
    };
  }, []);

  function openSealDialog() {
    setIsSealDialogOpen(true);

    if (!sealDialogHistoryStateRef.current) {
      window.history.pushState({ vaultSealDialog: true }, "");
      sealDialogHistoryStateRef.current = true;
    }
  }

  const navigateToVaultSeal = (stepIndex: number) => {
    if (cinematicRequested || !progressionHydrated || !introComplete || state.unlocked || touchIntroHandoffLockedRef.current) {
      touchIntroHandoffLockedRef.current = false;
      return;
    }

    const sealId = VAULT_SEALS[stepIndex]?.id;
    if (sealId === undefined) return;

    const withIntro = progressionRef.current.introCompleted
      ? progressionRef.current
      : markIntroCompleted(progressionRef.current);
    const nextProgression = unlockSeal(withIntro, sealId, PROGRESSION_SEAL_IDS);
    if (nextProgression !== null) commitProgression(nextProgression);
    const canonicalProgression = nextProgression ?? withIntro;

    dispatch({
      type: VAULT_ACTION.SELECT_SEAL,
      activeIndex: stepIndex,
      stepCount: VAULT_SEALS.length,
      unlockedSealIndexes: canonicalProgression.unlockedSealIds.flatMap((id) => {
        const index = PROGRESSION_SEAL_IDS.indexOf(id);
        return index < 0 ? [] : [index];
      }),
    });
    openSealDialog();
  };

  const advanceVault = (input: typeof VAULT_INPUT.NEXT | typeof VAULT_INPUT.PREVIOUS, event = normalizeActivationInput(input)) => {
    if (cinematicRequested || state.unlocked) {
      return;
    }

    const projectedState = {
      ...state,
      unlockedSealIndexes: progression.unlockedSealIds.flatMap((sealId) => {
        const index = PROGRESSION_SEAL_IDS.indexOf(sealId);
        return index < 0 ? [] : [index];
      }),
    };
    const nextIndex = getNextVaultIndex(projectedState, event.input, VAULT_SEALS.length);
    navigateToVaultSeal(nextIndex);
  };

  const selectVaultSeal = (stepIndex: number) => {
    navigateToVaultSeal(stepIndex);
  };

  const closeSealDialog = (options: { restoreHistory?: boolean } = {}) => {
    if (cinematicRequested) {
      return;
    }
    const restoreHistory = options.restoreHistory ?? true;

    setIsSealDialogOpen(false);

    if (restoreHistory && sealDialogHistoryStateRef.current) {
      sealDialogHistoryStateRef.current = false;
      window.history.back();
    }

    window.requestAnimationFrame(() => {
      sealHotspotRefs.current[state.activeIndex]?.focus();
    });
  };

  const getValidMainHallProgression = () => {
    const withIntro = progressionRef.current.introCompleted
      ? progressionRef.current
      : markIntroCompleted(progressionRef.current);
    return completeMainHall(withIntro, PROGRESSION_SEAL_IDS);
  };

  const grantMainHallAfterValidFlow = () => {
    const next = getValidMainHallProgression();
    if (next === null) {
      setCinematicFailure(true);
      return false;
    }

    commitProgression(next);
    dispatch({ type: VAULT_ACTION.UNLOCK });
    return true;
  };

  const handleSealDialogBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    closeSealDialog();
  };

  const unlockMainHall = () => {
    if (cinematicRequested || !progressionHydrated || !hasUnlockedAllSeals) {
      return;
    }

    if (getValidMainHallProgression() === null) {
      setCinematicFailure(true);
      return;
    }

    setCinematicFailure(false);
    if (motionPreferences.reducedMotion) {
      grantMainHallAfterValidFlow();
    } else {
      setCinematicRequested(true);
    }
  };

  const handleKeyboardInput = (key: string) => {
    if (isProjectModalOpen || cinematicRequested || state.unlocked) {
      return;
    }

    if (isSealDialogOpen) {
      if (key === "Escape") {
        closeSealDialog();
      }

      return;
    }

    if (introComplete && hasUnlockedAllSeals && isKeyboardActivationKey(key) && shellRef.current?.contains(document.activeElement)) {
      unlockMainHall();
      return;
    }

    const normalizedInput = normalizeKeyboardInput({ key });

    if (normalizedInput === null) {
      return;
    }

    if (!introComplete) {
      if (normalizedInput.input !== VAULT_INPUT.NEXT && normalizedInput.input !== VAULT_INPUT.PREVIOUS) {
        return;
      }

      scrubIntro(normalizedInput.input);
      return;
    }

    if (normalizedInput.input !== VAULT_INPUT.NEXT && normalizedInput.input !== VAULT_INPUT.PREVIOUS) {
      return;
    }

    advanceVault(normalizedInput.input);
  };

  const handleWheelDelta = (deltaY: number) => {
    if (isProjectModalOpen || cinematicRequested || state.unlocked) {
      return;
    }

    const normalizedInput = normalizeWheelInput({ deltaY });

    if (normalizedInput === null) {
      return;
    }

    if (!introComplete) {
      if (normalizedInput.input !== VAULT_INPUT.NEXT && normalizedInput.input !== VAULT_INPUT.PREVIOUS) {
        return;
      }

      scrubIntroByWheel(deltaY);
      return;
    }

    return;
  };

  const handleIntroPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (isProjectModalOpen || cinematicRequested || state.unlocked || introComplete || !introReady || event.pointerType === "mouse") {
      return;
    }

    introPointerRef.current = { id: event.pointerId, lastY: event.clientY };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic and interrupted pointers can arrive without an active browser capture target.
    }
  };

  const handleMainHallActionKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isKeyboardActivationKey(event.key)) return;

    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) unlockMainHall();
  };

  const handleMainHallActionKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isKeyboardActivationKey(event.key)) return;

    event.preventDefault();
    event.stopPropagation();
  };

  const handleAlternatePortfolioClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
    if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    commitProgression(issueAlternateHandoff(progressionRef.current));
  };

  const handleIntroPointerMove = (event: PointerEvent<HTMLElement>) => {
    const pointer = introPointerRef.current;
    if (pointer === null || pointer.id !== event.pointerId || cinematicRequested || state.unlocked || introComplete) {
      return;
    }

    const deltaY = event.clientY - pointer.lastY;
    pointer.lastY = event.clientY;

    if (deltaY === 0) return;

    touchIntroHandoffLockedRef.current = true;
    scrubIntroByTouch(deltaY);
  };

  const clearIntroPointer = (event: PointerEvent<HTMLElement>) => {
    if (introPointerRef.current?.id === event.pointerId) {
      introPointerRef.current = null;
    }
  };

  const handleSealDialogKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab") {
      return;
    }

    const dialog = sealDialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    const targets = focusable === undefined ? [] : [...focusable];

    if (targets.length === 0) {
      event.preventDefault();
      return;
    }

    const firstTarget = targets[0];
    const lastTarget = targets[targets.length - 1];

    if (event.shiftKey && document.activeElement === firstTarget) {
      event.preventDefault();
      lastTarget?.focus();
    } else if (!event.shiftKey && document.activeElement === lastTarget) {
      event.preventDefault();
      firstTarget?.focus();
    }
  };

  useEffect(() => {
    const handleWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (isProjectModalOpen || cinematicRequested) {
        return;
      }
      if (event.target instanceof HTMLElement && event.target.closest('[data-vault-primary-action="main-hall"]') !== null) {
        return;
      }
      const normalizedInput = normalizeKeyboardInput({ key: event.key });

      if (introComplete && keyboardHandoffLockedKeyRef.current === event.key) {
        return;
      }

      if (!introComplete && normalizedInput !== null) {
        keyboardHandoffLockedKeyRef.current = event.key;
      }

      handleKeyboardInput(event.key);
    };

    const handleWindowKeyUp = (event: globalThis.KeyboardEvent) => {
      if (keyboardHandoffLockedKeyRef.current === event.key) {
        keyboardHandoffLockedKeyRef.current = null;
      }
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    window.addEventListener("keyup", handleWindowKeyUp);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
      window.removeEventListener("keyup", handleWindowKeyUp);
    };
  });

  useEffect(() => {
      const handleWindowWheel = (event: globalThis.WheelEvent) => {
        if (isProjectModalOpen) {
          if (!(event.target instanceof Element && event.target.closest("dialog, [role='dialog']") !== null)) {
            event.preventDefault();
          }
          return;
        }
        if (cinematicRequested || state.unlocked) {
        return;
      }

      event.preventDefault();

      if (!introReady && !introComplete) {
        return;
      }

      handleWheelDelta(normalizeWheelDeltaPixels(event));
    };

    window.addEventListener("wheel", handleWindowWheel, { passive: false });

    return () => window.removeEventListener("wheel", handleWindowWheel);
  });

  useEffect(() => {
    const artPlane = vaultArtPlaneRef.current;
    const visualStage = vaultVisualStageRef.current;

    if (artPlane === null || visualStage === null) {
      return;
    }

    const updateVaultArtRect = () => {
      const containerRect = visualStage.getBoundingClientRect();
      const nextRect = getCoveredImageRect(
        containerRect.width,
        containerRect.height,
        VAULT_BACKGROUND_INTRINSIC_SIZE.WIDTH,
        VAULT_BACKGROUND_INTRINSIC_SIZE.HEIGHT,
      );

      setVaultArtRect((currentRect) => {
        if (currentRect === null) {
          return nextRect;
        }

        const changed =
          Math.abs(currentRect.left - nextRect.left) > 0.5 ||
          Math.abs(currentRect.top - nextRect.top) > 0.5 ||
          Math.abs(currentRect.width - nextRect.width) > 0.5 ||
          Math.abs(currentRect.height - nextRect.height) > 0.5;

        return changed ? nextRect : currentRect;
      });
    };

    updateVaultArtRect();

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateVaultArtRect);
    resizeObserver?.observe(visualStage);
    window.addEventListener("resize", updateVaultArtRect);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateVaultArtRect);
    };
  }, []);

  return (
    <section
      aria-describedby={state.unlocked ? undefined : "vault-shell-status"}
      aria-labelledby="vault-shell-title"
      className="vault-shell"
      data-cinematic-requested={cinematicRequested}
      data-project-modal-open={isProjectModalOpen}
      data-seal-dialog-open={isSealDialogOpen}
      data-unlocked={state.unlocked}
      data-vault-complete={hasUnlockedAllSeals}
      data-intro-active={!introComplete && !state.unlocked}
      onPointerCancel={clearIntroPointer}
      onPointerDown={handleIntroPointerDown}
      onPointerMove={handleIntroPointerMove}
      onPointerUp={clearIntroPointer}
      ref={shellRef}
      tabIndex={0}
    >
      <div className="vault-orbit" aria-hidden="true" data-motion={motionPreferences.isMotionAllowed ? "morph" : "static"} />
      <div
        aria-hidden={cinematicRequested || undefined}
        className="vault-panel vault-shell-panel"
        inert={cinematicRequested || undefined}
        onClickCapture={(event) => {
          if (cinematicRequested) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        {state.unlocked ? (
          <>
            <VisuallyHidden>
              <h1 id="vault-shell-title">Kuroneko abre la bóveda.</h1>
            </VisuallyHidden>
            <MainHall
              hiddenChamberEnabled={false}
              isProjectModalOpen={isProjectModalOpen}
              onHiddenChamberTrigger={(projectId) =>
                dispatch({ type: VAULT_ACTION.RECORD_HIDDEN_CHAMBER_TRIGGER, triggerId: projectId })
              }
              onProgressionChange={commitProgression}
              onProjectModalChange={setIsProjectModalOpen}
              progression={progression}
              ref={mainHallRef}
            />
          </>
        ) : (
          <>
            <div
              className="vault-visual-stage"
              aria-hidden="true"
              data-intro-phase={displayedIntroPhase}
              data-vault-state={showSealInterface ? "seal-selection" : "intro"}
              ref={vaultVisualStageRef}
              style={createVaultVisualStageStyle(openingCompletionCrossfade)}
            >
              <div className="vault-art-coordinate-plane" ref={vaultArtPlaneRef} style={vaultArtPlaneStyle}>
                <Image className="vault-backdrop" src={withPublicPath("/assets/scenes/vault/vaultBG.webp")} alt="" fill priority sizes={VAULT_BACKGROUND_SIZES} />
              </div>
               <Image className="vault-curtain vault-curtain-closed" src={withPublicPath("/assets/intro/theater.webp")} alt="" fill priority sizes="100vw" />
              {!showSealInterface ? (
                <canvas
                  aria-hidden="true"
                  className="vault-curtain vault-curtain-opening"
                  data-first-frame-drawn={introFirstFrameDrawn}
                  data-intro-frame-state={introFrameRenderState}
                  data-rendered-frame={introRenderedFrame}
                  ref={openVaultCanvasRef}
                />
              ) : null}
            </div>

            {!showSealInterface ? (
             <div className="vault-welcome">
                {displayedIntroPhase === INTRO_PHASE.CLOSED ? (
                   <Link
                      className="vault-alternate-portfolio-link button button-primary"
                      href="/portfolio"
                      onClick={handleAlternatePortfolioClick}
                      onPointerDown={(event) => event.stopPropagation()}
                      prefetch={false}
                    >
                     <span>VERSIÓN MINIMALISTA</span>
                   </Link>
                ) : null}
                {!introComplete ? (
                  <h1 id="vault-shell-title" className="vault-intro-title" aria-label="¿Qué hay detrás?">
                    <span>¿Qué hay</span>
                    <span>detrás?</span>
                  </h1>
                ) : <VisuallyHidden><h1 id="vault-shell-title">Preparando los sellos.</h1></VisuallyHidden>}
                {introReady ? (
                  <p
                    id="vault-shell-status"
                    className="lead vault-intro-instructions"
                    role="status"
                    aria-label={isMobileViewport ? "Desliza hacia arriba para abrir la bóveda o hacia abajo para revertir la apertura." : "Puedes navegar con scroll, flecha izquierda o flecha derecha."}
                  >
                    {introComplete ? null : isMobileViewport ? (
                      <span className="vault-intro-swipe-guidance">
                        <span className="vault-intro-swipe-direction" data-active={introProgress === 0}>
                           <Image aria-hidden="true" className="vault-intro-action-icon vault-intro-swipe-icon" draggable={false} src={withPublicPath("/assets/icons/swipe/swipeup_00000.png")} alt="" width={72} height={72} />
                          <span>Abrir</span>
                        </span>
                        <span className="vault-intro-swipe-direction" data-active={introProgress > 0}>
                           <Image aria-hidden="true" className="vault-intro-action-icon vault-intro-swipe-icon" draggable={false} src={withPublicPath("/assets/icons/swipe/swipedown_00000.png")} alt="" width={72} height={72} />
                          <span>Revertir</span>
                        </span>
                      </span>
                    ) : (
                      <>
                         <Image className="vault-intro-action-icon" src={withPublicPath("/assets/icons/left.png")} alt="" width={72} height={72} />
                         <Image className="vault-intro-action-icon vault-intro-action-icon-scroll" src={withPublicPath("/assets/icons/scroll.png")} alt="" width={72} height={72} />
                         <Image className="vault-intro-action-icon" src={withPublicPath("/assets/icons/right.png")} alt="" width={72} height={72} />
                      </>
                    )}
                  </p>
                ) : (
                  <p id="vault-shell-status" className="lead" role="status">
                    Preparando la bóveda. Cargando {introLoadedFrames} de {introFrameCount} cuadros.
                  </p>
                )}
                <p className="vault-intro-progress" aria-hidden="true">
                    {introReady ? `Apertura ${Math.round(displayedOpeningProgress * 100)}%` : "Cargando película de apertura"}
                </p>
              </div>
            ) : (
              <div className="vault-interface">
                <div className="vault-interface-content" inert={isSealDialogOpen ? true : undefined}>
                <p className="vault-unlock-progress vault-unlock-progress-hud" aria-label={`Progreso de sellos: Desbloqueado ${unlockedSealCount} de ${VAULT_SEALS.length}`}>
                  Desbloqueado {unlockedSealCount}/{VAULT_SEALS.length}
                </p>
                <div className="vault-seal-hotspots" aria-label={`Sellos de la bóveda. Desbloqueado ${unlockedSealCount} de ${VAULT_SEALS.length}`} style={vaultArtPlaneStyle}>
                  {VAULT_SEALS.map((step, stepIndex) => (
                    <button
                      aria-label={`${step.title}. ${progression.unlockedSealIds.includes(step.id) ? "Desbloqueado" : "Bloqueado"}.`}
                      aria-pressed={hasSelectedSeal && stepIndex === state.activeIndex}
                      className={`vault-seal-hotspot vault-seal-hotspot-${stepIndex + 1}`}
                      data-active={hasSelectedSeal && stepIndex === state.activeIndex}
                      data-unlocked={progression.unlockedSealIds.includes(step.id)}
                      key={step.id}
                      onClick={() => selectVaultSeal(stepIndex)}
                      ref={(element) => {
                        sealHotspotRefs.current[stepIndex] = element;
                      }}
                      style={createSealHotspotStyle(stepIndex)}
                      type="button"
                    >
                       {sealAssetStatuses[stepIndex] === SEAL_ASSET_STATUS.READY ? (
                         <Image src={getSealAsset(stepIndex)} alt="" unoptimized width={96} height={96} />
                       ) : (
                         <span
                           aria-hidden="true"
                           className="vault-seal-fallback"
                           style={{
                             background: "radial-gradient(circle, rgba(244, 242, 236, 0.92) 0 12%, rgba(244, 242, 236, 0.24) 13% 44%, rgba(0, 0, 0, 0) 45%)",
                             border: "1px solid rgba(244, 242, 236, 0.68)",
                             borderRadius: "50%",
                             display: "block",
                             height: "96px",
                             width: "96px",
                           }}
                         />
                       )}
                      <span>{step.emblem}</span>
                    </button>
                    ))}
                </div>
                <div className="vault-seal-carousel-controls" aria-label="Navegación de sellos" style={vaultArtPlaneStyle}>
                  <button className="vault-seal-arrow-control" aria-label="Sello anterior" onClick={() => advanceVault(VAULT_INPUT.PREVIOUS)} type="button">
                     <Image className="vault-seal-arrow-icon" src={withPublicPath("/assets/icons/left.png")} alt="" aria-hidden="true" width={72} height={72} />
                  </button>
                  <button className="vault-seal-arrow-control" aria-label="Siguiente sello" onClick={() => advanceVault(VAULT_INPUT.NEXT)} type="button">
                     <Image className="vault-seal-arrow-icon" src={withPublicPath("/assets/icons/right.png")} alt="" aria-hidden="true" width={72} height={72} />
                  </button>
                </div>
                <div className="vault-riddle-panel">
                  <div className="vault-interface-title-row">
                    <h1 id="vault-shell-title" className="vault-interface-title">
                      Tres sellos antes de entrar.
                    </h1>
                  </div>
                  <p id="vault-shell-status" className="lead vault-interface-guidance" role="status" aria-label={sealGuidance}>
                    {isMobileViewport ? (
                      sealGuidance
                    ) : (
                      "Recorre los sellos con las flechas o haz click sobre ellos."
                    )}
                  </p>

                  <div className="vault-dialogue-copy" aria-hidden="true" />

                 <div className="vault-controls" aria-label="Controles de la bóveda">
                    <Button
                      aria-label="Mis obras en construcción"
                      className="vault-mainhall-action"
                      data-vault-primary-action="main-hall"
                      disabled={!hasUnlockedAllSeals}
                      onClick={unlockMainHall}
                      onKeyDown={handleMainHallActionKeyDown}
                      onKeyUp={handleMainHallActionKeyUp}
                      type="button"
                      variant="primary"
                    >
                      Mis obras en construcción
                    </Button>
                    {cinematicFailure ? <p className="vault-mainhall-lock-alert" role="alert">La sala principal permanece bloqueada. Completa los tres sellos para volver a intentarlo.</p> : null}
                  </div>
                </div>
                </div>
                {hasSelectedSeal && isSealDialogOpen ? (
                  <div className="vault-seal-modal" onMouseDown={handleSealDialogBackdropClick} role="presentation">
                    <article
                      aria-labelledby={`${activeStep.id}-dialog-heading`}
                      aria-modal="true"
                      className="vault-seal-sheet"
                      onKeyDown={handleSealDialogKeyDown}
                      ref={sealDialogRef}
                      role="dialog"
                      tabIndex={-1}
                    >
                      <button aria-label="Cerrar sello" className="vault-seal-close" onClick={() => closeSealDialog()} ref={sealDialogCloseRef} type="button">
                        <span aria-hidden="true">×</span>
                      </button>
                      <h2 id={`${activeStep.id}-dialog-heading`}>{activeStep.title}</h2>
                      {activeStep.reflection.map((paragraph) => (
                        <p className="vault-clue" key={paragraph}>{paragraph}</p>
                      ))}
                    </article>
                  </div>
                ) : null}
              </div>
            )}

            <VisuallyHidden>
              Soporte de teclado: flecha derecha avanza y flecha izquierda retrocede.
            </VisuallyHidden>
          </>
        )}
      </div>
      {cinematicRequested ? <VaultCinematicTransition onVisible={() => { grantMainHallAfterValidFlow(); setCinematicRequested(false); }} /> : null}
    </section>
  );
}

export function VaultShell() {
  return (
    <MotionPreferenceProvider>
      <VaultShellIsland />
    </MotionPreferenceProvider>
  );
}
