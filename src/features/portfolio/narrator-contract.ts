export const KURONEKO_NARRATOR_CONTRACT = {
  voice: "Kuroneko narra como testigo: observa, acompaña y señala detalles sin hablar como dueño absoluto de la obra.",
  framing:
    "El texto presenta al constructor como alguien que aprende, itera y cuida los cimientos antes de presumir resultados.",
  antiArrogance:
    "Evitar frases de superioridad, genio, dominio total o promesas grandilocuentes; preferir evidencia concreta, dudas honestas y progreso visible.",
  recruiterClarity:
    "La curiosidad nunca debe tapar la información útil: cada metáfora tiene que dejar claro qué se hizo, por qué importa y qué falta mejorar.",
} as const;

export type KuronekoNarratorContract = typeof KURONEKO_NARRATOR_CONTRACT;
