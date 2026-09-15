import { describe, expect, it } from "vitest";
import {
  PROJECT_UNLOCK_CHALLENGE_ID,
  PROJECT_UNLOCK_CHALLENGES,
  getChallengeProjectIds,
  isAcceptedUnlockAnswer,
  normalizeUnlockAnswer,
  resolveProjectAccess,
} from "./hidden-project-unlock";
import { PROJECTS } from "./project-data";
import { filterProjects } from "./project-taxonomy";
import { PROJECT_PREVIEW_FIT, PROJECT_PREVIEW_SOURCE } from "./vault-types";

describe("hidden project unlock", () => {
  it("normalizes accepted answers with exact equality", () => {
    expect(normalizeUnlockAnswer("  TÍO   Ben ")).toBe("tioben");
    for (const answer of ["el tío ben", "el tio ben", "eltioben", "tío ben", "tio ben", "tioben", "narrador", " E l\tTÍO\nB E N "]) {
      expect(isAcceptedUnlockAnswer(PROJECT_UNLOCK_CHALLENGES[0]!, answer)).toBe(true);
    }
    expect(isAcceptedUnlockAnswer(PROJECT_UNLOCK_CHALLENGES[0]!, "narrador extra")).toBe(false);
    expect(isAcceptedUnlockAnswer(PROJECT_UNLOCK_CHALLENGES[0]!, "tioben extra")).toBe(false);
    expect(isAcceptedUnlockAnswer(PROJECT_UNLOCK_CHALLENGES[0]!, "narradorio")).toBe(false);
  });

  it("uses contain-fit Joker previews before and after challenge unlock", () => {
    const lockedProject = PROJECTS.find((project) => project.id === "translator");
    if (lockedProject === undefined) throw new Error("Expected the locked Kurone-ko Translator project.");

    const lockedAccess = resolveProjectAccess(lockedProject, []);
    const unlockedAccess = resolveProjectAccess(lockedProject, [PROJECT_UNLOCK_CHALLENGE_ID]);

    expect(lockedAccess.preview).toEqual(expect.objectContaining({
      fit: PROJECT_PREVIEW_FIT.CONTAIN,
      image: "/assets/projects/joker.webp",
      source: PROJECT_PREVIEW_SOURCE.LOCKED,
    }));
    expect(unlockedAccess.preview).toEqual(expect.objectContaining({
      fit: PROJECT_PREVIEW_FIT.CONTAIN,
      image: "/assets/projects/joker2.webp",
      source: PROJECT_PREVIEW_SOURCE.UNLOCKED,
    }));
  });

  it("maps the approved blocked set from explicit challenge metadata", () => {
    const blocked = getChallengeProjectIds(PROJECTS, PROJECT_UNLOCK_CHALLENGE_ID);
    expect(blocked).toEqual([
      "kuroneko-pos",
      "kuroneko-sii",
      "kuroneko-explorermcp",
      "translator",
      "teacher",
    ]);
  });

  it("does not unlock or expose deferred Portfolio", () => {
    const portfolio = PROJECTS.find((project) => project.id === "portfolio");
    if (portfolio === undefined) throw new Error("Expected the deferred Portfolio project.");

    expect(resolveProjectAccess(portfolio, [PROJECT_UNLOCK_CHALLENGE_ID]).isUnlocked).toBe(false);
    expect(filterProjects(PROJECTS, []).some((project) => project.id === portfolio.id)).toBe(false);
    expect(portfolio.challengeId).toBeUndefined();
  });
});
