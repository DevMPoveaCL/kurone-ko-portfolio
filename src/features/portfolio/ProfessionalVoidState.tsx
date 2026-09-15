"use client";

import Image from "next/image";
import { useEffect, useEffectEvent, useLayoutEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import { ExternalLink } from "./ExternalNavigation";
import { useBugCesantePlayer } from "./BugCesantePlayer";
import { withPublicPath } from "@/shared/routing/public-path";
const YODA_PROFILE_WIDTH = 1004;
const YODA_PROFILE_HEIGHT = 951;

const PROFESSIONAL_VOID_QUOTE = {
  DESKTOP: "“Mi primer trabajo como desarrollador, encontrar busco; al lado oscuro de la cesantía, caer no debo.”",
  MOBILE_LINE_ONE: "Mi primer trabajo como desarrollador, encontrar busco;",
  MOBILE_LINE_TWO: "...Al lado oscuro de la cesantía, caer no debo",
} as const;

export const PROFESSIONAL_PROFILE_URLS = {
  GITHUB: "https://github.com/DevMPoveaCL",
  LINKEDIN: "https://www.linkedin.com/in/marco-povea-b21038258/",
} as const;

export interface ProfessionalVoidStateProps {
  socialFocusRef: RefObject<HTMLAnchorElement | null>;
}

const SOCIAL_CONTROL = {
  LINKEDIN: "linkedin",
  GITHUB: "github",
} as const;

type SocialControl = (typeof SOCIAL_CONTROL)[keyof typeof SOCIAL_CONTROL];

function isVoidActionableTarget(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement) || !element.isConnected || element.hasAttribute("disabled") || element.closest("[inert], dialog[open], [role='dialog']") !== null) return false;
  if (!element.matches("a[href], button, [role='button'], [tabindex]:not([tabindex='-1'])")) return false;
  return element.closest(".professional-void-state, .project-showcase, .bug-cesante-player") !== null;
}

function isVoidProtectedTarget(element: Element | null) {
  if (!(element instanceof Element)) return false;
  return element.closest("input, textarea, select, [contenteditable='true'], dialog[open], [role='dialog']") !== null;
}

export function ProfessionalVoidState({ socialFocusRef }: ProfessionalVoidStateProps) {
  const { activatePlayer, focusBottomPlayerControl, registerSocialFocus, unlockPlayerMovement } = useBugCesantePlayer();
  const linkedinRef = useRef<HTMLAnchorElement>(null);
  const githubRef = useRef<HTMLAnchorElement>(null);
  const figureRef = useRef<HTMLElement>(null);
  const lastVoidFocusRef = useRef<HTMLElement | null>(null);
  const restoreFocusFrameRef = useRef<number | null>(null);
  const windowFocusLostRef = useRef(false);
  const unlockMovementOnMount = useEffectEvent(() => unlockPlayerMovement());
  const activateOnMount = useEffectEvent(() => activatePlayer());
  const registerSocialFocusOnMount = useEffectEvent(() => registerSocialFocus(linkedinRef.current));
  const clearSocialFocusOnUnmount = useEffectEvent(() => registerSocialFocus(null));
  function focusSocialControl(control: SocialControl) {
    const nextRef = control === SOCIAL_CONTROL.LINKEDIN ? linkedinRef : githubRef;
    nextRef.current?.focus({ preventScroll: true });
  }

  function handleSocialKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = event.target;
    if (!(target instanceof HTMLAnchorElement)) return;

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const nextControl = target === linkedinRef.current ? SOCIAL_CONTROL.GITHUB : SOCIAL_CONTROL.LINKEDIN;
      focusSocialControl(nextControl);
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      focusBottomPlayerControl();
    }
  }

  useEffect(() => {
    unlockMovementOnMount();
    activateOnMount();
    registerSocialFocusOnMount();

    const cancelRestoreFrame = () => {
      if (restoreFocusFrameRef.current === null) return;
      window.cancelAnimationFrame(restoreFocusFrameRef.current);
      restoreFocusFrameRef.current = null;
    };

    const clearFocusRestoration = () => {
      windowFocusLostRef.current = false;
      cancelRestoreFrame();
    };

    const hasOpenProtectedSurface = () => document.querySelector("dialog[open], [role='dialog']") !== null;

    const restoreLastVoidFocus = () => {
      const target = lastVoidFocusRef.current;
      if (!isVoidActionableTarget(target)) return;
      target.focus({ preventScroll: true });
    };

    const scheduleFocusRestore = () => {
      if (!windowFocusLostRef.current || document.visibilityState === "hidden") return;
      cancelRestoreFrame();
      restoreFocusFrameRef.current = window.requestAnimationFrame(() => {
        restoreFocusFrameRef.current = null;
        if (!windowFocusLostRef.current || document.visibilityState === "hidden") return;
        const activeElement = document.activeElement;
        if (hasOpenProtectedSurface() || isVoidProtectedTarget(activeElement)) {
          clearFocusRestoration();
          return;
        }
        if (isVoidActionableTarget(activeElement) && activeElement !== lastVoidFocusRef.current) {
          lastVoidFocusRef.current = activeElement;
          clearFocusRestoration();
          return;
        }
        restoreLastVoidFocus();
      });
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (isVoidActionableTarget(target)) {
        const previousTarget = lastVoidFocusRef.current;
        lastVoidFocusRef.current = target;
        if (windowFocusLostRef.current && target === previousTarget) return;
        clearFocusRestoration();
      } else if (isVoidProtectedTarget(target)) {
        clearFocusRestoration();
      }
    };

    const handleWindowBlur = () => {
      const activeElement = document.activeElement;
      if (isVoidActionableTarget(activeElement)) lastVoidFocusRef.current = activeElement;
      windowFocusLostRef.current = true;
      cancelRestoreFrame();
    };

    const handleWindowFocus = () => {
      scheduleFocusRestore();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        windowFocusLostRef.current = true;
        cancelRestoreFrame();
      } else scheduleFocusRestore();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!windowFocusLostRef.current) return;
      const target = event.target instanceof Element ? event.target : null;
      if (event.defaultPrevented || event.button !== 0 || target === null || target.closest(".professional-void-state, .project-showcase, .bug-cesante-player") === null || isVoidProtectedTarget(target) || isVoidActionableTarget(target)) {
        clearFocusRestoration();
        return;
      }
      scheduleFocusRestore();
    };

    const handleClick = (event: MouseEvent) => {
      if (!windowFocusLostRef.current || event.defaultPrevented) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target === null || target.closest(".professional-void-state, .project-showcase, .bug-cesante-player") === null || isVoidProtectedTarget(target) || isVoidActionableTarget(target)) {
        clearFocusRestoration();
        return;
      }
      scheduleFocusRestore();
    };

    window.addEventListener("focusin", handleFocusIn, true);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("click", handleClick, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const focusFrame = window.requestAnimationFrame(() => {
      linkedinRef.current?.focus({ preventScroll: true });
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      cancelRestoreFrame();
      window.removeEventListener("focusin", handleFocusIn, true);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("click", handleClick, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      lastVoidFocusRef.current = null;
      windowFocusLostRef.current = false;
      clearSocialFocusOnUnmount();
    };
  }, []);

  useLayoutEffect(() => {
    const figure = figureRef.current;
    if (figure === null) return;

    const updateCaptionShift = () => {
      const safeGutter = 16;
      const caption = figure.querySelector<HTMLElement>("figcaption");
      if (caption === null) return;
      figure.style.setProperty("--void-caption-shift", "0px");
      const captionRect = caption.getBoundingClientRect();
      const shift = captionRect.left < safeGutter
        ? safeGutter - captionRect.left
        : captionRect.right > window.innerWidth - safeGutter
          ? window.innerWidth - safeGutter - captionRect.right
          : 0;

      figure.style.setProperty("--void-caption-shift", `${shift}px`);
    };

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateCaptionShift);
    resizeObserver?.observe(figure);
    window.addEventListener("resize", updateCaptionShift);
    updateCaptionShift();
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateCaptionShift);
      figure.style.removeProperty("--void-caption-shift");
    };
  }, []);

  return (
    <section aria-labelledby="professional-void-title" className="professional-void-state">
      <div className="professional-void-copy">
        <p className="professional-void-kicker">PERFIL PROFESIONAL · DESARROLLADOR DE SOFTWARE</p>
        <h2 id="professional-void-title">Marco Povea</h2>
        <p className="professional-void-lead">Este es el vacío que realmente quiero llenar: mi primera experiencia profesional. No parto desde cero, vengo del mundo TI, de brindar soporte, de entender y atender a personas con un problema, seguir sus huellas, documentar lo aprendido y resolver junto a otros. Quiero llevar ese tipo de experiencias laborales al lugar donde encontré lo que considero mi vocación... Quiero llegar a construir software con criterio, aprender de un equipo y aportar hasta que algo que antes no existía comience a funcionar.</p>
        <div className="professional-void-education">
          <h3>Formación completada</h3>
          <ul>
            <li><strong>Ingeniería en Informática Multimedia</strong><span>Universidad UNIACC · Santiago, Chile</span></li>
            <li><strong>Técnico de Nivel Superior en Conectividad y Redes</strong><span>CIISA · Santiago, Chile</span></li>
          </ul>
        </div>
        <div className="professional-void-links" onKeyDown={handleSocialKeyDown}>
          <ExternalLink confirmationPurpose="Redirección a mi perfil de LinkedIn" href={PROFESSIONAL_PROFILE_URLS.LINKEDIN} ref={(element) => { linkedinRef.current = element; socialFocusRef.current = element; }}>LinkedIn</ExternalLink>
          <ExternalLink confirmationPurpose="Redirección a mi perfil de GitHub" href={PROFESSIONAL_PROFILE_URLS.GITHUB} ref={githubRef}>GitHub</ExternalLink>
        </div>
      </div>
      <figure className="professional-void-figure" ref={figureRef}>
        <Image alt="" aria-hidden="true" height={YODA_PROFILE_HEIGHT} priority sizes="(max-width: 48rem) min(72vw, 18rem), 44vw" src={withPublicPath("/assets/projects/yoda-profile-connected-v3.webp")} unoptimized width={YODA_PROFILE_WIDTH} />
        <figcaption style={{ paddingInline: 0 }}>
          <p aria-label={PROFESSIONAL_VOID_QUOTE.DESKTOP} className="professional-void-quote">
            <span aria-hidden="true" className="professional-void-quote-desktop"><span className="professional-void-quote-text">{PROFESSIONAL_VOID_QUOTE.DESKTOP}</span></span>
            <span aria-hidden="true" className="professional-void-quote-mobile">
              <span className="professional-void-quote-text">
                {`${PROFESSIONAL_VOID_QUOTE.MOBILE_LINE_ONE}\n${PROFESSIONAL_VOID_QUOTE.MOBILE_LINE_TWO}`}
              </span>
            </span>
          </p>
          <span className="professional-void-quote-author">— Joda</span>
        </figcaption>
      </figure>
    </section>
  );
}
