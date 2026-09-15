export const POINTER_AXIS_LOCK = {
  AXIS_RATIO: 1.25,
  INTENT_THRESHOLD: 12,
  RELEASE_DISTANCE: 48,
} as const;

export const POINTER_GESTURE_DIRECTION = {
  NEXT: "next",
  PREVIOUS: "previous",
} as const;

export type PointerGestureDirection = (typeof POINTER_GESTURE_DIRECTION)[keyof typeof POINTER_GESTURE_DIRECTION];

export interface PointerAxisLockPoint {
  clientX: number;
  clientY: number;
  pointerId: number;
}

interface PointerAxisLockState extends PointerAxisLockPoint {
  axis: "pending" | "horizontal" | "vertical";
}

export interface PointerAxisLockMoveResult {
  capture: boolean;
  preventDefault: boolean;
}

function isHorizontallyDominant(deltaX: number, deltaY: number) {
  return Math.abs(deltaX) >= Math.abs(deltaY) * POINTER_AXIS_LOCK.AXIS_RATIO;
}

function exceedsIntentThreshold(deltaX: number, deltaY: number) {
  return Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= POINTER_AXIS_LOCK.INTENT_THRESHOLD;
}

export function createPointerAxisLock() {
  let state: PointerAxisLockState | null = null;

  function reset(pointerId?: number) {
    if (pointerId === undefined || state?.pointerId === pointerId) state = null;
  }

  return {
    cancel(pointerId?: number) {
      reset(pointerId);
    },
    end(point: PointerAxisLockPoint): PointerGestureDirection | null {
      if (state?.pointerId !== point.pointerId) return null;

      const { axis, clientX } = state;
      const deltaX = point.clientX - clientX;
      reset();

      if (axis !== "horizontal" || Math.abs(deltaX) < POINTER_AXIS_LOCK.RELEASE_DISTANCE) return null;
      return deltaX < 0 ? POINTER_GESTURE_DIRECTION.NEXT : POINTER_GESTURE_DIRECTION.PREVIOUS;
    },
    move(point: PointerAxisLockPoint): PointerAxisLockMoveResult {
      if (state?.pointerId !== point.pointerId || state.axis === "vertical") return { capture: false, preventDefault: false };

      const deltaX = point.clientX - state.clientX;
      const deltaY = point.clientY - state.clientY;
      if (state.axis === "horizontal") return { capture: false, preventDefault: true };
      if (!exceedsIntentThreshold(deltaX, deltaY)) return { capture: false, preventDefault: false };

      if (!isHorizontallyDominant(deltaX, deltaY)) {
        state.axis = "vertical";
        return { capture: false, preventDefault: false };
      }

      state.axis = "horizontal";
      return { capture: true, preventDefault: true };
    },
    start(point: PointerAxisLockPoint) {
      state = { ...point, axis: "pending" };
    },
  };
}

export function isPointerGestureTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return target.closest("a, button, input, label, select, textarea, [contenteditable='true'], [data-gesture-exclude]") === null;
}

export function isPrimaryGesturePointer({ button, isPrimary, pointerType }: Pick<PointerEvent, "button" | "isPrimary" | "pointerType">) {
  return isPrimary && button === 0 && (pointerType === "mouse" || pointerType === "pen" || pointerType === "touch");
}
