import { describe, expect, it } from "vitest";
import { createIntroFrameCoordinator, type IntroFrameRequest } from "./intro-frame-coordinator";

interface DeferredFrame {
  request: IntroFrameRequest;
  resolve: () => void;
  reject: () => void;
}

function createDeferredFrame(request: IntroFrameRequest, onResolve: (request: IntroFrameRequest) => void): DeferredFrame {
  return {
    request,
    resolve: () => onResolve(request),
    reject: () => undefined,
  };
}

describe("intro frame coordinator", () => {
  it("never draws stale A after desired B resolves first", () => {
    const coordinator = createIntroFrameCoordinator();
    const draws: number[] = [];
    const draw = (request: IntroFrameRequest) => {
      if (coordinator.markRendered(request)) {
        draws.push(request.frameIndex);
      }
    };
    const staleA = createDeferredFrame(coordinator.requestDesiredFrame(16), draw);
    const desiredB = createDeferredFrame(coordinator.requestDesiredFrame(32), draw);

    desiredB.resolve();
    staleA.resolve();

    expect(draws).toEqual([32]);
    expect(coordinator.getRenderedFrame()).toBe(32);
  });

  it("keeps preload cache completion out of desired-frame state", () => {
    const coordinator = createIntroFrameCoordinator();
    const desired = coordinator.requestDesiredFrame(24);
    const cachedFrames = new Map<number, string>();

    cachedFrames.set(8, "preloaded");

    expect(cachedFrames.get(8)).toBe("preloaded");
    expect(coordinator.isCurrent(desired)).toBe(true);
    expect(coordinator.getRenderedFrame()).toBe(-1);
  });

  it("allows the unchanged desired frame to receive a fresh retry request after failure", () => {
    const coordinator = createIntroFrameCoordinator();
    const failed = coordinator.requestDesiredFrame(40);
    const retry = coordinator.requestDesiredFrame(40);

    expect(coordinator.isCurrent(failed)).toBe(false);
    expect(coordinator.isCurrent(retry)).toBe(true);
    expect(retry.generation).toBeGreaterThan(failed.generation);
  });

  it("keeps the newer same-frame request eligible when its superseded load fails", () => {
    const coordinator = createIntroFrameCoordinator();
    const inFlight = coordinator.requestDesiredFrame(40);
    const supersedingRequest = coordinator.requestDesiredFrame(40);

    expect(coordinator.isCurrent(inFlight)).toBe(false);
    expect(coordinator.getCurrentRequest()).toEqual(supersedingRequest);
  });

  it("accepts an intentional backward desired frame while rejecting an older forward resolution", () => {
    const coordinator = createIntroFrameCoordinator();
    const forward = coordinator.requestDesiredFrame(44);
    const backward = coordinator.requestDesiredFrame(12);

    expect(coordinator.markRendered(forward)).toBe(false);
    expect(coordinator.markRendered(backward)).toBe(true);
    expect(coordinator.getRenderedFrame()).toBe(12);
  });
});
