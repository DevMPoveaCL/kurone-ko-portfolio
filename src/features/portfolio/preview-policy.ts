import { useEffect, useRef, useState } from "react";

export const PREVIEW_VIDEO_POLICY = {
  ALLOW: "allow",
  BLOCKED_INACTIVE: "blocked-inactive",
  BLOCKED_HIDDEN: "blocked-hidden",
  BLOCKED_REDUCED_MOTION: "blocked-reduced-motion",
  BLOCKED_DATA_SAVER: "blocked-data-saver",
  BLOCKED_SLOW_NETWORK: "blocked-slow-network",
} as const;

export type PreviewVideoPolicy =
  (typeof PREVIEW_VIDEO_POLICY)[keyof typeof PREVIEW_VIDEO_POLICY];

export interface PreviewVideoSignals {
  isActive: boolean;
  isDocumentVisible: boolean;
  prefersReducedMotion: boolean;
  saveData: boolean;
  effectiveType?: string | undefined;
}

export function getPreviewVideoPolicy(
  signals: PreviewVideoSignals,
): PreviewVideoPolicy {
  if (!signals.isActive) return PREVIEW_VIDEO_POLICY.BLOCKED_INACTIVE;
  if (!signals.isDocumentVisible) return PREVIEW_VIDEO_POLICY.BLOCKED_HIDDEN;
  if (signals.prefersReducedMotion)
    return PREVIEW_VIDEO_POLICY.BLOCKED_REDUCED_MOTION;
  if (signals.saveData) return PREVIEW_VIDEO_POLICY.BLOCKED_DATA_SAVER;
  if (signals.effectiveType === "slow-2g" || signals.effectiveType === "2g")
    return PREVIEW_VIDEO_POLICY.BLOCKED_SLOW_NETWORK;
  return PREVIEW_VIDEO_POLICY.ALLOW;
}

interface PreviewNetworkInformation {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
}

interface PreviewWindowExtras {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
}

function getNetworkInformation(): PreviewNetworkInformation | undefined {
  return (navigator as Navigator & { connection?: PreviewNetworkInformation })
    .connection;
}

function readPreviewVideoSignals(isActive: boolean): PreviewVideoSignals {
  const network = getNetworkInformation();
  const reducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return {
    effectiveType: network?.effectiveType,
    isActive,
    isDocumentVisible: document.visibilityState !== "hidden",
    prefersReducedMotion: reducedMotion,
    saveData: network?.saveData === true,
  };
}

export function useProgressivePreviewVideo(
  isActive: boolean,
  hasVideo: boolean,
) {
  const [shouldMountVideo, setShouldMountVideo] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const shouldMountVideoRef = useRef(false);

  useEffect(() => {
    shouldMountVideoRef.current = false;
    const resetHandle = window.setTimeout(() => {
      setShouldMountVideo(false);
      setIsVideoReady(false);
    }, 0);
    if (!isActive || !hasVideo || typeof document === "undefined")
      return () => window.clearTimeout(resetHandle);

    const previewWindow = window as Window & PreviewWindowExtras;
    const reducedMotionQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    const network = getNetworkInformation();
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;

    const cancelMount = () => {
      if (
        idleHandle !== undefined &&
        previewWindow.cancelIdleCallback !== undefined
      )
        previewWindow.cancelIdleCallback(idleHandle);
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
    };

    const syncPolicy = () => {
      const policy = getPreviewVideoPolicy(readPreviewVideoSignals(isActive));
      if (policy !== PREVIEW_VIDEO_POLICY.ALLOW) {
        cancelMount();
        shouldMountVideoRef.current = false;
        setShouldMountVideo(false);
        setIsVideoReady(false);
        return;
      }

      if (shouldMountVideoRef.current) return;
      const mount = () => {
        shouldMountVideoRef.current = true;
        setShouldMountVideo(true);
      };
      if (previewWindow.requestIdleCallback !== undefined)
        idleHandle = previewWindow.requestIdleCallback(mount, {
          timeout: 1200,
        });
      else timeoutHandle = window.setTimeout(mount, 120);
    };

    const onVisibilityChange = () => syncPolicy();
    const onSignalChange = () => syncPolicy();

    syncPolicy();
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotionQuery?.addEventListener("change", onSignalChange);
    network?.addEventListener?.("change", onSignalChange);

    return () => {
      window.clearTimeout(resetHandle);
      cancelMount();
      shouldMountVideoRef.current = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotionQuery?.removeEventListener("change", onSignalChange);
      network?.removeEventListener?.("change", onSignalChange);
    };
  }, [hasVideo, isActive]);

  return {
    isVideoReady,
    markVideoError: () => {
      setIsVideoReady(false);
    },
    markVideoReady: () => setIsVideoReady(true),
    shouldMountVideo: isActive && shouldMountVideo,
  };
}
