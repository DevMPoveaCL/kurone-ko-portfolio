import { describe, expect, it } from "vitest";
import { PROJECT_TIER } from "./vault-types";
import { PROJECTS, getProjectTierDetails, getVisibleProjects } from "./project-data";

describe("project narrative data", () => {
  it("returns tier, reason, and status for a project tier query", () => {
    const details = getProjectTierDetails("software-engineering-playbook");

    expect(details).toEqual(
      expect.objectContaining({
        tier: PROJECT_TIER.VISIBLE,
        reason: expect.any(String),
        status: expect.any(String),
      }),
    );
    expect(details?.reason.trim()).not.toBe("");
    expect(details?.status.trim()).not.toBe("");
  });

  it("keeps technology evidence free of local source metadata", () => {
    for (const project of PROJECTS) {
      for (const evidence of project.technologyMetadata.evidence) {
        expect(evidence).toEqual({
          detail: evidence.detail,
          filterId: evidence.filterId,
        });
      }
    }
  });

  it("initializes visible projects in the approved narrative order", () => {
    expect(getVisibleProjects().map((project) => project.id)).toEqual([
      "software-engineering-playbook",
      "timer",
      "farmacia-linlin",
      "elemental-tcg",
      "alarm",
      "pymeflow",
      "filter-calls",
      "github-activity",
    ]);
  });

  it("keeps the approved alternate descriptions exact for Projects 1 and 4", () => {
    expect(PROJECTS.find((project) => project.id === "software-engineering-playbook")?.overviewDescription).toBe(
      "Guía que organiza fundamentos de ingeniería de software en rutas de aprendizaje progresivas y aplicables. Cada tema conecta arquitectura, testing y decisiones de entrega para convertir estudio disperso en un criterio de construcción revisable.",
    );
    expect(PROJECTS.find((project) => project.id === "elemental-tcg")?.overviewDescription).toBe(
      "Landing narrativa para un juego de cartas táctico, construida con Astro. La interfaz convierte mitología, estrategia y exploración visual en una entrada clara hacia el sistema del juego.",
    );
  });

  it("keeps the twelve-project showcase scope while excluding only Portfolio", () => {
    expect(PROJECTS.filter((project) => project.showcaseEligible).map((project) => project.id)).toEqual([
      "software-engineering-playbook",
      "timer",
      "farmacia-linlin",
      "elemental-tcg",
      "alarm",
      "pymeflow",
      "filter-calls",
      "github-activity",
      "kuroneko-pos",
      "kuroneko-sii",
      "kuroneko-explorermcp",
      "translator",
      "teacher",
    ]);
    expect(PROJECTS.find((project) => project.id === "portfolio")?.showcaseEligible).toBe(false);
  });

  it("maps the first five visible projects to their demo previews", () => {
    const previewByProject = Object.fromEntries(
      getVisibleProjects().slice(0, 5).map((project) => [project.id, project.preview]),
    );

    expect(Object.keys(previewByProject)).toEqual([
      "software-engineering-playbook",
      "timer",
      "farmacia-linlin",
      "elemental-tcg",
      "alarm",
    ]);

    for (const [index, [projectId, preview]] of Object.entries(previewByProject).entries()) {
      expect(preview.source).toBe("demo");
      expect(preview.image).toContain(`/previews/${projectId}/project${index + 1}-preview.webp`);
      expect(preview.video?.src).toContain(`/previews/${projectId}/project${index + 1}-video.webm`);
      expect(preview.video?.mobile?.src).toContain(`/previews/${projectId}/project${index + 1}-video-mobile.webm`);
    }

    expect(getVisibleProjects().slice(0, 5).every((project) =>
      project.cardVisual?.presentation === "media-title-bands" && project.cardVisual.frame === "ornate",
    )).toBe(true);

    expect(previewByProject["farmacia-linlin"]?.focal).toEqual({ x: 0.5, y: 0.2, scale: 1 });
  });

  it("keeps external navigation purpose copy free of modal grammar", () => {
    const project = PROJECTS.find((candidate) => candidate.id === "software-engineering-playbook");

    expect(project?.stackPresentation?.cta?.confirmationPurpose).toBe(
      "Explorarás Software Engineering Playbook en su repositorio de GitHub",
    );
    expect(project?.stackPresentation?.cta?.confirmationPurpose).not.toMatch(/pestaña|portfolio|Github/u);
  });

  it("provides the approved Timer modal presentations and narrative", () => {
    const timer = PROJECTS.find((project) => project.id === "timer");
    const projectOne = PROJECTS.find(
      (project) => project.id === "software-engineering-playbook",
    );
    expect(timer?.modalPresentation).toEqual(expect.objectContaining({
      infoKicker: "HISTORIA DEL PROYECTO",
      infoTitle: "KURONE-KO TIMER",
      infoQuote:
        "Había una vez un equipo que quiso construir una herramienta de productividad con muchas funcionalidades, pero la deuda técnica atacó y la idea creció más rápido que nuestra capacidad de terminarla.",
    }));
    expect(projectOne?.modalPresentation?.infoQuote).toBe(
      "A veces, el verdadero problema no es la falta de información, sino su inmensidad.",
    );
    expect(projectOne?.modalPresentation?.infoKicker).toBe(
      "Los caminos que me gustaría recorrer",
    );
    expect(projectOne?.front.eyebrow).toBe("Los caminos que me gustaría recorrer");
    expect(projectOne?.loreSections?.[0]?.paragraphs[0]).toMatch(/^En la antigua Grecia/u);
    expect(projectOne?.loreSections?.[1]?.heading).toBe("Kosmos");
    expect(timer?.loreSections?.[0]?.paragraphs[0]).toMatch(/^Fui partícipe/u);
    expect(timer?.loreSections).toEqual([
      {
        heading: "Génesis",
        paragraphs: [
          "Fui partícipe de un bootcamp de programación en el que, como proyecto integrador, se nos pidió formar equipos de trabajo, desarrollar y presentar una aplicación que reuniera los aprendizajes obtenidos durante el proceso.",
        ],
        paragraphHighlights: [[
          { text: "bootcamp de programación" },
          { text: "proyecto integrador" },
        ]],
      },
      {
        heading: "Metábasis",
        paragraphs: [
          "Tal vez por nuestra inocencia e inexperiencia, intentamos crear una herramienta de productividad demasiado ambiciosa… pero el alcance creció demasiado y quedó inconclusa.",
          "Años después quise retomarla con una visión más simple, enfocada en organizar mis sesiones de estudio y desarrollo.",
        ],
        paragraphHighlights: [
          [{ text: "herramienta de productividad" }, { text: "alcance" }],
          [{ text: "visión más simple" }],
        ],
      },
    ]);
    expect(timer?.stackPresentation).toEqual(expect.objectContaining({
      kicker: "TECNOLOGÍAS Y FUNCIONAMIENTO",
      title: "FOCO SIN DISTRACCIONES",
      introduction:
        "Kurone-ko Timer es una aplicación Pomodoro de escritorio para Windows. Permite organizar sesiones de foco y descanso desde una ventana principal y seguir el tiempo en una ventana flotante compacta.",
      introductionHighlights: [
        { text: "Kurone-ko Timer" },
        { text: "Pomodoro" },
        { text: "Windows" },
      ],
    }));
    expect(timer?.stackPresentation?.evidence).toBe(
      "Control completo con teclado o ratón · ventanas arrastrables.",
    );
    expect(timer?.stackPresentation?.blocks).toEqual([
      {
        heading: "Dashboard y widget flotante",
        description:
          "La ventana principal permite configurar los tiempos de foco y descanso, definir el objetivo diario y consultar el historial. La ventana flotante muestra el tiempo restante y reúne los controles básicos y la música.",
        descriptionHighlights: [
          { text: "objetivo diario" },
          { text: "historial" },
          { text: "música" },
        ],
      },
      {
        heading: "Interfaz y estados de sesión",
        description:
          "React construye ambas interfaces. TypeScript modela las sesiones, los ajustes y el historial; Zustand separa el estado del temporizador, la configuración, la música y el onboarding.",
        descriptionHighlights: [
          { text: "React" },
          { text: "TypeScript" },
          { text: "Zustand" },
        ],
      },
      {
        heading: "Ventanas nativas y datos locales",
        description:
          "Tauri 2 crea las ventanas de Windows. Rust guarda el temporizador, el historial, la configuración y la posición de cada ventana en archivos JSON locales.",
        descriptionHighlights: [
          { text: "Tauri 2" },
          { text: "Rust" },
          { text: "JSON" },
        ],
      },
      {
        heading: "Pruebas del comportamiento",
        description:
          "Verifiqué la lógica Pomodoro y sus componentes con Vitest. También probé con Playwright las dos ventanas reales, sus controles, la navegación y el cierre.",
        descriptionHighlights: [{ text: "Vitest" }, { text: "Playwright" }],
      },
    ]);
    expect(timer?.stackPresentation?.technicalBase).toBeUndefined();
    expect(projectOne?.stackPresentation?.technicalBase).toEqual({
      heading: "Base técnica",
      value: "Markdown · Git · GitHub · GitHub Actions · markdownlint · Lychee",
      valueHighlights: [],
    });
    expect(projectOne?.stackPresentation?.evidence).toBe(
      "13 temas · 39 módulos progresivos · documentación en inglés",
    );
  });

  it("provides the approved Farmacias LinLin modal presentations and production CTA", () => {
    const farmacia = PROJECTS.find((project) => project.id === "farmacia-linlin");

    expect(farmacia?.modalPresentation).toEqual({
      infoAsset: "/assets/projects/previews/software-engineering-playbook/info.webp",
      infoKicker: "UNA FARMACIA, UN NUEVO CANAL",
      infoTitle: "FARMACIAS LINLIN",
      infoQuote:
        "Hay proyectos que no nacen desde una idea llamativa, sino desde procesos cotidianos que necesitan encontrar una nueva forma de llegar a las personas.",
      stackAsset: "/assets/projects/previews/software-engineering-playbook/stack.webp",
    });
    expect(farmacia?.loreSections).toEqual([
      {
        heading: "ANANKE",
        paragraphs: [
          "Farmacias LinLin nació de una necesidad concreta: una farmacia física debía abrir un canal de venta electrónico. El desafío no era solo llevar su catálogo a internet, sino encontrar una forma de vender en línea sin perder el cuidado y las reglas propias de una farmacia.",
        ],
        paragraphHighlights: [[
          { text: "Farmacias LinLin" },
          { text: "canal de venta electrónico" },
          { text: "reglas propias de una farmacia" },
        ]],
      },
      {
        heading: "NOMOS",
        paragraphs: [
          "La experiencia debía contemplar condiciones de venta, recetas, stock, retiro o despacho y responsabilidades distintas para clientes, administración, químicos farmacéuticos y personal de reparto.",
          "Construirla me hizo entender que, cuando se trabaja con medicamentos y responsabilidades reales, cada decisión técnica importa. Una validación a tiempo, una instrucción clara o un permiso bien definido pueden proteger tanto a quien compra como a quien prepara y entrega el pedido.",
        ],
        paragraphHighlights: [
          [
            { text: "recetas" },
            { text: "retiro o despacho" },
            { text: "clientes" },
            { text: "administración" },
            { text: "químicos farmacéuticos" },
            { text: "personal de reparto" },
          ],
          [{ text: "validación a tiempo" }, { text: "permiso bien definido" }],
        ],
      },
    ]);
    expect(farmacia?.stackPresentation).toEqual({
      kicker: "TECNOLOGÍA Y OPERACIÓN FARMACÉUTICA",
      title: "COMERCIO BAJO REGLAS REALES",
      introduction:
        "Farmacias LinLin conecta la venta online con la operación de una farmacia física. El sistema organiza catálogo, pedidos, recetas y despachos aplicando condiciones de venta y permisos según cada rol.",
      introductionHighlights: [
        { text: "Farmacias LinLin" },
        { text: "permisos según cada rol" },
      ],
      badges: ["Angular 18", "Ionic 8", "TypeScript", "RxJS", "Firebase", "Capacitor", "Playwright"],
      blocks: [
        {
          heading: "Experiencias según el rol",
          description:
            "Angular e Ionic organizan áreas diferenciadas para clientes, administración, químicos farmacéuticos y personal de reparto. Las rutas cambian según los permisos de cada usuario.",
          descriptionHighlights: [{ text: "Angular e Ionic" }],
        },
        {
          heading: "Catálogo, pedidos y stock",
          description:
            "Firestore almacena productos y pedidos. Los servicios de Angular y RxJS coordinan el carrito, vuelven a validar el stock y actualizan las existencias mediante una transacción al confirmar la compra.",
          descriptionHighlights: [
            { text: "Firestore" },
            { text: "Angular y RxJS" },
          ],
        },
        {
          heading: "Condiciones de venta y recetas",
          description:
            "El checkout diferencia venta directa, receta simple y receta retenida. Las recetas pueden adjuntarse para revisión; las retenidas requieren retiro presencial, RUT y verificación posterior por personal autorizado.",
          descriptionHighlights: [{ text: "receta retenida" }],
        },
        {
          heading: "Servicios y verificación",
          description:
            "Firebase gestiona autenticación, datos, archivos, roles y notificaciones; Capacitor conecta funciones nativas como mapas, geolocalización y autenticación externa. Las pruebas unitarias, E2E y de reglas validan los flujos críticos.",
          descriptionHighlights: [
            { text: "Firebase" },
            { text: "Capacitor" },
            { text: "geolocalización y autenticación externa" },
            { text: "pruebas unitarias, E2E" },
          ],
        },
      ],
      evidence: "Cada pedido conserva su estado, historial y evidencia durante todo el proceso.",
      evidenceHighlights: [{ text: "historial y evidencia" }],
      cta: {
        label: "Ver aplicación",
        href: "https://farmacialinlin.web.app",
        confirmationPurpose: "Explorarás Farmacias LinLin en su aplicación web",
      },
    });
    expect(Object.keys(farmacia?.stackPresentation ?? {})).toEqual([
      "kicker",
      "title",
      "introduction",
      "introductionHighlights",
      "blocks",
      "evidence",
      "evidenceHighlights",
      "cta",
      "badges",
    ]);
    expect(farmacia?.stackPresentation?.cta?.confirmationPurpose).not.toMatch(/pestaña/u);
    expect(farmacia?.productionUrl).toBe("https://farmacialinlin.web.app");
  });

  it("provides the approved Elemental Queens modal presentations and production CTA", () => {
    const elemental = PROJECTS.find((project) => project.id === "elemental-tcg");

    expect(elemental?.modalPresentation).toEqual({
      infoAsset: "/assets/projects/previews/software-engineering-playbook/info.webp",
      infoKicker: "UNA IDEA QUE CRECIÓ CONMIGO",
      infoTitle: "ELEMENTAL QUEENS",
      infoQuote:
        "Hay ideas que no desaparecen al crecer; esperan hasta que aprendemos cómo empezar a construirlas.",
      stackAsset: "/assets/projects/previews/software-engineering-playbook/stack.webp",
    });
    expect(elemental?.loreSections).toEqual([
      {
        heading: "MNEME",
        paragraphs: [
          "Desde niño crecí leyendo historias mitológicas a través de Mitos y Leyendas, un juego de cartas que me encantaba jugar con mis amigos. Con el tiempo también jugué Yu-Gi-Oh!, Pokémon y Magic, y cada uno alimentó mi gusto por las cartas, sus ilustraciones y las historias que podían contar.",
          "Asimismo, durante mi adolescencia comencé a jugar ajedrez y encontré otra forma de aprender sobre estrategia y lógica. Me gusta pensar cada movimiento con calma, anticipar posibilidades y ordenar mis ideas antes de decidir.",
          "En esa misma etapa empecé a fijarme más en las páginas web. Algunos efectos visuales, novedosos para la época, se quedaron en mi memoria porque resolvían interacciones de una manera que nunca había visto. Esa curiosidad despertó mi interés por entender cómo se construían esas experiencias desde el frontend.",
        ],
        paragraphHighlights: [
          [
            { text: "historias mitológicas" },
            { text: "Mitos y Leyendas" },
            { text: "Yu-Gi-Oh!" },
            { text: "Pokémon" },
            { text: "Magic" },
            { text: "ilustraciones" },
            { text: "historias que podían contar" },
          ],
          [
            { text: "ajedrez" },
            { text: "estrategia y lógica" },
            { text: "pensar cada movimiento" },
            { text: "anticipar posibilidades" },
            { text: "ordenar mis ideas" },
          ],
          [
            { text: "páginas web" },
            { text: "efectos visuales" },
            { text: "novedosos para la época" },
            { text: "nunca había visto" },
            { text: "frontend" },
          ],
        ],
      },
      {
        heading: "POIESIS",
        paragraphs: [
          "Elemental Queens nació cuando decidí diseñar una landing page que reuniera y diera a conocer mis principales hobbies en un solo lugar. La mitología, los juegos de cartas y el ajedrez dieron forma a su universo, mientras mi interés por las experiencias web definió cómo presentarlo.",
          "Con este proyecto muestro una parte más personal de mí y, al mismo tiempo, cómo transformo una idea propia en una solución visual y funcional mediante el desarrollo frontend.",
        ],
        paragraphHighlights: [
          [
            { text: "Elemental Queens" },
            { text: "landing page" },
            { text: "mis principales hobbies" },
            { text: "mitología" },
            { text: "juegos de cartas" },
            { text: "ajedrez" },
            { text: "experiencias web" },
          ],
          [
            { text: "parte más personal de mí" },
            { text: "idea propia" },
            { text: "solución visual y funcional" },
            { text: "desarrollo frontend" },
          ],
        ],
      },
    ]);
    const loreCopy = elemental?.loreSections?.flatMap((section) => section.paragraphs).join(" ") ?? "";
    expect(loreCopy).not.toContain("Con el tiempo también conocí Yu-Gi-Oh!, Pokémon y Magic");
    expect(loreCopy).not.toContain(
      "En la adolescencia empecé a jugar ajedrez y encontré otra forma de disfrutar la estrategia. Me gustaba pensar cada movimiento con calma, anticipar posibilidades y ordenar mis ideas antes de decidir.",
    );
    expect(loreCopy).not.toContain("alimentó ese gusto");
    expect(loreCopy).not.toContain("quise conocerme mejor");
    expect(loreCopy).not.toContain("me permitiera explorarlos");
    expect(loreCopy).not.toContain("En la adolescencia descubrí el ajedrez. Me gustaba pensar distintas jugadas, reconocer patrones y ordenar una estrategia antes de mover cada pieza.");
    expect(loreCopy).not.toContain("Por esos años también encontré páginas web con efectos visuales que, para la época, nunca había visto. Me llamaban la atención porque resolvían interacciones de una forma novedosa, ingeniosa y efectiva desde el frontend; por eso varias se quedaron en mi retina.");
    expect(loreCopy).not.toContain("Magic y Mitos y Leyendas");
    expect(loreCopy).not.toContain("juegos TCG");
    expect(loreCopy).not.toContain("páginas web memorables");
    expect(loreCopy).not.toContain("entrando por un momento en otro mundo");
    expect(loreCopy).not.toContain("un solo mundo creado por mí");
    expect(loreCopy).not.toContain("sueño de infancia");
    expect(loreCopy).not.toContain("intentar sorprender");
    expect(loreCopy).not.toContain("entraba en otro mundo");
    expect(loreCopy).not.toContain("provocar esa misma sensación");
    expect(loreCopy).not.toContain("fueron pasatiempos separados");
    expect(elemental?.stackPresentation).toEqual({
      kicker: "TECNOLOGÍA Y NARRATIVA INTERACTIVA",
      title: "UN UNIVERSO TÁCTICO EN LA WEB",
      introduction:
        "Construí Elemental Queens como una landing conceptual que presenta la identidad, las cartas y las reglas fundamentales de un futuro videojuego mediante una experiencia web navegable.",
      introductionHighlights: [
        { text: "Elemental Queens" },
        { text: "landing conceptual" },
      ],
      badges: ["Astro 6", "TypeScript", "Tailwind CSS 4", "Vite 7", "Playwright", "WCAG", "Cloudflare Pages"],
      blocks: [
        {
          heading: "Accesibilidad desde el diseño",
          description:
            "Apliqué criterios WCAG mediante navegación por teclado, foco visible, regiones anunciadas con aria-live y controles táctiles accesibles. También incorporé un control para detener el video y respeté la preferencia de movimiento reducido del sistema.",
          descriptionHighlights: [
            { text: "criterios WCAG" },
            { text: "navegación por teclado" },
            { text: "aria-live" },
            { text: "movimiento reducido" },
          ],
        },
        {
          heading: "Arquitectura visual y rendimiento",
          description:
            "Construí la experiencia por componentes con Astro 6 y desarrollé su sistema visual con Tailwind CSS 4 sobre Vite 7. Preparé variantes WebP responsive, precarga selectiva y doble buffer para mantener estables las transiciones entre cartas.",
          descriptionHighlights: [
            { text: "Astro 6" },
            { text: "Tailwind CSS 4" },
            { text: "Vite 7" },
            { text: "WebP responsive" },
            { text: "doble buffer" },
          ],
        },
        {
          heading: "El diseño del juego convertido en contenido",
          description:
            "Modelé con TypeScript el contenido que presenta las cinco categorías actuales: Queens, aliados, torres, talismanes y energías. Organicé la landing para explicar sus cuatro afinidades elementales y el campo de batalla inspirado en posiciones del ajedrez.",
          descriptionHighlights: [
            { text: "TypeScript" },
            { text: "Queens" },
            { text: "aliados" },
            { text: "torres" },
            { text: "talismanes" },
            { text: "energías" },
            { text: "campo de batalla" },
            { text: "ajedrez" },
          ],
        },
        {
          heading: "Verificación y publicación",
          description:
            "Revisé con Playwright la navegación, los diálogos, los hotspots y el comportamiento responsive en móvil y escritorio. También creé contratos QA para validar la estructura y los recursos visuales antes de publicar la landing en Cloudflare Pages.",
          descriptionHighlights: [
            { text: "Playwright" },
            { text: "contratos QA" },
            { text: "Cloudflare Pages" },
          ],
        },
      ],
      evidence:
        "E2E EN MÓVIL Y ESCRITORIO · ASSETS WEBP DE 300 A 1600 PX · DESPLIEGUE EN CLOUDFLARE PAGES.",
      cta: {
        label: "Ver Landing Page",
        href: "https://kurone-ko-elementaltcg.pages.dev/",
        confirmationPurpose: "Explorarás Elemental Queens en su despliegue en producción",
      },
    });
    expect(Object.keys(elemental?.stackPresentation ?? {})).toEqual([
      "kicker",
      "title",
      "introduction",
      "introductionHighlights",
      "blocks",
      "evidence",
      "cta",
      "badges",
    ]);
    const stack = elemental?.stackPresentation;
    expect(stack?.badges?.every((badge) =>
      stack.blocks.some((block) => block.description.includes(badge)),
    )).toBe(true);
    const modalCopy = [
      stack?.introduction,
      stack?.evidence,
      ...(stack?.blocks.map((block) => block.description) ?? []),
      ...(elemental?.loreSections?.flatMap((section) => section.paragraphs) ?? []),
    ].join(" ");
    expect(modalCopy).not.toMatch(/certificad|jugable|backend|multijugador|newsletter|release|demo\b/iu);
    expect(elemental?.productionUrl).toBe("https://kurone-ko-elementaltcg.pages.dev/");
  });

  it("provides the approved Kurone-ko Alarm modal presentations and truthful scope", () => {
    const alarm = PROJECTS.find((project) => project.id === "alarm");

    expect(alarm?.modalPresentation).toEqual({
      infoAsset: "/assets/projects/previews/software-engineering-playbook/info.webp",
      infoKicker: "AYUDANDO A UN AMIGO",
      infoTitle: "KURONE-KO ALARM",
      infoQuote:
        "Cada semana, una nueva planilla significaba volver a configurar todas las alarmas.",
      stackAsset: "/assets/projects/previews/software-engineering-playbook/stack.webp",
    });
    expect(alarm?.loreSections).toEqual([
      {
        heading: "GÉNESIS",
        paragraphs: [
          "Un amigo cercano trabajaba de noche con turnos rotativos y descansos variables. Cada semana recibía sus horarios en una planilla Excel y debía configurar las alarmas una por una en su celular.",
          "Quise ayudarlo construyendo una aplicación que pudiera leer esos horarios y preparar las alarmas automáticamente. Como una fecha o una hora incorrecta podía afectar su descanso o su llegada al trabajo, mantuve una revisión manual antes de confirmar cada planificación.",
        ],
        paragraphHighlights: [
          [
            { text: "amigo cercano" },
            { text: "turnos rotativos" },
            { text: "planilla Excel" },
            { text: "una por una" },
          ],
          [
            { text: "ayudarlo" },
            { text: "preparar las alarmas" },
            { text: "revisión manual" },
            { text: "cada planificación" },
          ],
        ],
      },
      {
        heading: "PARADOSIS",
        paragraphs: [
          "Cuando la idea le gustó, me pidió que le enseñara cómo estaba construida. Le fui explicando el proyecto paso a paso y finalmente le dejé un MVP para que pudiera continuar revisándolo, corrigiendo errores y aprendiendo desde una base funcional.",
          "Para mí, el proyecto terminó siendo más que automatizar alarmas. También fue una oportunidad para ordenar lo que sabía, explicarlo con claridad y dejar una solución que otra persona pudiera comprender y seguir desarrollando.",
        ],
        paragraphHighlights: [
          [
            { text: "paso a paso" },
            { text: "MVP" },
            { text: "corrigiendo errores" },
            { text: "base funcional" },
          ],
          [
            { text: "ordenar lo que sabía" },
            { text: "explicarlo con claridad" },
            { text: "otra persona pudiera comprender" },
            { text: "seguir desarrollando" },
          ],
        ],
      },
    ]);
    expect(alarm?.stackPresentation).toEqual({
      kicker: "SOLUCIÓN PARA UNA RUTINA COTIDIANA",
      title: "DE PLANILLA A ALARMA",
      introduction:
        "Construí Kurone-ko Alarm para transformar la planilla semanal de un trabajador con turnos rotativos en alarmas revisables que se programan directamente en su dispositivo Android, evitando configurarlas una por una.",
      introductionHighlights: [
        { text: "Kurone-ko Alarm" },
        { text: "turnos rotativos" },
        { text: "alarmas revisables" },
        { text: "dispositivo Android" },
        { text: "una por una" },
      ],
      badges: ["Flutter", "Dart", "Riverpod", "Drift", "SQLite", "Excel", "Kotlin", "Android"],
      blocks: [
        {
          heading: "Importación con límites visibles",
          description:
            "Implementé la lectura de archivos Excel para convertir las filas de una planilla en horarios editables. También desarrollé una ruta de OCR local con Google ML Kit, aunque esa alternativa todavía no está disponible en la versión 1.0.",
          descriptionHighlights: [
            { text: "Excel" },
            { text: "horarios editables" },
            { text: "OCR local" },
            { text: "Google ML Kit" },
            { text: "versión 1.0" },
          ],
        },
        {
          heading: "Revisar antes de automatizar",
          description:
            "Construí la interfaz con Flutter y Dart, y utilicé Riverpod para controlar importación, revisión y errores. Antes de confirmar, la persona puede corregir fechas y horas; también bloqueé datos incompletos, formatos inválidos y alarmas que quedaron en el pasado.",
          descriptionHighlights: [
            { text: "Flutter" },
            { text: "Dart" },
            { text: "Riverpod" },
            { text: "corregir fechas y horas" },
            { text: "bloqueé datos incompletos" },
          ],
        },
        {
          heading: "Estado local y trazable",
          description:
            "Guardé borradores, planes y cambios de estado mediante Drift y SQLite. Así recupero alarmas activas, distingo las descartadas o perdidas y mantengo un historial local de 24 horas sin depender de cuentas ni servicios remotos.",
          descriptionHighlights: [
            { text: "Drift" },
            { text: "SQLite" },
            { text: "alarmas activas" },
            { text: "historial local" },
            { text: "sin depender de cuentas" },
          ],
        },
        {
          heading: "Integración nativa y verificación",
          description:
            "Conecté Flutter con Kotlin y Android mediante MethodChannel para programar alarmas exactas, activar sonido y vibración, avisar en la pantalla bloqueada y restaurarlas después de reiniciar el dispositivo. Protegí las reglas principales con flutter_test y Mocktail.",
          descriptionHighlights: [
            { text: "Kotlin" },
            { text: "Android" },
            { text: "MethodChannel" },
            { text: "alarmas exactas" },
            { text: "restaurarlas" },
            { text: "flutter_test" },
            { text: "Mocktail" },
          ],
        },
      ],
      evidence:
        "EXCEL REVISABLE · SIN INTERNET NI LLM · PERSISTENCIA TRAS REINICIO · HISTORIAL ALARMAS 24 HORAS.",
      cta: {
        label: "Ver repositorio",
        href: "https://github.com/DevMPoveaCL/kurone-ko-alarm",
        confirmationPurpose: "Explorarás Kurone-ko Alarm en su repositorio de GitHub",
      },
    });
    expect(alarm?.productionUrl).toBeUndefined();
    const stack = alarm?.stackPresentation;
    expect(stack?.technicalBase).toBeUndefined();
    expect(stack?.badges?.every((badge) =>
      stack.blocks.some((block) => block.description.includes(badge)),
    )).toBe(true);
    const modalCopy = [
      stack?.introduction,
      stack?.evidence,
      ...(stack?.blocks.map((block) => block.description) ?? []),
      ...(alarm?.loreSections?.flatMap((section) => section.paragraphs) ?? []),
    ].join(" ");
    expect(alarm?.loreSections?.map((section) => section.heading)).not.toContain("AITIA");
    expect(stack?.evidence).not.toMatch(/PREAVISO 1 MINUTO ANTES|RESTAURACIÓN TRAS EL REINICIO|HISTORIAL LOCAL DE 24 HORAS/iu);
    expect(modalCopy).not.toMatch(/publicad|producción|multiplataforma|cross-platform|backend|cloud|uso diario|todos los días/iu);
  });

  it("keeps the first five titles and narratives attached to the correct projects", () => {
    const firstFive = getVisibleProjects().slice(0, 5);

    expect(firstFive.map((project) => project.front.title)).toEqual([
      "Software Engineering Playbook",
      "Kurone-ko Timer",
      "E-commerce Farmacia",
      "Elemental Queens",
      "Kurone-ko Alarm",
    ]);
    expect(firstFive[2]?.back.details.join(" ")).toMatch(/Farmacia Linlin|gestión|inventario/i);
    expect(firstFive[3]?.back.details.join(" ")).toMatch(/ElementalTCG|cartas|mitología/i);
    expect(firstFive[4]?.back.details.join(" ")).toMatch(/Alarm|planilla|alarmas/i);
    expect(PROJECTS.findIndex((project) => project.id === "filter-calls")).toBeGreaterThan(
      PROJECTS.findIndex((project) => project.id === "alarm"),
    );
  });

  it("maps Project 6 to its canonical demo preview and shared card visual", () => {
    const projectSix = getVisibleProjects()[5];

    expect(projectSix?.id).toBe("pymeflow");
    expect(projectSix?.name).toBe("Kurone-ko PymeFlow");
    expect(projectSix?.preview).toEqual({
      image: "/assets/projects/previews/pymeflow/project6-preview.webp",
      alt: "Vista previa de Kurone-ko PymeFlow.",
      source: "demo",
      video: {
        src: "/assets/projects/previews/pymeflow/project6-video.webm",
        type: "video/webm",
      },
    });
    expect(projectSix?.preview.video?.mobile).toBeUndefined();
    expect(projectSix?.cardVisual).toEqual({
      frame: "ornate",
      presentation: "media-title-bands",
    });
    expect(PROJECTS.findIndex((project) => project.id === "filter-calls")).toBeGreaterThan(
      PROJECTS.findIndex((project) => project.id === "pymeflow"),
    );
  });

  it("maps Project 7 to its canonical single-video preview and shared card visual", () => {
    const showcaseProjects = PROJECTS.filter((project) => project.showcaseEligible);
    const filterCalls = showcaseProjects[6];

    expect(showcaseProjects).toHaveLength(13);
    expect(showcaseProjects.map((project) => project.id)).toEqual([
      "software-engineering-playbook",
      "timer",
      "farmacia-linlin",
      "elemental-tcg",
      "alarm",
      "pymeflow",
      "filter-calls",
      "github-activity",
      "kuroneko-pos",
      "kuroneko-sii",
      "kuroneko-explorermcp",
      "translator",
      "teacher",
    ]);
    expect(filterCalls?.id).toBe("filter-calls");
    expect(filterCalls?.name).toBe("Kurone-ko FilterCalls");
    expect(filterCalls?.front.title).toBe("Kurone-ko FilterCalls");
    expect(filterCalls?.back.details[0]).toBe(
      "Kurone-ko FilterCalls nace como una idea para enfrentar ese problema desde el cuidado y la privacidad.",
    );
    expect(filterCalls?.accessibleHint).toBe(
      "Proyecto visible. Kurone-ko FilterCalls explora el filtrado de llamadas, el control y la reducción de interrupciones.",
    );
    expect(filterCalls?.preview).toEqual({
      image: "/assets/projects/previews/filter-calls/project7-preview.webp",
      alt: "Vista previa de Kurone-ko FilterCalls.",
      source: "demo",
      video: {
        src: "/assets/projects/previews/filter-calls/project7-video.webm",
        type: "video/webm",
      },
    });
    expect(filterCalls?.preview.video?.mobile).toBeUndefined();
    expect(filterCalls?.preview.focal).toBeUndefined();
    expect(filterCalls?.cardVisual).toEqual({
      frame: "ornate",
      presentation: "media-title-bands",
    });
  });

  it("maps Project 8 to its canonical single-video preview and shared card visual", () => {
    const showcaseProjects = PROJECTS.filter((project) => project.showcaseEligible);
    const githubActivity = showcaseProjects[7];

    expect(githubActivity?.id).toBe("github-activity");
    expect(githubActivity?.name).toBe("Kurone-ko GitHub Activity");
    expect(githubActivity?.front.title).toBe("Kurone-ko GitHub Activity");
    expect(githubActivity?.front.eyebrow).toBe("DIBUJAR FRASES CON COMMITS");
    expect(githubActivity?.back.details[0]).toMatch(/frases de 5x7/u);
    expect(githubActivity?.accessibleHint).toContain("sin conexión automática a GitHub");
    expect(githubActivity?.preview).toEqual({
      image: "/assets/projects/previews/github-activity/project8-preview.webp",
      alt: "Vista previa de Kurone-ko GitHub Activity.",
      source: "demo",
      video: {
        src: "/assets/projects/previews/github-activity/project8-video.webm",
        type: "video/webm",
      },
    });
    expect(githubActivity?.preview.video?.mobile).toBeUndefined();
    expect(githubActivity?.preview.focal).toBeUndefined();
    expect(githubActivity?.cardVisual).toEqual({
      frame: "ornate",
      presentation: "media-title-bands",
    });
    expect(githubActivity?.modalPresentation).toEqual({
      infoAsset: "/assets/projects/previews/software-engineering-playbook/info.webp",
      infoKicker: "UNA CURIOSIDAD CONVERTIDA EN HERRAMIENTA",
      infoTitle: "KURONE-KO GITHUB ACTIVITY",
      infoQuote:
        "Todo comenzó con una pregunta: ¿era posible escribir una frase en el calendario de GitHub?",
      stackAsset: "/assets/projects/previews/software-engineering-playbook/stack.webp",
    });
    expect(githubActivity?.loreSections).toEqual([
      {
        heading: "ZETESIS",
        paragraphs: [
          "Empecé a fijarme en perfiles cuya actividad era tan constante que parecía construida a propósito. Algunos mostraban decenas de contribuciones todos los días, y eso despertó mi curiosidad. No quería asumir que entendía lo que estaba viendo; quería descubrir si aquel calendario podía modificarse intencionalmente y cómo se conseguía.",
          "Al investigarlo aprendí cómo las fechas de los commits pueden reflejarse en la actividad de GitHub. Era también la oportunidad que buscaba para experimentar con scripts y automatización: una sola pregunta terminó reuniendo ambos aprendizajes.",
        ],
        paragraphHighlights: [
          [
            { text: "actividad era tan constante" },
            { text: "despertó mi curiosidad" },
          ],
          [{ text: "scripts y automatización" }],
        ],
      },
      {
        heading: "POIESIS",
        paragraphs: [
          "Cuando comprendí el mecanismo, pensé que no tenía sentido limitarlo a llenar cuadros. Si las fechas podían planificarse, también podían formar frases o figuras. Convertí entonces el experimento en una interfaz visual para escribir una idea, verla antes de actuar y repetir el proceso de manera controlada.",
          "Así dejó de ser un script aislado y se convirtió en un proyecto para mi portfolio: una herramienta sencilla y reutilizable que hace visible una automatización que sería fácil ejecutar a ciegas. La interfaz no decide ni publica por quien la utiliza; prepara un resultado que todavía debe revisarse.",
        ],
        paragraphHighlights: [
          [
            { text: "frases o figuras" },
            { text: "verla antes de actuar" },
          ],
          [
            { text: "proyecto para mi portfolio" },
            { text: "no decide ni publica" },
            { text: "debe revisarse" },
          ],
        ],
      },
    ]);
    expect(githubActivity?.stackPresentation).toEqual({
      kicker: "AUTOMATIZACIÓN LOCAL CON GIT Y BASH",
      title: "FRASES PLANIFICADAS SOBRE EL CALENDARIO DE GITHUB",
      introduction:
        "Kurone-ko GitHub Activity permite escribir una frase, elegir desde qué fecha proyectarla, contrastarla con actividad existente y exportar un script revisable para crear los commits localmente.",
      introductionHighlights: [
        { text: "escribir una frase" },
        { text: "actividad existente" },
        { text: "script revisable" },
        { text: "crear los commits localmente" },
      ],
      badges: ["React", "TypeScript", "Vite", "Bash", "Git", "GitHub", "Vitest"],
      blocks: [
        {
          heading: "Planificar antes de ejecutar",
          description:
            "Construí con React un flujo que separa la escritura, la configuración de fechas y la revisión del resultado. TypeScript mantiene sincronizados esos estados y permite modificar una decisión sin crear commits mientras se diseña el patrón.",
          descriptionHighlights: [
            { text: "React" },
            { text: "TypeScript" },
            { text: "configuración de fechas" },
            { text: "sin crear commits" },
          ],
        },
        {
          heading: "Fechas que no cambian de lugar",
          description:
            "Modelé con TypeScript el calendario como semanas iniciadas en domingo y fechas calculadas en UTC. Así, la zona horaria del navegador no desplaza una contribución al día anterior o siguiente, y la composición conserva su forma al atravesar meses y años.",
          descriptionHighlights: [
            { text: "TypeScript" },
            { text: "semanas iniciadas en domingo" },
            { text: "UTC" },
            { text: "zona horaria del navegador" },
          ],
        },
        {
          heading: "Actividad y colisiones visibles",
          description:
            "La interfaz reproduce el calendario de GitHub sin depender de una conexión automática con la plataforma. Permite incorporar actividad desde archivos locales, datos de demostración o fechas manuales, y React superpone lo existente con lo planificado para anticipar cómo cambiaría el resultado.",
          descriptionHighlights: [
            { text: "calendario de GitHub" },
            { text: "conexión automática" },
            { text: "archivos locales" },
            { text: "datos de demostración" },
            { text: "fechas manuales" },
            { text: "React" },
            { text: "lo existente" },
            { text: "lo planificado" },
          ],
        },
        {
          heading: "Automatización con límites claros",
          description:
            "El CSV permite revisar las fechas antes de utilizarlas. El script Bash trabaja con Git para crear commits locales con fechas de autoría y confirmación controladas, pero nunca ejecuta un push. Vitest verifica los cálculos, las importaciones y ambas exportaciones.",
          descriptionHighlights: [
            { text: "CSV" },
            { text: "script Bash" },
            { text: "Git" },
            { text: "commits locales" },
            { text: "nunca ejecuta un push" },
            { text: "Vitest" },
          ],
        },
      ],
      evidence: "HUMAN IN THE LOOP - PREVISUALIZACIÓN - CSV + BASH REVISABLES",
      cta: {
        label: "Ver repositorio",
        href: "https://github.com/DevMPoveaCL/kurone-ko-github-activity",
        confirmationPurpose:
          "Explorarás Kurone-ko GitHub Activity en su repositorio de GitHub",
      },
    });
  });

  it("provides the approved Kurone-ko FilterCalls Stack and Info presentations", () => {
    const filterCalls = PROJECTS.find((project) => project.id === "filter-calls");

    expect(filterCalls?.modalPresentation).toEqual({
      infoAsset: "/assets/projects/previews/software-engineering-playbook/info.webp",
      infoKicker: "UNA MOLESTIA DIARIA CONVERTIDA EN CONTROL",
      infoTitle: "KURONE-KO FILTERCALLS",
      infoQuote:
        "Quería ponerle un límite a las llamadas spam sin tener que entregar mis datos para conseguirlo.",
      stackAsset: "/assets/projects/previews/software-engineering-playbook/stack.webp",
    });
    expect(filterCalls?.loreSections).toEqual([
      {
        heading: "THORYBOS",
        paragraphs: [
          "Las llamadas spam empezaron a interrumpirme mientras trabajaba o estaba concentrado en otra cosa. Aunque casi nunca quería contestarlas, igual tenía que dejar lo que estaba haciendo para mirar el teléfono.",
          "No quería bloquear llamadas indiscriminadamente; quería definir reglas claras para decidir cuáles podían pasar y cuáles debían silenciarse.",
        ],
        paragraphHighlights: [
          [
            { text: "llamadas spam" },
            { text: "interrumpirme" },
            { text: "trabajaba" },
            { text: "concentrado" },
            { text: "dejar lo que estaba haciendo" },
          ],
          [
            { text: "bloquear llamadas indiscriminadamente" },
            { text: "reglas claras" },
            { text: "podían pasar" },
            { text: "debían silenciarse" },
          ],
        ],
      },
      {
        heading: "PHYLAXIS",
        paragraphs: [
          "La Ley 21.719 influyó en esa frontera: me llevó a preguntarme qué datos eran realmente necesarios y hasta dónde debía llegar una herramienta personal. No la tomo como una garantía legal, sino como un criterio para limitar desde el principio lo que la aplicación necesita conocer.",
          "Por eso la mantengo dentro de un límite claro: resuelve un problema personal en mi propio teléfono. No planeo convertirla en un servicio comercial ni incorporar funciones que compartan datos; ese límite también forma parte de la solución.",
        ],
        paragraphHighlights: [
          [
            { text: "Ley 21.719" },
            { text: "qué datos eran realmente necesarios" },
            { text: "garantía legal" },
            { text: "limitar desde el principio" },
            { text: "aplicación necesita conocer" },
          ],
          [
            { text: "límite claro" },
            { text: "problema personal" },
            { text: "propio teléfono" },
            { text: "No planeo convertirla en un servicio comercial" },
            { text: "compartan datos" },
            { text: "forma parte de la solución" },
          ],
        ],
      },
    ]);
    expect(filterCalls?.stackPresentation).toEqual({
      kicker: "PROTECCIÓN LOCAL CONTRA INTERRUPCIONES",
      title: "DECIDIR CÓMO RECIBIR UNA LLAMADA",
      introduction:
        "Aplicación Android que evalúa llamadas entrantes en el dispositivo y aplica reglas configurables; Android conserva el registro nativo.",
      introductionHighlights: [
        { text: "evalúa llamadas entrantes" },
        { text: "en el dispositivo" },
        { text: "reglas configurables" },
        { text: "registro nativo" },
      ],
      badges: ["Android", "Kotlin", "Jetpack Compose", "Material 3", "DataStore", "Coroutines", "Gradle"],
      blocks: [
        {
          heading: "Clasificación local",
          description:
            "Kotlin normaliza identidad, formato, longitud, origen internacional y prefijos chilenos 600 y 809 para producir una categoría de riesgo.",
          descriptionHighlights: [
            { text: "Kotlin" },
            { text: "normaliza identidad" },
            { text: "origen internacional" },
            { text: "600 y 809" },
          ],
        },
        {
          heading: "Reglas configurables",
          description:
            "Jetpack Compose y Material 3 exponen tres modos y dos reglas opcionales: números no guardados e internacionales. La decisión final solo aplica reglas a llamadas telefónicas con señales suficientes.",
          descriptionHighlights: [
            { text: "Jetpack Compose" },
            { text: "Material 3" },
            { text: "tres modos" },
            { text: "dos reglas opcionales" },
            { text: "números no guardados" },
            { text: "internacionales" },
          ],
        },
        {
          heading: "Datos necesarios, no acumulados",
          description:
            "DataStore persiste el modo y las reglas. Al activar la regla de números no guardados, READ_CONTACTS se solicita para una consulta temporal; no se guarda el número ni se copia la agenda.",
          descriptionHighlights: [
            { text: "DataStore" },
            { text: "READ_CONTACTS" },
            { text: "consulta temporal" },
            { text: "no se guarda el número" },
          ],
        },
        {
          heading: "Respuesta segura y verificable",
          description:
            "Coroutines mantiene una configuración precargada para responder dentro del callback de Android; si faltan datos, el permiso es incierto o algo falla, la política permite la llamada. Gradle organiza JUnit, Robolectric y las pruebas instrumentadas.",
          descriptionHighlights: [
            { text: "Coroutines" },
            { text: "callback de Android" },
            { text: "permiso es incierto" },
            { text: "permite la llamada" },
            { text: "Gradle" },
            { text: "JUnit" },
            { text: "Robolectric" },
            { text: "pruebas instrumentadas" },
          ],
        },
      ],
      evidence:
        "600/809 · 4 CRITERIOS DE FILTRADO · EVALUACIÓN LOCAL AL RECIBIR LA LLAMADA.",
      cta: {
        label: "Ver repositorio",
        href: "https://github.com/DevMPoveaCL/kurone-ko-filtercalls",
        confirmationPurpose: "Explorarás Kurone-ko FilterCalls en su repositorio de GitHub",
      },
    });

    const stack = filterCalls?.stackPresentation;
    const narrativeBlockCopy = stack?.blocks.map((block) => block.description).join(" ") ?? "";
    expect(stack?.badges?.every((badge) => narrativeBlockCopy.includes(badge))).toBe(true);
    const modalCopy = [
      stack?.introduction,
      stack?.evidence,
      narrativeBlockCopy,
      ...(filterCalls?.loreSections?.flatMap((section) => section.paragraphs) ?? []),
    ].join(" ");
    expect(modalCopy).not.toMatch(/integración bancaria real|autenticación de producción|multijugador|telemetría remota|cumplimiento legal/iu);
  });

  it("provides the approved Kurone-ko PymeFlow modal presentations and truthful scope", () => {
    const pymeflow = PROJECTS.find((project) => project.id === "pymeflow");

    expect(pymeflow?.modalPresentation).toEqual({
      infoAsset: "/assets/projects/previews/software-engineering-playbook/info.webp",
      infoKicker: "UNA NECESIDAD DE PYME LLEVADA A SOFTWARE",
      infoTitle: "KURONE-KO PYMEFLOW",
      infoQuote:
        "Antes de intentar construir un sistema completo, decidí comprobar si podía ordenar movimientos y proyectar caja de una forma clara.",
      stackAsset: "/assets/projects/previews/software-engineering-playbook/stack.webp",
    });
    expect(pymeflow?.loreSections).toEqual([
      {
        heading: "GÉNESIS",
        paragraphs: [
          "Al revisar el mercado laboral chileno, noté una demanda constante por desarrolladores que trabajaran con Java, Spring Boot y Docker. Quise profundizar en ese stack mediante un proyecto que también mantuviera la línea de soluciones para pymes que venía construyendo.",
          "Kurone-ko POS y Kurone-ko SII nacieron dentro de esa misma línea. Mi intención es que, con el tiempo, puedan complementarse con PymeFlow como partes de un kit de software para pymes; no como una integración ya terminada, sino como una dirección para seguir desarrollando.",
          "Mi formación universitaria en contabilidad y mi experiencia trabajando con pymes me ayudaron a reconocer problemas frecuentes alrededor de la caja, los impuestos y el orden operativo. Ese conocimiento respaldó las decisiones de negocio que necesitaba representar mediante software.",
        ],
        paragraphHighlights: [
          [
            { text: "mercado laboral chileno" },
            { text: "Java" },
            { text: "Spring Boot" },
            { text: "Docker" },
            { text: "soluciones para pymes" },
          ],
          [
            { text: "Kurone-ko POS" },
            { text: "Kurone-ko SII" },
            { text: "PymeFlow" },
            { text: "kit de software para pymes" },
          ],
          [
            { text: "formación universitaria en contabilidad" },
            { text: "experiencia trabajando con pymes" },
            { text: "caja" },
            { text: "impuestos" },
            { text: "orden operativo" },
            { text: "representar mediante software" },
          ],
        ],
      },
      {
        heading: "PRAXIS",
        paragraphs: [
          "Para la primera versión decidí acotar el alcance al flujo de caja. Trabajé con movimientos y proveedores simulados, un saldo inicial manual y proyecciones deterministas de 7 o 30 días para comprobar si el flujo era comprensible y viable antes de ampliar el producto.",
          "Con este MVP convertí conocimiento contable en decisiones de software concretas: movimientos pendientes, Entradas y Salidas compatibles, ingesta sin duplicados y reglas que impiden proyectar datos todavía no revisados. Así puedo mostrar tanto el contexto que conozco como la forma en que lo traduzco a una arquitectura verificable y mantenible.",
        ],
        paragraphHighlights: [
          [
            { text: "acotar el alcance" },
            { text: "flujo de caja" },
            { text: "proveedores simulados" },
            { text: "saldo inicial manual" },
            { text: "7 o 30 días" },
          ],
          [
            { text: "MVP" },
            { text: "decisiones de software" },
            { text: "Entradas y Salidas" },
            { text: "ingesta sin duplicados" },
            { text: "arquitectura verificable y mantenible" },
          ],
        ],
      },
    ]);
    expect(pymeflow?.stackPresentation).toEqual({
      kicker: "CONTROL PARA LA CAJA COTIDIANA",
      title: "DE MOVIMIENTOS A CAJA VISIBLE",
      introduction:
        "Cuando una pyme mantiene movimientos sin clasificar, pierde claridad sobre su caja y las obligaciones próximas. Construí Kurone-ko PymeFlow como un cockpit que transforma esa incertidumbre en movimientos revisables, categorías de Entrada o Salida y proyecciones a 7 o 30 días, dejando visible que el MVP usa datos simulados.",
      introductionHighlights: [
        { text: "movimientos sin clasificar" },
        { text: "pierde claridad" },
        { text: "Kurone-ko PymeFlow" },
        { text: "Entrada o Salida" },
        { text: "7 o 30 días" },
        { text: "datos simulados" },
      ],
      badges: ["Java 21", "Spring Boot 3", "PostgreSQL 16", "Flyway", "OpenAPI", "Docker", "JUnit 5", "ArchUnit"],
      blocks: [
        {
          heading: "Dominio separado de la infraestructura",
          description:
            "Modelé las reglas de caja con Java 21 y organicé los casos de uso con Spring Boot 3 mediante puertos y adaptadores. Así mantuve el dominio separado de controladores, persistencia y proveedores simulados.",
          descriptionHighlights: [
            { text: "Java 21" },
            { text: "Spring Boot 3" },
            { text: "puertos y adaptadores" },
            { text: "dominio separado" },
          ],
        },
        {
          heading: "Persistencia e ingesta idempotente",
          description:
            "Persistí movimientos, preferencias y sincronizaciones en PostgreSQL 16 mediante JDBC. Versioné el esquema con Flyway y generé una huella SHA-256 cuando faltaba una referencia segura, evitando duplicar registros.",
          descriptionHighlights: [
            { text: "PostgreSQL 16" },
            { text: "Flyway" },
            { text: "huella SHA-256" },
            { text: "evitando duplicar registros" },
          ],
        },
        {
          heading: "Revisar antes de proyectar",
          description:
            "Expuse mediante REST y OpenAPI los flujos de importación, revisión, categorización y proyección. Solo permití que los movimientos revisados alimentaran el cálculo, manteniendo visibles los pendientes, rechazados y datos sensibles bloqueados.",
          descriptionHighlights: [
            { text: "OpenAPI" },
            { text: "movimientos revisados" },
            { text: "pendientes" },
            { text: "datos sensibles bloqueados" },
          ],
        },
        {
          heading: "Verificación y ejecución local",
          description:
            "Preparé el MVP con Docker para levantar la aplicación junto a PostgreSQL desde un entorno reproducible. Verifiqué reglas, controladores y persistencia con JUnit 5, mientras ArchUnit protege las dependencias permitidas entre las capas.",
          descriptionHighlights: [
            { text: "Docker" },
            { text: "entorno reproducible" },
            { text: "JUnit 5" },
            { text: "ArchUnit" },
            { text: "dependencias permitidas" },
          ],
        },
      ],
      evidence:
        "PROYECCIÓN 7/30 DÍAS · HUELLA SHA-256 · 6 MIGRACIONES FLYWAY · 365 TESTS DOCUMENTADOS.",
      cta: {
        label: "Ver repositorio",
        href: "https://github.com/DevMPoveaCL/kurone-ko-pymeflow",
        confirmationPurpose: "Explorarás Kurone-ko PymeFlow en su repositorio de GitHub",
      },
    });

    const modalCopy = [
      pymeflow?.stackPresentation?.introduction,
      pymeflow?.stackPresentation?.evidence,
      ...(pymeflow?.stackPresentation?.blocks.map((block) => block.description) ?? []),
      ...(pymeflow?.loreSections?.flatMap((section) => section.paragraphs) ?? []),
    ].join(" ");
    expect(modalCopy).not.toMatch(/integración bancaria real|autenticación de producción|aislamiento de tenant|despliegue público|\bIA\b|\bLLM\b/iu);
    expect(modalCopy).toContain("datos simulados");
    expect(pymeflow?.stackPresentation?.evidenceHighlights).toBeUndefined();
  });

  it("provides non-empty typed front and back card faces for every project", () => {
    for (const project of PROJECTS) {
      expect(project.front.eyebrow.trim()).not.toBe("");
      expect(project.front.title.trim()).not.toBe("");
      expect(project.front.summary.length).toBeGreaterThan(0);
      expect(project.front.summary.every((paragraph) => paragraph.trim() !== "")).toBe(true);
      expect(project.back.title.trim()).not.toBe("");
      expect(project.back.details.length).toBeGreaterThan(0);
      expect(project.back.details.every((paragraph) => paragraph.trim() !== "")).toBe(true);
      expect(project.back.outcome?.trim() ?? "optional").not.toBe("");
    }
  });

  it("keeps Portfolio outside the visible path while preserving locked showcase entries", () => {
    const visibleProjectIds = getVisibleProjects().map((project) => project.id);

    expect(visibleProjectIds).not.toEqual(expect.arrayContaining([
      "kuroneko-pos",
      "kuroneko-sii",
      "kuroneko-explorermcp",
      "translator",
      "teacher",
    ]));
    expect(getProjectTierDetails("farmacia-linlin")?.tier).toBe(PROJECT_TIER.VISIBLE);
    expect(getProjectTierDetails("pymeflow")?.tier).toBe(PROJECT_TIER.VISIBLE);
    expect(getProjectTierDetails("teacher")?.tier).toBe(PROJECT_TIER.HIDDEN);
    expect(PROJECTS.filter((project) => project.showcaseEligible && project.tier !== PROJECT_TIER.VISIBLE).map((project) => project.id)).toEqual([
      "kuroneko-pos",
      "kuroneko-sii",
      "kuroneko-explorermcp",
      "translator",
      "teacher",
    ]);
  });

  it("preserves the approved recruiter-facing narrative for the commercial ecosystem", () => {
    const projectsById = new Map(PROJECTS.map((project) => [project.id, project]));
    const pos = projectsById.get("kuroneko-pos");
    const pymeFlow = projectsById.get("pymeflow");
    const sii = projectsById.get("kuroneko-sii");

    expect(pos).toEqual(expect.objectContaining({
      name: "Kurone-ko POS",
      tier: PROJECT_TIER.HIDDEN,
      showcaseEligible: true,
      status: "Acceso bloqueado · MVP funcional / prototipo avanzado",
    }));
    expect(pos?.front.title).toBe("Kurone-ko POS");
    expect(pos?.front.eyebrow).toBe("Cuando la caja no puede detenerse");
    expect(pos?.front.summary).toContain("Kurone-ko POS nació de una experiencia laboral concreta: convivir con un punto de venta que no respondía a las necesidades diarias de una farmacia chilena.");
    expect(pos?.back.details.join(" ")).toEqual(expect.stringContaining("búsquedas lentas"));
    expect(pos?.back.details.join(" ")).toEqual(expect.stringContaining("compilación nativa"));
    expect(pos?.back.details.join(" ")).toEqual(expect.stringContaining("Go + Wails"));
    expect(pos?.back.details.join(" ")).toEqual(expect.stringContaining("alertas de vencimiento"));
    expect(pos?.back.outcome).toBe("Una caja no debería detener el negocio para intentar comprenderlo. Kurone-ko POS nace para que el software responda al ritmo de la farmacia, incluso cuando el hardware y el tiempo juegan en contra.");
    expect(pos?.accessibleHint).toEqual(expect.stringContaining("Kurone-ko POS"));
    expect(pos?.accessibleHint).toMatch(/oculto y bloqueado/i);

    expect(pymeFlow).toEqual(expect.objectContaining({
      name: "Kurone-ko PymeFlow",
      tier: PROJECT_TIER.VISIBLE,
      showcaseEligible: true,
      status: "MVP funcional de capa financiera",
    }));
    expect(pymeFlow?.front.title).toBe("Kurone-ko PymeFlow");
    expect(pymeFlow?.front.eyebrow).toBe("Seguir el rastro que deja el dinero");
    expect(pymeFlow?.front.summary.join(" ")).toEqual(expect.stringContaining("cartolas, depósitos y cargos"));
    expect(pymeFlow?.back.details.join(" ")).toEqual(expect.stringContaining("finanzas personales y la contabilidad"));
    expect(pymeFlow?.back.details.join(" ")).toEqual(expect.stringContaining("MVP funcional con Java y Spring Boot"));
    expect(pymeFlow?.back.details.join(" ")).toEqual(expect.stringContaining("Kurone-ko POS"));
    expect(pymeFlow?.back.details.join(" ")).toEqual(expect.stringContaining("mapa para lo que viene"));
    expect(pymeFlow?.accessibleHint).toEqual(expect.stringContaining("Kurone-ko PymeFlow"));

    expect(sii).toEqual(expect.objectContaining({
      name: "Kurone-ko SII",
      tier: PROJECT_TIER.HIDDEN,
      showcaseEligible: true,
      status: "Acceso bloqueado · Planificado — aún no iniciado",
    }));
    expect(sii?.front.title).toBe("Kurone-ko SII");
    expect(sii?.front.eyebrow).toBe("Cómo conciliar tus Ventas");
    expect(sii?.front.summary.join(" ")).toEqual(expect.stringContaining("documentos tributarios"));
    expect(sii?.back.details.join(" ")).toEqual(expect.stringContaining("Kurone-ko POS"));
    expect(sii?.back.details.join(" ")).toEqual(expect.stringContaining("boletas, facturas o DTE"));
    expect(sii?.back.details.join(" ")).toEqual(expect.stringContaining("IVA, pre-F29, cierre mensual"));
    expect(sii?.back.details.join(" ")).toEqual(expect.stringContaining("huella de auditoría"));
    expect(sii?.back.details.join(" ")).toEqual(expect.stringContaining("historia tributaria y financiera"));
    expect(sii?.accessibleHint).toEqual(expect.stringContaining("Kurone-ko SII"));
    expect(sii?.technologyMetadata).toEqual({
      stacks: [],
      technologies: [],
      practices: [],
      evidence: [],
    });

    for (const project of [pos, pymeFlow, sii]) {
      const narrative = [
        project?.front.summary.join(" "),
        project?.back.details.join(" "),
        project?.back.outcome,
      ].filter((value): value is string => value !== undefined).join(" ");

      expect(narrative).not.toMatch(/no afirmo|sin pretender|antes que prometer/i);
    }
  });

  it("provides the approved Project 9 modal data without a development CTA", () => {
    const pos = PROJECTS.find((project) => project.id === "kuroneko-pos");

    expect(pos?.modalPresentation).toEqual({
      infoAsset: "/assets/projects/previews/software-engineering-playbook/info.webp",
      infoKicker: "UNA NECESIDAD COMPARTIDA POR MUCHAS PYMES",
      infoTitle: "KURONE-KO POS",
      infoQuote:
        "El software debía adaptarse a las reglas del negocio, no obligar al negocio a cambiar sus reglas por las limitaciones de su arquitectura.",
      stackAsset: "/assets/projects/previews/software-engineering-playbook/stack.webp",
    });
    expect(pos?.loreSections).toEqual([
      {
        heading: "ANANKE",
        paragraphs: [
          "Conocí una pyme que trabajaba con un punto de venta que no conversaba con la realidad del negocio. Si se caía internet, las ventas y el stock podían quedar descuadrados; además, controlar vencimientos, revisar el inventario desde el celular o intercambiar catálogos y boletas con el SII quedaba fuera del flujo. Todo eso debía funcionar en computadores antiguos y con recursos limitados. De ahí nació la idea de construir una alternativa pensada para la operación real.",
        ],
        paragraphHighlights: [[
          { text: "una pyme" },
          { text: "no conversaba con la realidad del negocio" },
          { text: "las ventas y el stock podían quedar descuadrados" },
          { text: "computadores antiguos" },
          { text: "operación real" },
        ]],
      },
      {
        heading: "PRAXIS",
        paragraphs: [
          "Kurone-ko POS convirtió esa idea en un producto de escritorio local-first. Elegí Go, Wails y SQLite para mantener las reglas del negocio separadas de la interfaz y asegurar que ventas, stock y evidencia formen parte de una misma operación. El resultado es una base rápida, liviana y preparada para crecer sin perder continuidad cuando internet o el hardware ponen límites.",
        ],
        paragraphHighlights: [[
          { text: "Kurone-ko POS" },
          { text: "producto de escritorio local-first" },
          { text: "Go, Wails y SQLite" },
          { text: "reglas del negocio separadas" },
          { text: "base rápida, liviana y preparada para crecer" },
        ]],
      },
    ]);
    expect(pos?.stackPresentation).toEqual({
      kicker: "OPERACIÓN LOCAL PARA UNA CAJA REAL",
      title: "VENDER SIN PERDER EL RASTRO",
      introduction:
        "Construí Kurone-ko POS para quienes atienden un negocio y necesitan buscar productos, controlar stock, cobrar y cerrar caja sin adaptar su trabajo a búsquedas lentas o registros desconectados. La aplicación reúne esos flujos en un escritorio local y mantiene evidencia de cada operación.",
      introductionHighlights: [
        { text: "Kurone-ko POS" },
        { text: "buscar productos, controlar stock, cobrar y cerrar caja" },
        { text: "escritorio local" },
        { text: "evidencia de cada operación" },
      ],
      badges: ["Go", "Wails", "TypeScript", "Vite", "SQLite", "Vitest", "Playwright"],
      blocks: [
        {
          heading: "Cobrar al ritmo del mesón",
          description:
            "Construí con TypeScript una caja que conserva tickets, busca productos por código o texto, permite ajustar cantidades y conduce el cobro mediante atajos y controles equivalentes con teclado o ratón. Vite mantiene breve el ciclo de compilación de esta interfaz.",
          descriptionHighlights: [
            { text: "TypeScript" },
            { text: "busca productos por código o texto" },
            { text: "atajos" },
            { text: "teclado o ratón" },
            { text: "Vite" },
          ],
        },
        {
          heading: "Dominio separado del escritorio",
          description:
            "Organicé en Go las reglas de ventas, inventario, turnos y autenticación detrás de puertos, y usé Wails para exponerlas a la interfaz de escritorio. Así mantuve las decisiones comerciales separadas del DOM, la base de datos y las integraciones externas.",
          descriptionHighlights: [
            { text: "Go" },
            { text: "puertos" },
            { text: "Wails" },
            { text: "decisiones comerciales separadas" },
          ],
        },
        {
          heading: "Stock, caja y evidencia en una transacción",
          description:
            "Persistí en SQLite productos, lotes, turnos, ventas, movimientos de caja, auditorías y eventos pendientes. Al confirmar una venta valido el pago y el stock, descuento sus líneas y registro la evidencia dentro de una misma transacción; WAL y claves foráneas refuerzan la operación local.",
          descriptionHighlights: [
            { text: "SQLite" },
            { text: "valido el pago y el stock" },
            { text: "misma transacción" },
            { text: "WAL" },
            { text: "claves foráneas" },
          ],
        },
        {
          heading: "Pruebas sobre reglas y recorridos",
          description:
            "Protegí los casos de uso y los adaptadores SQLite con pruebas de Go, y verifiqué estados, atajos y componentes de la interfaz con Vitest. También preparé recorridos de navegador con Playwright para comprobar la aplicación desde la interacción visible.",
          descriptionHighlights: [
            { text: "pruebas de Go" },
            { text: "Vitest" },
            { text: "atajos" },
            { text: "Playwright" },
          ],
        },
      ],
      evidence: "WAL + CLAVES FORÁNEAS · VENTAS ATÓMICAS · VENTA CON TECLADO O RATÓN",
    });
    expect(pos?.stackPresentation?.cta).toBeUndefined();
  });

  it("provides the approved Project 10 modal data without a CTA", () => {
    const sii = PROJECTS.find((project) => project.id === "kuroneko-sii");

    expect(sii?.modalPresentation).toEqual({
      infoAsset: "/assets/projects/previews/software-engineering-playbook/info.webp",
      infoKicker: "CUANDO LOS REGISTROS CONCILIAN, EL NEGOCIO SE ORDENA",
      infoTitle: "KURONE-KO SII",
      infoQuote:
        "Cerrar un mes no debería significar reconstruir a mano decisiones que el negocio ya dejó registradas.",
      stackAsset: "/assets/projects/previews/software-engineering-playbook/stack.webp",
    });
    expect(sii?.loreSections).toEqual([
      {
        heading: "ANANKE",
        paragraphs: [
          "He visto cómo una venta puede quedar repartida entre la caja, la cartola y los registros tributarios, con cada fuente contando solo una parte de lo ocurrido. Cuando llega el cierre, esa fragmentación obliga a recordar, interpretar y volver a demostrar hechos que el negocio ya produjo. El problema no es que falten datos: es que todavía no forman una historia común.",
        ],
        paragraphHighlights: [[
          { text: "cada fuente contando solo una parte" },
          { text: "volver a demostrar" },
          { text: "no forman una historia común" },
        ]],
      },
      {
        heading: "PRAXIS",
        paragraphs: [
          "Por eso diseñé Kurone-ko SII: un espacio donde la operación comercial, el movimiento bancario y la información del SII se cruzan automáticamente. Al consolidar esas huellas, cualquier diferencia deja de parecer una alerta aislada y se convierte en una duda que puede resolverse desde su origen. Conciliar no consiste en forzar los números para que coincidan, sino en tener a mano la información real para entender el estado del negocio.",
        ],
        paragraphHighlights: [[
          { text: "Kurone-ko SII" },
          { text: "se cruzan automáticamente" },
          { text: "resolverse desde su origen" },
          { text: "información real" },
          { text: "estado del negocio" },
        ]],
      },
    ]);
    expect(sii?.stackPresentation).toEqual({
      kicker: "INTELIGENCIA CONTABLE PARA EL CIERRE MENSUAL",
      title: "DE DATOS DISPERSOS A UN CIERRE EXPLICABLE",
      introduction:
        "Construí Kurone-ko SII para integrar la operación comercial de Kurone-ko POS con la realidad financiera de Kurone-ko PymeFlow y contrastarlas con la información tributaria del SII. El producto convierte esas fuentes en una historia contable trazable, capaz de explicar qué se vendió, cómo se movió el dinero y de dónde viene cada cifra del cierre.",
      introductionHighlights: [
        { text: "Kurone-ko SII" },
        { text: "Kurone-ko POS" },
        { text: "Kurone-ko PymeFlow" },
        { text: "historia contable trazable" },
        { text: "de dónde viene cada cifra del cierre" },
      ],
      badges: ["POS", "PYMEFLOW", "DTE", "IVA", "F29", "IA"],
      blocks: [
        {
          heading: "Integración de fuentes",
          description:
            "Integré en Kurone-ko SII las ventas físicas y online junto con el inventario registrado por Kurone-ko POS, y los saldos, ingresos, egresos, proveedores y proyecciones administrados por Kurone-ko PymeFlow. Cada producto conserva su responsabilidad, mientras SII relaciona sus resultados dentro de una misma lectura contable.",
          descriptionHighlights: [
            { text: "Kurone-ko SII" },
            { text: "Kurone-ko POS" },
            { text: "Kurone-ko PymeFlow" },
            { text: "cada producto conserva su responsabilidad" },
            { text: "una misma lectura contable" },
          ],
        },
        {
          heading: "Conciliación contable",
          description:
            "Crucé las ventas e inventario de POS con los movimientos financieros de PYMEFLOW y los DTE disponibles en SII. Cuando una cifra no coincide, Kurone-ko SII conserva los antecedentes necesarios para seguir la diferencia hasta la operación que la originó.",
          descriptionHighlights: [
            { text: "POS" },
            { text: "PYMEFLOW" },
            { text: "DTE" },
            { text: "seguir la diferencia" },
            { text: "operación que la originó" },
          ],
        },
        {
          heading: "Cierre tributario",
          description:
            "Organicé la información conciliada por períodos para calcular IVA y preparar el F29 desde operaciones previamente revisadas. Así, el cierre deja de depender de planillas reconstruidas a última hora y pasa a sostenerse sobre evidencia trazable.",
          descriptionHighlights: [
            { text: "IVA" },
            { text: "F29" },
            { text: "operaciones previamente revisadas" },
            { text: "evidencia trazable" },
          ],
        },
        {
          heading: "Criterio asistido",
          description:
            "Incorporé IA para clasificar antecedentes, explicar inconsistencias y priorizar lo que necesita atención. Las decisiones tributarias permanecen bajo control humano y cada propuesta conserva la evidencia utilizada para generarla.",
          descriptionHighlights: [
            { text: "IA" },
            { text: "explicar inconsistencias" },
            { text: "control humano" },
            { text: "evidencia utilizada" },
          ],
        },
      ],
      evidence: "POS + PYMEFLOW + SII · CONCILIACIÓN TRAZABLE · CIERRE BAJO CONTROL HUMANO",
    });
    expect(sii?.stackPresentation?.cta).toBeUndefined();
  });

  it("provides the approved Project 11 modal data without a CTA", () => {
    const explorerMcp = PROJECTS.find((project) => project.id === "kuroneko-explorermcp");

    expect(explorerMcp?.modalPresentation).toEqual({
      infoAsset: "/assets/projects/previews/software-engineering-playbook/info.webp",
      infoKicker: "CUANDO VER UNA VENTANA NO SIGNIFICA COMPRENDERLA",
      infoTitle: "KURONE-KO EXPLORERMCP",
      infoQuote:
        "No quería que una IA aprendiera a hacer clic a ciegas; quería darle una forma segura de comprender dónde estaba y qué significaba actuar.",
      stackAsset: "/assets/projects/previews/software-engineering-playbook/stack.webp",
    });
    expect(explorerMcp?.loreSections).toEqual([
      {
        heading: "ANANKE",
        paragraphs: [
          "Todo comenzó con una incomodidad: gran parte del trabajo cotidiano sigue encerrado dentro de aplicaciones de Windows que una IA puede ver, pero no necesariamente comprender. En Excel, reconocer una celda no significa entender la fórmula, la tabla o la decisión que representa; en una herramienta creativa, distinguir botones tampoco revela los objetos ni relaciones que forman una escena. Automatizar solo la superficie podía acelerar una acción, pero también multiplicar sus errores.",
        ],
        paragraphHighlights: [[
          { text: "aplicaciones de Windows" },
          { text: "puede ver" },
          { text: "no necesariamente comprender" },
          { text: "Excel" },
          { text: "automatizar solo la superficie" },
        ]],
      },
      {
        heading: "PRAXIS",
        paragraphs: [
          "Por eso construí Kurone-ko ExplorerMCP: un núcleo que descubre aplicaciones, observa sus capacidades y reconoce cuándo necesita un lenguaje más especializado. Blender fue la primera prueba de esa idea; Excel representa el mismo desafío aplicado a libros, hojas, rangos y fórmulas. La meta no es enseñar a una IA a mover el mouse por nosotros, sino darle el contexto suficiente para colaborar sin actuar a ciegas.",
        ],
        paragraphHighlights: [[
          { text: "Kurone-ko ExplorerMCP" },
          { text: "lenguaje más especializado" },
          { text: "Blender" },
          { text: "Excel" },
          { text: "colaborar sin actuar a ciegas" },
        ]],
      },
    ]);
    expect(explorerMcp?.stackPresentation).toEqual({
      kicker: "UN PUENTE SEGURO ENTRE IA Y WINDOWS",
      title: "COMPRENDER ANTES DE ACTUAR",
      introduction:
        "Construí Kurone-ko ExplorerMCP para que una IA pueda descubrir aplicaciones de Windows, comprender qué capacidades exponen y decidir hasta dónde es seguro interactuar. El producto combina un núcleo común con adaptadores especializados, porque observar una ventana no siempre significa entender lo que ocurre dentro de ella.",
      introductionHighlights: [
        { text: "Kurone-ko ExplorerMCP" },
        { text: "aplicaciones de Windows" },
        { text: "hasta dónde es seguro interactuar" },
        { text: "adaptadores especializados" },
        { text: "entender lo que ocurre dentro" },
      ],
      badges: ["C#", ".NET", "MCP", "UIA", "WIN32", "WEBSOCKET", "XUNIT"],
      blocks: [
        {
          heading: "Descubrimiento",
          description:
            "Implementé en C# y .NET un núcleo capaz de localizar aplicaciones mediante Win32 y observar los controles disponibles a través de UIA. Cuando una interfaz no entrega suficiente información, el sistema reconoce esa limitación en lugar de asumir que puede controlarla.",
          descriptionHighlights: [
            { text: "C#" },
            { text: ".NET" },
            { text: "Win32" },
            { text: "UIA" },
            { text: "reconoce esa limitación" },
          ],
        },
        {
          heading: "Límites seguros",
          description:
            "Separé observación, planificación y ejecución mediante arquitectura hexagonal. Antes de actuar, cada operación pasa por validaciones de seguridad y una política que deniega por defecto lo que no está autorizado; además, las trazas permiten inspeccionar y previsualizar lo ocurrido.",
          descriptionHighlights: [
            { text: "arquitectura hexagonal" },
            { text: "deniega por defecto" },
            { text: "trazas" },
            { text: "previsualizar" },
          ],
        },
        {
          heading: "Lenguaje semántico",
          description:
            "Incorporé adaptadores que traducen la intención de la IA al dominio real de cada aplicación. Blender fue la primera implementación: mediante WebSocket y comandos declarativos, Kurone-ko ExplorerMCP puede trabajar con escenas, objetos, materiales y cámaras sin depender de coordenadas frágiles ni aceptar Python arbitrario.",
          descriptionHighlights: [
            { text: "Blender" },
            { text: "WebSocket" },
            { text: "comandos declarativos" },
            { text: "sin depender de coordenadas frágiles" },
            { text: "Python arbitrario" },
          ],
        },
        {
          heading: "MCP extensible",
          description:
            "Expuse esas capacidades mediante MCP sin trasladar al protocolo las reglas del sistema. Esta separación permite incorporar nuevos adaptadores —como Excel— para trabajar con libros, hojas, rangos y fórmulas como conceptos reales. Las pruebas con xUnit protegen los contratos mientras el producto crece.",
          descriptionHighlights: [
            { text: "MCP" },
            { text: "Excel" },
            { text: "libros, hojas, rangos y fórmulas" },
            { text: "xUnit" },
            { text: "contratos" },
          ],
        },
      ],
      evidence: "WINDOWS + MCP · EXCEL · TRAZAS REVISABLES · ADAPTADORES SEMÁNTICOS",
    });
    expect(explorerMcp?.stackPresentation?.cta).toBeUndefined();
  });

  it("provides the approved Project 12 modal data without a CTA", () => {
    const translator = PROJECTS.find((project) => project.id === "translator");

    expect(translator?.modalPresentation).toEqual({
      infoAsset: "/assets/projects/previews/software-engineering-playbook/info.webp",
      infoKicker: "CUANDO NO ENTENDER A TIEMPO TAMBIÉN ES QUEDAR EXPUESTO",
      infoTitle: "KURONE-KO TRANSLATOR",
      infoQuote:
        "Quería que la tecnología me ayudara a permanecer en la conversación, no que hablara por mí.",
      stackAsset: "/assets/projects/previews/software-engineering-playbook/stack.webp",
    });
    expect(translator?.loreSections).toEqual([
      {
        heading: "HERMENEIA",
        paragraphs: [
          "Mientras me preparaba para vivir y trabajar en Alemania, pensé en algo tan cotidiano como atender una llamada. Para una persona que no domina el alemán, no entender una dirección, una fecha o una pregunta en tiempo real puede convertir un trámite sencillo en una situación de vulnerabilidad. Kurone-ko Translator nació de esa necesidad personal: contar con apoyo suficiente para comprender lo que ocurre sin entregar por completo mi voz a una máquina.",
        ],
        paragraphHighlights: [[
          { text: "vivir y trabajar en Alemania" },
          { text: "situación de vulnerabilidad" },
          { text: "Kurone-ko Translator" },
          { text: "necesidad personal" },
          { text: "sin entregar por completo mi voz a una máquina" },
        ]],
      },
      {
        heading: "METAXY",
        paragraphs: [
          "Por eso lo construí como un puente entre lo que escucho y lo que todavía no puedo expresar con fluidez. El sistema acumula la conversación en alemán, acerca su significado al español y propone una respuesta cuya pronunciación puedo leer. No busca fingir que domino el idioma: busca darme tiempo, contexto y una forma concreta de seguir participando por mí mismo.",
        ],
        paragraphHighlights: [[
          { text: "un puente" },
          { text: "puedo leer" },
          { text: "darme tiempo, contexto" },
          { text: "seguir participando por mí mismo" },
        ]],
      },
    ]);
    expect(translator?.stackPresentation).toEqual({
      kicker: "ASISTENCIA EN TIEMPO REAL PARA UNA CONVERSACIÓN REAL",
      title: "ENTENDER A TIEMPO PARA PODER RESPONDER",
      introduction:
        "Construí Kurone-ko Translator después de vivir en Alemania durante todo 2025 y enfrentar llamadas de trabajo en un idioma que todavía no dominaba. Entender tarde una dirección, una fecha o una instrucción podía hacerme perder información importante y dejarme sin una forma clara de responder. Por eso prioricé una traducción rápida y legible que me permitiera comprender la conversación y participar con mi propia voz.",
      introductionHighlights: [
        { text: "Kurone-ko Translator" },
        { text: "vivir en Alemania durante todo 2025" },
        { text: "llamadas de trabajo" },
        { text: "perder información importante" },
        { text: "participar con mi propia voz" },
      ],
      badges: ["GO", "DEEPGRAM", "WEBSOCKET", "WINMM", "SSE", "LLM"],
      blocks: [
        {
          heading: "Transcripción continua",
          description:
            "Transmito audio hacia Deepgram mediante WebSocket y muestro resultados parciales mientras la persona todavía habla. Solo envío al LLM los cierres de voz confirmados, porque responder a fragmentos inestables aumentaría la latencia y produciría interpretaciones incorrectas.",
          descriptionHighlights: [
            { text: "Deepgram" },
            { text: "WebSocket" },
            { text: "resultados parciales" },
            { text: "LLM" },
            { text: "cierres de voz confirmados" },
          ],
        },
        {
          heading: "Arquitectura adaptable",
          description:
            "Separé dominio, puertos y adaptadores mediante arquitectura hexagonal. Deepgram y el LLM resuelven tareas importantes, pero no definen el producto completo; así puedo cambiar proveedores, modelos o estrategias de latencia sin reescribir la lógica de la conversación.",
          descriptionHighlights: [
            { text: "arquitectura hexagonal" },
            { text: "Deepgram" },
            { text: "LLM" },
            { text: "cambiar proveedores" },
            { text: "lógica de la conversación" },
          ],
        },
        {
          heading: "Audio nativo",
          description:
            "Integré el micrófono de Windows directamente con WinMM y protegí sus buffers mediante runtime.Pinner y LockOSThread. Esta decisión evita que el recolector de memoria o un cambio de hilo interrumpan los callbacks nativos mientras la llamada continúa.",
          descriptionHighlights: [
            { text: "WinMM" },
            { text: "runtime.Pinner" },
            { text: "LockOSThread" },
            { text: "callbacks nativos" },
          ],
        },
        {
          heading: "Fonética útil",
          description:
            "Convierto cada respuesta alemana en una fonética española determinista y la actualizo en la interfaz mediante SSE. Prescindí de una voz artificial porque la herramienta no debe hablar por mí: debe entregarme una respuesta que pueda comprender, pronunciar y hacer propia.",
          descriptionHighlights: [
            { text: "fonética española determinista" },
            { text: "SSE" },
            { text: "Prescindí de una voz artificial" },
            { text: "hablar por mí" },
            { text: "hacer propia" },
          ],
        },
      ],
      evidence:
        "ALEMÁN + ESPAÑOL · CONTEXTO ACUMULADO · RESPUESTA SIN TTS · VOZ PROPIA",
    });
    expect(translator?.stackPresentation?.cta).toBeUndefined();
  });

  it("provides the approved Project 13 modal data without a CTA", () => {
    const teacher = PROJECTS.find((project) => project.id === "teacher");

    expect(teacher?.modalPresentation).toEqual({
      infoAsset: "/assets/projects/previews/software-engineering-playbook/info.webp",
      infoKicker: "APRENDER SIN PERDER LA CURIOSIDAD",
      infoTitle: "KURONE-KO TEACHER",
      infoQuote:
        "Entender el nombre de un principio no significa comprender el problema que intenta evitar.",
      stackAsset: "/assets/projects/previews/software-engineering-playbook/stack.webp",
    });
    expect(teacher?.loreSections).toEqual([
      {
        heading: "MIMESIS",
        paragraphs: [
          "Mientras estudiaba arquitectura de software, noté que podía recordar una definición y aun así no reconocer cuándo debía aplicarla. Me faltaba conectar esos principios con errores, tensiones y consecuencias que pudiera imaginar dentro de un proyecto real. Kurone-ko Teacher nació de esa dificultad: quise convertir mi propio aprendizaje en una novela visual donde los problemas técnicos también fueran parte del conflicto.",
        ],
        paragraphHighlights: [[
          { text: "arquitectura de software" },
          { text: "no reconocer cuándo debía aplicarla" },
          { text: "proyecto real" },
          { text: "Kurone-ko Teacher" },
          { text: "mi propio aprendizaje" },
        ]],
      },
      {
        heading: "PAIDEIA",
        paragraphs: [
          "Por eso cada capítulo comienza con una situación concreta, la representa mediante una metáfora y solo después introduce el término técnico. No construí el proyecto desde la posición de quien tiene todas las respuestas, sino como una forma de ordenar lo que estaba aprendiendo y compartirlo con otras personas que también encuentran insuficiente memorizar definiciones.",
        ],
        paragraphHighlights: [[
          { text: "situación concreta" },
          { text: "solo después introduce el término técnico" },
          { text: "no construí el proyecto desde la posición de quien tiene todas las respuestas" },
          { text: "ordenar lo que estaba aprendiendo" },
          { text: "memorizar definiciones" },
        ]],
      },
    ]);
    expect(teacher?.stackPresentation).toEqual({
      kicker: "NOVELA VISUAL EDUCATIVA SOBRE ARQUITECTURA",
      title: "APRENDER ARQUITECTURA VIVIENDO SUS CONSECUENCIAS",
      introduction:
        "Diseñé Kurone-ko Teacher como una novela visual de misterio para estudiar arquitectura de software de una forma más cercana y memorable. Cada capítulo convierte un problema habitual del desarrollo en conflicto, metáfora y decisión, porque yo también necesitaba comprender no solo qué dicen los principios técnicos, sino qué problemas intentan evitar.",
      introductionHighlights: [
        { text: "Kurone-ko Teacher" },
        { text: "novela visual de misterio" },
        { text: "conflicto, metáfora y decisión" },
        { text: "qué problemas intentan evitar" },
      ],
      badges: ["NOVELA VISUAL", "PEDAGOGÍA", "SOLID", "CLEAN", "HEXAGONAL", "TESTING"],
      blocks: [
        {
          heading: "Aprender desde el problema",
          description:
            "Cada lección comienza con un problema reconocible: entregar bajo presión, modificar código que cuesta entender o hacer un cambio sin saber qué podría romperse. Antes de introducir el principio arquitectónico, muestro primero sus consecuencias, porque necesitaba comprender qué problema resuelve y no limitarme a memorizar su definición.",
          descriptionHighlights: [
            { text: "problema reconocible" },
            { text: "qué podría romperse" },
            { text: "muestro primero sus consecuencias" },
            { text: "qué problema resuelve" },
          ],
        },
        {
          heading: "El pingüino que no debía volar",
          description:
            "Para explicar Liskov, utilicé un pingüino dentro de un sistema que espera que todas las aves puedan volar. El pingüino no está equivocado por no hacerlo: el modelo está equivocado por imponerle una capacidad que no posee e ignorar que sabe nadar. La metáfora me permitió entender que una abstracción debe respetar la verdad de cada pieza.",
          descriptionHighlights: [
            { text: "Liskov" },
            { text: "todas las aves puedan volar" },
            { text: "el modelo está equivocado" },
            { text: "sabe nadar" },
            { text: "respetar la verdad de cada pieza" },
          ],
        },
        {
          heading: "Arquitectura dentro del misterio",
          description:
            "Integré SOLID, dirección de dependencias y arquitecturas Clean y Hexagonal en escenas, pistas y consecuencias. Elegí una novela visual porque quería que descubrir un principio técnico también ayudara a comprender el misterio, en lugar de interrumpir la historia con una clase separada.",
          descriptionHighlights: [
            { text: "SOLID" },
            { text: "dirección de dependencias" },
            { text: "Clean y Hexagonal" },
            { text: "escenas, pistas y consecuencias" },
            { text: "comprender el misterio" },
          ],
        },
        {
          heading: "Comprender tomando decisiones",
          description:
            "Las decisiones jugables obligan a elegir qué responsabilidad proteger y qué costo aceptar. Así estudié testing, observabilidad y criterio arquitectónico como herramientas para razonar frente a situaciones inciertas, no como una colección de siglas que debía repetir.",
          descriptionHighlights: [
            { text: "decisiones jugables" },
            { text: "qué responsabilidad proteger" },
            { text: "testing" },
            { text: "observabilidad" },
            { text: "criterio arquitectónico" },
          ],
        },
      ],
      evidence: "13 CAPÍTULOS · MISTERIO CONTINUO · METÁFORAS TÉCNICAS · DECISIONES EN ESCENA",
    });
    expect(teacher?.stackPresentation?.cta).toBeUndefined();
  });

  it("keeps Translator out of visible projects while constraints are unresolved", () => {
    const visibleProjectIds = getVisibleProjects().map((project) => project.id);
    const translatorDetails = getProjectTierDetails("translator");

    expect(visibleProjectIds).not.toContain("translator");
    expect(translatorDetails?.tier).toBe(PROJECT_TIER.HIDDEN);
    expect(translatorDetails?.reason).toMatch(/API/i);
    expect(translatorDetails?.reason).toMatch(/despliegue/i);
    expect(translatorDetails?.reason).toMatch(/claves/i);
  });

  it("keeps the hidden project order and exact requested card identities", () => {
    expect(PROJECTS.filter((project) => project.tier === PROJECT_TIER.HIDDEN).map((project) => project.id)).toEqual([
      "kuroneko-pos",
      "kuroneko-sii",
      "kuroneko-explorermcp",
      "translator",
      "teacher",
    ]);

    const translator = PROJECTS.find((project) => project.id === "translator");
    const teacher = PROJECTS.find((project) => project.id === "teacher");

    expect(translator?.name).toBe("Kurone-ko Translator");
    expect(translator?.front.title).toBe("Kurone-ko Translator");
    expect(translator?.front.eyebrow).toBe("Versión Fonética Alemana");
    expect(teacher?.name).toBe("Kurone-ko Teacher");
    expect(teacher?.front.title).toBe("Kurone-ko Teacher");
  });

  it("preserves representative approved personal narrative exactly", () => {
    expect(PROJECTS.find((candidate) => candidate.id === "software-engineering-playbook")?.front.summary).toContain(
      "Siento que a veces el problema no es la falta de información… En la antigua Grecia se creó un concepto para denominar aquello que era abismal, un “vacío primordial”: Khaos.",
    );
    expect(PROJECTS.find((candidate) => candidate.id === "alarm")?.back.details).toContain(
      "Como la idea le gustó mucho, después me pidió que le enseñara cómo hacerla. Fui explicándole paso a paso y finalmente le dejé un MVP para que pudiera seguir mejorándolo y corrigiendo pequeños errores por su cuenta.",
    );
    expect(PROJECTS.find((candidate) => candidate.id === "github-activity")?.back.details).toContain(
      "El CSV y el script Bash son salidas locales para revisar; el script crea commits fechados en el repositorio donde se ejecuta y nunca hace push automático.",
    );
  });
});
