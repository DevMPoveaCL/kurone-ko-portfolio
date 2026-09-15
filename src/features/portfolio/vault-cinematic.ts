export const CINEMATIC_STARTUP_TIMEOUT_MS = 4_000;
export const CINEMATIC_STALL_TIMEOUT_MS = 2_000;

export interface VaultCinematicCapabilities {
  coarse?: boolean | undefined;
  deviceMemory?: number | undefined;
  effectiveType?: string | undefined;
  hardwareConcurrency?: number | undefined;
  reducedMotion?: boolean | undefined;
  saveData?: boolean | undefined;
  supported?: boolean | undefined;
  width?: number | undefined;
}

export function shouldBypassVaultCinematic(capabilities: VaultCinematicCapabilities) {
  return Boolean(
    capabilities.reducedMotion ||
      capabilities.saveData ||
      capabilities.effectiveType === "slow-2g" ||
      capabilities.effectiveType === "2g" ||
      capabilities.supported === false,
  );
}
