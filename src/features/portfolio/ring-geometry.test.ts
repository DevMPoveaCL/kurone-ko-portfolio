import { describe, expect, it } from "vitest";
import { getRingCssProperties, getRingPosition } from "./ring-geometry";

describe("ring geometry", () => {
  it("keeps a single project at the front without depth", () => {
    expect(getRingPosition(0, 0, 1)).toEqual({ angle: 0, opacity: 1, radius: 0 });
  });

  it("keeps two projects on a readable bounded arc from the active card", () => {
    expect(getRingPosition(1, 0, 2)).toEqual({ angle: -56, opacity: 0.68, radius: 260 });
  });

  it.each([8, 146, 200])("keeps unique continuous bounded angles for %i projects", (count) => {
    const positions = Array.from({ length: count }, (_, index) => getRingPosition(index, 0, count));

    expect(new Set(positions.map(({ angle }) => angle))).toHaveLength(count);
    expect(positions.every(({ angle, radius }) => Math.abs(angle) <= 72 && radius === 260)).toBe(true);
  });

  it("exposes CSS custom properties from the current active index", () => {
    expect(getRingCssProperties(3, 2, 6)).toEqual({
      "--ring-angle": "24deg",
      "--ring-opacity": "0.8666666666666667",
      "--ring-radius": "260px",
    });
  });

  it.each([
    [-1, 0, 2], [0, 2, 2], [0, 0, 0], [0.5, 0, 2], [0, 0.5, 2], [0, 0, 2.5], [0, 0, Number.NaN], [0, 0, Number.POSITIVE_INFINITY],
  ])("falls back safely for invalid boundaries: %s, %s, %s", (itemIndex, activeIndex, count) => {
    expect(getRingPosition(itemIndex, activeIndex, count)).toEqual({ angle: 0, opacity: 1, radius: 0 });
  });
});
