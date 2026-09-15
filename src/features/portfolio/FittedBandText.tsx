"use client";

import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export const FITTED_BAND_TEXT_ROLE = {
  MOBILE_QUOTE: "mobile-quote",
  QUOTE: "quote",
  TITLE: "title",
  SUBTITLE: "subtitle",
} as const;

export const FITTED_BAND_TEXT_BOUNDARY = {
  PARENT: 1,
  GRANDPARENT: 2,
  GREAT_GRANDPARENT: 3,
} as const;

type FittedBandTextBoundary =
  (typeof FITTED_BAND_TEXT_BOUNDARY)[keyof typeof FITTED_BAND_TEXT_BOUNDARY];

export type FittedBandTextRole =
  (typeof FITTED_BAND_TEXT_ROLE)[keyof typeof FITTED_BAND_TEXT_ROLE];

interface FittedBandTextToken {
  outerStrokeEm: number;
  lightStrokeEm: number;
  emergencyMinFontSize: number;
  inkSafeBlockEm: number;
  inkSafeInlineEm: number;
  lineHeight: number;
  maxFontSize: number;
  minFontSize: number;
  shadowXEm: number;
  shadowYEm: number;
}

interface FittedBandTextMeasurementIdentity {
  content: string;
  fontFingerprint: string;
  fitBoundary: FittedBandTextBoundary;
  height: number;
  role: FittedBandTextRole;
  width: number;
}

interface FittedBandTextFitResult {
  blockInset: number;
  fontSize: number;
  inlineShift: number;
  inlineInset: number;
  proof?: {
    maxedOut: boolean;
    nextCandidate: number | null;
    nextFits: boolean | null;
  };
}

const FITTED_BAND_TEXT_CACHE_LIMIT = 8;

export const FITTED_BAND_TEXT_TOKENS: Record<
  FittedBandTextRole,
  FittedBandTextToken
> = {
  [FITTED_BAND_TEXT_ROLE.TITLE]: {
    emergencyMinFontSize: 1,
    inkSafeBlockEm: 0.075,
    inkSafeInlineEm: 0.025,
    lineHeight: 0.94,
    lightStrokeEm: 0.045,
    maxFontSize: 43.2,
    minFontSize: 8,
    outerStrokeEm: 0.095,
    shadowXEm: 0.055,
    shadowYEm: 0.055,
  },
  [FITTED_BAND_TEXT_ROLE.QUOTE]: {
    emergencyMinFontSize: 10,
    inkSafeBlockEm: 0,
    inkSafeInlineEm: 0,
    lineHeight: 1.1,
    lightStrokeEm: 0,
    maxFontSize: 20,
    minFontSize: 16,
    outerStrokeEm: 0,
    shadowXEm: 0,
    shadowYEm: 0,
  },
  [FITTED_BAND_TEXT_ROLE.MOBILE_QUOTE]: {
    emergencyMinFontSize: 13,
    inkSafeBlockEm: 0,
    inkSafeInlineEm: 0,
    lineHeight: 1.3,
    lightStrokeEm: 0,
    maxFontSize: 17,
    minFontSize: 15,
    outerStrokeEm: 0,
    shadowXEm: 0,
    shadowYEm: 0,
  },
  [FITTED_BAND_TEXT_ROLE.SUBTITLE]: {
    emergencyMinFontSize: 1,
    inkSafeBlockEm: 0.1,
    inkSafeInlineEm: 0.04,
    lineHeight: 0.98,
    lightStrokeEm: 0.028,
    maxFontSize: 24,
    minFontSize: 11,
    outerStrokeEm: 0,
    shadowXEm: 0.04,
    shadowYEm: 0.04,
  },
};

interface FontFitMeasurement {
  clientHeight: number;
  clientWidth: number;
  rectHeight: number;
  rectWidth: number;
  safeHeight: number;
  safeWidth: number;
  scrollHeight: number;
  scrollWidth: number;
}

export interface FontFitOptions {
  emergencyMinFontSize?: number;
  maxFontSize: number;
  maxIterations?: number;
  measure: (fontSize: number) => FontFitMeasurement;
  minFontSize: number;
  onProof?: (proof: {
    maxedOut: boolean;
    nextCandidate: number | null;
    nextFits: boolean | null;
  }) => void;
}

export function findFittingFontSize({
  emergencyMinFontSize = 1,
  maxFontSize,
  maxIterations = 18,
  measure,
  minFontSize,
  onProof,
}: FontFitOptions): number {
  const lowerBound = Math.max(0.1, Math.min(emergencyMinFontSize, maxFontSize));
  const semanticLowerBound = Math.max(
    lowerBound,
    Math.min(minFontSize, maxFontSize),
  );
  let lower = semanticLowerBound;
  let upper = Math.max(lowerBound, maxFontSize);
  let lastRejectedCandidate: number | null = null;

  const fits = (fontSize: number) => {
    const result = measure(fontSize);
    return (
      result.scrollWidth <= result.clientWidth + 1 &&
      result.scrollHeight <= result.clientHeight + 1 &&
      result.rectWidth <= result.safeWidth &&
      result.rectHeight <= result.safeHeight
    );
  };

  if (fits(upper)) {
    onProof?.({ maxedOut: true, nextCandidate: null, nextFits: null });
    return upper;
  }
  lastRejectedCandidate = upper;
  if (!fits(lower)) {
    lower = lowerBound;
    if (!fits(lower)) {
      onProof?.({
        maxedOut: false,
        nextCandidate: lower,
        nextFits: false,
      });
      return lower;
    }
  }

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const candidate = (lower + upper) / 2;
    if (fits(candidate)) {
      lower = candidate;
    } else {
      upper = candidate;
      lastRejectedCandidate = candidate;
    }
  }

  onProof?.({
    maxedOut: false,
    nextCandidate: lastRejectedCandidate,
    nextFits: lastRejectedCandidate === null ? null : false,
  });

  return lower;
}

interface FittedBandTextProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "children"
> {
  as?: "h3" | "p" | "span";
  children: ReactNode;
  enabled?: boolean;
  fitBoundary?: FittedBandTextBoundary;
  role: FittedBandTextRole;
}

export type FittedBandTextComponentProps = FittedBandTextProps;

function isRenderableText(value: ReactNode): value is string {
  return typeof value === "string";
}

export function FittedBandText({
  as,
  children,
  className,
  enabled = true,
  fitBoundary = FITTED_BAND_TEXT_BOUNDARY.PARENT,
  role,
  style,
  ...attributes
}: FittedBandTextComponentProps) {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const lastFittedMeasurementRef =
    useRef<FittedBandTextMeasurementIdentity | null>(null);
  const fitCacheRef = useRef<Map<string, FittedBandTextFitResult>>(new Map());
  const fontRevisionRef = useRef(0);
  const verifiedFontFingerprintRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    const text = textRef.current;
    if (container === null || text === null || !isRenderableText(children)) {
      return;
    }
    let safeContainer: HTMLElement = container;
    for (let level = 0; level < fitBoundary; level += 1) {
      safeContainer = safeContainer.parentElement ?? safeContainer;
    }

    const getSafeSize = () => {
      const computedStyle = getComputedStyle(safeContainer);
      const toPixels = (value: string) => Number.parseFloat(value) || 0;
      const paddingInline =
        toPixels(computedStyle.paddingInlineStart) +
        toPixels(computedStyle.paddingInlineEnd);
      const paddingBlock =
        toPixels(computedStyle.paddingBlockStart) +
        toPixels(computedStyle.paddingBlockEnd);

      return {
        height: Math.max(0, safeContainer.clientHeight - paddingBlock),
        width: Math.max(0, safeContainer.clientWidth - paddingInline),
      };
    };

    const token = FITTED_BAND_TEXT_TOKENS[role];
    const computedStyle = getComputedStyle(text);
    const getBaseFontFingerprint = () => {
      const style = getComputedStyle(text);
      return [
        style.fontFamily,
        style.fontStyle,
        style.fontVariant,
        style.fontWeight,
        style.fontStretch,
        style.fontFeatureSettings,
        style.letterSpacing,
        style.fontKerning,
      ].join("|");
    };
    const getFontFingerprint = () =>
      `${getBaseFontFingerprint()}|${fontRevisionRef.current}`;
    const originalOpacity = text.style.opacity;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const rootFontSize =
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
      16;
    const baseFontSize = Number.parseFloat(computedStyle.fontSize) || 16;
    const shadowExtentPx = (computedStyle.textShadow.match(
      /-?\d*\.?\d+(?:px|rem|em)/g,
    ) ?? []).reduce((extent, value) => {
      const amount = Number.parseFloat(value);
      if (value.endsWith("rem")) return Math.max(extent, amount * rootFontSize);
      if (value.endsWith("em")) return Math.max(extent, amount * baseFontSize);
      return Math.max(extent, amount);
    }, 0);
    const textStrokeExtentPx =
      (Number.parseFloat(
        computedStyle.getPropertyValue("-webkit-text-stroke-width"),
      ) || 0) / 2;
    const cssEffectInlineExtentPx = Math.max(
      shadowExtentPx,
      textStrokeExtentPx,
    );
    const letterCount = Array.from(children).length;
    const originalTextIndent = text.style.textIndent;
    const recordDebug = (event: () => Record<string, unknown>) => {
      const debugWindow = window as Window & {
        __fittedBandTextDebugEvents?: Array<Record<string, unknown>>;
      };
      if (debugWindow.__fittedBandTextDebugEvents === undefined) return;
      debugWindow.__fittedBandTextDebugEvents.push({
        ...event(),
        time: Number(performance.now().toFixed(3)),
      });
    };
    const getDebugGeometry = () => {
      const safeRect = safeContainer.getBoundingClientRect();
      const item = safeContainer.closest<HTMLElement>(
        ".project-showcase-item",
      );
      const itemStyle = item === null ? null : getComputedStyle(item);
      return {
        card:
          item === null
            ? null
            : {
                active: item.getAttribute("data-active"),
                ringVisualState: item.getAttribute("data-ring-visual-state"),
                transform: itemStyle?.transform ?? "none",
              },
        safeContainer: {
          clientHeight: safeContainer.clientHeight,
          clientWidth: safeContainer.clientWidth,
          rect: {
            bottom: safeRect.bottom,
            height: safeRect.height,
            left: safeRect.left,
            right: safeRect.right,
            top: safeRect.top,
            width: safeRect.width,
          },
          transform: getComputedStyle(safeContainer).transform,
        },
      };
    };
    const canMeasureSubtitleDom =
      role === FITTED_BAND_TEXT_ROLE.SUBTITLE &&
      typeof document.createRange().getBoundingClientRect === "function";
    const subtitleMeasurementSurface =
      canMeasureSubtitleDom
        ? document.createElement("span")
        : null;

    if (subtitleMeasurementSurface !== null) {
      subtitleMeasurementSurface.textContent = children;
      subtitleMeasurementSurface.setAttribute("aria-hidden", "true");
      subtitleMeasurementSurface.tabIndex = -1;
      for (let index = 0; index < computedStyle.length; index += 1) {
        const property = computedStyle.item(index);
        if (property !== null) {
          subtitleMeasurementSurface.style.setProperty(
            property,
            computedStyle.getPropertyValue(property),
          );
        }
      }
      subtitleMeasurementSurface.style.setProperty(
        "position",
        "fixed",
        "important",
      );
      subtitleMeasurementSurface.style.setProperty(
        "inset",
        "-100000px auto auto -100000px",
        "important",
      );
      subtitleMeasurementSurface.style.setProperty(
        "display",
        "block",
        "important",
      );
      subtitleMeasurementSurface.style.setProperty(
        "visibility",
        "hidden",
        "important",
      );
      subtitleMeasurementSurface.style.setProperty(
        "pointer-events",
        "none",
        "important",
      );
      subtitleMeasurementSurface.style.setProperty(
        "transform",
        "none",
        "important",
      );
      subtitleMeasurementSurface.style.setProperty(
        "contain",
        "layout style paint",
        "important",
      );
      subtitleMeasurementSurface.style.setProperty(
        "box-sizing",
        "border-box",
        "important",
      );
      subtitleMeasurementSurface.style.setProperty(
        "width",
        "max-content",
        "important",
      );
      subtitleMeasurementSurface.style.setProperty(
        "height",
        "auto",
        "important",
      );
      subtitleMeasurementSurface.style.setProperty(
        "margin",
        "0",
        "important",
      );
      subtitleMeasurementSurface.style.setProperty(
        "padding",
        "0",
        "important",
      );
      subtitleMeasurementSurface.style.setProperty(
        "text-indent",
        "0",
        "important",
      );
      document.body.append(subtitleMeasurementSurface);
    }

    const applyCandidate = (
      fontSize: number,
      inlineShift = 0,
    ): FittedBandTextFitResult => {
      const inlineInset =
        fontSize *
          (token.outerStrokeEm + token.shadowXEm + token.inkSafeInlineEm) +
        cssEffectInlineExtentPx +
        0.75;
      const blockInset =
        fontSize *
          (token.outerStrokeEm + token.shadowYEm + token.inkSafeBlockEm) +
        0.75;
      for (const element of [container, text]) {
        element.style.setProperty("transition", "none", "important");
        element.style.setProperty("--fitted-font-size", `${fontSize}px`);
        element.style.setProperty(
          "--fitted-ink-inline-inset",
          `${inlineInset}px`,
        );
        element.style.setProperty(
          "--fitted-ink-block-inset",
          `${blockInset}px`,
        );
        element.style.setProperty(
          "--fitted-ink-safe-inline",
          `${fontSize * token.inkSafeInlineEm}px`,
        );
        element.style.setProperty(
          "--fitted-ink-safe-block",
          `${fontSize * token.inkSafeBlockEm}px`,
        );
        element.style.setProperty(
          "--band-light-keyline",
          `${token.lightStrokeEm}em`,
        );
        element.style.setProperty(
          "--band-outer-stroke",
          `${token.outerStrokeEm}em`,
        );
        element.style.setProperty("--band-shadow-x", `${token.shadowXEm}em`);
        element.style.setProperty("--band-shadow-y", `${token.shadowYEm}em`);
      }
      text.style.fontSize = `${fontSize}px`;
      text.style.textIndent =
        inlineShift === 0 ? originalTextIndent : `${inlineShift}px`;
      return { blockInset, fontSize, inlineInset, inlineShift };
    };
    const cacheKey = (
      safeSize: { height: number; width: number },
      fontFingerprint: string,
    ) =>
      [
        children,
        fitBoundary,
        role,
        fontFingerprint,
        Math.round(safeSize.width * 100) / 100,
        Math.round(safeSize.height * 100) / 100,
      ].join("|");
    const rememberFit = (key: string, result: FittedBandTextFitResult) => {
      fitCacheRef.current.delete(key);
      if (fitCacheRef.current.size >= FITTED_BAND_TEXT_CACHE_LIMIT) {
        const oldestKey = fitCacheRef.current.keys().next().value;
        if (oldestKey !== undefined) fitCacheRef.current.delete(oldestKey);
      }
      fitCacheRef.current.set(key, result);
    };
    let animationFrame: number | null = null;
    let disposed = false;
    let fontVerified = false;
    let fontGateGeneration = 0;

    const fit = () => {
      animationFrame = null;
      if (disposed || !fontVerified) return false;
      const safeSize = getSafeSize();
      if (safeSize.width <= 0 || safeSize.height <= 0) return false;
      const fitStyle = getComputedStyle(text);
      const baseFontFingerprint = getBaseFontFingerprint();
      const letterSpacing = Number.parseFloat(fitStyle.letterSpacing) || 0;
      const fontFingerprint = getFontFingerprint();
      const key = cacheKey(safeSize, fontFingerprint);
      const cachedResult = fitCacheRef.current.get(key);
      if (cachedResult !== undefined) {
        applyCandidate(cachedResult.fontSize, cachedResult.inlineShift);
        recordDebug(() => ({
          ...getDebugGeometry(),
          baseFontFingerprint,
          cacheHit: true,
          cacheKey: key,
          content: children,
          fitBoundary,
          fontFingerprint,
          fontRevision: fontRevisionRef.current,
          fontSize: cachedResult.fontSize,
          maxFontSize: null,
          proof: cachedResult.proof ?? null,
          role,
          safeSize,
          type: "fit-result",
        }));
        lastFittedMeasurementRef.current = {
          content: children,
          fitBoundary,
          fontFingerprint,
          height: safeSize.height,
          role,
          width: safeSize.width,
        };
        return true;
      }

      const maxFontSize = Math.min(
        token.maxFontSize,
        Math.max(
          token.emergencyMinFontSize,
          (safeSize.height - 1) / token.lineHeight,
        ),
      );
      let inlineShift = 0;
      let fitProof: {
        maxedOut: boolean;
        nextCandidate: number | null;
        nextFits: boolean | null;
      } | null = null;
      const getOpticalInlineShift = (metrics: TextMetrics) =>
        Math.max(
          -4,
          Math.min(
            4,
            -(
              metrics.actualBoundingBoxRight -
              metrics.actualBoundingBoxLeft -
              metrics.width
            ) / 2,
          ),
        );
      const fontSize = findFittingFontSize({
        emergencyMinFontSize: token.emergencyMinFontSize,
        maxFontSize,
        measure: (candidate) => {
          const { blockInset, inlineInset } = applyCandidate(candidate);
          if (context === null) {
          const fallbackWidth =
              candidate * letterCount * 0.56 +
              Math.max(0, letterCount - 1) * letterSpacing;
            return {
              clientHeight: safeSize.height,
              clientWidth: safeSize.width,
              rectHeight: candidate * token.lineHeight,
              rectWidth: fallbackWidth,
              safeHeight: Math.max(0, safeSize.height - blockInset * 2),
              safeWidth: Math.max(0, safeSize.width - inlineInset * 2),
              scrollHeight: candidate * token.lineHeight,
              scrollWidth: fallbackWidth,
            };
          }
          context.font = [
            fitStyle.fontStyle,
            fitStyle.fontVariant,
            fitStyle.fontWeight,
            `${candidate}px`,
            fitStyle.fontFamily,
          ].join(" ");
          const metrics = context.measureText(children);
          const hasInkBounds =
            Number.isFinite(metrics.actualBoundingBoxLeft) &&
            Number.isFinite(metrics.actualBoundingBoxRight);
          const glyphWidth = hasInkBounds
            ? metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight
            : metrics.width;
          if (role === FITTED_BAND_TEXT_ROLE.SUBTITLE && hasInkBounds) {
            inlineShift = getOpticalInlineShift(metrics);
          }
          const measuredWidth =
            (Math.max(metrics.width, glyphWidth) +
              Math.max(0, letterCount - 1) * letterSpacing) *
            1.02;
          const lineBoxHeight = candidate * token.lineHeight;
          if (role !== FITTED_BAND_TEXT_ROLE.SUBTITLE) {
            return {
              clientHeight: safeSize.height,
              clientWidth: safeSize.width,
              rectHeight: lineBoxHeight,
              rectWidth: measuredWidth,
              safeHeight: Math.max(0, safeSize.height - blockInset * 2),
              safeWidth: Math.max(0, safeSize.width - inlineInset * 2),
              scrollHeight: lineBoxHeight,
              scrollWidth: measuredWidth,
            };
          }
          if (subtitleMeasurementSurface !== null) {
            subtitleMeasurementSurface.style.setProperty(
              "font-size",
              `${candidate}px`,
              "important",
            );
            subtitleMeasurementSurface.style.setProperty(
              "letter-spacing",
              fitStyle.letterSpacing,
              "important",
            );
            const range = document.createRange();
            range.selectNodeContents(subtitleMeasurementSurface.firstChild!);
            if (typeof range.getBoundingClientRect === "function") {
              const rangeRect = range.getBoundingClientRect();
              if (rangeRect.width > 0 && rangeRect.height > 0) {
                const effectExtent = cssEffectInlineExtentPx * 2;
                const measuredClientWidth =
                  text.clientWidth || Math.max(0, safeSize.width - inlineInset * 2);
                const measuredClientHeight =
                  text.clientHeight || Math.max(0, safeSize.height - blockInset * 2);
                const measuredScrollWidth =
                  text.scrollWidth || rangeRect.width + effectExtent;
                const measuredScrollHeight =
                  text.scrollHeight || rangeRect.height;
                return {
                  clientHeight: measuredClientHeight,
                  clientWidth: measuredClientWidth,
                  rectHeight: rangeRect.height,
                  rectWidth: rangeRect.width + effectExtent,
                  safeHeight: Math.max(0, safeSize.height - blockInset * 2),
                  safeWidth: Math.max(0, safeSize.width - inlineInset * 2),
                  scrollHeight: measuredScrollHeight,
                  scrollWidth: Math.max(
                    measuredScrollWidth,
                    rangeRect.width + effectExtent,
                  ),
                };
              }
            }
          }
          const textRect = text.getBoundingClientRect();
          let inkRect = textRect;
          if (text.firstChild !== null) {
            const range = document.createRange();
            range.selectNodeContents(text.firstChild);
            if (typeof range.getBoundingClientRect === "function") {
              const rangeRect = range.getBoundingClientRect();
              if (rangeRect.width > 0 && rangeRect.height > 0) {
                inkRect = rangeRect;
              }
            }
          }
          return {
            clientHeight: text.clientHeight || lineBoxHeight,
            clientWidth: text.clientWidth || safeSize.width,
            rectHeight: inkRect.height || lineBoxHeight,
            rectWidth: inkRect.width || measuredWidth,
            safeHeight: Math.max(0, safeSize.height - blockInset * 2),
            safeWidth: Math.max(0, safeSize.width - inlineInset * 2),
            scrollHeight: text.scrollHeight || lineBoxHeight,
            scrollWidth: text.scrollWidth || measuredWidth,
          };
        },
        minFontSize: token.minFontSize,
        onProof: (proof) => {
          fitProof = proof;
        },
      });

      if (context !== null) {
        context.font = [
          fitStyle.fontStyle,
          fitStyle.fontVariant,
          fitStyle.fontWeight,
          `${fontSize}px`,
          fitStyle.fontFamily,
        ].join(" ");
        const finalMetrics = context.measureText(children);
        if (
          role === FITTED_BAND_TEXT_ROLE.SUBTITLE &&
          Number.isFinite(finalMetrics.actualBoundingBoxLeft) &&
          Number.isFinite(finalMetrics.actualBoundingBoxRight)
        ) {
          const candidateShift = getOpticalInlineShift(finalMetrics);
          const finalGlyphWidth =
            finalMetrics.actualBoundingBoxLeft +
            finalMetrics.actualBoundingBoxRight;
          const finalMeasuredWidth =
            (Math.max(finalMetrics.width, finalGlyphWidth) +
              Math.max(0, letterCount - 1) * letterSpacing) *
            1.02;
          const finalInlineInset =
            fontSize *
              (token.outerStrokeEm +
                token.shadowXEm +
                token.inkSafeInlineEm) +
            cssEffectInlineExtentPx +
            0.75;
          const availableInlineSlack =
            safeSize.width - finalInlineInset * 2 - finalMeasuredWidth;
          inlineShift =
            availableInlineSlack >= Math.abs(candidateShift)
              ? candidateShift
              : 0;
        }
      }

      const result = applyCandidate(fontSize, inlineShift);
      rememberFit(
        key,
        fitProof === null
          ? { ...result, fontSize }
          : { ...result, fontSize, proof: fitProof },
      );
      recordDebug(() => ({
        ...getDebugGeometry(),
        baseFontFingerprint,
        cacheHit: false,
        cacheKey: key,
        content: children,
        fitBoundary,
        fontFingerprint,
        fontRevision: fontRevisionRef.current,
        fontSize,
        maxFontSize,
        proof: fitProof,
        role,
        safeSize,
        type: "fit-result",
      }));
      lastFittedMeasurementRef.current = {
        content: children,
        fitBoundary,
        fontFingerprint,
        height: safeSize.height,
        role,
        width: safeSize.width,
      };
      return true;
    };

    const scheduleFit = () => {
      if (disposed || animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(fit);
    };

    const scheduleFitIfMeasurementChanged = () => {
      const previousMeasurement = lastFittedMeasurementRef.current;
      const nextSize = getSafeSize();
      if (
        previousMeasurement !== null &&
        previousMeasurement.content === children &&
        previousMeasurement.fitBoundary === fitBoundary &&
        previousMeasurement.fontFingerprint === getFontFingerprint() &&
        previousMeasurement.role === role &&
        Math.abs(previousMeasurement.width - nextSize.width) <= 0.5 &&
        Math.abs(previousMeasurement.height - nextSize.height) <= 0.5
      )
        return;
      scheduleFit();
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleFitIfMeasurementChanged);
    resizeObserver?.observe(safeContainer);
    if (safeContainer.parentElement !== null) {
      resizeObserver?.observe(safeContainer.parentElement);
    }

    const fonts = document.fonts;
    const fitAfterFontLoad = (forceRevision = false) => {
      const generation = ++fontGateGeneration;
      fontVerified = false;
      text.style.opacity = "0";
      const currentBaseFontFingerprint = getBaseFontFingerprint();
      const currentStyle = getComputedStyle(text);
      if (fonts === undefined) {
        if (
          verifiedFontFingerprintRef.current !== currentBaseFontFingerprint
        ) {
          fontRevisionRef.current += 1;
          verifiedFontFingerprintRef.current = currentBaseFontFingerprint;
        }
        recordDebug(() => ({
          baseFontFingerprint: currentBaseFontFingerprint,
          forceRevision,
          fontRevision: fontRevisionRef.current,
          fontStatus: "unavailable",
          type: "font-gate",
        }));
        fontVerified = true;
        if (fit()) text.style.opacity = originalOpacity;
        return;
      }
      const load =
        typeof fonts.load === "function"
          ? fonts.load(currentStyle.font, children)
          : fonts.ready;
      void Promise.resolve(load)
        .catch(() => undefined)
        .then(() => {
          if (disposed || generation !== fontGateGeneration) return;
          if (
            forceRevision ||
            verifiedFontFingerprintRef.current !== currentBaseFontFingerprint
          ) {
            fontRevisionRef.current += 1;
            verifiedFontFingerprintRef.current = currentBaseFontFingerprint;
          }
          recordDebug(() => ({
            baseFontFingerprint: currentBaseFontFingerprint,
            forceRevision,
            fontRevision: fontRevisionRef.current,
            fontStatus: fonts.status,
            type: "font-gate",
          }));
          fontVerified = true;
          if (fit()) text.style.opacity = originalOpacity;
        });
    };
    const onFontsChanged = () => {
      if (!disposed) fitAfterFontLoad(true);
    };
    fonts?.addEventListener("loadingdone", onFontsChanged);
    fonts?.addEventListener("loadingerror", onFontsChanged);
    fitAfterFontLoad();
    window.addEventListener("resize", scheduleFitIfMeasurementChanged);

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      fonts?.removeEventListener("loadingdone", onFontsChanged);
      fonts?.removeEventListener("loadingerror", onFontsChanged);
      window.removeEventListener("resize", scheduleFitIfMeasurementChanged);
      subtitleMeasurementSurface?.remove();
      text.style.opacity = originalOpacity;
      text.style.textIndent = originalTextIndent;
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [children, enabled, fitBoundary, role]);

  const fittedStyle = { ...style } as CSSProperties & {
    "--fitted-font-size"?: string;
  };
  const textContent = (
    <span className="fitted-band-text-content" ref={textRef}>
      {children}
    </span>
  );
  const setContainer = (element: HTMLElement | null) => {
    containerRef.current = element;
  };

  if (as === "span") {
    return (
      <span
        {...attributes}
        className={className}
        ref={setContainer}
        style={fittedStyle}
      >
        {textContent}
      </span>
    );
  }

  if (
    as === "p" ||
    (as === undefined && role === FITTED_BAND_TEXT_ROLE.SUBTITLE)
  ) {
    return (
      <p
        {...attributes}
        className={className}
        ref={setContainer}
        style={fittedStyle}
      >
        {textContent}
      </p>
    );
  }

  return (
    <h3
      {...attributes}
      className={className}
      ref={setContainer}
      style={fittedStyle}
    >
      {textContent}
    </h3>
  );
}
