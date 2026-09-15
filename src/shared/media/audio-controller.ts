let sharedAudio: HTMLAudioElement | null = null;

export function getSharedAudioElement(src: string): HTMLAudioElement {
  if (typeof document === "undefined") {
    throw new Error("Shared audio is only available in the browser.");
  }

  if (sharedAudio === null) {
    sharedAudio = document.createElement("audio");
    sharedAudio.className = "bug-cesante-audio";
    sharedAudio.setAttribute("aria-hidden", "true");
    sharedAudio.preload = "metadata";
    document.body.append(sharedAudio);
  }

  if (sharedAudio.src !== new URL(src, window.location.href).href) {
    sharedAudio.src = src;
  }

  return sharedAudio;
}

export function resetSharedAudioElementForTests() {
  sharedAudio?.remove();
  sharedAudio = null;
}
