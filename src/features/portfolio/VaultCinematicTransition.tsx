"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { reportBrowserObservation } from "@/app/Observability";
import { withPublicPath } from "@/shared/routing/public-path";
import {
  CINEMATIC_STALL_TIMEOUT_MS,
  CINEMATIC_STARTUP_TIMEOUT_MS,
  shouldBypassVaultCinematic,
} from "./vault-cinematic";

interface ConnectionLike {
  effectiveType?: string;
  saveData?: boolean;
}

export interface VaultCinematicTraversalEvent extends Event {
  navigationType?: string;
  destination?: {
    sameDocument?: boolean;
  };
}

export interface VaultCinematicNavigationAdapter {
  addTraversalListener(listener: (event: VaultCinematicTraversalEvent) => void): () => void;
}

function isCancelableSameDocumentTraversal(event: VaultCinematicTraversalEvent) {
  return event.navigationType === "traverse" && event.cancelable && event.destination?.sameDocument === true;
}

export function createBrowserNavigationAdapter(): VaultCinematicNavigationAdapter | null {
  const navigation = (window as Window & { navigation?: EventTarget }).navigation;

  if (navigation === undefined || typeof navigation.addEventListener !== "function") return null;

  return {
    addTraversalListener(listener) {
      const onNavigate = (event: Event) => {
        const traversalEvent = event as VaultCinematicTraversalEvent;
        if (isCancelableSameDocumentTraversal(traversalEvent)) listener(traversalEvent);
      };
      navigation.addEventListener("navigate", onNavigate);
      return () => navigation.removeEventListener("navigate", onNavigate);
    },
  };
}

function capabilities() {
  const navigatorWithHints = navigator as Navigator & { connection?: ConnectionLike; deviceMemory?: number };
  const video = document.createElement("video");
  const media = typeof window.matchMedia === "function" ? window.matchMedia.bind(window) : null;

  return {
    coarse: media?.("(pointer: coarse)").matches,
    deviceMemory: navigatorWithHints.deviceMemory,
    effectiveType: navigatorWithHints.connection?.effectiveType,
    hardwareConcurrency: navigatorWithHints.hardwareConcurrency,
    reducedMotion: media?.("(prefers-reduced-motion: reduce)").matches,
    saveData: navigatorWithHints.connection?.saveData,
    supported: media !== null && video.canPlayType("video/webm") !== "",
    width: window.innerWidth,
  };
}

export function VaultCinematicTransition({ onVisible, navigationAdapter }: { onVisible(): void; navigationAdapter?: VaultCinematicNavigationAdapter }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef(false);
  const generationRef = useRef(0);
  const navigationCleanupRef = useRef<(() => void) | undefined>(undefined);
  const startupRef = useRef<number | undefined>(undefined);
  const stallRef = useRef<number | undefined>(undefined);
  const startedAtRef = useRef<number | undefined>(undefined);
  const playStartedRef = useRef(false);
  const playingObservedRef = useRef(false);
  const onVisibleRef = useRef(onVisible);
  const [browserNavigationAdapter] = useState(createBrowserNavigationAdapter);
  const activeNavigationAdapter = navigationAdapter ?? browserNavigationAdapter;
  const [active] = useState(() => !shouldBypassVaultCinematic(capabilities()));
  const [isVisualReady, setIsVisualReady] = useState(false);
  const clearStall = () => window.clearTimeout(stallRef.current);

  useEffect(() => {
    onVisibleRef.current = onVisible;
  }, [onVisible]);

  const finish = useCallback((generation: number, reason: string) => {
    if (generation !== generationRef.current || doneRef.current) return;
    doneRef.current = true;
    window.clearTimeout(startupRef.current);
    window.clearTimeout(stallRef.current);
    navigationCleanupRef.current?.();
    navigationCleanupRef.current = undefined;
    if (reason === "ended" && startedAtRef.current !== undefined) {
      reportBrowserObservation({ kind: "cinematic-latency", name: "completion", value: Math.round(performance.now() - startedAtRef.current) });
    } else if (!["skip", "back", "bypass"].includes(reason)) {
      reportBrowserObservation({ kind: "cinematic-failure", name: reason });
    }
    onVisibleRef.current();
  }, []);
  useLayoutEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    doneRef.current = false;

    if (!active) {
      finish(generation, "bypass");
      return;
    }

    startedAtRef.current = performance.now();
    playStartedRef.current = false;
    playingObservedRef.current = false;
    startupRef.current = window.setTimeout(() => finish(generation, "startup-timeout"), CINEMATIC_STARTUP_TIMEOUT_MS);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish(generation, "skip");
      }
      if (event.key === "Tab") {
        event.preventDefault();
        skipRef.current?.focus();
      }
    };
    const video = videoRef.current;
    const onCanPlay = () => {
      setIsVisualReady(true);
      if (playStartedRef.current) return;
      playStartedRef.current = true;
      void video?.play().catch(() => finish(generation, "play-rejected"));
    };
    const onPlaying = () => {
      setIsVisualReady(true);
      window.clearTimeout(startupRef.current);
      clearStall();
      if (!playingObservedRef.current && startedAtRef.current !== undefined) {
        playingObservedRef.current = true;
        reportBrowserObservation({ kind: "cinematic-latency", name: "cta-to-playing", value: Math.round(performance.now() - startedAtRef.current) });
      }
    };
    const onStalled = () => {
      clearStall();
      stallRef.current = window.setTimeout(() => finish(generation, "stalled"), CINEMATIC_STALL_TIMEOUT_MS);
    };
    const onProgress = () => clearStall();
    const onEnded = () => finish(generation, "ended");
    const onError = () => finish(generation, "error");
    const onAbort = () => finish(generation, "abort");
    window.addEventListener("keydown", onKeyDown);
    video?.addEventListener("canplay", onCanPlay);
    video?.addEventListener("playing", onPlaying);
    video?.addEventListener("stalled", onStalled);
    video?.addEventListener("progress", onProgress);
    video?.addEventListener("timeupdate", onProgress);
    video?.addEventListener("ended", onEnded);
    video?.addEventListener("error", onError);
    video?.addEventListener("abort", onAbort);
    navigationCleanupRef.current = activeNavigationAdapter?.addTraversalListener((event) => {
      if (!isCancelableSameDocumentTraversal(event)) return;
      event.preventDefault();
      finish(generation, "back");
    });
    return () => {
      if (generationRef.current === generation) generationRef.current += 1;
      window.clearTimeout(startupRef.current);
      window.clearTimeout(stallRef.current);
      window.removeEventListener("keydown", onKeyDown);
      video?.removeEventListener("canplay", onCanPlay);
      video?.removeEventListener("playing", onPlaying);
      video?.removeEventListener("stalled", onStalled);
      video?.removeEventListener("progress", onProgress);
      video?.removeEventListener("timeupdate", onProgress);
      video?.removeEventListener("ended", onEnded);
      video?.removeEventListener("error", onError);
      video?.removeEventListener("abort", onAbort);
      navigationCleanupRef.current?.();
      navigationCleanupRef.current = undefined;
    };
  }, [active, activeNavigationAdapter, finish]);

  useEffect(() => {
    if (active) dialogRef.current?.focus({ preventScroll: true });
  }, [active]);

  if (!active) return null;
  return (
    <div
      aria-label="Transición a la sala principal"
      aria-modal="true"
      className="vault-cinematic"
      data-visual-ready={isVisualReady}
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
    >
      <video
        aria-hidden="true"
        autoPlay={false}
        muted
        playsInline
        poster={withPublicPath("/assets/intro/kurOpenVault-poster.webp")}
        onLoadedData={() => setIsVisualReady(true)}
        preload="auto"
        ref={videoRef}
        src={withPublicPath("/assets/intro/kurOpenVault.webm")}
      />
      <button className="vault-cinematic-skip" onClick={() => finish(generationRef.current, "skip")} ref={skipRef} type="button">Saltar introducción</button>
    </div>
  );
}
