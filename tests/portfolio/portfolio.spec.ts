import { expect, test, type Locator } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { PortfolioPage } from "./portfolio-page";

declare global {
  interface Window {
    __portfolioRenderedFrames?: number[];
    __cinematicEvents?: { name: string; time: number }[];
    __cinematicCaptureKey?: string;
    __fittedBandTitleTimeline?: Array<{
      card: string;
      fontSize: number;
      height: number;
      opacity: string;
      time: number;
      width: number;
    }>;
    __fittedBandTextDebugEvents?: Array<Record<string, unknown>>;
  }
}

const INTRO_FRAME_RECOVERY_TIMEOUT_MS = 10_000;
const ROLLBACK_AFTER_ARTIFACTS = "artifacts/regression-rollback-after";
const PROJECT_UNLOCK_FRIENDLY_CONSOLE_MESSAGE =
  "¡Hola! ¿Revisando la consola? O.O... ¡Pillín! xD\nGracias por revisar mi portfolio; aprecio mucho que se tome el tiempo de verlo.\nSi quiere acceder a los proyectos “el tío ben”, “ben” o “narrador” de la forma que desee: no importan las mayúsculas, las tildes ni los espacios.\nDebe tipear la respuesta en la barra de búsqueda de FILTROS. ¡Gracias!";

const PROJECT_UNLOCK_MODAL_CASES = [
  {
    projectName: "Kurone-ko POS",
    stackTitle: "VENDER SIN PERDER EL RASTRO",
    stackKicker: "OPERACIÓN LOCAL PARA UNA CAJA REAL",
    introduction:
      "Construí Kurone-ko POS para quienes atienden un negocio y necesitan buscar productos, controlar stock, cobrar y cerrar caja sin adaptar su trabajo a búsquedas lentas o registros desconectados. La aplicación reúne esos flujos en un escritorio local y mantiene evidencia de cada operación.",
    evidence: "WAL + CLAVES FORÁNEAS · VENTAS ATÓMICAS · VENTA CON TECLADO O RATÓN",
    badges: ["Go", "Wails", "TypeScript", "Vite", "SQLite", "Vitest", "Playwright"],
    blockHeadings: [
      "Cobrar al ritmo del mesón",
      "Dominio separado del escritorio",
      "Stock, caja y evidencia en una transacción",
      "Pruebas sobre reglas y recorridos",
    ],
    infoTitle: "KURONE-KO POS",
    infoKicker: "UNA NECESIDAD COMPARTIDA POR MUCHAS PYMES",
    infoQuote:
      "El software debía adaptarse a las reglas del negocio, no obligar al negocio a cambiar sus reglas por las limitaciones de su arquitectura.",
    infoHeadings: ["ANANKE", "PRAXIS"],
    infoParagraphs: [
      "Conocí una pyme que trabajaba con un punto de venta que no conversaba con la realidad del negocio. Si se caía internet, las ventas y el stock podían quedar descuadrados; además, controlar vencimientos, revisar el inventario desde el celular o intercambiar catálogos y boletas con el SII quedaba fuera del flujo. Todo eso debía funcionar en computadores antiguos y con recursos limitados. De ahí nació la idea de construir una alternativa pensada para la operación real.",
      "Kurone-ko POS convirtió esa idea en un producto de escritorio local-first. Elegí Go, Wails y SQLite para mantener las reglas del negocio separadas de la interfaz y asegurar que ventas, stock y evidencia formen parte de una misma operación. El resultado es una base rápida, liviana y preparada para crecer sin perder continuidad cuando internet o el hardware ponen límites.",
    ],
  },
  {
    projectName: "Kurone-ko SII",
    stackTitle: "DE DATOS DISPERSOS A UN CIERRE EXPLICABLE",
    stackKicker: "INTELIGENCIA CONTABLE PARA EL CIERRE MENSUAL",
    introduction:
      "Construí Kurone-ko SII para integrar la operación comercial de Kurone-ko POS con la realidad financiera de Kurone-ko PymeFlow y contrastarlas con la información tributaria del SII. El producto convierte esas fuentes en una historia contable trazable, capaz de explicar qué se vendió, cómo se movió el dinero y de dónde viene cada cifra del cierre.",
    evidence: "POS + PYMEFLOW + SII · CONCILIACIÓN TRAZABLE · CIERRE BAJO CONTROL HUMANO",
    badges: ["POS", "PYMEFLOW", "DTE", "IVA", "F29", "IA"],
    blockHeadings: ["Integración de fuentes", "Conciliación contable", "Cierre tributario", "Criterio asistido"],
    infoTitle: "KURONE-KO SII",
    infoKicker: "CUANDO LOS REGISTROS CONCILIAN, EL NEGOCIO SE ORDENA",
    infoQuote: "Cerrar un mes no debería significar reconstruir a mano decisiones que el negocio ya dejó registradas.",
    infoHeadings: ["ANANKE", "PRAXIS"],
    infoParagraphs: [
      "He visto cómo una venta puede quedar repartida entre la caja, la cartola y los registros tributarios, con cada fuente contando solo una parte de lo ocurrido. Cuando llega el cierre, esa fragmentación obliga a recordar, interpretar y volver a demostrar hechos que el negocio ya produjo. El problema no es que falten datos: es que todavía no forman una historia común.",
      "Por eso diseñé Kurone-ko SII: un espacio donde la operación comercial, el movimiento bancario y la información del SII se cruzan automáticamente. Al consolidar esas huellas, cualquier diferencia deja de parecer una alerta aislada y se convierte en una duda que puede resolverse desde su origen. Conciliar no consiste en forzar los números para que coincidan, sino en tener a mano la información real para entender el estado del negocio.",
    ],
  },
  {
    projectName: "Kurone-ko ExplorerMCP",
    stackTitle: "COMPRENDER ANTES DE ACTUAR",
    stackKicker: "UN PUENTE SEGURO ENTRE IA Y WINDOWS",
    introduction:
      "Construí Kurone-ko ExplorerMCP para que una IA pueda descubrir aplicaciones de Windows, comprender qué capacidades exponen y decidir hasta dónde es seguro interactuar. El producto combina un núcleo común con adaptadores especializados, porque observar una ventana no siempre significa entender lo que ocurre dentro de ella.",
    evidence: "WINDOWS + MCP · EXCEL · TRAZAS REVISABLES · ADAPTADORES SEMÁNTICOS",
    badges: ["C#", ".NET", "MCP", "UIA", "WIN32", "WEBSOCKET", "XUNIT"],
    blockHeadings: ["Descubrimiento", "Límites seguros", "Lenguaje semántico", "MCP extensible"],
    infoTitle: "KURONE-KO EXPLORERMCP",
    infoKicker: "CUANDO VER UNA VENTANA NO SIGNIFICA COMPRENDERLA",
    infoQuote:
      "No quería que una IA aprendiera a hacer clic a ciegas; quería darle una forma segura de comprender dónde estaba y qué significaba actuar.",
    infoHeadings: ["ANANKE", "PRAXIS"],
    infoParagraphs: [
      "Todo comenzó con una incomodidad: gran parte del trabajo cotidiano sigue encerrado dentro de aplicaciones de Windows que una IA puede ver, pero no necesariamente comprender. En Excel, reconocer una celda no significa entender la fórmula, la tabla o la decisión que representa; en una herramienta creativa, distinguir botones tampoco revela los objetos ni relaciones que forman una escena. Automatizar solo la superficie podía acelerar una acción, pero también multiplicar sus errores.",
      "Por eso construí Kurone-ko ExplorerMCP: un núcleo que descubre aplicaciones, observa sus capacidades y reconoce cuándo necesita un lenguaje más especializado. Blender fue la primera prueba de esa idea; Excel representa el mismo desafío aplicado a libros, hojas, rangos y fórmulas. La meta no es enseñar a una IA a mover el mouse por nosotros, sino darle el contexto suficiente para colaborar sin actuar a ciegas.",
    ],
  },
  {
    projectName: "Kurone-ko Translator",
    stackTitle: "ENTENDER A TIEMPO PARA PODER RESPONDER",
    stackKicker: "ASISTENCIA EN TIEMPO REAL PARA UNA CONVERSACIÓN REAL",
    introduction:
      "Construí Kurone-ko Translator después de vivir en Alemania durante todo 2025 y enfrentar llamadas de trabajo en un idioma que todavía no dominaba. Entender tarde una dirección, una fecha o una instrucción podía hacerme perder información importante y dejarme sin una forma clara de responder. Por eso prioricé una traducción rápida y legible que me permitiera comprender la conversación y participar con mi propia voz.",
    evidence: "ALEMÁN + ESPAÑOL · CONTEXTO ACUMULADO · RESPUESTA SIN TTS · VOZ PROPIA",
    badges: ["GO", "DEEPGRAM", "WEBSOCKET", "WINMM", "SSE", "LLM"],
    blockHeadings: ["Transcripción continua", "Arquitectura adaptable", "Audio nativo", "Fonética útil"],
    infoTitle: "KURONE-KO TRANSLATOR",
    infoKicker: "CUANDO NO ENTENDER A TIEMPO TAMBIÉN ES QUEDAR EXPUESTO",
    infoQuote:
      "Quería que la tecnología me ayudara a permanecer en la conversación, no que hablara por mí.",
    infoHeadings: ["HERMENEIA", "METAXY"],
    infoParagraphs: [
      "Mientras me preparaba para vivir y trabajar en Alemania, pensé en algo tan cotidiano como atender una llamada. Para una persona que no domina el alemán, no entender una dirección, una fecha o una pregunta en tiempo real puede convertir un trámite sencillo en una situación de vulnerabilidad. Kurone-ko Translator nació de esa necesidad personal: contar con apoyo suficiente para comprender lo que ocurre sin entregar por completo mi voz a una máquina.",
      "Por eso lo construí como un puente entre lo que escucho y lo que todavía no puedo expresar con fluidez. El sistema acumula la conversación en alemán, acerca su significado al español y propone una respuesta cuya pronunciación puedo leer. No busca fingir que domino el idioma: busca darme tiempo, contexto y una forma concreta de seguir participando por mí mismo.",
    ],
  },
  {
    projectName: "Kurone-ko Teacher",
    stackTitle: "APRENDER ARQUITECTURA VIVIENDO SUS CONSECUENCIAS",
    stackKicker: "NOVELA VISUAL EDUCATIVA SOBRE ARQUITECTURA",
    introduction:
      "Diseñé Kurone-ko Teacher como una novela visual de misterio para estudiar arquitectura de software de una forma más cercana y memorable. Cada capítulo convierte un problema habitual del desarrollo en conflicto, metáfora y decisión, porque yo también necesitaba comprender no solo qué dicen los principios técnicos, sino qué problemas intentan evitar.",
    evidence: "13 CAPÍTULOS · MISTERIO CONTINUO · METÁFORAS TÉCNICAS · DECISIONES EN ESCENA",
    badges: ["NOVELA VISUAL", "PEDAGOGÍA", "SOLID", "CLEAN", "HEXAGONAL", "TESTING"],
    blockHeadings: [
      "Aprender desde el problema",
      "El pingüino que no debía volar",
      "Arquitectura dentro del misterio",
      "Comprender tomando decisiones",
    ],
    infoTitle: "KURONE-KO TEACHER",
    infoKicker: "APRENDER SIN PERDER LA CURIOSIDAD",
    infoQuote:
      "Entender el nombre de un principio no significa comprender el problema que intenta evitar.",
    infoHeadings: ["MIMESIS", "PAIDEIA"],
    infoParagraphs: [
      "Mientras estudiaba arquitectura de software, noté que podía recordar una definición y aun así no reconocer cuándo debía aplicarla. Me faltaba conectar esos principios con errores, tensiones y consecuencias que pudiera imaginar dentro de un proyecto real. Kurone-ko Teacher nació de esa dificultad: quise convertir mi propio aprendizaje en una novela visual donde los problemas técnicos también fueran parte del conflicto.",
      "Por eso cada capítulo comienza con una situación concreta, la representa mediante una metáfora y solo después introduce el término técnico. No construí el proyecto desde la posición de quien tiene todas las respuestas, sino como una forma de ordenar lo que estaba aprendiendo y compartirlo con otras personas que también encuentran insuficiente memorizar definiciones.",
    ],
  },
] as const;

async function getModalGeometry(dialog: Locator, surfaceName: string) {
  return dialog.evaluate((dialogElement, name) => {
    const scroll = dialogElement.querySelector<HTMLElement>(".project-card-modal-scroll");
    if (scroll === null) throw new Error(`${name} scroll surface is unavailable.`);
    const rect = scroll.getBoundingClientRect();
    const contentRects = [...scroll.querySelectorAll<HTMLElement>("h3, p, li")].map((element) => element.getBoundingClientRect());
    return {
      documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      dialogOverflow: dialogElement.scrollWidth > dialogElement.clientWidth,
      horizontalContentOverflow: contentRects.some((content) => content.left < rect.left - 1 || content.right > rect.right + 1),
      scrollHeight: scroll.scrollHeight,
      scrollClientHeight: scroll.clientHeight,
    };
  }, surfaceName);
}

type ProjectUnlockModalCase = (typeof PROJECT_UNLOCK_MODAL_CASES)[number];

async function expectLockedProjectActions(
  page: import("@playwright/test").Page,
  card: Locator,
  modalCase: ProjectUnlockModalCase,
) {
  await card.focus();
  await page.keyboard.press("s");
  const lockedRiddle = page.getByRole("dialog", { name: "ACERTIJO" });
  await expect(lockedRiddle).toBeVisible();
  await expect(page.getByRole("dialog", { name: modalCase.stackTitle })).toHaveCount(0);
  await page.keyboard.press("s");
  await expect(lockedRiddle).toHaveCount(0);

  await card.focus();
  await page.keyboard.press("i");
  await expect(page.getByRole("dialog", { name: "ACERTIJO" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: modalCase.infoTitle })).toHaveCount(0);
  await page.keyboard.press("i");
  await expect(page.getByRole("dialog", { name: "ACERTIJO" })).toHaveCount(0);

  for (const sealName of ["stack", "historia"] as const) {
    const seal = card.getByRole("button", { name: `Ver ${sealName} de ${modalCase.projectName}` });
    await seal.click();
    await expect(page.getByRole("dialog", { name: "ACERTIJO" })).toBeVisible();
    await expect(page.getByRole("dialog", { name: sealName === "stack" ? modalCase.stackTitle : modalCase.infoTitle })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "ACERTIJO" })).toHaveCount(0);
  }
}

async function expectUnlockedProjectModals(
  page: import("@playwright/test").Page,
  modalCase: ProjectUnlockModalCase,
  viewportLabel: string,
  artifactPath: string,
) {
  const card = page.getByRole("article", { name: modalCase.projectName });
  const stackSeal = card.getByRole("button", { name: `Ver stack de ${modalCase.projectName}` });
  const infoSeal = card.getByRole("button", { name: `Ver historia de ${modalCase.projectName}` });

  await stackSeal.click();
  const stackDialog = page.getByRole("dialog", { name: modalCase.stackTitle });
  await expect(stackDialog).toBeVisible();
  await expect(stackDialog.getByText(modalCase.stackKicker, { exact: true })).toBeVisible();
  await expect(stackDialog.getByText(modalCase.introduction, { exact: true })).toBeVisible();
  await expect(stackDialog.getByText(modalCase.evidence, { exact: true })).toBeVisible();
  await expect(stackDialog.getByRole("link")).toHaveCount(0);
  await expect(stackDialog.locator(".project-one-stack-badges li")).toHaveText(modalCase.badges);
  await expect(stackDialog.locator(".project-one-stack-block h3")).toHaveText(modalCase.blockHeadings);
  const stackGeometry = await getModalGeometry(stackDialog, `${modalCase.projectName} Stack`);
  expect(stackGeometry.documentOverflow).toBe(false);
  expect(stackGeometry.dialogOverflow).toBe(false);
  expect(stackGeometry.horizontalContentOverflow).toBe(false);
  if (viewportLabel === "1280x800") {
    const badgeRows = await stackDialog.locator(".project-one-stack-badges li").evaluateAll(
      (badges) => new Set(badges.map((badge) => badge.getBoundingClientRect().y)).size,
    );
    expect(badgeRows).toBe(1);
  }
  await page.screenshot({ path: `${artifactPath}/${viewportLabel}-stack.png`, fullPage: true, scale: "css" });

  await page.keyboard.press("i");
  const infoDialog = page.getByRole("dialog", { name: modalCase.infoTitle });
  await expect(infoDialog).toBeVisible();
  await expect(infoDialog.getByText(modalCase.infoKicker, { exact: true })).toBeVisible();
  await expect(infoDialog.getByText(modalCase.infoQuote, { exact: false })).toBeVisible();
  await expect(infoDialog.locator(".project-one-modal-sections h3")).toHaveText(modalCase.infoHeadings);
  for (const paragraph of modalCase.infoParagraphs) {
    await expect(infoDialog.getByText(paragraph, { exact: true })).toBeVisible();
  }
  const infoGeometry = await getModalGeometry(infoDialog, `${modalCase.projectName} Info`);
  expect(infoGeometry.documentOverflow).toBe(false);
  expect(infoGeometry.dialogOverflow).toBe(false);
  expect(infoGeometry.horizontalContentOverflow).toBe(false);
  await page.screenshot({ path: `${artifactPath}/${viewportLabel}-info.png`, fullPage: true, scale: "css" });

  await page.keyboard.press("Escape");
  await expect(infoDialog).toHaveCount(0);
  await expect(infoSeal).toBeFocused();
  await stackSeal.click();
  await page.keyboard.press("Escape");
  await expect(stackDialog).toHaveCount(0);
  await expect(stackSeal).toBeFocused();
}

async function dispatchTouchDrag(
  cdp: import("@playwright/test").CDPSession,
  id: number,
  x: number,
  y: number,
  deltaX: number,
  deltaY: number,
) {
  await cdp.send("Input.dispatchTouchEvent", {
    touchPoints: [{ id, x, y }],
    type: "touchStart",
  });
  await cdp.send("Input.dispatchTouchEvent", {
    touchPoints: [{ id, x: x + deltaX, y: y + deltaY }],
    type: "touchMove",
  });
  await cdp.send("Input.dispatchTouchEvent", {
    touchPoints: [],
    type: "touchEnd",
  });
}

async function expectSettledCards(
  cards: import("@playwright/test").Locator,
  expectedCount: number,
  staticLayout = false,
  exactCount = false,
) {
  expect(expectedCount).toBeGreaterThan(0);
  await expect.poll(() => cards.count()).toBeGreaterThanOrEqual(expectedCount);
  if (exactCount) await expect(cards).toHaveCount(expectedCount);
  let previous = "";
  let stableFrames = 0;
  await expect
    .poll(
      async () => {
        const snapshot = await cards.evaluateAll((items) =>
          items
            .map((item) => {
              const { left, top, width, height } = item.getBoundingClientRect();
              return `${left},${top},${width},${height},${getComputedStyle(item).transform}`;
            })
            .join("|"),
        );
        stableFrames = snapshot === previous ? stableFrames + 1 : 0;
        previous = snapshot;
        const count = await cards.count();
        return (
          stableFrames >= 2 &&
          (exactCount ? count === expectedCount : count >= expectedCount)
        );
      },
      { timeout: 5_000 },
    )
    .toBe(true);
  const proof = await cards.evaluateAll((items) =>
    items.map((item) => {
      const { left, top, width, height } = item.getBoundingClientRect();
      return {
        left,
        top,
        width,
        height,
        transform: getComputedStyle(item).transform,
      };
    }),
  );
  expect(proof.length).toBeGreaterThanOrEqual(expectedCount);
  if (exactCount) expect(proof).toHaveLength(expectedCount);
  expect(
    new Set(
      proof.map(
        ({ left, top, width, height }) => `${left},${top},${width},${height}`,
      ),
    ).size,
  ).toBe(proof.length);
  expect(
    await cards.evaluateAll(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  if (staticLayout)
    expect(proof.every(({ transform }) => transform === "none")).toBe(true);
}

async function expectShowcaseCardReady(page: import("@playwright/test").Page) {
  const filterButton = page.getByRole("button", { name: "Filtros" });
  try {
    await expect(filterButton).toBeVisible({ timeout: 10_000 });
  } catch {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(filterButton).toBeVisible({ timeout: 30_000 });
  }
  await expect(page.locator(".project-card").first()).toBeVisible({
    timeout: 30_000,
  });
}

async function activateMusicThroughVoid(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Filtros" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("checkbox", { name: "Vacío" }).check();
  await page.getByRole("button", { name: /APLICAR/ }).click();
  await expect(page.locator(".bug-cesante-player")).toBeVisible();
}

interface SubtitleActivationMetrics {
  activation: number;
  band: RectSnapshot;
  effectBounds: RectSnapshot;
  font: string;
  fontCheck: boolean;
  fontSize: number;
  fontStatus: string;
  fitDebug: Record<string, unknown> | null;
  gaps: { bottom: number; left: number; right: number; top: number };
  ink: RectSnapshot;
  overflow: boolean;
  project: number;
  safeGaps: { bottom: number; left: number; right: number; top: number };
  text: string;
  time: number;
  visible: boolean;
}

async function readActiveSubtitleMetrics(
  page: import("@playwright/test").Page,
  activation: number,
): Promise<SubtitleActivationMetrics> {
  return page.evaluate((activation) => {
    const getRect = (element: Element | DOMRect): RectSnapshot => {
      const rect = element instanceof DOMRect ? element : element.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        width: rect.width,
      };
    };
    const activeItems = [
      ...document.querySelectorAll<HTMLElement>(
        ".project-showcase-item[data-active='true']",
      ),
    ];
    const item = activeItems[0];
    if (item === undefined) {
      throw new Error("Active project item is unavailable.");
    }
    const subtitle = item.querySelector<HTMLElement>(
      ".project-card-subtitle .fitted-band-text-content",
    );
    const band = item.querySelector<HTMLElement>('[data-card-band="bottom"]');
    if (subtitle === null || band === null) {
      throw new Error("Active subtitle metrics are unavailable.");
    }
    if (subtitle.firstChild === null) {
      throw new Error("Active subtitle text node is unavailable.");
    }
    const style = getComputedStyle(subtitle);
    const bandRect = getRect(band);
    const range = document.createRange();
    range.selectNodeContents(subtitle.firstChild);
    const ink = getRect(range.getBoundingClientRect());
    const shadowOffsets = [
      ...style.textShadow.matchAll(
        /(-?\d*\.?\d+)(?:px|rem|em)\s+(-?\d*\.?\d+)(?:px|rem|em)/g,
      ),
    ].flatMap((match) => [
      Math.abs(Number.parseFloat(match[1] ?? "0")),
      Math.abs(Number.parseFloat(match[2] ?? "0")),
    ]);
    const effectExtent = Math.max(
      ...shadowOffsets,
      (Number.parseFloat(
        style.getPropertyValue("-webkit-text-stroke-width"),
      ) || 0) / 2,
      0,
    );
    const effectBounds = {
      bottom: ink.bottom + effectExtent,
      height: ink.height + effectExtent * 2,
      left: ink.left - effectExtent,
      right: ink.right + effectExtent,
      top: ink.top - effectExtent,
      width: ink.width + effectExtent * 2,
    };
    const inlineInset =
      Number.parseFloat(style.getPropertyValue("--fitted-ink-safe-inline")) || 0;
    const blockInset =
      Number.parseFloat(style.getPropertyValue("--fitted-ink-safe-block")) || 0;
    const gap = (rect: RectSnapshot) => ({
      bottom: bandRect.bottom - rect.bottom,
      left: rect.left - bandRect.left,
      right: bandRect.right - rect.right,
      top: rect.top - bandRect.top,
    });
    const safeGap = {
      bottom: bandRect.bottom - blockInset - ink.bottom,
      left: ink.left - (bandRect.left + inlineInset),
      right: bandRect.right - inlineInset - ink.right,
      top: ink.top - (bandRect.top + blockInset),
    };
    const project =
      [...document.querySelectorAll(".project-showcase-item")].indexOf(item) + 1;
    const debugEvents =
      window.__fittedBandTextDebugEvents?.filter(
        (event) =>
          event.type === "fit-result" &&
          event.role === "subtitle" &&
          event.content === subtitle.textContent,
      ) ?? [];
    return {
      activation,
      band: bandRect,
      effectBounds,
      font: style.font,
      fontCheck: document.fonts.check(style.font, subtitle.textContent ?? ""),
      fontSize: Number.parseFloat(style.fontSize),
      fontStatus: document.fonts.status,
      fitDebug: debugEvents.at(-1) ?? null,
      gaps: gap(effectBounds),
      ink,
      overflow:
        subtitle.scrollWidth > subtitle.clientWidth + 1 ||
        subtitle.scrollHeight > subtitle.clientHeight + 1,
      project,
      safeGaps: safeGap,
      text: subtitle.textContent?.trim() ?? "",
      time: performance.now(),
      visible:
        style.visibility !== "hidden" &&
        style.opacity !== "0" &&
        ink.width > 0 &&
        ink.height > 0,
    };
  }, activation);
}

interface RectSnapshot {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
}

interface ProjectOneVisualMetrics {
  bands: RectSnapshot[];
  bodyZoom: number;
  card: RectSnapshot;
  lateralOffset: number;
  subtitle: { fontSize: number; rect: RectSnapshot };
  title: { fontSize: number; rect: RectSnapshot };
  ornaments: RectSnapshot | null;
  seals: Array<{
    hit: RectSnapshot;
    paintSafe: RectSnapshot;
    paintSafety: number;
    visual: RectSnapshot;
    visualPaint: RectSnapshot;
  }>;
}

async function readProjectOneVisualMetrics(
  page: import("@playwright/test").Page,
): Promise<ProjectOneVisualMetrics> {
  return page.evaluate(async () => {
    const getRect = (element: Element): RectSnapshot => {
      const rect = element.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        width: rect.width,
      };
    };

    const inflateRect = (rect: RectSnapshot, amount: number): RectSnapshot => ({
      bottom: rect.bottom + amount,
      height: rect.height + amount * 2,
      left: rect.left - amount,
      right: rect.right + amount,
      top: rect.top - amount,
      width: rect.width + amount * 2,
    });

    function getZoneRect(
      card: HTMLElement,
      inlineStart: string,
      inlineEnd: string,
      blockStart: string,
      blockEnd: string,
    ): RectSnapshot {
      const cardRect = getRect(card);
      const start = Number.parseFloat(inlineStart) / 100;
      const end = Number.parseFloat(inlineEnd) / 100;
      const top = Number.parseFloat(blockStart) / 100;
      const bottom = Number.parseFloat(blockEnd) / 100;
      return {
        bottom: cardRect.top + cardRect.height * bottom,
        height: cardRect.height * (bottom - top),
        left: cardRect.left + cardRect.width * start,
        right: cardRect.left + cardRect.width * end,
        top: cardRect.top + cardRect.height * top,
        width: cardRect.width * (end - start),
      };
    }

    const card = document.querySelector<HTMLElement>(
      '.project-card[data-card-presentation="media-title-bands"]',
    );
    if (card === null) throw new Error("Project one card unavailable.");
    const cardRect = getRect(card);
    const bodyZoom =
      Number.parseFloat(getComputedStyle(document.body).zoom) || 1;
    const title = card.querySelector<HTMLElement>(
      ".project-card-title .fitted-band-text-content",
    );
    const subtitle = card.querySelector<HTMLElement>(
      ".project-card-subtitle .fitted-band-text-content",
    );
    const sealsContainer = card.querySelector<HTMLElement>(
      ".project-card-seals",
    );
    if (title === null || subtitle === null || sealsContainer === null)
      throw new Error("Project one card metrics unavailable.");
    const rootFontSize = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    const paintSafety = Math.max(rootFontSize * 0.45, cardRect.width * 0.026);
    const focusPaintClearance = rootFontSize * (0.1875 + 0.25);
    const ornamentZone = getZoneRect(card, "24%", "76%", "0", "16.35%");

    return {
      bands: [...card.querySelectorAll<HTMLElement>("[data-card-band]")].map(
        getRect,
      ),
      bodyZoom,
      card: cardRect,
      lateralOffset:
        Math.max(0, rootFontSize - (cardRect.width / bodyZoom) * 0.04) *
        bodyZoom,
      subtitle: {
        fontSize: Number.parseFloat(getComputedStyle(subtitle).fontSize),
        rect: getRect(subtitle),
      },
      title: {
        fontSize: Number.parseFloat(getComputedStyle(title).fontSize),
        rect: getRect(title),
      },
      ornaments: ornamentZone,
      seals: [
        ...card.querySelectorAll<HTMLButtonElement>(
          ".project-card-seal[data-paint-safe='true']",
        ),
      ].map((button) => {
        const image = button.querySelector<HTMLImageElement>("img");
        if (image === null)
          throw new Error("Project one seal asset unavailable.");
        const buttonRect = getRect(button);
        const visual = getRect(image);
        return {
          hit: buttonRect,
          paintSafe: inflateRect(buttonRect, focusPaintClearance),
          paintSafety,
          visual,
          visualPaint: visual,
        };
      }),
    };
  });
}

function overlaps(left: RectSnapshot, right: RectSnapshot, margin = 0) {
  return (
    left.left < right.right + margin &&
    left.right > right.left - margin &&
    left.top < right.bottom + margin &&
    left.bottom > right.top - margin
  );
}

interface CinematicCaptureOptions {
  key: string;
  rejectPlayback?: boolean;
}

async function installCinematicCapture(
  page: import("@playwright/test").Page,
  options: CinematicCaptureOptions,
) {
  await page.addInitScript(({ key, rejectPlayback }) => {
    const setupKey = `__cinematicSetup:${key}`;

    if (sessionStorage.getItem(setupKey) === null) {
      sessionStorage.clear();
      history.replaceState(null, "", location.pathname);
      sessionStorage.setItem(setupKey, "1");
    }

    const events: { name: string; time: number }[] = [];
    Object.assign(window, {
      __cinematicCaptureKey: key,
      __cinematicEvents: events,
    });

    for (const name of ["playing", "ended", "error", "abort"]) {
      document.addEventListener(
        name,
        () => events.push({ name, time: performance.now() }),
        true,
      );
    }

    if (rejectPlayback) {
      HTMLMediaElement.prototype.play = function () {
        events.push({ name: "play", time: performance.now() });
        return Promise.reject(
          new DOMException("blocked", "NotAllowedError"),
        ).catch((error) => {
          events.push({ name: "rejected", time: performance.now() });
          throw error;
        });
      };
    }
  }, options);
}

test.describe("Immersive accessible portfolio", () => {
  test(
    "renders the alternate one-page portfolio without desktop overflow and with a safe curtain entry",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-ALTERNATE-E2E-001"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);

      await page.setViewportSize({ width: 1280, height: 800 });
      await portfolio.gotoAlternatePortfolio();
      await expect(page.getByRole("heading", { name: "Proyectos" })).toBeVisible();
      await expect(page.getByText("13 proyectos · una mirada técnica y humana", { exact: true })).toHaveCount(0);
      await expect(page.locator(".portfolio-alternate-card-cta")).toHaveCount(8);
      await expect(page.getByText("EN DESARROLLO", { exact: true })).toHaveCount(5);
      await expect(page.getByRole("complementary", { name: "Reproductor persistente de Bug Cesante" })).toBeVisible();
      await expect(page.getByRole("link", { name: "LinkedIn", exact: true })).toHaveAttribute("href", "https://www.linkedin.com/in/marco-povea-b21038258/");
      await expect(page.getByRole("link", { name: "GitHub", exact: true })).toHaveAttribute("href", "https://github.com/DevMPoveaCL");

      const desktopGeometry = await page.evaluate(() => ({
        documentHeight: document.documentElement.scrollHeight,
        documentWidth: document.documentElement.scrollWidth,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      }));
      expect(desktopGeometry.documentWidth).toBeLessThanOrEqual(desktopGeometry.viewportWidth);
      expect(desktopGeometry.documentHeight).toBeGreaterThan(desktopGeometry.viewportHeight);
      const desktopFlow = await page.evaluate(() => {
        const route = document.querySelector<HTMLElement>(".portfolio-alternate");
        const scrollingElement = document.scrollingElement;
        if (route === null || scrollingElement === null) throw new Error("Alternate desktop flow probes are unavailable.");
        const routeRect = route.getBoundingClientRect();
        const within = (inner: DOMRect, outer: DOMRect) =>
          inner.left >= outer.left - 1 && inner.right <= outer.right + 1 && inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1;
        const cardsWithinFlow = [...document.querySelectorAll<HTMLElement>(".portfolio-alternate-card")].every((card) => {
          const content = card.querySelector<HTMLElement>(".portfolio-alternate-card-content");
          const footer = card.querySelector<HTMLElement>(".portfolio-alternate-card-footer");
          if (content === null || footer === null) return false;
          const cardRect = card.getBoundingClientRect();
          return within(cardRect, routeRect) && within(content.getBoundingClientRect(), cardRect) && within(footer.getBoundingClientRect(), cardRect);
        });
        return {
          bodyCanScroll: document.body.scrollHeight > document.body.clientHeight,
          bodyOverflowX: getComputedStyle(document.body).overflowX,
          bodyOverflowY: getComputedStyle(document.body).overflowY,
          cardsWithinFlow,
          pageCanScroll: scrollingElement.scrollHeight > scrollingElement.clientHeight,
          routeOverflowX: getComputedStyle(route).overflowX,
          routeOverflowY: getComputedStyle(route).overflowY,
        };
      });
      expect(desktopFlow.bodyCanScroll || desktopFlow.pageCanScroll).toBe(true);
      expect(desktopFlow.cardsWithinFlow).toBe(true);
      expect(desktopFlow.bodyOverflowX).not.toBe("hidden");
      expect(desktopFlow.bodyOverflowY).not.toBe("hidden");
      expect(desktopFlow.routeOverflowX).toBe("hidden");
      expect(desktopFlow.routeOverflowY).not.toBe("hidden");
      expect(await page.locator(".portfolio-alternate").evaluate((element) => getComputedStyle(element).userSelect)).toBe("none");
      expect(await page.locator(".portfolio-alternate-ticker-track").evaluate((element) => getComputedStyle(element).animationDuration)).toBe("75s");

      const desktopLayout = await page.locator(".portfolio-alternate-card").evaluateAll((cards) => {
        const rows = new Map<number, { count: number; widths: number[] }>();
        for (const card of cards) {
          const rect = card.getBoundingClientRect();
          const row = rows.get(Math.round(rect.top)) ?? { count: 0, widths: [] };
          row.count += 1;
          row.widths.push(rect.width);
          rows.set(Math.round(rect.top), row);
        }
        return [...rows.entries()].sort(([left], [right]) => left - right).map(([, row]) => row);
      });
      expect(desktopLayout.map((row) => row.count)).toEqual([4, 4, 5]);
      expect(desktopLayout.every((row) => Math.max(...row.widths) - Math.min(...row.widths) <= 1)).toBe(true);

      const descriptionMetrics = await page.locator(".portfolio-alternate-card-description").evaluateAll((descriptions) => descriptions.map((description) => {
        const style = getComputedStyle(description);
        return {
          clientHeight: description.clientHeight,
          lineClamp: style.getPropertyValue("-webkit-line-clamp"),
          scrollHeight: description.scrollHeight,
          textOverflow: style.textOverflow,
        };
      }));
      expect(descriptionMetrics.every((metrics) => metrics.scrollHeight <= metrics.clientHeight + 1)).toBe(true);
      expect(descriptionMetrics.every((metrics) => metrics.textOverflow === "clip")).toBe(true);
      expect(descriptionMetrics.every((metrics) => metrics.lineClamp === "none" || metrics.lineClamp === "normal" || metrics.lineClamp === "")).toBe(true);

      const headerTops = await page.evaluate(() => [
        document.querySelector(".portfolio-alternate-identity"),
        document.querySelector(".bug-cesante-player"),
        document.querySelector(".portfolio-alternate-social"),
      ].map((element) => element?.getBoundingClientRect().top ?? Number.NaN));
      expect(Math.max(...headerTops) - Math.min(...headerTops)).toBeLessThanOrEqual(4);
      await expect(page.getByRole("link", { name: "Volver", exact: true })).toHaveAttribute("href", "/");

      await page.setViewportSize({ width: 1536, height: 864 });
      const largeDesktopGeometry = await page.evaluate(() => ({
        documentHeight: document.documentElement.scrollHeight,
        documentWidth: document.documentElement.scrollWidth,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      }));
      expect(largeDesktopGeometry.documentWidth).toBeLessThanOrEqual(largeDesktopGeometry.viewportWidth);
      expect(largeDesktopGeometry.documentHeight).toBeGreaterThan(largeDesktopGeometry.viewportHeight);
      expect(await page.evaluate(() => document.scrollingElement !== null && document.scrollingElement.scrollHeight > document.scrollingElement.clientHeight)).toBe(true);

      await expect(page.getByRole("button", { name: "Ver tecnologías de Kurone-ko Timer" })).toBeVisible();
      await page.getByRole("button", { name: "Ver tecnologías de Kurone-ko Timer" }).click();
      await expect(page.getByRole("button", { name: "Cerrar tecnologías de Kurone-ko Timer" })).toHaveAttribute("aria-expanded", "true");

      await page.setViewportSize({ width: 390, height: 844 });
      const mobileGeometry = await page.evaluate(() => ({
        documentHeight: document.documentElement.scrollHeight,
        documentWidth: document.documentElement.scrollWidth,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      }));
      expect(mobileGeometry.documentHeight).toBeGreaterThan(mobileGeometry.viewportHeight);
      expect(mobileGeometry.documentWidth).toBeLessThanOrEqual(mobileGeometry.viewportWidth);
    },
  );

  test(
    "keeps the alternate player compact and the desktop header zones separated",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-ALTERNATE-LAYOUT-E2E-001"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);
      const viewports = [
        { height: 800, width: 1280 },
        { height: 864, width: 1536 },
        { height: 1080, width: 1920 },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        if (viewport === viewports[0]) await portfolio.gotoAlternatePortfolio();
        const player = page.locator('.bug-cesante-player[data-presentation="alternate"]');
        const playerControls = player.locator(".bug-cesante-player-controls");

        await expect(player).toBeVisible();
        await expect(player.locator(".bug-cesante-player-title")).toHaveCount(0);
        await expect(playerControls.locator("button")).toHaveCount(3);
        await expect(playerControls.locator('input[type="range"]')).toBeVisible();

        const metrics = await page.evaluate(() => {
          const player = document.querySelector<HTMLElement>('.bug-cesante-player[data-presentation="alternate"]');
          const identity = document.querySelector<HTMLElement>(".portfolio-alternate-identity");
          const name = document.querySelector<HTMLElement>(".portfolio-alternate-name");
          const role = document.querySelector<HTMLElement>(".portfolio-alternate-role");
          const social = document.querySelector<HTMLElement>(".portfolio-alternate-social");
          if (player === null || identity === null || name === null || role === null || social === null) {
            throw new Error("Alternate layout probes are unavailable.");
          }
          const rect = (element: HTMLElement) => element.getBoundingClientRect();
          const intersects = (left: DOMRect, right: { bottom: number; left: number; right: number; top: number }) =>
            left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top;
          const playerRect = rect(player);
          const identityRect = rect(identity);
          const nameRect = rect(name);
          const roleRect = rect(role);
          const socialRect = rect(social);
          const center = (box: DOMRect) => box.left + box.width / 2;
          const controls = [...player.querySelectorAll<HTMLElement>("button, input[type='range']")];
          const controlRects = controls.map((control) => rect(control));
          const firstControl = controlRects[0];
          const lastControl = controlRects.at(-1);
          if (firstControl === undefined || lastControl === undefined) {
            throw new Error("Alternate player controls are unavailable.");
          }
          return {
            controlCenterDelta: Math.abs((firstControl.left + lastControl.right) / 2 - center(playerRect)),
            controlHeights: controlRects.map((control) => control.height),
            controlWidths: controlRects.map((control) => control.width),
            leftControlClearance: firstControl.left - playerRect.left,
            identityLeft: identityRect.left,
            nameRoleCenterDelta: Math.abs(center(nameRect) - center(roleRect)),
            playerIdentityOverlap: intersects(playerRect, identityRect),
            playerSocialOverlap: intersects(playerRect, socialRect),
            playerWidth: playerRect.width,
            rightControlClearance: playerRect.right - lastControl.right,
            identitySocialOverlap: intersects(identityRect, socialRect),
          };
        });

        expect(metrics.playerWidth).toBeCloseTo(384, 0);
        expect(metrics.controlCenterDelta).toBeLessThanOrEqual(1);
        expect(metrics.controlHeights.every((height) => height >= 44)).toBe(true);
        expect(metrics.controlWidths.every((width) => width >= 44)).toBe(true);
        expect(Math.abs(metrics.leftControlClearance - metrics.rightControlClearance)).toBeLessThanOrEqual(1);
        expect(metrics.identityLeft).toBeLessThanOrEqual(48);
        expect(metrics.nameRoleCenterDelta).toBeLessThanOrEqual(1);
        expect(metrics.playerIdentityOverlap).toBe(false);
        expect(metrics.playerSocialOverlap).toBe(false);
        expect(metrics.identitySocialOverlap).toBe(false);
      }

      await test.info().attach("alternate-player-desktop", {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });
    },
  );

  test(
    "keeps alternate stacking, top packing, and all cards stable across activation boundaries",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-ALTERNATE-REGRESSION-E2E-003"] },
    async ({ browser }) => {
      test.setTimeout(120_000);
      const fineViewports = [
        { height: 500, width: 320, safeZoneActive: true },
        { height: 500, width: 768, safeZoneActive: true },
        { height: 800, width: 769, safeZoneActive: false },
        { height: 1280, width: 1280, safeZoneActive: false },
        { height: 1600, width: 1600, safeZoneActive: false },
      ];
      const coarseViewports = [
        { height: 500, width: 769, safeZoneActive: false },
        { height: 800, width: 853, safeZoneActive: false },
        { height: 1280, width: 912, safeZoneActive: false },
        { height: 1376, width: 960, safeZoneActive: false },
        { height: 1440, width: 1032, safeZoneActive: false },
        { height: 1600, width: 1280, safeZoneActive: false },
      ];

      const readLayoutMetrics = (page: import("@playwright/test").Page) => page.evaluate(() => {
        const route = document.querySelector<HTMLElement>(".portfolio-alternate");
        const safeZone = document.querySelector<HTMLElement>('.mobile-control-safe-zone[data-presentation="alternate"]');
        const player = document.querySelector<HTMLElement>('.bug-cesante-player[data-presentation="alternate"]');
        const intro = document.querySelector<HTMLElement>(".portfolio-alternate-showcase-intro");
        const cards = [...document.querySelectorAll<HTMLElement>(".portfolio-alternate-card")];
        if (route === null || safeZone === null || player === null || intro === null || cards.length !== 13) {
          throw new Error("Alternate regression probes are unavailable.");
        }

        const playerRect = player.getBoundingClientRect();
        const cardRects = cards.map((card) => {
          const rect = card.getBoundingClientRect();
          return { bottom: rect.bottom, height: rect.height, left: rect.left, right: rect.right, top: rect.top, width: rect.width };
        });
        const firstCard = cardRects[0];
        if (firstCard === undefined) throw new Error("First alternate card is unavailable.");
        const intersects = (left: typeof firstCard, right: typeof firstCard) =>
          left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top;
        return {
          cardCount: cards.length,
          cardsPositive: cardRects.every(({ height, width }) => height > 0 && width > 0),
          cardsReachable: cards.every((card) => {
            const style = getComputedStyle(card);
            return style.display !== "none" && style.visibility !== "hidden" && !card.hasAttribute("aria-hidden");
          }),
          cardsWithinViewport: cardRects.every(({ left, right }) => left >= -1 && right <= innerWidth + 1),
          firstCardGap: firstCard.top - intro.getBoundingClientRect().bottom,
          isolation: getComputedStyle(route).isolation,
          nonOverlapping: cardRects.every((card, index) => cardRects.slice(index + 1).every((other) => !intersects(card, other))),
          playerPainted: playerRect.width > 0 && playerRect.height > 0 && getComputedStyle(player).visibility === "visible" && Number.parseFloat(getComputedStyle(player).opacity) > 0 && document.elementFromPoint(playerRect.left + playerRect.width / 2, playerRect.top + playerRect.height / 2)?.closest(".bug-cesante-player") === player,
          playerZIndex: getComputedStyle(player).zIndex,
          safeZoneDisplay: getComputedStyle(safeZone).display,
          safeZoneZIndex: getComputedStyle(safeZone).zIndex,
          documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      });

      const probe = async (page: import("@playwright/test").Page, viewports: readonly { height: number; safeZoneActive: boolean; width: number }[]) => {
        const portfolio = new PortfolioPage(page);
        await portfolio.gotoAlternatePortfolio();
        for (const viewport of viewports) {
          await page.setViewportSize({ height: viewport.height, width: viewport.width });
          const metrics = await readLayoutMetrics(page);
          expect(metrics.cardCount, `${viewport.width}x${viewport.height}px card count`).toBe(13);
          expect(metrics.cardsPositive, `${viewport.width}x${viewport.height}px positive card sizes`).toBe(true);
          expect(metrics.cardsReachable, `${viewport.width}x${viewport.height}px reachable cards`).toBe(true);
          expect(metrics.cardsWithinViewport, `${viewport.width}x${viewport.height}px card bounds`).toBe(true);
          expect(metrics.nonOverlapping, `${viewport.width}x${viewport.height}px card overlap`).toBe(true);
          expect(metrics.documentOverflow, `${viewport.width}x${viewport.height}px horizontal overflow`).toBe(false);
          expect(metrics.firstCardGap, `${viewport.width}x${viewport.height}px intrinsic heading gap`).toBeGreaterThanOrEqual(0);
          expect(metrics.firstCardGap, `${viewport.width}x${viewport.height}px intrinsic heading gap`).toBeLessThanOrEqual(24);
          expect(metrics.playerPainted, `${viewport.width}x${viewport.height}px player paint`).toBe(true);
          if (viewport.safeZoneActive) {
            expect(metrics.safeZoneDisplay, `${viewport.width}x${viewport.height}px safe-zone display`).toBe("block");
            expect(metrics.isolation, `${viewport.width}x${viewport.height}px alternate stacking owner`).toBe("auto");
            expect(metrics.safeZoneZIndex, `${viewport.width}x${viewport.height}px safe-zone layer`).toBe("30");
            expect(metrics.playerZIndex, `${viewport.width}x${viewport.height}px player layer`).toBe("40");
          } else {
            expect(metrics.safeZoneDisplay, `${viewport.width}x${viewport.height}px safe-zone display`).toBe("none");
          }
        }
      };

      const fineContext = await browser.newContext({ hasTouch: false, viewport: { height: 500, width: 320 } });
      const coarseContext = await browser.newContext({ hasTouch: true, viewport: { height: 500, width: 769 } });
      try {
        await probe(await fineContext.newPage(), fineViewports);
        await probe(await coarseContext.newPage(), coarseViewports);
      } finally {
        await fineContext.close();
        await coarseContext.close();
      }
    },
  );

  test(
    "keeps the header outlet centered across audited widths after the real handoff",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-ALTERNATE-HEADER-E2E-002"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);
      const viewports = [
        { height: 900, width: 1440 },
        { height: 864, width: 1280 },
        { height: 800, width: 1200 },
        { height: 800, width: 1170 },
        { height: 800, width: 1169 },
        { height: 800, width: 1165 },
        { height: 800, width: 1150 },
        { height: 800, width: 1025 },
        { height: 800, width: 1024 },
        { height: 800, width: 962 },
        { height: 800, width: 961 },
        { height: 800, width: 900 },
        { height: 800, width: 848 },
        { height: 800, width: 800 },
        { height: 800, width: 769 },
        { height: 844, width: 768 },
        { height: 844, width: 767 },
        { height: 844, width: 700 },
        { height: 844, width: 672 },
        { height: 844, width: 390 },
        { height: 667, width: 375 },
      ];

      await page.setViewportSize(viewports[0]!);
      await portfolio.seedValidProgression({ alternateResidency: "active" });
      await portfolio.gotoPortfolio();
      await expect(portfolio.alternateEntry).toBeVisible();
      await portfolio.alternateEntry.click();
      await expect(page).toHaveURL(/\/portfolio\/$/);
      await expect(portfolio.alternateCards).toHaveCount(13, { timeout: 30_000 });

      const contentSnapshot = await page.evaluate(() => ({
        cards: [...document.querySelectorAll<HTMLElement>(".portfolio-alternate-card")].map((card) => card.querySelector("h2")?.textContent),
        ticker: document.querySelector<HTMLElement>(".portfolio-alternate-ticker")?.textContent,
      }));
      const player = page.locator('.bug-cesante-player[data-presentation="alternate"]');

      const readGeometry = () => page.evaluate(() => {
        const identity = document.querySelector<HTMLElement>(".portfolio-alternate-identity");
        const player = document.querySelector<HTMLElement>('.bug-cesante-player[data-presentation="alternate"]');
        const nav = document.querySelector<HTMLElement>(".portfolio-alternate-social");
        const header = document.querySelector<HTMLElement>(".portfolio-alternate-header");
        const ticker = document.querySelector<HTMLElement>(".portfolio-alternate-ticker");
        const outlet = document.querySelector<HTMLElement>(".portfolio-alternate-player-outlet");
        if (identity === null || player === null || nav === null || header === null || ticker === null || outlet === null) {
          throw new Error("Alternate header geometry probes are unavailable.");
        }

        const rect = (element: HTMLElement) => element.getBoundingClientRect();
        const intersects = (left: DOMRect, right: DOMRect) =>
          left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top;
        const identityRect = rect(identity);
        const playerRect = rect(player);
        const navRect = rect(nav);
        const headerRect = rect(header);
        const tickerRect = rect(ticker);
        const targets = [...document.querySelectorAll<HTMLElement>(".portfolio-alternate-header a, .bug-cesante-player button, .bug-cesante-player input")].map((target) => rect(target));
        const controls = [...player.querySelectorAll<HTMLElement>("button, input[type='range']")].map((control) => rect(control));
        const center = (box: DOMRect) => box.left + box.width / 2;
        return {
          centerDelta: Math.abs(center(playerRect) - window.innerWidth / 2),
          controls: controls.map(({ height, width }) => ({ height, width })),
          documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          headerTickerSeparated: headerRect.bottom <= tickerRect.top + 1,
          identityNavOverlap: intersects(identityRect, navRect),
          outletDisplay: getComputedStyle(outlet).display,
          playerContainedByHeader: playerRect.left >= headerRect.left - 1 && playerRect.right <= headerRect.right + 1 && playerRect.top >= headerRect.top - 1 && playerRect.bottom <= headerRect.bottom + 1,
          playerHeaderOverlap: intersects(playerRect, identityRect) || intersects(playerRect, navRect),
          playerInViewport: playerRect.left >= -1 && playerRect.right <= window.innerWidth + 1 && playerRect.top >= -1 && playerRect.bottom <= window.innerHeight + 1,
          playerNavOverlap: intersects(playerRect, navRect),
          playerParentIsOutlet: player.parentElement === outlet,
          playerPosition: getComputedStyle(player).position,
          headerRowTops: [...new Set([playerRect.top, identityRect.top, navRect.top].map((top) => Math.round(top)))],
          targetsMeetMinimum: targets.every(({ height, width }) => height >= 44 && width >= 44),
          viewport: { height: window.innerHeight, width: window.innerWidth },
        };
      });

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        const metrics = await readGeometry();
        const mode = viewport.width >= 1201 ? "wide" : viewport.width >= 769 ? "intermediate" : "mobile";

        expect(metrics.centerDelta, `${viewport.width}px player center`).toBeLessThanOrEqual(1);
        expect(metrics.documentOverflow, `${viewport.width}px document overflow`).toBe(false);
        expect(metrics.headerTickerSeparated, `${viewport.width}px header/ticker separation`).toBe(true);
        expect(metrics.identityNavOverlap, `${viewport.width}px identity/nav overlap`).toBe(false);
        expect(metrics.playerInViewport, `${viewport.width}px player viewport bounds`).toBe(true);
        expect(metrics.playerNavOverlap, `${viewport.width}px player/nav overlap`).toBe(false);
        expect(metrics.playerParentIsOutlet, `${viewport.width}px player outlet ownership`).toBe(true);
        expect(metrics.targetsMeetMinimum, `${viewport.width}px target size`).toBe(true);
        expect(metrics.outletDisplay).toBe(mode === "mobile" ? "contents" : "grid");
        expect(metrics.playerPosition).toBe(mode === "mobile" ? "fixed" : "relative");
        if (mode === "intermediate") {
          expect(metrics.headerRowTops, `${viewport.width}px header row bands`).toHaveLength(2);
          expect(metrics.headerRowTops[0]).toBeLessThan(metrics.headerRowTops[1] ?? Number.POSITIVE_INFINITY);
          expect(metrics.playerHeaderOverlap, `${viewport.width}px player/header content overlap`).toBe(false);
          expect(metrics.playerContainedByHeader, `${viewport.width}px player/header containment`).toBe(true);
        } else if (mode === "wide") {
          expect(metrics.headerRowTops, `${viewport.width}px wide header row bands`).toHaveLength(1);
        }

        if (viewport.width === 375 || viewport.width === 390) {
          await page.evaluate(() => document.fonts.ready);
          await expect(player).toHaveScreenshot(`alternate-player-${viewport.width}x${viewport.height}.png`, {
            animations: "disabled",
          });
        }
      }

      for (const viewport of [
        { height: 667, width: 320 },
        { height: 844, width: 375 },
        { height: 844, width: 673 },
        { height: 800, width: 700 },
        { height: 844, width: 740 },
        { height: 900, width: 800 },
        { height: 667, width: 1025 },
        { height: 800, width: 1025 },
        { height: 800, width: 1100 },
        { height: 800, width: 1200 },
        { height: 800, width: 1280 },
        { height: 900, width: 1440 },
        { height: 1080, width: 1440 },
      ]) {
        await page.setViewportSize(viewport);
        const cardMetrics = await page.locator(".portfolio-alternate-card").evaluateAll((cards) => {
          const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
          const intersects = (left: DOMRect, right: { bottom: number; left: number; right: number; top: number }) =>
            left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top;
          const box = (element: Element) => {
            const rect = element.getBoundingClientRect();
            return { bottom: rect.bottom, left: rect.left, right: rect.right, top: rect.top };
          };
          const isVisible = (element: Element) => {
            const style = getComputedStyle(element);
            return style.display !== "none" && style.visibility !== "hidden" && element.getBoundingClientRect().height > 0;
          };

          return cards.filter((card) => isVisible(card)).map((card) => {
            const toggle = card.querySelector<HTMLElement>(".portfolio-alternate-card-toggle");
            const content = card.querySelector<HTMLElement>(".portfolio-alternate-card-content");
            if (toggle === null || content === null) throw new Error("Alternate card footprint probes are unavailable.");
            const cardBox = box(card);
            const toggleRect = toggle.getBoundingClientRect();
            const readabilityGap = Number.parseFloat(
              getComputedStyle(card).getPropertyValue("--portfolio-alternate-card-readability-gap"),
            ) * rootFontSize;
            const footprint = {
              bottom: toggleRect.bottom + readabilityGap,
              left: toggleRect.left - readabilityGap,
              right: toggleRect.right + readabilityGap,
              top: toggleRect.top - readabilityGap,
            };
            const contentTargets = [
              ...card.querySelectorAll<HTMLElement>(
                ".portfolio-alternate-card-content h2, .portfolio-alternate-card-description, .portfolio-alternate-card-footer, .portfolio-alternate-card-cta, .portfolio-alternate-card-status",
              ),
            ].filter(isVisible);
            const contentBoxes = [content, ...contentTargets].map(box);
            return {
              allContentWithinCard: contentBoxes.every((target) =>
                target.left >= cardBox.left - 1 &&
                target.right <= cardBox.right + 1 &&
                target.top >= cardBox.top - 1 &&
                target.bottom <= cardBox.bottom + 1,
              ),
              controlSizes: [...card.querySelectorAll<HTMLElement>("button")].map((control) => {
                const rect = control.getBoundingClientRect();
                return { height: rect.height, width: rect.width };
              }),
              cardBox,
              contentBox: box(content),
              footerBox: box(card.querySelector<HTMLElement>(".portfolio-alternate-card-footer")!),
              hasIntersection: contentTargets.some((target) => intersects(target.getBoundingClientRect(), footprint)),
              noOverflow: card.scrollWidth <= card.clientWidth + 1 && content.scrollWidth <= content.clientWidth + 1,
              toggleSize: { height: toggleRect.height, width: toggleRect.width },
            };
          });
        });
        expect(cardMetrics, `${viewport.width}x${viewport.height}px card count`).toHaveLength(13);
        expect(cardMetrics.every(({ allContentWithinCard }) => allContentWithinCard), `${viewport.width}x${viewport.height}px content bounds`).toBe(true);
        expect(cardMetrics.every(({ hasIntersection }) => !hasIntersection), `${viewport.width}x${viewport.height}px action footprint collisions`).toBe(true);
        expect(cardMetrics.every(({ noOverflow }) => noOverflow), `${viewport.width}x${viewport.height}px card overflow`).toBe(true);
        expect(cardMetrics.every(({ toggleSize }) => toggleSize.height >= 44 && toggleSize.width >= 44), `${viewport.width}x${viewport.height}px toggle target`).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${viewport.width}x${viewport.height}px document overflow`).toBe(true);
      }

      await page.setViewportSize({ height: 800, width: 1170 });
      const role = page.locator(".portfolio-alternate-role");
      await role.evaluate((element) => {
        element.textContent = `${element.textContent} · SOFTWARE ARCHITECTURE · TESTING · DELIVERY`;
        element.style.maxInlineSize = "18rem";
      });
      const longSubtitleMetrics = await readGeometry();
      expect(longSubtitleMetrics.documentOverflow).toBe(false);
      expect(longSubtitleMetrics.centerDelta).toBeLessThanOrEqual(1);
      expect(longSubtitleMetrics.playerNavOverlap).toBe(false);
      expect(longSubtitleMetrics.targetsMeetMinimum).toBe(true);

      await page.getByRole("link", { name: "Volver", exact: true }).focus();
      await page.keyboard.press("ArrowDown");
      await expect(page.locator('.bug-cesante-player button[aria-label="Reproducir canción"]')).toBeFocused();
      expect(await page.locator('.bug-cesante-player button[aria-label="Reproducir canción"]').evaluate((element) => element.matches(":focus-visible"))).toBe(true);

      await page.setViewportSize({ height: 900, width: 1200 });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      const zoomMetrics = await readGeometry();
      expect(zoomMetrics.documentOverflow).toBe(false);
      expect(zoomMetrics.centerDelta).toBeLessThanOrEqual(1);
      expect(zoomMetrics.playerNavOverlap).toBe(false);
      await page.evaluate(() => document.documentElement.style.removeProperty("font-size"));

      expect(await page.locator(".portfolio-alternate-card").count()).toBe(13);
      expect(await page.locator(".portfolio-alternate-ticker").textContent()).toBe(contentSnapshot.ticker);
      expect(await page.locator(".portfolio-alternate-card h2").allTextContents()).toEqual(contentSnapshot.cards);
    },
  );

  test(
    "proves the complete alternate header stays visible across fixed and header-owned modes",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-ALTERNATE-HEADER-VISUAL-E2E-003"] },
    async ({ browser }) => {
      test.setTimeout(120_000);
      const desktopViewports = [
        { height: 873, label: "1244x873", width: 1244 },
        { height: 873, label: "769x873", width: 769 },
        { height: 873, label: "912x873", width: 912 },
        { height: 873, label: "1032x873", width: 1032 },
        { height: 873, label: "1280x873", width: 1280 },
        { height: 873, label: "1600x873", width: 1600 },
      ];

      for (const pointerMode of ["fine", "coarse"] as const) {
        const context = await browser.newContext({
          hasTouch: pointerMode === "coarse",
          viewport: { height: desktopViewports[0]!.height, width: desktopViewports[0]!.width },
        });
        const page = await context.newPage();

        try {
          await new PortfolioPage(page).gotoAlternatePortfolio();
          for (const viewport of desktopViewports) {
            await page.setViewportSize(viewport);
            const evidence = await page.evaluate(() => {
              const selectorMap = {
                back: ".portfolio-alternate-back",
                github: ".portfolio-alternate-social a[href*='github.com']",
                identity: ".portfolio-alternate-identity",
                linkedin: ".portfolio-alternate-social a[href*='linkedin.com']",
                player: ".bug-cesante-player[data-presentation='alternate']",
                role: ".portfolio-alternate-role",
                ticker: ".portfolio-alternate-ticker",
              } as const;
              const elements = Object.fromEntries(
                Object.entries(selectorMap).map(([name, selector]) => [name, document.querySelector<HTMLElement>(selector)]),
              ) as Record<keyof typeof selectorMap, HTMLElement | null>;
              const safeZone = document.querySelector<HTMLElement>(".mobile-control-safe-zone[data-presentation='alternate']");
              const header = document.querySelector<HTMLElement>(".portfolio-alternate-header");
              if (Object.values(elements).some((element) => element === null) || safeZone === null || header === null) {
                throw new Error("Complete alternate header evidence nodes are unavailable.");
              }
              const rect = (element: HTMLElement) => element.getBoundingClientRect();
              const intersects = (left: DOMRect, right: DOMRect) => left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top;
              const targetRects = Object.values(elements).map((element) => rect(element!));
              const safeZoneStyle = getComputedStyle(safeZone);
              const safeZoneRect = rect(safeZone);
              const headerRect = rect(header);
              const tickerRect = rect(elements.ticker!);
              const clipTop = Math.max(0, Math.floor(headerRect.top));
              const clipBottom = Math.min(innerHeight, Math.ceil(tickerRect.bottom));
              return {
                clip: { height: Math.max(1, clipBottom - clipTop), top: clipTop, width: innerWidth },
                requiredTargetsWithinClip: targetRects.every((target) => target.top >= clipTop - 1 && target.bottom <= clipBottom + 1),
                safeZoneCoversRequiredTarget: safeZoneStyle.display !== "none" && targetRects.some((target) => intersects(target, safeZoneRect)),
                safeZoneDisplay: safeZoneStyle.display,
                targetRects: targetRects.map(({ bottom, left, right, top }) => ({ bottom, left, right, top })),
              };
            });

            expect(evidence.requiredTargetsWithinClip, `${pointerMode} ${viewport.label} complete header clip`).toBe(true);
            expect(evidence.safeZoneDisplay, `${pointerMode} ${viewport.label} alternate safe-zone`).toBe("none");
            expect(evidence.safeZoneCoversRequiredTarget, `${pointerMode} ${viewport.label} opaque safe-zone coverage`).toBe(false);
            expect(evidence.targetRects.every(({ bottom, left, right, top }) => left >= -1 && right <= viewport.width + 1 && top >= -1 && bottom <= viewport.height + 1), `${pointerMode} ${viewport.label} header target bounds`).toBe(true);

            await test.info().attach(`alternate-header-${pointerMode}-${viewport.label}`, {
              body: await page.screenshot({ animations: "disabled", clip: { height: evidence.clip.height, width: evidence.clip.width, x: 0, y: evidence.clip.top } }),
              contentType: "image/png",
            });
          }

          await page.setViewportSize({ height: 844, width: 390 });
          const mobileEvidence = await page.evaluate(() => {
            const player = document.querySelector<HTMLElement>(".bug-cesante-player[data-presentation='alternate']");
            const safeZone = document.querySelector<HTMLElement>(".mobile-control-safe-zone[data-presentation='alternate']");
            if (player === null || safeZone === null) throw new Error("Mobile alternate safe-zone evidence nodes are unavailable.");
            return {
              playerBottom: player.getBoundingClientRect().bottom,
              playerPosition: getComputedStyle(player).position,
              safeZoneBottom: safeZone.getBoundingClientRect().bottom,
              safeZoneDisplay: getComputedStyle(safeZone).display,
              safeZonePosition: getComputedStyle(safeZone).position,
            };
          });
          expect(mobileEvidence.safeZoneDisplay).toBe("block");
          expect(mobileEvidence.safeZonePosition).toBe("fixed");
          expect(mobileEvidence.playerPosition).toBe("fixed");
          expect(mobileEvidence.safeZoneBottom).toBeGreaterThanOrEqual(mobileEvidence.playerBottom - 1);
        } finally {
          await context.close();
        }
      }
    },
  );

  test(
    "uses one shared audio element and exposes keyboard-accessible lyric seeking",
    { tag: ["@high", "@e2e", "@portfolio", "@PORTFOLIO-AUDIO-E2E-001"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);
      await portfolio.gotoShowcase();
      await activateMusicThroughVoid(page);

      const player = page.locator(".bug-cesante-player");
      await expect(page.locator(".bug-cesante-audio")).toHaveCount(1);
      await expect(player.getByRole("slider", { name: "Posición de la canción" })).toBeVisible();
      await player.getByRole("button", { name: "Mostrar letra" }).click();

      const targetCue = page.locator(".bug-cesante-player-lyrics > button.bug-cesante-lyric").nth(1);
      await expect(targetCue).toBeVisible();
      await expect(targetCue).toHaveAttribute("aria-label", /^Ir a \d+:\d{2}:/u);
      await targetCue.press("Enter");

      const slider = player.getByRole("slider", { name: "Posición de la canción" });
      await expect.poll(() => slider.getAttribute("data-seek-status")).toMatch(/^(pending|confirmed)$/u);
      await expect.poll(() => targetCue.getAttribute("aria-current")).toBe("true");
      const seekState = await page.evaluate(() => {
        const seek = document.querySelector<HTMLInputElement>('.bug-cesante-player input[type="range"]');
        const audio = document.querySelector<HTMLAudioElement>(".bug-cesante-audio");
        if (seek === null || audio === null) throw new Error("Primary seek state probes are unavailable.");
        return {
          audioTime: audio.currentTime,
          sliderTime: Number(seek.value),
          status: seek.getAttribute("data-seek-status"),
        };
      });
      expect(["pending", "confirmed"]).toContain(seekState.status);
      expect(seekState.audioTime).toBeGreaterThan(0);
      expect(seekState.sliderTime).toBeGreaterThan(0);
    },
  );

  test(
    "keeps mobile lyrics fullscreen in both presentations and restores focus after closing",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-ALTERNATE-LYRICS-E2E-001"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);
      const readLyricsSurfaceGeometry = () => page.evaluate(() => {
        const surface = document.querySelector<HTMLElement>(".bug-cesante-lyrics-surface");
        const player = document.querySelector<HTMLElement>('.bug-cesante-player:not([data-presentation="alternate"])');
        if (surface === null || player === null) {
          throw new Error("Shared lyrics geometry probes are unavailable.");
        }
        const header = surface.querySelector<HTMLElement>(".bug-cesante-lyrics-header");
        const close = surface.querySelector<HTMLElement>(".bug-cesante-lyrics-close");
        const lyrics = surface.querySelector<HTMLElement>(".bug-cesante-player-lyrics");
        if (header === null || close === null || lyrics === null) {
          throw new Error("Shared lyrics geometry probes are unavailable.");
        }
        const surfaceRect = surface.getBoundingClientRect();
        const playerRect = player.getBoundingClientRect();
        return {
          closeHeight: close.getBoundingClientRect().height,
          headerHeight: header.getBoundingClientRect().height,
          height: surfaceRect.height,
          left: surfaceRect.left,
          playerOccluded: document.elementFromPoint(playerRect.left + playerRect.width / 2, playerRect.top + playerRect.height / 2)?.closest(".bug-cesante-lyrics-surface") === surface,
          scrollable: lyrics.scrollHeight > lyrics.clientHeight,
          top: surfaceRect.top,
          width: surfaceRect.width,
        };
      });

      await page.setViewportSize({ width: 390, height: 844 });
      await portfolio.gotoShowcase();
      await activateMusicThroughVoid(page);
      const primaryPlayer = page.locator('.bug-cesante-player:not([data-presentation="alternate"])');
      const primaryLyricsButton = primaryPlayer.getByRole("button", { name: "Mostrar letra" });
      await primaryLyricsButton.click();
      const primary390Geometry = await readLyricsSurfaceGeometry();
      expect(primary390Geometry.playerOccluded).toBe(true);
      expect(primary390Geometry.top).toBeCloseTo(0, 0);
      expect(primary390Geometry.left).toBeCloseTo(0, 0);
      expect(primary390Geometry.width).toBeCloseTo(390, 0);
      expect(primary390Geometry.height).toBeCloseTo(844, 0);
      await expect(page.getByRole("dialog", { name: "Letra de Bug Cesante" }).getByText("BUG CESANTE", { exact: true })).toHaveCount(1);
      await expect(page.getByRole("dialog", { name: "Letra de Bug Cesante" }).locator(".bug-cesante-lyrics-header")).toBeVisible();
      await expect(page.getByRole("dialog", { name: "Letra de Bug Cesante" }).locator(".bug-cesante-player-lyrics")).toBeVisible();
      await page.getByRole("dialog", { name: "Letra de Bug Cesante" }).getByRole("button", { name: "Ocultar letra" }).click();
      await expect(primaryLyricsButton).toBeFocused();

      await page.setViewportSize({ width: 375, height: 667 });
      await primaryLyricsButton.click();
      const primary375Geometry = await readLyricsSurfaceGeometry();
      expect(primary375Geometry.playerOccluded).toBe(true);
      expect(primary375Geometry.top).toBeCloseTo(0, 0);
      expect(primary375Geometry.left).toBeCloseTo(0, 0);
      expect(primary375Geometry.width).toBeCloseTo(375, 0);
      expect(primary375Geometry.height).toBeCloseTo(667, 0);
      await page.getByRole("dialog", { name: "Letra de Bug Cesante" }).getByRole("button", { name: "Ocultar letra" }).click();
      await expect(primaryLyricsButton).toBeFocused();

      await page.setViewportSize({ width: 390, height: 844 });
      await portfolio.gotoAlternatePortfolio();
      const player = page.locator('.bug-cesante-player[data-presentation="alternate"]');
      const header = page.locator(".portfolio-alternate-header");
      await expect(player).toBeVisible();
      await expect(header).toBeVisible();
      await expect.poll(() => page.evaluate(() => window.matchMedia("(max-width: 48rem), (pointer: coarse)").matches)).toBe(true);

      const reservedTop = await page.evaluate(() => {
          const player = document.querySelector<HTMLElement>('.bug-cesante-player[data-presentation="alternate"]');
          const header = document.querySelector<HTMLElement>(".portfolio-alternate-header");
          const social = document.querySelector<HTMLElement>(".portfolio-alternate-social");
          if (player === null || header === null || social === null) throw new Error("Mobile reserved-zone probes are unavailable.");
          const playerRect = player.getBoundingClientRect();
          const controlRects = [...player.querySelectorAll<HTMLElement>("button, input[type='range']")].map((control) => control.getBoundingClientRect());
          const firstControl = controlRects[0];
          const lastControl = controlRects.at(-1);
          if (firstControl === undefined || lastControl === undefined) throw new Error("Mobile player controls are unavailable.");
          const socialRect = social.getBoundingClientRect();
          return {
            headerTop: header.getBoundingClientRect().top,
            controlCenterDelta: Math.abs((firstControl.left + lastControl.right) / 2 - (playerRect.left + playerRect.width / 2)),
            controlHeights: controlRects.map((control) => control.height),
            controlWidths: controlRects.map((control) => control.width),
            leftControlClearance: firstControl.left - playerRect.left,
            navCenterDelta: Math.abs(socialRect.left + socialRect.width / 2 - window.innerWidth / 2),
            playerBottom: playerRect.bottom,
            playerWidth: playerRect.width,
            rightControlClearance: playerRect.right - lastControl.right,
          };
      });
      expect(reservedTop.playerWidth).toBeCloseTo(358, 0);
      expect(reservedTop.headerTop).toBeGreaterThanOrEqual(reservedTop.playerBottom + 8);
      expect(reservedTop.navCenterDelta).toBeLessThanOrEqual(1);
      expect(reservedTop.controlCenterDelta).toBeLessThanOrEqual(1);
      expect(reservedTop.controlHeights.every((height) => height >= 44)).toBe(true);
      expect(reservedTop.controlWidths.every((width) => width >= 44)).toBe(true);
      expect(Math.abs(reservedTop.leftControlClearance - reservedTop.rightControlClearance)).toBeLessThanOrEqual(1);

       const lyricsButton = player.getByRole("button", { name: "Mostrar letra" });
       await expect(lyricsButton).toHaveAttribute("aria-expanded", "false");
       await page.evaluate(() => window.scrollTo(0, 300));
       await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(150);
       await lyricsButton.click();
       await expect(player.getByRole("button", { name: "Ocultar letra" })).toHaveCount(0);
        const lyricsSurface = page.getByRole("dialog", { name: "Letra de Bug Cesante" });
        await expect(lyricsSurface).toBeVisible();
        await expect(page.locator(".bug-cesante-player-scope")).toHaveAttribute("inert", "");
        await expect(page.getByRole("button", { name: "Ocultar letra" })).toHaveCount(1);
      await expect(lyricsSurface.locator(".bug-cesante-lyric").first()).toBeVisible({ timeout: 10_000 });
       await expect(lyricsSurface.getByText("BUG CESANTE", { exact: true })).toHaveCount(1);
      await expect(player).toBeVisible();
      await expect(player.getByRole("button", { name: "Reiniciar canción" })).toBeVisible();
      await expect(lyricsSurface.getByRole("button", { name: "Ocultar letra" })).toBeFocused();

      const modalGeometry = await page.evaluate(() => {
        const surface = document.querySelector<HTMLElement>('.bug-cesante-lyrics-surface[data-presentation="alternate"]');
        const player = document.querySelector<HTMLElement>('.bug-cesante-player[data-presentation="alternate"]');
        if (surface === null || player === null) throw new Error("Mobile lyrics geometry probes are unavailable.");
        const surfaceRect = surface.getBoundingClientRect();
        const playerRect = player.getBoundingClientRect();
         const lyrics = surface.querySelector<HTMLElement>(".bug-cesante-player-lyrics");
         const header = surface.querySelector<HTMLElement>(".bug-cesante-lyrics-header");
         const close = surface.querySelector<HTMLElement>(".bug-cesante-lyrics-close");
         if (lyrics === null || header === null || close === null) throw new Error("Mobile lyrics probes are unavailable.");
        const surfaceStyle = getComputedStyle(surface);
        const points: [number, number][] = [
          [4, 0], [4, Math.max(1, playerRect.bottom - 1)], [4, Math.max(0, header.getBoundingClientRect().top)],
          [window.innerWidth - 4, 0], [window.innerWidth - 4, Math.max(1, playerRect.bottom - 1)],
        ];
        return {
          backdropSamples: points.map(([x, y]) => document.elementFromPoint(x, y)?.closest(".bug-cesante-lyrics-surface") === surface),
           bottom: surfaceRect.bottom,
           closeHeight: close.getBoundingClientRect().height,
           headerTop: header.getBoundingClientRect().top,
           headerHeight: header.getBoundingClientRect().height,
          height: surfaceRect.height,
          left: surfaceRect.left,
           playerOccluded: document.elementFromPoint(playerRect.left + playerRect.width / 2, playerRect.top + playerRect.height / 2)?.closest(".bug-cesante-lyrics-surface") === surface,
             playerBottom: playerRect.bottom,
          playerZIndex: Number.parseInt(getComputedStyle(player).zIndex, 10),
           scrollable: lyrics.scrollHeight > lyrics.clientHeight,
          surfaceBackgroundColor: surfaceStyle.backgroundColor,
          surfaceZIndex: Number.parseInt(surfaceStyle.zIndex, 10),
          top: surfaceRect.top,
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
          width: surfaceRect.width,
        };
      });
      expect(modalGeometry.backdropSamples.every(Boolean)).toBe(true);
      expect(modalGeometry.surfaceBackgroundColor).toBe("rgb(5, 5, 5)");
       expect(modalGeometry.surfaceZIndex).toBe(100);
       expect(modalGeometry.surfaceZIndex).toBeGreaterThan(modalGeometry.playerZIndex);
       expect(modalGeometry.playerOccluded).toBe(true);
       expect(modalGeometry.top).toBeCloseTo(0, 0);
       expect(modalGeometry.left).toBeCloseTo(0, 0);
       expect(modalGeometry.width).toBeCloseTo(modalGeometry.viewportWidth, 0);
       expect(modalGeometry.height).toBeCloseTo(modalGeometry.viewportHeight, 0);
       expect(modalGeometry.bottom).toBeCloseTo(modalGeometry.viewportHeight, 0);
       expect(modalGeometry.headerHeight).toBeCloseTo(primary390Geometry.headerHeight, 0);
       expect(modalGeometry.closeHeight).toBeCloseTo(primary390Geometry.closeHeight, 0);
       expect(modalGeometry.scrollable).toBe(true);
      await page.screenshot({ path: "test-results/alternate-lyrics-backdrop-390x844.png", fullPage: false, scale: "css" });

      await lyricsSurface.getByRole("button", { name: "Ocultar letra" }).click();
      await expect(lyricsSurface).toHaveCount(0);
      await lyricsButton.click();
      await expect(lyricsSurface).toBeVisible();
       await page.keyboard.press("Escape");
       await expect(lyricsSurface).toHaveCount(0);
       await expect(lyricsButton).toBeFocused();

       await page.setViewportSize({ width: 375, height: 667 });
       await expect(player).toBeVisible();
       const compactGeometry = await page.evaluate(() => {
         const player = document.querySelector<HTMLElement>('.bug-cesante-player[data-presentation="alternate"]');
         if (player === null) throw new Error("Compact alternate player probe is unavailable.");
         const controls = [...player.querySelectorAll<HTMLElement>("button, input[type='range']")];
         const playerRect = player.getBoundingClientRect();
         const social = document.querySelector<HTMLElement>(".portfolio-alternate-social");
         if (social === null) throw new Error("Mobile social navigation probe is unavailable.");
         const controlRects = controls.map((control) => control.getBoundingClientRect());
         const firstControl = controlRects[0];
         const lastControl = controlRects.at(-1);
         if (firstControl === undefined || lastControl === undefined) throw new Error("Compact alternate controls are unavailable.");
         const socialRect = social.getBoundingClientRect();
         return {
           controls: controls.map((control) => {
             const rect = control.getBoundingClientRect();
             return { height: rect.height, left: rect.left, right: rect.right, width: rect.width };
           }),
           controlCenterDelta: Math.abs((firstControl.left + lastControl.right) / 2 - (playerRect.left + playerRect.width / 2)),
           documentWidth: document.documentElement.scrollWidth,
           leftControlClearance: firstControl.left - playerRect.left,
           navCenterDelta: Math.abs(socialRect.left + socialRect.width / 2 - window.innerWidth / 2),
           playerRect: { left: playerRect.left, right: playerRect.right, width: playerRect.width },
           rightControlClearance: playerRect.right - lastControl.right,
           viewportWidth: window.innerWidth,
         };
       });
       expect(compactGeometry.playerRect.width).toBeCloseTo(343, 0);
       expect(compactGeometry.playerRect.left).toBeCloseTo(16, 0);
       expect(compactGeometry.playerRect.right).toBeCloseTo(359, 0);
       expect(compactGeometry.documentWidth).toBeLessThanOrEqual(compactGeometry.viewportWidth);
       expect(compactGeometry.controls.every((control) => control.height >= 44)).toBe(true);
       expect(compactGeometry.controls.every((control) => control.width >= 44)).toBe(true);
       expect(compactGeometry.controlCenterDelta).toBeLessThanOrEqual(1);
       expect(Math.abs(compactGeometry.leftControlClearance - compactGeometry.rightControlClearance)).toBeLessThanOrEqual(1);
        expect(compactGeometry.navCenterDelta).toBeLessThanOrEqual(1);
        expect(compactGeometry.controls.every((control) => control.left >= compactGeometry.playerRect.left && control.right <= compactGeometry.playerRect.right)).toBe(true);

        await page.evaluate(() => window.scrollTo(0, 300));
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(150);
        await lyricsButton.click();
        await expect(page.getByRole("button", { name: "Ocultar letra" })).toHaveCount(1);
        await expect(page.getByRole("dialog", { name: "Letra de Bug Cesante" })).toBeVisible();
        await expect(page.locator(".bug-cesante-player-scope")).toHaveAttribute("inert", "");
        const compactModalGeometry = await page.evaluate(() => {
          const surface = document.querySelector<HTMLElement>('.bug-cesante-lyrics-surface[data-presentation="alternate"]');
          const player = document.querySelector<HTMLElement>('.bug-cesante-player[data-presentation="alternate"]');
          if (surface === null || player === null) throw new Error("Compact modal probes are unavailable.");
          const surfaceRect = surface.getBoundingClientRect();
          const playerRect = player.getBoundingClientRect();
           const header = surface.querySelector<HTMLElement>(".bug-cesante-lyrics-header");
           const lyrics = surface.querySelector<HTMLElement>(".bug-cesante-player-lyrics");
           const close = surface.querySelector<HTMLElement>(".bug-cesante-lyrics-close");
           if (header === null || lyrics === null || close === null) throw new Error("Compact modal content probes are unavailable.");
           const points: [number, number][] = [[4, 0], [4, playerRect.bottom - 1], [window.innerWidth - 4, 0], [window.innerWidth - 4, playerRect.bottom - 1]];
          return {
             backdropSamples: points.map(([x, y]) => document.elementFromPoint(x, y)?.closest(".bug-cesante-lyrics-surface") === surface),
             bottom: surfaceRect.bottom,
             closeHeight: close.getBoundingClientRect().height,
             headerTop: header.getBoundingClientRect().top,
             headerHeight: header.getBoundingClientRect().height,
             height: surfaceRect.height,
             left: surfaceRect.left,
             playerBottom: playerRect.bottom,
            playerZIndex: Number.parseInt(getComputedStyle(player).zIndex, 10),
            scrollable: lyrics.scrollHeight > lyrics.clientHeight,
            surfaceBackgroundColor: getComputedStyle(surface).backgroundColor,
            surfaceZIndex: Number.parseInt(getComputedStyle(surface).zIndex, 10),
            top: surfaceRect.top,
             playerOccluded: document.elementFromPoint(playerRect.left + playerRect.width / 2, playerRect.top + playerRect.height / 2)?.closest(".bug-cesante-lyrics-surface") === surface,
             width: surfaceRect.width,
          };
        });
        expect(compactModalGeometry.backdropSamples.every(Boolean)).toBe(true);
        expect(compactModalGeometry.surfaceBackgroundColor).toBe("rgb(5, 5, 5)");
         expect(compactModalGeometry.surfaceZIndex).toBe(100);
         expect(compactModalGeometry.surfaceZIndex).toBeGreaterThan(compactModalGeometry.playerZIndex);
         expect(compactModalGeometry.playerOccluded).toBe(true);
         expect(compactModalGeometry.top).toBeCloseTo(0, 0);
         expect(compactModalGeometry.left).toBeCloseTo(0, 0);
         expect(compactModalGeometry.height).toBeCloseTo(667, 0);
         expect(compactModalGeometry.bottom).toBeCloseTo(667, 0);
         expect(compactModalGeometry.width).toBeCloseTo(375, 0);
         expect(compactModalGeometry.headerHeight).toBeCloseTo(primary375Geometry.headerHeight, 0);
         expect(compactModalGeometry.closeHeight).toBeCloseTo(primary375Geometry.closeHeight, 0);
         expect(compactModalGeometry.scrollable).toBe(true);
        await page.screenshot({ path: "test-results/alternate-lyrics-backdrop-375x667.png", fullPage: false, scale: "css" });
        await page.getByRole("button", { name: "Ocultar letra" }).click();
        await expect(page.getByRole("dialog", { name: "Letra de Bug Cesante" })).toHaveCount(0);
        await expect(lyricsButton).toBeFocused();

        await test.info().attach("alternate-player-mobile", {
         body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });
    },
  );

  test(
    "keeps the alternate mobile safe zone opaque and below the clickable player",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-ALTERNATE-SAFE-ZONE-E2E-001"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);
      const viewports = [375, 390, 414];

      for (const width of viewports) {
        await page.setViewportSize({ width, height: 844 });
        if (width === viewports[0]) await portfolio.gotoAlternatePortfolio();

        const safeZone = page.locator('.mobile-control-safe-zone[data-presentation="alternate"]');
        const player = page.locator('.bug-cesante-player[data-presentation="alternate"]');
        await expect(safeZone).toBeVisible();
        await expect(player).toBeVisible();

        await page.evaluate(() => window.scrollTo(0, 300));
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(150);

        const metrics = await page.evaluate(() => {
          const safeZone = document.querySelector<HTMLElement>('.mobile-control-safe-zone[data-presentation="alternate"]');
          const player = document.querySelector<HTMLElement>('.bug-cesante-player[data-presentation="alternate"]');
          if (safeZone === null || player === null) throw new Error("Alternate safe-zone probe is unavailable.");
          const safeZoneRect = safeZone.getBoundingClientRect();
          const playerRect = player.getBoundingClientRect();
          const safeZoneStyle = getComputedStyle(safeZone);
          const playerStyle = getComputedStyle(player);
          const playerPoint = document.elementFromPoint(playerRect.left + playerRect.width / 2, playerRect.top + playerRect.height / 2);
          return {
            documentWidth: document.documentElement.scrollWidth,
            playerBottom: playerRect.bottom,
            playerPointIsPlayer: playerPoint?.closest(".bug-cesante-player") === player,
            playerZIndex: Number.parseInt(playerStyle.zIndex, 10),
            safeZoneBackground: safeZoneStyle.backgroundColor,
            safeZoneBottom: safeZoneRect.bottom,
            safeZoneDisplay: safeZoneStyle.display,
            safeZonePointerEvents: safeZoneStyle.pointerEvents,
            safeZonePosition: safeZoneStyle.position,
            safeZoneTop: safeZoneRect.top,
            safeZoneZIndex: Number.parseInt(safeZoneStyle.zIndex, 10),
            viewportWidth: window.innerWidth,
          };
        });

        expect(metrics.safeZoneBackground).toBe("rgb(5, 5, 5)");
        expect(metrics.safeZoneDisplay).toBe("block");
        expect(metrics.safeZonePointerEvents).toBe("none");
        expect(metrics.safeZonePosition).toBe("fixed");
        expect(metrics.safeZoneTop).toBeCloseTo(0, 0);
        expect(metrics.safeZoneBottom).toBeGreaterThanOrEqual(metrics.playerBottom - 1);
        expect(metrics.safeZoneZIndex).toBe(30);
        expect(metrics.playerZIndex).toBe(40);
        expect(metrics.playerPointIsPlayer).toBe(true);
        expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);
        await test.info().attach(`alternate-safe-zone-${width}`, {
          body: await page.screenshot({ fullPage: false, scale: "css" }),
          contentType: "image/png",
        });
      }
    },
  );

  test(
    "preserves the primary mobile safe-zone visual contract",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-PRIMARY-SAFE-ZONE-E2E-001"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);

      await page.setViewportSize({ width: 390, height: 844 });
      await portfolio.gotoShowcase();
      await activateMusicThroughVoid(page);

      const metrics = await page.locator('.mobile-control-safe-zone[data-presentation="primary"]').evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          backgroundImage: style.backgroundImage,
          display: style.display,
          maskImage: style.maskImage,
          pointerEvents: style.pointerEvents,
          position: style.position,
          zIndex: Number.parseInt(style.zIndex, 10),
        };
      });

      expect(metrics.backgroundImage).toContain("linear-gradient");
      expect(metrics.display).toBe("block");
      expect(metrics.maskImage).toContain("linear-gradient");
      expect(metrics.pointerEvents).toBe("none");
      expect(metrics.position).toBe("fixed");
      expect(metrics.zIndex).toBe(30);
    },
  );

  test(
    "centers the alternate CTA content at common mobile widths and keeps exact card copy",
    { tag: ["@high", "@e2e", "@portfolio", "@PORTFOLIO-ALTERNATE-COPY-E2E-001"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);

      for (const width of [375, 390, 414]) {
        await page.setViewportSize({ height: 844, width });
        await portfolio.gotoPortfolio();
        const link = portfolio.alternateEntry;
        await expect(link).toBeVisible();
        const centers = await link.evaluate((element) => {
          const content = element.querySelector("span");
          if (content === null) throw new Error("Alternate CTA content probe is unavailable.");
          const linkRect = element.getBoundingClientRect();
          const contentRect = content.getBoundingClientRect();
          return {
            contentCenterX: contentRect.left + contentRect.width / 2,
            contentCenterY: contentRect.top + contentRect.height / 2,
            linkCenterX: linkRect.left + linkRect.width / 2,
            linkCenterY: linkRect.top + linkRect.height / 2,
          };
        });
        expect(Math.abs(centers.contentCenterX - centers.linkCenterX)).toBeLessThanOrEqual(1);
        expect(Math.abs(centers.contentCenterY - centers.linkCenterY)).toBeLessThanOrEqual(1);
      }

      await page.setViewportSize({ height: 844, width: 390 });
      await portfolio.gotoAlternatePortfolio();
      await expect(page.locator(".portfolio-alternate-card").nth(0).locator(".portfolio-alternate-card-description")).toHaveText(
        "Guía que organiza fundamentos de ingeniería de software en rutas de aprendizaje progresivas y aplicables. Cada tema conecta arquitectura, testing y decisiones de entrega para convertir estudio disperso en un criterio de construcción revisable.",
      );
      await expect(page.locator(".portfolio-alternate-card").nth(3).locator(".portfolio-alternate-card-description")).toHaveText(
        "Landing narrativa para un juego de cartas táctico, construida con Astro. La interfaz convierte mitología, estrategia y exploración visual en una entrada clara hacia el sistema del juego.",
      );
      await expect(page.getByText("13 proyectos · una mirada técnica y humana", { exact: true })).toHaveCount(0);
    },
  );

  test(
    "centers the alternate header navigation group without mobile overflow",
    { tag: ["@high", "@e2e", "@portfolio", "@PORTFOLIO-ALTERNATE-NAV-E2E-001"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);

      for (const viewport of [{ width: 375, height: 667 }, { width: 390, height: 844 }, { width: 414, height: 896 }]) {
        await page.setViewportSize(viewport);
        await portfolio.gotoAlternatePortfolio();
        const metrics = await page.locator(".portfolio-alternate-social").evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return {
            centerDelta: Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2),
            documentWidth: document.documentElement.scrollWidth,
            links: [...element.querySelectorAll<HTMLAnchorElement>("a")].map((link) => {
              const linkRect = link.getBoundingClientRect();
              return { left: linkRect.left, right: linkRect.right, width: linkRect.width };
            }),
            viewportWidth: window.innerWidth,
          };
        });

        expect(metrics.centerDelta).toBeLessThanOrEqual(1);
        expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);
        expect(metrics.links.every((link) => link.width >= 44 && link.left >= 0 && link.right <= metrics.viewportWidth)).toBe(true);
      }
    },
  );

  test(
    "reopens the seal interface with cached seal images after the alternate route round trip",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-SEAL-ROUNDTRIP-E2E-001"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);

      await page.setViewportSize({ width: 1280, height: 800 });
      await portfolio.gotoPortfolio();
      await expect(portfolio.alternateEntry).toBeVisible();
      await portfolio.alternateEntry.click();
      await expect(page).toHaveURL(/\/portfolio\/$/);
      await expect(portfolio.alternateCards).toHaveCount(13);

      await page.getByRole("link", { name: "Volver" }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(portfolio.alternateEntry).toBeVisible();
      await portfolio.reopenSealInterfaceFromClosedCurtain();

      const sealImages = page.locator(".vault-seal-hotspot img");
      await expect(sealImages).toHaveCount(3);
      await expect.poll(async () => sealImages.evaluateAll((images) => images.every((image) => {
        const sealImage = image as HTMLImageElement;
        const rect = image.getBoundingClientRect();
        return sealImage.complete && sealImage.naturalWidth > 0 && rect.width > 0 && rect.height > 0;
      }))).toBe(true);
      await expect(page.getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /Sello 2 — La Garra.*Bloqueado/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /Sello 3 — La Cerradura.*Bloqueado/ })).toBeVisible();
    },
  );

  test(
    "enters the alternate portfolio from the closed curtain without unlocking the vault",
    { tag: ["@high", "@e2e", "@portfolio", "@PORTFOLIO-ALTERNATE-E2E-002"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);

      await page.setViewportSize({ width: 390, height: 844 });
      await portfolio.gotoPortfolio();
      await expect(portfolio.alternateEntry).toBeVisible();
      await expect(page.getByRole("heading", { name: "¿Qué hay detrás?" })).toBeVisible();
      await portfolio.alternateEntry.click();
      await expect(page).toHaveURL(/\/portfolio\/$/);
      await expect(portfolio.alternateCards).toHaveCount(13, { timeout: 30_000 });
      await expect(page.locator(".vault-shell")).toHaveCount(0);
      await expect(page.getByRole("dialog", { name: "Transición a la sala principal" })).toHaveCount(0);
    },
  );

  test(
    "keeps forced alternate player visibility local when discovery was inactive",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-PLAYER-ISOLATION-E2E-001"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);

      await page.addInitScript(() => {
        sessionStorage.setItem("kuroneko:bug-cesante-player", JSON.stringify({
          activated: false,
          currentTime: 0,
          hidden: false,
          lyricsExpanded: false,
          paused: true,
          position: null,
        }));
      });
      await portfolio.gotoAlternatePortfolio();
      await expect(page.getByRole("complementary", { name: "Reproductor persistente de Bug Cesante" })).toBeVisible();
      expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("kuroneko:bug-cesante-player") ?? "{}").activated)).toBe(false);

      await page.getByRole("link", { name: "Volver", exact: true }).click();
      await expect(page).toHaveURL(/\/$/);
      await portfolio.enterShowcaseFromCurrentPage();
      await expect(page.getByRole("complementary", { name: "Reproductor persistente de Bug Cesante" })).toHaveCount(0);
      expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("kuroneko:bug-cesante-player") ?? "{}").activated)).toBe(false);
    },
  );

  test(
    "preserves genuinely activated player discovery across the alternate route",
    { tag: ["@high", "@e2e", "@portfolio", "@PORTFOLIO-PLAYER-ISOLATION-E2E-002"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);

      await page.addInitScript(() => {
        sessionStorage.setItem("kuroneko:bug-cesante-player", JSON.stringify({
          activated: true,
          currentTime: 12.5,
          hidden: false,
          lyricsExpanded: false,
          paused: true,
          position: null,
        }));
      });
      await portfolio.gotoAlternatePortfolio();
      await expect(page.getByRole("complementary", { name: "Reproductor persistente de Bug Cesante" })).toBeVisible();

      await page.getByRole("link", { name: "Volver", exact: true }).click();
      await expect(page).toHaveURL(/\/$/);
      await portfolio.enterShowcaseFromCurrentPage();
      await expect(page.getByRole("complementary", { name: "Reproductor persistente de Bug Cesante" })).toBeVisible();
      expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("kuroneko:bug-cesante-player") ?? "{}").activated)).toBe(true);
    },
  );

  test(
    "renders the continuous vault first frame",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-E2E-001"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);

      await portfolio.gotoPortfolio();

      await portfolio.expectFirstFrame();
      await expect(page.locator(".vault-curtain-opening")).toHaveAttribute(
        "data-intro-frame-state",
        "drawn",
      );
      await expect(page.locator(".vault-curtain-opening")).toHaveAttribute(
        "data-first-frame-drawn",
        "true",
      );
    },
  );

  test(
    "returns the curtain to the closed root after ten sub-1-percent touch cycles",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-CURTAIN-ROOT-E2E-001"] },
    async ({ browser }) => {
      const context = await browser.newContext({
        hasTouch: true,
        viewport: { height: 844, width: 390 },
      });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);

      try {
        const portfolio = new PortfolioPage(page);
        const curtainStage = page.locator(".vault-visual-stage");
        const curtainCanvas = page.locator(".vault-curtain-opening");
        const minimalVersionLink = page.getByRole("link", { exact: true, name: "VERSIÓN MINIMALISTA" });

        await portfolio.gotoPortfolio();
        await expect(curtainCanvas).toHaveAttribute("data-intro-frame-state", "drawn", { timeout: INTRO_FRAME_RECOVERY_TIMEOUT_MS });
        await expect(curtainStage).toHaveAttribute("data-intro-phase", "closed");
        await expect(minimalVersionLink).toBeVisible();

        for (let cycle = 0; cycle < 10; cycle += 1) {
          await dispatchTouchDrag(cdp, cycle * 2 + 1, 195, 422, 0, -1);
          await expect.poll(async () => Number(await curtainCanvas.getAttribute("data-rendered-frame"))).toBeGreaterThan(0);

          await dispatchTouchDrag(cdp, cycle * 2 + 2, 195, 422, 0, 1);
          await expect(curtainStage).toHaveAttribute("data-intro-phase", "closed");
          await expect(minimalVersionLink).toBeVisible();
        }
      } finally {
        await context.close();
      }
    },
  );

  test(
    "keeps the project fallback reachable without JavaScript",
    { tag: ["@critical", "@e2e", "@portfolio", "@RELIABILITY-001"] },
    async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();

      try {
        await page.goto("/");
        await expect(
          page.getByRole("heading", { name: "Kurone Ko Portfolio" }),
        ).toBeVisible();
        await expect(
          page.getByRole("heading", { name: "Proyectos visibles" }),
        ).toBeVisible();
        await expect(page.locator("body")).toHaveCSS("overflow-y", "auto");
      } finally {
        await context.close();
      }
    },
  );

  test(
    "identifies degraded intro mode when frame assets cannot load",
    { tag: ["@critical", "@e2e", "@portfolio", "@RESILIENCE-003"] },
    async ({ browser }) => {
      const context = await browser.newContext();
      await context.route("**/assets/intro/open-vault-frames/**", (route) =>
        route.abort(),
      );
      const page = await context.newPage();

      try {
        await page.goto("/");
        await expect(page.locator(".vault-curtain-opening")).toHaveAttribute(
          "data-intro-frame-state",
          "degraded",
        );
        await expect(page.locator(".vault-curtain-opening")).toHaveAttribute(
          "data-first-frame-drawn",
          "false",
        );
      } finally {
        await context.close();
      }
    },
  );

  test(
    "keeps seal controls, unlocking counts, and focus transitions equivalent",
    { tag: ["@high", "@e2e", "@portfolio", "@PORTFOLIO-E2E-002"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const portfolio = new PortfolioPage(page);

      await portfolio.gotoPortfolio();
      await portfolio.openSealInterfaceWithKeyboard();

      await expect(page.getByText("Desbloqueado 0/3")).toBeVisible();
      await portfolio.expectDesktopSealGuidance();
      await portfolio.expectSelectionDisabledForVault();
      await portfolio.expectCenteredArrowControls();
      await portfolio.expectNoUmbralCopy();
      await expect(
        page.getByRole("heading", { name: "Sello 1 — El Ojo" }),
      ).toHaveCount(0);
      await portfolio.expectNoInternalSealMapping();
      await expect(
        page.getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ }),
      ).toHaveAttribute("aria-pressed", "false");
      await expect(
        page.getByRole("button", { name: /Sello 2 — La Garra.*Bloqueado/ }),
      ).toBeVisible();

      await page
        .getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ })
        .click();
      await expect(
        page.getByRole("dialog", { name: "Sello 1 — El Ojo" }),
      ).toBeVisible();
      await portfolio.expectDesktopPanelWithoutLongText();
      await expect(page.getByText("Desbloqueado 1/3")).toBeVisible();
      await portfolio.expectNoUmbralCopy();
      await page.getByRole("button", { name: "Cerrar sello" }).click();

      await page
        .getByRole("button", { name: /Sello 2 — La Garra.*Bloqueado/ })
        .click();
      await expect(
        page.getByRole("dialog", { name: "Sello 2 — La Garra" }),
      ).toBeVisible();
      await expect(page.getByText("Desbloqueado 2/3")).toBeVisible();
      await page.getByRole("button", { name: "Cerrar sello" }).click();

      await page
        .getByRole("button", { name: /Sello 1 — El Ojo.*Desbloqueado/ })
        .click();
      await expect(
        page.getByRole("dialog", { name: "Sello 1 — El Ojo" }),
      ).toBeVisible();
      await expect(page.getByText("Desbloqueado 2/3")).toBeVisible();
    },
  );

  test(
    "supports seal carousel arrows from 0/3 and captures centered desktop layout",
    { tag: ["@high", "@e2e", "@portfolio", "@PORTFOLIO-E2E-013"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const portfolio = new PortfolioPage(page);

      await portfolio.gotoPortfolio();
      await portfolio.openSealInterfaceWithKeyboard();
      await portfolio.expectDesktopSealGuidance();
      await page.screenshot({
        fullPage: true,
        path: "test-results/vault-centered-arrow-controls.png",
      });
      await portfolio.expectArrowControlCarouselWraps();
    },
  );

  test(
    "keeps art-plane arrows in a collision-free safe zone at representative viewports",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-E2E-017"] },
    async ({ page }) => {
      test.setTimeout(60_000);
      await page.emulateMedia({ reducedMotion: "reduce" });
      const viewports = [
        {
          width: 375,
          height: 667,
          screenshot: "vault-arrows-safe-mobile-375x667.png",
        },
        {
          width: 390,
          height: 844,
          screenshot: "vault-arrows-safe-mobile-390x844.png",
        },
        {
          width: 886,
          height: 906,
          screenshot: "vault-arrows-safe-tablet-886x906.png",
        },
        {
          width: 1280,
          height: 720,
          screenshot: "vault-arrows-safe-desktop-1280x720.png",
        },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        const portfolio = new PortfolioPage(page);
        await portfolio.gotoPortfolio();
        await portfolio.openSealInterfaceWithKeyboard();
        await portfolio.expectArrowControlsAvoidSealsAndDialogue();
        await page.screenshot({
          fullPage: true,
          path: `test-results/${viewport.screenshot}`,
        });

        if (viewport.width === 886) {
          await page.screenshot({
            fullPage: true,
            path: "test-results/vault-tablet-panel-safe-padding.png",
          });
        }
      }
    },
  );

  test(
    "keeps the HUD top-right while enlarging it only on desktop",
    { tag: ["@high", "@e2e", "@portfolio", "@PORTFOLIO-E2E-018"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: 390, height: 844 });
      let portfolio = new PortfolioPage(page);
      await portfolio.gotoPortfolio();
      await portfolio.openSealInterfaceWithKeyboard();
      const mobileHud = await portfolio.getHudMetrics();

      await page.setViewportSize({ width: 1280, height: 720 });
      portfolio = new PortfolioPage(page);
      await portfolio.gotoPortfolio();
      await portfolio.openSealInterfaceWithKeyboard();
      const desktopHud = await portfolio.getHudMetrics();

      expect(mobileHud.x).toBeGreaterThan(0);
      expect(mobileHud.y).toBeGreaterThanOrEqual(0);
      expect(mobileHud.fontSize).toBeLessThanOrEqual(14.08);
      expect(desktopHud.x).toBeGreaterThan(1000);
      expect(desktopHud.y).toBeGreaterThanOrEqual(0);
      expect(desktopHud.fontSize).toBeGreaterThan(mobileHud.fontSize);
    },
  );

  test(
    "activates first seal with ArrowRight from 0/3 after keyboard handoff is released",
    { tag: ["@high", "@e2e", "@portfolio", "@PORTFOLIO-E2E-014"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const portfolio = new PortfolioPage(page);

      await portfolio.gotoPortfolio();
      await portfolio.activateFirstSealFromZeroWithKeyboard();
    },
  );

  test(
    "keeps held ArrowRight from leaking into seal activation after intro",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-E2E-015"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);

      await page.setViewportSize({ width: 390, height: 844 });
      await portfolio.gotoPortfolio();
      await portfolio.expectMobileIntroGuidance();
      await portfolio.shell.focus();
      await page.keyboard.down("ArrowRight");

      await portfolio.unlockMobileVaultForCinematic();

      await expect(
        page.getByRole("button", { name: "Mis obras en construcción" }),
      ).toBeVisible();
      await page.keyboard.down("ArrowRight");
      await expect(
        page.getByRole("dialog", { name: "Sello 1 — El Ojo" }),
      ).toHaveCount(0);
      await page.keyboard.up("ArrowRight");
      await page.keyboard.press("ArrowRight");
      await expect(
        page.getByRole("dialog", { name: "Sello 1 — El Ojo" }),
      ).toBeVisible();
    },
  );

  test(
    "hands off mobile taps without canvas regression or seal activation",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-E2E-020"] },
    async ({ browser }) => {
      const context = await browser.newContext({
        hasTouch: true,
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      const portfolio = new PortfolioPage(page);

      try {
        await page.addInitScript(() => {
          const observedFrames: number[] = [];
          const recordFrame = (element: Element) => {
            const frame = element.getAttribute("data-rendered-frame");

            if (frame !== null && Number(frame) >= 0) {
              observedFrames.push(Number(frame));
            }
          };
          const recordFramesWithin = (element: Element) => {
            if (
              element instanceof HTMLElement &&
              element.classList.contains("vault-curtain-opening")
            ) {
              recordFrame(element);
            }

            for (const frame of element.querySelectorAll(
              ".vault-curtain-opening",
            )) {
              recordFrame(frame);
            }
          };
          const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
              if (
                mutation.type === "attributes" &&
                mutation.target instanceof HTMLElement &&
                mutation.target.classList.contains("vault-curtain-opening")
              ) {
                recordFrame(mutation.target);
              }

              if (mutation.type === "childList") {
                for (const node of mutation.addedNodes) {
                  if (node instanceof Element) {
                    recordFramesWithin(node);
                  }
                }
              }
            }
          });

          observer.observe(document, {
            attributes: true,
            attributeFilter: ["data-rendered-frame"],
            childList: true,
            subtree: true,
          });
          Object.assign(window, { __portfolioRenderedFrames: observedFrames });
        });
        await portfolio.gotoPortfolio();
        await portfolio.expectMobileIntroGuidance();
        await expect(page.locator(".vault-curtain-opening")).toHaveAttribute(
          "data-rendered-frame",
          /^\d+$/,
          { timeout: INTRO_FRAME_RECOVERY_TIMEOUT_MS },
        );
        await expect
          .poll(
            () =>
              page.evaluate(
                () => window.__portfolioRenderedFrames?.length ?? 0,
              ),
            { timeout: INTRO_FRAME_RECOVERY_TIMEOUT_MS },
          )
          .toBeGreaterThan(0);

        const readIntroState = () =>
          page.evaluate(() => {
            const canvas = document.querySelector<HTMLCanvasElement>(
              ".vault-curtain-opening",
            );
            const shell = document.querySelector<HTMLElement>(".vault-shell");

            if (canvas === null || shell === null) {
              throw new Error("Mobile intro state probes are unavailable.");
            }

            return {
              canvasContextReady: canvas.getContext("2d") !== null,
              canvasFrame: canvas.getAttribute("data-rendered-frame"),
              canvasFrameState: canvas.getAttribute("data-intro-frame-state"),
              canvasFirstFrameDrawn: canvas.getAttribute("data-first-frame-drawn"),
              canvasTagName: canvas.tagName,
              openDialogCount: document.querySelectorAll("dialog[open]").length,
              shellIntroActive: shell.getAttribute("data-intro-active"),
              shellSealDialogOpen: shell.getAttribute("data-seal-dialog-open"),
              shellUnlocked: shell.getAttribute("data-unlocked"),
              shellVaultComplete: shell.getAttribute("data-vault-complete"),
            };
          });

        const introBeforeTap = await readIntroState();
        pageErrors.length = 0;
        await page.touchscreen.tap(195, 422);
        const introAfterTap = await readIntroState();

        expect(introAfterTap).toEqual(introBeforeTap);
        expect(introAfterTap.canvasTagName).toBe("CANVAS");
        expect(introAfterTap.canvasContextReady).toBe(true);
        expect(introAfterTap.shellIntroActive).toBe("true");
        expect(introAfterTap.shellSealDialogOpen).toBe("false");
        expect(introAfterTap.shellUnlocked).toBe("false");
        expect(introAfterTap.shellVaultComplete).toBe("false");
        expect(introAfterTap.openDialogCount).toBe(0);
        expect(pageErrors).toEqual([]);
      } finally {
        await context.close();
      }
    },
  );

  test(
    "opens desktop seal modal and dismisses it with close, outside click, Escape, and browser back",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-E2E-012"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const portfolio = new PortfolioPage(page);

      await portfolio.gotoPortfolio();
      await portfolio.openSealInterfaceWithKeyboard();
      await portfolio.openDesktopSealModal();
      await portfolio.expectDesktopPanelWithoutLongText();
      await page.getByRole("button", { name: "Cerrar sello" }).click();
      await expect(
        page.getByRole("dialog", { name: "Sello 1 — El Ojo" }),
      ).toHaveCount(0);

      await page
        .getByRole("button", { name: /Sello 2 — La Garra.*Bloqueado/ })
        .click();
      await portfolio.closeSealModalWithOutsideClick("Sello 2 — La Garra");

      await page
        .getByRole("button", { name: /Sello 3 — La Cerradura.*Bloqueado/ })
        .click();
      await portfolio.closeSealModalWithEscape("Sello 3 — La Cerradura");

      await page
        .getByRole("button", { name: /Sello 1 — El Ojo.*Desbloqueado/ })
        .click();
      await portfolio.closeSealModalWithBrowserBack("Sello 1 — El Ojo");
    },
  );

  test(
    "keeps mobile seal selection clean and opens readable seal modal",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-E2E-011"] },
    async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      const portfolio = new PortfolioPage(page);

      await portfolio.gotoPortfolio();
      await portfolio.expectMobileSealSelectionClean();
      await portfolio.expectMobileDialogueCentered();
      await page.screenshot({
        fullPage: true,
        path: "test-results/vault-mobile-centered-dialogue.png",
      });
      await portfolio.expectNoUmbralCopy();
      await portfolio.expectNoInternalSealMapping();

      await portfolio.openMobileSealModal();
      await portfolio.expectNoUmbralCopy();
      await portfolio.expectNoInternalSealMapping();
      await portfolio.closeMobileSealModal();
    },
  );

  test(
    "keeps vault text selection disabled without hiding controls",
    { tag: ["@medium", "@e2e", "@portfolio", "@PORTFOLIO-E2E-016"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const portfolio = new PortfolioPage(page);

      await portfolio.gotoPortfolio();
      await portfolio.openSealInterfaceWithKeyboard();
      await portfolio.expectSelectionDisabledForVault();
      await portfolio.expectDesktopSealGuidance();
      await page.screenshot({
        fullPage: true,
        path: "test-results/vault-selection-no-text-highlight-layout.png",
      });
    },
  );

  test(
    "keeps reduced-motion support internal without visible motion controls",
    { tag: ["@critical", "@e2e", "@a11y", "@PORTFOLIO-E2E-003"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const portfolio = new PortfolioPage(page);

      await portfolio.gotoPortfolio();

      await portfolio.expectReducedMotionActive();
      await portfolio.openSealInterfaceWithKeyboard();
      await page
        .getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ })
        .click();
      await expect(page.getByText("Desbloqueado 1/3")).toBeVisible();
      await portfolio.closeSealModalWithCloseButton("Sello 1 — El Ojo");
      await page
        .getByRole("button", { name: /Sello 2 — La Garra.*Bloqueado/ })
        .click();
      await expect(page.getByText("Desbloqueado 2/3")).toBeVisible();
      await portfolio.closeSealModalWithCloseButton("Sello 2 — La Garra");
      await expect(
        page.getByRole("button", {
          name: /Pausar movimiento|Reanudar movimiento/,
        }),
      ).toHaveCount(0);
    },
  );

  test(
    "unlocks the Main Hall with seal controls and moves focus to its landmark",
    { tag: ["@critical", "@e2e", "@a11y", "@PORTFOLIO-E2E-005"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const portfolio = new PortfolioPage(page);

      await portfolio.gotoPortfolio();
      await portfolio.unlockWithKeyboard();

      await expect(
        page.getByRole("button", { name: "Mis obras en construcción" }),
      ).toHaveCount(0);
      await portfolio.expectMainHallFocused();
      await portfolio.expectVisiblePortfolioComprehensible();
    },
  );

  test(
    "proves natural cinematic playback completes once",
    { tag: ["@critical", "@e2e", "@portfolio", "@CINEMATIC-E2E-001"] },
    async ({ page }) => {
      await installCinematicCapture(page, { key: "natural" });
      await page.setViewportSize({ width: 390, height: 844 });
      const portfolio = new PortfolioPage(page);
      await portfolio.gotoPortfolio();
      await portfolio.startCinematic();
      await expect
        .poll(
          () =>
            page.evaluate(() =>
              window.__cinematicEvents?.some(({ name }) => name === "playing"),
            ),
          { timeout: 15_000 },
        )
        .toBe(true);
      await expect
        .poll(
          () =>
            page.evaluate(() =>
              window.__cinematicEvents?.some(({ name }) => name === "ended"),
            ),
          { timeout: 15_000 },
        )
        .toBe(true);
      await portfolio.expectMainHallFocused(15_000);

      const events = await page.evaluate(() => window.__cinematicEvents!);
      expect(events.map(({ name }) => name)).toEqual(
        expect.arrayContaining(["playing", "ended"]),
      );
      expect(events.some(({ name }) => ["error", "abort"].includes(name))).toBe(
        false,
      );
      expect(
        events.find(({ name }) => name === "ended")!.time -
          events.find(({ name }) => name === "playing")!.time,
      ).toBeGreaterThan(3_500);

      await page.reload();
      await portfolio.unlockMobileVaultForCinematic();
      await portfolio.expectCinematicCtaReady();
      await page
        .getByRole("button", { name: "Mis obras en construcción" })
        .click();
      await expect(portfolio.cinematic()).toHaveCount(0);
    },
  );

  test(
    "records rejected play and hands off without replay",
    { tag: ["@critical", "@e2e", "@portfolio", "@CINEMATIC-E2E-003"] },
    async ({ page }) => {
      await installCinematicCapture(page, {
        key: "rejected",
        rejectPlayback: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      const portfolio = new PortfolioPage(page);
      await portfolio.gotoPortfolio();
      await portfolio.activateCinematic();
      await expect
        .poll(
          () =>
            page.evaluate(() =>
              window.__cinematicEvents?.some(({ name }) => name === "rejected"),
            ),
          { timeout: 15_000 },
        )
        .toBe(true);
      await portfolio.expectMainHallFocused(15_000);

      await page.reload();
      await portfolio.unlockMobileVaultForCinematic();
      await portfolio.expectCinematicCtaReady();
      await page
        .getByRole("button", { name: "Mis obras en construcción" })
        .click();
      await expect(portfolio.cinematic()).toHaveCount(0);
      expect(
        await page.evaluate(
          () =>
            window.__cinematicEvents?.filter(({ name }) => name === "play")
              .length,
        ),
      ).toBe(0);
    },
  );

  test(
    "browser Back preserves a same-document entry and hands off",
    { tag: ["@critical", "@e2e", "@portfolio", "@CINEMATIC-E2E-002"] },
    async ({ page }) => {
      await installCinematicCapture(page, { key: "back" });
      await page.setViewportSize({ width: 390, height: 844 });
      const portfolio = new PortfolioPage(page);
      await portfolio.gotoPortfolio();
      await portfolio.unlockMobileVaultForCinematic();
      const before = await page.evaluate(() => {
        history.pushState({}, "", "#cinematic");
        return {
          length: history.length,
          url: location.href,
          supported: "navigation" in window,
        };
      });
      test.skip(!before.supported, "Chromium Navigation API is unavailable");
      await portfolio.expectCinematicCtaReady();
      await page
        .getByRole("button", { name: "Mis obras en construcción" })
        .click();
      await expect(portfolio.cinematic()).toBeVisible();
      await page.evaluate(() => history.back());
      await portfolio.expectMainHallFocused(15_000);
      await expect(page).toHaveURL(before.url);
      expect(await page.evaluate(() => history.length)).toBe(before.length);
    },
  );
  test(
    "bypasses cinematic immediately for reduced motion and save-data",
    { tag: ["@critical", "@e2e", "@portfolio", "@CINEMATIC-E2E-004"] },
    async ({ browser }) => {
      for (const { setup, unlock } of [
        {
          setup: async (page: import("@playwright/test").Page) =>
            page.emulateMedia({ reducedMotion: "reduce" }),
          unlock: (portfolio: PortfolioPage) =>
            portfolio.unlockAllSealsWithoutEntering(),
        },
        {
          setup: async (page: import("@playwright/test").Page) =>
            page.addInitScript(() => {
              const connection = (
                navigator as Navigator & { connection: object }
              ).connection;
              Object.defineProperty(
                Object.getPrototypeOf(connection),
                "saveData",
                { configurable: true, get: () => true },
              );
            }),
          unlock: (portfolio: PortfolioPage) =>
            portfolio.unlockMobileVaultForCinematic(),
        },
      ]) {
        const context = await browser.newContext({
          viewport: { width: 390, height: 844 },
        });
        const page = await context.newPage();
        const videoRequests: string[] = [];
        page.on("request", (request) => {
          if (request.url().endsWith("/assets/intro/kurOpenVault.webm"))
            videoRequests.push(request.url());
        });
        await setup(page);
        const portfolio = new PortfolioPage(page);
        await portfolio.gotoPortfolio();
        await unlock(portfolio);
        const started = await page.evaluate(() => performance.now());
        await page
          .getByRole("button", { name: "Mis obras en construcción" })
          .click();
        await expect(portfolio.cinematic()).toHaveCount(0);
        await portfolio.expectMainHallFocused();
        expect(
          await page.evaluate((time) => performance.now() - time, started),
        ).toBeLessThan(1_000);
        expect(videoRequests).toEqual([]);
        await context.close();
      }
    },
  );
  test(
    "Skip immediately hands off and does not replay",
    { tag: ["@critical", "@e2e", "@portfolio", "@CINEMATIC-E2E-005"] },
    async ({ page }) => {
      await installCinematicCapture(page, { key: "skip" });
      await page.setViewportSize({ width: 390, height: 844 });
      const portfolio = new PortfolioPage(page);
      await portfolio.gotoPortfolio();
      await portfolio.startCinematic();
      await expect(portfolio.cinematic()).toBeVisible();
      await page.getByRole("button", { name: "Saltar introducción" }).click();
      await portfolio.expectMainHallFocused();

      await page.reload();
      await portfolio.unlockMobileVaultForCinematic();
      await portfolio.expectCinematicCtaReady();
      await page
        .getByRole("button", { name: "Mis obras en construcción" })
        .click();
      await expect(portfolio.cinematic()).toHaveCount(0);
      await portfolio.expectMainHallFocused();
    },
  );

  test(
    "hands off directly for WebM abort and HTTP 500 without looping",
    { tag: ["@critical", "@e2e", "@portfolio", "@CINEMATIC-E2E-006"] },
    async ({ browser }) => {
      for (const failure of ["abort", "http-500"] as const) {
        const context = await browser.newContext({
          viewport: { width: 390, height: 844 },
        });
        const page = await context.newPage();
        if (failure === "http-500")
          await page.route("**/assets/intro/kurOpenVault.webm", (route) =>
            route.fulfill({
              status: 500,
              contentType: "video/webm",
              body: "failure",
            }),
          );
        const portfolio = new PortfolioPage(page);
        await portfolio.gotoPortfolio();
        if (failure === "abort") await portfolio.startCinematic();
        else await portfolio.activateCinematic();
        if (failure === "abort")
          await portfolio
            .cinematic()
            .locator("video")
            .evaluate((video) => video.dispatchEvent(new Event("abort")));
        await portfolio.expectMainHallFocused(15_000);
        await expect(portfolio.cinematic()).toHaveCount(0);
        await context.close();
      }
    },
  );

  test(
    "keeps controlled cinematic media responsive across six viewports",
    { tag: ["@critical", "@e2e", "@portfolio", "@CINEMATIC-E2E-007"] },
    async ({ browser }) => {
      test.setTimeout(60_000);
      for (const viewport of [
        { width: 320, height: 568 },
        { width: 360, height: 640 },
        { width: 375, height: 667 },
        { width: 390, height: 844 },
        { width: 412, height: 915 },
        { width: 768, height: 1024 },
      ]) {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        const portfolio = new PortfolioPage(page);
        await portfolio.gotoPortfolio();
        await portfolio.startCinematic();
        const video = portfolio.cinematic().locator("video");
        await expect(video).toHaveAttribute(
          "src",
          "/assets/intro/kurOpenVault.webm",
        );
        await expect(video).toHaveAttribute(
          "poster",
          "/assets/intro/kurOpenVault-poster.webp",
        );
        await expect(video).toHaveCSS("object-fit", "cover");
        await expect(
          page.getByRole("button", { name: "Saltar introducción" }),
        ).toBeVisible();
        const [media, poster] = await Promise.all([
          page.request.get("/assets/intro/kurOpenVault.webm"),
          page.request.get("/assets/intro/kurOpenVault-poster.webp"),
        ]);
        expect([
          media.status(),
          media.headers()["content-type"],
          poster.status(),
          poster.headers()["content-type"],
        ]).toEqual([200, "video/webm", 200, "image/webp"]);
        expect(
          await page.evaluate(
            () =>
              document.documentElement.scrollWidth <=
              document.documentElement.clientWidth,
          ),
        ).toBe(true);
        await context.close();
      }
    },
  );

  test(
    "enters the Main Hall with Enter or Space only after the CTA is enabled",
    { tag: ["@critical", "@e2e", "@a11y", "@PORTFOLIO-E2E-010"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const portfolio = new PortfolioPage(page);

      await portfolio.gotoPortfolio();
      await portfolio.expectEnterSpaceOnlyEntersWhenCtaEnabled();
    },
  );

  test(
    "makes the completed CTA the only undimmed next action",
    { tag: ["@critical", "@e2e", "@a11y", "@PORTFOLIO-E2E-019"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const portfolio = new PortfolioPage(page);

      await portfolio.gotoPortfolio();
      await portfolio.unlockAllSealsWithoutEntering();
      await portfolio.expectCompletionEmphasis();
      await page.screenshot({
        fullPage: true,
        path: "test-results/vault-complete-cta-emphasis-desktop.png",
      });

      await page.setViewportSize({ width: 390, height: 844 });
      await portfolio.gotoPortfolio();
      await portfolio.unlockAllSealsWithoutEntering();
      await portfolio.expectCompletionEmphasis();
      await page.screenshot({
        fullPage: true,
        path: "test-results/vault-complete-mobile-cta-clear.png",
      });
    },
  );

  test(
    "unlocks seal hotspots on the vault door and enters the construction hall",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-E2E-009"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const portfolio = new PortfolioPage(page);

      await portfolio.gotoPortfolio();
      await portfolio.openSealInterfaceWithKeyboard();

      await portfolio.expectSealHud(0);
      await page
        .getByRole("button", { name: /Sello 1 — El Ojo.*Bloqueado/ })
        .click();
      await portfolio.expectSealHud(1);
      await portfolio.closeSealModalWithCloseButton("Sello 1 — El Ojo");
      await page
        .getByRole("button", { name: /Sello 2 — La Garra.*Bloqueado/ })
        .click();
      await portfolio.expectSealHud(2);
      await portfolio.closeSealModalWithCloseButton("Sello 2 — La Garra");
      await page
        .getByRole("button", { name: /Sello 3 — La Cerradura.*Bloqueado/ })
        .click();
      await portfolio.expectSealHud(3);
      await portfolio.closeSealModalWithCloseButton("Sello 3 — La Cerradura");
      await page
        .getByRole("button", { name: "Mis obras en construcción" })
        .click();

      await portfolio.expectMainHallFocused();
    },
  );

  test(
    "exposes desktop scroll guidance",
    { tag: ["@critical", "@e2e", "@portfolio", "@PORTFOLIO-E2E-006"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);

      await portfolio.gotoPortfolio();
      await portfolio.expectDesktopScrollGuidance();

      await expect(
        page.getByRole("heading", { name: "¿Qué hay detrás?" }),
      ).toBeVisible();
    },
  );

  test(
    "keeps the reduced-motion unlock path functional",
    { tag: ["@critical", "@e2e", "@a11y", "@PORTFOLIO-E2E-007"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const portfolio = new PortfolioPage(page);

      await portfolio.gotoPortfolio();
      await portfolio.unlockWithKeyboard();

      await portfolio.expectMainHallFocused();
    },
  );

  test(
    "shows visible project cards and flips one card accessibly",
    { tag: ["@critical", "@e2e", "@a11y", "@PORTFOLIO-E2E-008"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const portfolio = new PortfolioPage(page);

      await portfolio.gotoPortfolio();
      await portfolio.unlockWithKeyboard();

      await portfolio.expectVisiblePortfolioComprehensible();
      await portfolio.flipProjectCard("Timer");
      await expect(
        page.getByText(
          "Años después quise retomarla con una visión más simple, enfocada en organizar mis sesiones de estudio y desarrollo.",
        ),
      ).toBeVisible();
    },
  );

  test(
    "opens project history with Back while preserving filters and never replaying the cinematic",
    { tag: ["@high", "@e2e", "@showcase", "@SHOWCASE-E2E-001"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const portfolio = new PortfolioPage(page);
      await portfolio.gotoPortfolio();
      await portfolio.unlockWithKeyboard();
      await page.goto("/?view=showcase&tech=react&project=timer");
      await expect(
        page.getByRole("heading", { level: 1, name: "Kurone-ko Timer" }),
      ).toBeFocused();
      await page
        .getByRole("button", { name: "Volver a la sala principal" })
        .click();
      await expect(page).toHaveURL("/?view=showcase&tech=react");
      expect(
        await page.evaluate(() => window.history.state?.showcaseDetail),
      ).toBeUndefined();
      await page.getByRole("button", { name: /^Filtros/ }).click();
      const restoredReactFilter = page.getByRole("dialog").getByRole("checkbox", { name: "React" });
      await expect(restoredReactFilter).toBeChecked();
      await page.getByRole("button", { name: "Cerrar filtros" }).click();
      await page.goto("/");
      await page.goto("/?view=showcase");

      await page.getByRole("button", { name: /^Filtros/ }).click();
      const react = page.getByRole("dialog").getByRole("checkbox", { name: "React" });
      await react.click();
      await page.getByRole("button", { name: /^APLICAR/ }).click();
      await page.getByRole("button", { name: "Ver historia de Kurone-ko Timer" }).click();
      const timerHistoryDialog = page.getByRole("dialog", { name: "KURONE-KO TIMER" });
      await expect(timerHistoryDialog).toBeVisible();
      await timerHistoryDialog.getByRole("button", { name: "Cerrar información de Kurone-ko Timer" }).click();
      await expect(timerHistoryDialog).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Ver historia de Kurone-ko Timer" })).toBeFocused();
      await page.getByRole("button", { name: /^Filtros/ }).click();
      await expect(page.getByRole("dialog").getByRole("checkbox", { name: "React" })).toBeChecked();

      await page.reload();
      await portfolio.unlockWithKeyboard();
      await expect(portfolio.cinematic()).toHaveCount(0);
    },
  );

  test(
    "audits locked riddle geometry and glow at wide and narrow viewports",
    { tag: ["@critical", "@e2e", "@showcase", "@PROJECT-UNLOCK-E2E-001"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);
      await portfolio.gotoShowcase();

      await page.getByRole("button", { name: /^Filtros/ }).click();
      const filterDialog = page.getByRole("dialog", { name: /UN GRAN PODER CONLLEVA UNA GRAN RESPONSABILIDAD/ });
      await expect(filterDialog).toBeVisible();
      const filterBannerGeometry = await filterDialog.evaluate((dialog) => {
        const inner = dialog.querySelector<HTMLElement>("form");
        const banner = dialog.querySelector<HTMLElement>(".project-filter-title-banner");
        if (inner === null || banner === null) throw new Error("Filter banner geometry probes are unavailable.");
        const innerRect = inner.getBoundingClientRect();
        const bannerRect = banner.getBoundingClientRect();
        return {
          leftGap: bannerRect.left - innerRect.left,
          rightGap: innerRect.right - bannerRect.right,
          widthRatio: bannerRect.width / innerRect.width,
        };
      });
      expect(filterBannerGeometry.leftGap).toBeLessThanOrEqual(1);
      expect(filterBannerGeometry.rightGap).toBeLessThanOrEqual(1);
      expect(filterBannerGeometry.widthRatio).toBeGreaterThan(0.99);
      await page.keyboard.press("Escape");
      await expect(filterDialog).toBeHidden();

      const riddle = await portfolio.openLockedRiddle();
      const wideGeometry = await riddle.evaluate((dialog) => {
        const header = dialog.querySelector<HTMLElement>("header");
        const shell = dialog.querySelector<HTMLElement>(".project-card-modal-shell");
        const banner = dialog.querySelector<HTMLElement>(".project-unlock-riddle-banner");
        const scroll = dialog.querySelector<HTMLElement>(".project-card-modal-scroll");
        const content = dialog.querySelector<HTMLElement>(".project-unlock-riddle-content");
         const kicker = dialog.querySelector<HTMLElement>(".project-card-modal-kicker");
         const title = dialog.querySelector<HTMLElement>("h2");
          const paragraphs = [...dialog.querySelectorAll<HTMLElement>(".project-unlock-riddle-line")];
          const question = dialog.querySelector<HTMLElement>(".project-unlock-riddle-line:first-child");
          const filtros = dialog.querySelector<HTMLElement>(".project-unlock-filter-glow");
          const finalLine = dialog.querySelector<HTMLElement>(".project-unlock-riddle-line:last-child");
          if (header === null || shell === null || banner === null || scroll === null || content === null || kicker === null || title === null || question === null || filtros === null || finalLine === null) {
           throw new Error("Locked riddle geometry probes are unavailable.");
         }
        const dialogRect = dialog.getBoundingClientRect();
        const headerRect = header.getBoundingClientRect();
        const shellRect = shell.getBoundingClientRect();
        const bannerRect = banner.getBoundingClientRect();
        const scrollRect = scroll.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        const center = (rect: DOMRect) => rect.left + rect.width / 2;
        const style = getComputedStyle(filtros);
        return {
          bodyWidthRatio: contentRect.width / scrollRect.width,
          bannerLeftGap: bannerRect.left - shellRect.left,
          bannerRightGap: shellRect.right - bannerRect.right,
          bannerWidthRatio: bannerRect.width / shellRect.width,
          headerCenterDelta: Math.abs(center(headerRect) - center(dialogRect)),
          kickerCenterDelta: Math.abs(center(kicker.getBoundingClientRect()) - center(dialogRect)),
          titleCenterDelta: Math.abs(center(title.getBoundingClientRect()) - center(dialogRect)),
            paragraphCenterDeltas: paragraphs.map((paragraph) => Math.abs(center(paragraph.getBoundingClientRect()) - center(contentRect))),
            questionText: question.textContent,
            questionColor: getComputedStyle(question).color,
            finalLineColor: getComputedStyle(finalLine).color,
           finalLineOpacity: getComputedStyle(finalLine).opacity,
           glowColor: style.color,
           textShadow: style.textShadow,
           filtrosBox: filtros.getBoundingClientRect().toJSON(),
           kickerColor: getComputedStyle(kicker).color,
           overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      });

      expect(wideGeometry.bodyWidthRatio).toBeGreaterThan(0.9);
      expect(wideGeometry.bannerLeftGap).toBeLessThanOrEqual(1);
      expect(wideGeometry.bannerRightGap).toBeLessThanOrEqual(1);
      expect(wideGeometry.bannerWidthRatio).toBeGreaterThan(0.99);
      expect(wideGeometry.headerCenterDelta).toBeLessThanOrEqual(1.5);
      expect(wideGeometry.kickerCenterDelta).toBeLessThanOrEqual(1.5);
      expect(wideGeometry.titleCenterDelta).toBeLessThanOrEqual(1.5);
        expect(wideGeometry.paragraphCenterDeltas.every((delta) => delta <= 1.5)).toBe(true);
        expect(wideGeometry.questionText).toBe("¿Quién dijo esta frase? Descubrirlo debes.");
        expect(wideGeometry.questionColor).toBe("rgb(255, 250, 240)");
        expect(wideGeometry.finalLineColor).toBe(wideGeometry.kickerColor);
       expect(wideGeometry.finalLineOpacity).toBe("1");
       expect(wideGeometry.glowColor).toBe("rgb(255, 250, 240)");
       expect(wideGeometry.glowColor).not.toBe(wideGeometry.finalLineColor);
       expect(wideGeometry.textShadow).not.toBe("none");
      expect(wideGeometry.filtrosBox.width).toBeGreaterThan(0);
      expect(wideGeometry.filtrosBox.height).toBeGreaterThan(0);
      expect(wideGeometry.overflow).toBe(false);

       await page.keyboard.press("Escape");
       await expect(riddle).toHaveCount(0);
        const lockedCard = page.getByRole("article").filter({ hasText: "Proyecto oculto y bloqueado." });
        const expectSharedKeyboardFocus = async () => {
          await expect(page.locator(".project-carousel")).toBeFocused();
          await expect(lockedCard).not.toBeFocused();
          await expect.poll(() => page.evaluate(() => {
            const card = document.querySelector<HTMLElement>('.project-card[data-locked="true"]');
            const activeElement = document.activeElement;
            if (card === null) throw new Error("Locked card focus probe is unavailable.");
            return {
              activeIsCarousel: activeElement?.matches(".project-carousel[data-carousel-focus-target='true']") ?? false,
              cardFocusVisible: card.matches(":focus-visible"),
              cardOutlineStyle: getComputedStyle(card).outlineStyle,
            };
          })).toEqual({ activeIsCarousel: true, cardFocusVisible: false, cardOutlineStyle: "none" });
        };
        await lockedCard.focus();
       await expect(lockedCard).toBeFocused();

       await page.keyboard.press("s");
       const stackStackRiddle = page.getByRole("dialog", { name: "ACERTIJO" });
       const stackStackRiddleHandle = await stackStackRiddle.elementHandle();
       if (stackStackRiddleHandle === null) throw new Error("S shortcut riddle handle is unavailable.");
       await expect(stackStackRiddle).toHaveAttribute("open", "");
       await expect.poll(() => stackStackRiddleHandle.evaluate((element) => (element as HTMLDialogElement).open)).toBe(true);
       await page.keyboard.press("s");
       await expect.poll(() => stackStackRiddleHandle.evaluate((element) => (element as HTMLDialogElement).open)).toBe(false);
        await expect(stackStackRiddle).toHaveCount(0);
        await expectSharedKeyboardFocus();

       await page.keyboard.press("i");
       const infoInfoRiddle = page.getByRole("dialog", { name: "ACERTIJO" });
       const infoInfoRiddleHandle = await infoInfoRiddle.elementHandle();
       if (infoInfoRiddleHandle === null) throw new Error("I shortcut riddle handle is unavailable.");
       await expect(infoInfoRiddle).toHaveAttribute("open", "");
       await expect.poll(() => infoInfoRiddleHandle.evaluate((element) => (element as HTMLDialogElement).open)).toBe(true);
       await page.keyboard.press("i");
       await expect.poll(() => infoInfoRiddleHandle.evaluate((element) => (element as HTMLDialogElement).open)).toBe(false);
        await expect(infoInfoRiddle).toHaveCount(0);
        await expectSharedKeyboardFocus();

       await lockedCard.focus();
       await page.keyboard.press("s");
       const mixedRiddle = page.getByRole("dialog", { name: "ACERTIJO" });
       const mixedRiddleHandle = await mixedRiddle.elementHandle();
       if (mixedRiddleHandle === null) throw new Error("Mixed shortcut riddle handle is unavailable.");
       await expect(mixedRiddle).toHaveAttribute("open", "");
       await expect.poll(() => mixedRiddleHandle.evaluate((element) => (element as HTMLDialogElement).open)).toBe(true);
        await page.keyboard.press("i");
        await expect.poll(() => mixedRiddleHandle.evaluate((element) => (element as HTMLDialogElement).open)).toBe(false);
         await expect(mixedRiddle).toHaveCount(0);
         await expectSharedKeyboardFocus();
        await page.keyboard.press("ArrowRight");
        await expect(page.getByRole("status").filter({ hasText: "Proyecto activo:" })).toContainText("Kurone-ko SII");
       const unlockedTimerCard = page.getByRole("article").filter({ hasText: "Kurone-ko Timer" });
       for (let index = 0; index < 13 && !(await unlockedTimerCard.isVisible().catch(() => false)); index += 1) {
         await page.keyboard.press("ArrowRight");
       }
       await expect(unlockedTimerCard).toBeVisible();
       await unlockedTimerCard.focus();
       await page.keyboard.press("s");
       const unlockedStackDialog = page.getByRole("dialog", { name: "FOCO SIN DISTRACCIONES" });
       await expect(unlockedStackDialog).toHaveAttribute("open", "");
       await page.keyboard.press("s");
       await expect(unlockedStackDialog).toHaveCount(0);
       await expect(page.locator(".project-carousel")).toBeFocused();
       await page.keyboard.press("i");
       const unlockedInfoDialog = page.getByRole("dialog", { name: "KURONE-KO TIMER" });
       await expect(unlockedInfoDialog).toHaveAttribute("open", "");
       await page.keyboard.press("i");
       await expect(unlockedInfoDialog).toHaveCount(0);
       await expect(page.locator(".project-carousel")).toBeFocused();

       await page.setViewportSize({ width: 390, height: 844 });
      const narrowRiddle = await portfolio.openLockedRiddle();
      const narrowGeometry = await narrowRiddle.evaluate((dialog) => {
        const shell = dialog.querySelector<HTMLElement>(".project-card-modal-shell");
        const banner = dialog.querySelector<HTMLElement>(".project-unlock-riddle-banner");
        const content = dialog.querySelector<HTMLElement>(".project-unlock-riddle-content");
        const header = dialog.querySelector<HTMLElement>("header");
        const paragraphs = [...dialog.querySelectorAll<HTMLElement>(".project-unlock-riddle-line")];
        if (shell === null || banner === null || content === null || header === null) throw new Error("Narrow riddle geometry probes are unavailable.");
        const shellRect = shell.getBoundingClientRect();
        const bannerRect = banner.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        const dialogRect = dialog.getBoundingClientRect();
        const center = (rect: DOMRect) => rect.left + rect.width / 2;
        return {
          headerCenterDelta: Math.abs(center(header.getBoundingClientRect()) - center(dialogRect)),
          bannerLeftGap: bannerRect.left - shellRect.left,
          bannerRightGap: shellRect.right - bannerRect.right,
          bannerWidthRatio: bannerRect.width / shellRect.width,
          paragraphCenterDeltas: paragraphs.map((paragraph) => Math.abs(center(paragraph.getBoundingClientRect()) - center(contentRect))),
          paragraphBounds: paragraphs.map((paragraph) => {
            const rect = paragraph.getBoundingClientRect();
            return { left: rect.left, right: rect.right };
          }),
          contentRect: { left: contentRect.left, right: contentRect.right },
          overflow:
            document.documentElement.scrollWidth > document.documentElement.clientWidth ||
            dialog.scrollWidth > dialog.clientWidth,
        };
      });

      expect(narrowGeometry.headerCenterDelta).toBeLessThanOrEqual(1.5);
      expect(narrowGeometry.bannerLeftGap).toBeLessThanOrEqual(1);
      expect(narrowGeometry.bannerRightGap).toBeLessThanOrEqual(1);
      expect(narrowGeometry.bannerWidthRatio).toBeGreaterThan(0.99);
      expect(narrowGeometry.paragraphCenterDeltas.every((delta) => delta <= 1.5)).toBe(true);
      expect(narrowGeometry.paragraphBounds.every(({ left, right }) => left >= narrowGeometry.contentRect.left - 1 && right <= narrowGeometry.contentRect.right + 1)).toBe(true);
      expect(narrowGeometry.overflow).toBe(false);
    },
  );

  test(
    "unlocks with normalized whitespace and preserves centered success keyboard contract",
    { tag: ["@critical", "@e2e", "@a11y", "@PROJECT-UNLOCK-E2E-002"] },
    async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      const portfolio = new PortfolioPage(page);
      await portfolio.gotoShowcase();
      const success = await portfolio.unlockFromFilter("  El   TÍO   Ben");
      const continueButton = success.getByRole("button", { name: "CONTINUAR" });
      const closeButton = success.getByRole("button", { name: "Cerrar confirmación de desbloqueo" });

      await expect(success.getByText("Status: 200 OK | LOGRO ARÁCNIDO DESBLOQUEADO", { exact: true })).toBeVisible();
      await expect(success.getByRole("heading", { name: "PROYECTOS DESBLOQUEADOS" })).toBeVisible();
      await expect(success.getByText("“Hay 10 tipos de personas en el mundo: las que entienden binario... y las que no”", { exact: true })).toBeVisible();
      await expect(success.getByText("Y entre ellos... también existen seres que tienen el gran poder y la enorme responsabilidad de tomar decisiones clave. Encontrar el talento real es un arte, y supongo que por eso no es fácil engañarte.", { exact: true })).toBeVisible();
      await expect(success.getByText("¡Felicidades por desbloquear los proyectos ocultos!", { exact: true })).toBeVisible();

      const straySpacePrevented = await page.evaluate(() => {
        const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: " " });
        window.dispatchEvent(event);
        return event.defaultPrevented;
      });
      expect(straySpacePrevented).toBe(true);

      const wideGeometry = await success.evaluate((dialog) => {
        const header = dialog.querySelector<HTMLElement>("header");
        const kicker = dialog.querySelector<HTMLElement>(".project-unlock-success-kicker");
        const title = dialog.querySelector<HTMLElement>("h2");
         const copy = dialog.querySelector<HTMLElement>(".project-unlock-success-copy");
         const art = dialog.querySelector<HTMLImageElement>("img[alt='Kuroneko disfrazado de superhéroe']");
         const layout = dialog.querySelector<HTMLElement>(".project-unlock-success-layout");
          const divider = dialog.querySelector<HTMLElement>(".project-unlock-success-divider");
          const dividerMark = dialog.querySelector<HTMLElement>(".project-unlock-success-divider-mark");
          const normal = dialog.querySelector<HTMLElement>(".project-unlock-success-normal");
          const emphasis = dialog.querySelector<HTMLElement>(".project-unlock-success-emphasis");
           const quote = dialog.querySelector<HTMLElement>("blockquote.project-unlock-success-quote");
            const actions = dialog.querySelector<HTMLElement>(".project-unlock-success-actions");
             if (header === null || kicker === null || title === null || copy === null || quote === null || art === null || layout === null || divider === null || dividerMark === null || normal === null || emphasis === null || actions === null) {
             throw new Error("Success geometry probes are unavailable.");
           }
           const button = actions.querySelector<HTMLElement>("button");
           if (button === null) throw new Error("Success action button is unavailable.");
        const center = (rect: DOMRect) => rect.left + rect.width / 2;
        const dialogRect = dialog.getBoundingClientRect();
        const headerRect = header.getBoundingClientRect();
        const copyRect = copy.getBoundingClientRect();
         const artRect = art.getBoundingClientRect();
         const dividerRect = divider.getBoundingClientRect();
         const dividerMarkRect = dividerMark.getBoundingClientRect();
         const normalRect = normal.getBoundingClientRect();
         const emphasisRect = emphasis.getBoundingClientRect();
         const actionsRect = actions.getBoundingClientRect();
          const copyStyle = getComputedStyle(copy);
         const headerStyle = getComputedStyle(header);
         const layoutStyle = getComputedStyle(layout);
         const dialogStyle = getComputedStyle(dialog);
        const scroll = dialog.querySelector<HTMLElement>(".project-card-modal-scroll");
        if (scroll === null) throw new Error("Success scroll geometry probe is unavailable.");
        const scrollStyle = getComputedStyle(scroll);
          const paragraphs = [quote, normal, emphasis];
           const quoteStyle = getComputedStyle(quote);
             const quoteRect = quote.getBoundingClientRect();
             const quoteBeforeStyle = getComputedStyle(quote, "::before");
             const quoteAfterStyle = getComputedStyle(quote, "::after");
           const visibleTextRects = (paragraph: HTMLElement) => {
             const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
             const textRects: DOMRect[] = [];
             let textNode = walker.nextNode();
             while (textNode !== null) {
               if (textNode.parentElement?.closest("[aria-hidden='true']") === null) {
                 const range = document.createRange();
                 range.selectNodeContents(textNode);
                 textRects.push(...range.getClientRects());
               }
               textNode = walker.nextNode();
             }
             return textRects;
           };
           const lineCount = (paragraph: HTMLElement) => {
             return new Set(visibleTextRects(paragraph).map((rect) => rect.top)).size;
           };
            const textRects = paragraphs.flatMap((paragraph) => {
              return visibleTextRects(paragraph);
            });
            const quoteTextRects = visibleTextRects(quote);
        return {
           copyRect: { left: copyRect.left, right: copyRect.right },
           dialogRect: { left: dialogRect.left, right: dialogRect.right, width: dialogRect.width },
           dialogInlineSize: Number.parseFloat(dialogStyle.inlineSize),
            dialogMaxInlineSize: Number.parseFloat(dialogStyle.maxInlineSize),
            viewportGutters: { left: dialogRect.left, right: innerWidth - dialogRect.right },
            copyWidth: copyRect.width,
             copyMaxInlineSize: copyStyle.maxInlineSize.replace(/\s+/gu, " ").trim(),
            artColumnRatio: artRect.width / (copyRect.width + artRect.width),
            artWidthRatio: artRect.width / (copyRect.width + artRect.width + Number.parseFloat(layoutStyle.columnGap)),
           artRect: { left: artRect.left, right: artRect.right },
           artWidth: artRect.width,
           artHeight: artRect.height,
           artIntrinsicRatio: art.naturalWidth / art.naturalHeight,
            artRenderedRatio: artRect.width / artRect.height,
            artTopDelta: artRect.top - quote.getBoundingClientRect().top,
            artBottomDelta: artRect.bottom - actionsRect.bottom,
            artRightDelta: Math.abs(artRect.right - layout.getBoundingClientRect().right),
            gridTemplateColumns: layoutStyle.gridTemplateColumns,
             divider: { left: dividerRect.left, width: dividerRect.width, height: dividerRect.height },
             dividerMark: { left: dividerMarkRect.left, width: dividerMarkRect.width, height: dividerMarkRect.height, transform: getComputedStyle(dividerMark).transform },
             normalEmphasisGap: emphasisRect.top - normalRect.bottom,
              dividerEmphasisGap: emphasisRect.top - dividerRect.bottom,
              dividerAriaHidden: divider.getAttribute("aria-hidden"),
             kickerColor: getComputedStyle(kicker).color,
             normalColor: getComputedStyle(normal).color,
             decorativeQuoteMarks: dialog.querySelectorAll(".project-unlock-success-quote-mark").length,
              inlineQuoteMarks: quote.textContent?.match(/[“”]/gu) ?? [],
              copyChildren: [...copy.children].map((child) => child.className),
             layoutChildren: [...layout.children].map((child) => child.className),
            actionInsideCopy: actions.parentElement === copy,
           oldBottomActions: dialog.querySelectorAll(".project-card-modal-actions").length,
           textClipped: textRects.some((rect) => rect.left < copyRect.left - 1 || rect.right > copyRect.right + 1 || rect.top < copyRect.top - 1 || rect.bottom > copyRect.bottom + 1),
          copyTextCenterDeltas: paragraphs.map((paragraph) => Math.abs(center(paragraph.getBoundingClientRect()) - center(copyRect))),
          paragraphClasses: paragraphs.map((paragraph) => paragraph.className),
          paragraphTexts: paragraphs.map((paragraph) => paragraph.textContent),
          paragraphLineCounts: paragraphs.map(lineCount),
           paragraphStyles: paragraphs.map((paragraph) => {
            const style = getComputedStyle(paragraph);
            return {
              fontSize: Number.parseFloat(style.fontSize),
              fontStyle: style.fontStyle,
              fontWeight: Number.parseInt(style.fontWeight, 10),
              textTransform: style.textTransform,
             };
           }),
            quoteFontFamily: quoteStyle.fontFamily,
            quoteFontSize: Number.parseFloat(quoteStyle.fontSize),
            quoteLineHeight: Number.parseFloat(quoteStyle.lineHeight),
            quoteColor: quoteStyle.color,
            quoteFontStyle: quoteStyle.fontStyle,
            quoteMaxInlineSize: quoteStyle.maxInlineSize,
              quoteTextWrap: quoteStyle.getPropertyValue("text-wrap"),
               normalTextWrap: getComputedStyle(paragraphs[1]!).getPropertyValue("text-wrap"),
                 quoteWidth: quoteRect.width,
                 quoteLineWidth: quoteRect.width,
                 quoteHeight: quoteRect.height,
                quoteTransform: quoteStyle.transform,
                quoteRadius: quoteStyle.borderRadius,
                quoteBorderWidths: {
                  bottom: quoteStyle.borderBottomWidth,
                  left: quoteStyle.borderLeftWidth,
                  right: quoteStyle.borderRightWidth,
                  top: quoteStyle.borderTopWidth,
                },
                quoteLineStyles: {
                  after: {
                    backgroundImage: quoteAfterStyle.backgroundImage,
                    bottom: quoteAfterStyle.bottom,
                    content: quoteAfterStyle.content,
                    height: quoteAfterStyle.height,
                    leftBorderWidth: quoteAfterStyle.borderLeftWidth,
                    rightBorderWidth: quoteAfterStyle.borderRightWidth,
                  },
                  before: {
                    backgroundImage: quoteBeforeStyle.backgroundImage,
                    bottom: quoteBeforeStyle.bottom,
                    content: quoteBeforeStyle.content,
                    height: quoteBeforeStyle.height,
                    leftBorderWidth: quoteBeforeStyle.borderLeftWidth,
                    rightBorderWidth: quoteBeforeStyle.borderRightWidth,
                    top: quoteBeforeStyle.top,
                  },
               },
                quoteTextInset: quoteTextRects.every((rect) => rect.top > quoteRect.top + 1 && rect.bottom < quoteRect.bottom - 1),
                 emphasisFontFamily: getComputedStyle(emphasis).fontFamily,
           emphasisWidth: emphasisRect.width,
           headerCenterDelta: Math.abs(center(headerRect) - center(dialogRect)),
          kickerCenterDelta: Math.abs(center(kicker.getBoundingClientRect()) - center(dialogRect)),
          titleCenterDelta: Math.abs(center(title.getBoundingClientRect()) - center(dialogRect)),
          actionCenterDelta: Math.abs(center(button.getBoundingClientRect()) - center(actionsRect)),
          copyTextAlign: copyStyle.textAlign,
          headerTextAlign: headerStyle.textAlign,
          headerPaddingLeft: headerStyle.paddingLeft,
          headerPaddingRight: headerStyle.paddingRight,
          gridGap: Number.parseFloat(layoutStyle.columnGap),
          successScrollPaddingInline: Number.parseFloat(scrollStyle.paddingInlineStart),
          actionJustify: getComputedStyle(actions).justifyContent,
          objectFit: getComputedStyle(art).objectFit,
          paragraphCount: paragraphs.length,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      });

       expect(wideGeometry.copyRect.right).toBeLessThan(wideGeometry.artRect.left);
       expect(wideGeometry.artRect.left).toBeGreaterThan(wideGeometry.copyRect.left);
          expect(wideGeometry.dialogInlineSize).toBeCloseTo(896, 0);
          expect(wideGeometry.dialogMaxInlineSize).toBeCloseTo(896, 0);
        expect(wideGeometry.viewportGutters.left).toBeGreaterThanOrEqual(16);
        expect(wideGeometry.viewportGutters.right).toBeGreaterThanOrEqual(16);
         expect(wideGeometry.copyWidth).toBeGreaterThan(300);
           expect(wideGeometry.copyMaxInlineSize).toBe("min(100%, 672px)");
           expect(wideGeometry.artColumnRatio).toBeCloseTo(0.4, 2);
           expect(wideGeometry.artWidthRatio).toBeGreaterThanOrEqual(0.39);
           expect(wideGeometry.artWidthRatio).toBeLessThanOrEqual(0.4);
          expect(wideGeometry.gridTemplateColumns).toBe("510px 340px");
      expect(wideGeometry.gridGap).toBeLessThanOrEqual(16);
      expect(wideGeometry.successScrollPaddingInline).toBeLessThanOrEqual(16);
      expect(wideGeometry.artRightDelta).toBeLessThanOrEqual(1.5);
       expect(wideGeometry.objectFit).toBe("contain");
        expect(wideGeometry.artWidth).toBeGreaterThanOrEqual(240);
        expect(wideGeometry.artHeight).toBeGreaterThanOrEqual(360);
        expect(wideGeometry.artRenderedRatio).toBeCloseTo(wideGeometry.artIntrinsicRatio, 2);
        expect(Math.abs(wideGeometry.artTopDelta)).toBeLessThanOrEqual(4);
        expect(Math.abs(wideGeometry.artBottomDelta)).toBeLessThanOrEqual(4);
       expect(wideGeometry.dividerAriaHidden).toBe("true");
       expect(wideGeometry.divider.width).toBeGreaterThan(0);
       expect(wideGeometry.divider.height).toBeGreaterThan(0);
       expect(wideGeometry.dividerMark.width).toBeCloseTo(wideGeometry.dividerMark.height, 1);
       expect(wideGeometry.dividerMark.transform).not.toBe("none");
       expect(Math.abs((wideGeometry.divider.left + wideGeometry.divider.width / 2) - ((wideGeometry.copyRect.left + wideGeometry.copyRect.right) / 2))).toBeLessThanOrEqual(1.5);
         expect(wideGeometry.normalEmphasisGap).toBeGreaterThanOrEqual(16);
        expect(wideGeometry.dividerEmphasisGap).toBeGreaterThanOrEqual(20);
        expect(wideGeometry.copyChildren).toEqual([
          "project-unlock-success-quote",
          "project-unlock-success-normal",
           "project-unlock-success-divider",
          "project-unlock-success-emphasis",
        ]);
       expect(wideGeometry.layoutChildren).toEqual([
         "project-unlock-success-copy",
         "project-unlock-success-art",
         "project-unlock-success-actions",
       ]);
      expect(wideGeometry.paragraphTexts).toEqual([
         "“Hay 10 tipos de personas en el mundo: las que entienden binario... y las que no”",
        "Y entre ellos... también existen seres que tienen el gran poder y la enorme responsabilidad de tomar decisiones clave. Encontrar el talento real es un arte, y supongo que por eso no es fácil engañarte.",
        "¡Felicidades por desbloquear los proyectos ocultos!",
      ]);
       expect(wideGeometry.paragraphLineCounts[0]).toBeGreaterThanOrEqual(2);
       expect(wideGeometry.paragraphLineCounts[0]).toBeLessThanOrEqual(5);
       expect(wideGeometry.paragraphLineCounts[1]).toBeGreaterThanOrEqual(3);
        expect(wideGeometry.paragraphLineCounts[1]).toBeLessThanOrEqual(5);
       expect(wideGeometry.paragraphLineCounts[2]).toBeGreaterThanOrEqual(1);
       expect(wideGeometry.paragraphLineCounts[2]).toBeLessThanOrEqual(3);
      expect(wideGeometry.paragraphStyles).toEqual([
        { fontSize: expect.any(Number), fontStyle: "italic", fontWeight: expect.any(Number), textTransform: "none" },
        { fontSize: expect.any(Number), fontStyle: "normal", fontWeight: expect.any(Number), textTransform: "none" },
         { fontSize: expect.any(Number), fontStyle: "italic", fontWeight: expect.any(Number), textTransform: "uppercase" },
      ]);
         expect(wideGeometry.quoteFontSize).toBeGreaterThanOrEqual(16);
         expect(wideGeometry.quoteFontSize).toBeLessThanOrEqual(20);
       const wideNormalStyle = wideGeometry.paragraphStyles[1];
       const wideEmphasisStyle = wideGeometry.paragraphStyles[2];
       if (wideNormalStyle === undefined || wideEmphasisStyle === undefined) throw new Error("Success paragraph styles are unavailable.");
       expect(wideGeometry.quoteFontSize).toBeGreaterThan(wideNormalStyle.fontSize);
       expect(wideGeometry.quoteFontFamily).toContain("Atkinson");
        expect(wideGeometry.quoteFontFamily).not.toContain("Bangers");
          expect(wideGeometry.quoteLineHeight).toBeGreaterThan(20);
          expect(wideGeometry.quoteLineHeight).toBeLessThan(28);
        expect(wideGeometry.quoteColor).toBe("rgb(255, 250, 240)");
        expect(wideGeometry.quoteFontStyle).toBe("italic");
           expect(wideGeometry.quoteMaxInlineSize).toBe("none");
           expect(wideGeometry.quoteWidth).toBeCloseTo(wideGeometry.copyRect.right - wideGeometry.copyRect.left, 0);
           expect(wideGeometry.quoteWidth).toBeGreaterThanOrEqual((wideGeometry.copyRect.right - wideGeometry.copyRect.left) * 0.9);
           expect(wideGeometry.quoteHeight).toBeLessThanOrEqual(8 * 16);
           expect(wideGeometry.quoteWidth / wideGeometry.quoteHeight).toBeGreaterThan(2);
          expect(wideGeometry.quoteTextWrap).toBe("balance");
          expect(wideGeometry.normalTextWrap).toBe("balance");
         expect(wideGeometry.quoteTransform).toBe("none");
       expect(wideEmphasisStyle.fontSize).toBeGreaterThan(wideNormalStyle.fontSize);
          expect(wideEmphasisStyle.fontWeight).toBeLessThanOrEqual(600);
      expect(wideGeometry.headerPaddingLeft).toBe(wideGeometry.headerPaddingRight);
      expect(wideGeometry.headerTextAlign).toBe("center");
      expect(wideGeometry.copyTextAlign).toBe("center");
      expect(wideGeometry.actionJustify).toBe("center");
      expect(wideGeometry.headerCenterDelta).toBeLessThanOrEqual(1.5);
      expect(wideGeometry.kickerCenterDelta).toBeLessThanOrEqual(1.5);
      expect(wideGeometry.titleCenterDelta).toBeLessThanOrEqual(1.5);
       expect(wideGeometry.copyTextCenterDeltas.every((delta) => delta <= 1.5)).toBe(true);
        expect(wideGeometry.actionCenterDelta).toBeLessThanOrEqual(1.5);
         expect(wideGeometry.normalColor).toBe(wideGeometry.kickerColor);
         expect(wideGeometry.decorativeQuoteMarks).toBe(0);
         expect(wideGeometry.inlineQuoteMarks).toEqual(["“", "”"]);
          expect(wideGeometry.quoteBorderWidths).toEqual({ bottom: "0px", left: "0px", right: "0px", top: "0px" });
          expect(wideGeometry.quoteRadius).toBe("0px");
          expect(wideGeometry.quoteLineStyles.before).toEqual(expect.objectContaining({
            backgroundImage: expect.stringContaining("linear-gradient"),
            content: '""',
            height: "1px",
            leftBorderWidth: "0px",
            rightBorderWidth: "0px",
            top: "0px",
          }));
         expect(wideGeometry.quoteLineStyles.after).toEqual(expect.objectContaining({
            backgroundImage: expect.stringContaining("linear-gradient"),
            bottom: "0px",
            content: '""',
            height: "1px",
            leftBorderWidth: "0px",
            rightBorderWidth: "0px",
         }));
          expect(wideGeometry.quoteLineStyles.before.backgroundImage).toContain("rgba(0, 0, 0, 0)");
          expect(wideGeometry.quoteLineStyles.after.backgroundImage).toContain("rgba(0, 0, 0, 0)");
          expect(wideGeometry.quoteLineStyles.before.backgroundImage).toContain("0.74");
          expect(wideGeometry.quoteLineStyles.after.backgroundImage).toContain("0.74");
          expect(wideGeometry.quoteWidth).toBeGreaterThanOrEqual(wideGeometry.copyWidth * 0.9);
          expect(Math.abs(wideGeometry.quoteLineWidth - wideGeometry.emphasisWidth)).toBeLessThanOrEqual(1);
          expect(wideGeometry.quoteTextInset).toBe(true);
         expect(wideGeometry.emphasisFontFamily).toContain("Atkinson");
        expect(wideGeometry.emphasisFontFamily).not.toContain("Bangers");
         expect(wideEmphasisStyle.fontStyle).toBe("italic");
        expect(wideGeometry.actionInsideCopy).toBe(false);
       expect(wideGeometry.oldBottomActions).toBe(0);
       expect(wideGeometry.textClipped).toBe(false);
       expect(wideGeometry.overflow).toBe(false);

      await expect(continueButton).toBeFocused();
      for (const [key, expected] of [["ArrowLeft", closeButton], ["ArrowUp", continueButton], ["ArrowRight", closeButton], ["ArrowDown", continueButton]] as const) {
        await page.keyboard.press(key);
        await expect(expected).toBeFocused();
      }
      await page.keyboard.press("Tab");
      await expect(closeButton).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(continueButton).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(closeButton).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(continueButton).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(success).toHaveCount(0);
       await expect(page.locator(".project-carousel[data-carousel-focus-target='true']")).toBeFocused();
       await expect(page.getByRole("article", { name: "Software Engineering Playbook" })).not.toBeFocused();
       await expect.poll(() => page.evaluate(() => {
         const card = document.querySelector<HTMLElement>('.project-card[data-project-id="software-engineering-playbook"]');
         return card?.matches(":focus-visible") ?? false;
       })).toBe(false);
       await page.keyboard.press("ArrowRight");
       await expect(page.getByRole("status").filter({ hasText: "Proyecto activo:" })).toContainText("Kurone-ko Timer");
       await page.keyboard.press("ArrowLeft");
       await expect(page.getByRole("status").filter({ hasText: "Proyecto activo:" })).toContainText("Software Engineering Playbook");

       await page.reload({ waitUntil: "domcontentloaded" });
       await expect(page).toHaveURL(/\/$/);
       await expect(page.getByRole("heading", { name: "¿Qué hay detrás?" })).toBeVisible();
       await expect(page.getByRole("region", { name: "Sala principal de proyectos" })).toHaveCount(0);
       await expect(page.getByRole("button", { name: /^Filtros/ })).toHaveCount(0);
       await expect.poll(() => page.evaluate(() => sessionStorage.getItem("kuroneko:session-progression:v1"))).toBeNull();
       await portfolio.enterShowcaseFromCurrentPage();
      const lockedRiddle = await portfolio.openLockedRiddle();
      await expect(lockedRiddle).toBeVisible();
      await page.keyboard.press("Escape");
       await page.setViewportSize({ width: 375, height: 667 });
       const narrowSuccess = await portfolio.unlockFromFilter("narrador");
       const narrowSuccessGeometry = await narrowSuccess.evaluate((dialog) => {
         const layout = dialog.querySelector<HTMLElement>(".project-unlock-success-layout");
         const copy = dialog.querySelector<HTMLElement>(".project-unlock-success-copy");
           const art = dialog.querySelector<HTMLElement>(".project-unlock-success-art");
             if (layout === null || copy === null || art === null) throw new Error("Narrow success geometry probes are unavailable.");
           const quote = copy.querySelector<HTMLElement>("blockquote.project-unlock-success-quote");
            const actions = layout.querySelector<HTMLElement>(".project-unlock-success-actions");
              if (quote === null || actions === null) throw new Error("Narrow success action probes are unavailable.");
            const copyRect = copy.getBoundingClientRect();
            const artRect = art.getBoundingClientRect();
            const quoteRect = quote.getBoundingClientRect();
            const quoteStyle = getComputedStyle(quote);
            const quoteBeforeStyle = getComputedStyle(quote, "::before");
            const quoteAfterStyle = getComputedStyle(quote, "::after");
            const scroll = dialog.querySelector<HTMLElement>(".project-card-modal-scroll");
            if (scroll === null) throw new Error("Narrow success scroll geometry probe is unavailable.");
            const dialogRect = dialog.getBoundingClientRect();
            const quoteTextRects = (() => {
              const walker = document.createTreeWalker(quote, NodeFilter.SHOW_TEXT);
              const textRects: DOMRect[] = [];
              let textNode = walker.nextNode();
              while (textNode !== null) {
                const range = document.createRange();
                range.selectNodeContents(textNode);
                textRects.push(...range.getClientRects());
                textNode = walker.nextNode();
              }
              return textRects;
            })();
           const measureFlow = () => {
             const currentArtRect = art.getBoundingClientRect();
             const currentActionRect = actions.getBoundingClientRect();
             return {
               action: { bottom: currentActionRect.bottom, top: currentActionRect.top },
               art: { bottom: currentArtRect.bottom, left: currentArtRect.left, right: currentArtRect.right, top: currentArtRect.top, width: currentArtRect.width },
               overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth || dialog.scrollWidth > dialog.clientWidth,
               scrollTop: scroll.scrollTop,
             };
           };
           scroll.scrollTop = 0;
           const topFlow = measureFlow();
           scroll.scrollTop = scroll.scrollHeight;
           const bottomFlow = measureFlow();
           return {
          columns: getComputedStyle(layout).gridTemplateColumns.trim().split(/\s+/u).length,
           copyBottom: copyRect.bottom,
           artTop: artRect.top,
           artBottom: artRect.bottom,
           actionTop: actions.getBoundingClientRect().top,
           artWidth: artRect.width,
            layoutWidth: layout.getBoundingClientRect().width,
            dialogInner: {
              left: dialogRect.left + dialog.clientLeft,
              right: dialogRect.left + dialog.clientLeft + dialog.clientWidth,
              width: dialog.clientWidth,
            },
            topFlow,
            bottomFlow,
           artRenderedRatio: artRect.width / artRect.height,
           artIntrinsicRatio: art instanceof HTMLImageElement ? art.naturalWidth / art.naturalHeight : 0,
           copyChildren: [...copy.children].map((child) => child.className),
             layoutChildren: [...layout.children].map((child) => child.className),
              quoteSemantic: quote.tagName,
              quoteWidth: quoteRect.width,
              copyWidth: copyRect.width,
              quoteRadius: quoteStyle.borderRadius,
              quoteBorderWidths: {
                bottom: quoteStyle.borderBottomWidth,
                left: quoteStyle.borderLeftWidth,
                right: quoteStyle.borderRightWidth,
                top: quoteStyle.borderTopWidth,
              },
              quoteLineStyles: {
                after: {
                  backgroundImage: quoteAfterStyle.backgroundImage,
                  bottom: quoteAfterStyle.bottom,
                  content: quoteAfterStyle.content,
                  height: quoteAfterStyle.height,
                  leftBorderWidth: quoteAfterStyle.borderLeftWidth,
                  rightBorderWidth: quoteAfterStyle.borderRightWidth,
                },
                before: {
                  backgroundImage: quoteBeforeStyle.backgroundImage,
                  bottom: quoteBeforeStyle.bottom,
                  content: quoteBeforeStyle.content,
                  height: quoteBeforeStyle.height,
                  leftBorderWidth: quoteBeforeStyle.borderLeftWidth,
                  rightBorderWidth: quoteBeforeStyle.borderRightWidth,
                  top: quoteBeforeStyle.top,
                },
              },
              quoteTextInset: quoteTextRects.every((rect) => rect.top > quoteRect.top + 1 && rect.bottom < quoteRect.bottom - 1),
              decorativeQuoteMarks: dialog.querySelectorAll(".project-unlock-success-quote-mark").length,
             inlineQuoteMarks: quote.textContent?.match(/[“”]/gu) ?? [],
             quoteText: quote.textContent,
           actionInsideCopy: actions.parentElement === copy,
           overflow:
            document.documentElement.scrollWidth > document.documentElement.clientWidth ||
            dialog.scrollWidth > dialog.clientWidth,
        };
      });
       expect(narrowSuccessGeometry.columns).toBe(1);
       expect(narrowSuccessGeometry.copyBottom).toBeLessThanOrEqual(narrowSuccessGeometry.artTop);
       expect(narrowSuccessGeometry.topFlow.art.bottom).toBeLessThanOrEqual(narrowSuccessGeometry.topFlow.action.top);
       expect(narrowSuccessGeometry.artWidth).toBeCloseTo(narrowSuccessGeometry.layoutWidth, 0);
       expect(narrowSuccessGeometry.artRenderedRatio).toBeCloseTo(narrowSuccessGeometry.artIntrinsicRatio, 2);
       for (const flow of [narrowSuccessGeometry.topFlow, narrowSuccessGeometry.bottomFlow]) {
         expect(flow.art.left).toBeCloseTo(narrowSuccessGeometry.dialogInner.left, 0);
         expect(flow.art.right).toBeCloseTo(narrowSuccessGeometry.dialogInner.right, 0);
         expect(flow.art.width).toBeCloseTo(narrowSuccessGeometry.dialogInner.width, 0);
         expect(flow.art.bottom).toBeLessThanOrEqual(flow.action.top);
         expect(flow.overflow).toBe(false);
       }
       expect(narrowSuccessGeometry.topFlow.scrollTop).toBe(0);
       expect(narrowSuccessGeometry.bottomFlow.scrollTop).toBeGreaterThan(0);
        expect(narrowSuccessGeometry.copyChildren).toEqual([
          "project-unlock-success-quote",
          "project-unlock-success-normal",
           "project-unlock-success-divider",
          "project-unlock-success-emphasis",
        ]);
       expect(narrowSuccessGeometry.layoutChildren).toEqual([
         "project-unlock-success-copy",
         "project-unlock-success-art",
         "project-unlock-success-actions",
       ]);
       expect(narrowSuccessGeometry.quoteSemantic).toBe("BLOCKQUOTE");
        expect(narrowSuccessGeometry.quoteText).toBe("“Hay 10 tipos de personas en el mundo: las que entienden binario... y las que no”");
         expect(narrowSuccessGeometry.inlineQuoteMarks).toEqual(["“", "”"]);
         expect(narrowSuccessGeometry.decorativeQuoteMarks).toBe(0);
         expect(narrowSuccessGeometry.quoteBorderWidths).toEqual({ bottom: "0px", left: "0px", right: "0px", top: "0px" });
         expect(narrowSuccessGeometry.quoteRadius).toBe("0px");
         expect(narrowSuccessGeometry.quoteLineStyles.before).toEqual(expect.objectContaining({
           backgroundImage: expect.stringContaining("linear-gradient"),
           content: '""',
           height: "1px",
            leftBorderWidth: "0px",
            rightBorderWidth: "0px",
           top: "0px",
         }));
         expect(narrowSuccessGeometry.quoteLineStyles.after).toEqual(expect.objectContaining({
           backgroundImage: expect.stringContaining("linear-gradient"),
           bottom: "0px",
           content: '""',
           height: "1px",
            leftBorderWidth: "0px",
            rightBorderWidth: "0px",
         }));
          expect(narrowSuccessGeometry.quoteLineStyles.before.backgroundImage).toContain("rgba(0, 0, 0, 0)");
          expect(narrowSuccessGeometry.quoteLineStyles.after.backgroundImage).toContain("rgba(0, 0, 0, 0)");
          expect(narrowSuccessGeometry.quoteLineStyles.before.backgroundImage).toContain("0.74");
          expect(narrowSuccessGeometry.quoteLineStyles.after.backgroundImage).toContain("0.74");
        expect(narrowSuccessGeometry.quoteWidth).toBeCloseTo(narrowSuccessGeometry.copyWidth, 0);
         expect(narrowSuccessGeometry.quoteTextInset).toBe(true);
        expect(narrowSuccessGeometry.actionInsideCopy).toBe(false);
       expect(narrowSuccessGeometry.overflow).toBe(false);
       const narrowContinueButton = narrowSuccess.getByRole("button", { name: "CONTINUAR" });
       const narrowCloseButton = narrowSuccess.getByRole("button", { name: "Cerrar confirmación de desbloqueo" });
       await expect(narrowContinueButton).toBeFocused();
       await page.keyboard.press("Tab");
       await expect(narrowCloseButton).toBeFocused();
       await page.keyboard.press("Tab");
       await expect(narrowContinueButton).toBeFocused();
    },
  );

  test(
    "closes unlock success through X and CONTINUAR without leaving a trap",
    { tag: ["@critical", "@e2e", "@a11y", "@PROJECT-UNLOCK-E2E-003"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);
      await portfolio.gotoShowcase();
      let success = await portfolio.unlockFromFilter("narrador");
      await success.getByRole("button", { name: "Cerrar confirmación de desbloqueo" }).click();
      await expect(success).toHaveCount(0);
       await expect(page.locator(".project-carousel[data-carousel-focus-target='true']")).toBeFocused();
       await expect(page.getByRole("article", { name: "Software Engineering Playbook" })).not.toBeFocused();
       await expect.poll(() => page.evaluate(() => {
         const card = document.querySelector<HTMLElement>('.project-card[data-project-id="software-engineering-playbook"]');
         return card?.matches(":focus-visible") ?? false;
       })).toBe(false);
       await page.keyboard.press("ArrowRight");
       await expect(page.getByRole("status").filter({ hasText: "Proyecto activo:" })).toContainText("Kurone-ko Timer");
       await page.keyboard.press("ArrowLeft");
       await expect(page.getByRole("status").filter({ hasText: "Proyecto activo:" })).toContainText("Software Engineering Playbook");

       await page.reload({ waitUntil: "domcontentloaded" });
       await expect(page).toHaveURL(/\/$/);
       await expect(page.getByRole("heading", { name: "¿Qué hay detrás?" })).toBeVisible();
       await expect(page.getByRole("region", { name: "Sala principal de proyectos" })).toHaveCount(0);
       await expect(page.getByRole("button", { name: /^Filtros/ })).toHaveCount(0);
       await expect.poll(() => page.evaluate(() => sessionStorage.getItem("kuroneko:session-progression:v1"))).toBeNull();
       await portfolio.enterShowcaseFromCurrentPage();
       success = await portfolio.unlockFromFilter("narrador");
        await success.getByRole("button", { name: "CONTINUAR" }).press("Space");
       await expect(success).toHaveCount(0);
       await expect(page.locator(".project-carousel[data-carousel-focus-target='true']")).toBeFocused();
       await expect(page.getByRole("article", { name: "Software Engineering Playbook" })).not.toBeFocused();
       await expect.poll(() => page.evaluate(() => {
         const card = document.querySelector<HTMLElement>('.project-card[data-project-id="software-engineering-playbook"]');
         return card?.matches(":focus-visible") ?? false;
       })).toBe(false);
       await page.keyboard.press("ArrowRight");
       await expect(page.getByRole("status").filter({ hasText: "Proyecto activo:" })).toContainText("Kurone-ko Timer");
       await page.keyboard.press("ArrowLeft");
       await expect(page.getByRole("status").filter({ hasText: "Proyecto activo:" })).toContainText("Software Engineering Playbook");
     },
   );

  test(
    "keeps wrong-correct and repeated alias unlocks interactive for keyboard and pointer project access",
    { tag: ["@critical", "@e2e", "@a11y", "@PROJECT-UNLOCK-REGRESSION-E2E-005"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);
      await portfolio.gotoShowcase();

      const filterButton = page.getByRole("button", { name: /^Filtros/ });
      await filterButton.click();
      const filterDialog = page.getByRole("dialog", { name: /UN GRAN PODER CONLLEVA UNA GRAN RESPONSABILIDAD/ });
      const searchbox = filterDialog.getByRole("searchbox", { name: "Buscar tecnología" });
      for (const nearMiss of ["narradorffffffff", "benny", "arbitrary text"]) {
        await searchbox.fill(nearMiss);
        await expect(page.getByRole("dialog", { name: "PROYECTOS DESBLOQUEADOS" })).toHaveCount(0);
        await searchbox.fill("");
      }
      await searchbox.fill(" Ben ");

      const success = page.getByRole("dialog", { name: "PROYECTOS DESBLOQUEADOS" });
      await expect(success).toBeVisible();
       await page.getByRole("button", { name: "CONTINUAR" }).click();
       await expect(success).toHaveCount(0);
       await expect(page.locator(".project-carousel[data-carousel-focus-target='true']")).toBeFocused();

       await filterButton.click();
       const repeatedFilterDialog = page.getByRole("dialog", { name: /UN GRAN PODER CONLLEVA UNA GRAN RESPONSABILIDAD/ });
       await repeatedFilterDialog.getByRole("searchbox", { name: "Buscar tecnología" }).pressSequentially("el tío ben", { delay: 2 });
       await expect(repeatedFilterDialog).toHaveCount(0);
       await expect(page.locator("#project-filter-query")).toHaveValue("");
       await expect(page.getByRole("dialog", { name: "PROYECTOS DESBLOQUEADOS" })).toHaveCount(0);

       const lifecycleState = await page.evaluate(() => {
        const surface = document.querySelector<HTMLElement>(".project-showcase-interaction-surface");
        return {
          bodyOverflow: getComputedStyle(document.body).overflow,
          bodyOverflowX: getComputedStyle(document.body).overflowX,
          bodyOverflowY: getComputedStyle(document.body).overflowY,
          dialogCount: document.querySelectorAll("dialog[open]").length,
          surfaceAriaHidden: surface?.getAttribute("aria-hidden") ?? null,
          surfaceInert: surface?.hasAttribute("inert") ?? false,
        };
      });
      expect(lifecycleState.bodyOverflow).toBe("auto");
      expect(lifecycleState.bodyOverflowX).not.toBe("hidden");
      expect(lifecycleState.bodyOverflowY).not.toBe("hidden");
      expect(lifecycleState.dialogCount).toBe(0);
      expect(lifecycleState.surfaceAriaHidden).toBeNull();
      expect(lifecycleState.surfaceInert).toBe(false);

      const project = page.getByRole("article", { name: "Kurone-ko POS" });
      for (let index = 0; index < 13 && !(await project.isVisible().catch(() => false)); index += 1) {
        await page.getByRole("button", { name: "Proyecto siguiente" }).click();
      }
      await expect(project).toBeVisible();
      await project.getByRole("button", { name: /Ver stack de/ }).click();
      const stackDialog = page.getByRole("dialog", { name: "VENDER SIN PERDER EL RASTRO" });
      await expect(stackDialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(stackDialog).toHaveCount(0);

      await project.focus();
      await page.keyboard.press("i");
      const infoDialog = page.getByRole("dialog", { name: "KURONE-KO POS" });
      await expect(infoDialog).toBeVisible();
      await infoDialog.getByRole("button", { name: /Cerrar información de/ }).click();
      await expect(infoDialog).toHaveCount(0);
      await expect(page.locator(".project-carousel[data-carousel-focus-target='true']")).toBeFocused();
    },
  );

  test(
    "logs the friendly unlock clue once when showcase starts",
    { tag: ["@critical", "@e2e", "@showcase", "@PROJECT-UNLOCK-E2E-004"] },
    async ({ page }) => {
      const messages: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "info") messages.push(message.text());
      });
      const portfolio = new PortfolioPage(page);
      await portfolio.gotoPortfolio();
      await expect(page.getByRole("button", { name: /^Filtros/ })).toHaveCount(0);
      expect(messages.filter((message) => message === PROJECT_UNLOCK_FRIENDLY_CONSOLE_MESSAGE)).toHaveLength(0);

      await portfolio.enterShowcaseFromCurrentPage();
      await expect.poll(() => messages.filter((message) => message === PROJECT_UNLOCK_FRIENDLY_CONSOLE_MESSAGE)).toHaveLength(1);
      await page.getByRole("button", { name: "Proyecto siguiente" }).click();
      await page.getByRole("button", { name: /^Filtros/ }).click();
      await page.getByRole("searchbox", { name: "Buscar tecnología" }).pressSequentially("narrador", { delay: 8 });
      await expect(page.getByRole("dialog", { name: "PROYECTOS DESBLOQUEADOS" })).toBeVisible();
      await page.getByRole("button", { name: "CONTINUAR" }).click();
      await expect.poll(() => messages.filter((message) => message === PROJECT_UNLOCK_FRIENDLY_CONSOLE_MESSAGE)).toHaveLength(1);
    },
  );

  test(
    "opens Project 9, Project 10, Project 11, Project 12, and Project 13 Stack and Info only after unlock without responsive overflow",
    { tag: ["@critical", "@e2e", "@showcase", "@PROJECT-UNLOCK-E2E-005"] },
    async ({ browser }) => {
      test.setTimeout(120_000);
      await mkdir("artifacts/project9-modals", { recursive: true });
      await mkdir("artifacts/project10-modals", { recursive: true });
      await mkdir("artifacts/project11-modals", { recursive: true });
      await mkdir("artifacts/project12-modals", { recursive: true });
      await mkdir("artifacts/project13-modals", { recursive: true });
      await mkdir("artifacts/project-unlock-focus", { recursive: true });

      for (const viewport of [
        { height: 800, label: "1280x800", width: 1280 },
        { height: 667, label: "375x667", width: 375 },
      ]) {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();

        try {
           const portfolio = new PortfolioPage(page);
           await portfolio.gotoShowcase();
           for (let index = 0; index < 8; index += 1) {
             await page.getByRole("button", { name: "Proyecto siguiente" }).click();
           }
           for (const [index, modalCase] of PROJECT_UNLOCK_MODAL_CASES.entries()) {
             const card = page.getByRole("article", { name: modalCase.projectName });
             await expect(card).toBeVisible();
              await expectLockedProjectActions(page, card, modalCase);
              if (index < PROJECT_UNLOCK_MODAL_CASES.length - 1) {
                const nextModalCase = PROJECT_UNLOCK_MODAL_CASES[index + 1];
                if (nextModalCase === undefined) throw new Error("Next project modal case is unavailable.");
                await page.getByRole("button", { name: "Proyecto siguiente" }).click();
                await expect(page.getByRole("status").filter({ hasText: `Proyecto activo: ${nextModalCase.projectName}` })).toBeVisible();
              }
           }

            for (let index = 1; index < PROJECT_UNLOCK_MODAL_CASES.length; index += 1) {
              await page.getByRole("button", { name: "Proyecto anterior" }).click();
            }
           await expect(page.getByRole("status").filter({ hasText: "Proyecto activo: Kurone-ko POS" })).toBeVisible();

           const posCard = page.getByRole("article", { name: "Kurone-ko POS" });
           await page.evaluate(() => window.scrollTo(0, 120));
           const scrollYBeforeClose = await page.evaluate(() => window.scrollY);
           const success = await portfolio.unlockFromFilter("narrador");
           await success.getByRole("button", { name: "CONTINUAR" }).click();
           await expect(success).toHaveCount(0);
           await expect(posCard).toHaveAttribute("data-locked", "false");
           await expect(page.locator(".project-carousel[data-carousel-focus-target='true']")).toBeFocused();
           await expect(posCard).not.toBeFocused();
           await expect.poll(() => page.evaluate(() => {
             const card = document.querySelector<HTMLElement>('.project-card[data-project-id="kuroneko-pos"]');
             return card?.matches(":focus-visible") ?? false;
           })).toBe(false);
           await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollYBeforeClose);
           await page.screenshot({ path: `artifacts/project-unlock-focus/${viewport.label}-continue.png`, fullPage: true, scale: "css" });
           for (const [index, modalCase] of PROJECT_UNLOCK_MODAL_CASES.entries()) {
             await expect(page.getByRole("status").filter({ hasText: `Proyecto activo: ${modalCase.projectName}` })).toBeVisible();
             await expectUnlockedProjectModals(
               page,
               modalCase,
               viewport.label,
               `artifacts/project${index + 9}-modals`,
             );
             if (index < PROJECT_UNLOCK_MODAL_CASES.length - 1) {
               await page.getByRole("button", { name: "Proyecto siguiente" }).click();
             }
           }
         } finally {
          await context.close();
        }
      }
    },
  );

  test(
    "keeps project one seal assets outside the visible ornament and title bands",
    { tag: ["@critical", "@e2e", "@showcase", "@SHOWCASE-E2E-002"] },
    async ({ browser }) => {
      test.setTimeout(120_000);
      const viewports = [
        { deviceScaleFactor: 1, height: 568, label: "320x568", width: 320 },
        { deviceScaleFactor: 1, height: 667, label: "375x667", width: 375 },
        {
          deviceScaleFactor: 1.25,
          height: 667,
          label: "375x667-125",
          width: 375,
        },
        { deviceScaleFactor: 1, height: 844, label: "390x844", width: 390 },
        { deviceScaleFactor: 1, height: 1194, label: "834x1194", width: 834 },
        { deviceScaleFactor: 1, height: 1366, label: "1024x1366", width: 1024 },
        { deviceScaleFactor: 1, height: 800, label: "1280x800", width: 1280 },
        { deviceScaleFactor: 1, height: 768, label: "1366x768", width: 1366 },
        { deviceScaleFactor: 1, height: 1080, label: "1920x1080", width: 1920 },
      ];

      for (const viewport of viewports) {
        const context = await browser.newContext({
          deviceScaleFactor: viewport.deviceScaleFactor,
          viewport: { height: viewport.height, width: viewport.width },
        });
        const page = await context.newPage();

        try {
           await new PortfolioPage(page).seedValidProgression();
           await page.goto("/?view=showcase");
          if (viewport.label === "375x667-125")
            await page.evaluate(() => {
              document.body.style.zoom = "125%";
            });
          const card = page
            .locator(
              '.project-card[data-card-presentation="media-title-bands"]',
            )
            .filter({
              has: page.getByRole("heading", {
                name: "Software Engineering Playbook",
              }),
            });
          await expect(card).toBeVisible({ timeout: 30_000 });
          await expect
            .poll(
              async () =>
                (await readProjectOneVisualMetrics(page)).seals.length,
            )
            .toBe(2);
          const assertPaintSafe = (
            metrics: ProjectOneVisualMetrics,
            assertStableGeometry = false,
          ) => {
            expect(metrics.ornaments).not.toBeNull();
            expect(metrics.title.fontSize).toBeGreaterThan(
              metrics.subtitle.fontSize,
            );
            for (const seal of metrics.seals) {
              expect(seal.paintSafety).toBeGreaterThan(0);
              expect(seal.hit.width).toBeGreaterThanOrEqual(44);
              expect(seal.hit.height).toBeGreaterThanOrEqual(44);
              expect(seal.paintSafe.left).toBeGreaterThanOrEqual(-1);
              expect(seal.paintSafe.right).toBeLessThanOrEqual(
                viewport.width + 1,
              );
              expect(seal.paintSafe.top).toBeGreaterThanOrEqual(-1);
              expect(seal.paintSafe.bottom).toBeLessThanOrEqual(
                viewport.height + 1,
              );
              expect(
                metrics.bands.every(
                  (band) => !overlaps(seal.paintSafe, band, 1),
                ),
              ).toBe(true);
              if (metrics.ornaments !== null)
                expect(overlaps(seal.paintSafe, metrics.ornaments, 1)).toBe(
                  false,
                );
              expect(
                metrics.bands.every(
                  (band) => !overlaps(seal.visualPaint, band, 1),
                ),
              ).toBe(true);
              if (metrics.ornaments !== null)
                expect(overlaps(seal.visualPaint, metrics.ornaments, 1)).toBe(
                  false,
                );
              expect(seal.visual.width).toBeGreaterThan(0);
              expect(seal.visual.height).toBeGreaterThan(0);
              if (assertStableGeometry) {
                const expectedVisualSize = Math.min(
                  Math.max(
                    44 * metrics.bodyZoom,
                    Math.min(
                      metrics.card.width * 0.2,
                      metrics.card.height * 0.12,
                    ),
                  ),
                  104 * metrics.bodyZoom,
                );
                expect(
                  Math.abs(seal.visual.width - expectedVisualSize),
                ).toBeLessThan(1.5);
                const expectedCenter =
                  seal === metrics.seals[0]
                    ? metrics.card.left +
                      metrics.card.width * 0.12 -
                      metrics.lateralOffset
                    : metrics.card.left +
                      metrics.card.width * 0.88 +
                      metrics.lateralOffset;
                expect(
                  Math.abs(
                    seal.visual.left + seal.visual.width / 2 - expectedCenter,
                  ),
                ).toBeLessThan(1.5);
                const sealTrackHeight = metrics.card.height * 0.088;
                const sealRowOffset = metrics.card.height * 0.022;
                const expectedSealTop =
                  metrics.card.top -
                  sealRowOffset +
                  Math.max(0, (sealTrackHeight - seal.hit.height) / 2);
                expect(
                  Math.abs(
                    seal.visual.top +
                      seal.visual.height / 2 -
                      (expectedSealTop + seal.hit.height / 2),
                  ),
                ).toBeLessThan(1.5);
              }
            }
          };

          assertPaintSafe(await readProjectOneVisualMetrics(page), true);
          for (const seal of await page
            .locator(
              ".project-showcase-item[data-active='true'] .project-card-seal[data-paint-safe='true']",
            )
            .all()) {
            await seal.hover();
            assertPaintSafe(await readProjectOneVisualMetrics(page));
            await seal.focus();
            assertPaintSafe(await readProjectOneVisualMetrics(page));
          }

          const bodyZoom = await page.evaluate(
            () => getComputedStyle(document.body).zoom,
          );
          expect(bodyZoom).toBe(
            viewport.label === "375x667-125" ? "1.25" : "1",
          );
          await page.screenshot({
            path: `artifacts/project-one-seals-after-${viewport.label}.png`,
            scale: "css",
          });
        } finally {
          await context.close();
        }
      }
    },
  );

  test(
    "keeps showcase controls and technology tiles fluid across viewport classes",
    { tag: ["@critical", "@e2e", "@showcase", "@SHOWCASE-E2E-004"] },
    async ({ browser }) => {
      test.setTimeout(180_000);
      const viewports = [
        { height: 568, width: 320 },
        { height: 640, width: 360 },
        { height: 844, width: 390 },
        { height: 1194, width: 834 },
        { height: 1366, width: 1024 },
        { height: 800, width: 1280 },
        { height: 768, width: 1366 },
        { height: 1080, width: 1920 },
      ];
      const technologyLabels = [
        "Google ML Kit",
        "Jetpack Compose",
        "Tailwind CSS",
      ];

      for (const viewport of viewports) {
        const context = await browser.newContext({
          hasTouch: viewport.width <= 1024,
          viewport,
        });
        const page = await context.newPage();

        try {
          await page.emulateMedia({ reducedMotion: "reduce" });
           await new PortfolioPage(page).seedValidProgression();
           await page.goto("/?view=showcase");
          const showcase = page.locator(".project-showcase");
          const card = page
            .locator(
              '.project-card[data-card-presentation="media-title-bands"]',
            )
            .filter({
              has: page.getByRole("heading", {
                name: "Software Engineering Playbook",
              }),
            });
          const previous = page.getByRole("button", {
            name: "Proyecto anterior",
          });
          const next = page.getByRole("button", { name: "Proyecto siguiente" });

          await expect(showcase).toBeVisible();
          await expect(card).toBeVisible();
          await expect(previous).toBeVisible();
          await expect(next).toBeVisible();

          const controls = await page.evaluate(() => {
            const getRect = (element: Element) => {
              const rect = element.getBoundingClientRect();
              return {
                bottom: rect.bottom,
                height: rect.height,
                left: rect.left,
                right: rect.right,
                top: rect.top,
                width: rect.width,
              };
            };
            const previousButton = document.querySelector<HTMLElement>(
              '.project-carousel-navigation button[aria-label="Proyecto anterior"]',
            );
            const nextButton = document.querySelector<HTMLElement>(
              '.project-carousel-navigation button[aria-label="Proyecto siguiente"]',
            );
            const previousImage =
              previousButton?.querySelector<HTMLImageElement>("img") ?? null;
            const nextImage =
              nextButton?.querySelector<HTMLImageElement>("img") ?? null;
            const counterElement = document.querySelector<HTMLElement>(
              ".project-carousel-navigation p",
            );
            const activeCard = document.querySelector<HTMLElement>(
              '.project-showcase-item[data-active="true"] .project-card',
            );
            const identity = document.querySelector<HTMLElement>(
              ".project-showcase-identity span",
            );
            if (
              previousButton === null ||
              nextButton === null ||
              previousImage === null ||
              nextImage === null ||
              counterElement === null ||
              activeCard === null ||
              identity === null
            ) {
              throw new Error(
                "Showcase responsive contract probes are unavailable.",
              );
            }
            const counterStyle = getComputedStyle(counterElement);
            const identityStyle = getComputedStyle(identity);
            return {
              activeCard: getRect(activeCard),
              counter: {
                clipped:
                  counterElement.scrollWidth > counterElement.clientWidth + 1,
                fontSize: Number.parseFloat(counterStyle.fontSize),
                rect: getRect(counterElement),
              },
              images: [getRect(previousImage), getRect(nextImage)],
              identity: {
                clipped: identity.scrollWidth > identity.clientWidth + 1,
                fontSize: Number.parseFloat(identityStyle.fontSize),
                rect: getRect(identity),
              },
              overflow:
                document.documentElement.scrollWidth <=
                document.documentElement.clientWidth,
              buttons: [getRect(previousButton), getRect(nextButton)],
            };
          });
          const cardRatio =
            controls.activeCard.width / controls.activeCard.height;
          expect(Math.abs(cardRatio - 941 / 1672)).toBeLessThan(0.002);
          expect(
            controls.buttons.every(
              ({ width, height }) => width >= 44 && height >= 44,
            ),
          ).toBe(true);
          expect(
            controls.images.every(
              ({ width, height }) => width >= 36 && height >= 36,
            ),
          ).toBe(true);
          expect(controls.counter.fontSize).toBeGreaterThanOrEqual(16);
          expect(controls.counter.clipped).toBe(false);
          expect(controls.counter.rect.width).toBeGreaterThan(0);
          expect(controls.counter.rect.height).toBeGreaterThan(0);
          expect(controls.identity.fontSize).toBeGreaterThanOrEqual(14);
          expect(controls.identity.clipped).toBe(false);
          expect(controls.identity.rect.width).toBeGreaterThan(0);
          expect(controls.identity.rect.height).toBeGreaterThan(0);
          expect(controls.overflow).toBe(true);
          expect(controls.activeCard.left).toBeGreaterThanOrEqual(-0.5);
          expect(controls.activeCard.right).toBeLessThanOrEqual(
            viewport.width + 0.5,
          );
          expect(controls.activeCard.top).toBeGreaterThanOrEqual(-0.5);
          expect(controls.activeCard.bottom).toBeLessThanOrEqual(
            viewport.height + 0.5,
          );

          const visualMetrics = await readProjectOneVisualMetrics(page);
          for (const seal of visualMetrics.seals) {
            expect(seal.hit.width).toBeGreaterThanOrEqual(44);
            expect(seal.hit.height).toBeGreaterThanOrEqual(44);
            expect(seal.visual.width).toBeGreaterThan(0);
            expect(seal.visual.height).toBeGreaterThan(0);
          }

          await page.getByRole("button", { name: "Filtros" }).click();
          await expect(page.getByRole("dialog")).toBeVisible();
          const option = page.locator(".project-filter-option");
          const initialOptions = await option.evaluateAll((elements) =>
            elements.map((element) => {
              const rect = element.getBoundingClientRect();
              return { height: rect.height, width: rect.width };
            }),
          );
          expect(initialOptions.length).toBeGreaterThan(0);
          const optionWidths = initialOptions.map(({ width }) => width);
          const optionHeights = new Set(
            initialOptions.map(({ height }) => height),
          );
          expect(
            Math.max(...optionWidths) - Math.min(...optionWidths),
          ).toBeLessThan(0.1);
          expect(optionHeights.size).toBe(1);

          const targetGeometry = await option
            .filter({ hasText: "Google ML Kit" })
            .first()
            .evaluate((element) => {
              const label = element.querySelector("span");
              if (label === null)
                throw new Error("Technology label probe is unavailable.");
              const rect = element.getBoundingClientRect();
              const labelStyle = getComputedStyle(label);
              return {
                height: rect.height,
                label: {
                  clipped:
                    label.scrollWidth > label.clientWidth + 1 ||
                    label.scrollHeight > label.clientHeight + 1,
                  textOverflow: labelStyle.textOverflow,
                  whiteSpace: labelStyle.whiteSpace,
                },
                width: rect.width,
              };
            });

          expect(targetGeometry.label.clipped).toBe(false);
          expect(targetGeometry.label.textOverflow).not.toBe("ellipsis");
          expect(targetGeometry.label.whiteSpace).not.toBe("nowrap");

          for (const label of technologyLabels) {
            const technologyOption = option.filter({ hasText: label }).first();
            await expect(technologyOption).toBeVisible();
            const labelMetrics = await technologyOption
              .locator("span")
              .evaluate((element) => {
                const style = getComputedStyle(element);
                const labelRect = element.getBoundingClientRect();
                const tileRect = element.parentElement?.getBoundingClientRect();
                if (tileRect === undefined)
                  throw new Error("Technology tile geometry is unavailable.");
                return {
                  clipped:
                    element.scrollWidth > element.clientWidth + 1 ||
                    element.scrollHeight > element.clientHeight + 1,
                  spanRect: {
                    height: labelRect.height,
                    width: labelRect.width,
                  },
                  textOverflow: style.textOverflow,
                  tileRect: { height: tileRect.height, width: tileRect.width },
                  whiteSpace: style.whiteSpace,
                  scroll: {
                    clientHeight: element.clientHeight,
                    clientWidth: element.clientWidth,
                    scrollHeight: element.scrollHeight,
                    scrollWidth: element.scrollWidth,
                  },
                };
              });
            expect(labelMetrics.clipped).toBe(false);
            expect(labelMetrics.textOverflow).toBe("clip");
            expect(labelMetrics.whiteSpace).toBe("normal");
            if (viewport.width === 1024 && viewport.height === 1366) {
              expect(labelMetrics.spanRect.height).toBeLessThanOrEqual(
                labelMetrics.tileRect.height,
              );
              expect(labelMetrics.scroll.scrollWidth).toBeLessThanOrEqual(
                labelMetrics.scroll.clientWidth + 1,
              );
              expect(labelMetrics.scroll.scrollHeight).toBeLessThanOrEqual(
                labelMetrics.scroll.clientHeight + 1,
              );
            }
          }

          await page
            .getByRole("searchbox", { name: "Buscar tecnología" })
            .fill("Google ML Kit");
          await expect(option).toHaveCount(1);
          const filteredGeometry = await option.first().evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return { height: rect.height, width: rect.width };
          });
          expect(filteredGeometry.width).toBeCloseTo(targetGeometry.width, 1);
          expect(filteredGeometry.height).toBeCloseTo(targetGeometry.height, 1);
        } finally {
          await context.close();
        }
      }
    },
  );

  test(
    "keeps the centered music player out of the showcase budget and preserves readable card bands",
    { tag: ["@critical", "@e2e", "@showcase", "@SHOWCASE-E2E-004"] },
    async ({ browser }) => {
      test.setTimeout(180_000);
      const viewports = [
        { height: 667, label: "375x667", width: 375, minimize: true },
        { height: 844, label: "390x844", width: 390, minimize: false },
        { height: 896, label: "414x896", width: 414, minimize: false },
        { height: 1180, label: "820x1180", width: 820, minimize: false },
        { height: 600, label: "1024x600", width: 1024, minimize: true },
        { height: 800, label: "1280x800", width: 1280, minimize: false },
        { height: 768, label: "1366x768", width: 1366, minimize: false },
        { height: 1080, label: "1920x1080", width: 1920, minimize: true },
      ];

      const readShowcaseGeometry = async (
        page: import("@playwright/test").Page,
      ) =>
        page.evaluate(() => {
          const getRect = (element: Element | null): RectSnapshot | null => {
            if (element === null) return null;
            const rect = element.getBoundingClientRect();
            return {
              bottom: rect.bottom,
              height: rect.height,
              left: rect.left,
              right: rect.right,
              top: rect.top,
              width: rect.width,
            };
          };
          const card = document.querySelector<HTMLElement>(
            '.project-showcase-item[data-active="true"] .project-card[data-card-presentation="media-title-bands"]',
          );
          const title =
            card === null
              ? null
              : card.querySelector<HTMLElement>(
                  ".project-card-title .fitted-band-text-content",
                );
          const subtitle =
            card === null
              ? null
              : card.querySelector<HTMLElement>(
                  ".project-card-subtitle .fitted-band-text-content",
                );
          const topBand =
            card === null
              ? null
              : card.querySelector<HTMLElement>('[data-card-band="top"]');
          const bottomBand =
            card === null
              ? null
              : card.querySelector<HTMLElement>('[data-card-band="bottom"]');
          const player = document.querySelector<HTMLElement>(
            ".bug-cesante-player",
          );
          const filter = document.querySelector<HTMLElement>(
            ".project-filter-open",
          );
          const navigation = document.querySelector<HTMLElement>(
            ".project-carousel-navigation",
          );
          const identity = document.querySelector<HTMLElement>(
            ".project-showcase-identity",
          );
          if (
            card === null ||
            title === null ||
            subtitle === null ||
            topBand === null ||
            bottomBand === null ||
            filter === null ||
            navigation === null ||
            identity === null
          ) {
            throw new Error("Showcase music geometry probes are unavailable.");
          }
          const cardRect = getRect(card)!;
          const titleRect = getRect(title)!;
          const subtitleRect = getRect(subtitle)!;
          const topBandRect = getRect(topBand)!;
          const bottomBandRect = getRect(bottomBand)!;
          const filterRect = getRect(filter)!;
          const navigationRect = getRect(navigation)!;
          const identityRect = getRect(identity)!;
          const playerRect = getRect(player);
          const sealRects = [
            ...card.querySelectorAll<HTMLButtonElement>(
              ".project-card-seal[data-paint-safe='true']",
            ),
          ].map((seal) => getRect(seal)!);
          const clipped = (element: HTMLElement) =>
            element.scrollWidth > element.clientWidth + 1 ||
            element.scrollHeight > element.clientHeight + 1;
          const intersects = (
            left: RectSnapshot | null,
            right: RectSnapshot | null,
          ) =>
            left !== null &&
            right !== null &&
            left.left < right.right &&
            left.right > right.left &&
            left.top < right.bottom &&
            left.bottom > right.top;
          return {
            card: cardRect,
            cardTitle:
              card.querySelector<HTMLElement>(".project-card-title")
                ?.textContent ?? "",
            clipped: { subtitle: clipped(subtitle), title: clipped(title) },
            identity: identityRect,
            navigation: navigationRect,
            player: playerRect,
            filter: filterRect,
            bands: { bottom: bottomBandRect, top: topBandRect },
            subtitle: {
              fontSize: Number.parseFloat(getComputedStyle(subtitle).fontSize),
              rect: subtitleRect,
            },
            subtitleText:
              card.querySelector<HTMLElement>(".project-card-subtitle")
                ?.textContent ?? "",
            seals: sealRects,
            showcasePaddingTop: Number.parseFloat(
              getComputedStyle(
                document.querySelector<HTMLElement>(".project-showcase")!,
              ).paddingBlockStart,
            ),
            title: {
              fontSize: Number.parseFloat(getComputedStyle(title).fontSize),
              rect: titleRect,
            },
            overflow:
              document.documentElement.scrollWidth >
              document.documentElement.clientWidth,
            playerCenterDelta:
              playerRect === null
                ? null
                : playerRect.left +
                  playerRect.width / 2 -
                  window.innerWidth / 2,
            intersections: {
              identityCard: intersects(identityRect, cardRect),
              navigationCard: intersects(navigationRect, cardRect),
              navigationPlayer: intersects(navigationRect, playerRect),
              navigationSeals: sealRects.map((seal) =>
                intersects(navigationRect, seal),
              ),
              playerCard: intersects(playerRect, cardRect),
              playerFilter: intersects(playerRect, filterRect),
            },
          };
        });

      const expectShowcaseCard = async (
        page: import("@playwright/test").Page,
      ) => {
        await expect(
          page
            .locator(
              '.project-card[data-card-presentation="media-title-bands"]',
            )
            .first(),
        ).toBeVisible({ timeout: 30_000 });
      };

      const activateMusic = async (page: import("@playwright/test").Page) => {
        await page.getByRole("button", { name: "Filtros" }).click();
        await page.getByRole("checkbox", { name: "Vacío" }).check();
        await page.getByRole("button", { name: /APLICAR/ }).click();
        await expect(page.locator(".bug-cesante-player")).toBeVisible();
        await page.getByRole("button", { name: /LIMPIAR FILTROS/ }).click();
        await expectShowcaseCard(page);
      };

      const overlapsRect = (left: RectSnapshot, right: RectSnapshot) =>
        overlaps(left, right, 0.5);

      for (const viewport of viewports) {
        const context = await browser.newContext({
          hasTouch: viewport.width <= 1024,
          viewport: { height: viewport.height, width: viewport.width },
        });
        const page = await context.newPage();

        try {
          await page.emulateMedia({ reducedMotion: "reduce" });
          await page.addInitScript(() =>
            sessionStorage.setItem("kurone-ko:vault-cinematic-seen:v1", "1"),
          );
           await new PortfolioPage(page).seedValidProgression();
           await page.goto("/?view=showcase");
          await expectShowcaseCard(page);
          const baseline = [375, 1280, 1920].includes(viewport.width)
            ? await readShowcaseGeometry(page)
            : null;
          await activateMusic(page);

          const assertGeometry = (
            geometry: Awaited<ReturnType<typeof readShowcaseGeometry>>,
            state: "expanded" | "minimized",
          ) => {
            const card = geometry.card;
            expect(
              Math.abs(card.width / card.height - 941 / 1672),
            ).toBeLessThan(0.002);
            expect(card.left).toBeGreaterThanOrEqual(-0.5);
            expect(card.right).toBeLessThanOrEqual(viewport.width + 0.5);
            expect(card.top).toBeGreaterThanOrEqual(-0.5);
            expect(card.bottom).toBeLessThanOrEqual(viewport.height + 0.5);
            expect(geometry.showcasePaddingTop).toBeLessThanOrEqual(24);
            expect(geometry.filter.top).toBeLessThanOrEqual(24);
            expect(geometry.player).not.toBeNull();
            expect(
              geometry.player!.left + geometry.player!.width / 2,
            ).toBeCloseTo(viewport.width / 2, 0);
            expect(overlapsRect(geometry.player!, geometry.filter)).toBe(false);
            expect(overlapsRect(geometry.player!, card)).toBe(false);
            expect(overlapsRect(geometry.navigation, card)).toBe(false);
            expect(overlapsRect(geometry.identity, card)).toBe(false);
            expect(geometry.identity.top).toBeGreaterThanOrEqual(
              card.bottom - 0.5,
            );
            expect(geometry.clipped.title).toBe(false);
            expect(geometry.clipped.subtitle).toBe(false);
            expect(geometry.title.rect.top).toBeGreaterThanOrEqual(
              geometry.bands.top.top - 1,
            );
            expect(geometry.title.rect.bottom).toBeLessThanOrEqual(
              geometry.bands.top.bottom + 1,
            );
            expect(geometry.subtitle.rect.top).toBeGreaterThanOrEqual(
              geometry.bands.bottom.top - 1,
            );
            expect(geometry.subtitle.rect.bottom).toBeLessThanOrEqual(
              geometry.bands.bottom.bottom + 1,
            );
            expect(
              geometry.title.fontSize / geometry.bands.top.height,
            ).toBeGreaterThanOrEqual(0.42);
            expect(
              geometry.subtitle.fontSize / geometry.bands.bottom.height,
            ).toBeGreaterThanOrEqual(0.34);
            expect(
              geometry.seals.every(
                (seal) => seal.width >= 44 && seal.height >= 44,
              ),
            ).toBe(true);
            expect(
              geometry.seals.every(
                (seal) =>
                  !overlapsRect(seal, geometry.bands.top) &&
                  !overlapsRect(seal, geometry.bands.bottom),
              ),
            ).toBe(true);
            expect(geometry.overflow).toBe(false);
            if (viewport.width === 1024)
              expect(card.width).toBeGreaterThanOrEqual(190);
            if (viewport.width === 1920 && state === "expanded")
              expect(card.width).toBeGreaterThanOrEqual(390);
          };

          const expanded = await readShowcaseGeometry(page);
          assertGeometry(expanded, "expanded");
          const projectLabels: Array<{ card: string; subtitle: string }> = [];
          const projectCount = Math.min(
            7,
            await page.locator(".project-showcase-item").count(),
          );
          for (
            let projectIndex = 0;
            projectIndex < projectCount;
            projectIndex += 1
          ) {
            const projectGeometry = await readShowcaseGeometry(page);
            assertGeometry(projectGeometry, "expanded");
            projectLabels.push({
              card: projectGeometry.cardTitle.trim(),
              subtitle: projectGeometry.subtitleText.trim(),
            });
            if (projectIndex < projectCount - 1) {
              await page
                .getByRole("button", { name: "Proyecto siguiente" })
                .click();
              await page.waitForTimeout(80);
            }
          }
          expect(projectLabels.length).toBeGreaterThanOrEqual(7);
          console.log(
            JSON.stringify({
              baseline,
              geometry: expanded,
              labels: projectLabels,
              state: "expanded",
              viewport: viewport.label,
            }),
          );

          {
            const screenshotCard = page.locator(
              '.project-showcase-item[data-active="true"] .project-card[data-card-presentation="media-title-bands"]',
            );
            await page.screenshot({
              path: `${ROLLBACK_AFTER_ARTIFACTS}/showcase/${viewport.label}-expanded.png`,
              fullPage: true,
              scale: "css",
            });
            await screenshotCard.locator('[data-card-band="top"]').screenshot({
              path: `${ROLLBACK_AFTER_ARTIFACTS}/showcase/${viewport.label}-title-band.png`,
              scale: "css",
            });
            await screenshotCard
              .locator('[data-card-band="bottom"]')
              .screenshot({
                path: `${ROLLBACK_AFTER_ARTIFACTS}/showcase/${viewport.label}-subtitle-band.png`,
                scale: "css",
              });
          }

          if (viewport.minimize) {
            await page
              .getByRole("button", { name: "Minimizar reproductor" })
              .click();
            await expect(
              page.locator('.bug-cesante-player[data-minimized="true"]'),
            ).toBeVisible();
            await page.waitForTimeout(80);
            const minimized = await readShowcaseGeometry(page);
            assertGeometry(minimized, "minimized");
            console.log(
              JSON.stringify({
                geometry: minimized,
                state: "minimized",
                viewport: viewport.label,
              }),
            );
            await page.screenshot({
              path: `${ROLLBACK_AFTER_ARTIFACTS}/showcase/${viewport.label}-minimized.png`,
              fullPage: true,
              scale: "css",
            });
          }
        } finally {
          await context.close();
        }
      }
    },
  );

  test(
    "does not flash fitted band titles during startup, navigation, player transitions, or resize",
    { tag: ["@critical", "@e2e", "@showcase", "@SHOWCASE-E2E-009"] },
    async ({ page }) => {
      test.setTimeout(120_000);
      await page.addInitScript(() => {
        sessionStorage.setItem("kurone-ko:vault-cinematic-seen:v1", "1");
        const samples: NonNullable<Window["__fittedBandTitleTimeline"]> = [];
        const startedAt = performance.now();
        const sample = () => {
          const card = document.querySelector<HTMLElement>(
            '.project-showcase-item[data-active="true"] .project-card[data-card-presentation="media-title-bands"]',
          );
          const title =
            card?.querySelector<HTMLElement>(
              ".project-card-title .fitted-band-text-content",
            ) ?? null;
          if (card !== null && title !== null) {
            samples.push({
              card:
                card
                  .querySelector<HTMLElement>(".project-card-title")
                  ?.textContent?.trim() ?? "",
              fontSize: Number.parseFloat(getComputedStyle(title).fontSize),
              height: title.offsetHeight,
              opacity: getComputedStyle(title).opacity,
              time: performance.now() - startedAt,
              width: title.offsetWidth,
            });
          }
        };
        const tick = () => {
          sample();
          if (performance.now() - startedAt < 2_500) {
            requestAnimationFrame(tick);
          }
        };
        Object.assign(window, { __fittedBandTitleTimeline: samples });
        requestAnimationFrame(tick);
      });

      const card = page.locator(
        '.project-showcase-item[data-active="true"] .project-card[data-card-presentation="media-title-bands"]',
      );
      const next = page.getByRole("button", { name: "Proyecto siguiente" });
      const previous = page.getByRole("button", { name: "Proyecto anterior" });

      const captureTimeline = async (duration = 700) =>
        page.evaluate(async (captureDuration) => {
          const samples: NonNullable<Window["__fittedBandTitleTimeline"]> = [];
          const startedAt = performance.now();
          return await new Promise<typeof samples>((resolve) => {
            const tick = () => {
              const activeCard = document.querySelector<HTMLElement>(
                '.project-showcase-item[data-active="true"] .project-card[data-card-presentation="media-title-bands"]',
              );
              const title =
                activeCard?.querySelector<HTMLElement>(
                  ".project-card-title .fitted-band-text-content",
                ) ?? null;
              if (activeCard !== null && title !== null) {
                samples.push({
                  card:
                    activeCard
                      .querySelector<HTMLElement>(".project-card-title")
                      ?.textContent?.trim() ?? "",
                  fontSize: Number.parseFloat(getComputedStyle(title).fontSize),
                  height: title.offsetHeight,
                  opacity: getComputedStyle(title).opacity,
                  time: performance.now() - startedAt,
                  width: title.offsetWidth,
                });
              }
              if (performance.now() - startedAt >= captureDuration)
                resolve(samples);
              else requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
        }, duration);

      const assertStable = (
        samples: Awaited<ReturnType<typeof captureTimeline>>,
        label: string,
        minimumVisibleSamples = 3,
      ) => {
        expect(
          samples.length,
          `${label}: no title samples captured`,
        ).toBeGreaterThanOrEqual(3);
        const visibleSamples = samples.filter(
          ({ opacity, fontSize, width, height }) =>
            opacity !== "0" && fontSize > 0 && width > 0 && height > 0,
        );
        expect(
          visibleSamples.length,
          `${label}: title was not visibly fitted`,
        ).toBeGreaterThanOrEqual(minimumVisibleSamples);
        for (const cardName of new Set(
          visibleSamples.map(({ card: title }) => title),
        )) {
          const cardSamples = visibleSamples.filter(
            ({ card: title }) => title === cardName,
          );
          const fontSizes = cardSamples.map(({ fontSize }) => fontSize);
          const widths = cardSamples.map(({ width }) => width);
          const heights = cardSamples.map(({ height }) => height);
          expect(
            Math.max(...fontSizes) - Math.min(...fontSizes),
            `${label}: ${cardName} font-size changed`,
          ).toBeLessThan(0.05);
          expect(
            Math.max(...widths) - Math.min(...widths),
            `${label}: ${cardName} width changed`,
          ).toBeLessThan(0.5);
          expect(
            Math.max(...heights) - Math.min(...heights),
            `${label}: ${cardName} height changed`,
          ).toBeLessThan(0.5);
        }
      };

       await new PortfolioPage(page).seedValidProgression();
       await page.goto("/?view=showcase");
      await expect(card).toBeVisible({ timeout: 30_000 });
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(card).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(800);
      const startupTimeline = await page.evaluate(
        () => window.__fittedBandTitleTimeline ?? [],
      );
      assertStable(startupTimeline, "hard reload", 1);

      assertStable(
        await (async () => {
          const timeline = captureTimeline();
          await next.click();
          return timeline;
        })(),
        "forward navigation",
      );
      assertStable(
        await (async () => {
          const timeline = captureTimeline();
          await previous.click();
          return timeline;
        })(),
        "back navigation",
      );

      const rapidTimeline = captureTimeline(1_000);
      for (let index = 0; index < 10; index += 1) await next.click();
      assertStable(await rapidTimeline, "rapid navigation");

      await page.getByRole("button", { name: "Filtros" }).click();
      await page.getByRole("checkbox", { name: "Vacío" }).check();
      await page.getByRole("button", { name: /APLICAR/ }).click();
      await expect(page.locator(".bug-cesante-player")).toBeVisible();
      await page.getByRole("button", { name: /LIMPIAR FILTROS/ }).click();
      await expect(card).toBeVisible({ timeout: 30_000 });

      assertStable(
        await (async () => {
          const timeline = captureTimeline();
          await page
            .getByRole("button", { name: "Minimizar reproductor" })
            .click();
          return timeline;
        })(),
        "player minimize",
      );
      assertStable(
        await (async () => {
          const timeline = captureTimeline();
          await page
            .getByRole("button", { name: "Restaurar reproductor" })
            .click();
          return timeline;
        })(),
        "player restore",
      );

      const resizeTimeline = captureTimeline(1_200);
      await page.setViewportSize({ width: 1024, height: 600 });
      await page.setViewportSize({ width: 1280, height: 800 });
      const resized = await resizeTimeline;
      expect(resized.length).toBeGreaterThan(5);
      expect(
        resized.every(
          ({ fontSize, width, height }) =>
            fontSize > 0 && width > 0 && height > 0,
        ),
      ).toBe(true);
    },
  );

  test(
    "keeps the full-viewport filter dialog reachable and keyboard accessible",
    { tag: ["@critical", "@e2e", "@showcase", "@SHOWCASE-E2E-006"] },
    async ({ browser }) => {
      test.setTimeout(240_000);
      const viewports = [
        { height: 667, label: "375x667", width: 375 },
        { height: 720, label: "540x720", width: 540 },
        { height: 1180, label: "820x1180", width: 820 },
        { height: 1280, label: "853x1280", width: 853 },
        { height: 600, label: "1024x600", width: 1024 },
        { height: 800, label: "1280x800", width: 1280 },
        { height: 768, label: "1366x768", width: 1366 },
        { height: 1080, label: "1920x1080", width: 1920 },
      ];

      for (const viewport of viewports) {
        const context = await browser.newContext({
          hasTouch: viewport.width <= 1024,
          viewport,
        });
        const page = await context.newPage();

        try {
          await page.emulateMedia({ reducedMotion: "reduce" });
           await new PortfolioPage(page).seedValidProgression();
           await page.goto("/?view=showcase");
          await expectShowcaseCardReady(page);
          const filterButton = page.getByRole("button", { name: "Filtros" });
          await filterButton.click();
          const dialog = page.getByRole("dialog");
          await expect(dialog).toBeVisible();
          await expect(
            page.getByRole("searchbox", { name: "Buscar tecnología" }),
          ).toBeFocused();

          const metrics = async () =>
            page.evaluate(() => {
              const getRect = (element: Element) => {
                const rect = element.getBoundingClientRect();
                return {
                  bottom: rect.bottom,
                  height: rect.height,
                  left: rect.left,
                  right: rect.right,
                  top: rect.top,
                  width: rect.width,
                };
              };
              const modal = document.querySelector<HTMLDialogElement>(
                ".project-filter-dialog",
              );
              const banner =
                modal?.querySelector<HTMLElement>(
                  ".project-filter-title-banner",
                ) ?? null;
              const bannerImage =
                banner?.querySelector<HTMLImageElement>("img") ?? null;
              const body =
                modal?.querySelector<HTMLElement>(
                  ".project-filter-dialog-body",
                ) ?? null;
              const options =
                modal?.querySelector<HTMLElement>(".project-filter-options") ??
                null;
              const actions =
                modal?.querySelector<HTMLElement>(
                  ".project-filter-dialog-actions",
                ) ?? null;
              const dismiss =
                modal?.querySelector<HTMLElement>(".project-filter-dismiss") ??
                null;
              const heading =
                modal?.querySelector<HTMLElement>("h2#project-filter-title") ??
                null;
              const copy =
                modal?.querySelector<HTMLElement>(
                  ".project-filter-query-console",
                ) ?? null;
              const searchLabel =
                modal?.querySelector<HTMLElement>(
                  ".project-filter-search label",
                ) ?? null;
              const searchInput =
                modal?.querySelector<HTMLElement>(
                  ".project-filter-search input",
                ) ?? null;
              const optionItems = [
                ...(modal?.querySelectorAll<HTMLElement>(
                  ".project-filter-option",
                ) ?? []),
              ];
              if (
                modal === undefined ||
                modal === null ||
                banner === null ||
                bannerImage === null ||
                body === null ||
                options === null ||
                actions === null ||
                dismiss === null ||
                heading === null ||
                copy === null ||
                searchLabel === null ||
                searchInput === null
              ) {
                throw new Error(
                  "Filter dialog geometry probes are unavailable.",
                );
              }
              const optionRects = optionItems.map(getRect);
              const rows = [
                ...new Set(optionRects.map((rect) => rect.top.toFixed(2))),
              ];
              const columns = [
                ...new Set(optionRects.map((rect) => rect.left.toFixed(2))),
              ];
              const intersects = (
                left: ReturnType<typeof getRect>,
                right: ReturnType<typeof getRect>,
              ) =>
                left.left < right.right &&
                left.right > right.left &&
                left.top < right.bottom &&
                left.bottom > right.top;
              const modalRect = getRect(modal);
              const bannerRect = getRect(banner);
              const bannerImageRect = getRect(bannerImage);
              const closeRect = getRect(dismiss);
              const criticalRegions = {
                actions: getRect(actions),
                banner: bannerRect,
                body: getRect(body),
                options: getRect(options),
              };
              const closeIntersections = Object.fromEntries(
                Object.entries(criticalRegions).map(([name, rect]) => [
                  name,
                  intersects(closeRect, rect),
                ]),
              );
              const textTargets: Array<[string, Element | null]> = [
                ["heading", heading],
                ["copy", copy],
                ["searchLabel", searchLabel],
                ["searchInput", searchInput],
                ["optionLabel", optionItems[0]?.querySelector("span") ?? null],
                ["action", actions.querySelector("button")],
              ];
              const textMetrics = Object.fromEntries(
                textTargets
                  .filter(
                    (entry): entry is [string, Element] => entry[1] !== null,
                  )
                  .map(([name, element]) => {
                    const style = getComputedStyle(element);
                    return [
                      name,
                      {
                        fontSize: style.fontSize,
                        lineHeight: style.lineHeight,
                        rect: getRect(element),
                      },
                    ];
                  }),
              );
              const documentOverflow = {
                horizontal:
                  document.documentElement.scrollWidth >
                    document.documentElement.clientWidth + 1 ||
                  document.body.scrollWidth > document.body.clientWidth + 1,
                vertical:
                  document.documentElement.scrollHeight >
                    document.documentElement.clientHeight + 1 ||
                  document.body.scrollHeight > document.body.clientHeight + 1,
              };
              return {
                actions: getRect(actions),
                actionsVisible:
                  actions.getBoundingClientRect().bottom <=
                  modal.getBoundingClientRect().bottom + 1,
                actionsReachable: [
                  ...actions.querySelectorAll<HTMLButtonElement>("button"),
                ].every((button) => {
                  const rect = button.getBoundingClientRect();
                  return (
                    rect.width > 0 &&
                    rect.height >= 44 &&
                    rect.top >= modalRect.top &&
                    rect.bottom <= modalRect.bottom + 1
                  );
                }),
                banner: {
                  backgroundColor: getComputedStyle(banner).backgroundColor,
                  backgroundSize: getComputedStyle(banner).backgroundSize,
                  coverage: {
                    height: bannerImageRect.height / bannerRect.height,
                    width: bannerImageRect.width / bannerRect.width,
                  },
                  gutters: {
                    bottom: bannerRect.bottom - bannerImageRect.bottom,
                    left: bannerImageRect.left - bannerRect.left,
                    right: bannerRect.right - bannerImageRect.right,
                    top: bannerImageRect.top - bannerRect.top,
                  },
                  imageObjectFit: getComputedStyle(bannerImage).objectFit,
                  imageObjectPosition:
                    getComputedStyle(bannerImage).objectPosition,
                  imageRect: bannerImageRect,
                  rect: bannerRect,
                },
                body: {
                  clientHeight: body.clientHeight,
                  clientWidth: body.clientWidth,
                  overflow: getComputedStyle(body).overflow,
                  rect: getRect(body),
                  scrollHeight: body.scrollHeight,
                  scrollWidth: body.scrollWidth,
                },
                close: { intersections: closeIntersections, rect: closeRect },
                document: {
                  bodyHeight: document.body.scrollHeight,
                  bodyWidth: document.body.scrollWidth,
                  clientHeight: document.documentElement.clientHeight,
                  clientWidth: document.documentElement.clientWidth,
                  ...documentOverflow,
                },
                modal: {
                  overflow: getComputedStyle(modal).overflow,
                  rect: getRect(modal),
                },
                options: {
                  clientHeight: options.clientHeight,
                  clientWidth: options.clientWidth,
                  columns: columns.length,
                  itemCount: optionItems.length,
                  maxWidth: Math.max(...optionRects.map((rect) => rect.width)),
                  minWidth: Math.min(...optionRects.map((rect) => rect.width)),
                  rect: getRect(options),
                  rows: rows.length,
                  scrollHeight: options.scrollHeight,
                  scrollTop: options.scrollTop,
                },
                overflowOwners: {
                  body: body.scrollHeight > body.clientHeight + 1,
                  modal: modal.scrollHeight > modal.clientHeight + 1,
                  options: options.scrollHeight > options.clientHeight + 1,
                },
                textMetrics,
              };
            });

          const beforeScroll = await metrics();
          expect(beforeScroll.document.horizontal).toBe(false);
          expect(beforeScroll.document.vertical).toBe(false);
          expect(beforeScroll.actions.height).toBeGreaterThanOrEqual(44);
          expect(beforeScroll.options.columns).toBeGreaterThan(
            viewport.width < 500 ? 0 : 1,
          );
          expect(
            beforeScroll.options.maxWidth - beforeScroll.options.minWidth,
          ).toBeLessThan(1);
          await page.screenshot({
            path: `${ROLLBACK_AFTER_ARTIFACTS}/filter/${viewport.label}-filter-open.png`,
            fullPage: true,
            scale: "css",
          });

          const search = page.getByRole("searchbox", {
            name: "Buscar tecnología",
          });
          await search.fill("Google ML Kit");
          await expect(page.locator(".project-filter-option")).toHaveCount(1);
          await search.fill("");
          const react = page.getByRole("checkbox", { name: "React" });
          await react.check();
          await expect(react).toBeChecked();
          await page.getByRole("button", { name: /LIMPIAR\. Atajo/ }).click();
          await expect(react).not.toBeChecked();

          await page.keyboard.press("Escape");
          await expect(dialog).toHaveCount(0);
          await expect
            .poll(() =>
              page.evaluate(() => {
                const activeElement = document.activeElement;
                return (
                  activeElement instanceof HTMLElement &&
                  activeElement.closest(".project-showcase") !== null &&
                  activeElement !== document.body
                );
              }),
            )
            .toBe(true);

          await filterButton.click();
          await expect(dialog).toBeVisible();
          await page.getByRole("checkbox", { name: "Vacío" }).check();
          await page.getByRole("button", { name: /APLICAR/ }).click();
          await expect(dialog).toHaveCount(0);
          await expect(page.locator(".professional-void-state")).toBeVisible();
          await page.getByRole("button", { name: /LIMPIAR FILTROS/ }).click();
          await expectShowcaseCardReady(page);

          console.log(
            JSON.stringify({
              filter: {
                afterFlow: await metrics().catch(() => null),
                open: beforeScroll,
              },
              state: "closed-after-flow",
              viewport: viewport.label,
            }),
          );
        } finally {
          await context.close();
        }
      }
    },
  );

  test(
    "keeps Empty composition readable in the restored stack and split modes",
    { tag: ["@critical", "@e2e", "@showcase", "@SHOWCASE-E2E-007"] },
    async ({ browser }) => {
      test.setTimeout(240_000);
      const viewports = [
        { height: 667, label: "375x667", width: 375, minimize: true },
        { height: 720, label: "540x720", width: 540, minimize: true },
        { height: 1024, label: "768x1024", width: 768, minimize: true },
        { height: 1180, label: "820x1180", width: 820, minimize: true },
        { height: 1280, label: "853x1280", width: 853, minimize: true },
        { height: 1368, label: "912x1368", width: 912, minimize: true },
        { height: 600, label: "1024x600", width: 1024, minimize: true },
        { height: 1366, label: "1024x1366", width: 1024, minimize: true },
        { height: 800, label: "1280x800", width: 1280, minimize: true },
        { height: 1080, label: "1920x1080", width: 1920, minimize: true },
      ];

      for (const viewport of viewports) {
        const context = await browser.newContext({
          hasTouch: viewport.width <= 1024,
          viewport,
        });
        const page = await context.newPage();

        try {
          await page.emulateMedia({ reducedMotion: "reduce" });
           await new PortfolioPage(page).seedValidProgression();
           await page.goto("/?view=showcase");
          await expectShowcaseCardReady(page);
          await activateMusicThroughVoid(page);
          const stateMetrics = async () =>
            page.evaluate(() => {
              const getRect = (element: Element | DOMRect) => {
                const rect =
                  element instanceof DOMRect
                    ? element
                    : element.getBoundingClientRect();
                return {
                  bottom: rect.bottom,
                  height: rect.height,
                  left: rect.left,
                  right: rect.right,
                  top: rect.top,
                  width: rect.width,
                };
              };
              const state = document.querySelector<HTMLElement>(
                ".professional-void-state",
              );
              const copy =
                state?.querySelector<HTMLElement>(".professional-void-copy") ??
                null;
              const eyebrow =
                state?.querySelector<HTMLElement>(
                  ".professional-void-kicker",
                ) ?? null;
              const headline = state?.querySelector<HTMLElement>("h2") ?? null;
              const lead =
                state?.querySelector<HTMLElement>(".professional-void-lead") ??
                null;
              const education =
                state?.querySelector<HTMLElement>(
                  ".professional-void-education",
                ) ?? null;
              const figure =
                state?.querySelector<HTMLElement>(
                  ".professional-void-figure",
                ) ?? null;
              const image = figure?.querySelector<HTMLElement>("img") ?? null;
              const caption =
                figure?.querySelector<HTMLElement>("figcaption") ?? null;
              const quote =
                state?.querySelector<HTMLElement>(".professional-void-quote") ??
                null;
              const author =
                figure?.querySelector<HTMLElement>(
                  ".professional-void-quote-author",
                ) ?? null;
              const quoteText =
                [
                  ...(state?.querySelectorAll<HTMLElement>(
                    ".professional-void-quote .professional-void-quote-text",
                  ) ?? []),
                ].find(
                  (element) => element.getBoundingClientRect().width > 0,
                ) ?? null;
              const player = document.querySelector<HTMLElement>(
                ".bug-cesante-player",
              );
              if (
                state === null ||
                copy === null ||
                eyebrow === null ||
                headline === null ||
                lead === null ||
                education === null ||
                figure === null ||
                image === null ||
                caption === null ||
                quote === null ||
                author === null ||
                quoteText === null
              )
                throw new Error("Empty geometry probes are unavailable.");
              const stateStyle = getComputedStyle(state);
              const quoteStyle = getComputedStyle(quoteText);
              const captionStyle = getComputedStyle(caption);
              const stateRect = getRect(state);
              const figureRect = getRect(figure);
              const captionRect = getRect(caption);
              const quoteRect = getRect(quote);
              const authorRect = getRect(author);
              const range = document.createRange();
              range.selectNodeContents(quoteText);
              const lineRects = [...range.getClientRects()];
              const textRect = getRect(quoteText);
              const ancestorTransforms: Array<{
                transform: string;
                scaleX: number;
                scaleY: number;
              }> = [];
              let ancestor: HTMLElement | null = quoteText;
              while (ancestor !== null && ancestorTransforms.length < 8) {
                const transformStyle = getComputedStyle(ancestor).transform;
                const matrix =
                  transformStyle === "none"
                    ? new DOMMatrixReadOnly()
                    : new DOMMatrixReadOnly(transformStyle);
                ancestorTransforms.push({
                  transform: transformStyle,
                  scaleX: matrix.a,
                  scaleY: matrix.d,
                });
                ancestor = ancestor.parentElement;
              }
              const borderTop =
                Number.parseFloat(captionStyle.borderTopWidth) || 0;
              const regions = {
                author: getRect(author),
                copy: getRect(copy),
                education: getRect(education),
                eyebrow: getRect(eyebrow),
                figure: figureRect,
                headline: getRect(headline),
                image: getRect(image),
                lead: getRect(lead),
                player: player === null ? null : getRect(player),
                quote: quoteRect,
              };
              const collisions = Object.fromEntries(
                Object.entries(regions).flatMap(
                  ([leftName, leftRect], leftIndex, entries) =>
                    entries
                      .slice(leftIndex + 1)
                      .map(([rightName, rightRect]) => {
                        const hit =
                          leftRect !== null &&
                          rightRect !== null &&
                          leftRect.left < rightRect.right &&
                          leftRect.right > rightRect.left &&
                          leftRect.top < rightRect.bottom &&
                          leftRect.bottom > rightRect.top;
                        return [`${leftName}:${rightName}`, hit];
                      }),
                ),
              );
              const playerIntersections = Object.fromEntries(
                [
                  "eyebrow",
                  "headline",
                  "lead",
                  "education",
                  "figure",
                  "quote",
                  "author",
                ].map((name) => {
                  const region = regions[name as keyof typeof regions];
                  const playerRegion = regions.player;
                  return [
                    name,
                    playerRegion !== null &&
                      region !== null &&
                      playerRegion.left < region.right &&
                      playerRegion.right > region.left &&
                      playerRegion.top < region.bottom &&
                      playerRegion.bottom > region.top,
                  ];
                }),
              );
              return {
                caption: captionRect,
                copy: getRect(copy),
                collisions,
                document: {
                  bodyHeight: document.body.scrollHeight,
                  bodyWidth: document.body.scrollWidth,
                  clientHeight: document.documentElement.clientHeight,
                  clientWidth: document.documentElement.clientWidth,
                  horizontalOverflow:
                    document.documentElement.scrollWidth >
                      document.documentElement.clientWidth + 1 ||
                    document.body.scrollWidth > document.body.clientWidth + 1,
                  verticalOverflow:
                    document.documentElement.scrollHeight >
                      document.documentElement.clientHeight + 1 ||
                    document.body.scrollHeight > document.body.clientHeight + 1,
                },
                figure: figureRect,
                layoutMode:
                  stateStyle.gridTemplateColumns.split(" ").length > 1
                    ? "split"
                    : "stacked",
                player: player === null ? null : getRect(player),
                quote: {
                  author: authorRect,
                  citationGap: authorRect.top - textRect.bottom,
                  fontSize: Number.parseFloat(quoteStyle.fontSize),
                  inlineGutter: Math.min(
                    textRect.left - captionRect.left,
                    captionRect.right - textRect.right,
                  ),
                  lineCount: new Set(
                    lineRects.map((rect) => rect.top.toFixed(2)),
                  ).size,
                  lineHeight: quoteStyle.lineHeight,
                  letterSpacing: quoteStyle.letterSpacing,
                  maxMeasure: quoteStyle.maxInlineSize,
                  overlap:
                    textRect.bottom > authorRect.top ||
                    textRect.top < captionRect.top + borderTop,
                  overflow:
                    quote.scrollWidth > quote.clientWidth + 1 ||
                    quote.scrollHeight > quote.clientHeight + 1,
                  rect: quoteRect,
                  ruleToTextGap: textRect.top - (captionRect.top + borderTop),
                  textRect,
                  widthRatio: quoteRect.width / figureRect.width,
                },
                captionCentered:
                  Math.abs(
                    (captionRect.left + captionRect.right) / 2 -
                      (figureRect.left + figureRect.right) / 2,
                  ) <= 1,
                ancestorTransforms,
                ancestorScaleSafe: ancestorTransforms.every(
                  ({ scaleX, scaleY }) =>
                    Math.abs(scaleX - 1) < 0.001 &&
                    Math.abs(scaleY - 1) < 0.001,
                ),
                playerIntersections,
                state: stateRect,
                stateClientHeight: state.clientHeight,
                stateScrollHeight: state.scrollHeight,
                stateOverflow: stateStyle.overflow,
                regions,
              };
            });

          const expanded = await stateMetrics();
          expect(expanded.state.left).toBeGreaterThanOrEqual(-0.5);
          expect(expanded.state.top).toBeGreaterThanOrEqual(-0.5);
          expect(expanded.state.right).toBeLessThanOrEqual(
            viewport.width + 0.5,
          );
          expect(expanded.state.bottom).toBeLessThanOrEqual(
            viewport.height + 0.5,
          );
          expect(expanded.document.horizontalOverflow).toBe(false);
          expect(expanded.document.verticalOverflow).toBe(false);
          expect(expanded.quote.overflow).toBe(false);
          expect(expanded.quote.overlap).toBe(false);
          expect(expanded.quote.fontSize).toBeGreaterThanOrEqual(16);
          expect(
            Number.parseFloat(expanded.quote.lineHeight),
          ).toBeGreaterThanOrEqual(expanded.quote.fontSize * 1.3);
          expect(expanded.quote.letterSpacing).not.toMatch(/-/);
          expect(expanded.quote.maxMeasure).not.toBe("none");
          expect(expanded.quote.inlineGutter).toBeGreaterThanOrEqual(8);
          expect(expanded.quote.citationGap).toBeGreaterThanOrEqual(8);
          expect(expanded.quote.lineCount).toBeGreaterThanOrEqual(2);
          if (viewport.width >= 768 && viewport.height >= viewport.width) {
            expect(expanded.stateScrollHeight).toBeLessThanOrEqual(
              expanded.stateClientHeight + 1,
            );
            expect(expanded.stateOverflow).toBe("hidden");
            expect(expanded.captionCentered).toBe(true);
          }
          expect(expanded.ancestorScaleSafe).toBe(true);
          expect(
            Object.values(expanded.playerIntersections).every(
              (hit) => hit === false,
            ),
          ).toBe(true);

          await page.screenshot({
            path: `${ROLLBACK_AFTER_ARTIFACTS}/empty/${viewport.label}-empty-expanded.png`,
            fullPage: true,
            scale: "css",
          });
          const quoteCaption = page.locator(
            ".professional-void-figure figcaption",
          );
          await quoteCaption.scrollIntoViewIfNeeded();
          await quoteCaption.screenshot({
            path: `${ROLLBACK_AFTER_ARTIFACTS}/empty/${viewport.label}-empty-quote.png`,
            scale: "css",
          });
          await page.locator(".professional-void-state").evaluate((element) => {
            element.scrollTop = 0;
          });

          if (viewport.minimize) {
            await page
              .getByRole("button", { name: "Minimizar reproductor" })
              .click();
            await expect(
              page.locator('.bug-cesante-player[data-minimized="true"]'),
            ).toBeVisible();
            await page.waitForTimeout(500);
            const minimized = await stateMetrics();
            expect(minimized.document.horizontalOverflow).toBe(false);
            expect(minimized.document.verticalOverflow).toBe(false);
            expect(minimized.quote.overflow).toBe(false);
            expect(minimized.quote.overlap).toBe(false);
            expect(minimized.quote.fontSize).toBeGreaterThanOrEqual(16);
            expect(
              Number.parseFloat(minimized.quote.lineHeight),
            ).toBeGreaterThanOrEqual(minimized.quote.fontSize * 1.3);
            expect(minimized.quote.letterSpacing).not.toMatch(/-/);
            expect(minimized.quote.maxMeasure).not.toBe("none");
            expect(minimized.quote.inlineGutter).toBeGreaterThanOrEqual(8);
            expect(minimized.quote.citationGap).toBeGreaterThanOrEqual(8);
            if (viewport.width >= 768 && viewport.height >= viewport.width) {
              expect(minimized.stateScrollHeight).toBeLessThanOrEqual(
                minimized.stateClientHeight + 1,
              );
              expect(minimized.stateOverflow).toBe("hidden");
              expect(minimized.captionCentered).toBe(true);
            }
            expect(minimized.ancestorScaleSafe).toBe(true);
            expect(
              Object.values(minimized.playerIntersections).every(
                (hit) => hit === false,
              ),
            ).toBe(true);
            console.log(
              JSON.stringify({
                empty: minimized,
                state: "minimized",
                viewport: viewport.label,
              }),
            );
            await page.screenshot({
              path: `${ROLLBACK_AFTER_ARTIFACTS}/empty/${viewport.label}-empty-minimized.png`,
              fullPage: true,
              scale: "css",
            });
          }

          console.log(
            JSON.stringify({ empty: expanded, viewport: viewport.label }),
          );
        } finally {
          await context.close();
        }
      }
    },
  );

  test(
    "keeps every ornate title and accented subtitle inside its optical plate",
    { tag: ["@critical", "@e2e", "@showcase", "@SHOWCASE-E2E-008"] },
    async ({ browser }) => {
      test.setTimeout(300_000);
      const viewports = [
        { height: 667, label: "375x667", width: 375 },
        { height: 720, label: "540x720", width: 540 },
        { height: 1180, label: "820x1180", width: 820 },
        { height: 600, label: "1024x600", width: 1024 },
        { height: 800, label: "1280x800", width: 1280 },
        { height: 768, label: "1366x768", width: 1366 },
        { height: 1080, label: "1920x1080", width: 1920 },
      ];

      for (const viewport of viewports) {
        const context = await browser.newContext({
          hasTouch: viewport.width <= 1024,
          viewport,
        });
        const page = await context.newPage();

        try {
          await page.emulateMedia({ reducedMotion: "no-preference" });
           await new PortfolioPage(page).seedValidProgression();
           await page.goto("/?view=showcase");
          await expectShowcaseCardReady(page);
          await activateMusicThroughVoid(page);
          await page.getByRole("button", { name: /LIMPIAR FILTROS/ }).click();
          await expectShowcaseCardReady(page);
          await page.waitForTimeout(800);

          const projectCount = Math.min(
            7,
            await page.locator(".project-showcase-item").count(),
          );
          expect(projectCount).toBe(7);
          let referenceTitle: {
            cardHeight: number;
            cardWidth: number;
            fontSize: number;
            inkHeight: number;
            inkWidth: number;
            topBandHeight: number;
            topBandWidth: number;
          } | null = null;
          for (
            let projectIndex = 0;
            projectIndex < projectCount;
            projectIndex += 1
          ) {
            const metrics = await page.evaluate(() => {
              const getRect = (element: Element | DOMRect) => {
                const rect =
                  element instanceof DOMRect
                    ? element
                    : element.getBoundingClientRect();
                return {
                  bottom: rect.bottom,
                  height: rect.height,
                  left: rect.left,
                  right: rect.right,
                  top: rect.top,
                  width: rect.width,
                };
              };
              const card = document.querySelector<HTMLElement>(
                '.project-showcase-item[data-active="true"] .project-card[data-card-presentation="media-title-bands"]',
              );
              const titleBand =
                card?.querySelector<HTMLElement>('[data-card-band="top"]') ??
                null;
              const subtitleBand =
                card?.querySelector<HTMLElement>('[data-card-band="bottom"]') ??
                null;
              const title =
                card?.querySelector<HTMLElement>(
                  ".project-card-title .fitted-band-text-content",
                ) ?? null;
              const subtitle =
                card?.querySelector<HTMLElement>(
                  ".project-card-subtitle .fitted-band-text-content",
                ) ?? null;
              if (
                card === null ||
                titleBand === null ||
                subtitleBand === null ||
                title === null ||
                subtitle === null
              )
                throw new Error("Ornate ink probes are unavailable.");
              const getInkRect = (element: HTMLElement) => {
                const range = document.createRange();
                if (element.firstChild === null)
                  throw new Error("Ornate text node is unavailable.");
                range.selectNodeContents(element.firstChild);
                return getRect(range.getBoundingClientRect());
              };
              const safeGap = (
                ink: ReturnType<typeof getRect>,
                band: ReturnType<typeof getRect>,
                inline: number,
                block: number,
              ) => ({
                bottom: band.bottom - block - ink.bottom,
                left: ink.left - (band.left + inline),
                right: band.right - inline - ink.right,
                top: ink.top - (band.top + block),
              });
              const titleStyle = getComputedStyle(title);
              const subtitleStyle = getComputedStyle(subtitle);
              const titleBandRect = getRect(titleBand);
              const subtitleBandRect = getRect(subtitleBand);
              const cardRect = getRect(card);
              const titleInk = getInkRect(title);
              const subtitleInk = getInkRect(subtitle);
              const titleInline =
                Number.parseFloat(
                  titleStyle.getPropertyValue("--fitted-ink-safe-inline"),
                ) || 0;
              const titleBlock =
                Number.parseFloat(
                  titleStyle.getPropertyValue("--fitted-ink-safe-block"),
                ) || 0;
              const subtitleInline =
                Number.parseFloat(
                  subtitleStyle.getPropertyValue("--fitted-ink-safe-inline"),
                ) || 0;
              const subtitleBlock =
                Number.parseFloat(
                  subtitleStyle.getPropertyValue("--fitted-ink-safe-block"),
                ) || 0;
              const getPlateGap = (
                ink: ReturnType<typeof getRect>,
                band: ReturnType<typeof getRect>,
              ) => {
                return {
                  bottom: band.bottom - ink.bottom,
                  left: ink.left - band.left,
                  right: band.right - ink.right,
                  top: ink.top - band.top,
                };
              };
              return {
                cardRect,
                card:
                  card
                    .querySelector<HTMLElement>(".project-card-title")
                    ?.textContent?.trim() ?? "",
                subtitle:
                  card
                    .querySelector<HTMLElement>(".project-card-subtitle")
                    ?.textContent?.trim() ?? "",
                title: {
                  fontSize: Number.parseFloat(titleStyle.fontSize),
                  ink: titleInk,
                  lineHeight: titleStyle.lineHeight,
                  overflow:
                    title.scrollWidth > title.clientWidth + 1 ||
                    title.scrollHeight > title.clientHeight + 1,
                  plateGap: getPlateGap(titleInk, titleBandRect),
                  rect: getRect(title),
                  safeGap: safeGap(
                    titleInk,
                    titleBandRect,
                    titleInline,
                    titleBlock,
                  ),
                },
                subtitleMetrics: {
                  fontSize: Number.parseFloat(subtitleStyle.fontSize),
                  ink: subtitleInk,
                  lineHeight: subtitleStyle.lineHeight,
                  overflow:
                    subtitle.scrollWidth > subtitle.clientWidth + 1 ||
                    subtitle.scrollHeight > subtitle.clientHeight + 1,
                  plateGap: getPlateGap(subtitleInk, subtitleBandRect),
                  rect: getRect(subtitle),
                  safeGap: safeGap(
                    subtitleInk,
                    subtitleBandRect,
                    subtitleInline,
                    subtitleBlock,
                  ),
                },
                bands: { bottom: subtitleBandRect, top: titleBandRect },
                overflow:
                  document.documentElement.scrollWidth >
                    document.documentElement.clientWidth + 1 ||
                  document.body.scrollWidth > document.body.clientWidth + 1,
              };
            });

            expect(metrics.title.overflow).toBe(false);
            if (metrics.subtitleMetrics.overflow) {
              console.log(
                JSON.stringify({
                  overflow: true,
                  project: projectIndex + 1,
                  subtitle: metrics.subtitle,
                  subtitleMetrics: metrics.subtitleMetrics,
                  viewport: viewport.label,
                }),
              );
            }
            expect(
              metrics.subtitleMetrics.overflow,
              `${viewport.label} P${projectIndex + 1} ${metrics.subtitle}`,
            ).toBe(false);
            expect(metrics.overflow).toBe(false);
            expect(metrics.title.safeGap.left).toBeGreaterThanOrEqual(0.5);
            expect(metrics.title.safeGap.right).toBeGreaterThanOrEqual(0.5);
            expect(metrics.title.safeGap.top).toBeGreaterThanOrEqual(0.5);
            expect(metrics.title.safeGap.bottom).toBeGreaterThanOrEqual(0.5);
            expect(metrics.title.plateGap.left).toBeGreaterThanOrEqual(4);
            expect(metrics.title.plateGap.right).toBeGreaterThanOrEqual(4);
            expect(metrics.title.plateGap.top).toBeGreaterThanOrEqual(4);
            expect(metrics.title.plateGap.bottom).toBeGreaterThanOrEqual(4);
            expect(metrics.subtitleMetrics.safeGap.left).toBeGreaterThanOrEqual(
              0.5,
            );
            expect(
              metrics.subtitleMetrics.safeGap.right,
            ).toBeGreaterThanOrEqual(0.5);
            expect(metrics.subtitleMetrics.safeGap.top).toBeGreaterThanOrEqual(
              0.5,
            );
            expect(
              metrics.subtitleMetrics.safeGap.bottom,
            ).toBeGreaterThanOrEqual(0.5);
            if (
              metrics.subtitle.toLocaleUpperCase("es-CL").includes("DISEÑO")
            ) {
              expect(metrics.subtitle).toContain("ñ");
            }
            if (referenceTitle === null) {
              referenceTitle = {
                cardHeight: metrics.cardRect.height,
                cardWidth: metrics.cardRect.width,
                fontSize: metrics.title.fontSize,
                inkHeight: metrics.title.ink.height,
                inkWidth: metrics.title.ink.width,
                topBandHeight: metrics.bands.top.height,
                topBandWidth: metrics.bands.top.width,
              };
            } else {
              expect(metrics.cardRect.width).toBeCloseTo(
                referenceTitle.cardWidth,
                1,
              );
              expect(metrics.cardRect.height).toBeCloseTo(
                referenceTitle.cardHeight,
                1,
              );
              expect(metrics.bands.top.width).toBeCloseTo(
                referenceTitle.topBandWidth,
                1,
              );
              expect(metrics.bands.top.height).toBeCloseTo(
                referenceTitle.topBandHeight,
                1,
              );
              expect(metrics.title.fontSize).toBeGreaterThanOrEqual(
                referenceTitle.fontSize - 0.75,
              );
              expect(metrics.title.ink.height).toBeGreaterThanOrEqual(
                referenceTitle.inkHeight - 1,
              );
              expect(
                metrics.title.fontSize >= referenceTitle.fontSize - 0.25 ||
                  metrics.title.ink.width < referenceTitle.inkWidth - 1,
              ).toBe(true);
            }
            console.log(
              JSON.stringify({
                project: projectIndex + 1,
                metrics,
                viewport: viewport.label,
              }),
            );

            if (projectIndex === 0 || projectIndex === projectCount - 1) {
              await page.screenshot({
                path: `artifacts/card-title-utilization/after-${viewport.label}-p${projectIndex + 1}.png`,
                fullPage: false,
                scale: "css",
              });
              await page
                .locator(
                  '.project-showcase-item[data-active="true"] [data-card-band="top"]',
                )
                .screenshot({
                  path: `artifacts/card-title-utilization/after-${viewport.label}-p${projectIndex + 1}-title-band.png`,
                  scale: "css",
                });
            }

            if (projectIndex < projectCount - 1) {
              await page
                .getByRole("button", { name: "Proyecto siguiente" })
                .click();
              await page.waitForTimeout(800);
            }
          }

          await page.screenshot({
            path: `${ROLLBACK_AFTER_ARTIFACTS}/subtitle/${viewport.label}-subtitle-audit.png`,
            fullPage: true,
            scale: "css",
          });
        } finally {
          await context.close();
        }
      }
    },
  );

  test(
    "keeps external navigation copy and focused action paint clear of the description",
    { tag: ["@critical", "@e2e", "@a11y", "@SHOWCASE-E2E-005"] },
    async ({ browser }) => {
      test.setTimeout(60_000);
      for (const viewport of [
        { height: 568, width: 320, zoom: "1" },
        { height: 667, width: 375, zoom: "1.25" },
      ]) {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();

        try {
           await new PortfolioPage(page).seedValidProgression();
           await page.goto("/?view=showcase");
          if (viewport.zoom !== "1")
            await page.evaluate((zoom) => {
              document.body.style.zoom = zoom;
            }, viewport.zoom);

          const card = page
            .locator(
              '.project-card[data-card-presentation="media-title-bands"]',
            )
            .filter({
              has: page.getByRole("heading", {
                name: "Software Engineering Playbook",
              }),
            });
          await expect(card).toBeVisible();
          await card.getByRole("button", { name: /Ver stack de/ }).click();
          const stackDialog = page.getByRole("dialog", {
            name: "ARQUITECTURA",
          });
          await expect(stackDialog).toBeVisible();
          await stackDialog
            .getByRole("link", { name: /Ver el proyecto en GitHub/ })
            .click();

          const navigationDialog = page.getByRole("dialog", {
            name: "Vas a salir del portafolio",
          });
          const description = navigationDialog.locator(
            "#external-navigation-description",
          );
          await expect(navigationDialog).toBeVisible();
          await expect(description).toHaveText(
            "Explorarás Software Engineering Playbook en su repositorio de GitHub (se abrirá en una pestaña nueva).",
            { useInnerText: true },
          );
          await expect(
            navigationDialog.getByRole("button", { name: "Cancelar" }),
          ).toBeFocused();
          await page.keyboard.press("ArrowRight");
          await expect(
            navigationDialog.getByRole("button", { name: "Continuar" }),
          ).toBeFocused();

          const geometry = await navigationDialog.evaluate((dialog) => {
            const content = dialog.querySelector<HTMLElement>(
              ".external-navigation-dialog-content",
            );
            const actions = dialog.querySelector<HTMLElement>(
              ".external-navigation-actions",
            );
            const descriptionElement = dialog.querySelector<HTMLElement>(
              "#external-navigation-description",
            );
            const focused = dialog.querySelector<HTMLButtonElement>(
              "button:focus-visible",
            );
            if (
              content === null ||
              actions === null ||
              descriptionElement === null ||
              focused === null
            )
              throw new Error(
                "External navigation geometry contract is unavailable.",
              );
            const focusedRect = focused.getBoundingClientRect();
            const style = getComputedStyle(focused);
            const outline =
              Number.parseFloat(style.outlineWidth) +
              Number.parseFloat(style.outlineOffset);
            return {
              contentBottom: content.getBoundingClientRect().bottom,
              descriptionBottom:
                descriptionElement.getBoundingClientRect().bottom,
              expandedFocusTop: focusedRect.top - outline,
              actionsTop: actions.getBoundingClientRect().top,
              overflow:
                document.documentElement.scrollWidth >
                document.documentElement.clientWidth,
            };
          });

          expect(geometry.expandedFocusTop).toBeGreaterThanOrEqual(
            geometry.descriptionBottom + 1,
          );
          expect(geometry.contentBottom).toBeGreaterThanOrEqual(
            geometry.descriptionBottom + 1,
          );
          expect(geometry.actionsTop).toBeGreaterThan(
            geometry.descriptionBottom,
          );
          expect(geometry.overflow).toBe(false);
          await page.keyboard.press("Escape");
          await expect(navigationDialog).toHaveCount(0);
          await expect(
            stackDialog.getByRole("link", {
              name: /Ver el proyecto en GitHub/,
            }),
          ).toBeFocused();
        } finally {
          await context.close();
        }
      }
    },
  );

  test(
    "restores modal contrast, thematic fonts, passive selection rules, and interaction lock",
    { tag: ["@critical", "@e2e", "@a11y", "@SHOWCASE-E2E-003"] },
    async ({ page }) => {
       await new PortfolioPage(page).seedValidProgression();
       await page.goto("/?view=showcase");
      const card = page
        .locator('.project-card[data-card-presentation="media-title-bands"]')
        .filter({
          has: page.getByRole("heading", {
            name: "Software Engineering Playbook",
          }),
        });
      await expect(card).toBeVisible();

      const readContrast = () =>
        page.evaluate(() => {
          const selectors = [
            ".main-hall",
            ".project-showcase",
            ".project-card",
            ".project-card-frame",
            ".project-card-title",
            ".project-card-subtitle",
          ];
          return selectors.map((selector) => {
            const element = document.querySelector<HTMLElement>(selector);
            if (element === null)
              throw new Error(`Missing contrast probe: ${selector}`);
            const style = getComputedStyle(element);
            return {
              color: style.color,
              filter: style.filter,
              opacity: style.opacity,
              selector,
            };
          });
        });

      const initialContrast = await readContrast();
      const infoSeal = card.getByRole("button", { name: /Ver historia de/ });
      await infoSeal.click();
      const infoDialog = page.getByRole("dialog", {
        name: "Software Engineering Playbook",
      });
      await expect(infoDialog).toBeVisible();
      await expect(
        page.locator(".main-hall-interaction-surface"),
      ).toHaveAttribute("inert");
      await expect(
        page.locator(".project-showcase-interaction-surface"),
      ).toHaveAttribute("inert");
      expect(
        await page.evaluate(
          () =>
            getComputedStyle(
              document.querySelector(
                ".main-hall-interaction-surface",
              ) as Element,
            ).opacity,
        ),
      ).toBe("1");
      expect(
        await page.evaluate(
          () =>
            getComputedStyle(
              document.querySelector("dialog.project-card-modal") as Element,
              "::backdrop",
            ).backgroundColor,
        ),
      ).toBe("rgba(0, 0, 0, 0.7)");
      expect(
        await page
          .locator(".project-card-modal h2")
          .evaluate((element) => getComputedStyle(element).fontFamily),
      ).toContain("Bangers");
      expect(
        await page
          .locator(".project-one-modal-sections h3")
          .first()
          .evaluate((element) => getComputedStyle(element).fontFamily),
      ).toContain("Bangers");
      expect(
        await page
          .locator(".project-card-modal-description-info")
          .evaluate((element) => getComputedStyle(element).fontFamily),
      ).toContain("Atkinson");
      expect(
        await page
          .locator(
            ".project-card-modal h2, .project-one-modal-sections h3, .project-one-modal-sections p",
          )
          .evaluateAll((elements) =>
            elements.every(
              (element) => getComputedStyle(element).userSelect === "none",
            ),
          ),
      ).toBe(true);

      const passiveText = page.locator(".project-one-modal-sections p").first();
      const passiveBox = await passiveText.boundingBox();
      if (passiveBox === null)
        throw new Error("Passive modal paragraph has no box.");
      await page.evaluate(() => document.getSelection()?.removeAllRanges());
      await page.mouse.move(passiveBox.x + 4, passiveBox.y + 4);
      await page.mouse.down();
      await page.mouse.move(
        passiveBox.x + passiveBox.width - 4,
        passiveBox.y + passiveBox.height - 4,
      );
      await page.mouse.up();
      await page.keyboard.press("Control+A");
      expect(
        await page.evaluate(() => ({
          rangeCount: document.getSelection()?.rangeCount ?? 0,
          text: document.getSelection()?.toString() ?? "",
        })),
      ).toEqual({ rangeCount: 0, text: "" });

      await page.getByRole("button", { name: /Cerrar información de/ }).click();
      await expect(infoDialog).toHaveCount(0);
      await expect.poll(readContrast).toEqual(initialContrast);
      await expect(
        page.locator(".main-hall-interaction-surface"),
      ).not.toHaveAttribute("inert");
      await expect(
        page.locator(".project-showcase-interaction-surface"),
      ).not.toHaveAttribute("inert");
      await expect(infoSeal).toBeFocused();

      const stackSeal = card.getByRole("button", { name: /Ver stack de/ });
      await stackSeal.click();
      const stackDialog = page.getByRole("dialog", { name: "ARQUITECTURA" });
      await expect(stackDialog).toBeVisible();
      expect(
        await page
          .locator(".project-card-modal h2")
          .evaluate((element) => getComputedStyle(element).fontFamily),
      ).toContain("Bangers");
      expect(
        await page
          .locator(".project-one-stack-content h3")
          .first()
          .evaluate((element) => getComputedStyle(element).fontFamily),
      ).toContain("Bangers");
      await expect(
        page.getByRole("button", { name: "Filtros" }),
      ).toBeDisabled();
      const activeProject = await page
        .locator(
          ".project-showcase-item[aria-current='true'] .project-card-title",
        )
        .textContent();
      await page.keyboard.press("ArrowRight");
      await expect(
        page.locator(
          ".project-showcase-item[aria-current='true'] .project-card-title",
        ),
      ).toHaveText(activeProject ?? "");
      await page.getByRole("button", { name: /Cerrar stack de/ }).click();
      await expect(stackDialog).toHaveCount(0);
      await expect.poll(readContrast).toEqual(initialContrast);
      await expect(stackSeal).toBeFocused();
    },
  );

  test(
    "settles ring and static-card contracts",
    { tag: ["@critical", "@e2e", "@a11y", "@PORTFOLIO-E2E-021"] },
    async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.addInitScript(() =>
        sessionStorage.setItem("kurone-ko:vault-cinematic-seen:v1", "1"),
      );
      const portfolio = new PortfolioPage(page);
      await portfolio.gotoPortfolio();
      await portfolio.unlockMobileVaultForCinematic();
      await page
        .getByRole("button", { name: "Mis obras en construcción" })
        .click();
      await expect(portfolio.cinematic()).toHaveCount(0);
      const rail = page.getByRole("list", { name: "Proyectos filtrados" });
      const cards = rail.getByRole("listitem");
      const active = rail.locator("[aria-current='true']");
      await expectSettledCards(cards, 2);
      await expect(active).toBeVisible();
      expect(
        await cards.evaluateAll((items) => ({
          gutters: (() => {
            const r = items
              .find((item) => item.getAttribute("aria-current") === "true")!
              .getBoundingClientRect();
            return r.left >= 8 && r.right <= innerWidth - 8;
          })(),
          inactiveInert: items.every(
            (item) =>
              item.getAttribute("aria-current") === "true" ||
              item.hasAttribute("inert"),
          ),
        })),
      ).toEqual({ gutters: true, inactiveInert: true });
      const react = page.getByRole("checkbox", { name: "React" });
      const flutter = page.getByRole("checkbox", { name: "Flutter" });
      await react.click();
      await expect(react).toBeChecked();
      await flutter.click();
      await expect(flutter).toBeChecked();
      await expect(cards).toHaveCount(2);
      await expectSettledCards(cards, 2, false, true);
      expect(
        await cards.evaluateAll((items) => ({
          active: items.filter(
            (item) => item.getAttribute("aria-current") === "true",
          ).length,
          inactiveInert: items
            .filter((item) => item.getAttribute("aria-current") !== "true")
            .every((item) => item.hasAttribute("inert")),
        })),
      ).toEqual({ active: 1, inactiveInert: true });
      const inactive = cards.nth(1);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expectSettledCards(cards, 2, true);
      await inactive.getByRole("button", { name: "Ver reverso" }).click();
      await expect(
        inactive.getByRole("button", { name: "Volver al frente" }),
      ).toBeFocused();
      const activeProject = await active.getByRole("heading").textContent();
      const staticRailBox = await rail.boundingBox();
      if (staticRailBox === null)
        throw new Error("Expected static carousel surface.");
      const staticCdp = await page.context().newCDPSession(page);
      await dispatchTouchDrag(
        staticCdp,
        1,
        staticRailBox.x + staticRailBox.width / 2,
        staticRailBox.y + 40,
        -64,
        2,
      );
      await expect(
        active.getByRole("heading", { name: activeProject ?? "" }),
      ).toBeVisible();
      await page.emulateMedia({
        media: "screen",
        reducedMotion: "no-preference",
      });
      await page.emulateMedia({ media: "print" });
      await expectSettledCards(cards, 2, true);
      await inactive.getByRole("button", { name: "Volver al frente" }).click();
      await expect(
        inactive.getByRole("button", { name: "Ver reverso" }),
      ).toBeFocused();
    },
  );

  test(
    "uses static interactive cards without 3D support",
    { tag: ["@critical", "@e2e", "@a11y", "@PORTFOLIO-E2E-022"] },
    async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      try {
        await page.addInitScript(() => {
          const supports = CSS.supports.bind(CSS);
          Object.defineProperty(CSS, "supports", {
            configurable: true,
            value: (query: string) =>
              query.includes("perspective") || query.includes("transform-style")
                ? false
                : supports(query),
          });
        });
        await page.addInitScript(() =>
          sessionStorage.setItem("kurone-ko:vault-cinematic-seen:v1", "1"),
        );
        const portfolio = new PortfolioPage(page);
        await portfolio.gotoPortfolio();
        await portfolio.unlockMobileVaultForCinematic();
        await page
          .getByRole("button", { name: "Mis obras en construcción" })
          .click();
        await expect(portfolio.cinematic()).toHaveCount(0);
        const cards = page
          .getByRole("list", { name: "Proyectos filtrados" })
          .getByRole("listitem");
        const inactive = cards.nth(1);
        await expectSettledCards(cards, 2, true);
        await expect(inactive).not.toHaveAttribute("inert");
        await inactive.getByRole("button", { name: "Ver reverso" }).click();
        await expect(
          inactive.getByRole("button", { name: "Volver al frente" }),
        ).toBeFocused();
      } finally {
        await context.close();
      }
    },
  );

  test(
    "keeps optional pointer browsing bounded at touch-safe portrait and landscape sizes",
    { tag: ["@high", "@e2e", "@portfolio", "@POINTER-E2E-001"] },
    async ({ browser }) => {
      test.setTimeout(60_000);
      const context = await browser.newContext({
        hasTouch: true,
        isMobile: true,
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      try {
        await page.addInitScript(() =>
          sessionStorage.setItem("kurone-ko:vault-cinematic-seen:v1", "1"),
        );
        const portfolio = new PortfolioPage(page);
        await portfolio.gotoPortfolio();
        await portfolio.expectMobileIntroGuidance();
        await portfolio.unlockMobileVaultForCinematic();
        await page
          .getByRole("button", { name: "Mis obras en construcción" })
         .click();
         const rail = page.getByRole("list", { name: "Proyectos filtrados" });
         const showcase = page.locator(".project-showcase");
         const interactionSurface = page.locator(
           ".project-showcase-interaction-surface",
         );
         await expect(rail).toHaveAttribute("data-gesture-enabled", "true");
         await expect(showcase).toHaveAttribute(
           "data-showcase-reveal",
           "settled",
         );
         await expect(showcase).not.toHaveAttribute("inert");
         await expect(interactionSurface).not.toHaveAttribute("inert");
         const box = await rail.boundingBox();
        if (box === null) throw new Error("Expected carousel gesture surface.");
        const cdp = await context.newCDPSession(page);
        const x = box.x + box.width / 2;
        const y = box.y + 40;
        await dispatchTouchDrag(cdp, 1, x, y, -64, 2);
        await expect(
          rail
            .locator("[aria-current='true']")
            .getByRole("heading", { name: "Timer" }),
        ).toBeVisible();
        await expect(
          rail.getByRole("button", { name: "Volver al frente" }),
        ).toHaveCount(0);
        await page.getByRole("button", { name: "Proyecto anterior" }).click();
        const activeProjectBeforeVerticalDrag = await rail
          .locator("[aria-current='true'] .project-card-title")
          .textContent();
        const verticalScrollState = await page.evaluate(() => {
          const scrollingElement = document.scrollingElement;

          if (scrollingElement === null) {
            throw new Error("Document scroll metrics are unavailable.");
          }

          return {
            canScroll: scrollingElement.scrollHeight > scrollingElement.clientHeight + 1,
            scrollY: window.scrollY,
          };
        });
        const scrollY = await page.evaluate(() => window.scrollY);
        await dispatchTouchDrag(cdp, 2, x, y, 0, -160);
        if (verticalScrollState.canScroll) {
          await expect
            .poll(() => page.evaluate(() => window.scrollY))
            .toBeGreaterThan(verticalScrollState.scrollY);
        } else {
          await expect
            .poll(() => page.evaluate(() => window.scrollY))
            .toBe(scrollY);
        }
        await expect(
          rail
            .locator("[aria-current='true']")
            .getByRole("heading", { name: /.+/ }),
        ).toHaveText(activeProjectBeforeVerticalDrag ?? "");
        await page.setViewportSize({ width: 844, height: 390 });
        await expect(
          page.getByRole("button", { name: "Proyecto siguiente" }),
        ).toBeVisible();
        await rail.scrollIntoViewIfNeeded();
        const landscapeBox = await rail.boundingBox();
        if (landscapeBox === null)
          throw new Error("Expected landscape carousel gesture surface.");
        await dispatchTouchDrag(
          cdp,
          3,
          landscapeBox.x + landscapeBox.width / 2,
          landscapeBox.y + 40,
          -64,
          2,
        );
        await expect(
          rail
            .locator("[aria-current='true']")
            .getByRole("heading", { name: "Timer" }),
        ).toBeVisible();
        expect(
          await page.evaluate(
            () =>
              document.documentElement.scrollWidth <=
              document.documentElement.clientWidth,
          ),
        ).toBe(true);
      } finally {
        await context.close();
      }
    },
  );

  test(
    "activates showcase controls on their first physical-like touch",
    { tag: ["@critical", "@e2e", "@showcase", "@SHOWCASE-E2E-010"] },
    async ({ browser }) => {
      test.setTimeout(60_000);
      const context = await browser.newContext({
        hasTouch: true,
        isMobile: true,
        viewport: { width: 390, height: 844 },
      });

      try {
        const sealPage = await context.newPage();
        await sealPage.emulateMedia({ reducedMotion: "reduce" });
        const sealPortfolio = new PortfolioPage(sealPage);
        await sealPortfolio.gotoShowcase();
        const activeCard = sealPage.locator(
          '.project-showcase-item[data-active="true"] .project-card',
        );
        const stackSeal = activeCard.getByRole("button", { name: /Ver stack de/ });
        await expect(stackSeal).toBeVisible();

        await sealPortfolio.tapWithTouch(stackSeal);
        const sealDialogs = sealPage.locator("dialog[open]");
        await expect(sealDialogs).toHaveCount(1);
        await expect(sealPage.getByRole("dialog")).toHaveCount(1);
        await sealPage.keyboard.press("Escape");
        await expect(sealDialogs).toHaveCount(0);

        const arrowPage = await context.newPage();
        await arrowPage.emulateMedia({ reducedMotion: "reduce" });
        const arrowPortfolio = new PortfolioPage(arrowPage);
        await arrowPortfolio.gotoShowcase();
        const arrowRail = arrowPage.getByRole("list", { name: "Proyectos filtrados" });
        const activeTitle = arrowRail.locator(
          '.project-showcase-item[data-active="true"] .project-card-title',
        );
        await expect(activeTitle).toHaveText("Software Engineering Playbook");
        await arrowPortfolio.tapWithTouch(
          arrowPage.getByRole("button", { name: "Proyecto siguiente" }),
        );
        await expect
          .poll(() => activeTitle.textContent())
          .toBe("Kurone-ko Timer");
        await expect(arrowRail.locator("[aria-current='true']")).toHaveCount(1);
        await expect(arrowPage.locator("dialog[open]")).toHaveCount(0);

        const swipePage = await context.newPage();
        await swipePage.emulateMedia({ reducedMotion: "reduce" });
        const swipePortfolio = new PortfolioPage(swipePage);
        await swipePortfolio.gotoShowcase();
        const swipeRail = swipePage.getByRole("list", { name: "Proyectos filtrados" });
        const swipeTitle = swipeRail.locator(
          '.project-showcase-item[data-active="true"] .project-card-title',
        );
        await expect(swipeTitle).toHaveText("Software Engineering Playbook");
        const railBox = await swipeRail.boundingBox();
        if (railBox === null) throw new Error("Expected carousel gesture surface.");
        const cdp = await context.newCDPSession(swipePage);
        await dispatchTouchDrag(
          cdp,
          1,
          railBox.x + railBox.width / 2,
          railBox.y + 40,
          -64,
          2,
        );
        await expect
          .poll(() => swipeTitle.textContent())
          .toBe("Kurone-ko Timer");
        await expect(swipeRail.locator("[aria-current='true']")).toHaveCount(1);
        await expect(swipePage.locator("dialog[open]")).toHaveCount(0);
      } finally {
        await context.close();
      }
    },
  );

  test(
    "keeps package security and automation exposure constraints visible",
    { tag: ["@medium", "@e2e", "@security", "@PORTFOLIO-E2E-004"] },
    async ({ page }) => {
      const portfolio = new PortfolioPage(page);
      const manifest = JSON.parse(await readFile("package.json", "utf8")) as {
        packageManager?: string;
        scripts?: Record<string, string>;
      };

      expect(manifest.packageManager).toMatch(/^pnpm@/);
      expect(manifest.scripts?.dev).toContain("--hostname 127.0.0.1");

      await portfolio.gotoPortfolio();
      await portfolio.expectNoUnsafeAutomationEndpoints();
    },
  );

  test(
    "audits first-view subtitle fitting after correction",
    { tag: ["@diagnostic", "@showcase", "@SUBTITLE-FIRST-VIEW-DIAGNOSTIC"] },
    async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.addInitScript(() => {
        const audit = {
          canvas: [] as Array<Record<string, unknown>>,
          fontFaces: [] as Array<Record<string, unknown>>,
          fonts: [] as Array<Record<string, unknown>>,
          frames: [] as Array<Record<string, unknown>>,
          mutations: [] as Array<Record<string, unknown>>,
          ranges: [] as Array<Record<string, unknown>>,
        };
        const now = () => Number(performance.now().toFixed(3));
        const textOf = (element: Element) => element.textContent?.trim() ?? "";
        const recordFrame = () => {
          const card = document.querySelector<HTMLElement>(
            '.project-showcase-item[data-active="true"] .project-card[data-card-presentation="media-title-bands"]',
          );
          const subtitle =
            card?.querySelector<HTMLElement>(
              ".project-card-subtitle .fitted-band-text-content",
            ) ?? null;
          const band =
            card?.querySelector<HTMLElement>('[data-card-band="bottom"]') ??
            null;
          if (card === null || subtitle === null || band === null) return;
          const style = getComputedStyle(subtitle);
          const bandRect = band.getBoundingClientRect();
          const range = document.createRange();
          if (subtitle.firstChild === null) return;
          range.selectNodeContents(subtitle.firstChild);
          const ink = range.getBoundingClientRect();
          const inlineInset =
            Number.parseFloat(
              style.getPropertyValue("--fitted-ink-inline-inset"),
            ) || 0;
          const blockInset =
            Number.parseFloat(
              style.getPropertyValue("--fitted-ink-block-inset"),
            ) || 0;
          audit.frames.push({
            card: textOf(card.querySelector(".project-card-title") ?? card),
            font: style.font,
            fontFamily: style.fontFamily,
            fontSize: Number.parseFloat(style.fontSize),
            fontStatus: document.fonts?.status ?? "unavailable",
            fontCheck: document.fonts?.check?.(style.font, textOf(subtitle)),
            fitReady: style.getPropertyValue("--fitted-font-size") !== "",
            height: ink.height,
            inlineInset,
            blockInset,
            opacity: style.opacity,
            safeBox: {
              bottom: bandRect.bottom - blockInset,
              height: bandRect.height - blockInset * 2,
              left: bandRect.left + inlineInset,
              right: bandRect.right - inlineInset,
              top: bandRect.top + blockInset,
              width: bandRect.width - inlineInset * 2,
            },
            safeGaps: {
              bottom: bandRect.bottom - blockInset - ink.bottom,
              left: ink.left - (bandRect.left + inlineInset),
              right: bandRect.right - inlineInset - ink.right,
              top: ink.top - (bandRect.top + blockInset),
            },
            subtitle: textOf(subtitle),
            textShadow: style.textShadow,
            textStrokeWidth: style.getPropertyValue("-webkit-text-stroke-width"),
            time: now(),
            visible:
              style.visibility !== "hidden" &&
              style.opacity !== "0" &&
              ink.width > 0,
            width: ink.width,
          });
        };
        const fonts = document.fonts;
        if (fonts !== undefined) {
          audit.fontFaces.push(
            ...[...fonts].map((face) => ({
              family: face.family,
              status: face.status,
              style: face.style,
              weight: face.weight,
            })),
          );
          const originalCheck = fonts.check.bind(fonts);
          fonts.check = (font: string, text?: string) => {
            const result = originalCheck(font, text);
            audit.fonts.push({
              method: "check",
              font,
              result,
              status: fonts.status,
              text,
              time: now(),
            });
            return result;
          };
          const originalLoad = fonts.load.bind(fonts);
          fonts.load = (font: string, text?: string) => {
            const started = performance.now();
            const promise = originalLoad(font, text);
            void promise.then(
              (faces) =>
                audit.fonts.push({
                  duration: Number((performance.now() - started).toFixed(3)),
                  faces: faces.length,
                  font,
                  method: "load-resolved",
                  status: fonts.status,
                  text,
                  time: now(),
                }),
              (error: unknown) =>
                audit.fonts.push({
                  duration: Number((performance.now() - started).toFixed(3)),
                  error: String(error),
                  font,
                  method: "load-rejected",
                  status: fonts.status,
                  text,
                  time: now(),
                }),
            );
            audit.fonts.push({
              font,
              method: "load-start",
              status: fonts.status,
              text,
              time: now(),
            });
            return promise;
          };
          for (const event of ["loading", "loadingdone", "loadingerror"]) {
            fonts.addEventListener(event, () =>
              audit.fonts.push({ method: event, status: fonts.status, time: now() }),
            );
          }
        }
        const originalMeasureText =
          CanvasRenderingContext2D.prototype.measureText;
        CanvasRenderingContext2D.prototype.measureText = function (text) {
          const metrics = originalMeasureText.call(this, text);
          const upperText = text.toLocaleUpperCase("es-CL");
          if (upperText.includes("NIÑO") || upperText.includes("RASTRO")) {
            audit.canvas.push({
              actualBoundingBoxAscent: metrics.actualBoundingBoxAscent,
              actualBoundingBoxDescent: metrics.actualBoundingBoxDescent,
              actualBoundingBoxLeft: metrics.actualBoundingBoxLeft,
              actualBoundingBoxRight: metrics.actualBoundingBoxRight,
              advance: metrics.width,
              font: this.font,
              letterSpacing: getComputedStyle(
                document.querySelector(".project-card-subtitle") ?? document.body,
              ).letterSpacing,
              text,
              time: now(),
            });
          }
          return metrics;
        };
        const originalRangeRect = Range.prototype.getBoundingClientRect;
        Range.prototype.getBoundingClientRect = function () {
          const rect = originalRangeRect.call(this);
          const text = this.toString();
          const upperText = text.toLocaleUpperCase("es-CL");
          if (upperText.includes("NIÑO") || upperText.includes("RASTRO")) {
            audit.ranges.push({
              height: rect.height,
              left: rect.left,
              right: rect.right,
              text,
              time: now(),
              top: rect.top,
              width: rect.width,
            });
          }
          return rect;
        };
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (
              mutation.target instanceof HTMLElement &&
              (mutation.target.classList.contains("project-card-subtitle") ||
                mutation.target.classList.contains("fitted-band-text-content"))
            ) {
              audit.mutations.push({
                attribute: mutation.attributeName,
                className: mutation.target.className,
                style: mutation.target.getAttribute("style"),
                time: now(),
              });
            }
          }
        });
        observer.observe(document, {
          attributes: true,
          attributeFilter: ["style", "data-active"],
          subtree: true,
        });
        Object.assign(window, { __subtitleFirstViewAudit: audit });
        const tick = () => {
          recordFrame();
          if (performance.now() < 30_000) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });

           await new PortfolioPage(page).seedValidProgression();
           await page.goto("/?view=showcase");
      await expect(
        page.locator(
          '.project-showcase-item[data-active="true"] .project-card[data-card-presentation="media-title-bands"]',
        ),
      ).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(1_500);

      const next = page.getByRole("button", { name: "Proyecto siguiente" });
      for (let index = 1; index < 7; index += 1) {
        await next.click();
        await page.waitForTimeout(1_500);
      }
      const previous = page.getByRole("button", { name: "Proyecto anterior" });
      for (let index = 1; index < 7; index += 1) {
        await previous.click();
        await page.waitForTimeout(1_500);
      }

      const audit = await page.evaluate(
        () => (window as Window & { __subtitleFirstViewAudit?: unknown }).__subtitleFirstViewAudit,
      );
      await writeFile(
        "artifacts/subtitle-first-view-stability/after-1280x800.json",
        JSON.stringify(audit, null, 2),
        "utf8",
      );
      const frames = (audit as { frames?: Array<Record<string, unknown>> })?.frames ?? [];
      const firstViewCards = frames.filter((frame) =>
        ["Elemental Queens", "Kurone-ko PymeFlow"].includes(String(frame.card)),
      );
      expect(firstViewCards.length).toBeGreaterThan(0);
      for (const frame of firstViewCards) {
        const safeGaps = frame.safeGaps as Record<string, number>;
        expect(frame.fitReady).toBe(true);
        expect(frame.fontStatus).toBe("loaded");
        expect(frame.fontCheck).toBe(true);
        expect(safeGaps.left).toBeGreaterThanOrEqual(0.5);
        expect(safeGaps.right).toBeGreaterThanOrEqual(0.5);
        expect(safeGaps.top).toBeGreaterThanOrEqual(0.5);
        expect(safeGaps.bottom).toBeGreaterThanOrEqual(0.5);
      }
      console.log(
        JSON.stringify({
          p4: frames.filter((frame) => String(frame.card).includes("Elemental Queens")),
          p6: frames.filter((frame) => String(frame.card).includes("PymeFlow")),
        }),
      );
    },
  );

  test(
    "persists subtitle activation metrics across the refined viewport matrix",
    { tag: ["@diagnostic", "@showcase", "@SUBTITLE-ACTIVATION-MATRIX"] },
    async ({ browser }) => {
      test.setTimeout(900_000);
      const viewports = [
        { height: 667, label: "375x667", width: 375 },
        { height: 720, label: "540x720", width: 540 },
        { height: 1180, label: "820x1180", width: 820 },
        { height: 600, label: "1024x600", width: 1024 },
        { height: 800, label: "1280x800", width: 1280 },
        { height: 768, label: "1366x768", width: 1366 },
        { height: 1080, label: "1920x1080", width: 1920 },
      ];
      const sequence = [1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1];
      const matrix: Array<{
        captures: SubtitleActivationMetrics[];
        sequence: number[];
        viewport: (typeof viewports)[number];
      }> = [];
      const refinedArtifacts = "artifacts/subtitle-first-view-stability/refined";
      await mkdir(refinedArtifacts, { recursive: true });

      for (const viewport of viewports) {
        const context = await browser.newContext({
          hasTouch: viewport.width <= 1024,
          viewport,
        });
        const page = await context.newPage();
        await page.addInitScript(() => {
          window.__fittedBandTextDebugEvents = [];
        });
        const captures: SubtitleActivationMetrics[] = [];
        const activationCounts = new Map<number, number>();

        try {
          await page.emulateMedia({ reducedMotion: "no-preference" });
          await page.goto("/?view=showcase");
          await expectShowcaseCardReady(page);
          await activateMusicThroughVoid(page);
          await page.getByRole("button", { name: /LIMPIAR FILTROS/ }).click();
          await expectShowcaseCardReady(page);
          await page.waitForTimeout(1_000);

          for (let index = 0; index < sequence.length; index += 1) {
            const expectedProject = sequence[index]!;
            await expect
              .poll(
                () =>
                  page.evaluate(
                    () =>
                      [...document.querySelectorAll(".project-showcase-item")].findIndex(
                        (item) => item.getAttribute("data-active") === "true",
                      ) + 1,
                  ),
                { timeout: 10_000 },
              )
              .toBe(expectedProject);
            await page.waitForTimeout(800);
            await expect
              .poll(
                () =>
                  page.evaluate(() => {
                    const subtitle = document.querySelector<HTMLElement>(
                      '.project-showcase-item[data-active="true"] .project-card-subtitle .fitted-band-text-content',
                    );
                    if (subtitle === null) return false;
                    const style = getComputedStyle(subtitle);
                    return (
                      style.getPropertyValue("--fitted-font-size") !== "" &&
                      document.fonts.check(style.font, subtitle.textContent ?? "") &&
                      style.opacity !== "0"
                    );
                  }),
                { timeout: 10_000 },
              )
              .toBe(true);

            const activation = (activationCounts.get(expectedProject) ?? 0) + 1;
            activationCounts.set(expectedProject, activation);
            const metrics = await readActiveSubtitleMetrics(page, activation);
            expect(metrics.project).toBe(expectedProject);
            expect(metrics.fontSize).toBeGreaterThan(0);
            expect(metrics.fontCheck).toBe(true);
            expect(metrics.fitDebug).not.toBeNull();
            const proof = metrics.fitDebug?.proof as
              | {
                  maxedOut: boolean;
                  nextCandidate: number | null;
                  nextFits: boolean | null;
                }
              | null;
            expect(proof).not.toBeNull();
            if (proof?.maxedOut) {
              expect(proof.nextCandidate).toBeNull();
              expect(proof.nextFits).toBeNull();
            } else {
              expect(proof?.nextCandidate).not.toBeNull();
              expect(proof?.nextFits).toBe(false);
            }
            expect(metrics.visible).toBe(true);
            expect(metrics.overflow).toBe(false);
            expect(metrics.safeGaps.left).toBeGreaterThanOrEqual(0.5);
            expect(metrics.safeGaps.right).toBeGreaterThanOrEqual(0.5);
            expect(metrics.safeGaps.top).toBeGreaterThanOrEqual(0.5);
            expect(metrics.safeGaps.bottom).toBeGreaterThanOrEqual(0.5);
            const smallCard =
              viewport.label === "375x667" || viewport.label === "1024x600";
            // Very small cards use a proportional optical floor; normal cards require 4px.
            const effectGapFloor = smallCard
              ? Math.max(1, metrics.band.height * 0.08)
              : 4;
            expect(metrics.gaps.left).toBeGreaterThanOrEqual(effectGapFloor);
            expect(metrics.gaps.right).toBeGreaterThanOrEqual(effectGapFloor);
            expect(metrics.gaps.top).toBeGreaterThanOrEqual(effectGapFloor);
            expect(metrics.gaps.bottom).toBeGreaterThanOrEqual(effectGapFloor);
            if (viewport.width === 1280 && viewport.height === 800) {
              if (expectedProject === 4 && activation === 2)
                expect(metrics.fontSize).toBeGreaterThanOrEqual(13.84 * 0.95);
              if (expectedProject === 6 && activation === 2)
                expect(metrics.fontSize).toBeGreaterThanOrEqual(12.58 * 0.95);
            }
            captures.push(metrics);

            if (
              (expectedProject === 4 || expectedProject === 6) &&
              activation <= 2
            ) {
              await page.screenshot({
                fullPage: false,
                path: `${refinedArtifacts}/${viewport.label}-p${expectedProject}-activation-${activation}.png`,
                scale: "css",
              });
              await page
                .locator(
                  '.project-showcase-item[data-active="true"] [data-card-band="bottom"]',
                )
                .screenshot({
                  path: `${refinedArtifacts}/${viewport.label}-p${expectedProject}-activation-${activation}-subtitle-band.png`,
                  scale: "css",
                });
            }

            const nextProject = sequence[index + 1];
            if (nextProject === undefined) continue;
            await page
              .getByRole("button", {
                name: nextProject > expectedProject ? "Proyecto siguiente" : "Proyecto anterior",
              })
              .click();
          }

           for (let project = 1; project <= 8; project += 1) {
            const projectCaptures = captures.filter(
              (capture) => capture.project === project,
            );
            if (projectCaptures.length < 2) continue;
            const first = projectCaptures[0]!;
            const second = projectCaptures[1]!;
            expect(Math.abs(first.fontSize - second.fontSize)).toBeLessThanOrEqual(
              0.25,
            );
            for (const property of [
              "bottom",
              "height",
              "left",
              "right",
              "top",
              "width",
            ] as const) {
              expect(second.band[property]).toBeCloseTo(first.band[property], 1);
            }
          }
          const viewportEvidence = { captures, sequence, viewport };
          matrix.push(viewportEvidence);
          await writeFile(
            `${refinedArtifacts}/matrix-${viewport.label}.json`,
            JSON.stringify(viewportEvidence, null, 2),
            "utf8",
          );
        } finally {
          await context.close();
        }
      }

      await writeFile(
        `${refinedArtifacts}/subtitle-activation-matrix.json`,
        JSON.stringify({ matrix, sequence }, null, 2),
        "utf8",
      );
      expect(matrix).toHaveLength(viewports.length);
      expect(matrix.every(({ captures }) => captures.length === sequence.length)).toBe(
        true,
      );
    },
  );
});
