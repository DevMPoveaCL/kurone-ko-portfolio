import type { KeyboardEvent } from "react";

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (
    target.isContentEditable
    || target.closest("input, textarea, select, [contenteditable='true']") !== null
  );
}

export function handleSpaceActivation<T extends HTMLElement>(event: KeyboardEvent<T>, activate: () => void) {
  if (
    event.key !== " "
    || event.defaultPrevented
    || event.repeat
    || event.altKey
    || event.ctrlKey
    || event.metaKey
    || event.shiftKey
    || isEditableTarget(event.target)
  ) return;

  event.preventDefault();
  activate();
}
