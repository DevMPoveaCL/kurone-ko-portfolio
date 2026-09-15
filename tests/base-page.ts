import { expect, type Locator, type Page } from "@playwright/test";

export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path = "/"): Promise<void> {
    await this.page.goto(path, { waitUntil: "domcontentloaded" });
  }

  async expectNoUnsafeAutomationEndpoints(): Promise<void> {
    const response = await this.page.request.get("/__playwright", { failOnStatusCode: false });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  }

  async expectVisibleFocus(locator: Locator): Promise<void> {
    await expect(locator).toBeFocused();

    const outlineStyle = await locator.evaluate((element) => window.getComputedStyle(element).outlineStyle);

    expect(outlineStyle).not.toBe("none");
  }
}
