import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  findFittingFontSize,
  FittedBandText,
  FITTED_BAND_TEXT_TOKENS,
  FITTED_BAND_TEXT_ROLE,
} from "./FittedBandText";

let measureTextCalls = 0;

beforeEach(() => {
  measureTextCalls = 0;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
    let fontSize = 16;
    return {
      get font() {
        return `${fontSize}px sans-serif`;
      },
      measureText: (value: string) => {
        measureTextCalls += 1;
        return { width: value.length * fontSize * 0.5 };
      },
      set font(value: string) {
        fontSize = Number.parseFloat(value.match(/[\d.]+px/)?.[0] ?? "") || 16;
      },
    } as unknown as CanvasRenderingContext2D;
  });
});

afterEach(() => {
  Reflect.deleteProperty(document, "fonts");
  vi.restoreAllMocks();
});

describe("findFittingFontSize", () => {
  it("finds the largest size that fits both dimensions", () => {
    const size = findFittingFontSize({
      maxFontSize: 40,
      measure: (fontSize) => ({
        clientHeight: 24,
        clientWidth: 240,
        rectHeight: fontSize <= 24 ? 24 : 30,
        rectWidth: fontSize * 10,
        safeHeight: 24,
        safeWidth: 240,
        scrollHeight: fontSize <= 24 ? 24 : 30,
        scrollWidth: fontSize * 10,
      }),
      minFontSize: 10,
    });

    expect(size).toBeCloseTo(24, 3);
  });

  it("stops at the largest safe binary-search candidate", () => {
    const measure = (fontSize: number) => ({
      clientHeight: 32,
      clientWidth: 240,
      rectHeight: 20,
      rectWidth: fontSize * 10,
      safeHeight: 32,
      safeWidth: 240,
      scrollHeight: 20,
      scrollWidth: fontSize * 10,
    });
    const size = findFittingFontSize({
      maxFontSize: 40,
      measure,
      minFontSize: 10,
    });
    const nextCandidate = size + 0.01;

    expect(size).toBeCloseTo(24, 3);
    expect(measure(nextCandidate).rectWidth).toBeGreaterThan(
      measure(nextCandidate).safeWidth,
    );
  });

  it("uses the emergency floor when the semantic floor cannot fit", () => {
    const size = findFittingFontSize({
      emergencyMinFontSize: 2,
      maxFontSize: 20,
      measure: (fontSize) => ({
        clientHeight: 10,
        clientWidth: 40,
        rectHeight: 10,
        rectWidth: fontSize * 30,
        safeHeight: 10,
        safeWidth: 40,
        scrollHeight: 10,
        scrollWidth: fontSize * 30,
      }),
      minFontSize: 8,
    });

    expect(size).toBeCloseTo(2, 5);
  });

  it("rejects a candidate whose real text rect exceeds the safe area", () => {
    const size = findFittingFontSize({
      maxFontSize: 20,
      measure: (fontSize) => ({
        clientHeight: 20,
        clientWidth: 200,
        rectHeight: fontSize <= 12 ? 12 : 24,
        rectWidth: fontSize,
        safeHeight: 20,
        safeWidth: 200,
        scrollHeight: fontSize <= 12 ? 12 : 20,
        scrollWidth: fontSize,
      }),
      minFontSize: 8,
    });

    expect(size).toBeCloseTo(12, 3);
  });
});

describe("FittedBandText", () => {
  it("keeps shared optical ink budgets for accented band text", () => {
    expect(FITTED_BAND_TEXT_TOKENS[FITTED_BAND_TEXT_ROLE.TITLE]).toMatchObject({
      inkSafeBlockEm: 0.075,
      inkSafeInlineEm: 0.025,
    });
    expect(
      FITTED_BAND_TEXT_TOKENS[FITTED_BAND_TEXT_ROLE.SUBTITLE],
    ).toMatchObject({
      inkSafeBlockEm: 0.1,
       inkSafeInlineEm: 0.04,
      lineHeight: 0.98,
    });
    expect(
      FITTED_BAND_TEXT_TOKENS[FITTED_BAND_TEXT_ROLE.MOBILE_QUOTE],
    ).toMatchObject({
      lineHeight: 1.3,
      minFontSize: 15,
      maxFontSize: 17,
    });
  });

  it("fits again when ResizeObserver reports a narrower band", () => {
    let notifyResize: (() => void) | undefined;
    const animationCallbacks: FrameRequestCallback[] = [];
    const observe = vi.fn();

    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = observe;
        disconnect = vi.fn();

        constructor(callback: () => void) {
          notifyResize = callback;
        }
      },
    );
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      animationCallbacks.push(callback);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(
      () => undefined,
    );

    const { container } = render(
      <div className="project-card-band">
        <FittedBandText
          as="p"
          className="fitted-band-text"
          role={FITTED_BAND_TEXT_ROLE.SUBTITLE}
        >
          Los caminos que me gustaría recorrer
        </FittedBandText>
      </div>,
    );
    const text = container.querySelector<HTMLElement>(
      ".fitted-band-text-content",
    );
    const fittedBand =
      container.querySelector<HTMLElement>(".fitted-band-text");
    const band = fittedBand?.parentElement;
    if (text === null || fittedBand === null || band === null) {
      throw new Error("Expected fitted text nodes and animation callback.");
    }
    const bandElement = band;

    Object.defineProperties(bandElement, {
      clientHeight: { configurable: true, value: 48 },
      clientWidth: { configurable: true, value: 260 },
      getBoundingClientRect: {
        configurable: true,
        value: () => ({ height: 48, width: 260 }),
      },
    });
    Object.defineProperties(fittedBand, {
      clientHeight: { configurable: true, value: 48 },
      clientWidth: { configurable: true, value: 260 },
      scrollHeight: { configurable: true, value: 16 },
      scrollWidth: {
        configurable: true,
        get: () => Number.parseFloat(text.style.fontSize) * 20,
      },
    });
    Object.defineProperties(text, {
      clientHeight: { configurable: true, value: 16 },
      clientWidth: { configurable: true, value: 260 },
      scrollHeight: { configurable: true, value: 16 },
      scrollWidth: {
        configurable: true,
        get: () => Number.parseFloat(text.style.fontSize) * 24,
      },
    });
    act(() => {
      notifyResize?.();
      animationCallbacks.shift()?.(0);
    });
    const wideSize = Number.parseFloat(
      fittedBand.style.getPropertyValue("--fitted-font-size"),
    );
    expect(wideSize).toBeGreaterThan(10);

    Object.defineProperty(bandElement, "clientWidth", {
      configurable: true,
      value: 160,
    });
    Object.defineProperty(fittedBand, "clientWidth", {
      configurable: true,
      value: 160,
    });
    Object.defineProperty(text, "clientWidth", {
      configurable: true,
      value: 160,
    });
    Object.defineProperty(bandElement, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ height: 48, width: 160 }),
    });
    act(() => {
      notifyResize?.();
      animationCallbacks.shift()?.(16);
    });

    const narrowSize = Number.parseFloat(
      fittedBand.style.getPropertyValue("--fitted-font-size"),
    );
    expect(narrowSize).toBeLessThan(wideSize);
    expect(observe).toHaveBeenCalledTimes(2);
  });

  it("uses an untransformed DOM probe for subtitle ink and cleans it up", () => {
    let notifyResize: (() => void) | undefined;
    const animationCallbacks: FrameRequestCallback[] = [];
    const originalRangeRect = Range.prototype.getBoundingClientRect;

    Object.defineProperty(Range.prototype, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        bottom: 14,
        height: 14,
        left: -100_000,
        right: -100_000 + 20 * 12,
        top: 0,
        width: 20 * 12,
      }),
    });
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn();
        disconnect = vi.fn();

        constructor(callback: () => void) {
          notifyResize = callback;
        }
      },
    );
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      animationCallbacks.push(callback);
      return animationCallbacks.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(
      () => undefined,
    );

    const { container, unmount } = render(
      <div className="project-card-band">
        <FittedBandText
          as="p"
          className="fitted-band-text"
          role={FITTED_BAND_TEXT_ROLE.SUBTITLE}
        >
          Diseñar para crecer
        </FittedBandText>
      </div>,
    );
    const fittedBand =
      container.querySelector<HTMLElement>(".fitted-band-text");
    const band = fittedBand?.parentElement;
    if (fittedBand === null || band === null) {
      throw new Error("Expected fitted subtitle nodes.");
    }
    Object.defineProperties(band, {
      clientHeight: { configurable: true, value: 48 },
      clientWidth: { configurable: true, value: 260 },
    });

    act(() => {
      notifyResize?.();
      animationCallbacks.shift()?.(0);
    });

    const probe = [...document.body.querySelectorAll<HTMLElement>("span")].find(
      (element) => element.getAttribute("aria-hidden") === "true",
    );
    expect(probe).toBeDefined();
    expect(probe?.style.position).toBe("fixed");
    expect(probe?.style.transform).toBe("none");
    expect(probe?.style.contain).toBe("layout style paint");
    expect(
      Number.parseFloat(
        fittedBand.style.getPropertyValue("--fitted-font-size"),
      ),
    ).toBeGreaterThan(11);

    unmount();
    expect(probe?.isConnected).toBe(false);
    Object.defineProperty(Range.prototype, "getBoundingClientRect", {
      configurable: true,
      value: originalRangeRect,
    });
  });

  it("re-fits after font readiness settles the card layout", async () => {
    let resolveFontsReady: (() => void) | undefined;
    const fontsReady = new Promise<void>((resolve) => {
      resolveFontsReady = resolve;
    });
    const loadFonts = vi.fn(() => fontsReady);
    const loadingDone = vi.fn();
    const loadingError = vi.fn();
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: {
        addEventListener: (event: string, callback: () => void) => {
          if (event === "loadingdone") loadingDone.mockImplementation(callback);
          if (event === "loadingerror")
            loadingError.mockImplementation(callback);
        },
        check: () => false,
        load: loadFonts,
        ready: fontsReady,
        removeEventListener: vi.fn(),
      },
    });

    const animationCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      animationCallbacks.push(callback);
      return animationCallbacks.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(
      () => undefined,
    );

    const { container } = render(
      <div className="project-card-band">
        <FittedBandText
          className="fitted-band-text"
          role={FITTED_BAND_TEXT_ROLE.TITLE}
        >
          Kurone-ko Timer
        </FittedBandText>
      </div>,
    );
    const text = container.querySelector<HTMLElement>(
      ".fitted-band-text-content",
    );
    const fittedBand =
      container.querySelector<HTMLElement>(".fitted-band-text");
    const band = fittedBand?.parentElement;
    if (text === null || fittedBand === null || band === null) {
      throw new Error("Expected fitted text nodes.");
    }

    let bandHeight = 24;
    const getFontSize = () => Number.parseFloat(text.style.fontSize) || 1;
    Object.defineProperties(band, {
      clientHeight: { configurable: true, get: () => bandHeight },
      clientWidth: { configurable: true, value: 260 },
      getBoundingClientRect: {
        configurable: true,
        value: () => ({ height: bandHeight, width: 260 }),
      },
    });
    Object.defineProperties(fittedBand, {
      clientHeight: { configurable: true, get: getFontSize },
      clientWidth: { configurable: true, value: 260 },
      scrollHeight: { configurable: true, get: getFontSize },
      scrollWidth: { configurable: true, get: () => getFontSize() * 8 },
    });
    Object.defineProperties(text, {
      clientHeight: { configurable: true, get: getFontSize },
      clientWidth: { configurable: true, value: 260 },
      scrollHeight: { configurable: true, get: getFontSize },
      scrollWidth: { configurable: true, get: () => getFontSize() * 8 },
    });
    bandHeight = 48;
    resolveFontsReady?.();
    await act(async () => {
      await fontsReady;
      await Promise.resolve();
    });
    act(() => animationCallbacks.shift()?.(16));
    act(() => animationCallbacks.shift()?.(32));

    const settledSize = Number.parseFloat(
      fittedBand.style.getPropertyValue("--fitted-font-size"),
    );
    expect(settledSize).toBeGreaterThan(10);
    expect(text.style.opacity).toBe("");
    expect(loadFonts).toHaveBeenCalledWith(expect.any(String), "Kurone-ko Timer");
    expect(loadingDone).not.toHaveBeenCalled();
    expect(loadingError).not.toHaveBeenCalled();
  });

  it("fits synchronously when enabled and does not schedule a deferred first pass", () => {
    const animationCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      animationCallbacks.push(callback);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(
      () => undefined,
    );

    const { rerender } = render(
      <FittedBandText
        className="fitted-band-text"
        enabled={false}
        role={FITTED_BAND_TEXT_ROLE.TITLE}
      >
        Kurone-ko Timer
      </FittedBandText>,
    );
    expect(animationCallbacks).toHaveLength(0);

    rerender(
      <FittedBandText
        className="fitted-band-text"
        enabled
        role={FITTED_BAND_TEXT_ROLE.TITLE}
      >
        Kurone-ko Timer
      </FittedBandText>,
    );

    expect(animationCallbacks).toHaveLength(0);
  });

  it("reuses the bounded fit when an inactive card is reactivated", () => {
    let notifyResize: (() => void) | undefined;
    const animationCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      animationCallbacks.push(callback);
      return animationCallbacks.length;
    });
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn();
        disconnect = vi.fn();

        constructor(callback: () => void) {
          notifyResize = callback;
        }
      },
    );

    const { container, rerender } = render(
      <div className="project-card-band">
        <FittedBandText
          className="fitted-band-text"
          enabled
          role={FITTED_BAND_TEXT_ROLE.TITLE}
        >
          Kurone-ko Timer
        </FittedBandText>
      </div>,
    );
    const fittedBand =
      container.querySelector<HTMLElement>(".fitted-band-text");
    const band = fittedBand?.parentElement;
    if (fittedBand === null || band === null) {
      throw new Error("Expected fitted text nodes.");
    }

    Object.defineProperties(band, {
      clientHeight: { configurable: true, value: 48 },
      clientWidth: { configurable: true, value: 260 },
    });
    act(() => {
      notifyResize?.();
      animationCallbacks.shift()?.(0);
    });
    expect(measureTextCalls).toBeGreaterThan(0);
    const callsAfterFirstFit = measureTextCalls;

    rerender(
      <div className="project-card-band">
        <FittedBandText
          className="fitted-band-text"
          enabled={false}
          role={FITTED_BAND_TEXT_ROLE.TITLE}
        >
          Kurone-ko Timer
        </FittedBandText>
      </div>,
    );
    rerender(
      <div className="project-card-band">
        <FittedBandText
          className="fitted-band-text"
          enabled
          role={FITTED_BAND_TEXT_ROLE.TITLE}
        >
          Kurone-ko Timer
        </FittedBandText>
      </div>,
    );

    expect(measureTextCalls).toBe(callsAfterFirstFit);
  });

  it("cancels pending fitting and ignores a late callback after disable", () => {
    const animationCallbacks: FrameRequestCallback[] = [];
    let notifyResize: (() => void) | undefined;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn();
        disconnect = vi.fn();

        constructor(callback: () => void) {
          notifyResize = callback;
        }
      },
    );
    const cancelAnimationFrame = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => undefined);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      animationCallbacks.push(callback);
      return animationCallbacks.length;
    });

    const { container, rerender } = render(
      <div className="project-card-band">
        <FittedBandText
          className="fitted-band-text"
          enabled
          role={FITTED_BAND_TEXT_ROLE.TITLE}
        >
          Kurone-ko Timer
        </FittedBandText>
      </div>,
    );
    const fittedBand =
      container.querySelector<HTMLElement>(".fitted-band-text");
    const band = fittedBand?.parentElement;
    if (fittedBand === null || band === null) {
      throw new Error("Expected fitted text nodes.");
    }

    Object.defineProperties(band, {
      clientHeight: { configurable: true, value: 48 },
      clientWidth: { configurable: true, value: 260 },
      getBoundingClientRect: {
        configurable: true,
        value: () => ({ height: 48, width: 260 }),
      },
    });
    Object.defineProperties(fittedBand, {
      clientHeight: { configurable: true, value: 48 },
      clientWidth: { configurable: true, value: 260 },
      scrollHeight: { configurable: true, value: 16 },
      scrollWidth: { configurable: true, value: 16 },
    });
    Object.defineProperties(band, {
      clientHeight: { configurable: true, value: 48 },
      clientWidth: { configurable: true, value: 260 },
      getBoundingClientRect: {
        configurable: true,
        value: () => ({ height: 48, width: 260 }),
      },
    });

    act(() => notifyResize?.());
    const pendingCallback = animationCallbacks[0];
    if (pendingCallback === undefined) {
      throw new Error("Expected a pending animation callback.");
    }

    rerender(
      <div className="project-card-band">
        <FittedBandText
          className="fitted-band-text"
          enabled={false}
          role={FITTED_BAND_TEXT_ROLE.TITLE}
        >
          Kurone-ko Timer
        </FittedBandText>
      </div>,
    );

    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
    act(() => pendingCallback(0));
    expect(fittedBand.style.getPropertyValue("--fitted-font-size")).toBe("");
  });
});
