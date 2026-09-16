import { test } from "@playwright/test";
import { NotFoundPage, type NotFoundViewport } from "./not-found-page";

const VIEWPORTS = [
  { name: "desktop 1365x768", width: 1365, height: 768 },
  { name: "mobile 375x667", width: 375, height: 667 },
  { name: "small mobile 320x568", width: 320, height: 568 },
  { name: "landscape 640x360", width: 640, height: 360 },
] as const satisfies readonly NotFoundViewport[];

test.describe("404 recovery plaque", () => {
  for (const viewport of VIEWPORTS) {
    test(`supports ${viewport.name} without horizontal overflow or progression`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      const notFound = new NotFoundPage(page);
      await notFound.gotoFalseRoute();
      await notFound.expectResponsiveComposition(viewport);
      await notFound.recoverToRootWithoutProgression();
    });
  }

  test("reflows at effective 200% text size on a 320px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });

    const notFound = new NotFoundPage(page);
    await notFound.gotoFalseRoute();
    await notFound.applyEffectiveTextScale200();
    await notFound.expectTextScaleReflow();
  });
});
