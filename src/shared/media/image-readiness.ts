const IMAGE_READY_PHASE = {
  DEGRADED: "degraded",
  READY: "ready",
} as const;

export type ImageReadyPhase =
  (typeof IMAGE_READY_PHASE)[keyof typeof IMAGE_READY_PHASE];

export interface ImageReadinessResult {
  phase: ImageReadyPhase;
  src: string;
}

const IMAGE_READY_TIMEOUT_MS = 2_500;
const readinessCache = new Map<string, Promise<ImageReadinessResult>>();

function cachedImageIsReady(image: HTMLImageElement) {
  return image.complete && image.naturalWidth > 0;
}

export function prepareImageReadiness(
  src: string,
  timeoutMs = IMAGE_READY_TIMEOUT_MS,
): Promise<ImageReadinessResult> {
  const cached = readinessCache.get(src);
  if (cached !== undefined) return cached;

  const readiness = new Promise<ImageReadinessResult>((resolve) => {
    const image = new window.Image();
    let settled = false;
    const timeout = window.setTimeout(
      () => finish(IMAGE_READY_PHASE.DEGRADED),
      timeoutMs,
    );
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      window.clearTimeout(timeout);
    };
    const finish = (phase: ImageReadyPhase) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ phase, src });
    };
    const decodeAndFinish = () => {
      const decode =
        typeof image.decode === "function" ? image.decode() : Promise.resolve();
      void decode.then(
        () => {
          finish(
            cachedImageIsReady(image)
              ? IMAGE_READY_PHASE.READY
              : IMAGE_READY_PHASE.DEGRADED,
          );
        },
        () => {
          finish(IMAGE_READY_PHASE.DEGRADED);
        },
      );
    };
    image.decoding = "async";
    image.fetchPriority = "low";
    image.onload = decodeAndFinish;
    image.onerror = () => finish(IMAGE_READY_PHASE.DEGRADED);
    image.src = src;
    if (cachedImageIsReady(image)) decodeAndFinish();
  });

  readinessCache.set(src, readiness);
  return readiness;
}

export function clearImageReadinessCache() {
  readinessCache.clear();
}
