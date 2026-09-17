"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PlayerMovementLegend } from "./BugCesantePlayer";
import { KEYCAP_ASSET, type KeycapAsset, type KeycapName } from "./keycap-assets";
import { usePlatformModifier, type PlatformModifier } from "./platform-modifier";
import { ProjectFilterTitleBanner } from "./ProjectFilterTitleBanner";
import { deriveTaxonomy } from "./project-taxonomy";
import { getUnlockChallengeForProjects, isAcceptedUnlockAnswer } from "./hidden-project-unlock";
import { SPECIAL_FILTER_ID, type FilterId, type ProjectEntry } from "./vault-types";
import { withPublicPath } from "@/shared/routing/public-path";

export interface ProjectFilterControlsProps {
  isInteractionBlocked?: boolean;
  isOpen?: boolean;
  onApply: (filterIds: readonly FilterId[]) => void;
  onClear: () => void;
  onChallengeSolved?: (challengeId: string) => void;
  onDialogClosed?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
  onRequestContentFocus?: () => void;
  projects: readonly ProjectEntry[];
  showLegend?: boolean;
  showMovementLegend?: boolean;
  selectedIds: readonly FilterId[];
}

function normalizeSearchValue(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");
}

interface FilterOptionLike {
  id: FilterId;
  label: string;
}

interface KeycapImageProps {
  className?: string;
  name: KeycapName;
}

function KeycapImage({ className, name }: KeycapImageProps) {
  const asset: KeycapAsset = KEYCAP_ASSET[name];
  // The raw URL intentionally matches the preload URL so the toolbar has no optimized-image waterfall.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt="" aria-hidden="true" className={className} decoding="sync" draggable={false} fetchPriority="high" height={asset.height} loading="eager" src={withPublicPath(asset.src)} width={asset.width} />;
}

const SHORTCUT_LETTER = {
  APPLY: "Q",
  CLEAR: "X",
} as const;

type ShortcutLetter = (typeof SHORTCUT_LETTER)[keyof typeof SHORTCUT_LETTER];

interface ShortcutKeycapPairProps {
  letter: ShortcutLetter;
  modifier: PlatformModifier;
}

function ShortcutKeycapPair({ letter, modifier }: ShortcutKeycapPairProps) {
  const modifierKeycap = modifier === "Option" ? "OPT" : "ALT";

  return (
    <span className="project-filter-shortcut-pair">
      <span aria-hidden="true" className="project-filter-shortcut-pair-art"><KeycapImage className="project-filter-shortcut-keycap" name={modifierKeycap} /><span className="project-filter-shortcut-separator">+</span><KeycapImage className="project-filter-shortcut-keycap" name={letter} /></span>
      <span className="visually-hidden">Atajo: {modifier} + {letter}.</span>
    </span>
  );
}

function ProjectShowcaseLegend() {
  return (
    <aside aria-hidden="true" className="project-showcase-legend">
      <span className="project-showcase-legend-item">
        <KeycapImage className="project-showcase-legend-key" name="STACK" />
        <span>STACK</span>
      </span>
      <span className="project-showcase-legend-item">
        <KeycapImage className="project-showcase-legend-key" name="INFO" />
        <span>INFO</span>
      </span>
    </aside>
  );
}

export function ProjectFilterControls({ isInteractionBlocked = false, isOpen: controlledIsOpen, onApply, onChallengeSolved, onClear, onDialogClosed, onOpenChange = () => undefined, onRequestContentFocus = () => undefined, projects, showLegend = true, showMovementLegend = false, selectedIds }: ProjectFilterControlsProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dismissRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef(new Map<FilterId, HTMLInputElement>());
  const lastTechnologyRef = useRef<FilterId | null>(null);
  const lastFooterActionRef = useRef<"clear" | "apply">("apply");
  const handledUnlockChallengeRef = useRef<string | null>(null);
  const clearRef = useRef<HTMLButtonElement>(null);
  const applyRef = useRef<HTMLButtonElement>(null);
  const [draftIds, setDraftIds] = useState<readonly FilterId[]>(selectedIds);
  const [query, setQuery] = useState("");
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const dialogHistoryStateRef = useRef(false);
  const platformModifier = usePlatformModifier();
  const options = deriveTaxonomy(projects);
  const unlockChallenge = getUnlockChallengeForProjects(projects);
  const isOpen = !isInteractionBlocked && (controlledIsOpen ?? uncontrolledIsOpen);

  function setDialogOpen(nextIsOpen: boolean) {
    if (nextIsOpen && isInteractionBlocked) return;
    if (controlledIsOpen === undefined) setUncontrolledIsOpen(nextIsOpen);
    onOpenChange(nextIsOpen);
  }

  function matchesQuery(option: FilterOptionLike) {
    return normalizeSearchValue(option.label).includes(normalizeSearchValue(query));
  }

  const visibleOptions = options.filter(matchesQuery);

  function isEditableTarget(target: EventTarget | null) {
    return target instanceof HTMLElement && (target.isContentEditable || target.closest("input:not([type='checkbox']):not([type='radio']), textarea, select, [contenteditable='true']") !== null);
  }

  function openDialog() {
    if (isInteractionBlocked) return;
    setDraftIds(selectedIds);
    setQuery("");
    handledUnlockChallengeRef.current = null;
    setDialogOpen(true);
    if (!dialogHistoryStateRef.current) {
      window.history.pushState({ projectFilterDialog: true }, "");
      dialogHistoryStateRef.current = true;
    }
  }

  function closeDialog({ restoreContentFocus = true, restoreHistory = true }: { restoreContentFocus?: boolean; restoreHistory?: boolean } = {}) {
    dialogRef.current?.close();
    setDraftIds(selectedIds);
    setQuery("");
    setDialogOpen(false);
    if (restoreContentFocus) onRequestContentFocus();
    if (restoreHistory && dialogHistoryStateRef.current) {
      dialogHistoryStateRef.current = false;
      window.history.back();
    }
  }

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    if (
      unlockChallenge !== undefined &&
      handledUnlockChallengeRef.current !== unlockChallenge.id &&
      isAcceptedUnlockAnswer(unlockChallenge, nextQuery)
    ) {
      handledUnlockChallengeRef.current = unlockChallenge.id;
      onChallengeSolved?.(unlockChallenge.id);
      closeDialog({ restoreContentFocus: false });
    }
  }

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      searchRef.current?.focus({ preventScroll: true });
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  function toggleDraft(filterId: FilterId) {
    setDraftIds((currentIds) => {
      if (currentIds.includes(filterId)) return currentIds.filter((id) => id !== filterId);
      if (filterId === SPECIAL_FILTER_ID.VOID) return [SPECIAL_FILTER_ID.VOID];
      return [...currentIds.filter((id) => id !== SPECIAL_FILTER_ID.VOID), filterId];
    });
  }

  useEffect(() => {
    const handlePopState = () => {
      if (!dialogHistoryStateRef.current) return;
      dialogHistoryStateRef.current = false;
        setDraftIds(selectedIds);
        closeDialog({ restoreHistory: false });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  // The close path intentionally reads the latest selected IDs; adding the render-local helper would rebind the global listener every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds]);

  useEffect(() => {
    function getTechnologyInputs() {
      return visibleOptions.map((option) => optionRefs.current.get(option.id)).filter((input): input is HTMLInputElement => input !== undefined);
    }

    function isTechnologyInput(target: Element | null): target is HTMLInputElement {
      return target instanceof HTMLInputElement && target.type === "checkbox" && target.closest("[data-filter-zone='technologies']") !== null;
    }

    function focusTechnology(input: HTMLInputElement) {
      lastTechnologyRef.current = input.value as FilterId;
      input.focus({ preventScroll: true });
      input.scrollIntoView({ block: "nearest", inline: "nearest" });
    }

    function getGridRows() {
      const inputs = getTechnologyInputs();
      const rows: HTMLInputElement[][] = [];
      inputs.forEach((input) => {
        const row = rows.find((candidate) => Math.abs(candidate[0]!.getBoundingClientRect().top - input.getBoundingClientRect().top) < 4);
        if (row === undefined) rows.push([input]);
        else row.push(input);
      });
      rows.forEach((row) => row.sort((left, right) => left.getBoundingClientRect().left - right.getBoundingClientRect().left));
      return rows;
    }

    function getGridDestination(current: HTMLInputElement, direction: "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown") {
      const rows = getGridRows();
      if (rows.length === 0) return undefined;
      const rowIndex = rows.findIndex((row) => row.includes(current));
      if (rowIndex < 0) return undefined;
      const columnIndex = rows[rowIndex]?.indexOf(current) ?? 0;
      if (direction === "ArrowLeft") return rows[rowIndex]?.[columnIndex - 1];
      if (direction === "ArrowRight") return rows[rowIndex]?.[columnIndex + 1];
      const nextRow = rows[rowIndex + (direction === "ArrowDown" ? 1 : -1)];
      return nextRow?.[Math.min(columnIndex, nextRow.length - 1)];
    }

    function focusFooter(action: "clear" | "apply") {
      lastFooterActionRef.current = action;
      (action === "clear" ? clearRef.current : applyRef.current)?.focus({ preventScroll: true });
    }

    function getCurrentZone(target: EventTarget | null) {
      return target instanceof Element ? target.closest<HTMLElement>("[data-filter-zone]")?.dataset.filterZone : undefined;
    }

    function getFooterDestinationForTechnology(input: HTMLInputElement) {
      const rows = getGridRows();
      const row = rows.find((candidate) => candidate.includes(input));
      if (row === undefined) return "apply";
      const first = row[0]?.getBoundingClientRect();
      const last = row[row.length - 1]?.getBoundingClientRect();
      const current = input.getBoundingClientRect();
      return first !== undefined && last !== undefined && current.left < (first.left + last.right) / 2 ? "clear" : "apply";
    }

    function getFooterTechnologyDestination(action: "clear" | "apply") {
      const inputs = getTechnologyInputs();
      if (inputs.length === 0) return undefined;
      const lastRow = getGridRows().at(-1);
      if (lastRow === undefined) return undefined;
      return action === "clear" ? lastRow[0] : lastRow.at(-1);
    }

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (isInteractionBlocked) return;
      const dialogIsOpen = isOpen;

      if (dialogIsOpen && event.altKey && !event.ctrlKey && !event.metaKey && !event.repeat) {
        if (event.code === "KeyX") {
          event.preventDefault();
          setDraftIds([]);
          setQuery("");
          return;
        }
        if (event.code === "KeyQ") {
          event.preventDefault();
          onApply(draftIds);
          closeDialog({ restoreHistory: false });
          return;
        }
      }

      if (event.ctrlKey || event.altKey || event.metaKey) return;

      const key = event.key.toLowerCase();
      if (key === "f" && !isOpen && !isEditableTarget(event.target)) {
        event.preventDefault();
        openDialog();
        return;
      }

      if (key === "c" && !isOpen && selectedIds.length > 0 && !isEditableTarget(event.target)) {
        event.preventDefault();
        onClear();
        return;
      }

      if (!dialogIsOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setDraftIds(selectedIds);
        closeDialog();
        return;
      }

      const zone = getCurrentZone(event.target);
      const activeElement = document.activeElement;

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        if (activeElement === dismissRef.current) {
          if (event.key === "ArrowDown") searchRef.current?.focus({ preventScroll: true });
          else focusFooter(lastFooterActionRef.current);
          return;
        }
        if (activeElement === searchRef.current) {
          if (event.key === "ArrowUp") dismissRef.current?.focus({ preventScroll: true });
          else (getTechnologyInputs()[0] ?? applyRef.current)?.focus({ preventScroll: true });
          return;
        }
        if (isTechnologyInput(activeElement)) {
          const destination = getGridDestination(activeElement, event.key);
          if (destination !== undefined) focusTechnology(destination);
          else if (event.key === "ArrowUp") searchRef.current?.focus({ preventScroll: true });
          else focusFooter(getFooterDestinationForTechnology(activeElement));
          return;
        }
        if (zone === "footer") {
          if (event.key === "ArrowDown") dismissRef.current?.focus({ preventScroll: true });
          else {
            const action = activeElement === clearRef.current ? "clear" : "apply";
            const destination = getFooterTechnologyDestination(action);
            if (destination === undefined) searchRef.current?.focus({ preventScroll: true });
            else focusTechnology(destination);
          }
        }
        return;
      }

      if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && zone === "footer") {
        event.preventDefault();
        focusFooter(activeElement === clearRef.current ? "apply" : "clear");
        return;
      }

      if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && isTechnologyInput(activeElement)) {
        event.preventDefault();
        const destination = getGridDestination(activeElement, event.key);
        if (destination !== undefined) focusTechnology(destination);
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      if ((event.key === "Enter" || event.key === " ") && isTechnologyInput(activeElement)) {
        event.preventDefault();
        activeElement.click();
        return;
      }

      if (/^[a-z]$/iu.test(event.key)) {
        event.preventDefault();
        setQuery((currentQuery) => `${currentQuery}${event.key}`);
        window.requestAnimationFrame(() => searchRef.current?.focus());
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  // Keyboard routing is a single window listener whose behavior is refreshed only when its stateful inputs change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftIds, isInteractionBlocked, isOpen, onApply, onClear, selectedIds, visibleOptions]);

  return (
    <section aria-label="Filtros de proyectos" className="project-filter-controls">
      <link as="image" href={withPublicPath(KEYCAP_ASSET.CLEAR.src)} rel="preload" />
      <link as="image" href={withPublicPath(KEYCAP_ASSET.FILTER.src)} rel="preload" />
      <div className="project-filter-toolbar">
        {showLegend ? <div className="project-showcase-shortcut-group"><ProjectShowcaseLegend />{showMovementLegend ? <PlayerMovementLegend /> : null}</div> : null}
        <div className="project-filter-actions">
          {selectedIds.length === 0 ? null : <button className="project-filter-clear" disabled={isInteractionBlocked} onClick={onClear} type="button"><span className="project-filter-button-content"><span>LIMPIAR FILTROS</span><KeycapImage className="project-filter-keycap" name="CLEAR" /></span><span className="visually-hidden"> Atajo: C.</span></button>}
          <button aria-haspopup="dialog" className="project-filter-open" disabled={isInteractionBlocked} onClick={openDialog} type="button">
            <span className="project-filter-button-content"><span>Filtros</span><KeycapImage className="project-filter-keycap" name="FILTER" /></span>
            <span className="visually-hidden"> Atajo: F.</span>
          </button>
        </div>
      </div>
      <p aria-atomic="true" aria-live="polite" className="visually-hidden" role="status">{selectedIds.length === 0 ? "Colección completa." : `${selectedIds.length} filtros activos.`}</p>

      <dialog aria-labelledby="project-filter-title" className="project-filter-dialog" onCancel={(event) => { event.preventDefault(); setDraftIds(selectedIds); closeDialog(); }} onClose={onDialogClosed} onMouseDown={(event) => { if (event.target === event.currentTarget) { setDraftIds(selectedIds); closeDialog(); } }} ref={dialogRef}>
        <form method="dialog">
          <header className="project-filter-dialog-header" data-filter-zone="close">
            <ProjectFilterTitleBanner />
            <h2 className="visually-hidden" id="project-filter-title">UN GRAN PODER CONLLEVA UNA GRAN RESPONSABILIDAD — Joker (Joke)</h2>
            <button aria-label="Cerrar filtros" className="project-filter-dismiss" onClick={() => closeDialog()} ref={dismissRef} type="button">×</button>
          </header>
          <div className="project-filter-dialog-body">
            <div className="project-filter-query-console">
              <span className="project-filter-console-comment">{'// Si "vacío" mi stack dejas...'}</span>
              <code>&gt; options.filter(matchesQuery)</code>
              <span className="project-filter-console-comment">{"// ...mi cesantía observar debes."}</span>
              <output aria-atomic="true" aria-live="polite" className="project-filter-query-status">{visibleOptions.length} tecnologías visibles · {draftIds.length} seleccionadas</output>
            </div>
            {showLegend ? <aside aria-label="Guía de navegación" className="project-filter-keyboard-legend">
              <div className="project-filter-legend-item project-filter-legend-arrows">
                <span aria-hidden="true" className="project-filter-arrow-keys"><KeycapImage className="project-filter-key-up" name="UP" /><KeycapImage className="project-filter-key-left" name="UP" /><KeycapImage className="project-filter-key-down" name="DOWN" /><KeycapImage className="project-filter-key-right" name="UP" /></span>
                <span className="project-filter-legend-label">FLECHAS DE<br />NAVEGACIÓN</span>
              </div>
              <div className="project-filter-legend-item project-filter-legend-escape"><KeycapImage className="project-filter-legend-key" name="ESC" /><span className="project-filter-legend-label">SALIR</span></div>
              <div className="project-filter-legend-item project-filter-legend-select"><span aria-hidden="true" className="project-filter-legend-key-pair"><KeycapImage className="project-filter-legend-key" name="ENTER" /><KeycapImage className="project-filter-legend-key" name="SPACE" /></span><span className="project-filter-legend-label">SELECCIONA O DESELECCIONA FILTROS</span></div>
              <div className="project-filter-legend-item project-filter-legend-clear"><ShortcutKeycapPair letter={SHORTCUT_LETTER.CLEAR} modifier={platformModifier} /><span className="project-filter-legend-label">LIMPIA LOS FILTROS</span></div>
              <div className="project-filter-legend-item project-filter-legend-apply"><ShortcutKeycapPair letter={SHORTCUT_LETTER.APPLY} modifier={platformModifier} /><span className="project-filter-legend-label">APLICA LOS FILTROS</span></div>
            </aside> : null}
            <div className="project-filter-search" data-filter-zone="search">
              <label htmlFor="project-filter-query">Buscar tecnología</label>
              <input
                aria-autocomplete="none"
                autoComplete="off"
                id="project-filter-query"
                onChange={(event) => handleQueryChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowDown") return;
                  event.preventDefault();
                  event.stopPropagation();
                  const firstVisibleOption = visibleOptions[0];
                  const firstVisibleInput = firstVisibleOption === undefined ? undefined : optionRefs.current.get(firstVisibleOption.id);
                  (firstVisibleInput ?? applyRef.current)?.focus({ preventScroll: true });
                  firstVisibleInput?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
                }}
                placeholder="Ej. React"
                ref={searchRef}
                spellCheck={false}
                type="search"
                value={query}
              />
            </div>
            <fieldset className="project-filter-options" data-filter-zone="technologies">
              <legend className="visually-hidden">Tecnologías y estado profesional disponibles</legend>
              {visibleOptions.map((option) => (
                <label className="project-filter-option" key={option.id}>
                  <input checked={draftIds.includes(option.id)} onChange={() => toggleDraft(option.id)} ref={(element) => { if (element === null) optionRefs.current.delete(option.id); else optionRefs.current.set(option.id, element); }} type="checkbox" value={option.id} />
                  <span>{option.label}</span>
                </label>
              ))}
              {visibleOptions.length === 0 ? <p className="project-filter-empty" role="status">No hay tecnologías que coincidan.</p> : null}
            </fieldset>
            <footer className="project-filter-dialog-actions" data-filter-zone="footer">
              <button aria-keyshortcuts="Alt+X" aria-label={`LIMPIAR. Atajo: ${platformModifier} + ${SHORTCUT_LETTER.CLEAR}.`} className="project-filter-clear" onClick={() => { setDraftIds([]); setQuery(""); }} onFocus={() => { lastFooterActionRef.current = "clear"; }} ref={clearRef} title={`Atajo: ${platformModifier} + ${SHORTCUT_LETTER.CLEAR}`} type="button">LIMPIAR</button>
              <button aria-keyshortcuts="Alt+Q" aria-label={`APLICAR. Atajo: ${platformModifier} + ${SHORTCUT_LETTER.APPLY}.`} className="project-filter-apply" onClick={() => { onApply(draftIds); closeDialog({ restoreHistory: false }); }} onFocus={() => { lastFooterActionRef.current = "apply"; }} ref={applyRef} title={`Atajo: ${platformModifier} + ${SHORTCUT_LETTER.APPLY}`} type="button">APLICAR</button>
            </footer>
          </div>
        </form>
      </dialog>
    </section>
  );
}
