let sharedAudio: HTMLAudioElement | null = null;
const AUDIO_TRANSPORT_OWNER = {
  PRIMARY: "primary",
  ALTERNATE: "alternate",
} as const;

export type AudioTransportOwner =
  (typeof AUDIO_TRANSPORT_OWNER)[keyof typeof AUDIO_TRANSPORT_OWNER];

let transportOwner: AudioTransportOwner | null = null;

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

export function acquireAudioTransportOwner(
  owner: AudioTransportOwner,
  src: string,
): HTMLAudioElement {
  if (owner !== AUDIO_TRANSPORT_OWNER.PRIMARY && owner !== AUDIO_TRANSPORT_OWNER.ALTERNATE) {
    throw new Error(`Unknown audio transport owner: ${owner}`);
  }

  const audio = getSharedAudioElement(src);

  if (transportOwner !== owner) {
    if (!audio.paused) audio.pause();
    try {
      audio.currentTime = 0;
    } catch {
      // A media element without metadata may reject a reset; the next owner still starts paused.
    }
    transportOwner = owner;
  }

  return audio;
}

export function ownsAudioTransport(owner: AudioTransportOwner): boolean {
  return transportOwner === owner;
}

export function releaseAudioTransportOwner(owner: AudioTransportOwner): boolean {
  if (transportOwner !== owner) return false;
  if (sharedAudio !== null && !sharedAudio.paused) sharedAudio.pause();
  transportOwner = null;
  return true;
}

export function resetSharedAudioElementForTests() {
  sharedAudio?.remove();
  sharedAudio = null;
  transportOwner = null;
}
