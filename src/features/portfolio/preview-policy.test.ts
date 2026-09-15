import { describe, expect, it } from "vitest";
import {
  getPreviewVideoPolicy,
  PREVIEW_VIDEO_POLICY,
  type PreviewVideoSignals,
} from "./preview-policy";

const allowedSignals: PreviewVideoSignals = {
  effectiveType: "4g",
  isActive: true,
  isDocumentVisible: true,
  prefersReducedMotion: false,
  saveData: false,
};

describe("preview video policy", () => {
  it("allows active previews on normal mobile or desktop networks regardless of pointer type", () => {
    expect(getPreviewVideoPolicy(allowedSignals)).toBe(
      PREVIEW_VIDEO_POLICY.ALLOW,
    );
  });

  it("allows normal connections when the browser does not expose Network Information", () => {
    expect(
      getPreviewVideoPolicy({ ...allowedSignals, effectiveType: undefined }),
    ).toBe(PREVIEW_VIDEO_POLICY.ALLOW);
  });

  it.each([
    ["inactive", { isActive: false }, PREVIEW_VIDEO_POLICY.BLOCKED_INACTIVE],
    [
      "hidden",
      { isDocumentVisible: false },
      PREVIEW_VIDEO_POLICY.BLOCKED_HIDDEN,
    ],
    [
      "reduced motion",
      { prefersReducedMotion: true },
      PREVIEW_VIDEO_POLICY.BLOCKED_REDUCED_MOTION,
    ],
    ["data saver", { saveData: true }, PREVIEW_VIDEO_POLICY.BLOCKED_DATA_SAVER],
    [
      "slow network",
      { effectiveType: "2g" },
      PREVIEW_VIDEO_POLICY.BLOCKED_SLOW_NETWORK,
    ],
  ])("blocks %s previews", (_label, override, expected) => {
    expect(getPreviewVideoPolicy({ ...allowedSignals, ...override })).toBe(
      expected,
    );
  });
});
