"use client";

import { createContext, use, useEffect, useState, type ReactNode } from "react";

const PAUSED_STORAGE_KEY = "kurone-ko-motion-paused";
const REDUCED_STORAGE_KEY = "kurone-ko-motion-reduced";

export interface MotionPreferenceState {
  paused: boolean;
  reducedMotion: boolean;
  isMotionAllowed: boolean;
}

export interface MotionPreferenceContextValue extends MotionPreferenceState {
  setPaused: (paused: boolean) => void;
  setReducedMotionOverride: (reducedMotion: boolean) => void;
}

interface MotionPreferenceProviderProps {
  children: ReactNode;
}

const MotionPreferenceContext = createContext<MotionPreferenceContextValue | null>(null);

function readSessionBoolean(key: string): boolean | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.sessionStorage.getItem(key);

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

export function MotionPreferenceProvider({ children }: MotionPreferenceProviderProps) {
  const [paused, setPausedState] = useState(false);
  const [reducedMotion, setReducedMotionState] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    queueMicrotask(() => {
      setReducedMotionState(readSessionBoolean(REDUCED_STORAGE_KEY) ?? mediaQuery.matches);
      setPausedState(readSessionBoolean(PAUSED_STORAGE_KEY) ?? false);
    });

    const handleChange = (event: MediaQueryListEvent) => {
      const hasOverride = readSessionBoolean(REDUCED_STORAGE_KEY) !== null;

      if (!hasOverride) {
        setReducedMotionState(event.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const setPaused = (nextPaused: boolean) => {
    setPausedState(nextPaused);
    window.sessionStorage.setItem(PAUSED_STORAGE_KEY, String(nextPaused));
  };

  const setReducedMotionOverride = (nextReducedMotion: boolean) => {
    setReducedMotionState(nextReducedMotion);
    window.sessionStorage.setItem(REDUCED_STORAGE_KEY, String(nextReducedMotion));
  };

  return (
    <MotionPreferenceContext
      value={{
        paused,
        reducedMotion,
        isMotionAllowed: !paused && !reducedMotion,
        setPaused,
        setReducedMotionOverride,
      }}
    >
      {children}
    </MotionPreferenceContext>
  );
}

export function useMotionPreferences() {
  const context = use(MotionPreferenceContext);

  if (context === null) {
    throw new Error("useMotionPreferences must be used inside MotionPreferenceProvider");
  }

  return context;
}
