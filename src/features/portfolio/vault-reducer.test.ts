import { describe, expect, it } from "vitest";
import { VAULT_INPUT, VAULT_INPUT_SOURCE } from "./vault-types";
import {
  VAULT_ACTION,
  createInitialVaultState,
  getNextVaultIndex,
  normalizeActivationInput,
  normalizeKeyboardInput,
  normalizeSwipeInput,
  normalizeWheelInput,
  vaultReducer,
} from "./vault-reducer";

const STEP_COUNT = 3;

describe("vaultReducer", () => {
  it("calculates canonical navigation without inventing progress", () => {
    const initialState = createInitialVaultState();
    const selectedState = { ...initialState, activeIndex: 2, unlockedSealIndexes: [2] };

    expect(getNextVaultIndex(initialState, VAULT_INPUT.NEXT, STEP_COUNT)).toBe(0);
    expect(getNextVaultIndex(initialState, VAULT_INPUT.PREVIOUS, STEP_COUNT)).toBe(STEP_COUNT - 1);
    expect(getNextVaultIndex(selectedState, VAULT_INPUT.NEXT, STEP_COUNT)).toBe(0);
    expect(getNextVaultIndex(selectedState, VAULT_INPUT.PREVIOUS, STEP_COUNT)).toBe(1);
    expect(getNextVaultIndex(selectedState, VAULT_INPUT.NEXT, 0)).toBe(selectedState.activeIndex);
  });

  it("normalizes scroll down to the same next transition as click activation", () => {
    const scrollEvent = normalizeWheelInput({ deltaY: 80 });
    const clickEvent = normalizeActivationInput(VAULT_INPUT.NEXT);

    expect(scrollEvent).not.toBeNull();
    expect(scrollEvent?.input).toBe(clickEvent.input);

    const initialState = createInitialVaultState();
    const scrolledState = vaultReducer(initialState, {
      type: VAULT_ACTION.ADVANCE,
      event: scrollEvent ?? clickEvent,
      stepCount: STEP_COUNT,
    });
    const clickedState = vaultReducer(initialState, {
      type: VAULT_ACTION.ADVANCE,
      event: clickEvent,
      stepCount: STEP_COUNT,
    });

    expect(scrolledState.activeIndex).toBe(clickedState.activeIndex);
  });

  it("normalizes only ArrowRight to next keyboard navigation", () => {
    expect(normalizeKeyboardInput({ key: "ArrowRight" })?.input).toBe(VAULT_INPUT.NEXT);

    const ignoredKeys = ["Enter", " ", "ArrowDown"];

    for (const key of ignoredKeys) {
      expect(normalizeKeyboardInput({ key })).toBeNull();
    }
  });

  it("normalizes only ArrowLeft and upward wheel movement to previous", () => {
    expect(normalizeKeyboardInput({ key: "ArrowLeft" })?.input).toBe(VAULT_INPUT.PREVIOUS);
    expect(normalizeKeyboardInput({ key: "ArrowUp" })).toBeNull();
    expect(normalizeWheelInput({ deltaY: -80 })?.input).toBe(VAULT_INPUT.PREVIOUS);
  });

  it("normalizes conservative horizontal swipes to next and previous navigation", () => {
    expect(normalizeSwipeInput({ deltaX: 20 })).toBeNull();
    expect(normalizeSwipeInput({ deltaX: 80 })).toEqual({ input: VAULT_INPUT.NEXT, source: VAULT_INPUT_SOURCE.SWIPE });
    expect(normalizeSwipeInput({ deltaX: -80 })).toEqual({ input: VAULT_INPUT.PREVIOUS, source: VAULT_INPUT_SOURCE.SWIPE });
  });

  it("projects previous navigation from the last seal without inventing an unlock", () => {
    const initialState = createInitialVaultState();
    const previousState = vaultReducer(initialState, {
      type: VAULT_ACTION.ADVANCE,
      event: normalizeActivationInput(VAULT_INPUT.PREVIOUS),
      stepCount: STEP_COUNT,
    });

    expect(previousState.activeIndex).toBe(STEP_COUNT - 1);
    expect(previousState.unlockedSealIndexes).toEqual([]);
    expect(previousState.unlocked).toBe(false);
  });

  it("wraps next and previous transitions circularly after a seal has been selected", () => {
    const finalSealState = {
      ...createInitialVaultState(),
      activeIndex: STEP_COUNT - 1,
      unlockedSealIndexes: [STEP_COUNT - 1],
    };
    const wrappedNextState = vaultReducer(finalSealState, {
      type: VAULT_ACTION.ADVANCE,
      event: normalizeActivationInput(VAULT_INPUT.NEXT),
      stepCount: STEP_COUNT,
    });
    const wrappedPreviousState = vaultReducer(createInitialVaultState(), {
      type: VAULT_ACTION.ADVANCE,
      event: normalizeActivationInput(VAULT_INPUT.PREVIOUS),
      stepCount: STEP_COUNT,
    });

    expect(wrappedNextState.activeIndex).toBe(0);
    expect(wrappedNextState.unlockedSealIndexes).toEqual([STEP_COUNT - 1]);
    expect(wrappedPreviousState.activeIndex).toBe(STEP_COUNT - 1);
  });

  it("projects a tapped seal by index without inventing progression", () => {
    const selectedState = vaultReducer(createInitialVaultState(), {
      type: VAULT_ACTION.SELECT_SEAL,
      activeIndex: 2,
      stepCount: STEP_COUNT,
    });

    expect(selectedState.activeIndex).toBe(2);
    expect(selectedState.unlockedSealIndexes).toEqual([]);
    expect(selectedState.unlocked).toBe(false);
  });

  it("does not mutate projected unlocks when a seal is reselected", () => {
    const selectedState = vaultReducer(createInitialVaultState(), {
      type: VAULT_ACTION.SELECT_SEAL,
      activeIndex: 1,
      stepCount: STEP_COUNT,
    });
    const reselectedState = vaultReducer(selectedState, {
      type: VAULT_ACTION.SELECT_SEAL,
      activeIndex: 1,
      stepCount: STEP_COUNT,
    });

    expect(reselectedState.unlockedSealIndexes).toEqual([]);
  });

  it("unlocks explicitly without changing the active vault clue", () => {
    const initialState = createInitialVaultState();
    const unlockedState = vaultReducer(initialState, { type: VAULT_ACTION.UNLOCK });

    expect(unlockedState.activeIndex).toBe(0);
    expect(unlockedState.unlockedSealIndexes).toEqual([]);
    expect(unlockedState.unlocked).toBe(true);
  });

  it("does not unlock automatically when advancing beyond the final riddle", () => {
    const finalRiddleState = {
      ...createInitialVaultState(),
      activeIndex: STEP_COUNT - 1,
      unlockedSealIndexes: [0, 1, 2],
    };
    const unlockedState = vaultReducer(finalRiddleState, {
      type: VAULT_ACTION.ADVANCE,
      event: normalizeActivationInput(VAULT_INPUT.NEXT),
      stepCount: STEP_COUNT,
    });

    expect(unlockedState.activeIndex).toBe(0);
    expect(unlockedState.unlocked).toBe(false);
  });

  it("counts accessible hidden chamber trigger events", () => {
    const triggeredState = vaultReducer(createInitialVaultState(), {
      type: VAULT_ACTION.RECORD_HIDDEN_CHAMBER_TRIGGER,
      triggerId: "teacher",
    });

    expect(triggeredState.hiddenChamberEventCount).toBe(1);
  });
});
