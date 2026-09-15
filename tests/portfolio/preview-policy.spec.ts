import { expect, test } from "@playwright/test";
import { PortfolioPage } from "./portfolio-page";

const desktopVideoPath =
  "/assets/projects/previews/software-engineering-playbook/project1-video.webm";
const mobileVideoPath =
  "/assets/projects/previews/software-engineering-playbook/project1-video-mobile.webm";
const posterPath =
  "/assets/projects/previews/software-engineering-playbook/project1-preview.webp";

async function openPreview(
  page: import("@playwright/test").Page,
  reducedMotion = false,
) {
  await new PortfolioPage(page).seedValidProgression();
  await page.goto("/?view=showcase", { waitUntil: "domcontentloaded" });
  if (!reducedMotion)
    await page.emulateMedia({ reducedMotion: "no-preference" });
  const card = page
    .locator('.project-card[data-card-presentation="media-title-bands"]')
    .filter({
      has: page.getByRole("heading", { name: "Software Engineering Playbook" }),
    });
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(
    card.getByRole("heading", { name: "Software Engineering Playbook" }),
  ).toBeVisible({ timeout: 30_000 });
  return card;
}

test.describe("Software Engineering Playbook preview policy", () => {
  test("shows poster first, then plays the active mobile source and captures both target viewports", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("project1-")) requests.push(request.url());
    });

    const card = await openPreview(page);
    await expect(card.locator(".project-card-preview img")).toBeVisible();
    await page.screenshot({
      path: "artifacts/project1-preview-poster-mobile-390x844.png",
      fullPage: false,
    });

    const posterState = await card
      .locator(".project-card-preview img")
      .evaluate((element) => {
        const image = element as HTMLImageElement;
        return { currentSrc: image.currentSrc, complete: image.complete };
      });
    expect(posterState.complete).toBe(true);
    expect(posterState.currentSrc).toContain("project1-preview.webp");

    const video = card.locator("video");
    await expect(video).toHaveAttribute("preload", "metadata");
    await expect
      .poll(() => video.getAttribute("data-preview-video-ready"))
      .toBe("true");
    await expect
      .poll(() =>
        video.evaluate((element) => {
          const media = element as HTMLVideoElement;
          return { paused: media.paused, readyState: media.readyState };
        }),
      )
      .toMatchObject({ paused: false });
    expect(
      requests.filter((request) => request.endsWith(posterPath)).length,
    ).toBeGreaterThan(0);
    expect(
      requests.filter((request) => request.endsWith(mobileVideoPath)),
    ).toHaveLength(1);
    expect(
      requests.filter((request) => request.endsWith(desktopVideoPath)),
    ).toHaveLength(0);
    await expect
      .poll(() =>
        video.evaluate((element) => (element as HTMLVideoElement).currentSrc),
      )
      .toContain(mobileVideoPath);

    await page.screenshot({
      path: "artifacts/project1-preview-mobile-390x844.png",
      fullPage: false,
    });
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({
      path: "artifacts/project1-preview-desktop-1920x1080.png",
      fullPage: false,
    });

    const metrics = await card.evaluate((element) => {
      const title = element
        .querySelector<HTMLElement>(".project-card-title")
        ?.getBoundingClientRect();
      const subtitle = element
        .querySelector<HTMLElement>(".project-card-subtitle")
        ?.getBoundingClientRect();
      const videoElement = element.querySelector<HTMLVideoElement>("video");
      return {
        card: element.getBoundingClientRect().toJSON(),
        title: title?.toJSON(),
        subtitle: subtitle?.toJSON(),
        video: videoElement?.getBoundingClientRect().toJSON(),
        overflow:
          document.documentElement.scrollWidth > innerWidth ||
          document.body.scrollWidth > innerWidth,
      };
    });
    expect(metrics.overflow).toBe(false);
    expect(metrics.video?.width).toBeGreaterThan(0);
    expect(metrics.video?.height).toBeGreaterThan(0);
    expect((metrics.title?.height ?? 0) > (metrics.subtitle?.height ?? 0)).toBe(
      true,
    );
  });

  test("uses the master source on desktop and keeps inactive cards unloaded during navigation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("project1-video"))
        requests.push(request.url());
    });

    const card = await openPreview(page);
    await expect(card.locator("video")).toHaveCount(1, { timeout: 30_000 });
    await expect
      .poll(() =>
        card
          .locator("video")
          .evaluate((element) => !(element as HTMLVideoElement).paused),
      )
      .toBe(true);
    expect(
      requests.filter((request) => request.endsWith(desktopVideoPath)),
    ).toHaveLength(1);
    expect(
      requests.filter((request) => request.endsWith(mobileVideoPath)),
    ).toHaveLength(0);

    await page.getByRole("button", { name: "Proyecto siguiente" }).click();
    await expect(
      page
        .locator('.project-card[data-card-presentation="media-title-bands"]')
        .filter({ has: page.getByRole("heading", { name: "Software Engineering Playbook" }) })
        .locator("video"),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Proyecto anterior" }).click();
    await expect(
      page
        .locator('.project-card[data-card-presentation="media-title-bands"]')
        .filter({ has: page.getByRole("heading", { name: "Software Engineering Playbook" }) })
        .locator("video"),
    ).toHaveCount(1, { timeout: 30_000 });
    await expect
      .poll(() =>
        page
          .locator('.project-card[data-card-presentation="media-title-bands"]')
          .filter({ has: page.getByRole("heading", { name: "Software Engineering Playbook" }) })
          .locator("video")
          .evaluate((element) => !(element as HTMLVideoElement).paused),
      )
      .toBe(true);
  });

  test("unmounts the active video while the document is hidden", async ({
    page,
  }) => {
    const card = await openPreview(page);
    await expect(card.locator("video")).toHaveCount(1, { timeout: 30_000 });

    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await expect(card.locator("video")).toHaveCount(0);
  });

  test("keeps the poster visible when autoplay is rejected", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      HTMLMediaElement.prototype.play = () =>
        Promise.reject(new DOMException("blocked", "NotAllowedError"));
    });
    const card = await openPreview(page);
    const video = card.locator("video");

    await expect(video).toHaveCount(1, { timeout: 30_000 });
    await expect(video).toHaveAttribute("data-preview-video-ready", "false");
    await expect(card.locator(".project-card-preview img")).toBeVisible();
  });

  test("does not mount or request video for reduced motion, Save-Data, or 2g", async ({
    browser,
  }) => {
    for (const signal of ["reduced-motion", "save-data", "2g"] as const) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: signal === "reduced-motion" ? "reduce" : "no-preference",
      });
      const page = await context.newPage();
      await page.addInitScript(
        (effectiveType) => {
          Object.defineProperty(navigator, "connection", {
            configurable: true,
            value: {
              effectiveType,
              saveData: effectiveType === "save-data",
              addEventListener() {},
              removeEventListener() {},
            },
          });
        },
        signal === "2g" ? "2g" : signal,
      );
      const requests: string[] = [];
      page.on("request", (request) => {
        if (request.url().includes("project1-video"))
          requests.push(request.url());
      });
      const card = await openPreview(page, signal === "reduced-motion");
      await page.waitForTimeout(1400);
      await expect(card.locator("video")).toHaveCount(0);
      expect(requests).toHaveLength(0);
      await context.close();
    }
  });
});
