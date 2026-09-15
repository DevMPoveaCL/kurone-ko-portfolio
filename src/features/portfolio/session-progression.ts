const PROGRESSION_VERSION = {
  CURRENT: 1,
} as const;

export const SESSION_PROGRESSION_KEY = "kuroneko:session-progression:v1";
export const SESSION_RELOAD_RESET_MARKER = "__kuronekoSessionProgressionReloadReset";
export const ALTERNATE_RESIDENCY = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type AlternateResidency =
  (typeof ALTERNATE_RESIDENCY)[keyof typeof ALTERNATE_RESIDENCY];

const ALTERNATE_HANDOFF_TTL_MS = 10_000;

export interface AlternateHandoff {
  expiresAt: number;
  issuedAt: number;
  token: string;
}

export interface SessionProgression {
  alternateHandoff: AlternateHandoff | null;
  alternateResidency: AlternateResidency;
  hiddenChallengeIds: string[];
  introCompleted: boolean;
  mainHallUnlocked: boolean;
  unlockedSealIds: string[];
  version: typeof PROGRESSION_VERSION.CURRENT;
}

interface ProgressionOptions {
  challengeIds?: readonly string[];
  now?: number;
  sealIds: readonly string[];
}

interface StorageLike {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export interface NavigationTimingSource {
  getEntriesByType?: (entryType: string) => ArrayLike<unknown>;
  navigation?: {
    type?: number;
  };
}

interface ReloadAwareWindow extends Window {
  [SESSION_RELOAD_RESET_MARKER]?: boolean;
}

export const createInitialSessionProgression = (): SessionProgression => ({
  alternateHandoff: null,
  alternateResidency: ALTERNATE_RESIDENCY.INACTIVE,
  hiddenChallengeIds: [],
  introCompleted: false,
  mainHallUnlocked: false,
  unlockedSealIds: [],
  version: PROGRESSION_VERSION.CURRENT,
});

function getNavigationTiming(): NavigationTimingSource | null {
  if (typeof window === "undefined" || typeof window.performance === "undefined") return null;
  return window.performance;
}

function getReloadAwareWindow(): ReloadAwareWindow | null {
  return typeof window === "undefined" ? null : window;
}

export function isDocumentReload(
  source: NavigationTimingSource | null = getNavigationTiming(),
): boolean {
  if (source === null) return false;

  if (typeof source.getEntriesByType === "function") {
    try {
      const navigationEntry = source.getEntriesByType("navigation")[0];
      if (isRecord(navigationEntry) && typeof navigationEntry.type === "string") {
        return navigationEntry.type === "reload";
      }
    } catch {
      // Fall through to the legacy navigation timing API.
    }
  }

  return source.navigation?.type === 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key));
}

function parseIdList(
  value: unknown,
  knownIds: readonly string[],
): string[] | null {
  if (
    !Array.isArray(value) ||
    !value.every((id): id is string => typeof id === "string")
  )
    return null;

  const known = new Set(knownIds);
  const unique = new Set(value);
  if (unique.size !== value.length || value.some((id) => !known.has(id)))
    return null;
  return [...value];
}

function parseHandoff(
  value: unknown,
  now: number,
): AlternateHandoff | null | undefined {
  if (value === null) return null;
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["expiresAt", "issuedAt", "token"])
  )
    return undefined;

  const { expiresAt, issuedAt, token } = value;
  if (
    typeof expiresAt !== "number" ||
    !Number.isFinite(expiresAt) ||
    typeof issuedAt !== "number" ||
    !Number.isFinite(issuedAt) ||
    typeof token !== "string" ||
    token.length < 16 ||
    expiresAt <= issuedAt ||
    now >= expiresAt
  )
    return undefined;

  return { expiresAt, issuedAt, token };
}

export function parseSessionProgression(
  input: unknown,
  options: ProgressionOptions,
): SessionProgression | null {
  if (
    !isRecord(input) ||
    !hasOnlyKeys(input, [
      "alternateHandoff",
      "alternateResidency",
      "hiddenChallengeIds",
      "introCompleted",
      "mainHallUnlocked",
      "unlockedSealIds",
      "version",
    ])
  )
    return null;

  if (
    input.version !== PROGRESSION_VERSION.CURRENT ||
    typeof input.introCompleted !== "boolean" ||
    typeof input.mainHallUnlocked !== "boolean"
  )
    return null;

  const unlockedSealIds = parseIdList(input.unlockedSealIds, options.sealIds);
  const hiddenChallengeIds = parseIdList(
    input.hiddenChallengeIds,
    options.challengeIds ?? [],
  );
  const now = options.now ?? Date.now();
  const alternateHandoff = parseHandoff(input.alternateHandoff, now);
  const alternateResidency = input.alternateResidency;

  if (
    unlockedSealIds === null ||
    hiddenChallengeIds === null ||
    alternateHandoff === undefined ||
    (alternateResidency !== ALTERNATE_RESIDENCY.ACTIVE &&
      alternateResidency !== ALTERNATE_RESIDENCY.INACTIVE) ||
    (alternateResidency === ALTERNATE_RESIDENCY.ACTIVE &&
      alternateHandoff !== null) ||
    (alternateResidency === ALTERNATE_RESIDENCY.INACTIVE &&
      alternateHandoff === null &&
      input.alternateHandoff !== null) ||
    (!input.introCompleted && unlockedSealIds.length > 0)
  )
    return null;

  const allSealsUnlocked = unlockedSealIds.length === options.sealIds.length;
  if (input.mainHallUnlocked && (!input.introCompleted || !allSealsUnlocked))
    return null;

  return {
    alternateHandoff,
    alternateResidency,
    hiddenChallengeIds,
    introCompleted: input.introCompleted,
    mainHallUnlocked: input.mainHallUnlocked,
    unlockedSealIds,
    version: PROGRESSION_VERSION.CURRENT,
  };
}

function getSessionStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readSessionProgression(
  options: ProgressionOptions,
  storage: StorageLike | null = getSessionStorage(),
): SessionProgression {
  const initial = createInitialSessionProgression();
  if (storage === null) return initial;

  let raw: string | null;
  try {
    raw = storage.getItem(SESSION_PROGRESSION_KEY);
  } catch {
    return initial;
  }
  if (raw === null) return initial;

  try {
    const parsed = parseSessionProgression(JSON.parse(raw) as unknown, options);
    if (parsed !== null) return parsed;
  } catch {
    // Corrupt JSON is handled as a safe reset below.
  }

  resetSessionProgression(storage);
  return initial;
}

export function writeSessionProgression(
  state: SessionProgression,
  storage: StorageLike | null = getSessionStorage(),
) {
  if (storage === null) return;
  try {
    storage.setItem(SESSION_PROGRESSION_KEY, JSON.stringify(state));
  } catch {
    // Storage availability is not required for the in-memory session.
  }
}

export function resetSessionProgression(
  storage: Pick<StorageLike, "removeItem"> | null = getSessionStorage(),
) {
  if (storage === null) return;
  try {
    storage.removeItem(SESSION_PROGRESSION_KEY);
  } catch {
    // Storage availability is not required for the in-memory session.
  }
}

export function resetSessionProgressionForDocumentReload(
  source: NavigationTimingSource | null = getNavigationTiming(),
  storage: Pick<StorageLike, "removeItem"> | null = getSessionStorage(),
): boolean {
  if (!isDocumentReload(source)) return false;

  const reloadAwareWindow = getReloadAwareWindow();
  if (reloadAwareWindow?.[SESSION_RELOAD_RESET_MARKER] === true) return false;

  if (reloadAwareWindow !== null) {
    reloadAwareWindow[SESSION_RELOAD_RESET_MARKER] = true;
  }
  resetSessionProgression(storage);
  return true;
}

export function markIntroCompleted(
  state: SessionProgression,
): SessionProgression {
  return state.introCompleted ? state : { ...state, introCompleted: true };
}

export function unlockSeal(
  state: SessionProgression,
  sealId: string,
  sealIds: readonly string[],
): SessionProgression | null {
  if (
    !state.introCompleted ||
    !sealIds.includes(sealId) ||
    state.unlockedSealIds.includes(sealId)
  )
    return null;
  return { ...state, unlockedSealIds: [...state.unlockedSealIds, sealId] };
}

export function completeMainHall(
  state: SessionProgression,
  sealIds: readonly string[],
): SessionProgression | null {
  if (
    !state.introCompleted ||
    sealIds.some((sealId) => !state.unlockedSealIds.includes(sealId))
  )
    return null;
  return state.mainHallUnlocked ? state : { ...state, mainHallUnlocked: true };
}

export function unlockHiddenChallenge(
  state: SessionProgression,
  challengeId: string,
  challengeIds: readonly string[],
): SessionProgression | null {
  if (
    !challengeIds.includes(challengeId) ||
    state.hiddenChallengeIds.includes(challengeId)
  )
    return null;
  return {
    ...state,
    hiddenChallengeIds: [...state.hiddenChallengeIds, challengeId],
  };
}

function createHandoffToken() {
  return typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function issueAlternateHandoff(
  state: SessionProgression,
  now = Date.now(),
  token = createHandoffToken(),
): SessionProgression {
  return {
    ...state,
    alternateHandoff: {
      expiresAt: now + ALTERNATE_HANDOFF_TTL_MS,
      issuedAt: now,
      token,
    },
    alternateResidency: ALTERNATE_RESIDENCY.INACTIVE,
  };
}

export function consumeAlternateHandoff(
  state: SessionProgression,
  now = Date.now(),
): SessionProgression | null {
  const handoff = state.alternateHandoff;
  if (handoff === null || now >= handoff.expiresAt) return null;
  return {
    ...state,
    alternateHandoff: null,
    alternateResidency: ALTERNATE_RESIDENCY.ACTIVE,
  };
}

export function clearAlternateResidency(
  state: SessionProgression,
): SessionProgression {
  return {
    ...state,
    alternateHandoff: null,
    alternateResidency: ALTERNATE_RESIDENCY.INACTIVE,
  };
}
