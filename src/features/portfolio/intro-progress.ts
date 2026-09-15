export interface OpeningProgressViewport {
  width: number;
  height: number;
}

const OPENING_PROGRESS = {
  MIN: 0,
  MAX: 1,
} as const;

const OPENING_COMPLETION_CROSSFADE = {
  START: 0.92,
  END: 1,
} as const;

const PHONE_PORTRAIT_OPENING_POINT = { aspectRatio: 390 / 844, completionProgress: 0.45 } as const;
const TABLET_PORTRAIT_OPENING_POINT = { aspectRatio: 768 / 1024, completionProgress: 0.7 } as const;
const NEAR_SQUARE_TABLET_OPENING_POINT = { aspectRatio: 0.95, completionProgress: 0.65 } as const;
const SQUARE_TABLET_OPENING_POINT = { aspectRatio: 1, completionProgress: 0.65 } as const;
const LANDSCAPE_OPENING_POINT = { aspectRatio: 16 / 9, completionProgress: 1 } as const;

function clampProgress(progress: number) {
  return Math.min(OPENING_PROGRESS.MAX, Math.max(OPENING_PROGRESS.MIN, progress));
}

function interpolate(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

function easeOutCubic(amount: number) {
  return 1 - (1 - amount) ** 3;
}

export function getVisualOpeningCompletionProgress(viewport: OpeningProgressViewport) {
  const aspectRatio = viewport.height > 0 ? viewport.width / viewport.height : 1;

  if (aspectRatio <= PHONE_PORTRAIT_OPENING_POINT.aspectRatio) {
    return PHONE_PORTRAIT_OPENING_POINT.completionProgress;
  }

  if (aspectRatio <= TABLET_PORTRAIT_OPENING_POINT.aspectRatio) {
    const range = TABLET_PORTRAIT_OPENING_POINT.aspectRatio - PHONE_PORTRAIT_OPENING_POINT.aspectRatio;
    const amount = (aspectRatio - PHONE_PORTRAIT_OPENING_POINT.aspectRatio) / range;

    return interpolate(PHONE_PORTRAIT_OPENING_POINT.completionProgress, TABLET_PORTRAIT_OPENING_POINT.completionProgress, amount);
  }

  if (aspectRatio <= NEAR_SQUARE_TABLET_OPENING_POINT.aspectRatio) {
    const range = NEAR_SQUARE_TABLET_OPENING_POINT.aspectRatio - TABLET_PORTRAIT_OPENING_POINT.aspectRatio;
    const amount = (aspectRatio - TABLET_PORTRAIT_OPENING_POINT.aspectRatio) / range;

    return interpolate(TABLET_PORTRAIT_OPENING_POINT.completionProgress, NEAR_SQUARE_TABLET_OPENING_POINT.completionProgress, amount);
  }

  if (aspectRatio <= SQUARE_TABLET_OPENING_POINT.aspectRatio) {
    return SQUARE_TABLET_OPENING_POINT.completionProgress;
  }

  if (aspectRatio <= LANDSCAPE_OPENING_POINT.aspectRatio) {
    const range = LANDSCAPE_OPENING_POINT.aspectRatio - SQUARE_TABLET_OPENING_POINT.aspectRatio;
    const amount = (aspectRatio - SQUARE_TABLET_OPENING_POINT.aspectRatio) / range;

    return interpolate(SQUARE_TABLET_OPENING_POINT.completionProgress, LANDSCAPE_OPENING_POINT.completionProgress, amount);
  }

  return LANDSCAPE_OPENING_POINT.completionProgress;
}

export function getDisplayedOpeningProgress(rawProgress: number, viewport: OpeningProgressViewport) {
  const completionProgress = getVisualOpeningCompletionProgress(viewport);

  if (completionProgress <= 0) {
    return OPENING_PROGRESS.MAX;
  }

  return clampProgress(rawProgress / completionProgress);
}

export function getOpeningCompletionCrossfade(displayedProgress: number) {
  const normalizedProgress = clampProgress(displayedProgress);

  if (normalizedProgress <= OPENING_COMPLETION_CROSSFADE.START) {
    return OPENING_PROGRESS.MIN;
  }

  const range = OPENING_COMPLETION_CROSSFADE.END - OPENING_COMPLETION_CROSSFADE.START;
  const amount = (normalizedProgress - OPENING_COMPLETION_CROSSFADE.START) / range;

  return easeOutCubic(clampProgress(amount));
}
