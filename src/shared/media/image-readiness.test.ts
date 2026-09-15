import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearImageReadinessCache,
  prepareImageReadiness,
} from "./image-readiness";

class ControlledImage {
  static instances: ControlledImage[] = [];
  complete = false;
  naturalWidth = 0;
  decoding = "";
  fetchPriority = "";
  onerror: (() => void) | null = null;
  onload: (() => void) | null = null;
  src = "";
  decode = vi.fn(() => Promise.resolve());

  constructor() {
    ControlledImage.instances.push(this);
  }
}

describe("image readiness", () => {
  beforeEach(() => {
    ControlledImage.instances = [];
  });

  afterEach(() => {
    clearImageReadinessCache();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("reuses a cached complete image and decodes it once", async () => {
    Object.defineProperty(window, "Image", {
      configurable: true,
      value: ControlledImage,
    });
    const first = prepareImageReadiness("/assets/projects/acertijos.webp");
    const image = ControlledImage.instances[0];
    if (image === undefined) throw new Error("Expected image instance.");
    image.complete = true;
    image.naturalWidth = 100;
    image.onload?.();

    expect(await first).toEqual({
      phase: "ready",
      src: "/assets/projects/acertijos.webp",
    });
    expect(await prepareImageReadiness("/assets/projects/acertijos.webp")).toBe(
      await first,
    );
    expect(image.decode).toHaveBeenCalledOnce();
  });

  it("waits for delayed load and decode before reporting ready", async () => {
    Object.defineProperty(window, "Image", {
      configurable: true,
      value: ControlledImage,
    });
    const readiness = prepareImageReadiness("/delayed.webp", 2_500);
    const image = ControlledImage.instances[0];
    if (image === undefined) throw new Error("Expected image instance.");

    let settled = false;
    void readiness.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(image.onload).not.toBeNull();
    image.complete = true;
    image.naturalWidth = 120;
    image.onload?.();

    await expect(readiness).resolves.toEqual({
      phase: "ready",
      src: "/delayed.webp",
    });
  });

  it("converts errors and bounded timeouts into usable degraded readiness", async () => {
    Object.defineProperty(window, "Image", {
      configurable: true,
      value: ControlledImage,
    });
    await expect(
      (() => {
        const readiness = prepareImageReadiness("/error.webp");
        ControlledImage.instances[0]?.onerror?.();
        return readiness;
      })(),
    ).resolves.toEqual({ phase: "degraded", src: "/error.webp" });

    vi.useFakeTimers();
    const timeoutReadiness = prepareImageReadiness("/timeout.webp", 2_500);
    await vi.advanceTimersByTimeAsync(2_500);
    await expect(timeoutReadiness).resolves.toEqual({
      phase: "degraded",
      src: "/timeout.webp",
    });
  });
});
