import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "../base-page";

// Runtime policy: 4s initial load + 120ms retry delay + 4s retry load, with scheduling margin.
const INTRO_FRAME_TRANSITION_TIMEOUT_MS = 10_000;
const VALID_PROGRESSION_FIXTURE = {
  alternateHandoff: null,
  alternateResidency: "inactive",
  hiddenChallengeIds: [],
  introCompleted: true,
  mainHallUnlocked: true,
  unlockedSealIds: ["seal-eye", "seal-claw", "seal-lock"],
  version: 1,
} as const;

type ValidProgressionFixture = Omit<typeof VALID_PROGRESSION_FIXTURE, "alternateResidency"> & {
  alternateResidency: "active" | "inactive";
};

export class PortfolioPage extends BasePage {
  readonly shell: Locator;
  readonly status: Locator;
  readonly previousButton: Locator;
  readonly nextButton: Locator;
  readonly projectNextButton: Locator;
  readonly alternateCards: Locator;
  readonly alternateEntry: Locator;

  private readonly desktopIntroGuidance = "Puedes navegar con scroll, flecha izquierda o flecha derecha.";
  private readonly desktopSealGuidance = "Recorre los sellos con las flechas izquierda y derecha, o haz click sobre ellos.";
  private readonly mobileSealGuidance = "Pulsa sobre los sellos para activarlos.";

  constructor(page: Page) {
    super(page);
    this.shell = page.locator(".vault-shell");
    this.status = page.getByRole("status");
    this.previousButton = page.getByRole("button", { name: "Sello anterior" });
    this.nextButton = page.getByRole("button", { name: "Siguiente sello" });
    this.projectNextButton = page.getByRole("button", { name: "Proyecto siguiente" });
    this.alternateCards = page.locator(".portfolio-alternate-card");
    this.alternateEntry = page.getByRole("link", { name: "VERSIÓN MINIMALISTA" });
  }

  async gotoPortfolio(): Promise<void> {
    await this.goto("/");
    await expect(this.shell).toBeVisible();
  }

  async gotoShowcase(): Promise<void> {
    await this.seedValidProgression();
    await this.page.addInitScript(() => {
      sessionStorage.setItem("kuroneko:vault-cinematic-seen:v1", "1");
    });
    await this.goto("/?view=showcase");
    await expect(this.page.getByRole("button", { name: /^Filtros/ })).toBeVisible({ timeout: 30_000 });
    await expect(this.page.getByRole("list", { name: "Proyectos filtrados" })).toBeVisible();
  }

  async gotoAlternatePortfolio(): Promise<void> {
    await this.seedValidProgression({ alternateResidency: "active" });
    await this.goto("/portfolio");
    await expect(this.alternateCards).toHaveCount(13);
    await expect(this.page.locator('.bug-cesante-player[data-player-ready="true"]')).toBeVisible();
  }

  async reopenSealInterfaceFromClosedCurtain(): Promise<void> {
    const curtain = this.page.locator(".vault-curtain-opening");

    await expect.poll(async () => {
      if (await curtain.count() === 0) return true;
      return await curtain.getAttribute("data-intro-frame-state") === "drawn" && /^\d+$/.test(await curtain.getAttribute("data-rendered-frame") ?? "");
    }, { timeout: INTRO_FRAME_TRANSITION_TIMEOUT_MS }).toBe(true);

    for (let step = 0; step < 16 && await curtain.count(); step += 1) {
      const frame = Number(await curtain.getAttribute("data-rendered-frame"));
      await this.page.mouse.wheel(0, 1800);
      await expect.poll(async () => {
        if (await curtain.count() === 0) return true;
        const renderedFrame = Number(await curtain.getAttribute("data-rendered-frame"));
        return Number.isFinite(renderedFrame) && renderedFrame > frame;
      }, { timeout: INTRO_FRAME_TRANSITION_TIMEOUT_MS }).toBe(true);
    }

    await expect(curtain).toHaveCount(0);
    await expect(this.page.getByText("Desbloqueado 0/3")).toBeVisible();
  }

  async enterShowcaseFromCurrentPage(): Promise<void> {
    await this.seedValidProgression();
    await this.page.evaluate(() => {
      sessionStorage.setItem("kuroneko:vault-cinematic-seen:v1", "1");
    });
    await this.page.goto("/?view=showcase", { waitUntil: "domcontentloaded" });
    await expect(this.page.getByRole("button", { name: /^Filtros/ })).toBeVisible({ timeout: 30_000 });
    await expect(this.page.getByRole("list", { name: "Proyectos filtrados" })).toBeVisible();
  }

  async seedValidProgression(
    overrides: Partial<ValidProgressionFixture> = {},
  ): Promise<void> {
    await this.page.addInitScript((fixture) => {
      sessionStorage.setItem("kuroneko:session-progression:v1", JSON.stringify(fixture));
    }, { ...VALID_PROGRESSION_FIXTURE, ...overrides });
  }

  async openLockedRiddle(): Promise<Locator> {
    const lockedCard = this.page.getByRole("article").filter({ hasText: "Proyecto oculto y bloqueado." });

    for (let attempt = 0; attempt < 13 && !(await lockedCard.isVisible().catch(() => false)); attempt += 1) {
      await this.projectNextButton.click();
    }

    await expect(lockedCard).toBeVisible();
    await lockedCard.getByRole("button", { name: /^Ver stack de/ }).click();
    const dialog = this.page.getByRole("dialog", { name: "ACERTIJO" });
    await expect(dialog).toBeVisible();
    return dialog;
  }

  async unlockFromFilter(answer: string): Promise<Locator> {
    await this.page.getByRole("button", { name: /^Filtros/ }).click();
    const filterDialog = this.page.getByRole("dialog", { name: /UN GRAN PODER CONLLEVA UNA GRAN RESPONSABILIDAD/ });
    await expect(filterDialog).toBeVisible();
    await filterDialog.getByRole("searchbox", { name: "Buscar tecnología" }).pressSequentially(answer, { delay: 8 });
    const successDialog = this.page.getByRole("dialog", { name: "PROYECTOS DESBLOQUEADOS" });
    await expect(successDialog).toBeVisible();
    return successDialog;
  }

  async expectFirstFrame(): Promise<void> {
    await expect(this.shell).toBeVisible();
    await expect(this.page.getByRole("heading", { name: "¿Qué hay detrás?" })).toBeVisible();
    await expect(this.status).toHaveAccessibleName(this.desktopIntroGuidance, { timeout: 30_000 });
  }

  async openSealInterfaceWithKeyboard(): Promise<void> {
    const sealProgress = this.page.getByText("Desbloqueado 0/3");
    const viewport = this.page.viewportSize();
    const guidance = (viewport?.width ?? 1280) <= 768 ? this.mobileSealGuidance : this.desktopSealGuidance;

    await this.shell.focus();
    await expect(this.status).toHaveAccessibleName(guidance, { timeout: 30_000 });
    await expect(sealProgress).toBeVisible();
    await expect(this.page.getByRole("heading", { name: "Sello 1 — El Ojo" })).toHaveCount(0);
  }

  async expectReducedMotionActive(): Promise<void> {
    await expect(this.page.getByRole("button", { name: /Usar movimiento estándar|Usar movimiento reducido/ })).toHaveCount(0);
    await expect(this.page.getByRole("button", { name: /Pausar movimiento|Reanudar movimiento/ })).toHaveCount(0);
    await expect(this.status).toHaveAccessibleName(this.desktopSealGuidance);
  }

  async expectSealHud(count: number): Promise<void> {
    await expect(this.page.getByText(`Desbloqueado ${count}/3`)).toBeVisible();
  }

  async expectMobileSealHud(count: number): Promise<void> {
    await expect(this.page.locator(".vault-unlock-progress-hud", { hasText: `Desbloqueado ${count}/3` })).toBeVisible();
  }

  async expectNoUmbralCopy(): Promise<void> {
    await expect(this.page.getByText(/Umbral/i)).toHaveCount(0);
  }

  async expectDesktopSealGuidance(): Promise<void> {
    await expect(this.status).toHaveAccessibleName(this.desktopSealGuidance);
    await expect(this.previousButton).toBeVisible();
    await expect(this.nextButton).toBeVisible();
    await expect(this.page.locator(".vault-riddle-panel").getByRole("button", { name: /Sello anterior|Siguiente sello/ })).toHaveCount(0);
    await expect(this.status).toContainText("Recorre los sellos con las flechas o haz click sobre ellos.");
    await expect(this.status).not.toContainText(/izquierda\s+o\s+derecha/);
  }

  async expectSelectionDisabledForVault(): Promise<void> {
    await expect(this.shell).toHaveCSS("user-select", "none");
  }

  async expectCenteredArrowControls(): Promise<void> {
    await expect(this.previousButton).toBeVisible();
    await expect(this.nextButton).toBeVisible();
    await expect(this.page.locator(".vault-seal-carousel-controls")).toHaveCSS("position", "fixed");
  }

  async expectArrowControlsAvoidSealsAndDialogue(): Promise<void> {
    const panel = this.page.locator(".vault-riddle-panel");
    const controls = [this.previousButton, this.nextButton];
    const seals = [
      this.page.getByRole("button", { name: /Sello 1 — El Ojo/ }),
      this.page.getByRole("button", { name: /Sello 2 — La Garra/ }),
      this.page.getByRole("button", { name: /Sello 3 — La Cerradura/ }),
    ];
    const panelBox = await panel.boundingBox();
    const sealBoxes = await Promise.all(seals.map((seal) => seal.boundingBox()));

    expect(panelBox).not.toBeNull();
    expect(sealBoxes.every((box) => box !== null)).toBe(true);

    for (const control of controls) {
      const controlBox = await control.boundingBox();

      expect(controlBox).not.toBeNull();

      if (controlBox === null || panelBox === null) {
        continue;
      }

      expect(controlBox.y + controlBox.height).toBeLessThanOrEqual(panelBox.y);

      for (const sealBox of sealBoxes) {
        if (sealBox === null) {
          continue;
        }

        const overlaps =
          controlBox.x < sealBox.x + sealBox.width &&
          controlBox.x + controlBox.width > sealBox.x &&
          controlBox.y < sealBox.y + sealBox.height &&
          controlBox.y + controlBox.height > sealBox.y;

        expect(overlaps).toBe(false);
      }
    }
  }

  async getHudMetrics(): Promise<{ fontSize: number; x: number; y: number }> {
    const hud = this.page.locator(".vault-unlock-progress-hud");
    const box = await hud.boundingBox();
    const fontSize = await hud.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));

    expect(box).not.toBeNull();

    return { fontSize, x: box?.x ?? 0, y: box?.y ?? 0 };
  }

  async expectCompletionEmphasis(): Promise<void> {
    const cta = this.page.getByRole("button", { name: "Mis obras en construcción" });

    await expect(this.shell).toHaveAttribute("data-vault-complete", "true");
    await expect(this.shell).toHaveAttribute("data-seal-dialog-open", "false");
    await expect(cta).toBeEnabled();
    await expect(cta).toHaveCSS("opacity", "1");
    await expect(cta).toHaveCSS("background-color", "rgb(255, 255, 255)");
  }

  async expectMobileDialogueCentered(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Tres sellos antes de entrar." })).toHaveCSS("text-align", "center");
    await expect(this.status).toHaveCSS("text-align", "center");
  }

  async activateFirstSealFromZeroWithKeyboard(): Promise<void> {
    await this.openSealInterfaceWithKeyboard();
    await this.page.keyboard.press("ArrowRight");
    await expect(this.page.getByRole("dialog", { name: "Sello 1 — El Ojo" })).toBeVisible();
  }

  async expectArrowControlCarouselWraps(): Promise<void> {
    await this.openSealInterfaceWithKeyboard();
    await this.previousButton.click();
    await expect(this.page.getByRole("dialog", { name: "Sello 3 — La Cerradura" })).toBeVisible();
    await this.closeSealModalWithCloseButton("Sello 3 — La Cerradura");
    await this.nextButton.click();
    await expect(this.page.getByRole("dialog", { name: "Sello 1 — El Ojo" })).toBeVisible();
  }

  async expectMobileSealSelectionClean(): Promise<void> {
    await expect(this.status).toHaveAccessibleName(this.mobileSealGuidance);
    await expect(this.status).toContainText(this.mobileSealGuidance);
    await this.expectMobileSealHud(0);
    await expect(this.page.getByRole("heading", { name: "Sello 1 — El Ojo" })).toHaveCount(0);
    await expect(this.page.getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ })).toBeVisible();
    await expect(this.page.getByRole("button", { name: "Mis obras en construcción" })).toBeVisible();
  }

  async openMobileSealModal(): Promise<void> {
    await this.page.getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ }).click();
    await expect(this.page.getByRole("dialog", { name: "Sello 1 — El Ojo" })).toBeVisible();
    await expect(this.page.getByRole("button", { name: "Cerrar sello" })).toBeVisible();
    await this.expectMobileSealHud(1);
  }

  async openDesktopSealModal(): Promise<void> {
    await this.page.getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ }).click();
    await expect(this.page.getByRole("dialog", { name: "Sello 1 — El Ojo" })).toBeVisible();
    await expect(this.page.getByRole("button", { name: "Cerrar sello" })).toBeFocused();
  }

  async expectDesktopPanelWithoutLongText(): Promise<void> {
    await expect(this.page.locator(".vault-riddle-panel")).not.toContainText("A veces es muy difícil comenzar algo");
    await expect(this.status).toContainText("Recorre los sellos con las flechas o haz click sobre ellos.");
    await expect(this.page.getByRole("button", { name: "Mis obras en construcción" })).toBeVisible();
  }

  async closeMobileSealModal(): Promise<void> {
    await this.page.getByRole("button", { name: "Cerrar sello" }).click();
    await expect(this.page.getByRole("dialog", { name: "Sello 1 — El Ojo" })).toHaveCount(0);
    await expect(this.page.getByRole("button", { name: /Sello 1 — El Ojo.*Desbloqueado/ })).toBeVisible();
    await this.expectMobileSealHud(1);
  }

  async closeSealModalWithOutsideClick(dialogName: string): Promise<void> {
    await this.page.locator(".vault-seal-modal").click({ position: { x: 8, y: 8 } });
    await expect(this.page.getByRole("dialog", { name: dialogName })).toHaveCount(0);
  }

  async closeSealModalWithCloseButton(dialogName: string): Promise<void> {
    await this.page.getByRole("button", { name: "Cerrar sello" }).click();
    await expect(this.page.getByRole("dialog", { name: dialogName })).toHaveCount(0);
  }

  async closeSealModalWithEscape(dialogName: string): Promise<void> {
    await this.page.keyboard.press("Escape");
    await expect(this.page.getByRole("dialog", { name: dialogName })).toHaveCount(0);
  }

  async closeSealModalWithBrowserBack(dialogName: string): Promise<void> {
    await this.page.goBack();
    await expect(this.page.getByRole("dialog", { name: dialogName })).toHaveCount(0);
    await expect(this.shell).toBeVisible();
  }

  async unlockWithKeyboard(): Promise<void> {
    await this.openSealInterfaceWithKeyboard();
    await this.page.getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ }).click();
    await expect(this.page.getByRole("dialog", { name: "Sello 1 — El Ojo" })).toBeVisible();
    await expect(this.page.getByText("Desbloqueado 1/3")).toBeVisible();
    await this.closeSealModalWithCloseButton("Sello 1 — El Ojo");
    await this.page.getByRole("button", { name: /Sello 2 — La Garra.*Bloqueado/ }).click();
    await expect(this.page.getByRole("dialog", { name: "Sello 2 — La Garra" })).toBeVisible();
    await expect(this.page.getByText("Desbloqueado 2/3")).toBeVisible();
    await this.closeSealModalWithCloseButton("Sello 2 — La Garra");
    await this.page.getByRole("button", { name: /Sello 3 — La Cerradura.*Bloqueado/ }).click();
    await expect(this.page.getByRole("dialog", { name: "Sello 3 — La Cerradura" })).toBeVisible();
    await expect(this.page.getByText("Desbloqueado 3/3")).toBeVisible();
    await this.closeSealModalWithCloseButton("Sello 3 — La Cerradura");
    await this.page.getByRole("button", { name: "Mis obras en construcción" }).click();
  }

  async unlockAllSealsWithoutEntering(): Promise<void> {
    await this.openSealInterfaceWithKeyboard();
    await this.page.getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ }).click();
    await this.closeSealModalWithCloseButton("Sello 1 — El Ojo");
    await this.page.getByRole("button", { name: /Sello 2 — La Garra.*Bloqueado/ }).click();
    await this.closeSealModalWithCloseButton("Sello 2 — La Garra");
    await this.page.getByRole("button", { name: /Sello 3 — La Cerradura.*Bloqueado/ }).click();
    await expect(this.page.getByText("Desbloqueado 3/3")).toBeVisible();
    await this.closeSealModalWithCloseButton("Sello 3 — La Cerradura");
  }

  async unlockMobileVaultForCinematic(): Promise<void> {
    await expect(this.status).toHaveAccessibleName("Toca para abrir la bóveda.");
    const curtain = this.page.locator(".vault-curtain-opening");
    await expect.poll(async () => {
      if (await curtain.count() === 0) return true;
      return await curtain.getAttribute("data-intro-frame-state") === "drawn" && /^\d+$/.test(await curtain.getAttribute("data-rendered-frame") ?? "");
    }, { timeout: INTRO_FRAME_TRANSITION_TIMEOUT_MS }).toBe(true);
    for (let step = 0; step < 16 && await curtain.count(); step += 1) {
      const frame = Number(await curtain.getAttribute("data-rendered-frame"));
      await this.page.mouse.wheel(0, 1800);
      await expect.poll(async () => {
        if (await curtain.count() === 0) return true;
        const renderedFrame = Number(await curtain.getAttribute("data-rendered-frame"));
        return Number.isFinite(renderedFrame) && renderedFrame > frame;
      }, { timeout: INTRO_FRAME_TRANSITION_TIMEOUT_MS }).toBe(true);
    }
    await expect(curtain).toHaveCount(0);
    await expect(this.page.getByText("Desbloqueado 0/3")).toBeVisible();
    await this.unlockAllSealsWithoutEntering();
    await this.expectCinematicCtaReady();
  }

  cinematic() {
    return this.page.getByRole("dialog", { name: "Transición a la sala principal" });
  }

  async expectCinematicCtaReady(): Promise<void> {
    const cta = this.page.getByRole("button", { name: "Mis obras en construcción" });

    await expect(this.shell).toHaveAttribute("data-vault-complete", "true");
    await expect(this.shell).toHaveAttribute("data-seal-dialog-open", "false");
    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled();
  }

  async activateCinematic(): Promise<void> {
    await this.unlockMobileVaultForCinematic();
    await this.expectCinematicCtaReady();
    await this.page.getByRole("button", { name: "Mis obras en construcción" }).click();
  }

  async startCinematic(): Promise<void> {
    await this.activateCinematic();
    await expect(this.cinematic()).toBeVisible();
    await expect(this.page.getByRole("button", { name: "Saltar introducción" })).toBeFocused();
  }

  async expectEnterSpaceOnlyEntersWhenCtaEnabled(): Promise<void> {
    await this.openSealInterfaceWithKeyboard();
    await this.page.keyboard.press("Enter");
    await expect(this.page.getByRole("region", { name: "Sala principal de proyectos" })).toHaveCount(0);
    await expect(this.page.getByText("Desbloqueado 0/3")).toBeVisible();

    await this.unlockAllSealsWithoutEntering();
    await this.shell.focus();
    await this.page.keyboard.press("Space");
    await this.expectMainHallFocused();
  }

  async expectNoInternalSealMapping(): Promise<void> {
    await expect(this.page.getByText(/Conecta con/i)).toHaveCount(0);
    await expect(this.page.getByText(/marca/i)).toHaveCount(0);
  }

  async expectDesktopScrollGuidance(): Promise<void> {
    await expect(this.status).toHaveAccessibleName(this.desktopIntroGuidance, { timeout: 30_000 });
  }

  async expectMainHallFocused(timeout = 5_000): Promise<void> {
    const mainHall = this.page.getByRole("region", { name: "Sala principal de proyectos" });

    await expect(mainHall).toBeVisible({ timeout });
    await expect(mainHall).toBeFocused();
  }

  async expectVisiblePortfolioComprehensible(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Software Engineering Playbook" })).toBeVisible();
    await expect(this.page.getByRole("heading", { name: "Timer" })).toBeVisible();
    await expect(this.page.getByRole("heading", { name: "ElementalTCG" })).toBeVisible();
    await expect(this.page.getByRole("heading", { name: "Alarm" })).toBeVisible();
    await expect(this.page.getByRole("heading", { name: "Kurone-ko FilterCalls" })).toBeVisible();
    await expect(this.page.getByRole("heading", { name: "Kurone-ko GitHub Activity" })).toBeVisible();
    await expect(this.page.getByRole("heading", { name: "Portfolio" })).toBeHidden();
    await expect(this.page.getByText("Una puerta que todavía espera")).toBeHidden();
  }

  projectCard(projectName: string): Locator {
    return this.page.getByRole("article").filter({ has: this.page.getByRole("heading", { name: projectName }) });
  }

  async flipProjectCard(projectName: string): Promise<void> {
    const card = this.projectCard(projectName);
    const flipControl = card.getByRole("button", { name: "Ver reverso" });

    await expect(flipControl).toHaveAttribute("aria-expanded", "false");
    await flipControl.click();
    await expect(this.page.getByRole("button", { name: "Volver al frente" })).toHaveAttribute("aria-expanded", "true");
  }
}
