import { describe, expect, it } from "vitest";
import { withPublicPath } from "./public-path";

describe("public path", () => {
  const publicationTargets = [
    { basePath: "", name: "Cloudflare Pages root" },
    { basePath: "/kurone-ko-portfolio", name: "GitHub Pages" },
  ] as const;

  it.each(publicationTargets)("keeps root-relative URLs correct for $name", ({ basePath }) => {
    const prefix = basePath === "" ? "" : "/kurone-ko-portfolio";

    expect(withPublicPath("/", basePath)).toBe(`${prefix}/`);
    expect(withPublicPath("/portfolio?view=showcase#projects", basePath)).toBe(
      `${prefix}/portfolio?view=showcase#projects`,
    );
    expect(withPublicPath("/assets/app.js?cache=1#runtime", basePath)).toBe(
      `${prefix}/assets/app.js?cache=1#runtime`,
    );
  });

  it("does not double-prefix paths that already use the GitHub Pages base path", () => {
    expect(withPublicPath("/kurone-ko-portfolio/assets/app.js", "/kurone-ko-portfolio")).toBe(
      "/kurone-ko-portfolio/assets/app.js",
    );
    expect(withPublicPath("/kurone-ko-portfolio/?view=showcase#projects", "/kurone-ko-portfolio")).toBe(
      "/kurone-ko-portfolio/?view=showcase#projects",
    );
  });

  it("leaves external, relative, and root-target paths unchanged", () => {
    const basePath = "/kurone-ko-portfolio";

    expect(withPublicPath("https://example.com/assets/app.js", basePath)).toBe(
      "https://example.com/assets/app.js",
    );
    expect(withPublicPath("//cdn.example.com/assets/app.js", basePath)).toBe(
      "//cdn.example.com/assets/app.js",
    );
    expect(withPublicPath("mailto:hello@example.com", basePath)).toBe(
      "mailto:hello@example.com",
    );
    expect(withPublicPath("#main-content", basePath)).toBe("#main-content");
    expect(withPublicPath("/assets/app.js", "")).toBe("/assets/app.js");
  });
});
