import { withPublicPath } from "@/shared/routing/public-path";

export const BUG_CESANTE_AUDIO_PATH = "/assets/audio/bug-cesante-f6875aab.ogg";
export const GITHUB_PAGES_ORIGIN = "https://devmpoveacl.github.io";
export const GITHUB_PAGES_BASE_PATH = "/kurone-ko-portfolio";
export const CLOUDFLARE_PAGES_HOSTNAME = "kurone-ko-portfolio.pages.dev";
export const GITHUB_PAGES_HOSTNAME = "devmpoveacl.github.io";

interface MediaLocation {
  hostname: string;
  origin: string;
}

function getBrowserLocation(): MediaLocation | null {
  if (typeof window === "undefined") return null;
  return { hostname: window.location.hostname, origin: window.location.origin };
}

export function resolveBugCesanteAudioSource(
  location: MediaLocation | null = getBrowserLocation(),
): string {
  const hostname = location?.hostname.toLowerCase();

  if (hostname === CLOUDFLARE_PAGES_HOSTNAME) {
    return `${GITHUB_PAGES_ORIGIN}${GITHUB_PAGES_BASE_PATH}${BUG_CESANTE_AUDIO_PATH}`;
  }

  if (hostname === GITHUB_PAGES_HOSTNAME) {
    return withPublicPath(BUG_CESANTE_AUDIO_PATH, GITHUB_PAGES_BASE_PATH);
  }

  return withPublicPath(BUG_CESANTE_AUDIO_PATH, "");
}
