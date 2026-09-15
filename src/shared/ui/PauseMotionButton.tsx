"use client";

import { useMotionPreferences } from "@/shared/a11y/motion-preferences";
import { Button } from "./Button";

export function PauseMotionButton() {
  const { paused, setPaused } = useMotionPreferences();
  const label = paused ? "Reanudar movimiento" : "Pausar movimiento";

  return (
    <Button aria-pressed={paused} aria-label={label} onClick={() => setPaused(!paused)} type="button" variant="ghost">
      {label}
    </Button>
  );
}
