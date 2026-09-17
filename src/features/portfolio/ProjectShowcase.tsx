"use client";

import { createPortal } from "react-dom";
import Image from "next/image";
import { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { ProjectCarousel } from "./ProjectCarousel";
import { ProjectDetail } from "./ProjectDetail";
import { ProjectFilterControls } from "./ProjectFilterControls";
import { ExternalNavigationProvider } from "./ExternalNavigation";
import { PlayerMovementLegend, useBugCesantePlayer } from "./BugCesantePlayer";
import {
  PROJECT_UNLOCK_CONSOLE_CLUE,
  PROJECT_UNLOCK_SUCCESS,
  PROJECT_UNLOCK_CHALLENGES,
} from "./hidden-project-unlock";
import {
  getCarouselFocusTarget,
  getFocusableElements,
} from "../../shared/a11y/modal-focus";
import { PROFESSIONAL_VOID_IMAGE, ProfessionalVoidState } from "./ProfessionalVoidState";
import { filterProjects, getActiveProjectId, getFilterLabel, validateFilterIds } from "./project-taxonomy";
import { SHOWCASE_ACTION, showcaseReducer } from "./showcase-reducer";
import { SPECIAL_FILTER_ID, type FilterId, type ProjectEntry } from "./vault-types";
import { VAULT_SEALS } from "./vault-seals";
import {
  readSessionProgression,
  unlockHiddenChallenge,
  writeSessionProgression,
  type SessionProgression,
} from "./session-progression";
import { prepareImageReadiness, type ImageReadinessResult } from "../../shared/media/image-readiness";
import { withPublicPath } from "@/shared/routing/public-path";

export interface ProjectShowcaseProps {
  isProjectModalOpen?: boolean;
  onProjectModalChange?: (isOpen: boolean) => void;
  onProgressionChange?: (progression: SessionProgression) => void;
  progression?: SessionProgression;
  projects: readonly ProjectEntry[];
}

const UNLOCK_DIALOG_PHASE = {
  CLOSING: "closing",
  FILTER_CLOSED: "filter-closed",
  CLOSING_FILTER_FOR_UNLOCK: "closing-filter-for-unlock",
  DEGRADED_READY: "degraded-ready",
  IDLE: "idle",
  OPEN: "open",
  PREPARING: "preparing",
  READY: "ready",
} as const;

type UnlockDialogPhase = (typeof UNLOCK_DIALOG_PHASE)[keyof typeof UNLOCK_DIALOG_PHASE];

let hasLoggedProjectShowcaseStart = false;
const UNLOCK_SUCCESS_IMAGE_SRC = "/assets/projects/acertijos.webp";

function getSessionProgressionForShowcase() {
  return readSessionProgression({
    challengeIds: PROJECT_UNLOCK_CHALLENGES.map((challenge) => challenge.id),
    sealIds: VAULT_SEALS.map((seal) => seal.id),
  });
}

function getUrlState(projects: readonly ProjectEntry[]) {
  if (typeof window === "undefined") return { activeProjectId: projects[0]?.id ?? null, detailProjectId: null, selectedIds: [] as FilterId[] };
  const query = new URLSearchParams(window.location.search);
  const selectedIds = validateFilterIds(projects, query.get("tech")?.split(",") ?? []);
  const filteredProjects = filterProjects(projects, selectedIds);
  const projectId = query.get("project");
  const detailProjectId = projectId !== null && filteredProjects.some((project) => project.id === projectId) ? projectId : null;
  return { activeProjectId: detailProjectId ?? filteredProjects[0]?.id ?? null, detailProjectId, selectedIds };
}

function getShowcaseUrl(selectedIds: readonly FilterId[], projectId: string | null) {
  const query = new URLSearchParams();
  query.set("view", "showcase");
  if (selectedIds.length > 0) query.set("tech", selectedIds.join(","));
  if (projectId !== null) query.set("project", projectId);
  return `${withPublicPath(window.location.pathname)}?${query.toString()}${window.location.hash}`;
}

interface ShowcaseMotionState {
  isInteractive: boolean;
  isRevealing: boolean;
}

function getInitialShowcaseMotionState(): ShowcaseMotionState {
  if (typeof window === "undefined") return { isInteractive: false, isRevealing: true };

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  const transitionsSupported = typeof window.CSS?.supports === "function";
  const settleImmediately = reducedMotion || !transitionsSupported;
  return { isInteractive: settleImmediately, isRevealing: !settleImmediately };
}

export function ProjectShowcase({
  isProjectModalOpen: controlledProjectModalOpen,
  onProjectModalChange,
  onProgressionChange,
  progression,
  projects,
}: ProjectShowcaseProps) {
  const eligibleProjects = filterProjects(projects, []);
  const [initialState] = useState(() => getUrlState(eligibleProjects));
  const headingRef = useRef<HTMLHeadingElement>(null);
  const carouselFocusTargetRef = useRef<HTMLElement>(null);
  const voidSocialFocusRef = useRef<HTMLAnchorElement>(null);
  const hasHydratedInitialUrlRef = useRef(false);
  const restoreFocusRef = useRef(false);
  const restoreContentFocusRef = useRef(false);
  const wasVoidActiveRef = useRef(false);
  const [localProjectModalOpen, setLocalProjectModalOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const progressionRef = useRef(progression ?? getSessionProgressionForShowcase());
  const [unlockedChallengeIds, setUnlockedChallengeIds] = useState<string[]>(() => progression?.hiddenChallengeIds ?? getSessionProgressionForShowcase().hiddenChallengeIds);
  const [showcaseMotion, setShowcaseMotion] = useState(getInitialShowcaseMotionState);
  const [state, dispatch] = useReducer(showcaseReducer, initialState);
  const selectedIds = validateFilterIds(eligibleProjects, state.selectedIds);
  const filteredProjects = filterProjects(eligibleProjects, selectedIds);
  const activeProjectId = getActiveProjectId(filteredProjects, state.activeProjectId);
  const detailProject = filteredProjects.find((project) => project.id === state.detailProjectId) ?? null;
  const isVoidActive = selectedIds.includes(SPECIAL_FILTER_ID.VOID);
  const isProjectModalOpen = controlledProjectModalOpen ?? localProjectModalOpen;
  const handleProjectModalChange = onProjectModalChange ?? setLocalProjectModalOpen;
  const { activatePlayer, movementUnlocked, unlockPlayerMovement } = useBugCesantePlayer();
  const { isInteractive: isShowcaseInteractive, isRevealing: isShowcaseRevealing } = showcaseMotion;
  const unlockedChallengeIdsRef = useRef(unlockedChallengeIds);
  const [unlockDialogPhase, setUnlockDialogPhase] = useState<UnlockDialogPhase>(UNLOCK_DIALOG_PHASE.IDLE);
  const unlockDialogPhaseRef = useRef(unlockDialogPhase);
  const unlockPreparationGenerationRef = useRef(0);
  const unlockPreparationMountedRef = useRef(true);
  const unlockSuccessDialogRef = useRef<HTMLDialogElement>(null);
  const unlockSuccessDismissRef = useRef<HTMLButtonElement>(null);
  const unlockSuccessCloseRef = useRef<HTMLButtonElement>(null);
  const unlockSuccessFocusGuardRef = useRef(false);
  const unlockSuccessWasOpenRef = useRef(false);
  const isUnlockSuccessOpen = unlockDialogPhase === UNLOCK_DIALOG_PHASE.OPEN || unlockDialogPhase === UNLOCK_DIALOG_PHASE.DEGRADED_READY;

  function restoreCarouselFocus() {
    (carouselFocusTargetRef.current ?? getCarouselFocusTarget())?.focus({ preventScroll: true });
  }

  useLayoutEffect(() => {
    if (isUnlockSuccessOpen) {
      unlockSuccessWasOpenRef.current = true;
      return;
    }

    if (!unlockSuccessWasOpenRef.current) return;
    unlockSuccessWasOpenRef.current = false;
    restoreCarouselFocus();
  }, [isUnlockSuccessOpen]);

  useEffect(() => {
    if (typeof window === "undefined" || hasLoggedProjectShowcaseStart) return;

    hasLoggedProjectShowcaseStart = true;
    console.info(PROJECT_UNLOCK_CONSOLE_CLUE);
  }, []);

  useEffect(() => {
    unlockPreparationMountedRef.current = true;
    if (progression !== undefined) {
      progressionRef.current = progression;
      queueMicrotask(() => {
        if (unlockPreparationMountedRef.current) setUnlockedChallengeIds(progression.hiddenChallengeIds);
      });
    }
  }, [progression]);

  useEffect(() => {
    return () => {
      unlockPreparationMountedRef.current = false;
      unlockPreparationGenerationRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!isFilterDialogOpen) return;
    void prepareImageReadiness(withPublicPath(UNLOCK_SUCCESS_IMAGE_SRC));
  }, [isFilterDialogOpen]);

  useEffect(() => {
    if (!isVoidActive) return;
    const source = window.matchMedia("(max-width: 48rem), (pointer: coarse)").matches
      ? PROFESSIONAL_VOID_IMAGE.MOBILE
      : PROFESSIONAL_VOID_IMAGE.DESKTOP;
    void prepareImageReadiness(withPublicPath(source));
  }, [isVoidActive]);

  useEffect(() => {
    if (!isShowcaseRevealing) return;

    let interactiveTimer: number | undefined;
    const frame = window.requestAnimationFrame(() => {
      setShowcaseMotion((previous) => ({ ...previous, isRevealing: false }));
      // Keep the accessibility gate bounded if a browser skips transitionend.
      interactiveTimer = window.setTimeout(() => setShowcaseMotion((previous) => ({ ...previous, isInteractive: true })), 500);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (interactiveTimer !== undefined) window.clearTimeout(interactiveTimer);
    };
  }, [isShowcaseRevealing]);

  useEffect(() => {
    if (hasHydratedInitialUrlRef.current) return;
    hasHydratedInitialUrlRef.current = true;

    if (initialState.detailProjectId !== null && !window.history.state?.showcaseDetail) {
      window.history.replaceState({ showcaseDetailBase: true }, "", getShowcaseUrl(selectedIds, null));
      window.history.pushState({ showcaseDetail: true }, "", getShowcaseUrl(selectedIds, initialState.detailProjectId));
    } else if (new URLSearchParams(window.location.search).has("project") && initialState.detailProjectId === null) {
      window.history.replaceState(window.history.state, "", getShowcaseUrl(selectedIds, null));
    }
  }, [initialState.detailProjectId, selectedIds]);

  useEffect(() => {
    const onPopState = () => {
      const next = getUrlState(eligibleProjects);
      const nextProjects = filterProjects(eligibleProjects, next.selectedIds);
      dispatch({ type: SHOWCASE_ACTION.FILTERS_REPLACED, filterIds: next.selectedIds });
      if (next.detailProjectId === null) {
        restoreFocusRef.current = true;
        dispatch({ type: SHOWCASE_ACTION.DETAIL_CLOSED });
        dispatch({ type: SHOWCASE_ACTION.PROJECT_HOME, projectIds: nextProjects.map((project) => project.id) });
      }
      else dispatch({ type: SHOWCASE_ACTION.DETAIL_OPENED, projectId: next.detailProjectId, projectIds: nextProjects.map((project) => project.id) });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [eligibleProjects, filteredProjects]);

  useLayoutEffect(() => {
    if (detailProject === null && restoreFocusRef.current) {
      restoreFocusRef.current = false;
      headingRef.current?.focus();
    }
  }, [detailProject]);

  useLayoutEffect(() => {
    if (!isVoidActive && wasVoidActiveRef.current) carouselFocusTargetRef.current?.focus({ preventScroll: true });
    wasVoidActiveRef.current = isVoidActive;
  }, [isVoidActive]);

  useLayoutEffect(() => {
    if (!restoreContentFocusRef.current) return;
    restoreContentFocusRef.current = false;
    (voidSocialFocusRef.current ?? carouselFocusTargetRef.current)?.focus({ preventScroll: true });
  }, [isFilterDialogOpen, isVoidActive]);

  useEffect(() => {
    const dialog = unlockSuccessDialogRef.current;
    if (!isUnlockSuccessOpen || dialog === null) {
      if (dialog?.open) dialog.close();
      return;
    }

    unlockSuccessFocusGuardRef.current = true;
    if (!dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    const focusFrame = window.requestAnimationFrame(() => {
      unlockSuccessDismissRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(focusFrame);
  }, [isUnlockSuccessOpen]);

  useEffect(() => {
    if (!isUnlockSuccessOpen) return;

    const onWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!unlockSuccessFocusGuardRef.current) return;

      const dialog = unlockSuccessDialogRef.current;
      const target = event.target;
      const isInsideDialog = dialog !== null && target instanceof Node && dialog.contains(target);

      if (isInsideDialog) {
        unlockSuccessFocusGuardRef.current = false;
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        return;
      }

      unlockSuccessFocusGuardRef.current = false;
    };

    window.addEventListener("keydown", onWindowKeyDown);
    return () => window.removeEventListener("keydown", onWindowKeyDown);
  }, [isUnlockSuccessOpen]);

  function transitionUnlockDialogPhase(nextPhase: UnlockDialogPhase) {
    unlockDialogPhaseRef.current = nextPhase;
    setUnlockDialogPhase(nextPhase);
  }

  function acknowledgeFilterDialogClosed() {
    if (unlockDialogPhaseRef.current !== UNLOCK_DIALOG_PHASE.CLOSING_FILTER_FOR_UNLOCK) return;

    transitionUnlockDialogPhase(UNLOCK_DIALOG_PHASE.FILTER_CLOSED);
    setIsFilterDialogOpen(false);
  }

  useEffect(() => {
    if (unlockDialogPhase !== UNLOCK_DIALOG_PHASE.FILTER_CLOSED || isFilterDialogOpen) return;

    const generation = ++unlockPreparationGenerationRef.current;
    queueMicrotask(() => {
      if (unlockPreparationMountedRef.current && generation === unlockPreparationGenerationRef.current) {
        transitionUnlockDialogPhase(UNLOCK_DIALOG_PHASE.PREPARING);
      }
    });
    void prepareImageReadiness(withPublicPath(UNLOCK_SUCCESS_IMAGE_SRC)).then((result: ImageReadinessResult) => {
      if (!unlockPreparationMountedRef.current || generation !== unlockPreparationGenerationRef.current) return;
      transitionUnlockDialogPhase(
        result.phase === "ready" ? UNLOCK_DIALOG_PHASE.READY : UNLOCK_DIALOG_PHASE.DEGRADED_READY,
      );
    });
  }, [isFilterDialogOpen, unlockDialogPhase]);

  useEffect(() => {
    if (
      unlockDialogPhase !== UNLOCK_DIALOG_PHASE.READY &&
      unlockDialogPhase !== UNLOCK_DIALOG_PHASE.DEGRADED_READY
    ) return;

    queueMicrotask(() => {
      if (!unlockPreparationMountedRef.current) return;
      if (
        unlockDialogPhaseRef.current !== UNLOCK_DIALOG_PHASE.READY &&
        unlockDialogPhaseRef.current !== UNLOCK_DIALOG_PHASE.DEGRADED_READY
      ) return;
      if (unlockDialogPhaseRef.current === UNLOCK_DIALOG_PHASE.READY) {
        transitionUnlockDialogPhase(UNLOCK_DIALOG_PHASE.OPEN);
      }
    });
  }, [unlockDialogPhase]);

  function restoreContentFocus() {
    restoreContentFocusRef.current = true;
  }

  function reconcileVisibleProjects(nextSelectedIds: readonly (typeof selectedIds)[number][]) {
    dispatch({
      type: SHOWCASE_ACTION.PROJECTS_RECONCILED,
      projectIds: filterProjects(eligibleProjects, nextSelectedIds).map((project) => project.id),
    });
  }

  function applyFilters(nextSelectedIds: readonly FilterId[]) {
    if (isProjectModalOpen) return;
    const validatedIds = validateFilterIds(eligibleProjects, nextSelectedIds);
    dispatch({ type: SHOWCASE_ACTION.FILTERS_REPLACED, filterIds: validatedIds });
    reconcileVisibleProjects(validatedIds);
    if (validatedIds.includes(SPECIAL_FILTER_ID.VOID)) {
      unlockPlayerMovement();
      activatePlayer({ attemptPlay: true });
    }
    window.history.replaceState({ showcaseFilters: true }, "", getShowcaseUrl(validatedIds, null));
  }

  function clearFilters() {
    if (isProjectModalOpen) return;
    dispatch({ type: SHOWCASE_ACTION.FILTERS_CLEARED });
    reconcileVisibleProjects([]);
    window.history.pushState({ showcaseFilters: true }, "", getShowcaseUrl([], null));
  }

  function closeUnlockSuccess() {
    unlockSuccessFocusGuardRef.current = false;
    const dialog = unlockSuccessDialogRef.current;
    transitionUnlockDialogPhase(UNLOCK_DIALOG_PHASE.CLOSING);
    if (dialog?.open) {
      dialog.close();
      return;
    }
    transitionUnlockDialogPhase(UNLOCK_DIALOG_PHASE.IDLE);
  }

  function unlockChallenge(challengeId: string) {
    if (!PROJECT_UNLOCK_CHALLENGES.some((challenge) => challenge.id === challengeId)) return;
    if (unlockedChallengeIdsRef.current.includes(challengeId)) {
      restoreContentFocus();
      transitionUnlockDialogPhase(UNLOCK_DIALOG_PHASE.IDLE);
      return;
    }

    const nextProgression = unlockHiddenChallenge(
      progressionRef.current,
      challengeId,
      PROJECT_UNLOCK_CHALLENGES.map((challenge) => challenge.id),
    );
    if (nextProgression === null) return;

    progressionRef.current = nextProgression;
    onProgressionChange?.(nextProgression);
    if (onProgressionChange === undefined) writeSessionProgression(nextProgression);
    const nextUnlockedChallengeIds = [...unlockedChallengeIdsRef.current, challengeId];
    unlockedChallengeIdsRef.current = nextUnlockedChallengeIds;
    transitionUnlockDialogPhase(UNLOCK_DIALOG_PHASE.CLOSING_FILTER_FOR_UNLOCK);
    setUnlockedChallengeIds(nextUnlockedChallengeIds);
    reconcileVisibleProjects(selectedIds);
  }

  function handleFilterDialogOpenChange(nextIsOpen: boolean) {
    if (!isProjectModalOpen) setIsFilterDialogOpen(nextIsOpen);
    if (!nextIsOpen) acknowledgeFilterDialogClosed();
  }

  function closeDetail() {
    restoreFocusRef.current = true;
    dispatch({ type: SHOWCASE_ACTION.PROJECT_HOME, projectIds: filteredProjects.map((project) => project.id) });
    if (window.history.state?.showcaseDetail) window.history.back();
    else dispatch({ type: SHOWCASE_ACTION.DETAIL_CLOSED });
    window.requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
  }

  return (
    <div
      className="project-showcase"
      data-showcase-reveal={isShowcaseRevealing ? "entering" : "settled"}
      inert={!isShowcaseInteractive && detailProject === null ? true : undefined}
      onTransitionEnd={() => setShowcaseMotion((previous) => ({ ...previous, isInteractive: true }))}
      suppressHydrationWarning
    >
      {isVoidActive && movementUnlocked ? <PlayerMovementLegend className="professional-void-movement-legend" /> : null}
      <div
        className="project-showcase-interaction-surface"
        data-interaction-blocked={isProjectModalOpen || isUnlockSuccessOpen}
        inert={isProjectModalOpen || isUnlockSuccessOpen || undefined}
      >
        <ExternalNavigationProvider>
          {detailProject === null ? <>
            <h2 className="visually-hidden project-showcase-heading" ref={headingRef} tabIndex={-1}>Proyectos en la sala principal</h2>
            <ProjectFilterControls isInteractionBlocked={isProjectModalOpen || isUnlockSuccessOpen} isOpen={isFilterDialogOpen} onApply={applyFilters} onChallengeSolved={unlockChallenge} onClear={clearFilters} onDialogClosed={acknowledgeFilterDialogClosed} onOpenChange={handleFilterDialogOpenChange} onRequestContentFocus={restoreContentFocus} projects={eligibleProjects} showLegend={!isVoidActive} showMovementLegend={movementUnlocked} selectedIds={selectedIds} />
            {isVoidActive ? <ProfessionalVoidState socialFocusRef={voidSocialFocusRef} /> : <ProjectCarousel activeProjectId={activeProjectId} focusTargetRef={carouselFocusTargetRef} isFilterDialogOpen={isFilterDialogOpen} isProjectModalOpen={isProjectModalOpen || isUnlockSuccessOpen} onActiveProjectChange={(projectId) => { if (!isProjectModalOpen && !isUnlockSuccessOpen) dispatch({ type: SHOWCASE_ACTION.PROJECT_SELECTED, projectId, projectIds: filteredProjects.map((project) => project.id) }); }} onClearFilters={clearFilters} projects={filteredProjects} selectedFilterLabels={selectedIds.map(getFilterLabel)} unlockedChallengeIds={unlockedChallengeIds} onProjectModalChange={handleProjectModalChange} />}
            {isVoidActive ? null : <div aria-hidden="true" className="project-showcase-identity">
              <p>PROYECTOS</p>
              <span>SALA PRINCIPAL</span>
            </div>}
          </> : <ProjectDetail onBack={closeDetail} project={detailProject} />}
        </ExternalNavigationProvider>
      </div>
      {isUnlockSuccessOpen && typeof document !== "undefined" ? createPortal(
        <dialog
          aria-describedby="project-unlock-success-description"
          aria-labelledby="project-unlock-success-title"
          aria-modal="true"
          className="project-card-modal project-unlock-success-dialog"
          tabIndex={-1}
          onCancel={(event) => {
            event.preventDefault();
            closeUnlockSuccess();
          }}
          onClose={() => {
            unlockSuccessFocusGuardRef.current = false;
            transitionUnlockDialogPhase(UNLOCK_DIALOG_PHASE.IDLE);
          }}
          onKeyDown={(event) => {
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
              const focusableElements = [
                unlockSuccessDismissRef.current,
                unlockSuccessCloseRef.current,
              ].filter((element): element is HTMLButtonElement => element !== null && !element.disabled);
              const currentIndex = focusableElements.indexOf(document.activeElement as HTMLButtonElement);
              if (focusableElements.length < 2 || currentIndex < 0) return;
              event.preventDefault();
              focusableElements[(currentIndex + 1) % focusableElements.length]?.focus({ preventScroll: true });
              return;
            }

            if (event.key !== "Tab") return;
            const focusableElements = getFocusableElements(event.currentTarget);
            const firstElement = focusableElements[0];
            const lastElement = focusableElements.at(-1);
            if (firstElement === undefined || lastElement === undefined) return;
            if (!event.currentTarget.contains(document.activeElement)) {
              event.preventDefault();
              firstElement.focus({ preventScroll: true });
            } else if (event.shiftKey && document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }}
          ref={unlockSuccessDialogRef}
        >
          <div className="project-card-modal-shell">
            <header className="project-card-modal-header">
              <p className="project-card-modal-kicker project-unlock-success-kicker">{PROJECT_UNLOCK_SUCCESS.kicker}</p>
              <h2 id="project-unlock-success-title">{PROJECT_UNLOCK_SUCCESS.title}</h2>
              <button
                aria-label="Cerrar confirmación de desbloqueo"
                className="project-card-modal-close"
                onClick={closeUnlockSuccess}
                ref={unlockSuccessCloseRef}
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>
            <div className="project-card-modal-content project-unlock-success-content">
              <div className="project-card-modal-scroll">
                <div className="project-unlock-success-layout">
                    <div className="project-unlock-success-copy" id="project-unlock-success-description">
                    <blockquote className="project-unlock-success-quote">
                      “{PROJECT_UNLOCK_SUCCESS.quote}”
                    </blockquote>
                    <p className="project-unlock-success-normal">{PROJECT_UNLOCK_SUCCESS.normal}</p>
                    <div aria-hidden="true" className="project-unlock-success-divider">
                      <span className="project-unlock-success-divider-mark" />
                    </div>
                    <p className="project-unlock-success-emphasis">{PROJECT_UNLOCK_SUCCESS.emphasis}</p>
                  </div>
                  {unlockDialogPhase === UNLOCK_DIALOG_PHASE.DEGRADED_READY ? (
                    <div
                      aria-label="Ilustración de Kuroneko no disponible; confirmación de desbloqueo lista"
                      className="project-unlock-success-art"
                      data-image-fallback="true"
                      role="img"
                    />
                  ) : (
                    <Image
                      alt="Kuroneko disfrazado de superhéroe"
                      className="project-unlock-success-art"
                      height={1536}
                      loading="eager"
                      priority
                      sizes="(max-width: 64rem) 44vw, 18rem"
                       src={withPublicPath(UNLOCK_SUCCESS_IMAGE_SRC)}
                      unoptimized
                      width={1024}
                    />
                  )}
                  <div className="project-unlock-success-actions">
                    <button data-modal-initial-focus="true" onClick={closeUnlockSuccess} ref={unlockSuccessDismissRef} type="button">{PROJECT_UNLOCK_SUCCESS.action}</button>
                  </div>
                </div>
              </div>
            </div>
           </div>
        </dialog>,
        document.body,
      ) : null}
    </div>
  );
}
