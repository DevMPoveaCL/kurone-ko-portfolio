import { describe, expect, it } from "vitest";
import {
  BUG_CESANTE_AUDIO_PATH,
  GITHUB_PAGES_BASE_PATH,
  GITHUB_PAGES_ORIGIN,
  resolveBugCesanteAudioSource,
} from "./audio-source";

describe("Bug Cesante audio source", () => {
  it("routes the canonical Cloudflare host to the range-capable GitHub Pages asset", () => {
    expect(resolveBugCesanteAudioSource({
      hostname: "kurone-ko-portfolio.pages.dev",
      origin: "https://kurone-ko-portfolio.pages.dev",
    })).toBe(`${GITHUB_PAGES_ORIGIN}${GITHUB_PAGES_BASE_PATH}${BUG_CESANTE_AUDIO_PATH}`);
  });

  it("uses the exact GitHub Pages repository base path without recursion", () => {
    expect(resolveBugCesanteAudioSource({
      hostname: "devmpoveacl.github.io",
      origin: `${GITHUB_PAGES_ORIGIN}${GITHUB_PAGES_BASE_PATH}`,
    })).toBe(`${GITHUB_PAGES_BASE_PATH}${BUG_CESANTE_AUDIO_PATH}`);
  });

  it.each([
    "localhost",
    "127.0.0.1",
    "preview.example.test",
  ])("keeps %s on the local public path", (hostname) => {
    expect(resolveBugCesanteAudioSource({ hostname, origin: `http://${hostname}` })).toBe(BUG_CESANTE_AUDIO_PATH);
  });
});
