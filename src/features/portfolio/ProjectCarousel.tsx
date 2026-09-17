"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from "react";
import Image from "next/image";
import { ProjectCard } from "./ProjectCard";
import { createPointerAxisLock, isPointerGestureTarget, isPrimaryGesturePointer } from "./pointer-axis-lock";
import { getRingCssProperties } from "./ring-geometry";
import type { ProjectEntry } from "./vault-types";
import { withPublicPath } from "@/shared/routing/public-path";
import { useTouchActivation } from "@/shared/a11y/touch-activation";

export interface ProjectCarouselProps {
  activeProjectId: string | null;
  isProjectModalOpen?: boolean;
  onActiveProjectChange: (projectId: string) => void;
  onProjectModalChange?: (isOpen: boolean) => void;
  onClearFilters?: () => void;
  isFilterDialogOpen?: boolean;
  projects: readonly ProjectEntry[];
  focusTargetRef?: RefObject<HTMLElement | null>;
  selectedFilterLabels?: readonly string[];
  unlockedChallengeIds?: readonly string[];
}

export function ProjectCarousel({ activeProjectId, isProjectModalOpen = false, onActiveProjectChange, onProjectModalChange, onClearFilters, isFilterDialogOpen = false, projects, focusTargetRef, selectedFilterLabels = [], unlockedChallengeIds = [] }: ProjectCarouselProps) {
  const [isStaticLayout, setIsStaticLayout] = useState(true);
  const axisLockRef = useRef(createPointerAxisLock());
  const railCapturePointerIdRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const activeIndex = projects.findIndex((project) => project.id === activeProjectId);
  const resolvedActiveIndex = activeIndex < 0 ? 0 : activeIndex;
  const activeProject = projects[resolvedActiveIndex];
  const filters = selectedFilterLabels.length === 0 ? "Sin filtros activos." : `Filtros activos: ${selectedFilterLabels.join(", ")}.`;

  function getWrappedIndex(index: number) {
    return (index + projects.length) % projects.length;
  }

  function getRingVisualState(index: number) {
    const distance = Math.min(Math.abs(index - resolvedActiveIndex), projects.length - Math.abs(index - resolvedActiveIndex));
    return distance === 0 ? "active" : distance === 1 ? "adjacent" : "far";
  }

  useEffect(() => {
    if (typeof window.matchMedia !== "function" || typeof window.CSS?.supports !== "function") return;

    const printQuery = window.matchMedia("print");
    const supports3d = window.CSS.supports("perspective: 1px") && window.CSS.supports("transform-style: preserve-3d");
    const updateLayout = () => setIsStaticLayout(!supports3d || printQuery.matches);

    updateLayout();
    printQuery.addEventListener("change", updateLayout);
    window.addEventListener("beforeprint", updateLayout);
    window.addEventListener("afterprint", updateLayout);
    return () => {
      printQuery.removeEventListener("change", updateLayout);
      window.removeEventListener("beforeprint", updateLayout);
      window.removeEventListener("afterprint", updateLayout);
    };
  }, []);

  useEffect(() => {
    const onWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (isProjectModalOpen || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || projects.length < 2) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (isFilterDialogOpen) return;
      if (document.querySelector("dialog[open], [role='dialog']") !== null) return;

      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select, [contenteditable='true']") !== null)) return;

      const nextIndex = (event.key === "ArrowRight" ? resolvedActiveIndex + 1 : resolvedActiveIndex - 1 + projects.length) % projects.length;
      const nextProject = projects[nextIndex];

      if (nextProject === undefined) return;
      event.preventDefault();
      onActiveProjectChange(nextProject.id);
    };

    window.addEventListener("keydown", onWindowKeyDown);
    return () => window.removeEventListener("keydown", onWindowKeyDown);
  }, [isFilterDialogOpen, isProjectModalOpen, onActiveProjectChange, projects, resolvedActiveIndex]);

  function selectProject(index: number) {
    if (isProjectModalOpen) return;
    const project = projects[index];
    if (project !== undefined) onActiveProjectChange(project.id);
  }

  const previousTouchActivation = useTouchActivation(() => selectProject(getWrappedIndex(resolvedActiveIndex - 1)));
  const nextTouchActivation = useTouchActivation(() => selectProject(getWrappedIndex(resolvedActiveIndex + 1)));

  if (activeProject === undefined) {
    return (
      <section aria-label="Resultados de proyectos" className="project-carousel">
        <p aria-atomic="true" aria-live="polite" role="status">No hay proyectos que mostrar. {filters}</p>
        <p>No encontramos proyectos con estos filtros.</p>
        {onClearFilters === undefined ? null : <button onClick={onClearFilters} type="button">Mostrar todos los proyectos</button>}
      </section>
    );
  }

  function onPointerDown(event: PointerEvent<HTMLOListElement>) {
    if (isProjectModalOpen) return;
    if (isStaticLayout || !isPrimaryGesturePointer(event.nativeEvent)) return;
    if (!isPointerGestureTarget(event.target)) return;
    axisLockRef.current.start(event);
  }

  function onPointerMove(event: PointerEvent<HTMLOListElement>) {
    if (isProjectModalOpen) {
      axisLockRef.current.cancel(event.pointerId);
      return;
    }
    const result = axisLockRef.current.move(event);
    if (result.capture) event.currentTarget.setPointerCapture(event.pointerId);
    if (result.preventDefault) event.preventDefault();
  }

  function onPointerUp(event: PointerEvent<HTMLOListElement>) {
    if (isProjectModalOpen) {
      axisLockRef.current.cancel(event.pointerId);
      return;
    }
    const direction = axisLockRef.current.end(event);
    if (direction === null) return;

    suppressClickRef.current = true;
    const nextIndex = getWrappedIndex(direction === "next" ? resolvedActiveIndex + 1 : resolvedActiveIndex - 1);
    selectProject(nextIndex);
  }

  return (
      <section aria-label="Resultados de proyectos" className="project-carousel" data-carousel-focus-target="true" ref={focusTargetRef} tabIndex={-1}>
      <p aria-atomic="true" aria-live="polite" role="status" className="visually-hidden">
        Se muestran {projects.length} proyectos. {filters} Proyecto activo: {activeProject.name}.
      </p>
      <div aria-label="Navegación de proyectos" className="project-carousel-navigation">
        <button aria-label="Proyecto anterior" className="project-carousel-arrow" data-arrow-direction="previous" disabled={isProjectModalOpen} onClick={() => selectProject(getWrappedIndex(resolvedActiveIndex - 1))} type="button" {...previousTouchActivation}><Image alt="" aria-hidden="true" draggable={false} height={48} src={withPublicPath("/assets/icons/left.webp")} width={48} /></button>
        <p aria-hidden="true">{String(resolvedActiveIndex + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</p>
        <button aria-label="Proyecto siguiente" className="project-carousel-arrow" data-arrow-direction="next" disabled={isProjectModalOpen} onClick={() => selectProject(getWrappedIndex(resolvedActiveIndex + 1))} type="button" {...nextTouchActivation}><Image alt="" aria-hidden="true" draggable={false} height={48} src={withPublicPath("/assets/icons/right.webp")} width={48} /></button>
      </div>
      <p className="visually-hidden" id="project-carousel-gesture-hint">También puedes arrastrar horizontalmente el proyecto activo para navegar; los controles siguen disponibles.</p>
      <ol
        aria-describedby={isStaticLayout ? undefined : "project-carousel-gesture-hint"}
        aria-label="Proyectos filtrados"
        className="project-showcase-rail"
        data-gesture-enabled={!isStaticLayout}
        data-ring-count={projects.length}
        data-static-layout={isStaticLayout}
        onClickCapture={(event) => {
          if (!suppressClickRef.current) return;
          suppressClickRef.current = false;
          if (!isPointerGestureTarget(event.target)) return;
          event.preventDefault();
          event.stopPropagation();
        }}
        onGotPointerCapture={(event) => {
          if (event.target === event.currentTarget) railCapturePointerIdRef.current = event.pointerId;
        }}
        onLostPointerCapture={(event) => {
          if (event.target !== event.currentTarget || railCapturePointerIdRef.current !== event.pointerId) return;
          railCapturePointerIdRef.current = null;
          axisLockRef.current.cancel(event.pointerId);
        }}
        onPointerCancel={(event) => {
          if (railCapturePointerIdRef.current === event.pointerId) railCapturePointerIdRef.current = null;
          axisLockRef.current.cancel(event.pointerId);
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {projects.map((project, index) => (
          <li
            aria-current={project.id === activeProject.id ? "true" : undefined}
            className="project-showcase-item"
            data-active={project.id === activeProject.id}
            data-ring-visual-state={getRingVisualState(index)}
            inert={!isStaticLayout && project.id !== activeProject.id}
            key={project.id}
            style={getRingCssProperties(index, resolvedActiveIndex, projects.length) as CSSProperties}
          >
          <ProjectCard isActive={project.id === activeProject.id} isFilterDialogOpen={isFilterDialogOpen} project={project} unlockedChallengeIds={unlockedChallengeIds} {...(onProjectModalChange === undefined ? {} : { onProjectModalChange })} />
          </li>
        ))}
      </ol>
    </section>
  );
}
