import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "../base-page";

export interface NotFoundViewport {
  name: string;
  width: number;
  height: number;
}

export class NotFoundPage extends BasePage {
  readonly plaque: Locator;
  readonly marker: Locator;
  readonly content: Locator;
  readonly cta: Locator;

  constructor(page: Page) {
    super(page);
    this.plaque = page.locator(".not-found-plaque");
    this.marker = page.locator(".not-found-marker");
    this.content = page.locator(".not-found-content");
    this.cta = page.getByRole("link", { name: "Volver a la bóveda" });
  }

  async gotoFalseRoute(): Promise<void> {
    await this.goto("/ruta-fuera-de-la-boveda");
    await expect(this.plaque).toBeVisible();
  }

  async expectResponsiveComposition(viewport: NotFoundViewport): Promise<void> {
    const metrics = await this.page.evaluate(() => ({
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.viewportWidth);
    expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.viewportWidth);

    const markerBox = await this.marker.boundingBox();
    const contentBox = await this.content.boundingBox();
    expect(markerBox).not.toBeNull();
    expect(contentBox).not.toBeNull();

    if (markerBox !== null && contentBox !== null) {
      const overlaps =
        markerBox.x < contentBox.x + contentBox.width &&
        markerBox.x + markerBox.width > contentBox.x &&
        markerBox.y < contentBox.y + contentBox.height &&
        markerBox.y + markerBox.height > contentBox.y;
      expect(overlaps, `${viewport.name} marker/content overlap`).toBe(false);
    }

    const ctaBox = await this.cta.boundingBox();
    expect(ctaBox).not.toBeNull();
    expect(ctaBox?.height ?? 0).toBeGreaterThanOrEqual(48);
    expect(ctaBox?.width ?? 0).toBeLessThan(contentBox?.width ?? Number.POSITIVE_INFINITY);
    await expect(this.cta).toBeVisible();

    await this.page.keyboard.press("Tab");
    await expect(this.page.locator(".skip-link")).toBeFocused();
    await this.page.keyboard.press("Tab");
    await this.expectVisibleFocus(this.cta);
  }

  async applyEffectiveTextScale200(): Promise<void> {
    await this.page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await expect.poll(() => this.page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe("32px");
  }

  async expectTextScaleReflow(): Promise<void> {
    const metrics = await this.page.evaluate(() => ({
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));
    expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.documentClientWidth);
    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.documentClientWidth);

    const [plaqueBox, markerBox, contentBox, titleBox, ctaBox] = await Promise.all([
      this.plaque.boundingBox(),
      this.marker.boundingBox(),
      this.content.boundingBox(),
      this.page.locator(".not-found-title").boundingBox(),
      this.cta.boundingBox(),
    ]);
    expect(plaqueBox).not.toBeNull();
    expect(markerBox).not.toBeNull();
    expect(contentBox).not.toBeNull();
    expect(titleBox).not.toBeNull();
    expect(ctaBox).not.toBeNull();

    if (
      plaqueBox !== null &&
      markerBox !== null &&
      contentBox !== null &&
      titleBox !== null &&
      ctaBox !== null
    ) {
      expect(markerBox.x).toBeGreaterThanOrEqual(plaqueBox.x);
      expect(markerBox.x + markerBox.width).toBeLessThanOrEqual(plaqueBox.x + plaqueBox.width);
      expect(contentBox.x).toBeGreaterThanOrEqual(plaqueBox.x);
      expect(contentBox.x + contentBox.width).toBeLessThanOrEqual(plaqueBox.x + plaqueBox.width);
      expect(titleBox.x).toBeGreaterThanOrEqual(contentBox.x);
      expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(contentBox.x + contentBox.width);
      expect(ctaBox.x).toBeGreaterThanOrEqual(contentBox.x);
      expect(ctaBox.x + ctaBox.width).toBeLessThanOrEqual(contentBox.x + contentBox.width);
      expect(ctaBox.height).toBeGreaterThanOrEqual(48);
    }

    await expect(this.cta).toBeVisible();
  }

  async recoverToRootWithoutProgression(): Promise<void> {
    expect(await this.page.evaluate(() => sessionStorage.getItem("kuroneko:session-progression:v1"))).toBeNull();
    await this.cta.click();
    await expect(this.page).toHaveURL(/\/$/u);
    await expect(this.page.locator(".vault-shell")).toBeVisible();
    await expect(this.page.locator(".main-hall")).toHaveCount(0);
    await expect(this.page.locator(".portfolio-alternate-card")).toHaveCount(0);
    expect(await this.page.evaluate(() => sessionStorage.getItem("kuroneko:session-progression:v1"))).toBeNull();
  }
}
