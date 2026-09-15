import { describe, expect, it } from "vitest";
import { shouldBypassVaultCinematic } from "./vault-cinematic";

describe("vault cinematic policy", () => {
  it("bypasses each deterministic policy", () => {
    [{ reducedMotion: true }, { saveData: true }, { supported: false }].forEach((capabilities) => expect(shouldBypassVaultCinematic(capabilities)).toBe(true));
  });
});
