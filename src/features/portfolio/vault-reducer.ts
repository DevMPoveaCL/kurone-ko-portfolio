import {
  VAULT_INPUT,
  VAULT_INPUT_SOURCE,
  VAULT_KEY,
  type VaultInput,
  type VaultInputEvent,
  type VaultKeyboardInput,
  type VaultSwipeInput,
  type VaultState,
  type VaultWheelInput,
} from "./vault-types";

const WHEEL_INTENT_THRESHOLD = 24;
const SWIPE_INTENT_THRESHOLD = 48;

export const VAULT_ACTION = {
  ADVANCE: "advance",
  RESTORE_PROGRESS: "restore-progress",
  SELECT_SEAL: "select-seal",
  UNLOCK: "unlock",
  RECORD_HIDDEN_CHAMBER_TRIGGER: "record-hidden-chamber-trigger",
  SET_PAUSED: "set-paused",
  SET_REDUCED_MOTION: "set-reduced-motion",
} as const;

export type VaultActionType = (typeof VAULT_ACTION)[keyof typeof VAULT_ACTION];

export interface VaultAdvanceAction {
  type: typeof VAULT_ACTION.ADVANCE;
  event: VaultInputEvent;
  stepCount: number;
}

export interface VaultUnlockAction {
  type: typeof VAULT_ACTION.UNLOCK;
}

export interface VaultRestoreProgressAction {
  type: typeof VAULT_ACTION.RESTORE_PROGRESS;
  stepCount: number;
  unlockedSealIndexes: readonly number[];
  unlocked: boolean;
}

export interface VaultSelectSealAction {
  type: typeof VAULT_ACTION.SELECT_SEAL;
  activeIndex: number;
  stepCount: number;
  unlockedSealIndexes?: readonly number[];
}

export interface VaultRecordHiddenChamberTriggerAction {
  type: typeof VAULT_ACTION.RECORD_HIDDEN_CHAMBER_TRIGGER;
  triggerId: string;
}

export interface VaultSetPausedAction {
  type: typeof VAULT_ACTION.SET_PAUSED;
  paused: boolean;
}

export interface VaultSetReducedMotionAction {
  type: typeof VAULT_ACTION.SET_REDUCED_MOTION;
  reducedMotion: boolean;
}

export type VaultAction =
  | VaultAdvanceAction
  | VaultSelectSealAction
  | VaultRestoreProgressAction
  | VaultUnlockAction
  | VaultRecordHiddenChamberTriggerAction
  | VaultSetPausedAction
  | VaultSetReducedMotionAction;

export function createInitialVaultState(reducedMotion = false): VaultState {
  return {
    activeIndex: 0,
    unlockedSealIndexes: [],
    paused: false,
    reducedMotion,
    unlocked: false,
    hiddenChamberEventCount: 0,
  };
}

export function normalizeKeyboardInput(input: VaultKeyboardInput): VaultInputEvent | null {
  if (input.key === VAULT_KEY.ARROW_RIGHT) {
    return { input: VAULT_INPUT.NEXT, source: VAULT_INPUT_SOURCE.KEYBOARD };
  }

  if (input.key === VAULT_KEY.ARROW_LEFT) {
    return { input: VAULT_INPUT.PREVIOUS, source: VAULT_INPUT_SOURCE.KEYBOARD };
  }

  return null;
}

export function normalizeWheelInput(input: VaultWheelInput): VaultInputEvent | null {
  if (Math.abs(input.deltaY) < WHEEL_INTENT_THRESHOLD) {
    return null;
  }

  return {
    input: input.deltaY > 0 ? VAULT_INPUT.NEXT : VAULT_INPUT.PREVIOUS,
    source: VAULT_INPUT_SOURCE.WHEEL,
  };
}

export function normalizeSwipeInput(input: VaultSwipeInput): VaultInputEvent | null {
  if (Math.abs(input.deltaX) < SWIPE_INTENT_THRESHOLD) {
    return null;
  }

  return {
    input: input.deltaX > 0 ? VAULT_INPUT.NEXT : VAULT_INPUT.PREVIOUS,
    source: VAULT_INPUT_SOURCE.SWIPE,
  };
}

export function normalizeActivationInput(input: VaultInput): VaultInputEvent {
  return {
    input,
    source: VAULT_INPUT_SOURCE.CLICK,
  };
}

export function normalizeTapInput(input: VaultInput): VaultInputEvent {
  return {
    input,
    source: VAULT_INPUT_SOURCE.TAP,
  };
}

export function getNextVaultIndex(
  state: VaultState,
  input: VaultInput,
  stepCount: number,
) {
  if (stepCount <= 0) return state.activeIndex;

  const offset = input === VAULT_INPUT.PREVIOUS ? -1 : 1;
  const hasSelectedSeal = state.unlockedSealIndexes.length > 0;
  return hasSelectedSeal
    ? (state.activeIndex + offset + stepCount) % stepCount
    : offset < 0
      ? stepCount - 1
      : 0;
}

export function vaultReducer(state: VaultState, action: VaultAction): VaultState {
  if (action.type === VAULT_ACTION.SET_PAUSED) {
    return {
      ...state,
      paused: action.paused,
    };
  }

  if (action.type === VAULT_ACTION.SET_REDUCED_MOTION) {
    return {
      ...state,
      reducedMotion: action.reducedMotion,
    };
  }

  if (action.type === VAULT_ACTION.UNLOCK) {
    return {
      ...state,
      unlocked: true,
    };
  }

  if (action.type === VAULT_ACTION.RESTORE_PROGRESS) {
    const unlockedSealIndexes = [...new Set(action.unlockedSealIndexes)]
      .filter((index) => Number.isInteger(index) && index >= 0 && index < action.stepCount)
      .sort((left, right) => left - right);

    return {
      ...state,
      unlocked: action.unlocked,
      unlockedSealIndexes,
    };
  }

  if (action.type === VAULT_ACTION.SELECT_SEAL) {
    if (action.stepCount <= 0 || action.activeIndex < 0 || action.activeIndex >= action.stepCount) {
      return state;
    }

    const unlockedSealIndexes = action.unlockedSealIndexes === undefined
      ? state.unlockedSealIndexes
      : [...new Set(action.unlockedSealIndexes)]
        .filter((index) => Number.isInteger(index) && index >= 0 && index < action.stepCount)
        .sort((left, right) => left - right);

    return {
      ...state,
      activeIndex: action.activeIndex,
      unlockedSealIndexes,
    };
  }

  if (action.type === VAULT_ACTION.RECORD_HIDDEN_CHAMBER_TRIGGER) {
    return {
      ...state,
      hiddenChamberEventCount: state.hiddenChamberEventCount + 1,
    };
  }

  if (action.stepCount <= 0) {
    return state;
  }

  const nextIndex = getNextVaultIndex(state, action.event.input, action.stepCount);

  return vaultReducer(state, { type: VAULT_ACTION.SELECT_SEAL, activeIndex: nextIndex, stepCount: action.stepCount });
}
