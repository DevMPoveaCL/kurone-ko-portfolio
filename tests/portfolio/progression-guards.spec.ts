import { expect, test, type Page } from "@playwright/test";
import { PortfolioPage } from "./portfolio-page";

interface ProgressionNoFlashProbe {
  installed: boolean;
  protectedAdds: number;
}

type ProgressionProbeWindow = Window & {
  __progressionNoFlashProbe?: ProgressionNoFlashProbe;
};

async function installNoFlashProbe(page: Page) {
  await page.addInitScript(() => {
    const protectedSelectors = [".main-hall", ".portfolio-alternate-card"];
    const probe: ProgressionNoFlashProbe = { installed: true, protectedAdds: 0 };
    const containsProtectedNode = (node: Node) => {
      if (!(node instanceof Element)) return false;
      return protectedSelectors.some((selector) => node.matches(selector) || node.querySelector(selector) !== null);
    };
    const inspectCurrentDom = () => {
      if (protectedSelectors.some((selector) => document.querySelector(selector) !== null)) probe.protectedAdds += 1;
    };
    const observe = () => {
      if (document.documentElement === null) return;
      new MutationObserver((records) => {
        if (records.some((record) => [...record.addedNodes].some(containsProtectedNode))) probe.protectedAdds += 1;
      }).observe(document.documentElement, { childList: true, subtree: true });
      inspectCurrentDom();
    };

    Object.defineProperty(window as ProgressionProbeWindow, "__progressionNoFlashProbe", {
      configurable: true,
      value: probe,
    });
    if (document.documentElement === null) document.addEventListener("DOMContentLoaded", observe, { once: true });
    else observe();
  });
}

async function readNoFlashProbe(page: Page): Promise<ProgressionNoFlashProbe> {
  return page.evaluate(() => (window as ProgressionProbeWindow).__progressionNoFlashProbe ?? { installed: false, protectedAdds: -1 });
}

async function resetNoFlashProbe(page: Page) {
  await page.evaluate(() => {
    const probe = (window as ProgressionProbeWindow).__progressionNoFlashProbe;
    if (probe !== undefined) probe.protectedAdds = 0;
  });
}

async function earnMainHall(page: Page) {
  const portfolio = new PortfolioPage(page);
  await portfolio.gotoPortfolio();
  await portfolio.reopenSealInterfaceFromClosedCurtain();

  for (const expectedName of [
    "Sello 1 — El Ojo",
    "Sello 2 — La Garra",
    "Sello 3 — La Cerradura",
  ]) {
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("dialog", { name: expectedName })).toBeVisible();
    await portfolio.closeSealModalWithCloseButton(expectedName);
  }

  await page.getByRole("button", { name: "Mis obras en construcción" }).click();
  await expect(page.getByRole("dialog", { name: "Transición a la sala principal" })).toHaveCount(1);
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  await portfolio.expectMainHallFocused(15_000);
}

test.describe("session progression guards", () => {
  test.describe.configure({ mode: "serial" });

  for (const { activation, completion } of [
    { activation: "pointer", completion: "skip" },
    { activation: "Enter", completion: "ended" },
    { activation: "Space", completion: "skip" },
  ] as const) {
    test(
      `completes the unseeded arrow flow once with ${activation} activation`,
      { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-PROGRESSION-E2E-001"] },
      async ({ page }) => {
      test.setTimeout(120_000);
      const portfolio = new PortfolioPage(page);

      await portfolio.gotoPortfolio();
      await portfolio.reopenSealInterfaceFromClosedCurtain();

      for (const [index, expectedName] of [
        "Sello 1 — El Ojo",
        "Sello 2 — La Garra",
        "Sello 3 — La Cerradura",
      ].entries()) {
        await page.keyboard.press("ArrowRight");
        await expect(page.getByRole("dialog", { name: expectedName })).toBeVisible();
        await expect(page.getByText(`Desbloqueado ${index + 1}/3`)).toBeVisible();
        await portfolio.closeSealModalWithCloseButton(expectedName);
      }

      await expect(page.getByRole("button", { name: "Mis obras en construcción" })).toBeEnabled();
      await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("kuroneko:session-progression:v1") ?? "{}").unlockedSealIds)).toEqual([
        "seal-eye",
        "seal-claw",
        "seal-lock",
      ]);

      const cta = page.getByRole("button", { name: "Mis obras en construcción" });
      if (activation === "pointer") {
        await cta.click();
      } else {
        await cta.focus();
        await page.keyboard.press(activation);
      }

      await expect(page.getByRole("dialog", { name: "Transición a la sala principal" })).toHaveCount(1);
      if (completion === "ended") {
        await page.locator("video").dispatchEvent("ended");
      } else {
        await page.getByRole("button", { name: "Saltar introducción" }).click();
      }

      await portfolio.expectMainHallFocused(15_000);
      await expect(page.getByRole("region", { name: "Sala principal de proyectos" })).toHaveCount(1);
      await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("kuroneko:session-progression:v1") ?? "{}").mainHallUnlocked)).toBe(true);
      },
    );
  }

  test("rejects direct showcase and alternate-route URLs without session progress", async ({
    page,
  }) => {
    await installNoFlashProbe(page);
    await page.goto("/?view=showcase&tech=react&project=timer");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".vault-shell")).toBeVisible();
    await expect(
      page.getByRole("list", { name: "Proyectos filtrados" }),
    ).toHaveCount(0);
    await expect.poll(async () => (await readNoFlashProbe(page)).protectedAdds).toBe(0);

    await page.goto("/portfolio");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".vault-shell")).toBeVisible();
    await expect(page.locator(".portfolio-alternate-card")).toHaveCount(0);
    await expect.poll(async () => (await readNoFlashProbe(page)).protectedAdds).toBe(0);
  });

  test("resets malformed session progression before rendering protected content", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        "kuroneko:session-progression:v1",
        JSON.stringify({
          version: 1,
          introCompleted: true,
          unlockedSealIds: ["seal-eye", "unknown-seal"],
          mainHallUnlocked: true,
          hiddenChallengeIds: [],
          alternateHandoff: null,
          alternateResidency: "inactive",
        }),
      );
    });

    await page.goto("/?view=showcase");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".portfolio-alternate-card")).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(() =>
          sessionStorage.getItem("kuroneko:session-progression:v1"),
        ),
      )
      .toBeNull();
  });

  test("allows alternate portfolio entry only through a same-session handoff", async ({
    page,
  }) => {
    const portfolio = new PortfolioPage(page);
    await portfolio.gotoPortfolio();

    await expect(page.getByRole("link", { name: "VERSIÓN MINIMALISTA" })).toBeVisible();
    await page.getByRole("link", { name: "VERSIÓN MINIMALISTA" }).click();
    await expect(page).toHaveURL(/\/portfolio$/);
    await expect(portfolio.alternateCards).toHaveCount(13);

    await page.getByRole("link", { name: "Volver" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/portfolio");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".portfolio-alternate-card")).toHaveCount(0);
  });

  test("replays the root journey from the closed curtain after a genuine reload", async ({ page }) => {
    test.setTimeout(120_000);
    await installNoFlashProbe(page);
    await earnMainHall(page);
    await resetNoFlashProbe(page);

    await page.reload({ waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "¿Qué hay detrás?" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Sala principal de proyectos" })).toHaveCount(0);
    await expect(page.locator(".portfolio-alternate-card")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("kuroneko:session-progression:v1"))).toBeNull();
    await expect.poll(async () => (await readNoFlashProbe(page)).protectedAdds).toBe(0);
  });

  test("replays the showcase URL from the closed curtain after a genuine reload", async ({ page }) => {
    test.setTimeout(120_000);
    await installNoFlashProbe(page);
    await earnMainHall(page);
    await page.goto("/?view=showcase");
    await expect(page.getByRole("button", { name: /^Filtros/ })).toBeVisible({ timeout: 30_000 });
    await resetNoFlashProbe(page);

    await page.reload({ waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "¿Qué hay detrás?" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Sala principal de proyectos" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Filtros/ })).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("kuroneko:session-progression:v1"))).toBeNull();
    await expect.poll(async () => (await readNoFlashProbe(page)).protectedAdds).toBe(0);
  });

  test("revokes CTA-issued alternate access after reloading the alternate route", async ({ page }) => {
    test.setTimeout(120_000);
    await installNoFlashProbe(page);
    const portfolio = new PortfolioPage(page);
    await portfolio.gotoPortfolio();
    await page.getByRole("link", { name: "VERSIÓN MINIMALISTA" }).click();
    await expect(page).toHaveURL(/\/portfolio$/);
    await expect(portfolio.alternateCards).toHaveCount(13, { timeout: 30_000 });
    await resetNoFlashProbe(page);

    await page.reload({ waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "¿Qué hay detrás?" })).toBeVisible();
    await expect(page.locator(".portfolio-alternate-card")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Sala principal de proyectos" })).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("kuroneko:session-progression:v1"))).toBeNull();
    await expect.poll(async () => (await readNoFlashProbe(page)).protectedAdds).toBe(0);
  });

  test("preserves progression across normal SPA filters and detail navigation", async ({ page }) => {
    test.setTimeout(120_000);
    await earnMainHall(page);

    await page.getByRole("button", { name: "Filtros" }).click();
    await expect(page.getByRole("dialog", { name: /UN GRAN PODER CONLLEVA UNA GRAN RESPONSABILIDAD/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: /UN GRAN PODER CONLLEVA UNA GRAN RESPONSABILIDAD/ })).toHaveCount(0);

    const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Software Engineering Playbook" }) });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: /Ver historia de/ }).click();
    await expect(page.getByRole("dialog", { name: "Software Engineering Playbook" })).toBeVisible();
    await page.getByRole("button", { name: /Cerrar información de/ }).click();
    await expect(page.getByRole("region", { name: "Sala principal de proyectos" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("kuroneko:session-progression:v1") ?? "{}").mainHallUnlocked)).toBe(true);
  });

  test("preserves valid progression across browser back and forward", async ({ page }) => {
    test.setTimeout(120_000);
    await earnMainHall(page);

    await page.goto("/?view=showcase");
    await expect(page.getByRole("button", { name: /^Filtros/ })).toBeVisible({ timeout: 30_000 });
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("region", { name: "Sala principal de proyectos" })).toBeVisible();
    await page.goForward();
     await expect(page).toHaveURL(/\/\?view=showcase$/u);
    await expect(page.getByRole("button", { name: /^Filtros/ })).toBeVisible({ timeout: 30_000 });
    await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("kuroneko:session-progression:v1") ?? "{}").mainHallUnlocked)).toBe(true);
  });

  test("shows a usable success modal with fallback art when the success image fails", async ({
    page,
  }) => {
    await page.route("**/assets/projects/acertijos.webp", (route) =>
      route.abort(),
    );

    const portfolio = new PortfolioPage(page);
    await portfolio.gotoShowcase();
    const success = await portfolio.unlockFromFilter("El Tío Ben");

    await expect(success).toBeVisible();
    await expect(success.locator("[data-image-fallback='true']")).toBeVisible();
    await expect(
      success.getByRole("button", { name: "CONTINUAR" }),
    ).toBeFocused();

    await success.getByRole("button", { name: "CONTINUAR" }).click();
    await expect(success).toHaveCount(0);
  });

  test("holds the success reveal until delayed image readiness completes", async ({
    page,
  }) => {
    let releaseImage!: () => void;
    let resolveImageRequest!: () => void;
    const imageRequestSeen = new Promise<void>((resolve) => {
      resolveImageRequest = resolve;
    });
    const imageGate = new Promise<void>((resolve) => {
      releaseImage = resolve;
    });

    await page.route("**/assets/projects/acertijos.webp", async (route) => {
      resolveImageRequest();
      await imageGate;
      await route.continue();
    });

    const portfolio = new PortfolioPage(page);
    await portfolio.gotoShowcase();
    await page.getByRole("button", { name: /^Filtros/ }).click();
    const filterDialog = page.getByRole("dialog", { name: /UN GRAN PODER CONLLEVA UNA GRAN RESPONSABILIDAD/ });
    await filterDialog.getByRole("searchbox", { name: "Buscar tecnología" }).pressSequentially("El Tío Ben", { delay: 8 });
    const success = page.getByRole("dialog", { name: "PROYECTOS DESBLOQUEADOS" });

    await imageRequestSeen;
    await expect(filterDialog).toHaveCount(0);
    await expect(success).toHaveCount(0);
    await expect(page.getByText("PROYECTOS DESBLOQUEADOS", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "CONTINUAR" })).toHaveCount(0);

    releaseImage();
    await Promise.all([
      expect(success).toBeVisible(),
      expect(success.locator("img[alt='Kuroneko disfrazado de superhéroe']")).toBeVisible(),
      expect(success.getByRole("button", { name: "CONTINUAR" })).toBeFocused(),
    ]);
  });

  test("replays from the closed curtain after a reload with partial seals", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await installNoFlashProbe(page);
    const portfolio = new PortfolioPage(page);
    await portfolio.gotoPortfolio();
    await portfolio.reopenSealInterfaceFromClosedCurtain();

    await page.getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ }).click();
    await portfolio.closeSealModalWithCloseButton("Sello 1 — El Ojo");
    await page.getByRole("button", { name: /Sello 2 — La Garra.*Bloqueado/ }).click();
    await portfolio.closeSealModalWithCloseButton("Sello 2 — La Garra");
    await expect(page.getByText("Desbloqueado 2/3")).toBeVisible();
    await resetNoFlashProbe(page);

    await page.reload({ waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "¿Qué hay detrás?" })).toBeVisible();
    await expect(page.getByText("Desbloqueado 2/3")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Sala principal de proyectos" })).toHaveCount(0);
    await expect(page.locator(".portfolio-alternate-card")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("kuroneko:session-progression:v1"))).toBeNull();
    await expect.poll(async () => (await readNoFlashProbe(page)).protectedAdds).toBe(0);
  });
});
