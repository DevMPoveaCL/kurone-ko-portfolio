import { expect, test } from "@playwright/test";
import { resolveBugCesanteAudioSource } from "../../src/shared/media/audio-source";

const VALID_PROGRESSION = {
  alternateHandoff: null,
  alternateResidency: "active",
  hiddenChallengeIds: [],
  introCompleted: true,
  mainHallUnlocked: true,
  unlockedSealIds: ["seal-eye", "seal-claw", "seal-lock"],
  version: 1,
} as const;

async function installMediaHarness(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    let currentTime = 0;
    Object.defineProperties(HTMLMediaElement.prototype, {
      buffered: { configurable: true, get: () => ({ end: () => 359.879979, length: 1, start: () => 0 }) },
      currentTime: { configurable: true, get: () => currentTime, set: (value: number) => { currentTime = value; } },
      duration: { configurable: true, get: () => 359.879979 },
      paused: { configurable: true, get: function (this: HTMLMediaElement) { return this.dataset.testPaused !== "false"; } },
      readyState: { configurable: true, get: () => HTMLMediaElement.HAVE_ENOUGH_DATA },
      seekable: { configurable: true, get: () => ({ end: () => 359.879979, length: 1, start: () => 0 }) },
    });
    HTMLMediaElement.prototype.load = function () {};
    HTMLMediaElement.prototype.play = function () {
      this.dataset.testPaused = "false";
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {
      this.dataset.testPaused = "true";
      this.dispatchEvent(new Event("pause"));
    };
  });
}

async function seedAlternateRoute(page: import("@playwright/test").Page) {
  await page.addInitScript((progression) => {
    sessionStorage.setItem("kuroneko:session-progression:v1", JSON.stringify(progression));
  }, VALID_PROGRESSION);
  await page.goto("/portfolio", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".portfolio-alternate-card")).toHaveCount(13);
  await expect(page.locator("audio.bug-cesante-audio")).toHaveCount(1);
}

test.describe("Bug Cesante media transport", () => {
  test("resolves the Cloudflare source to the HTTPS GitHub Pages mirror", () => {
    expect(resolveBugCesanteAudioSource({
      hostname: "kurone-ko-portfolio.pages.dev",
      origin: "https://kurone-ko-portfolio.pages.dev",
    })).toBe("https://devmpoveacl.github.io/kurone-ko-portfolio/assets/audio/bug-cesante-f6875aab.ogg");
  });

  test("exposes the 5:59 native duration and confirms a seek", async ({ page }) => {
    await installMediaHarness(page);
    await seedAlternateRoute(page);
    const audio = page.locator("audio.bug-cesante-audio");

    await audio.evaluate((element) => {
      if (!(element instanceof HTMLAudioElement)) throw new Error("Expected an HTMLAudioElement.");
      element.dispatchEvent(new Event("loadedmetadata"));
    });
    await expect.poll(() => audio.evaluate((element) => {
      if (!(element instanceof HTMLAudioElement)) throw new Error("Expected an HTMLAudioElement.");
      return element.duration;
    })).toBeCloseTo(359.879979, 2);
    await expect(page.getByText("0:00 / 5:59", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Mostrar letra" }).click();
    await expect(page.getByRole("button", { name: /Ir a/ }).first()).toBeVisible();
    const seek = page.getByRole("slider", { name: "Posición de la canción" });
    await expect(seek).toBeVisible();
    await seek.fill("245");
    await expect(seek).toHaveAttribute("data-seek-status", "pending");
    await audio.evaluate((element) => {
      if (!(element instanceof HTMLAudioElement)) throw new Error("Expected an HTMLAudioElement.");
      element.dispatchEvent(new Event("seeked"));
    });
    await expect(seek).toHaveAttribute("data-seek-status", "confirmed");
    await expect(page.getByText("4:05 / 5:59", { exact: true })).toBeVisible();
    await expect(audio).toHaveCount(1);
    await expect(audio).toHaveAttribute("src", /bug-cesante-f6875aab\.ogg/);
  });

  test("stops alternate playback before Volver and keeps one paused transport after primary mount", async ({ page }) => {
    await installMediaHarness(page);
    await seedAlternateRoute(page);
    const audio = page.locator("audio.bug-cesante-audio");

    await page.getByRole("button", { name: "Reproducir canción" }).click();
    await expect.poll(() => audio.evaluate((element) => {
      if (!(element instanceof HTMLAudioElement)) throw new Error("Expected an HTMLAudioElement.");
      return !element.paused;
    })).toBe(true);
    await page.getByRole("link", { name: "Volver" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => audio.evaluate((element) => {
      if (!(element instanceof HTMLAudioElement)) throw new Error("Expected an HTMLAudioElement.");
      return element.paused;
    })).toBe(true);
    await expect(audio).toHaveCount(1);
    await expect.poll(() => page.locator(".bug-cesante-player").count()).toBeGreaterThan(0);
    await expect.poll(() => audio.evaluate((element) => {
      if (!(element instanceof HTMLAudioElement)) throw new Error("Expected an HTMLAudioElement.");
      return element.paused;
    })).toBe(true);
  });
});
