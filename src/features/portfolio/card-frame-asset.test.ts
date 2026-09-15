import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface WebpDimensions {
  height: number;
  width: number;
}

function readWebpDimensions(path: string): WebpDimensions {
  const bytes = readFileSync(path);
  expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
  expect(bytes.subarray(8, 12).toString("ascii")).toBe("WEBP");

  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const type = bytes.subarray(offset, offset + 4).toString("ascii");
    const dataOffset = offset + 8;
    const chunkSize = bytes.readUInt32LE(offset + 4);

    if (type === "VP8X") {
      return {
        width: 1 + bytes[dataOffset + 4]! + (bytes[dataOffset + 5]! << 8) + (bytes[dataOffset + 6]! << 16),
        height: 1 + bytes[dataOffset + 7]! + (bytes[dataOffset + 8]! << 8) + (bytes[dataOffset + 9]! << 16),
      };
    }

    if (type === "VP8L") {
      const bits = bytes[dataOffset + 1]! | (bytes[dataOffset + 2]! << 8) | (bytes[dataOffset + 3]! << 16) | (bytes[dataOffset + 4]! << 24);
      return {
        width: 1 + (bits & 0x3fff),
        height: 1 + ((bits >> 14) & 0x3fff),
      };
    }

    if (type === "VP8 ") {
      const frame = dataOffset + 6;
      return {
        width: bytes.readUInt16LE(frame) & 0x3fff,
        height: bytes.readUInt16LE(frame + 2) & 0x3fff,
      };
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  throw new Error(`No supported WebP frame found in ${path}`);
}

describe("shared ornate card frame asset", () => {
  it("keeps the normalized runtime contract in the public asset tree", () => {
    const runtimeAssetPath = resolve(process.cwd(), "public/assets/projects/card.webp");
    const runtimeAssetBytes = readFileSync(runtimeAssetPath);
    const dimensions = readWebpDimensions(runtimeAssetPath);
    const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

    expect(dimensions).toEqual({ height: 1672, width: 941 });
    expect(dimensions.width / dimensions.height).toBeCloseTo(941 / 1672, 12);
    expect(runtimeAssetBytes.length).toBeGreaterThan(0);
    expect(css).toContain("var(--asset-media-card)");
    expect(css).not.toContain('url("/card.webp")');
    expect(css).toContain("--project-card-frame-aspect: 941 / 1672;");
    expect(css).not.toContain("aspect-ratio: 2 / 3;");
  });
});
