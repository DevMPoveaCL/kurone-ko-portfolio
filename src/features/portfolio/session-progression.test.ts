import { afterEach, describe, expect, it } from "vitest";
import {
  ALTERNATE_RESIDENCY,
  SESSION_RELOAD_RESET_MARKER,
  SESSION_PROGRESSION_KEY,
  clearAlternateResidency,
  completeMainHall,
  consumeAlternateHandoff,
  createInitialSessionProgression,
  issueAlternateHandoff,
  markIntroCompleted,
  parseSessionProgression,
  readSessionProgression,
  isDocumentReload,
  resetSessionProgression,
  resetSessionProgressionForDocumentReload,
  unlockHiddenChallenge,
  unlockSeal,
} from "./session-progression";

const SEAL_IDS = ["eye", "claw", "lock"];
const CHALLENGE_IDS = ["riddle"];

function options(now = 1_000) {
  return { challengeIds: CHALLENGE_IDS, now, sealIds: SEAL_IDS };
}

describe("session progression", () => {
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>)[SESSION_RELOAD_RESET_MARKER];
  });

  it.each([
    ["reload", { getEntriesByType: () => [{ type: "reload" }] }, true],
    ["navigate", { getEntriesByType: () => [{ type: "navigate" }] }, false],
    ["back_forward", { getEntriesByType: () => [{ type: "back_forward" }] }, false],
    ["missing API", {}, false],
  ] as const)("detects Navigation Timing %s safely", (_name, source, expected) => {
    expect(isDocumentReload(source)).toBe(expected);
  });

  it("uses the legacy navigation fallback only when the modern entry is unavailable", () => {
    expect(isDocumentReload({ getEntriesByType: () => [], navigation: { type: 1 } })).toBe(true);
    expect(isDocumentReload({ getEntriesByType: () => [], navigation: { type: 0 } })).toBe(false);
  });

  it("resets only progression once for a document reload", () => {
    const values = new Map<string, string>([
      [SESSION_PROGRESSION_KEY, "progress"],
      ["kuroneko:bug-cesante-player", "keep"],
    ]);
    const removeItem = (key: string) => values.delete(key);
    const storage = { removeItem };
    const source = { getEntriesByType: () => [{ type: "reload" }] };

    expect(resetSessionProgressionForDocumentReload(source, storage)).toBe(true);
    expect(resetSessionProgressionForDocumentReload(source, storage)).toBe(false);
    expect(values.get(SESSION_PROGRESSION_KEY)).toBeUndefined();
    expect(values.get("kuroneko:bug-cesante-player")).toBe("keep");
  });

  it("accepts valid partial facts and rejects unknown or duplicate identifiers", () => {
    const intro = markIntroCompleted(createInitialSessionProgression());
    const oneSeal = unlockSeal(intro, "eye", SEAL_IDS);

    expect(oneSeal?.unlockedSealIds).toEqual(["eye"]);
    expect(
      parseSessionProgression(
        { ...oneSeal, hiddenChallengeIds: ["riddle"] },
        options(),
      ),
    ).toEqual({
      ...oneSeal,
      hiddenChallengeIds: ["riddle"],
    });
    expect(
      parseSessionProgression(
        { ...oneSeal, unlockedSealIds: ["eye", "eye"] },
        options(),
      ),
    ).toBeNull();
    expect(
      parseSessionProgression(
        { ...oneSeal, unlockedSealIds: ["unknown"] },
        options(),
      ),
    ).toBeNull();
  });

  it("rejects impossible main-hall grants and unsupported versions", () => {
    const impossible = {
      ...createInitialSessionProgression(),
      mainHallUnlocked: true,
    };
    expect(parseSessionProgression(impossible, options())).toBeNull();
    expect(
      parseSessionProgression({ ...impossible, version: 2 }, options()),
    ).toBeNull();
  });

  it("requires every seal before granting the main hall", () => {
    const partial = unlockSeal(
      markIntroCompleted(createInitialSessionProgression()),
      "eye",
      SEAL_IDS,
    );
    if (partial === null) throw new Error("Expected partial progression.");
    expect(completeMainHall(partial, SEAL_IDS)).toBeNull();

    const complete = SEAL_IDS.slice(1).reduce((state, sealId) => {
      const next = unlockSeal(state, sealId, SEAL_IDS);
      if (next === null) throw new Error(`Expected ${sealId} to unlock.`);
      return next;
    }, partial);
    expect(completeMainHall(complete, SEAL_IDS)?.mainHallUnlocked).toBe(true);
  });

  it("persists a one-time alternate handoff, supports refresh residency, and clears only alternate access", () => {
    const issued = issueAlternateHandoff(
      createInitialSessionProgression(),
      1_000,
      "0123456789abcdef",
    );
    const consumed = consumeAlternateHandoff(issued, 1_001);
    if (consumed === null) throw new Error("Expected handoff to be consumed.");

    expect(consumed.alternateResidency).toBe(ALTERNATE_RESIDENCY.ACTIVE);
    expect(consumed.alternateHandoff).toBeNull();
    expect(consumeAlternateHandoff(consumed, 1_002)).toBeNull();
    expect(
      clearAlternateResidency({ ...consumed, mainHallUnlocked: true }),
    ).toMatchObject({
      alternateHandoff: null,
      alternateResidency: ALTERNATE_RESIDENCY.INACTIVE,
      mainHallUnlocked: true,
    });
  });

  it("rejects expired handoffs and resets corrupt storage without touching other keys", () => {
    const values = new Map<string, string>([
      [SESSION_PROGRESSION_KEY, "not-json"],
      ["player", "keep"],
    ]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    };

    expect(readSessionProgression(options(), storage)).toEqual(
      createInitialSessionProgression(),
    );
    expect(values.get(SESSION_PROGRESSION_KEY)).toBeUndefined();
    expect(values.get("player")).toBe("keep");

    const expired = issueAlternateHandoff(
      createInitialSessionProgression(),
      1_000,
      "0123456789abcdef",
    );
    expect(consumeAlternateHandoff(expired, 11_001)).toBeNull();
    resetSessionProgression(storage);
    expect(values.get("player")).toBe("keep");
  });

  it("persists challenge facts only when the challenge is known", () => {
    const initial = createInitialSessionProgression();
    expect(unlockHiddenChallenge(initial, "unknown", CHALLENGE_IDS)).toBeNull();
    expect(
      unlockHiddenChallenge(initial, "riddle", CHALLENGE_IDS)
        ?.hiddenChallengeIds,
    ).toEqual(["riddle"]);
  });
});
