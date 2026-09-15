const PUBLICATION_TARGET = {
  GITHUB_PAGES: "github-pages",
  ROOT: "root",
} as const;

type PublicationTarget =
  (typeof PUBLICATION_TARGET)[keyof typeof PUBLICATION_TARGET];

const GITHUB_PAGES_BASE_PATH = "/kurone-ko-portfolio";

function getPublicationTarget(value: string | undefined): PublicationTarget {
  return value === PUBLICATION_TARGET.GITHUB_PAGES
    ? PUBLICATION_TARGET.GITHUB_PAGES
    : PUBLICATION_TARGET.ROOT;
}

export const PUBLICATION_BASE_PATH =
  getPublicationTarget(process.env.NEXT_PUBLIC_DEPLOY_TARGET) ===
  PUBLICATION_TARGET.GITHUB_PAGES
    ? GITHUB_PAGES_BASE_PATH
    : "";

function splitPathSuffix(path: string) {
  const suffixIndex = path.search(/[?#]/u);
  return suffixIndex < 0
    ? { pathname: path, suffix: "" }
    : { pathname: path.slice(0, suffixIndex), suffix: path.slice(suffixIndex) };
}

export function withPublicPath(
  path: string,
  basePath = PUBLICATION_BASE_PATH,
): string {
  if (
    basePath === "" ||
    !path.startsWith("/") ||
    path.startsWith("//")
  ) {
    return path;
  }

  const { pathname, suffix } = splitPathSuffix(path);
  if (pathname === basePath || pathname.startsWith(`${basePath}/`)) {
    return path;
  }

  return `${basePath}${pathname}${suffix}`;
}
