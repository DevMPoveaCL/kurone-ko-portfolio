import type { VaultSeal } from "./vault-types";

export const VAULT_SEALS: VaultSeal[] = [
  {
    id: "seal-eye",
    title: "Sello 1 — El Ojo",
    emblem: "El Ojo",
    reflection: [
      "A veces es muy difícil comenzar algo, y mucho más cuando hay desorden, desconocimiento y demasiadas dudas al mismo tiempo.",
      "Primero intento ordenar ideas, responder preguntas y analizar lo que voy aprendiendo para poder acercarme a los objetivos que me he planteado.",
    ],
    connectsWith: ["Software Engineering Playbook", "La idea de ordenar el aprendizaje"],
    accessibleHint: "Relacionado con Software Engineering Playbook y la idea de ordenar el aprendizaje.",
    payoffProjectId: "software-engineering-playbook",
  },
  {
    id: "seal-claw",
    title: "Sello 2 — La Garra",
    emblem: "La Garra",
    reflection: [
      "Uno siempre va pensando en ideas… algunas surgen de la nada, otras aparecen por necesidades cercanas, pero independientemente de su origen, poco a poco intento hacerlas realidad.",
      "En todos mis proyectos intento construir algo que no se quede solo en un concepto que imaginé y olvidé. Me gusta avanzar, aunque sea poco, porque al final sé que incluso ese pequeño avance sigue siendo progreso.",
    ],
    connectsWith: ["Kurone-ko Timer", "Elemental Queens", "Kurone-ko Alarm"],
    accessibleHint: "Relacionado con Kurone-ko Timer, Elemental Queens y Kurone-ko Alarm.",
    payoffProjectId: "timer",
  },
  {
    id: "seal-lock",
    title: "Sello 3 — La Cerradura",
    emblem: "La Cerradura",
    reflection: [
      "Algunas ideas siguen madurando, con el deseo de evolucionar desde simples conceptos hacia soluciones de las que pueda sentirme feliz de haber concretado.",
      "Por eso, algunas todavía siguen bajo llave: no porque no importen, sino porque quiero darles más tiempo, más cuidado y una mejor forma antes de abrirlas por completo.",
    ],
    connectsWith: ["Kurone-ko FilterCalls", "Kurone-ko GitHub Activity", "Kurone-ko Translator", "Farmacia", "PymeFlow", "Kurone-ko Teacher"],
    accessibleHint: "Relacionado con Kurone-ko FilterCalls, Kurone-ko GitHub Activity, Kurone-ko Translator, Farmacia, PymeFlow y Kurone-ko Teacher.",
    payoffProjectId: "filter-calls",
  },
];
