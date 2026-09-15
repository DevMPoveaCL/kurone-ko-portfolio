import type { ProjectEntry, ProjectPreview } from "./vault-types";

export const PROJECT_UNLOCK_CHALLENGE_ID = "hidden-projects-riddle" as const;

const PROJECT_UNLOCK_TITLE = "ACERTIJO" as const;
const PROJECT_UNLOCK_ANSWERS = ["eltioben", "tioben", "narrador"] as const;

export const PROJECT_UNLOCK_CONSOLE_CLUE =
  "¡Hola! ¿Revisando la consola? O.O... ¡Pillín! xD\nGracias por revisar mi portfolio; aprecio mucho que se tome el tiempo de verlo.\nSi quiere acceder a los proyectos “Bloqueados”, escriba “el tío ben”, “tío ben” o “narrador” de la forma que desee: no importan las mayúsculas, las tildes ni los espacios.\nDebe tipear la respuesta en la barra de búsqueda de FILTROS. ¡Gracias!";

export interface ProjectUnlockChallenge {
  acceptedAnswers: readonly string[];
  bannerAlt: string;
  body: readonly string[];
  id: string;
  kicker: string;
  title: string;
}

export const PROJECT_UNLOCK_CHALLENGES: readonly ProjectUnlockChallenge[] = [
  {
    acceptedAnswers: PROJECT_UNLOCK_ANSWERS,
    bannerAlt: "«Un gran poder conlleva una gran responsabilidad» — Joker (Joke).",
    body: [
      "¿Quién dijo esta frase? Descubrirlo debes.",
      "En la búsqueda de FILTROS, su nombre escribirás, y así a los proyectos bloqueados accederás.",
    ],
    id: PROJECT_UNLOCK_CHALLENGE_ID,
    kicker: "Tipea en la búsqueda de FILTROS la respuesta",
    title: PROJECT_UNLOCK_TITLE,
  },
] as const;

export const PROJECT_UNLOCK_SUCCESS = {
  action: "CONTINUAR",
  emphasis: "¡Felicidades por desbloquear los proyectos ocultos!",
  kicker: "Status: 200 OK | LOGRO ARÁCNIDO DESBLOQUEADO",
  normal:
    "Y entre ellos... también existen seres que tienen el gran poder y la enorme responsabilidad de tomar decisiones clave. Encontrar el talento real es un arte, y supongo que por eso no es fácil engañarte.",
  quote: "Hay 10 tipos de personas en el mundo: las que entienden binario... y las que no",
  title: "PROYECTOS DESBLOQUEADOS",
} as const;

export interface ProjectAccess {
  isLocked: boolean;
  isUnlocked: boolean;
  preview: ProjectPreview;
}

export function normalizeUnlockAnswer(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es").replace(/\s+/gu, "");
}

export function isAcceptedUnlockAnswer(
  challenge: ProjectUnlockChallenge,
  answer: string,
): boolean {
  const normalizedAnswer = normalizeUnlockAnswer(answer);
  return challenge.acceptedAnswers.some(
    (acceptedAnswer) => normalizeUnlockAnswer(acceptedAnswer) === normalizedAnswer,
  );
}

export function getUnlockChallengeForProjects(
  projects: readonly ProjectEntry[],
): ProjectUnlockChallenge | undefined {
  const challengeIds = new Set(
    projects.flatMap((project) => project.challengeId === undefined ? [] : [project.challengeId]),
  );
  return PROJECT_UNLOCK_CHALLENGES.find((challenge) => challengeIds.has(challenge.id));
}

export function getChallengeProjectIds(
  projects: readonly ProjectEntry[],
  challengeId: string,
): string[] {
  return projects
    .filter((project) => project.challengeId === challengeId)
    .map((project) => project.id);
}

export function resolveProjectAccess(
  project: ProjectEntry,
  unlockedChallengeIds: readonly string[],
): ProjectAccess {
  const challengeIsUnlocked = project.challengeId === undefined || unlockedChallengeIds.includes(project.challengeId);
  const isUnlocked = project.showcaseEligible && challengeIsUnlocked;
  const isLocked = project.showcaseEligible && project.challengeId !== undefined && !challengeIsUnlocked;
  return {
    isLocked,
    isUnlocked,
    preview: isLocked
      ? project.lockedPreview ?? project.preview
      : project.unlockedPreview ?? project.preview,
  };
}
