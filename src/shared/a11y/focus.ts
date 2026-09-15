export function moveFocusToActiveVaultTarget(activeStepId: string): void {
  const heading = document.getElementById(`${activeStepId}-heading`);
  const primaryAction = document.querySelector<HTMLElement>(`[data-vault-primary-action="${activeStepId}"]`);
  const target = heading ?? primaryAction;

  target?.focus({ preventScroll: true });
}
