import {
  PROJECT_PREVIEW_SOURCE,
  PROJECT_TIER,
  PROJECT_CARD_FRAME,
  PROJECT_CARD_PRESENTATION,
  PROJECT_PREVIEW_FIT,
  STACK_ID,
  TECHNOLOGY_ID,
  type ProjectCardBack,
  type ProjectCardFront,
  type ProjectEntry,
  type ProjectLoreSection,
  type ProjectModalPresentation,
  type ProjectPreview,
  type ProjectStackPresentation,
  type ProjectTechnologyMetadata,
  type ProjectTier,
} from "./vault-types";
import { PROJECT_UNLOCK_CHALLENGE_ID } from "./hidden-project-unlock";
import { withPublicPath } from "@/shared/routing/public-path";

const FALLBACK_PROJECT_PREVIEW: ProjectPreview = {
  image: withPublicPath("/assets/projects/ProjectsBG.webp"),
  alt: "Vista previa de la sala usada como fallback mientras se prepara una captura específica del proyecto.",
  source: PROJECT_PREVIEW_SOURCE.FALLBACK,
};

function createDemoPreview(projectId: string, assetStem: string, projectName: string): ProjectPreview {
  return {
    image: withPublicPath(`/assets/projects/previews/${projectId}/${assetStem}-preview.webp`),
    alt: `Vista previa de ${projectName}.`,
    source: PROJECT_PREVIEW_SOURCE.DEMO,
    video: {
      src: withPublicPath(`/assets/projects/previews/${projectId}/${assetStem}-video.webm`),
      type: "video/webm",
      mobile: {
        src: withPublicPath(`/assets/projects/previews/${projectId}/${assetStem}-video-mobile.webm`),
        type: "video/webm",
      },
    },
  };
}

const SOFTWARE_ENGINEERING_PLAYBOOK_PREVIEW = createDemoPreview(
  "software-engineering-playbook",
  "project1",
  "Software Engineering Playbook",
);
const TIMER_PREVIEW: ProjectPreview = {
  ...createDemoPreview("timer", "project2", "Kurone-ko Timer"),
  focal: { x: 0.5, y: 0.4, scale: 1 },
};
const FARMACIA_PREVIEW: ProjectPreview = {
  ...createDemoPreview("farmacia-linlin", "project3", "E-commerce Farmacia"),
  focal: { x: 0.5, y: 0.2, scale: 1 },
};
const ELEMENTAL_TCG_PREVIEW = createDemoPreview("elemental-tcg", "project4", "Elemental Queens");
const ALARM_PREVIEW = createDemoPreview("alarm", "project5", "Kurone-ko Alarm");
const PYMEFLOW_PREVIEW: ProjectPreview = {
  image: withPublicPath("/assets/projects/previews/pymeflow/project6-preview.webp"),
  alt: "Vista previa de Kurone-ko PymeFlow.",
  source: PROJECT_PREVIEW_SOURCE.DEMO,
  video: {
    src: withPublicPath("/assets/projects/previews/pymeflow/project6-video.webm"),
    type: "video/webm",
  },
};
const FILTER_CALLS_PREVIEW: ProjectPreview = {
  image: withPublicPath("/assets/projects/previews/filter-calls/project7-preview.webp"),
  alt: "Vista previa de Kurone-ko FilterCalls.",
  source: PROJECT_PREVIEW_SOURCE.DEMO,
  video: {
    src: withPublicPath("/assets/projects/previews/filter-calls/project7-video.webm"),
    type: "video/webm",
  },
};
const GITHUB_ACTIVITY_PREVIEW: ProjectPreview = {
  image: withPublicPath("/assets/projects/previews/github-activity/project8-preview.webp"),
  alt: "Vista previa de Kurone-ko GitHub Activity.",
  source: PROJECT_PREVIEW_SOURCE.DEMO,
  video: {
    src: withPublicPath("/assets/projects/previews/github-activity/project8-video.webm"),
    type: "video/webm",
  },
};

const LOCKED_PROJECT_PREVIEW: ProjectPreview = {
  image: withPublicPath("/assets/projects/joker.webp"),
  alt: "Carta bloqueada con la imagen de Joker.",
  fit: PROJECT_PREVIEW_FIT.CONTAIN,
  source: PROJECT_PREVIEW_SOURCE.LOCKED,
};

const UNLOCKED_PROJECT_PREVIEW: ProjectPreview = {
  image: withPublicPath("/assets/projects/joker2.webp"),
  alt: "Carta desbloqueada con la imagen de Joker.",
  fit: PROJECT_PREVIEW_FIT.CONTAIN,
  source: PROJECT_PREVIEW_SOURCE.UNLOCKED,
};

const PROJECT_SEAL_ASSETS = {
  info: withPublicPath("/assets/projects/previews/software-engineering-playbook/info.webp"),
  stack: withPublicPath("/assets/projects/previews/software-engineering-playbook/stack.webp"),
} as const;

const SOFTWARE_ENGINEERING_PLAYBOOK_MODAL: ProjectModalPresentation = {
  infoAsset: PROJECT_SEAL_ASSETS.info,
  infoKicker: "Los caminos que me gustaría recorrer",
  infoQuote:
    "A veces, el verdadero problema no es la falta de información, sino su inmensidad.",
  stackAsset: PROJECT_SEAL_ASSETS.stack,
};

const TIMER_MODAL: ProjectModalPresentation = {
  infoAsset: PROJECT_SEAL_ASSETS.info,
  infoKicker: "HISTORIA DEL PROYECTO",
  infoTitle: "KURONE-KO TIMER",
  infoQuote:
    "Había una vez un equipo que quiso construir una herramienta de productividad con muchas funcionalidades, pero la deuda técnica atacó y la idea creció más rápido que nuestra capacidad de terminarla.",
  stackAsset: PROJECT_SEAL_ASSETS.stack,
};

const FARMACIA_MODAL: ProjectModalPresentation = {
  infoAsset: PROJECT_SEAL_ASSETS.info,
  infoKicker: "UNA FARMACIA, UN NUEVO CANAL",
  infoTitle: "FARMACIAS LINLIN",
  infoQuote:
    "Hay proyectos que no nacen desde una idea llamativa, sino desde procesos cotidianos que necesitan encontrar una nueva forma de llegar a las personas.",
  stackAsset: PROJECT_SEAL_ASSETS.stack,
};

const ELEMENTAL_TCG_MODAL: ProjectModalPresentation = {
  infoAsset: PROJECT_SEAL_ASSETS.info,
  infoKicker: "UNA IDEA QUE CRECIÓ CONMIGO",
  infoTitle: "ELEMENTAL QUEENS",
  infoQuote:
    "Hay ideas que no desaparecen al crecer; esperan hasta que aprendemos cómo empezar a construirlas.",
  stackAsset: PROJECT_SEAL_ASSETS.stack,
};

const SOFTWARE_ENGINEERING_PLAYBOOK_LORE: readonly ProjectLoreSection[] = [
  {
    heading: "Génesis",
    paragraphs: [
      "En la antigua Grecia, «Khaos» no era sinónimo de desorden; representaba un “vacío primordial”: un abismo inmenso y sin límites.",
      "Algo muy similar ocurre cuando intentamos dominar una nueva disciplina o absorber conocimiento técnico. Sin una dirección clara, un sentido o un mapa que nos guíe, es muy fácil perderse en esa inmensidad… y terminar atrapado en el bucle del «Khaos».",
    ],
    paragraphHighlights: [
      [
        { lang: "grc-Latn", text: "«Khaos»" },
        { lang: "es", text: "“vacío primordial”" },
      ],
      [{ lang: "grc-Latn", text: "«Khaos»" }],
    ],
  },
  {
    heading: "Kosmos",
    paragraphs: [
      "Este es un libro de conceptos relacionados con el desarrollo de software. Incluye temas de arquitectura y buenas prácticas que he aprendido y recolectado con el tiempo.",
      "Me gustaría algún día construir mi propia casita, ladrillo a ladrillo, hasta convertirla en el hogar que deseo... y esa misma analogía quiero aplicarla a la clase de desarrollador que me gustaría llegar a ser.",
    ],
    paragraphHighlights: [[{ text: "arquitectura" }, { text: "buenas prácticas" }], []],
  },
];

const SOFTWARE_ENGINEERING_PLAYBOOK_STACK: ProjectStackPresentation = {
  kicker: "TECNOLOGÍAS Y PRÁCTICAS",
  title: "ARQUITECTURA",
  introduction:
    "Una base de conocimiento Markdown-first que convierte fundamentos de ingeniería en rutas progresivas y criterios aplicables.",
  introductionHighlights: [{ text: "Markdown-first" }],
  blocks: [
    {
      heading: "Arquitectura del conocimiento",
      description:
        "13 temas y 39 módulos organizados en tres niveles: fundamentos, aplicación e integración.",
      descriptionHighlights: [
        { text: "fundamentos" },
        { text: "aplicación" },
        { text: "integración" },
      ],
    },
    {
      heading: "Flujo editorial",
      description:
        "Cada concepto se destila en modelos mentales, analogías, diagramas, ejemplos, errores frecuentes y guías de decisión.",
    },
    {
      heading: "Control documental",
      description:
        "GitHub Actions valida consistencia Markdown, enlaces y presencia de la progresión 01/02/03.",
      descriptionHighlights: [{ text: "GitHub Actions" }, { text: "01/02/03" }],
    },
    {
      heading: "Modelo de contribución",
      description:
        "Las mejoras sustantivas comienzan como issues para preservar la voz, la secuencia y la coherencia del playbook.",
      descriptionHighlights: [
        { text: "voz" },
        { text: "secuencia" },
        { text: "coherencia" },
      ],
    },
  ],
  technicalBase: {
    heading: "Base técnica",
    value: "Markdown · Git · GitHub · GitHub Actions · markdownlint · Lychee",
    valueHighlights: [],
  },
  evidence: "13 temas · 39 módulos progresivos · documentación en inglés",
  cta: {
    label: "Ver el proyecto en GitHub",
    href: "https://github.com/DevMPoveaCL/software-engineering-playbook",
    confirmationPurpose:
      "Explorarás Software Engineering Playbook en su repositorio de GitHub",
  },
  badges: [
    "Architecture & SOLID",
    "API & Interface Design",
    "React",
    "Spring Boot",
    "Docker",
    "Networking",
    "UX/UI Accessibility",
  ],
};

const FARMACIA_LORE: readonly ProjectLoreSection[] = [
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
];

const FARMACIA_STACK: ProjectStackPresentation = {
  kicker: "TECNOLOGÍA Y OPERACIÓN FARMACÉUTICA",
  title: "COMERCIO BAJO REGLAS REALES",
  introduction:
    "Farmacias LinLin conecta la venta online con la operación de una farmacia física. El sistema organiza catálogo, pedidos, recetas y despachos aplicando condiciones de venta y permisos según cada rol.",
  introductionHighlights: [
    { text: "Farmacias LinLin" },
    { text: "permisos según cada rol" },
  ],
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
  badges: ["Angular 18", "Ionic 8", "TypeScript", "RxJS", "Firebase", "Capacitor", "Playwright"],
};

const ELEMENTAL_TCG_LORE: readonly ProjectLoreSection[] = [
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
];

const ELEMENTAL_TCG_STACK: ProjectStackPresentation = {
  kicker: "TECNOLOGÍA Y NARRATIVA INTERACTIVA",
  title: "UN UNIVERSO TÁCTICO EN LA WEB",
  introduction:
    "Construí Elemental Queens como una landing conceptual que presenta la identidad, las cartas y las reglas fundamentales de un futuro videojuego mediante una experiencia web navegable.",
  introductionHighlights: [
    { text: "Elemental Queens" },
    { text: "landing conceptual" },
  ],
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
  badges: ["Astro 6", "TypeScript", "Tailwind CSS 4", "Vite 7", "Playwright", "WCAG", "Cloudflare Pages"],
};

const ALARM_MODAL: ProjectModalPresentation = {
  infoAsset: PROJECT_SEAL_ASSETS.info,
  infoKicker: "AYUDANDO A UN AMIGO",
  infoTitle: "KURONE-KO ALARM",
  infoQuote:
    "Cada semana, una nueva planilla significaba volver a configurar todas las alarmas.",
  stackAsset: PROJECT_SEAL_ASSETS.stack,
};

const ALARM_LORE: readonly ProjectLoreSection[] = [
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
];

const ALARM_STACK: ProjectStackPresentation = {
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
  badges: ["Flutter", "Dart", "Riverpod", "Drift", "SQLite", "Excel", "Kotlin", "Android"],
};

const PYMEFLOW_MODAL: ProjectModalPresentation = {
  infoAsset: PROJECT_SEAL_ASSETS.info,
  infoKicker: "UNA NECESIDAD DE PYME LLEVADA A SOFTWARE",
  infoTitle: "KURONE-KO PYMEFLOW",
  infoQuote:
    "Antes de intentar construir un sistema completo, decidí comprobar si podía ordenar movimientos y proyectar caja de una forma clara.",
  stackAsset: PROJECT_SEAL_ASSETS.stack,
};

const PYMEFLOW_LORE: readonly ProjectLoreSection[] = [
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
];

const PYMEFLOW_STACK: ProjectStackPresentation = {
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
  badges: ["Java 21", "Spring Boot 3", "PostgreSQL 16", "Flyway", "OpenAPI", "Docker", "JUnit 5", "ArchUnit"],
};

const FILTER_CALLS_MODAL: ProjectModalPresentation = {
  infoAsset: PROJECT_SEAL_ASSETS.info,
  infoKicker: "UNA MOLESTIA DIARIA CONVERTIDA EN CONTROL",
  infoTitle: "KURONE-KO FILTERCALLS",
  infoQuote:
    "Quería ponerle un límite a las llamadas spam sin tener que entregar mis datos para conseguirlo.",
  stackAsset: PROJECT_SEAL_ASSETS.stack,
};

const FILTER_CALLS_LORE: readonly ProjectLoreSection[] = [
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
];

const FILTER_CALLS_STACK: ProjectStackPresentation = {
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
  badges: ["Android", "Kotlin", "Jetpack Compose", "Material 3", "DataStore", "Coroutines", "Gradle"],
};

const GITHUB_ACTIVITY_MODAL: ProjectModalPresentation = {
  infoAsset: PROJECT_SEAL_ASSETS.info,
  infoKicker: "UNA CURIOSIDAD CONVERTIDA EN HERRAMIENTA",
  infoTitle: "KURONE-KO GITHUB ACTIVITY",
  infoQuote:
    "Todo comenzó con una pregunta: ¿era posible escribir una frase en el calendario de GitHub?",
  stackAsset: PROJECT_SEAL_ASSETS.stack,
};

const GITHUB_ACTIVITY_LORE: readonly ProjectLoreSection[] = [
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
];

const GITHUB_ACTIVITY_STACK: ProjectStackPresentation = {
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
  badges: ["React", "TypeScript", "Vite", "Bash", "Git", "GitHub", "Vitest"],
};

const KURONEKO_POS_MODAL: ProjectModalPresentation = {
  infoAsset: PROJECT_SEAL_ASSETS.info,
  infoKicker: "UNA NECESIDAD COMPARTIDA POR MUCHAS PYMES",
  infoTitle: "KURONE-KO POS",
  infoQuote:
    "El software debía adaptarse a las reglas del negocio, no obligar al negocio a cambiar sus reglas por las limitaciones de su arquitectura.",
  stackAsset: PROJECT_SEAL_ASSETS.stack,
};

const KURONEKO_POS_LORE: readonly ProjectLoreSection[] = [
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
];

const KURONEKO_POS_STACK: ProjectStackPresentation = {
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
  badges: ["Go", "Wails", "TypeScript", "Vite", "SQLite", "Vitest", "Playwright"],
};

const KURONEKO_SII_MODAL: ProjectModalPresentation = {
  infoAsset: PROJECT_SEAL_ASSETS.info,
  infoKicker: "CUANDO LOS REGISTROS CONCILIAN, EL NEGOCIO SE ORDENA",
  infoTitle: "KURONE-KO SII",
  infoQuote:
    "Cerrar un mes no debería significar reconstruir a mano decisiones que el negocio ya dejó registradas.",
  stackAsset: PROJECT_SEAL_ASSETS.stack,
};

const KURONEKO_SII_LORE: readonly ProjectLoreSection[] = [
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
];

const KURONEKO_SII_STACK: ProjectStackPresentation = {
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
  badges: ["POS", "PYMEFLOW", "DTE", "IVA", "F29", "IA"],
};

const KURONEKO_EXPLORERMCP_MODAL: ProjectModalPresentation = {
  infoAsset: PROJECT_SEAL_ASSETS.info,
  infoKicker: "CUANDO VER UNA VENTANA NO SIGNIFICA COMPRENDERLA",
  infoTitle: "KURONE-KO EXPLORERMCP",
  infoQuote:
    "No quería que una IA aprendiera a hacer clic a ciegas; quería darle una forma segura de comprender dónde estaba y qué significaba actuar.",
  stackAsset: PROJECT_SEAL_ASSETS.stack,
};

const KURONEKO_EXPLORERMCP_LORE: readonly ProjectLoreSection[] = [
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
];

const KURONEKO_EXPLORERMCP_STACK: ProjectStackPresentation = {
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
  badges: ["C#", ".NET", "MCP", "UIA", "WIN32", "WEBSOCKET", "XUNIT"],
};

const KURONEKO_TRANSLATOR_MODAL: ProjectModalPresentation = {
  infoAsset: PROJECT_SEAL_ASSETS.info,
  infoKicker: "CUANDO NO ENTENDER A TIEMPO TAMBIÉN ES QUEDAR EXPUESTO",
  infoTitle: "KURONE-KO TRANSLATOR",
  infoQuote:
    "Quería que la tecnología me ayudara a permanecer en la conversación, no que hablara por mí.",
  stackAsset: PROJECT_SEAL_ASSETS.stack,
};

const KURONEKO_TRANSLATOR_LORE: readonly ProjectLoreSection[] = [
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
];

const KURONEKO_TRANSLATOR_STACK: ProjectStackPresentation = {
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
  evidence: "ALEMÁN + ESPAÑOL · CONTEXTO ACUMULADO · RESPUESTA SIN TTS · VOZ PROPIA",
  badges: ["GO", "DEEPGRAM", "WEBSOCKET", "WINMM", "SSE", "LLM"],
};

const KURONEKO_TEACHER_MODAL: ProjectModalPresentation = {
  infoAsset: PROJECT_SEAL_ASSETS.info,
  infoKicker: "APRENDER SIN PERDER LA CURIOSIDAD",
  infoTitle: "KURONE-KO TEACHER",
  infoQuote:
    "Entender el nombre de un principio no significa comprender el problema que intenta evitar.",
  stackAsset: PROJECT_SEAL_ASSETS.stack,
};

const KURONEKO_TEACHER_LORE: readonly ProjectLoreSection[] = [
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
];

const KURONEKO_TEACHER_STACK: ProjectStackPresentation = {
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
  badges: ["NOVELA VISUAL", "PEDAGOGÍA", "SOLID", "CLEAN", "HEXAGONAL", "TESTING"],
};

export interface ProjectTierDetails {
  tier: ProjectTier;
  reason: string;
  status: string;
  productionUrl?: string;
}

const ORNATE_MEDIA_TITLE_BANDS = {
  frame: PROJECT_CARD_FRAME.ORNATE,
  presentation: PROJECT_CARD_PRESENTATION.MEDIA_TITLE_BANDS,
} as const;

function createProject(params: {
  challengeId?: string;
  id: string;
  name: string;
  tier: ProjectTier;
   showcaseEligible: boolean;
   reason: string;
   status: string;
   overviewDescription?: string;
   productionUrl?: string;
  preview: ProjectPreview;
  lockedPreview?: ProjectPreview;
  unlockedPreview?: ProjectPreview;
  cardVisual?: typeof ORNATE_MEDIA_TITLE_BANDS;
  front: ProjectCardFront;
  back: ProjectCardBack;
  loreSections?: readonly ProjectLoreSection[];
  modalPresentation?: ProjectModalPresentation;
  technologyMetadata: ProjectTechnologyMetadata;
  stackPresentation?: ProjectStackPresentation;
  accessibleHint: string;
 }): ProjectEntry {
  return {
    ...params,
    preview: params.preview,
    ...(params.cardVisual === undefined
      ? {}
      : { cardVisual: params.cardVisual }),
    ...(params.modalPresentation === undefined
      ? {}
      : { modalPresentation: params.modalPresentation }),
    narrativeHook: params.front.summary.join(" "),
    curiosityReveal: params.back.details.join(" "),
  };
}

const PROJECTS_SOURCE: ProjectEntry[] = [
  createProject({
    id: "software-engineering-playbook",
    name: "Software Engineering Playbook",
    tier: PROJECT_TIER.VISIBLE,
    showcaseEligible: true,
    overviewDescription:
      "Guía que organiza fundamentos de ingeniería de software en rutas de aprendizaje progresivas y aplicables. Cada tema conecta arquitectura, testing y decisiones de entrega para convertir estudio disperso en un criterio de construcción revisable.",
    preview: SOFTWARE_ENGINEERING_PLAYBOOK_PREVIEW,
    cardVisual: ORNATE_MEDIA_TITLE_BANDS,
    reason:
      "Es el punto de partida porque muestra cómo intento ordenar mi aprendizaje antes de construir sin dirección.",
    status: "Documento vivo",
    front: {
      eyebrow: "Los caminos que me gustaría recorrer",
      title: "Software Engineering Playbook",
      summary: [
        "Siento que a veces el problema no es la falta de información… En la antigua Grecia se creó un concepto para denominar aquello que era abismal, un “vacío primordial”: Khaos.",
        "Siento que algo parecido nos ocurre muchas veces cuando intentamos iniciarnos en una disciplina o adquirir nuevos conocimientos. Si comenzamos sin una dirección, un sentido o un objetivo concreto, es fácil terminar atrapados en ese bucle de Khaos.",
      ],
    },
      back: {
      title: "Revelación",
      details: [
        "He ido creando un libro de conceptos, arquitectura y buenas prácticas que he aprendido y recolectado con el tiempo.",
        "Lo hice con el fin de seguir una ruta de aprendizaje más guiada, un camino que me ayude a avanzar con más orden hacia la forma en que me gustaría construir software.",
      ],
    },
    loreSections: SOFTWARE_ENGINEERING_PLAYBOOK_LORE,
    modalPresentation: SOFTWARE_ENGINEERING_PLAYBOOK_MODAL,
    stackPresentation: SOFTWARE_ENGINEERING_PLAYBOOK_STACK,
    technologyMetadata: {
      stacks: [],
      technologies: [],
      practices: ["Architecture", "Testing", "Delivery process"],
      evidence: [],
    },
    accessibleHint:
      "Proyecto visible. Playbook de ingeniería con criterios de arquitectura, pruebas y proceso.",
  }),
  createProject({
    id: "timer",
    name: "Kurone-ko Timer",
    tier: PROJECT_TIER.VISIBLE,
    showcaseEligible: true,
    overviewDescription:
      "Pomodoro de escritorio con temporizador flotante, persistencia local y una interfaz construida con React sobre Tauri y Rust. Modela foco, descanso, historial y configuración como estados explícitos, con pruebas de comportamiento para sus dos ventanas nativas.",
    preview: TIMER_PREVIEW,
    cardVisual: ORNATE_MEDIA_TITLE_BANDS,
    reason:
      "Es pequeño, claro y muestra cómo pienso estados, pausas y feedback sin esconderme detrás de complejidad.",
    status: "Funcional",
    front: {
      eyebrow: "Retomar lo pendiente",
      title: "Kurone-ko Timer",
      summary: [
        "Había una vez un equipo que quiso construir una herramienta de productividad con muchas funcionalidades, pero la deuda técnica atacó y la idea creció más rápido que nuestra capacidad de terminarla.",
      ],
    },
    back: {
      title: "Revelación",
      details: [
        "Fui partícipe de un bootcamp de programación en el que, como proyecto integrador, se nos pidió formar equipos de trabajo, desarrollar y presentar una aplicación que reuniera los aprendizajes obtenidos durante el proceso.",
        "Tal vez por nuestra inocencia e inexperiencia, intentamos crear una herramienta de productividad demasiado ambiciosa… pero el alcance creció demasiado y quedó inconclusa.",
        "Años después quise retomarla con una visión más simple, enfocada en organizar mis sesiones de estudio y desarrollo.",
      ],
    },
    loreSections: [
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
    ],
    modalPresentation: TIMER_MODAL,
    stackPresentation: {
      kicker: "TECNOLOGÍAS Y FUNCIONAMIENTO",
      title: "FOCO SIN DISTRACCIONES",
      introduction:
        "Kurone-ko Timer es una aplicación Pomodoro de escritorio para Windows. Permite organizar sesiones de foco y descanso desde una ventana principal y seguir el tiempo en una ventana flotante compacta.",
      introductionHighlights: [
        { text: "Kurone-ko Timer" },
        { text: "Pomodoro" },
        { text: "Windows" },
      ],
      blocks: [
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
      ],
      evidence: "Control completo con teclado o ratón · ventanas arrastrables.",
      cta: {
        label: "Ver el proyecto en GitHub",
        href: "https://github.com/DevMPoveaCL/kurone-ko-timer",
        confirmationPurpose:
          "Explorarás Kurone-ko Timer en su repositorio de GitHub",
      },
      badges: ["Tauri 2", "React 19", "TypeScript", "Zustand", "Rust", "Vitest", "Playwright"],
    },
    technologyMetadata: {
      stacks: [STACK_ID.TAURI],
      technologies: [
        TECHNOLOGY_ID.REACT,
        TECHNOLOGY_ID.TYPESCRIPT,
        TECHNOLOGY_ID.VITE,
        TECHNOLOGY_ID.ZUSTAND,
        TECHNOLOGY_ID.RUST,
        TECHNOLOGY_ID.VITEST,
        TECHNOLOGY_ID.PLAYWRIGHT,
      ],
      labels: {
        [STACK_ID.TAURI]: "Tauri 2",
        [TECHNOLOGY_ID.REACT]: "React 19",
      },
      practices: ["Interaction states"],
      evidence: [
        {
          filterId: STACK_ID.TAURI,
          detail: "dependencies.@tauri-apps/api",
        },
        {
          filterId: TECHNOLOGY_ID.REACT,
          detail: "dependencies.react and dependencies.react-dom",
        },
        {
          filterId: TECHNOLOGY_ID.TYPESCRIPT,
          detail: "devDependencies.typescript",
        },
        {
          filterId: TECHNOLOGY_ID.VITE,
          detail: "devDependencies.vite",
        },
        {
          filterId: TECHNOLOGY_ID.ZUSTAND,
          detail: "dependencies.zustand",
        },
        {
          filterId: TECHNOLOGY_ID.RUST,
          detail: "package edition and Rust dependencies",
        },
        {
          filterId: TECHNOLOGY_ID.VITEST,
          detail: "scripts.test and devDependencies.vitest",
        },
        {
          filterId: TECHNOLOGY_ID.PLAYWRIGHT,
          detail: "scripts.test:e2e and devDependencies.@playwright/test",
        },
      ],
    },
    accessibleHint:
      "Proyecto visible. Temporizador centrado en estados de uso y claridad de interacción.",
  }),
  createProject({
    id: "elemental-tcg",
    name: "Elemental Queens",
    tier: PROJECT_TIER.VISIBLE,
    showcaseEligible: true,
    overviewDescription:
      "Landing narrativa para un juego de cartas táctico, construida con Astro. La interfaz convierte mitología, estrategia y exploración visual en una entrada clara hacia el sistema del juego.",
    preview: ELEMENTAL_TCG_PREVIEW,
    cardVisual: ORNATE_MEDIA_TITLE_BANDS,
    reason:
      "Tiene fantasía, reglas y decisiones de producto suficientes para mostrar cómo convierto juego en sistema.",
    status: "Landing page de un futuro videojuego de cartas",
    productionUrl: "https://kurone-ko-elementaltcg.pages.dev/",
    front: {
      eyebrow: "Construir para mi niño interior",
      title: "Elemental Queens",
      summary: [
        "Desde niño amaba los juegos de cartas, sobre todo Mitos y Leyendas. Me fascinaban sus mecánicas y esos lores que enseñaban historia de forma creativa e interesante.",
        "Quise combinar ese gusto con mi hobby principal actual y desarrollar aquello que siempre quise crear.",
      ],
    },
    back: {
      title: "Revelación",
      details: [
        "Creo que una de las cosas que más me llamó la atención al principio fueron las animaciones y estéticas de ciertos sitios web que navegaba. Quedaban plasmadas en mi mente y me preguntaba cómo se harían esos efectos, o si algún día podría crear mi propia página web.",
        "Así comenzó parte de mi gusto por el mundo del desarrollo. Con ElementalTCG quise cumplir y ser responsable con una idea que alguna vez me propuse: mezclar cartas, estrategia, ajedrez, mitología e historia en una experiencia propia.",
      ],
    },
    loreSections: ELEMENTAL_TCG_LORE,
    modalPresentation: ELEMENTAL_TCG_MODAL,
    stackPresentation: ELEMENTAL_TCG_STACK,
    technologyMetadata: {
      stacks: [STACK_ID.ASTRO],
      technologies: [
        TECHNOLOGY_ID.TYPESCRIPT,
        TECHNOLOGY_ID.TAILWIND_CSS,
        TECHNOLOGY_ID.VITE,
        TECHNOLOGY_ID.PLAYWRIGHT,
      ],
      labels: {
        [STACK_ID.ASTRO]: "Astro 6",
        [TECHNOLOGY_ID.TAILWIND_CSS]: "Tailwind CSS 4",
        [TECHNOLOGY_ID.VITE]: "Vite 7",
      },
      practices: ["Game design", "State modeling"],
      evidence: [
        {
          filterId: STACK_ID.ASTRO,
          detail: "devDependencies.astro",
        },
        {
          filterId: TECHNOLOGY_ID.TYPESCRIPT,
          detail: "devDependencies.typescript",
        },
        {
          filterId: TECHNOLOGY_ID.TAILWIND_CSS,
          detail: "dependencies.tailwindcss",
        },
        {
          filterId: TECHNOLOGY_ID.VITE,
          detail: "devDependencies.vite",
        },
        {
          filterId: TECHNOLOGY_ID.PLAYWRIGHT,
          detail: "scripts.test:e2e and devDependencies.@playwright/test; e2e/mobile-responsive.spec.ts",
        },
      ],
    },
    accessibleHint:
      "Proyecto visible. Landing page de un futuro videojuego de cartas con reglas elementales y modelado de estado.",
  }),
  createProject({
    id: "alarm",
    name: "Kurone-ko Alarm",
    tier: PROJECT_TIER.VISIBLE,
    showcaseEligible: true,
    overviewDescription:
      "App Android que transforma turnos rotativos desde Excel en alarmas locales revisables antes de programarlas. Separa importación, validación y programación para que una persona pueda corregir el calendario antes de confiarle sus recordatorios al dispositivo.",
    preview: ALARM_PREVIEW,
    cardVisual: ORNATE_MEDIA_TITLE_BANDS,
    reason:
      "Nació de una necesidad cotidiana donde confiabilidad, feedback y control importan más que decorar la pantalla.",
    status: "Funcional",
    front: {
      eyebrow: "Ayudando a un amigo",
      title: "Kurone-ko Alarm",
      summary: [
        "Un amigo cercano trabajaba de noche con turnos rotativos y descansos variables. Cada semana recibía sus horarios en una planilla Excel y debía configurar sus alarmas una por una en el celular.",
      ],
    },
    back: {
      title: "Revelación",
      details: [
        "Alarm nació para aliviar esa rutina repetitiva. La idea fue que pudiera subir su planilla y que el sistema reconociera sus horarios para configurar las alarmas automáticamente.",
        "Como la idea le gustó mucho, después me pidió que le enseñara cómo hacerla. Fui explicándole paso a paso y finalmente le dejé un MVP para que pudiera seguir mejorándolo y corrigiendo pequeños errores por su cuenta.",
      ],
    },
    loreSections: ALARM_LORE,
    modalPresentation: ALARM_MODAL,
    stackPresentation: ALARM_STACK,
    technologyMetadata: {
      stacks: [STACK_ID.FLUTTER, STACK_ID.ANDROID],
      technologies: [
        TECHNOLOGY_ID.DART,
        TECHNOLOGY_ID.RIVERPOD,
        TECHNOLOGY_ID.SQLITE,
        TECHNOLOGY_ID.DRIFT,
        TECHNOLOGY_ID.GOOGLE_ML_KIT,
        TECHNOLOGY_ID.KOTLIN,
      ],
      practices: ["Interaction design"],
      evidence: [
        {
          filterId: STACK_ID.FLUTTER,
          detail: "dependencies.flutter",
        },
        {
          filterId: STACK_ID.ANDROID,
          detail: "com.android.application plugin and Android application configuration",
        },
        {
          filterId: TECHNOLOGY_ID.DART,
          detail: "environment.sdk",
        },
        {
          filterId: TECHNOLOGY_ID.RIVERPOD,
          detail: "dependencies.flutter_riverpod",
        },
        {
          filterId: TECHNOLOGY_ID.SQLITE,
          detail: "dependencies.sqlite3_flutter_libs",
        },
        {
          filterId: TECHNOLOGY_ID.DRIFT,
          detail: "dependencies.drift",
        },
        {
          filterId: TECHNOLOGY_ID.GOOGLE_ML_KIT,
          detail: "dependencies.google_ml_kit",
        },
        {
          filterId: TECHNOLOGY_ID.KOTLIN,
          detail: "Kotlin AlarmSchedulerAdapter native bridge implementation",
        },
      ],
    },
    accessibleHint:
      "Proyecto visible. Alarma enfocada en feedback, control y uso cotidiano.",
  }),
  createProject({
    id: "filter-calls",
    name: "Kurone-ko FilterCalls",
    tier: PROJECT_TIER.VISIBLE,
    showcaseEligible: true,
    overviewDescription:
      "App Android local-first que filtra llamadas mediante reglas configurables sin enviar la agenda a terceros. Explora permisos mínimos, decisiones de privacidad y feedback comprensible para reducir interrupciones sin convertir los datos personales en una dependencia remota.",
    preview: FILTER_CALLS_PREVIEW,
    cardVisual: ORNATE_MEDIA_TITLE_BANDS,
    reason:
      "Muestra cómo una decisión de diseño puede cuidar atención y seguridad sin prometer magia.",
    status: "Exploración funcional",
    front: {
      eyebrow: "Cuidar desde el diseño",
      title: "Kurone-ko FilterCalls",
      summary: [
        "Hay molestias cotidianas que parecen pequeñas hasta que se repiten todos los días. Las llamadas spam son una de ellas: interrumpen, cansan y muchas veces obligan a desconfiar incluso de llamadas que podrían ser importantes.",
      ],
    },
    back: {
      title: "Revelación",
      details: [
        "Kurone-ko FilterCalls nace como una idea para enfrentar ese problema desde el cuidado y la privacidad.",
        "Todavía está en una etapa temprana, pero la intención es clara: construir una aplicación Android que pueda filtrar llamadas no deseadas en Chile sin depender de enviar datos personales a un backend ni pedir permisos innecesarios.",
        "Me interesa que este proyecto crezca desde una base responsable, donde la utilidad no pase por encima de la privacidad.",
      ],
    },
    loreSections: FILTER_CALLS_LORE,
    modalPresentation: FILTER_CALLS_MODAL,
    technologyMetadata: {
      stacks: [STACK_ID.ANDROID],
      technologies: [TECHNOLOGY_ID.KOTLIN, TECHNOLOGY_ID.JETPACK_COMPOSE],
      practices: ["Privacy-first product design", "Permission minimization"],
      evidence: [
        {
          filterId: STACK_ID.ANDROID,
          detail: "android application plugin",
        },
        {
          filterId: TECHNOLOGY_ID.KOTLIN,
          detail: "kotlin.android plugin",
        },
        {
          filterId: TECHNOLOGY_ID.JETPACK_COMPOSE,
          detail: "compose plugin and build feature",
        },
      ],
    },
    stackPresentation: FILTER_CALLS_STACK,
    accessibleHint:
      "Proyecto visible. Kurone-ko FilterCalls explora el filtrado de llamadas, el control y la reducción de interrupciones.",
  }),
  createProject({
    id: "github-activity",
    name: "Kurone-ko GitHub Activity",
    tier: PROJECT_TIER.VISIBLE,
    showcaseEligible: true,
    overviewDescription:
      "Herramienta web que diseña patrones para el calendario de contribuciones y exporta automatización revisable. Previsualiza fechas, colisiones y contexto antes de generar CSV o commits fechados, manteniendo el flujo local y bajo control del usuario.",
    preview: GITHUB_ACTIVITY_PREVIEW,
    cardVisual: ORNATE_MEDIA_TITLE_BANDS,
    reason:
      "Convierte una frase y un rango de fechas en un patrón revisable antes de tocar el historial local.",
    status: "Herramienta local funcional",
    front: {
      eyebrow: "DIBUJAR FRASES CON COMMITS",
      title: "Kurone-ko GitHub Activity",
      summary: [
        "Quise ver una frase completa sobre un calendario de contribuciones antes de convertir una idea visual en commits fechados.",
        "El proyecto separa la planificación, la actividad existente y la exportación para que cada cambio pueda revisarse localmente.",
      ],
    },
    back: {
      title: "Revelación",
      details: [
        "Kurone-ko GitHub Activity nació como una herramienta local para previsualizar frases de 5x7 sobre fechas históricas del calendario de contribuciones, con cortes anuales y una vista continua de varios años.",
        "Con el tiempo dejé atrás la edición manual de celdas: ahora la frase genera el patrón, la actividad importada o simulada se muestra como contexto y las colisiones quedan visibles antes de exportar.",
        "El CSV y el script Bash son salidas locales para revisar; el script crea commits fechados en el repositorio donde se ejecuta y nunca hace push automático.",
      ],
    },
    loreSections: GITHUB_ACTIVITY_LORE,
    modalPresentation: GITHUB_ACTIVITY_MODAL,
    technologyMetadata: {
      stacks: [],
      technologies: [
        TECHNOLOGY_ID.REACT,
        TECHNOLOGY_ID.TYPESCRIPT,
        TECHNOLOGY_ID.VITE,
        TECHNOLOGY_ID.VITEST,
      ],
      practices: ["UTC date modeling", "Local-first workflow", "Reviewable exports"],
      evidence: [
        {
          filterId: TECHNOLOGY_ID.REACT,
          detail: "dependencies.react and dependencies.react-dom",
        },
        {
          filterId: TECHNOLOGY_ID.TYPESCRIPT,
          detail: "devDependencies.typescript",
        },
        {
          filterId: TECHNOLOGY_ID.VITE,
          detail: "devDependencies.vite",
        },
        {
          filterId: TECHNOLOGY_ID.VITEST,
          detail: "scripts.test and devDependencies.vitest",
        },
      ],
    },
    stackPresentation: GITHUB_ACTIVITY_STACK,
    accessibleHint:
      "Proyecto visible. Visualizador local para planificar, revisar y exportar patrones de contribución sin conexión automática a GitHub.",
  }),
  createProject({
    id: "portfolio",
    name: "Portfolio",
    tier: PROJECT_TIER.DEFERRED,
    showcaseEligible: false,
    preview: LOCKED_PROJECT_PREVIEW,
    reason:
      "Ya contiene la experiencia completa; dejarlo fuera del recorrido visible evita explicar la obra con otra tarjeta sobre la misma obra.",
    status: "En construcción activa",
    front: {
      eyebrow: "La bóveda misma",
      title: "Portfolio",
      summary: [
        "Prefiero que se entienda caminándolo antes que convertirlo en una tarjeta más.",
      ],
    },
    back: {
      title: "El marco sostiene el recorrido",
      details: [
        "La experiencia combina accesibilidad, narrativa y arquitectura visual para que el misterio acompañe sin esconder la información importante.",
      ],
      outcome:
        "Queda como capa diferida: útil para explicar decisiones internas, no para competir con los proyectos visibles.",
    },
    technologyMetadata: {
      stacks: [STACK_ID.NEXT_JS],
      technologies: [
        TECHNOLOGY_ID.REACT,
        TECHNOLOGY_ID.TYPESCRIPT,
        TECHNOLOGY_ID.TAILWIND_CSS,
      ],
      practices: ["Accessibility", "Visual architecture"],
      evidence: [
        {
          filterId: STACK_ID.NEXT_JS,
          detail: "dependencies.next",
        },
        {
          filterId: TECHNOLOGY_ID.REACT,
          detail: "dependencies.react and dependencies.react-dom",
        },
        {
          filterId: TECHNOLOGY_ID.TYPESCRIPT,
          detail: "devDependencies.typescript",
        },
        {
          filterId: TECHNOLOGY_ID.TAILWIND_CSS,
          detail: "devDependencies.tailwindcss",
        },
      ],
    },
    accessibleHint:
      "Proyecto diferido. Presenta el portafolio interactivo y sus decisiones de accesibilidad.",
  }),
  createProject({
    id: "farmacia-linlin",
    name: "E-commerce Farmacia",
    tier: PROJECT_TIER.VISIBLE,
    showcaseEligible: true,
    overviewDescription:
      "E-commerce farmacéutico que integra catálogo, recetas, pedidos, roles y despacho mediante Angular, Ionic y Firebase. Sus flujos distinguen condiciones de venta, validación de stock y revisión de recetas para coordinar clientes, administración, químicos y reparto.",
    preview: FARMACIA_PREVIEW,
    cardVisual: ORNATE_MEDIA_TITLE_BANDS,
    reason:
      "Tiene valor como caso real de gestión, pero necesita contexto para no desplazar el relato principal.",
    status: "Disponible en producción",
    productionUrl: "https://farmacialinlin.web.app",
    front: {
      eyebrow: "Ordenar decisiones reales",
      title: "E-commerce Farmacia",
      summary: [
        "Hay proyectos que no nacen desde una idea llamativa, sino desde procesos cotidianos que necesitan más orden.",
      ],
    },
    back: {
      title: "Revelación",
      details: [
        "Farmacia Linlin representa ese tipo de caso: gestión, inventario, productos y decisiones internas que no siempre se ven interesantes desde afuera, pero que pueden afectar mucho el trabajo diario de una persona o negocio.",
        "Lo veo como una cámara más profunda porque no busca impresionar por su apariencia, sino mostrar cómo una solución puede ayudar a ordenar información y tomar mejores decisiones.",
      ],
    },
    loreSections: FARMACIA_LORE,
    modalPresentation: FARMACIA_MODAL,
    stackPresentation: FARMACIA_STACK,
    technologyMetadata: {
      stacks: [],
      technologies: [
        TECHNOLOGY_ID.ANGULAR,
        TECHNOLOGY_ID.TYPESCRIPT,
        TECHNOLOGY_ID.IONIC,
        TECHNOLOGY_ID.FIREBASE,
        TECHNOLOGY_ID.CAPACITOR,
        TECHNOLOGY_ID.PLAYWRIGHT,
      ],
      labels: {
        [TECHNOLOGY_ID.ANGULAR]: "Angular 18",
        [TECHNOLOGY_ID.IONIC]: "Ionic 8",
      },
      practices: ["Inventory workflows", "Information organization"],
      evidence: [
        {
          filterId: TECHNOLOGY_ID.ANGULAR,
          detail: "dependencies.@angular/core",
        },
        {
          filterId: TECHNOLOGY_ID.TYPESCRIPT,
          detail: "devDependencies.typescript",
        },
        {
          filterId: TECHNOLOGY_ID.IONIC,
          detail: "dependencies.@ionic/angular",
        },
        {
          filterId: TECHNOLOGY_ID.FIREBASE,
          detail: "Firestore, Hosting, Storage and Functions configuration",
        },
        {
          filterId: TECHNOLOGY_ID.CAPACITOR,
          detail: "Capacitor application configuration",
        },
        {
          filterId: TECHNOLOGY_ID.PLAYWRIGHT,
          detail: "scripts.e2e and devDependencies.@playwright/test; tests/product-detail/product-detail.spec.ts",
        },
      ],
    },
    accessibleHint:
      "Proyecto visible. Caso de farmacia relacionado con gestión e inventario.",
  }),
  createProject({
    id: "pymeflow",
    name: "Kurone-ko PymeFlow",
    tier: PROJECT_TIER.VISIBLE,
    showcaseEligible: true,
    overviewDescription:
      "Backend hexagonal que clasifica movimientos de una pyme y proyecta su flujo de caja con trazabilidad. Recibe eventos financieros, los categoriza y los convierte en una lectura operativa del presente y de los escenarios que vienen.",
    preview: PYMEFLOW_PREVIEW,
    cardVisual: ORNATE_MEDIA_TITLE_BANDS,
    reason:
      "Es una capa financiera funcional que me permite mostrar cómo separo los eventos financieros de la operación comercial.",
    status: "MVP funcional de capa financiera",
    front: {
      eyebrow: "Seguir el rastro que deja el dinero",
      title: "Kurone-ko PymeFlow",
      summary: [
        "Quise convertir cartolas, depósitos y cargos en un presente financiero entendible y una proyección de flujo de caja que ayude a mirar lo que viene.",
      ],
    },
    back: {
      title: "Revelación",
      details: [
        "Mi interés por las finanzas personales y la contabilidad me llevó a construir un MVP funcional con Java y Spring Boot que trabaja con cartolas, movimientos, depósitos, cargos, categorización y saldos.",
        "La importación y sincronización de cartolas son simuladas, pero ya sostienen una base de conciliación y una proyección de flujo de caja para entender mejor el presente financiero.",
        "Kurone-ko PymeFlow recibe la capa financiera que deja Kurone-ko POS: uno registra la venta y el otro ayuda a seguir el rastro que deja el dinero.",
        "Así, una cartola deja de ser un listado y se vuelve un mapa para lo que viene.",
      ],
    },
    loreSections: PYMEFLOW_LORE,
    modalPresentation: PYMEFLOW_MODAL,
    stackPresentation: PYMEFLOW_STACK,
    technologyMetadata: {
      stacks: [STACK_ID.JAVA],
      technologies: [TECHNOLOGY_ID.SPRING_BOOT, TECHNOLOGY_ID.POSTGRESQL],
      labels: {
        [STACK_ID.JAVA]: "Java 21",
        [TECHNOLOGY_ID.SPRING_BOOT]: "Spring Boot 3",
        [TECHNOLOGY_ID.POSTGRESQL]: "PostgreSQL 16",
      },
      practices: ["Financial event categorization", "Cashflow projection"],
      evidence: [
        {
          filterId: STACK_ID.JAVA,
          detail: "java.toolchain.languageVersion 21",
        },
        {
          filterId: TECHNOLOGY_ID.SPRING_BOOT,
          detail: "org.springframework.boot plugin 3.3.6",
        },
        {
          filterId: TECHNOLOGY_ID.POSTGRESQL,
          detail: "PostgreSQL runtime dependency",
        },
      ],
    },
    accessibleHint:
      "Proyecto visible. Kurone-ko PymeFlow transforma cartolas, depósitos y cargos en contexto financiero y proyección de flujo de caja.",
  }),
  createProject({
    id: "kuroneko-pos",
    name: "Kurone-ko POS",
    tier: PROJECT_TIER.HIDDEN,
    showcaseEligible: true,
    overviewDescription:
      "Punto de venta local-first que gestiona productos, stock, caja y trazabilidad operativa con Go, Wails y SQLite.",
    challengeId: PROJECT_UNLOCK_CHALLENGE_ID,
    preview: FALLBACK_PROJECT_PREVIEW,
    lockedPreview: LOCKED_PROJECT_PREVIEW,
    unlockedPreview: UNLOCKED_PROJECT_PREVIEW,
    cardVisual: ORNATE_MEDIA_TITLE_BANDS,
    reason:
      "Es un MVP funcional que concentra la operación comercial y deja sus eventos listos para que la capa financiera los interprete.",
    status: "Acceso bloqueado · MVP funcional / prototipo avanzado",
    front: {
      eyebrow: "Cuando la caja no puede detenerse",
      title: "Kurone-ko POS",
      summary: [
        "Kurone-ko POS nació de una experiencia laboral concreta: convivir con un punto de venta que no respondía a las necesidades diarias de una farmacia chilena.",
      ],
    },
    back: {
      title: "Revelación",
      details: [
        "En una farmacia, los problemas aparecen en el mesón: búsquedas lentas, precios que deben responder con claridad, stock que cambia, cierres que no pueden esperar y hardware que a veces juega en contra. Quise que la caja acompañara a quien atiende en vez de pedirle que se adapte a sus pausas.",
        "Elegí Go por su compilación nativa, que permite una distribución contenida, y por su concurrencia: consultas, importaciones y operaciones de caja pueden avanzar sin bloquear la interfaz.",
        "Eso exige una arquitectura cuidadosa: índices, transacciones y tareas largas acotadas. Go + Wails sostiene una aplicación local-first; más adelante, un servidor LAN podría coordinar varias cajas sin perder esa base.",
        "Quiero que después pueda crecer con sucursales, alertas de vencimiento y apoyo de IA para acompañar la operación sin quitarle el control a quienes conocen la farmacia.",
      ],
      outcome:
        "Una caja no debería detener el negocio para intentar comprenderlo. Kurone-ko POS nace para que el software responda al ritmo de la farmacia, incluso cuando el hardware y el tiempo juegan en contra.",
    },
    loreSections: KURONEKO_POS_LORE,
    modalPresentation: KURONEKO_POS_MODAL,
    technologyMetadata: {
      stacks: [STACK_ID.GO, STACK_ID.WAILS],
      technologies: [
        TECHNOLOGY_ID.TYPESCRIPT,
        TECHNOLOGY_ID.VITE,
        TECHNOLOGY_ID.SQLITE,
        TECHNOLOGY_ID.VITEST,
        TECHNOLOGY_ID.PLAYWRIGHT,
      ],
      practices: ["Commercial event capture", "Desktop application"],
      evidence: [
        {
          filterId: STACK_ID.GO,
          detail: "go 1.24.0",
        },
        {
          filterId: STACK_ID.WAILS,
          detail: "github.com/wailsapp/wails/v2",
        },
        {
          filterId: TECHNOLOGY_ID.TYPESCRIPT,
          detail: "devDependencies.typescript",
        },
        {
          filterId: TECHNOLOGY_ID.VITE,
          detail: "devDependencies.vite",
        },
        {
          filterId: TECHNOLOGY_ID.SQLITE,
          detail: "modernc.org/sqlite",
        },
        {
          filterId: TECHNOLOGY_ID.VITEST,
          detail: "scripts.test and devDependencies.vitest",
        },
        {
          filterId: TECHNOLOGY_ID.PLAYWRIGHT,
          detail: "scripts.test:e2e and devDependencies.@playwright/test; tests/pos-shell.viewport.spec.ts",
        },
      ],
    },
    stackPresentation: KURONEKO_POS_STACK,
    accessibleHint:
      "Proyecto oculto y bloqueado. Kurone-ko POS es un punto de venta local-first para la operación diaria de una farmacia chilena.",
  }),
  createProject({
    id: "kuroneko-sii",
    name: "Kurone-ko SII",
    tier: PROJECT_TIER.HIDDEN,
    showcaseEligible: true,
    overviewDescription:
      "Concepto de conciliación que conectará ventas, movimientos financieros y documentos tributarios para explicar el cierre mensual.",
    preview: FALLBACK_PROJECT_PREVIEW,
    lockedPreview: LOCKED_PROJECT_PREVIEW,
    unlockedPreview: UNLOCKED_PROJECT_PREVIEW,
    cardVisual: ORNATE_MEDIA_TITLE_BANDS,
    challengeId: PROJECT_UNLOCK_CHALLENGE_ID,
    reason:
      "Es una intención de trabajo futura, sin una implementación inicializada que deba competir con proyectos ya construidos.",
    status: "Acceso bloqueado · Planificado — aún no iniciado",
    front: {
      eyebrow: "Cómo conciliar tus Ventas",
      title: "Kurone-ko SII",
      summary: [
        "Kurone-ko SII es la capa que quiero construir para que las ventas, sus documentos tributarios y el dinero que las respalda cuenten la misma historia.",
      ],
    },
    back: {
      title: "Intención futura",
      details: [
        "Kurone-ko POS registra la venta y sus boletas, facturas o DTE; Kurone-ko PymeFlow ordena depósitos, cargos y estados de pago; Kurone-ko SII debería reunir esas piezas para conciliar pagos e identificar facturas pendientes.",
        "Quiero que esa relación también permita preparar IVA, pre-F29, cierre mensual y las obligaciones de caja que deja cada período.",
        "Los agentes tendrían un alcance acotado y cada acción dejaría una huella de auditoría para que la automatización acompañe el criterio en lugar de reemplazarlo.",
        "Una venta debería revelar su historia tributaria y financiera, no dejarla repartida entre sistemas.",
      ],
    },
    loreSections: KURONEKO_SII_LORE,
    modalPresentation: KURONEKO_SII_MODAL,
    technologyMetadata: {
      stacks: [],
      technologies: [],
      practices: [],
      evidence: [],
    },
    stackPresentation: KURONEKO_SII_STACK,
    accessibleHint:
      "Proyecto oculto y bloqueado. Kurone-ko SII conectará ventas, documentos tributarios, pagos y cierre mensual cuando comience su implementación.",
  }),
  createProject({
    id: "kuroneko-explorermcp",
    name: "Kurone-ko ExplorerMCP",
    tier: PROJECT_TIER.HIDDEN,
    showcaseEligible: true,
    overviewDescription:
      "Servicio .NET que expone capacidades semánticas de aplicaciones Windows a agentes mediante una arquitectura segura y extensible.",
    challengeId: PROJECT_UNLOCK_CHALLENGE_ID,
    preview: FALLBACK_PROJECT_PREVIEW,
    lockedPreview: LOCKED_PROJECT_PREVIEW,
    unlockedPreview: UNLOCKED_PROJECT_PREVIEW,
    cardVisual: ORNATE_MEDIA_TITLE_BANDS,
    reason: "Permanece reservado hasta que exista contenido verificable para presentarlo con honestidad.",
    status: "Acceso bloqueado · Contenido pendiente de presentación",
    front: {
      eyebrow: "Una exploración aún bajo llave",
      title: "Kurone-ko ExplorerMCP",
      summary: ["Este proyecto permanece bajo llave mientras espera una presentación verificable."],
    },
    back: {
      title: "Contenido reservado",
      details: ["La información del proyecto se incorporará cuando exista material listo para compartir."],
    },
    loreSections: KURONEKO_EXPLORERMCP_LORE,
    modalPresentation: KURONEKO_EXPLORERMCP_MODAL,
    technologyMetadata: {
      stacks: [STACK_ID.DOTNET],
      technologies: [TECHNOLOGY_ID.C_SHARP],
      practices: [],
      evidence: [
        {
          filterId: STACK_ID.DOTNET,
          detail: "TargetFramework net10.0-windows",
        },
        {
          filterId: TECHNOLOGY_ID.C_SHARP,
          detail: "LangVersion latest",
        },
      ],
    },
    stackPresentation: KURONEKO_EXPLORERMCP_STACK,
    accessibleHint:
      "Proyecto oculto y bloqueado. Kurone-ko ExplorerMCP permanece bajo llave hasta que exista contenido verificable para presentarlo.",
  }),
  createProject({
    id: "translator",
    name: "Kurone-ko Translator",
    tier: PROJECT_TIER.HIDDEN,
    showcaseEligible: true,
    overviewDescription:
      "Prototipo en Go que transcribe y traduce llamadas alemán-español en tiempo real sin sustituir la voz del usuario.",
    preview: FALLBACK_PROJECT_PREVIEW,
    lockedPreview: LOCKED_PROJECT_PREVIEW,
    unlockedPreview: UNLOCKED_PROJECT_PREVIEW,
    cardVisual: ORNATE_MEDIA_TITLE_BANDS,
    challengeId: PROJECT_UNLOCK_CHALLENGE_ID,
    reason:
      "Permanece oculto porque todavía necesita resolver API, despliegue y manejo de claves antes de exponerse con responsabilidad.",
    status: "Acceso bloqueado · Prototipo con restricciones técnicas",
    front: {
      eyebrow: "Versión Fonética Alemana",
      title: "Kurone-ko Translator",
      summary: [
        "A veces una idea puede ser útil, pero eso no significa que esté lista para abrirse a todos.",
      ],
    },
    back: {
      title: "Revelación",
      details: [
        "Translator nació como una herramienta que podía ayudar a traducir y comunicar mejor, pero todavía depende de decisiones que no quiero tomar a la ligera: APIs, despliegue, manejo de claves y límites de uso.",
        "Por eso prefiero mantenerla bajo llave por ahora. No porque no tenga valor, sino porque quiero que cuando se muestre, lo haga de una forma más segura y responsable.",
      ],
    },
    loreSections: KURONEKO_TRANSLATOR_LORE,
    modalPresentation: KURONEKO_TRANSLATOR_MODAL,
    technologyMetadata: {
      stacks: [STACK_ID.GO],
      technologies: [],
      practices: ["API safety", "Deployment readiness", "Key management"],
      evidence: [
        {
          filterId: STACK_ID.GO,
          detail: "go 1.25.0",
        },
      ],
    },
    stackPresentation: KURONEKO_TRANSLATOR_STACK,
    accessibleHint:
      "Proyecto oculto y bloqueado. Prototipo de traducción limitado por API, despliegue y manejo de claves.",
  }),
  createProject({
    id: "teacher",
    name: "Kurone-ko Teacher",
    tier: PROJECT_TIER.HIDDEN,
    showcaseEligible: true,
    overviewDescription:
      "Novela visual educativa que convierte principios de arquitectura en conflictos, metáforas y decisiones memorables.",
    preview: FALLBACK_PROJECT_PREVIEW,
    lockedPreview: LOCKED_PROJECT_PREVIEW,
    unlockedPreview: UNLOCKED_PROJECT_PREVIEW,
    cardVisual: ORNATE_MEDIA_TITLE_BANDS,
    challengeId: PROJECT_UNLOCK_CHALLENGE_ID,
    reason:
      "Su tono pertenece a una cámara opcional porque necesita contexto narrativo para no sonar como una clase impuesta.",
    status: "Acceso bloqueado · Concepto narrativo",
    front: {
      eyebrow: "Enseñar sin convertirlo en sermón",
      title: "Kurone-ko Teacher",
      summary: [
        "Siempre me ha interesado aprender a través de historias, personajes y situaciones, no solo mediante teoría escrita de forma fría.",
      ],
    },
    back: {
      title: "Revelación",
      details: [
        "Teacher nace como una idea más narrativa: explorar cómo se podrían enseñar conceptos de arquitectura, programación o pensamiento técnico usando una experiencia más cercana, casi como una novela visual o una guía con personalidad.",
        "Todavía es un concepto ambicioso y por eso sigue bajo llave, pero me gusta porque conecta con algo que valoro mucho: aprender sin perder curiosidad.",
      ],
    },
    loreSections: KURONEKO_TEACHER_LORE,
    modalPresentation: KURONEKO_TEACHER_MODAL,
    technologyMetadata: {
      stacks: [],
      technologies: [],
      practices: ["Narrative learning", "Visual-novel concept"],
      evidence: [],
    },
    stackPresentation: KURONEKO_TEACHER_STACK,
    accessibleHint:
      "Proyecto oculto y bloqueado. Concepto narrativo relacionado con aprendizaje y experiencia visual.",
  }),
];

const FIRST_EDITORIAL_PROJECT_IDS = [
  "software-engineering-playbook",
  "timer",
  "farmacia-linlin",
  "elemental-tcg",
  "alarm",
  "pymeflow",
] as const;

const firstEditorialProjectIndex = new Map<string, number>(
  FIRST_EDITORIAL_PROJECT_IDS.map((projectId, index) => [projectId, index]),
);

export const PROJECTS: ProjectEntry[] = [
  ...PROJECTS_SOURCE
    .filter((project) => firstEditorialProjectIndex.has(project.id))
    .sort(
      (left, right) =>
        (firstEditorialProjectIndex.get(left.id) ?? 0) -
        (firstEditorialProjectIndex.get(right.id) ?? 0),
    ),
  ...PROJECTS_SOURCE.filter((project) => !firstEditorialProjectIndex.has(project.id)),
];

export function getProjectsByTier(tier: ProjectTier): ProjectEntry[] {
  return PROJECTS.filter((project) => project.tier === tier);
}

export function getVisibleProjects(): ProjectEntry[] {
  return getProjectsByTier(PROJECT_TIER.VISIBLE);
}

export function getProjectTierDetails(
  projectId: string,
): ProjectTierDetails | null {
  const project = PROJECTS.find((candidate) => candidate.id === projectId);

  if (project === undefined) {
    return null;
  }

  return {
    tier: project.tier,
    reason: project.reason,
    status: project.status,
  };
}
