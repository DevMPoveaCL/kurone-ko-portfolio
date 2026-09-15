import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectCarousel } from "./ProjectCarousel";
import { ProjectFilterControls } from "./ProjectFilterControls";
import { PROJECT_UNLOCK_CHALLENGES, PROJECT_UNLOCK_SUCCESS } from "./hidden-project-unlock";
import { PROJECTS } from "./project-data";
import { filterProjects, getActiveProjectId, getFilterLabel } from "./project-taxonomy";
import { createShowcaseState, SHOWCASE_ACTION, showcaseReducer } from "./showcase-reducer";

function StaticShowcase() {
  const [state, dispatch] = useReducer(showcaseReducer, createShowcaseState());
  const projects = filterProjects(PROJECTS, state.selectedIds);
  const activeProjectId = getActiveProjectId(projects, state.activeProjectId);

  return (
    <>
      <ProjectFilterControls
        onClear={() => dispatch({ type: SHOWCASE_ACTION.FILTERS_CLEARED })}
        onApply={(filterIds) => {
          dispatch({ type: SHOWCASE_ACTION.FILTERS_CLEARED });
          filterIds.forEach((filterId) => dispatch({ type: SHOWCASE_ACTION.FILTER_TOGGLED, filterId }));
        }}
        projects={PROJECTS}
        selectedIds={state.selectedIds}
      />
      <ProjectCarousel
        activeProjectId={activeProjectId}
        onActiveProjectChange={(projectId) => dispatch({ type: SHOWCASE_ACTION.PROJECTS_RECONCILED, projectIds: [projectId] })}
        onClearFilters={() => dispatch({ type: SHOWCASE_ACTION.FILTERS_CLEARED })}
        projects={projects}
        selectedFilterLabels={state.selectedIds.map(getFilterLabel)}
      />
    </>
  );
}

describe("static project showcase", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps the fluid filter tile and full-viewport Void contracts in the canonical stylesheet", () => {
    const globalsCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
    const voidRule = globalsCss.match(/\.professional-void-state \{[\s\S]*?\n\}/)?.[0] ?? "";
    const optionLabelRule = globalsCss.match(/\.project-filter-option > span \{[\s\S]*?\n\}/)?.[0] ?? "";

    expect(globalsCss).toContain("--project-filter-option-block-size: clamp(4rem, 4.4vw, 4.75rem);");
    expect(globalsCss).toContain("grid-auto-rows: var(--project-filter-option-block-size);");
    expect(globalsCss).toContain("grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));");
    expect(globalsCss).not.toContain("@container project-filter-dialog (max-width: 60rem)");
    expect(globalsCss).not.toContain("@container project-filter-dialog (max-width: 48rem)");
    expect(optionLabelRule).toContain("white-space: normal;");
    expect(optionLabelRule).not.toContain("text-overflow: ellipsis;");
    expect(optionLabelRule).not.toContain("white-space: nowrap;");
    expect(globalsCss).toContain("inline-size: clamp(2rem, min(3.2cqw, 2.75rem), 2.75rem);");
    expect(globalsCss).toContain("font-size: clamp(1rem, min(calc(1rem + 0.8cqw), 1.5rem), 1.5rem);");
    expect(globalsCss).toContain("--project-card-frame-aspect: 941 / 1672;");
    expect(globalsCss).toContain("--card-frame-opening-top: 18.96%;");
    expect(globalsCss).toContain("--card-frame-band-top-height: 6.4%;");
    expect(globalsCss).toContain("z-index: 4 !important;");
    expect(globalsCss).toContain("font-size: clamp(\n    0.875rem,");
    expect(globalsCss).toContain("grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));");
    expect(globalsCss).toContain("2.75rem,");
    expect(voidRule).toContain("position: fixed;");
    expect(voidRule).toContain("inset: 0;");
    expect(voidRule).toContain("inline-size: 100%;");
    expect(voidRule).toContain("block-size: 100dvh;");
    expect(voidRule).toContain("radial-gradient(circle at 18% 12%, #ffffff1f, transparent 30rem)");
    expect(voidRule).toContain("linear-gradient(145deg, var(--background), #101010 54%, #020202)");
    expect(voidRule).not.toContain("transform:");
    expect(voidRule).not.toContain("margin: auto");
    expect(globalsCss).toContain(".professional-void-movement-legend");
    expect(globalsCss).toContain('object-position: 49.65% 50%;');
    expect(globalsCss).not.toContain('object-position: 49.85% 50%;');
    expect(globalsCss).toContain("row-gap: clamp(0.9rem, 0.3em, 1.75rem);");
    expect(globalsCss).toContain(".professional-void-quote");
    expect(globalsCss).toContain("--professional-void-quote-measure: 36ch;");
    expect(globalsCss).toContain("letter-spacing: normal;");
    expect(globalsCss).toContain("line-height: 1.35;");
    expect(globalsCss).toContain("max-inline-size: var(--professional-void-quote-measure);");
    expect(globalsCss).toContain("grid-template-rows: max-content max-content;");
    expect(globalsCss).toContain("@media (min-width: 48rem) and (max-aspect-ratio: 4 / 3)");
    expect(globalsCss).toContain("overflow: hidden;");
    expect(globalsCss).toContain("justify-self: center;");
    expect(globalsCss).toContain("block-size: min(100%, clamp(10rem, min(20dvh, 28vw), 16rem));");
    expect(globalsCss).toContain(".professional-void-quote-desktop");
    expect(globalsCss).toContain(".professional-void-quote-mobile");
    expect(globalsCss).toContain(
      ".professional-void-quote > .professional-void-quote-desktop {\n  display: block;\n}",
    );
    expect(globalsCss).toContain(
      ".professional-void-quote > .professional-void-quote-mobile {\n  display: none;\n}",
    );
    expect(globalsCss).toContain(
      ".professional-void-quote > .professional-void-quote-desktop {\n    display: none;\n  }",
    );
    expect(globalsCss).toContain(
      ".professional-void-quote > .professional-void-quote-mobile {\n    display: grid;\n    gap: 0;\n  }",
    );
    expect(globalsCss).not.toContain("professional-void-quote-mobile .fitted-band-text-content");
    expect(globalsCss).toContain("text-shadow: 0 0.06rem 0 #090909, 0 0 0.22rem rgba(255, 250, 240, 0.62);");
    expect(globalsCss).toContain("background: transparent;");
    expect(globalsCss).toContain("--showcase-player-reservation");
    expect(globalsCss).not.toContain("--showcase-player-toolbar-reservation");
    expect(globalsCss).not.toMatch(
      /\.main-hall:has\(\.bug-cesante-player\) \.project-showcase\s*\{/,
    );
    expect(globalsCss).toContain(
      "padding-block-start: var(--showcase-player-reservation, 0px);",
    );
    expect(globalsCss).toContain("--card-frame-band-inline-safe: 2.6%;");
    expect(globalsCss).toContain("--card-frame-band-top-height: 6.4%;");
    expect(globalsCss).toContain("--card-frame-band-bottom-inset: 3.35%;");
    expect(globalsCss).toContain("/* The rail owns cards and seals as one composition; navigation owns arrows and counter. */");
    expect(globalsCss).toContain(".project-showcase .project-showcase-rail,");
    expect(globalsCss).toContain(".project-showcase .project-carousel-navigation,");
    expect(globalsCss).toContain(".project-showcase .project-filter-actions");
    expect(globalsCss).toContain(".project-showcase .project-showcase-identity");
    expect(globalsCss).toContain('data-showcase-reveal="entering"');
    expect(globalsCss).toContain("opacity 440ms cubic-bezier(0.22, 1, 0.36, 1)");
    expect(globalsCss).not.toContain("project-hall-ui-arrival 360ms 620ms");
    expect(globalsCss).not.toContain("project-hall-ui-arrival 380ms 690ms");
  });

  it("keeps both static publication targets and required exported routes", () => {
    const nextConfig = readFileSync(resolve(process.cwd(), "next.config.ts"), "utf8");
    const buildScript = readFileSync(resolve(process.cwd(), "scripts/build-static.mjs"), "utf8");
    const notFoundPage = readFileSync(resolve(process.cwd(), "src/app/not-found.tsx"), "utf8");
    const portfolioPage = readFileSync(resolve(process.cwd(), "src/app/portfolio/page.tsx"), "utf8");
    const showcaseSource = readFileSync(resolve(process.cwd(), "src/features/portfolio/ProjectShowcase.tsx"), "utf8");

    expect(nextConfig).toContain('output: "export"');
    expect(nextConfig).toContain("trailingSlash: true");
    expect(nextConfig).toContain("unoptimized: true");
    expect(nextConfig).toContain('assetPrefix: githubPagesBasePath, basePath: githubPagesBasePath');
    expect(nextConfig).toContain('NEXT_PUBLIC_DEPLOY_TARGET: deployTarget');
    expect(buildScript).toContain('target !== "cloudflare" && target !== "github-pages"');
    expect(buildScript).toContain('"index.html", "portfolio/index.html", "404.html"');
    expect(portfolioPage).toContain("AlternatePortfolioGate");
    expect(notFoundPage).toContain('href="/"');
    expect(showcaseSource).toContain("window.location.hash");
  });

  it("gives locked Joker artwork contain precedence over the shared cover rule", () => {
    const globalsCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
    const coverRuleIndex = globalsCss.indexOf(
      ".project-card-preview > img,\n.project-card-preview > video,\n.project-card-joker > img",
    );
    const lockedJokerRuleIndex = globalsCss.indexOf(
      '.project-card[data-locked="true"] .project-card-joker > img',
    );
    const lockedJokerRule = globalsCss.match(
      /\.project-card\[data-locked="true"\] \.project-card-joker > img \{[\s\S]*?\n\}/,
    )?.[0] ?? "";

    expect(coverRuleIndex).toBeGreaterThanOrEqual(0);
    expect(lockedJokerRuleIndex).toBeGreaterThan(coverRuleIndex);
     expect(lockedJokerRule).toContain("object-fit: fill;");
     expect(lockedJokerRule).toContain("object-position: center;");
     expect(lockedJokerRule).not.toContain("object-fit: contain;");
     expect(lockedJokerRule).not.toMatch(/project-id|max-width|pointer|!important/iu);
   });

  it("reuses the Filters banner for the edge-to-edge riddle band", () => {
      const projectCardSource = readFileSync(resolve(process.cwd(), "src/features/portfolio/ProjectCard.tsx"), "utf8");
      const filterControlsSource = readFileSync(resolve(process.cwd(), "src/features/portfolio/ProjectFilterControls.tsx"), "utf8");
      const bannerSource = readFileSync(resolve(process.cwd(), "src/features/portfolio/ProjectFilterTitleBanner.tsx"), "utf8");
      const globalsCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
       const riddleWidthRule = globalsCss.match(/\.project-unlock-dialog \.project-card-modal-content,[\s\S]*?\n\}/)?.[0] ?? "";
       const riddleContentRule = globalsCss.match(/\.project-unlock-dialog \.project-unlock-riddle-content \{[\s\S]*?\n\}/)?.[0] ?? "";
        const riddleLineRule = globalsCss.match(/\.project-unlock-riddle-line \{[\s\S]*?\n\}/)?.[0] ?? "";
        const riddleFinalLineRule = globalsCss.match(/\.project-unlock-riddle-line:last-child \{[\s\S]*?\n\}/)?.[0] ?? "";
        const riddleQuestionRule = globalsCss.match(/\.project-unlock-riddle-line:first-child \{[\s\S]*?\n\}/)?.[0] ?? "";
       const filterGlowRule = globalsCss.match(/\.project-unlock-filter-glow \{[\s\S]*?\n\}/)?.[0] ?? "";
       const riddleBannerRule = globalsCss.match(/\.project-unlock-riddle-banner \{[\s\S]*?\n\}/)?.[0] ?? "";
       const riddleHeaderRule = globalsCss.match(/\.project-unlock-dialog \.project-card-modal-header \{[\s\S]*?\n\}/)?.[0] ?? "";

      expect(projectCardSource).toContain("ProjectFilterTitleBanner");
      expect(projectCardSource).toContain('className="project-filter-title-banner project-unlock-riddle-banner"');
      expect(filterControlsSource).toContain("<ProjectFilterTitleBanner />");
       expect(bannerSource).toContain('withPublicPath("/assets/projects/titlemobile2.webp")');
       expect(bannerSource).toContain('src={withPublicPath("/assets/projects/filter-title.webp")}');
      expect(bannerSource).toContain('sizes="(min-width: 769px) 66rem, 100vw"');
      expect(riddleBannerRule).toContain("inline-size: 100%;");
      expect(riddleBannerRule).toContain("grid-row: 2;");
      expect(riddleHeaderRule).toContain("padding-inline: clamp(3.5rem, 7vw, 4.4rem);");
      expect(riddleHeaderRule).toContain("text-align: center;");
      expect(riddleWidthRule).toContain("inline-size: 100%;");
      expect(riddleWidthRule).toContain("max-inline-size: none;");
      expect(riddleContentRule).toContain("inline-size: 100%;");
      expect(riddleContentRule).toContain("max-inline-size: none;");
      expect(riddleContentRule).toContain("text-align: center;");
      expect(riddleLineRule).toContain("inline-size: 100%;");
      expect(riddleLineRule).toContain("max-inline-size: none;");
       expect(riddleLineRule).toContain("text-align: center;");
        expect(riddleLineRule).not.toMatch(/max-inline-size:.*ch/iu);
        expect(riddleFinalLineRule).toContain("color: rgba(255, 250, 240, 0.66);");
        expect(riddleFinalLineRule).not.toContain("opacity:");
        expect(PROJECT_UNLOCK_CHALLENGES[0]?.body[0]).toBe("¿Quién dijo esta frase? Descubrirlo debes.");
        expect(riddleQuestionRule).toContain("color: #fffaf0;");
        expect(globalsCss).toContain("grid-template-rows: auto auto minmax(0, 1fr);");
       expect(filterGlowRule).toContain("color: #fffaf0;");
       expect(filterGlowRule).toContain("text-shadow: 0 0 0.35rem rgba(255, 255, 255, 0.18);");
     });

   it("keeps hidden project modals on the shared data-driven renderer", () => {
     const projectCardSource = readFileSync(resolve(process.cwd(), "src/features/portfolio/ProjectCard.tsx"), "utf8");
     const globalsCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

     expect(projectCardSource).toContain("project.modalPresentation");
     expect(projectCardSource).toContain("project.stackPresentation");
     expect(projectCardSource).toContain("project.loreSections");
     expect(projectCardSource).not.toContain("kuroneko-sii");
     expect(globalsCss).not.toContain("kuroneko-sii");
   });

        it("keeps the compact success quote, artwork grid, and post-art action order", () => {
           const globalsCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
           const showcaseSource = readFileSync(resolve(process.cwd(), "src/features/portfolio/ProjectShowcase.tsx"), "utf8");
           const successQuoteRule = globalsCss.match(/\.project-unlock-success-quote \{[\s\S]*?\n\}/)?.[0] ?? "";
            const successQuoteLineRule = globalsCss.match(/\.project-unlock-success-quote::before,[\s\S]*?\n\}/)?.[0] ?? "";
           const successEmphasisRule = globalsCss.match(/\.project-unlock-success-emphasis \{[\s\S]*?\n\}/)?.[0] ?? "";
           const successQuoteWrapRule = globalsCss.match(/\.project-unlock-success-copy > \.project-unlock-success-quote \{[\s\S]*?\n\}/)?.[0] ?? "";
          const normalizeCss = (value: string) => value.replace(/\s+/gu, " ").trim();
         const baseSuccessCopyRule = globalsCss.match(/\.project-unlock-success-copy\s*\{([\s\S]*?)\}/u)?.[1] ?? "";
          const lateDesktopMediaStart = globalsCss.lastIndexOf("@media (min-width: 48.0625rem)");
         const lateDesktopRules = lateDesktopMediaStart < 0 ? "" : globalsCss.slice(lateDesktopMediaStart);
          const successDesktopModalDeclarations = lateDesktopRules.match(/\.project-unlock-success-dialog\s*\{([\s\S]*?)\}/u)?.[1] ?? "";
           const successDesktopCopyDeclarations = lateDesktopRules.match(/\.project-unlock-success-copy\s*\{([\s\S]*?)\}/u)?.[1] ?? "";
           const successDesktopArtDeclarations = lateDesktopRules.match(/\.project-unlock-success-art\s*\{([\s\S]*?)\}/u)?.[1] ?? "";
           const successDesktopQuoteDeclarations = lateDesktopRules.match(/\.project-unlock-success-quote\s*\{([\s\S]*?)\}/u)?.[1] ?? "";

       expect(globalsCss).toContain(".project-unlock-success-layout");
           expect(globalsCss).toContain("grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);");
          expect(globalsCss).toContain("align-items: stretch;");
         expect(globalsCss).toContain("gap: clamp(0.5rem, 1.2vw, 0.75rem);");
         expect(globalsCss).toContain(".project-unlock-success-copy");
          expect(showcaseSource).toContain('className="project-unlock-success-divider"');
           expect(showcaseSource).toContain('aria-hidden="true"');
           expect(showcaseSource).toContain('<blockquote className="project-unlock-success-quote">');
            expect(showcaseSource).toContain('“{PROJECT_UNLOCK_SUCCESS.quote}”');
            expect(showcaseSource).not.toContain("project-unlock-success-quote-mark");
            expect(showcaseSource).not.toContain('className="project-unlock-success-quote-frame"');
            expect(showcaseSource).toContain('className="project-unlock-success-actions"');
            expect(showcaseSource).not.toContain('className="project-card-modal-actions"');
            expect(globalsCss).toContain(".project-unlock-success-divider::before");
            expect(globalsCss).toContain(".project-unlock-success-divider-mark");
            expect(globalsCss).toContain(".project-unlock-success-quote::before");
            expect(globalsCss).toContain(".project-unlock-success-quote::after");
            expect(globalsCss).toContain("transform: rotate(45deg);");
        expect(globalsCss).toContain("inline-size: 100%;");
        expect(globalsCss).toContain("object-fit: contain;");
        expect(globalsCss).toContain("--project-unlock-success-mobile-body-gutter: max(");
        expect(globalsCss).toContain("padding-inline: var(--project-unlock-success-mobile-body-gutter);");
        expect(globalsCss).toContain("scrollbar-width: none;");
        expect(globalsCss).toContain("padding-inline: clamp(0.625rem, 1.5vw, 1rem);");
       expect(globalsCss).toContain("padding: clamp(1rem, 3vw, 1.5rem);");
        expect(globalsCss).toContain(".project-unlock-success-actions");
       expect(globalsCss).toContain("justify-content: center;");
         expect(globalsCss).toContain("grid-template-columns: minmax(0, 1fr);");
         expect(globalsCss).toContain("align-items: center;");
         expect(globalsCss).toContain("gap: clamp(1rem, 4vw, 1.5rem);");
         expect(successQuoteRule).toContain("font-family: var(--font-readable), sans-serif;");
         expect(successQuoteRule).not.toContain("var(--font-display-cartoon)");
         expect(successQuoteRule).toContain("color: #fffaf0;");
          expect(successQuoteRule).toContain("inline-size: min(100%, 30rem);");
          expect(successQuoteRule).toContain("font-size: clamp(1rem, 1rem + 0.35vw, 1.2rem);");
          expect(successQuoteRule).toContain("font-style: italic;");
           expect(successQuoteRule).toContain("line-height: 1.35;");
            expect(successQuoteRule).toContain("overflow: hidden;");
           expect(successQuoteRule).not.toContain("min-block-size:");
           expect(successQuoteRule).toContain("padding: clamp(0.85rem, 2vw, 1.25rem) clamp(1rem, 3vw, 1.75rem);");
           expect(successQuoteLineRule).toContain("background: linear-gradient(");
           expect(successQuoteLineRule).toContain("transparent 0%");
           expect(successQuoteLineRule).toContain("rgba(255, 250, 240, 0.74) 50%");
           expect(successQuoteLineRule).toContain("transparent 100%");
            expect(successQuoteLineRule).toContain("inset-inline: 0;");
            expect(successQuoteLineRule).toContain("block-size: 1px;");
            expect(successQuoteRule).toContain("border: 0;");
            expect(successQuoteRule).toContain("border-radius: 0;");
            expect(successQuoteLineRule).toContain("border: 0;");
            expect(successQuoteLineRule).toContain("border-radius: 0;");
            expect(globalsCss).not.toContain("project-unlock-success-quote-frame");
         expect(successQuoteWrapRule).toContain("max-inline-size: none;");
        expect(successQuoteWrapRule).toContain("justify-self: center;");
          expect(successQuoteWrapRule).toContain("text-wrap: balance;");
          expect(successDesktopQuoteDeclarations).toContain("inline-size: 100%;");
          expect(successDesktopQuoteDeclarations).toContain("max(0px, (100% - 30rem) / 2)");
           expect(successEmphasisRule).toContain("margin-block-start: clamp(0.5rem, 1.5vw, 1rem);");
    expect(showcaseSource).toContain('src={withPublicPath(UNLOCK_SUCCESS_IMAGE_SRC)}');
       expect(PROJECT_UNLOCK_SUCCESS).toEqual({
         action: "CONTINUAR",
         emphasis: "¡Felicidades por desbloquear los proyectos ocultos!",
         kicker: "Status: 200 OK | LOGRO ARÁCNIDO DESBLOQUEADO",
         normal: "Y entre ellos... también existen seres que tienen el gran poder y la enorme responsabilidad de tomar decisiones clave. Encontrar el talento real es un arte, y supongo que por eso no es fácil engañarte.",
          quote: "Hay 10 tipos de personas en el mundo: las que entienden binario... y las que no",
         title: "PROYECTOS DESBLOQUEADOS",
        });
         expect(PROJECT_UNLOCK_SUCCESS.quote).not.toMatch(/["“”]/u);
         expect(globalsCss).toContain("--project-card-modal-kicker-color: rgba(255, 250, 240, 0.66);");
         expect(globalsCss).toContain("color: var(--project-card-modal-kicker-color);");
        expect(PROJECT_UNLOCK_SUCCESS.emphasis).toBe("¡Felicidades por desbloquear los proyectos ocultos!");
        expect(successEmphasisRule).toContain("font-family: var(--font-readable), sans-serif;");
        expect(successEmphasisRule).toContain("font-style: italic;");
        expect(successEmphasisRule).toContain("font-weight: 600;");
        expect(successEmphasisRule).not.toContain("var(--font-display-cartoon)");
        expect(globalsCss).not.toContain("font-size: clamp(1.5rem, 2.8vw, 2rem);");
          expect(globalsCss).toContain("font-size: clamp(0.95rem, 1.5vw, 1.08rem);");
          expect(globalsCss).toContain("text-wrap: balance;");
        expect(globalsCss).toContain("font-size: clamp(1.25rem, 2.15vw, 1.65rem);");
        expect(globalsCss).toContain("font-family: var(--font-readable), sans-serif;");
        expect(globalsCss).toContain("font-style: italic;");
        expect(globalsCss).toContain("font-weight: 600;");
        expect(globalsCss).toContain("text-transform: uppercase;");
           expect(normalizeCss(successDesktopModalDeclarations)).not.toContain("84rem");
             expect(normalizeCss(successDesktopModalDeclarations)).toContain("56rem");
           expect(normalizeCss(successDesktopModalDeclarations)).toContain("max-inline-size: min(");
          const sharedModalMaxRem = Number.parseFloat(globalsCss.match(/inline-size: min\(92vw, ([\d.]+)rem\);/)?.[1] ?? "NaN");
          const successModalMaxRem = Number.parseFloat(successDesktopModalDeclarations.match(/([\d.]+)rem/)?.[1] ?? "NaN");
            expect(successModalMaxRem).toBe(56);
            expect(successModalMaxRem).toBeGreaterThan(42);
            expect(successModalMaxRem).toBeLessThanOrEqual(sharedModalMaxRem);
         expect(globalsCss).toContain("100vw - max(1rem, env(safe-area-inset-left))");
         expect(globalsCss).toContain("inline-size: min(92vw, 56rem);");
           expect(globalsCss).toContain("inline-size: 100%;");
           expect(globalsCss).toContain("max-inline-size: 100%;");
           expect(globalsCss).toContain("block-size: 100%;");
           expect(globalsCss).toContain("max-block-size: 100%;");
          expect(globalsCss).toContain("margin-block: clamp(1.5rem, 3vw, 2.25rem) clamp(1.25rem, 2.5vw, 1.75rem);");
          expect(normalizeCss(baseSuccessCopyRule)).toContain("max-inline-size: none;");
           expect(normalizeCss(successDesktopCopyDeclarations)).toContain("max-inline-size: min(100%, 42rem);");
           expect(normalizeCss(successDesktopCopyDeclarations)).toContain("margin-inline: auto;");
           expect(normalizeCss(successDesktopCopyDeclarations)).toContain("align-content: stretch;");
           expect(normalizeCss(successDesktopArtDeclarations)).toContain("align-self: stretch;");
           expect(normalizeCss(successDesktopArtDeclarations)).toContain("block-size: 100%;");
           expect(normalizeCss(successDesktopArtDeclarations)).toContain("max-block-size: 100%;");
       });

       it("keeps the canonical plural artwork with its intrinsic WebP dimensions", () => {
         const asset = readFileSync(resolve(process.cwd(), "public/assets/projects/acertijos.webp"));

         expect(createHash("sha256").update(asset).digest("hex")).toBe("5c463339a394166a09445b2f305e1579c1a6d384bef2de63042f29f9d860f89a");
       expect(asset.toString("ascii", 0, 4)).toBe("RIFF");
      expect(asset.toString("ascii", 8, 12)).toBe("WEBP");
      expect(asset.toString("ascii", 12, 16)).toBe("VP8X");
      expect(1 + asset[24]! + (asset[25]! << 8) + (asset[26]! << 16)).toBe(1024);
      expect(1 + asset[27]! + (asset[28]! << 8) + (asset[29]! << 16)).toBe(1536);
     });

  it("restores unlock success focus to the shared carousel target", () => {
    const showcaseSource = readFileSync(
      resolve(process.cwd(), "src/features/portfolio/ProjectShowcase.tsx"),
      "utf8",
    );

    expect(showcaseSource).toContain("function restoreCarouselFocus()");
    expect(showcaseSource).toContain(
      "carouselFocusTargetRef.current ?? getCarouselFocusTarget()",
    );
    expect(showcaseSource).not.toContain(".project-card[data-project-id]");
  });

  it("keeps the canonical modal and full-viewport Void contracts", () => {
    const globalsCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

    expect(globalsCss).toContain("container: filter-dialog / inline-size;");
    expect(globalsCss).toContain("height: auto;\n  block-size: auto;\n  max-block-size: calc(100dvh - 2rem);");
    expect(globalsCss).toContain('grid-template-areas: "console" "search" "options" "actions";');
    expect(globalsCss).toContain("grid-auto-rows: var(--project-filter-option-block-size);");
    expect(globalsCss).toContain("overflow-y: scroll;");
    expect(globalsCss).toContain("position: static;");
    expect(globalsCss).not.toContain("container: showcase-room / size;");
    expect(globalsCss).not.toContain("inline-size: min(100%, 36ch);");
  });

  it("shifts the shared modal seal row internally when the player is active", () => {
    const globalsCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
    const mobilePlayerRule = globalsCss.match(
      /\.main-hall:has\(\.bug-cesante-player\)\n    \.project-card\[data-card-has-project-modals="true"\]\n    \.project-card-seals \{[\s\S]*?\n  \}/,
    )?.[0] ?? "";

    expect(mobilePlayerRule).toContain(
      '.main-hall:has(.bug-cesante-player)\n    .project-card[data-card-has-project-modals="true"]\n    .project-card-seals',
    );
    expect(mobilePlayerRule).toContain(
      "--project-card-seal-row-offset: clamp(0.5rem, 1dvh, 0.75rem);",
    );
    expect(mobilePlayerRule).toContain(
      "transform: translateY(calc(-1 * var(--project-card-seal-row-offset)));",
    );
    expect(globalsCss).not.toContain(
      '.main-hall:has(.bug-cesante-player[data-minimized="false"]) .project-showcase-rail',
    );
    expect(mobilePlayerRule).not.toMatch(/project-showcase-rail|project[1-7]|filtercalls/iu);
  });

  it("centers only the Stack evidence footer in the canonical stylesheet", () => {
    const globalsCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
    const evidenceRule = globalsCss.match(/\.project-one-stack-evidence \{\n  border-block-start:[\s\S]*?\n\}/)?.[0] ?? "";

    expect(evidenceRule).toContain("text-align: center;");
  });

  it("keeps Project 6 free of project-specific card JSX and CSS", () => {
    const projectCardTsx = readFileSync(
      resolve(process.cwd(), "src/features/portfolio/ProjectCard.tsx"),
      "utf8",
    );
    const projectCarouselTsx = readFileSync(
      resolve(process.cwd(), "src/features/portfolio/ProjectCarousel.tsx"),
      "utf8",
    );
    const globalsCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

    expect(`${projectCardTsx}\n${projectCarouselTsx}\n${globalsCss}`).not.toMatch(
      /project6|pymeflow/iu,
    );
  });

  it("keeps Projects 7 and 8 free of project-specific card JSX, CSS, and selectors", () => {
    const projectCardTsx = readFileSync(
      resolve(process.cwd(), "src/features/portfolio/ProjectCard.tsx"),
      "utf8",
    );
    const projectCarouselTsx = readFileSync(
      resolve(process.cwd(), "src/features/portfolio/ProjectCarousel.tsx"),
      "utf8",
    );
    const globalsCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

    expect(`${projectCardTsx}\n${projectCarouselTsx}\n${globalsCss}`).not.toMatch(
      /project7|filtercalls|project8|github-activity/iu,
    );
  });

  it("keeps the Project 7 identity exact in the static fallback", () => {
    const pageTsx = readFileSync(resolve(process.cwd(), "src/app/page.tsx"), "utf8");

    expect(pageTsx).toContain("<li>Kurone-ko FilterCalls</li>");
    expect(pageTsx).toContain("<li>Kurone-ko GitHub Activity</li>");
    expect(pageTsx).not.toContain("<li>FilterCalls</li>");
    expect(pageTsx).not.toContain("<li>AutoExplorer</li>");
  });

  it("renders a passive desktop legend without duplicate Stack or Info controls", () => {
    const { container } = render(<StaticShowcase />);
    const legend = container.querySelector(".project-showcase-legend");

    expect(legend).toBeInTheDocument();
    expect(legend).toHaveTextContent("STACK");
    expect(legend).toHaveTextContent("INFO");
    expect(legend).not.toHaveTextContent("FILTROS");
    expect(legend).not.toHaveTextContent("PROYECTOS");
    expect(legend?.querySelector("img.project-showcase-legend-key")).toHaveAttribute("src", "/assets/projects/keycaps-tight/S.webp");
    expect(legend?.querySelectorAll("img.project-showcase-legend-key")[1]).toHaveAttribute("src", "/assets/projects/keycaps-tight/i.webp");
    expect(legend?.querySelectorAll("button, a, input, select, textarea")).toHaveLength(0);
    expect(container.querySelectorAll(".project-modal-shortcut-open")).toHaveLength(0);

    const movementLegend = container.querySelector(".player-movement-legend");
    expect(movementLegend).not.toBeInTheDocument();
  });

  it("renders the movement legend only when the provider has unlocked it", () => {
    const { container } = render(<ProjectFilterControls onApply={() => undefined} onClear={() => undefined} projects={PROJECTS} selectedIds={[]} showMovementLegend />);
    const movementLegend = container.querySelector(".player-movement-legend");

    expect(movementLegend).toHaveTextContent("Para mover la posición del reproductor de música");
    expect(movementLegend?.querySelectorAll("img")).toHaveLength(5);
  });

  it("derives eligible checkbox controls, applies inclusive OR, and announces without moving focus", async () => {
    const user = userEvent.setup();
    render(<StaticShowcase />);

    await user.click(screen.getByRole("button", { name: /Filtros/ }));
    const react = screen.getByRole("checkbox", { name: "React" });
    const flutter = screen.getByRole("checkbox", { name: "Flutter" });
    await user.click(react);
    await user.click(flutter);
    await user.click(screen.getByRole("button", { name: /APLICAR/ }));

    expect(screen.queryByRole("checkbox", { name: "Next.js" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Kurone-ko Timer" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Kurone-ko Alarm" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Proyectos filtrados" })).toBeInTheDocument();
  });

  it("removes an individual filter and clears all selections", async () => {
    const user = userEvent.setup();
    render(<StaticShowcase />);

    await user.click(screen.getByRole("button", { name: /Filtros/ }));
    await user.click(screen.getByRole("checkbox", { name: "React" }));
    expect(screen.getByRole("checkbox", { name: "React" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "LIMPIAR. Atajo: Alt + X." }));
    expect(screen.getByRole("checkbox", { name: "React" })).not.toBeChecked();
  });

  it("suppresses search suggestions and routes ArrowDown to the first visible technology", async () => {
    const user = userEvent.setup();
    render(<StaticShowcase />);

    await user.click(screen.getByRole("button", { name: /Filtros/ }));
    const search = screen.getByRole("searchbox", { name: "Buscar tecnología" });

    expect(search).toHaveAttribute("type", "search");
    expect(search).toHaveAttribute("autocomplete", "off");
    expect(search).toHaveAttribute("aria-autocomplete", "none");

    await user.type(search, "React");
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("checkbox", { name: "React" })).toHaveFocus();
  });

  it("keeps only matching technology options visible while searching", async () => {
    const user = userEvent.setup();
    render(<StaticShowcase />);

    await user.click(screen.getByRole("button", { name: /Filtros/ }));
    await user.type(screen.getByRole("searchbox", { name: "Buscar tecnología" }), "React");

    expect(screen.getByRole("checkbox", { name: "React" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Android" })).not.toBeInTheDocument();
  });

  it("keeps eligible projects in source order and disables rail boundaries", async () => {
    const user = userEvent.setup();
    const projects = filterProjects(PROJECTS, []);
    const activeProject = projects[0];

    if (activeProject === undefined) throw new Error("Expected an eligible project.");

    const onActiveProjectChange = vi.fn();
    render(<ProjectCarousel activeProjectId={activeProject.id} onActiveProjectChange={onActiveProjectChange} projects={projects} />);

    const list = screen.getByRole("list", { name: "Proyectos filtrados" });
    expect([...list.querySelectorAll("h3[id$='-title']")].map((heading) => heading.querySelector(".fitted-band-text-content")?.textContent ?? heading.textContent)).toEqual(projects.map((project) => project.front.title));
    expect(within(list).getAllByRole("listitem")[0]).toHaveAttribute("aria-current", "true");
    await user.click(screen.getByRole("button", { name: "Proyecto anterior" }));
    expect(onActiveProjectChange).toHaveBeenCalledWith(projects.at(-1)?.id);
  });

  it("routes horizontal arrows from a non-conflicting filter control", async () => {
    const user = userEvent.setup();
    const onActiveProjectChange = vi.fn();
    const projects = filterProjects(PROJECTS, []);
    const activeProject = projects[0];

    if (activeProject === undefined) throw new Error("Expected an eligible project.");

    render(
      <>
        <ProjectFilterControls
          onApply={() => undefined}
          onClear={() => undefined}
          projects={PROJECTS}
          selectedIds={[]}
        />
        <ProjectCarousel
          activeProjectId={activeProject.id}
          onActiveProjectChange={onActiveProjectChange}
          projects={projects}
        />
      </>,
    );

    const filterButton = screen.getByRole("button", { name: /Filtros/ });
    filterButton.focus();
    await user.keyboard("{ArrowRight}");

    expect(onActiveProjectChange).toHaveBeenCalledWith(projects[1]?.id);
  });

  it("keeps the active ProjectCard controls accessible while making occluded cards inert in the 3D layout", async () => {
    const projects = filterProjects(PROJECTS, []).filter((project) => ["filter-calls", "translator"].includes(project.id));
    const activeProject = projects[1];

    if (activeProject === undefined) throw new Error("Expected two eligible projects.");

    vi.stubGlobal("matchMedia", () => ({ addEventListener: vi.fn(), matches: false, removeEventListener: vi.fn() }));
    vi.stubGlobal("CSS", { supports: vi.fn(() => true) });
    render(<ProjectCarousel activeProjectId={activeProject.id} onActiveProjectChange={() => undefined} projects={projects} />);

    const items = screen.getByRole("list", { name: "Proyectos filtrados" }).querySelectorAll(".project-showcase-item");
    const activeItem = items[1] as HTMLElement | undefined;

    if (activeItem === undefined) throw new Error("Expected an active item.");

    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute("inert");
    expect(items[0]).toHaveStyle({ "--ring-angle": "-56deg", "--ring-radius": "260px" });
    expect(activeItem).toHaveAttribute("data-active", "true");
    expect(within(activeItem).queryByRole("button", { name: /Ver historia de/ })).toBeInTheDocument();
  });

  it("keeps inactive cards focusable and interactive in the static layout", async () => {
    const projects = filterProjects(PROJECTS, []).filter((project) => ["filter-calls", "translator"].includes(project.id));
    const activeProject = projects[0];

    if (activeProject === undefined) throw new Error("Expected two eligible projects.");

    render(<ProjectCarousel activeProjectId={activeProject.id} onActiveProjectChange={() => undefined} projects={projects} />);

    const inactiveItem = screen.getByRole("list", { name: "Proyectos filtrados" }).querySelectorAll(".project-showcase-item")[1] as HTMLElement | undefined;
    if (inactiveItem === undefined) throw new Error("Expected an inactive item.");

    expect(inactiveItem).not.toHaveAttribute("inert");
    expect(within(inactiveItem).queryByRole("button", { name: /Ver historia de/ })).toBeInTheDocument();
  });

  it("offers empty recovery even when no projects are available", async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();
    render(<ProjectCarousel activeProjectId={null} onActiveProjectChange={() => undefined} onClearFilters={onClearFilters} projects={[]} />);

    expect(screen.getByRole("status")).toHaveTextContent("No hay proyectos");
    await user.click(screen.getByRole("button", { name: "Mostrar todos los proyectos" }));
    expect(onClearFilters).toHaveBeenCalledOnce();
  });
});
