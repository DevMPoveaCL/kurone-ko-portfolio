export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return [
    ...container.querySelectorAll<HTMLElement>(
      "button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    ),
  ].filter((element) => !element.hasAttribute("disabled"));
}

export function getCarouselFocusTarget(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    ".project-carousel[data-carousel-focus-target='true']",
  );
}
