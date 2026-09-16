import { afterEach, describe, expect, it, vi } from "vitest";
import {
  acquireAudioTransportOwner,
  ownsAudioTransport,
  releaseAudioTransportOwner,
  resetSharedAudioElementForTests,
} from "./audio-controller";

describe("shared audio transport ownership", () => {
  afterEach(() => {
    resetSharedAudioElementForTests();
    vi.restoreAllMocks();
  });

  it("pauses the previous owner synchronously when a new owner acquires transport", () => {
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    const primary = acquireAudioTransportOwner("primary", "/primary.ogg");
    Object.defineProperty(primary, "paused", { configurable: true, value: false });

    acquireAudioTransportOwner("alternate", "/alternate.ogg");

    expect(pause).toHaveBeenCalledTimes(1);
    expect(ownsAudioTransport("primary")).toBe(false);
    expect(ownsAudioTransport("alternate")).toBe(true);
    expect(primary).toBe(document.querySelector(".bug-cesante-audio"));
  });

  it("makes release owner-safe and clears ownership only for the current owner", () => {
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    const audio = acquireAudioTransportOwner("alternate", "/audio.ogg");
    Object.defineProperty(audio, "paused", { configurable: true, value: false });

    expect(releaseAudioTransportOwner("primary")).toBe(false);
    expect(ownsAudioTransport("alternate")).toBe(true);
    expect(releaseAudioTransportOwner("alternate")).toBe(true);
    expect(ownsAudioTransport("alternate")).toBe(false);
    expect(pause).toHaveBeenCalledTimes(1);
  });
});
