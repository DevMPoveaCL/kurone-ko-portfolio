import { useRef, type MouseEvent, type PointerEvent } from "react";

export const TOUCH_ACTIVATION = {
  MOVE_THRESHOLD: 10,
} as const;

interface TouchPointerStart {
  clientX: number;
  clientY: number;
  pointerId: number;
}

function isPrimaryTouchPointer(event: globalThis.PointerEvent) {
  return (
    event.isPrimary &&
    event.button === 0 &&
    (event.pointerType === "touch" || event.pointerType === "pen")
  );
}

function isWithinButton(
  button: HTMLButtonElement,
  event: globalThis.PointerEvent,
) {
  const rect = button.getBoundingClientRect();
  return (
    Number.isFinite(event.clientX) &&
    Number.isFinite(event.clientY) &&
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );
}

export function useTouchActivation(onActivate: () => void) {
  const pointerStartRef = useRef<TouchPointerStart | null>(null);
  const compatibilityClickRef = useRef(false);

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    compatibilityClickRef.current = false;
    pointerStartRef.current = null;
    if (
      event.currentTarget.disabled ||
      !isPrimaryTouchPointer(event.nativeEvent)
    )
      return;

    pointerStartRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      pointerId: event.pointerId,
    };
  }

  function onPointerUp(event: PointerEvent<HTMLButtonElement>) {
    const pointerStart = pointerStartRef.current;
    pointerStartRef.current = null;
    if (
      pointerStart === null ||
      event.currentTarget.disabled ||
      pointerStart.pointerId !== event.pointerId
    )
      return;

    const movedX = Math.abs(event.clientX - pointerStart.clientX);
    const movedY = Math.abs(event.clientY - pointerStart.clientY);
    if (
      Math.max(movedX, movedY) > TOUCH_ACTIVATION.MOVE_THRESHOLD ||
      !isWithinButton(event.currentTarget, event.nativeEvent)
    )
      return;

    compatibilityClickRef.current = true;
    onActivate();
  }

  function onPointerCancel(event: PointerEvent<HTMLButtonElement>) {
    if (pointerStartRef.current?.pointerId === event.pointerId)
      pointerStartRef.current = null;
    compatibilityClickRef.current = false;
  }

  function onClickCapture(event: MouseEvent<HTMLButtonElement>) {
    if (!compatibilityClickRef.current) return;
    compatibilityClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  function onKeyDown() {
    compatibilityClickRef.current = false;
  }

  return {
    onClickCapture,
    onKeyDown,
    onPointerCancel,
    onPointerDown,
    onPointerUp,
  };
}
