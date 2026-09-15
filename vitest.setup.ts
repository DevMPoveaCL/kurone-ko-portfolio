import "@testing-library/jest-dom/vitest";

HTMLMediaElement.prototype.play = () => Promise.resolve();

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    addEventListener: () => undefined,
    addListener: () => undefined,
    dispatchEvent: () => false,
    matches: false,
    media: query,
    removeEventListener: () => undefined,
    removeListener: () => undefined,
  }),
});

if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal ??= function showModal() {
    this.open = true;
  };
  const nativeClose = HTMLDialogElement.prototype.close;
  HTMLDialogElement.prototype.close = function close() {
    nativeClose?.call(this);
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}
