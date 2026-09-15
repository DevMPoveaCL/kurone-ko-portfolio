import { describe, expect, it } from "vitest";
import { VAULT_SEALS } from "./vault-seals";

const SPANISH_SIGNAL_WORDS = ["el", "la", "los", "las", "de", "qué", "quién", "pista", "bóveda"] as const;

function containsSpanishSignal(text: string): boolean {
  const normalizedText = text.toLocaleLowerCase("es-AR");

  return /[¿áéíóúñ]/i.test(text) || SPANISH_SIGNAL_WORDS.some((word) => normalizedText.includes(word));
}

function containsSpanishSignalInEveryParagraph(text: string[]): boolean {
  return text.every((paragraph) => containsSpanishSignal(paragraph));
}

describe("VAULT_SEALS", () => {
  it("uses the approved reflective seal copy", () => {
    expect(VAULT_SEALS.map((seal) => ({ title: seal.title, reflection: seal.reflection }))).toEqual([
      {
        title: "Sello 1 — El Ojo",
        reflection: [
          "A veces es muy difícil comenzar algo, y mucho más cuando hay desorden, desconocimiento y demasiadas dudas al mismo tiempo.",
          "Primero intento ordenar ideas, responder preguntas y analizar lo que voy aprendiendo para poder acercarme a los objetivos que me he planteado.",
        ],
      },
      {
        title: "Sello 2 — La Garra",
        reflection: [
          "Uno siempre va pensando en ideas… algunas surgen de la nada, otras aparecen por necesidades cercanas, pero independientemente de su origen, poco a poco intento hacerlas realidad.",
          "En todos mis proyectos intento construir algo que no se quede solo en un concepto que imaginé y olvidé. Me gusta avanzar, aunque sea poco, porque al final sé que incluso ese pequeño avance sigue siendo progreso.",
        ],
      },
      {
        title: "Sello 3 — La Cerradura",
        reflection: [
          "Algunas ideas siguen madurando, con el deseo de evolucionar desde simples conceptos hacia soluciones de las que pueda sentirme feliz de haber concretado.",
          "Por eso, algunas todavía siguen bajo llave: no porque no importen, sino porque quiero darles más tiempo, más cuidado y una mejor forma antes de abrirlas por completo.",
        ],
      },
    ]);
  });

  it("defines the three approved Spanish seals with accessible hints", () => {
    expect(VAULT_SEALS).toHaveLength(3);
    expect(VAULT_SEALS.map((seal) => seal.title)).toEqual([
      "Sello 1 — El Ojo",
      "Sello 2 — La Garra",
      "Sello 3 — La Cerradura",
    ]);

    for (const seal of VAULT_SEALS) {
      expect(containsSpanishSignal(seal.title)).toBe(true);
      expect(containsSpanishSignalInEveryParagraph(seal.reflection)).toBe(true);
      expect(containsSpanishSignal(seal.accessibleHint)).toBe(true);
    }
  });

  it("keeps every emblem, reflection, hint, and payoff non-empty without legacy solutions", () => {
    for (const seal of VAULT_SEALS) {
      expect(seal.emblem.trim()).not.toBe("");
      expect(seal.reflection.length).toBeGreaterThan(0);
      expect(seal.reflection.every((paragraph) => paragraph.trim() !== "")).toBe(true);
      expect(seal.connectsWith.length).toBeGreaterThan(0);
      expect(seal.accessibleHint.trim()).not.toBe("");
      expect(seal.payoffProjectId?.trim()).not.toBe("");
      expect("solution" in seal).toBe(false);
    }
  });

  it("maps each seal to the approved narrative project group", () => {
    expect(VAULT_SEALS.map((seal) => ({ title: seal.title, hint: seal.accessibleHint, payoff: seal.payoffProjectId }))).toEqual([
      {
        title: "Sello 1 — El Ojo",
        hint: "Relacionado con Software Engineering Playbook y la idea de ordenar el aprendizaje.",
        payoff: "software-engineering-playbook",
      },
      {
        title: "Sello 2 — La Garra",
        hint: "Relacionado con Kurone-ko Timer, Elemental Queens y Kurone-ko Alarm.",
        payoff: "timer",
      },
      {
        title: "Sello 3 — La Cerradura",
        hint: "Relacionado con Kurone-ko FilterCalls, Kurone-ko GitHub Activity, Kurone-ko Translator, Farmacia, PymeFlow y Kurone-ko Teacher.",
        payoff: "filter-calls",
      },
    ]);
  });

  it("keeps the approved project connections on each seal", () => {
    expect(VAULT_SEALS.map((seal) => seal.connectsWith)).toEqual([
      ["Software Engineering Playbook", "La idea de ordenar el aprendizaje"],
      ["Kurone-ko Timer", "Elemental Queens", "Kurone-ko Alarm"],
      ["Kurone-ko FilterCalls", "Kurone-ko GitHub Activity", "Kurone-ko Translator", "Farmacia", "PymeFlow", "Kurone-ko Teacher"],
    ]);
  });
});
