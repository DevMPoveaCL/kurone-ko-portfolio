export const VAULT_INPUT = {
  NEXT: "next",
  PREVIOUS: "previous",
  PAUSE: "pause",
  RESUME: "resume",
} as const;

export type VaultInput = (typeof VAULT_INPUT)[keyof typeof VAULT_INPUT];

export const VAULT_INPUT_SOURCE = {
  WHEEL: "wheel",
  CLICK: "click",
  TAP: "tap",
  SWIPE: "swipe",
  KEYBOARD: "keyboard",
  SYSTEM: "system",
} as const;

export type VaultInputSource =
  (typeof VAULT_INPUT_SOURCE)[keyof typeof VAULT_INPUT_SOURCE];

export const VAULT_KEY = {
  ARROW_DOWN: "ArrowDown",
  ARROW_RIGHT: "ArrowRight",
  ARROW_UP: "ArrowUp",
  ARROW_LEFT: "ArrowLeft",
  ENTER: "Enter",
  SPACE: " ",
  SPACEBAR: "Spacebar",
} as const;

export type VaultKey = (typeof VAULT_KEY)[keyof typeof VAULT_KEY];

export const PROJECT_TIER = {
  VISIBLE: "visible",
  SEMI_HIDDEN: "semi-hidden",
  HIDDEN: "hidden",
  DEFERRED: "deferred",
} as const;

export type ProjectTier = (typeof PROJECT_TIER)[keyof typeof PROJECT_TIER];

export const PROJECT_PREVIEW_SOURCE = {
  DEMO: "demo",
  FALLBACK: "fallback",
  LOCKED: "locked",
  UNLOCKED: "unlocked",
} as const;

export type ProjectPreviewSource =
  (typeof PROJECT_PREVIEW_SOURCE)[keyof typeof PROJECT_PREVIEW_SOURCE];

export const PROJECT_PREVIEW_FIT = {
  CONTAIN: "contain",
} as const;

export type ProjectPreviewFit =
  (typeof PROJECT_PREVIEW_FIT)[keyof typeof PROJECT_PREVIEW_FIT];

export const PROJECT_CARD_FRAME = {
  ORNATE: "ornate",
} as const;

export type ProjectCardFrame =
  (typeof PROJECT_CARD_FRAME)[keyof typeof PROJECT_CARD_FRAME];

export const PROJECT_CARD_PRESENTATION = {
  MEDIA_TITLE_BANDS: "media-title-bands",
} as const;

export type ProjectCardPresentation =
  (typeof PROJECT_CARD_PRESENTATION)[keyof typeof PROJECT_CARD_PRESENTATION];

export const STACK_ID = {
  ANDROID: "android",
  ASTRO: "astro",
  DOTNET: "dotnet",
  FLUTTER: "flutter",
  GO: "go",
  JAVA: "java",
  NEXT_JS: "next-js",
  TAURI: "tauri",
  WAILS: "wails",
} as const;

export type StackId = (typeof STACK_ID)[keyof typeof STACK_ID];

export const TECHNOLOGY_ID = {
  ANGULAR: "angular",
  CAPACITOR: "capacitor",
  C_SHARP: "c-sharp",
  DART: "dart",
  DRIFT: "drift",
  FIREBASE: "firebase",
  GOOGLE_ML_KIT: "google-ml-kit",
  IONIC: "ionic",
  JETPACK_COMPOSE: "jetpack-compose",
  KOTLIN: "kotlin",
  POSTGRESQL: "postgresql",
  REACT: "react",
  RIVERPOD: "riverpod",
  RUST: "rust",
  SPRING_BOOT: "spring-boot",
  SQLITE: "sqlite",
  TAILWIND_CSS: "tailwind-css",
  TYPESCRIPT: "typescript",
  VITE: "vite",
  VITEST: "vitest",
  ZUSTAND: "zustand",
  PLAYWRIGHT: "playwright",
} as const;

export type TechnologyId = (typeof TECHNOLOGY_ID)[keyof typeof TECHNOLOGY_ID];

export const SPECIAL_FILTER_ID = {
  VOID: "void",
} as const;

export type SpecialFilterId =
  (typeof SPECIAL_FILTER_ID)[keyof typeof SPECIAL_FILTER_ID];
export type TechnologyFilterId = StackId | TechnologyId;
export type FilterId = TechnologyFilterId | SpecialFilterId;

export interface ProjectTechnologyLabels {
  labels: Partial<Record<TechnologyFilterId, string>>;
}

export interface TechnologyEvidence {
  filterId: TechnologyFilterId;
  detail: string;
}

export interface ProjectTechnologyMetadata {
  stacks: readonly StackId[];
  technologies: readonly TechnologyId[];
  practices: readonly string[];
  evidence: readonly TechnologyEvidence[];
  labels?: ProjectTechnologyLabels["labels"];
}

export interface ProjectStackBlock {
  heading: string;
  description: string;
  descriptionHighlights?: readonly ProjectInlineHighlight[];
}

export interface ProjectStackTechnicalBase {
  heading: string;
  value: string;
  valueHighlights?: readonly ProjectInlineHighlight[];
}

export interface ProjectInlineHighlight {
  text: string;
  lang?: string;
}

export interface ProjectStackAction {
  label: string;
  href: string;
  confirmationPurpose: string;
}

export interface ProjectStackPresentation {
  kicker: string;
  title: string;
  introduction: string;
  introductionHighlights?: readonly ProjectInlineHighlight[];
  badges?: readonly string[];
  blocks: readonly ProjectStackBlock[];
  technicalBase?: ProjectStackTechnicalBase;
  evidence?: string;
  evidenceHighlights?: readonly ProjectInlineHighlight[];
  cta?: ProjectStackAction;
}

export interface ProjectPreviewVideo {
  src: string;
  type: string;
  mobile?: ProjectPreviewVideoSource;
}

export interface ProjectPreviewVideoSource {
  src: string;
  type: string;
}

export interface ProjectPreviewFocal {
  x: number;
  y: number;
  scale: number;
}

export interface ProjectPreview {
  image: string;
  alt: string;
  source: ProjectPreviewSource;
  fit?: ProjectPreviewFit;
  focal?: ProjectPreviewFocal;
  video?: ProjectPreviewVideo;
}

export interface ProjectCardVisual {
  frame: ProjectCardFrame;
  presentation: ProjectCardPresentation;
}

export interface ProjectEntry {
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
  cardVisual?: ProjectCardVisual;
  narrativeHook: string;
  curiosityReveal: string;
  front: ProjectCardFront;
  back: ProjectCardBack;
  loreSections?: readonly ProjectLoreSection[];
  modalPresentation?: ProjectModalPresentation;
  technologyMetadata: ProjectTechnologyMetadata;
  stackPresentation?: ProjectStackPresentation;
  accessibleHint: string;
}

export interface ProjectCardFront {
  eyebrow: string;
  title: string;
  summary: string[];
}

export interface ProjectCardBack {
  title: string;
  details: string[];
  outcome?: string;
}

export interface ProjectLoreSection {
  heading: string;
  paragraphs: readonly string[];
  paragraphHighlights?: readonly (readonly ProjectInlineHighlight[])[];
}

export interface ProjectModalPresentation {
  infoAsset: string;
  infoKicker?: string;
  infoTitle?: string;
  infoQuote?: string;
  stackAsset: string;
}

export interface VaultSeal {
  id: string;
  title: string;
  emblem: string;
  reflection: string[];
  connectsWith: string[];
  accessibleHint: string;
  payoffProjectId?: string;
}

export interface VaultState {
  activeIndex: number;
  unlockedSealIndexes: number[];
  paused: boolean;
  reducedMotion: boolean;
  unlocked: boolean;
  hiddenChamberEventCount: number;
}

export interface VaultInputEvent {
  input: VaultInput;
  source: VaultInputSource;
}

export interface VaultKeyboardInput {
  key: string;
}

export interface VaultWheelInput {
  deltaY: number;
}

export interface VaultSwipeInput {
  deltaX: number;
}
