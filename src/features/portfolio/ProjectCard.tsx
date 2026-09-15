"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
} from "react";
import { ProjectInformation } from "./ProjectDetail";
import { ExternalLink } from "./ExternalNavigation";
import {
  getCarouselFocusTarget,
  getFocusableElements,
} from "../../shared/a11y/modal-focus";
import { FittedBandText, FITTED_BAND_TEXT_ROLE } from "./FittedBandText";
import { ProjectFilterTitleBanner } from "./ProjectFilterTitleBanner";
import {
  getUnlockChallengeForProjects,
  resolveProjectAccess,
} from "./hidden-project-unlock";
import {
  getProjectPresentationBadges,
  getProjectTechnologyBadges,
} from "./project-taxonomy";
import { useProgressivePreviewVideo } from "./preview-policy";
import { withPublicPath } from "@/shared/routing/public-path";
import {
  PROJECT_CARD_FRAME,
  PROJECT_CARD_PRESENTATION,
  type ProjectEntry,
  type ProjectInlineHighlight,
  type ProjectPreview,
} from "./vault-types";

export interface ProjectCardProps {
  isActive?: boolean;
  isFilterDialogOpen?: boolean;
  onProjectModalChange?: (isOpen: boolean) => void;
  project: ProjectEntry;
  unlockedChallengeIds?: readonly string[];
}

const FALLBACK_SEAL_ASSETS = {
  info: "/assets/projects/previews/software-engineering-playbook/info.webp",
  stack: "/assets/projects/previews/software-engineering-playbook/stack.webp",
} as const;

function isRestorableFocusTarget(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement) || !element.isConnected || element.hasAttribute("disabled")) return false;
  if (element.closest("[inert], dialog[open], [role='dialog']") !== null) return false;
  return element.matches("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])")
    || element.matches(".project-carousel[data-carousel-focus-target='true']");
}

function isRestorableKeyboardFocusTarget(element: Element | null): element is HTMLElement {
  return isRestorableFocusTarget(element) && element.closest(".project-card-seal") === null;
}

function getDialogRestoreFocusTarget(
  keyboardReturnFocus: HTMLElement | null,
  invoker: HTMLElement | null,
): HTMLElement | null {
  const fallback = getCarouselFocusTarget();
  return isRestorableKeyboardFocusTarget(keyboardReturnFocus)
    ? keyboardReturnFocus
    : isRestorableFocusTarget(invoker)
      ? invoker
      : fallback;
}

const PROJECT_MODAL = {
  INFO: "info",
  STACK: "stack",
} as const;

type ProjectModal = (typeof PROJECT_MODAL)[keyof typeof PROJECT_MODAL];

function renderInlineHighlights(
  text: string,
  highlights: readonly ProjectInlineHighlight[] = [],
): ReactNode {
  const matches = highlights
    .map((highlight, index) => ({
      end: text.indexOf(highlight.text) + highlight.text.length,
      highlight,
      index,
      start: text.indexOf(highlight.text),
    }))
    .filter(({ highlight, start }) => highlight.text !== "" && start >= 0)
    .sort((left, right) => left.start - right.start || left.index - right.index);

  let cursor = 0;
  const fragments: ReactNode[] = [];

  for (const { end, highlight, index, start } of matches) {
    if (start < cursor) continue;

    const precedingText = text.slice(cursor, start);
    if (precedingText !== "") fragments.push(precedingText);
    fragments.push(
      <span
        className="project-inline-highlight"
        key={`${highlight.text}-${start}-${index}`}
        lang={highlight.lang}
      >
        {highlight.text}
      </span>,
    );
    cursor = end;
  }

  if (cursor < text.length) fragments.push(text.slice(cursor));
  return fragments;
}

function ProjectStackContent({ project }: { project: ProjectEntry }) {
  const presentation = project.stackPresentation;

  if (presentation === undefined) {
    const technologies = getProjectTechnologyBadges(project);

    return (
      <div className="project-one-stack-content">
        <section aria-labelledby={`${project.id}-stack-fallback-title`}>
          <h3 className="project-one-modal-section-title" id={`${project.id}-stack-fallback-title`}>
            Tecnologías y prácticas registradas
          </h3>
          {technologies.length === 0 ? <p>No hay tecnologías registradas.</p> : <ul className="project-one-stack-badges">{technologies.map(({ id, label }) => <li data-technology-id={id} key={id}>{label}</li>)}</ul>}
        </section>
      </div>
    );
  }

  return (
    <div className="project-one-stack-content">
      <section
        aria-labelledby={`${project.id}-stack-topics-title`}
        className="project-one-stack-topics"
      >
        <h3
          className="project-one-modal-section-title"
          id={`${project.id}-stack-topics-title`}
        >
          Temas destacados
        </h3>
        <ul aria-label="Tecnologías del proyecto" className="project-one-stack-badges">
          {getProjectPresentationBadges(project).map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </section>
      <div className="project-one-stack-blocks">
        {presentation.blocks.map((block) => (
          <article className="project-one-stack-block" key={block.heading}>
            <h3 className="project-one-modal-section-title">{block.heading}</h3>
            <p>
              {renderInlineHighlights(block.description, block.descriptionHighlights)}
            </p>
          </article>
        ))}
      </div>
      {presentation.technicalBase === undefined ? null : (
        <section className="project-one-stack-base">
          <h3 className="project-one-modal-section-title">
            {presentation.technicalBase.heading}
          </h3>
          <p>
            {renderInlineHighlights(
              presentation.technicalBase.value,
              presentation.technicalBase.valueHighlights,
            )}
          </p>
        </section>
      )}
      {presentation.evidence === undefined || presentation.evidence === "" ? null : (
        <p className="project-one-stack-evidence">
          {renderInlineHighlights(presentation.evidence, presentation.evidenceHighlights)}
        </p>
      )}
      {presentation.cta === undefined ? null : (
        <ExternalLink
          className="project-one-stack-cta"
          confirmationPurpose={presentation.cta.confirmationPurpose}
          href={presentation.cta.href}
        >
          {presentation.cta.label} <span aria-hidden="true">↗</span>
        </ExternalLink>
      )}
    </div>
  );
}

function ProjectInfoContent({ project }: { project: ProjectEntry }) {
  const loreSections = project.loreSections ?? [];

  if (loreSections.length === 0) return <ProjectInformation project={project} />;

  return (
    <div className="project-one-modal-sections">
      {loreSections.map((section) => (
        <section aria-labelledby={`${project.id}-info-${section.heading}`} key={section.heading}>
          <h3
            className="project-one-modal-section-title"
            id={`${project.id}-info-${section.heading}`}
          >
            {section.heading}
          </h3>
          {section.paragraphs.map((paragraph, index) => (
            <p key={`${section.heading}-${index}`}>
              {renderInlineHighlights(paragraph, section.paragraphHighlights?.[index])}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}

type PreviewStyle = CSSProperties & {
  objectPosition?: string;
};

function getPreviewStyle(preview: ProjectPreview): PreviewStyle | undefined {
  const focal = preview.focal;
  if (focal === undefined) return undefined;

  return {
    objectPosition: `${focal.x * 100}% ${focal.y * 100}%`,
  };
}

function getResolvedAccessibleHint(project: ProjectEntry, isLocked: boolean): string {
  if (project.challengeId === undefined) return project.accessibleHint;

  const firstSentenceEnd = project.accessibleHint.indexOf(".");
  const description = firstSentenceEnd < 0
    ? project.accessibleHint
    : project.accessibleHint.slice(firstSentenceEnd + 1).trim();
  const accessState = isLocked ? "oculto y bloqueado" : "oculto y desbloqueado";

  return `Proyecto ${accessState}. ${description}`;
}

function renderUnlockCopy(text: string): ReactNode {
  const fragments = text.split("FILTROS");

  return fragments.flatMap((fragment, index) => index === fragments.length - 1
    ? [fragment]
    : [fragment, <span className="project-unlock-filter-glow" key={`filtros-${index}`}>FILTROS</span>]);
}

export function ProjectCard({
  isActive = false,
  isFilterDialogOpen = false,
  onProjectModalChange,
  project,
  unlockedChallengeIds = [],
}: ProjectCardProps) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [projectModal, setProjectModal] = useState<ProjectModal | null>(null);
  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false);
  const infoControlRef = useRef<HTMLButtonElement>(null);
  const infoPanelRef = useRef<HTMLElement>(null);
  const projectModalRef = useRef<HTMLDialogElement>(null);
  const stackSealRef = useRef<HTMLButtonElement>(null);
  const infoSealRef = useRef<HTMLButtonElement>(null);
  const unlockDialogRef = useRef<HTMLDialogElement>(null);
  const unlockDialogInvokerRef = useRef<RefObject<HTMLButtonElement | null> | null>(null);
  const unlockDialogWasOpenRef = useRef(false);
  const projectModalInvokerRef = useRef<RefObject<HTMLButtonElement | null> | null>(null);
  const keyboardShortcutReturnFocusRef = useRef<HTMLElement | null>(null);
  const projectModalWasOpenRef = useRef(false);
  const projectAccess = resolveProjectAccess(project, unlockedChallengeIds);
  const isLocked = projectAccess.isLocked;
  const isPreviewOnly =
    project.cardVisual?.presentation ===
    PROJECT_CARD_PRESENTATION.MEDIA_TITLE_BANDS;
  const modalPresentation = project.modalPresentation;
  const hasRichProjectModal =
    modalPresentation !== undefined &&
    project.loreSections !== undefined &&
    project.stackPresentation !== undefined;
  const hasChallengeSeal = project.challengeId !== undefined;
  const hasProjectModal = !isLocked && (hasRichProjectModal || hasChallengeSeal);
  const hasVisibleSeals = hasProjectModal || hasChallengeSeal;
  const unlockChallenge = getUnlockChallengeForProjects([project]);
  const canOpenUnlockDialog = isLocked && unlockChallenge !== undefined;
  const titleId = `${project.id}-title`;
  const infoPanelId = `${project.id}-info-panel`;
  const previewStyle = getPreviewStyle(projectAccess.preview);
  const previewVideo = projectAccess.preview.video;
  const { isVideoReady, markVideoError, markVideoReady, shouldMountVideo } =
    useProgressivePreviewVideo(
      isActive && !isLocked,
      previewVideo !== undefined,
    );

  function confirmVideoPlayback(event: SyntheticEvent<HTMLVideoElement>) {
    const playResult = event.currentTarget.play();
    if (playResult === undefined) {
      markVideoReady();
      return;
    }

    void playResult.then(markVideoReady).catch(() => undefined);
  }

  function openProjectModal(
    modal: ProjectModal,
    invokerRef: RefObject<HTMLButtonElement | null>,
    fromKeyboardShortcut = false,
  ) {
    if (fromKeyboardShortcut && projectModal === null) {
      const activeElement = document.activeElement;
      keyboardShortcutReturnFocusRef.current = isRestorableKeyboardFocusTarget(activeElement)
        ? activeElement
        : getCarouselFocusTarget();
    } else if (!fromKeyboardShortcut) {
      keyboardShortcutReturnFocusRef.current = null;
    }
    projectModalInvokerRef.current = invokerRef;
    onProjectModalChange?.(true);
    setProjectModal(modal);
  }

  const openProjectModalEvent = useEffectEvent(openProjectModal);

  function openUnlockDialog(
    invokerRef: RefObject<HTMLButtonElement | null>,
    fromKeyboardShortcut = false,
  ) {
    if (!isLocked || unlockChallenge === undefined) return;
    if (fromKeyboardShortcut) {
      const activeElement = document.activeElement;
      keyboardShortcutReturnFocusRef.current = isRestorableKeyboardFocusTarget(activeElement)
        ? activeElement
        : getCarouselFocusTarget();
    } else {
      keyboardShortcutReturnFocusRef.current = null;
    }
    unlockDialogInvokerRef.current = invokerRef;
    onProjectModalChange?.(true);
    setIsUnlockDialogOpen(true);
  }

  const openUnlockDialogEvent = useEffectEvent(openUnlockDialog);

  useLayoutEffect(() => {
    const target = isInfoOpen ? infoPanelRef.current : infoControlRef.current;
    target?.focus({ preventScroll: true });
  }, [isInfoOpen]);

  useEffect(() => {
    const dialog = projectModalRef.current;
    if (!hasProjectModal || projectModal === null || dialog === null) {
      if (dialog?.open) dialog.close();
      return;
    }

    if (!dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    dialog
      .querySelector<HTMLElement>("[data-modal-initial-focus]")
      ?.focus({ preventScroll: true });
  }, [hasProjectModal, projectModal]);

  useEffect(() => {
    const dialog = unlockDialogRef.current;
    if (!isUnlockDialogOpen || dialog === null) {
      if (dialog?.open) dialog.close();
      return;
    }

    if (!dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    dialog.querySelector<HTMLElement>("[data-modal-initial-focus]")?.focus({ preventScroll: true });
  }, [isUnlockDialogOpen]);

  useEffect(() => {
    if (!isActive || isFilterDialogOpen || (!hasProjectModal && !canOpenUnlockDialog)) return;

    const onWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.key !== "s" && event.key !== "S" && event.key !== "i" && event.key !== "I"
      ) return;

      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select, [contenteditable='true']") !== null)) return;
    const modal = event.key.toLowerCase() === "s" ? PROJECT_MODAL.STACK : PROJECT_MODAL.INFO;
      if (projectModal !== null) {
        event.preventDefault();
        if (projectModal === modal) closeProjectModal();
        else openProjectModalEvent(modal, modal === PROJECT_MODAL.STACK ? stackSealRef : infoSealRef, true);
        return;
      }
      if (isUnlockDialogOpen) {
        event.preventDefault();
        unlockDialogInvokerRef.current = modal === PROJECT_MODAL.STACK ? stackSealRef : infoSealRef;
        closeUnlockDialog();
        return;
      }
      if (document.querySelector("dialog[open], [role='dialog']") !== null) return;
    event.preventDefault();
    if (canOpenUnlockDialog) {
      openUnlockDialogEvent(modal === PROJECT_MODAL.STACK ? stackSealRef : infoSealRef, true);
      return;
    }
    openProjectModalEvent(
        modal,
        modal === PROJECT_MODAL.STACK ? stackSealRef : infoSealRef,
        true,
      );
    };

    window.addEventListener("keydown", onWindowKeyDown);
    return () => window.removeEventListener("keydown", onWindowKeyDown);
  }, [canOpenUnlockDialog, hasProjectModal, isActive, isFilterDialogOpen, isUnlockDialogOpen, projectModal]);

  useLayoutEffect(() => {
    const wasOpen = projectModalWasOpenRef.current;
    projectModalWasOpenRef.current = projectModal !== null;
    if (!wasOpen || projectModal !== null) return;

    const keyboardReturnFocus = keyboardShortcutReturnFocusRef.current;
    keyboardShortcutReturnFocusRef.current = null;
    const invoker = projectModalInvokerRef.current?.current ?? null;
    const target = getDialogRestoreFocusTarget(keyboardReturnFocus, invoker);
    target?.focus({ preventScroll: true });
  }, [projectModal]);

  useLayoutEffect(() => {
    const wasOpen = unlockDialogWasOpenRef.current;
    unlockDialogWasOpenRef.current = isUnlockDialogOpen;
    if (!wasOpen || isUnlockDialogOpen) return;
    const keyboardReturnFocus = keyboardShortcutReturnFocusRef.current;
    keyboardShortcutReturnFocusRef.current = null;
    const invoker = unlockDialogInvokerRef.current?.current ?? null;
    onProjectModalChange?.(false);
    window.requestAnimationFrame(() => {
      const target = getDialogRestoreFocusTarget(keyboardReturnFocus, invoker);
      target?.focus({ preventScroll: true });
    });
  }, [isUnlockDialogOpen, onProjectModalChange]);

  useEffect(() => {
    if (!isInfoOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsInfoOpen(false);
        return;
      }

      if (event.key !== "Tab" || infoPanelRef.current === null) return;
      const focusableElements = getFocusableElements(infoPanelRef.current);
      if (focusableElements.length === 0) {
        event.preventDefault();
        infoPanelRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);
      if (document.activeElement === infoPanelRef.current) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement)?.focus();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isInfoOpen]);

  function closeProjectModal() {
    const dialog = projectModalRef.current;
    if (dialog?.open) dialog.close();
  }

  function closeUnlockDialog() {
    const dialog = unlockDialogRef.current;
    if (dialog?.open) dialog.close();
  }

  const previewImage = projectAccess.preview.image;
  const accessibleHint = getResolvedAccessibleHint(project, isLocked);

  return (
    <article
      aria-describedby={`${project.id}-hint`}
      aria-labelledby={isInfoOpen ? `${project.id}-info-title` : titleId}
      className="project-card"
      data-card-frame={isLocked ? PROJECT_CARD_FRAME.ORNATE : project.cardVisual?.frame}
      data-card-has-project-modals={hasVisibleSeals ? "true" : undefined}
      data-card-presentation={isLocked ? PROJECT_CARD_PRESENTATION.MEDIA_TITLE_BANDS : project.cardVisual?.presentation}
      data-info-open={isInfoOpen}
      data-locked={isLocked}
      data-project-id={project.id}
      tabIndex={-1}
    >
      {isLocked ? (
        <div
          aria-hidden="true"
          className="project-card-joker"
          data-preview-fit={projectAccess.preview.fit}
          data-preview-source="locked"
        >
          <Image
            alt=""
            fill
            sizes="(max-width: 48rem) 88vw, 28rem"
            src={withPublicPath(previewImage)}
          />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="project-card-preview"
          data-preview-fit={projectAccess.preview.fit}
          data-preview-source={projectAccess.preview.source}
        >
          <Image
            alt=""
            fill
            loading={isActive ? "eager" : "lazy"}
            priority={isActive}
            sizes="(max-width: 48rem) 88vw, 28rem"
             src={withPublicPath(previewImage)}
            style={previewStyle}
          />
          {isActive && shouldMountVideo && previewVideo !== undefined ? (
            <video
              autoPlay
              data-preview-video-ready={isVideoReady}
              loop
              muted
              playsInline
                poster={withPublicPath(previewImage)}
                preload="metadata"
                onCanPlay={confirmVideoPlayback}
                onError={markVideoError}
                style={previewStyle}
            >
              {previewVideo.mobile === undefined ? null : (
                <source
                  media="(max-width: 48rem)"
                   src={withPublicPath(previewVideo.mobile.src)}
                  type={previewVideo.mobile.type}
                />
              )}
               <source src={withPublicPath(previewVideo.src)} type={previewVideo.type} />
            </video>
          ) : null}
        </div>
      )}
      <div aria-hidden="true" className="project-card-veil" />
      <div
        className="project-card-face"
        data-panel-open={isInfoOpen}
        inert={hasProjectModal && projectModal !== null ? true : undefined}
      >
        {isPreviewOnly || isLocked ? (
          <>
            <div
              className="project-card-band project-card-band-top"
              data-card-band="top"
            >
              <FittedBandText
                className="project-card-title fitted-band-text"
                enabled={isActive === true}
                id={titleId}
                role={FITTED_BAND_TEXT_ROLE.TITLE}
              >
                {project.front.title}
              </FittedBandText>
            </div>
            <div
              className="project-card-band project-card-band-bottom"
              data-card-band="bottom"
            >
              <FittedBandText
                as="p"
                className="project-card-subtitle fitted-band-text"
                enabled={isActive === true}
                role={FITTED_BAND_TEXT_ROLE.SUBTITLE}
              >
                {project.front.eyebrow}
              </FittedBandText>
            </div>
          </>
        ) : (
          <div className="project-card-front-content">
            <p className="eyebrow">{project.front.eyebrow}</p>
            <h3 id={titleId}>{project.front.title}</h3>
          </div>
        )}
        {isPreviewOnly ? null : (
          <button
            aria-controls={infoPanelId}
            aria-expanded={isInfoOpen}
            aria-haspopup="dialog"
            aria-label={`Información sobre ${project.name}`}
            className="project-card-info"
            onClick={() => setIsInfoOpen(true)}
            ref={infoControlRef}
            type="button"
          >
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 10.5v5.25M12 7.5h.01" />
            </svg>
            <span className="visually-hidden">
              Información sobre {project.name}
            </span>
          </button>
        )}
        {hasVisibleSeals ? (
          <div
            aria-label={`Sellos de ${project.name}`}
            className="project-card-seals"
            data-project-modal-seals="true"
          >
            <button
              aria-controls={isLocked ? `${project.id}-unlock-dialog` : `${project.id}-project-modal`}
              aria-haspopup="dialog"
              aria-keyshortcuts="S"
              aria-label={`Ver stack de ${project.name}`}
              className="project-card-seal project-card-seal-stack"
              data-paint-safe="true"
              onClick={() => isLocked ? openUnlockDialog(stackSealRef) : openProjectModal(PROJECT_MODAL.STACK, stackSealRef)}
              ref={stackSealRef}
              type="button"
            >
              <Image
                alt=""
                aria-hidden="true"
                className="project-card-seal-emblem"
                height={76}
                 src={withPublicPath(modalPresentation?.stackAsset ?? FALLBACK_SEAL_ASSETS.stack)}
                unoptimized
                width={76}
              />
            </button>
            <button
              aria-controls={isLocked ? `${project.id}-unlock-dialog` : `${project.id}-project-modal`}
              aria-haspopup="dialog"
              aria-keyshortcuts="I"
              aria-label={`Ver historia de ${project.name}`}
              className="project-card-seal project-card-seal-info"
              data-paint-safe="true"
              onClick={() => isLocked ? openUnlockDialog(infoSealRef) : openProjectModal(PROJECT_MODAL.INFO, infoSealRef)}
              ref={infoSealRef}
              type="button"
            >
              <Image
                alt=""
                aria-hidden="true"
                className="project-card-seal-emblem"
                height={76}
                 src={withPublicPath(modalPresentation?.infoAsset ?? FALLBACK_SEAL_ASSETS.info)}
                unoptimized
                width={76}
              />
            </button>
          </div>
        ) : null}
        {isInfoOpen ? (
          <section
            aria-labelledby={`${project.id}-info-title`}
            aria-modal="true"
            className="project-card-info-panel"
            id={infoPanelId}
            ref={infoPanelRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="project-card-info-heading">
              <p className="eyebrow">{project.front.eyebrow}</p>
              <h3 id={`${project.id}-info-title`}>{project.name}</h3>
            </div>
            <button
              aria-label={`Cerrar información de ${project.name}`}
              className="project-card-info-close"
              onClick={() => setIsInfoOpen(false)}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
            <ProjectInformation project={project} />
          </section>
        ) : null}
      </div>
      <div aria-hidden="true" className="project-card-frame" />
      {hasChallengeSeal && unlockChallenge !== undefined && isUnlockDialogOpen && typeof document !== "undefined"
        ? createPortal(
        <dialog
          aria-describedby={`${project.id}-unlock-dialog-description`}
          aria-labelledby={`${project.id}-unlock-dialog-title`}
          aria-modal="true"
          className="project-card-modal project-unlock-dialog"
          id={`${project.id}-unlock-dialog`}
          onCancel={(event) => {
            event.preventDefault();
            closeUnlockDialog();
          }}
          onClose={() => setIsUnlockDialogOpen(false)}
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            const focusableElements = getFocusableElements(event.currentTarget);
            const firstElement = focusableElements[0];
            const lastElement = focusableElements.at(-1);
            if (firstElement === undefined || lastElement === undefined) return;
            if (event.shiftKey && document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }}
          ref={unlockDialogRef}
          >
          <div className="project-card-modal-shell">
            <header className="project-card-modal-header">
              <p className="project-card-modal-kicker">{renderUnlockCopy(unlockChallenge.kicker)}</p>
              <h2 id={`${project.id}-unlock-dialog-title`}>{unlockChallenge.title}</h2>
              <button
                aria-label="Cerrar acertijo"
                className="project-card-modal-close"
                data-modal-initial-focus="true"
                onClick={closeUnlockDialog}
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>
            <ProjectFilterTitleBanner
              alt={unlockChallenge.bannerAlt}
              className="project-filter-title-banner project-unlock-riddle-banner"
            />
            <div className="project-card-modal-content">
              <div className="project-card-modal-scroll" id={`${project.id}-unlock-dialog-description`} lang="es">
                <div className="project-unlock-riddle-content">
                  {unlockChallenge.body.map((line) => <p className="project-unlock-riddle-line" key={line}>{renderUnlockCopy(line)}</p>)}
                </div>
              </div>
            </div>
          </div>
        </dialog>,
        document.body,
      )
        : null}
      {hasProjectModal && projectModal !== null && typeof document !== "undefined"
        ? createPortal(
        <dialog
          aria-describedby={
            projectModal === PROJECT_MODAL.INFO
              ? modalPresentation?.infoQuote === undefined
                ? undefined
                : `${project.id}-project-modal-info-quote`
              : `${project.id}-project-modal-description`
          }
          aria-labelledby={`${project.id}-project-modal-title`}
          aria-modal="true"
          className="project-card-modal"
          id={`${project.id}-project-modal`}
          onCancel={(event) => {
            event.preventDefault();
            closeProjectModal();
          }}
          onClose={() => {
            onProjectModalChange?.(false);
            setProjectModal(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeProjectModal();
              return;
            }
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              return;
            }

            if (projectModal === PROJECT_MODAL.STACK && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
              const closeButton = event.currentTarget.querySelector<HTMLButtonElement>(".project-card-modal-close");
              const cta = event.currentTarget.querySelector<HTMLAnchorElement>(".project-one-stack-cta");
              if (closeButton === null || cta === null) return;
              event.preventDefault();
              const destination = document.activeElement === closeButton ? cta : closeButton;
              destination.focus({ preventScroll: true });
              if (destination === cta) cta.scrollIntoView({ block: "nearest", inline: "nearest" });
              return;
            }

            if (event.key !== "Tab") return;

            const focusableElements = getFocusableElements(event.currentTarget);
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements.at(-1);
            if (event.shiftKey && document.activeElement === firstElement) {
              event.preventDefault();
              lastElement?.focus();
            } else if (
              !event.shiftKey &&
              document.activeElement === lastElement
            ) {
              event.preventDefault();
              firstElement?.focus();
            }
          }}
          ref={projectModalRef}
        >
          <div className="project-card-modal-shell">
            <header className="project-card-modal-header">
              {projectModal === PROJECT_MODAL.STACK ? (
                <p className="project-card-modal-kicker">
                  {project.stackPresentation?.kicker ?? "TECNOLOGÍAS Y PRÁCTICAS"}
                </p>
              ) : (
                <p
                  className="project-card-modal-kicker project-card-modal-description-info"
                >
                  {modalPresentation?.infoKicker ?? `“${project.front.eyebrow}”`}
                </p>
              )}
              <h2 id={`${project.id}-project-modal-title`}>
                {projectModal === PROJECT_MODAL.STACK
                  ? project.stackPresentation?.title ?? "TECNOLOGÍAS Y PRÁCTICAS"
                  : modalPresentation?.infoTitle ?? project.name}
              </h2>
              {projectModal === PROJECT_MODAL.INFO && modalPresentation?.infoQuote !== undefined ? (
                <p
                  className="project-card-modal-info-quote"
                  id={`${project.id}-project-modal-info-quote`}
                >
                  <q lang="es">{modalPresentation.infoQuote}</q>
                </p>
              ) : null}
              {projectModal === PROJECT_MODAL.STACK ? (
                <p
                  className="project-card-modal-description"
                  id={`${project.id}-project-modal-description`}
                >
                  {project.stackPresentation === undefined
                    ? null
                    : renderInlineHighlights(
                        project.stackPresentation.introduction,
                        project.stackPresentation.introductionHighlights,
                      )}
                </p>
              ) : null}
              <button
                aria-label={`Cerrar ${projectModal === PROJECT_MODAL.STACK ? "stack" : "información"} de ${project.name}`}
                className="project-card-modal-close"
                data-modal-initial-focus="true"
                onClick={closeProjectModal}
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>
            <div className="project-card-modal-content">
              <div className="project-card-modal-scroll">
              {projectModal === PROJECT_MODAL.STACK ? (
                <ProjectStackContent project={project} />
              ) : (
                <ProjectInfoContent project={project} />
              )}
              </div>
            </div>
          </div>
        </dialog>
        , document.body)
        : null}
      <p className="visually-hidden" id={`${project.id}-hint`}>
        {accessibleHint}
      </p>
    </article>
  );
}
