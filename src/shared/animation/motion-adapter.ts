import type { VaultSeal, VaultState } from "@/features/portfolio/vault-types";

export const VAULT_MOTION_CLASS = {
  ACTIVE: "vault-step vault-step-active",
  INACTIVE: "vault-step vault-step-inactive",
  STATIC_ACTIVE: "vault-step vault-step-active vault-step-static",
  STATIC_INACTIVE: "vault-step vault-step-inactive vault-step-static",
} as const;

export type VaultMotionClass = (typeof VAULT_MOTION_CLASS)[keyof typeof VAULT_MOTION_CLASS];

export interface MotionAdapterInput {
  step: VaultSeal;
  state: VaultState;
  stepIndex: number;
}

export interface MotionAdapterOutput {
  className: VaultMotionClass;
  ariaHidden: boolean;
  dataMotion: string;
}

export function toVaultVisualState(input: MotionAdapterInput): MotionAdapterOutput {
  const isActive = input.stepIndex === input.state.activeIndex;
  const mustUseStaticState = input.state.paused || input.state.reducedMotion;

  if (isActive && mustUseStaticState) {
    return { className: VAULT_MOTION_CLASS.STATIC_ACTIVE, ariaHidden: false, dataMotion: "static" };
  }

  if (!isActive && mustUseStaticState) {
    return { className: VAULT_MOTION_CLASS.STATIC_INACTIVE, ariaHidden: true, dataMotion: "static" };
  }

  if (isActive) {
    return { className: VAULT_MOTION_CLASS.ACTIVE, ariaHidden: false, dataMotion: "morph" };
  }

  return { className: VAULT_MOTION_CLASS.INACTIVE, ariaHidden: true, dataMotion: "morph" };
}
