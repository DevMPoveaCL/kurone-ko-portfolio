import { SPECIAL_FILTER_ID, type FilterId } from "./vault-types";

export const SHOWCASE_ACTION = {
  DETAIL_CLOSED: "detail-closed",
  DETAIL_OPENED: "detail-opened",
  FILTERS_CLEARED: "filters-cleared",
  FILTERS_REPLACED: "filters-replaced",
  FILTER_TOGGLED: "filter-toggled",
  PROJECT_END: "project-end",
  PROJECT_HOME: "project-home",
  PROJECT_MOVED: "project-moved",
  PROJECT_SELECTED: "project-selected",
  PROJECTS_RECONCILED: "projects-reconciled",
} as const;

export type ShowcaseActionType = (typeof SHOWCASE_ACTION)[keyof typeof SHOWCASE_ACTION];

export interface ShowcaseState {
  activeProjectId: string | null;
  detailProjectId: string | null;
  selectedIds: readonly FilterId[];
}

/** Caller-supplied showcase-eligible IDs, ordered for deterministic navigation. */
type EligibleOrderedProjectIds = readonly string[];

export type ShowcaseAction =
  | { type: typeof SHOWCASE_ACTION.DETAIL_CLOSED }
  | { type: typeof SHOWCASE_ACTION.DETAIL_OPENED; projectId: string; projectIds: EligibleOrderedProjectIds }
  | { type: typeof SHOWCASE_ACTION.FILTERS_CLEARED }
  | { type: typeof SHOWCASE_ACTION.FILTERS_REPLACED; filterIds: readonly FilterId[] }
  | { type: typeof SHOWCASE_ACTION.FILTER_TOGGLED; filterId: FilterId }
  | { type: typeof SHOWCASE_ACTION.PROJECT_END; projectIds: EligibleOrderedProjectIds }
  | { type: typeof SHOWCASE_ACTION.PROJECT_HOME; projectIds: EligibleOrderedProjectIds }
  | { type: typeof SHOWCASE_ACTION.PROJECT_MOVED; direction: "next" | "previous"; projectIds: EligibleOrderedProjectIds }
  | { type: typeof SHOWCASE_ACTION.PROJECT_SELECTED; projectId: string; projectIds: EligibleOrderedProjectIds }
  | { type: typeof SHOWCASE_ACTION.PROJECTS_RECONCILED; projectIds: EligibleOrderedProjectIds };

export function createShowcaseState(activeProjectId: string | null = null): ShowcaseState {
  return { activeProjectId, detailProjectId: null, selectedIds: [] };
}

function getActiveProjectId(projectIds: readonly string[], activeProjectId: string | null): string | null {
  return projectIds.includes(activeProjectId ?? "") ? activeProjectId : (projectIds[0] ?? null);
}

function getMovedProjectId(state: ShowcaseState, projectIds: readonly string[], direction: "next" | "previous"): string | null {
  const currentIndex = projectIds.indexOf(getActiveProjectId(projectIds, state.activeProjectId) ?? "");

  if (currentIndex < 0) {
    return null;
  }

  const offset = direction === "next" ? 1 : -1;
  return projectIds[(currentIndex + offset + projectIds.length) % projectIds.length] ?? null;
}

function navigateToProject(state: ShowcaseState, activeProjectId: string | null): ShowcaseState {
  return { ...state, activeProjectId, detailProjectId: null };
}

export function showcaseReducer(state: ShowcaseState, action: ShowcaseAction): ShowcaseState {
  switch (action.type) {
    case SHOWCASE_ACTION.FILTER_TOGGLED: {
      const selectedIds = state.selectedIds.includes(action.filterId)
        ? state.selectedIds.filter((id) => id !== action.filterId)
        : action.filterId === SPECIAL_FILTER_ID.VOID
          ? [SPECIAL_FILTER_ID.VOID]
          : [...state.selectedIds.filter((id) => id !== SPECIAL_FILTER_ID.VOID), action.filterId];
      return { ...state, selectedIds };
    }
    case SHOWCASE_ACTION.FILTERS_CLEARED:
      return { ...state, selectedIds: [] };
    case SHOWCASE_ACTION.FILTERS_REPLACED:
      return { ...state, selectedIds: action.filterIds };
    case SHOWCASE_ACTION.PROJECTS_RECONCILED: {
      const { projectIds } = action;
      const activeProjectId = getActiveProjectId(projectIds, state.activeProjectId);
      return {
        ...state,
        activeProjectId,
        detailProjectId: projectIds.includes(state.detailProjectId ?? "") ? state.detailProjectId : null,
      };
    }
    case SHOWCASE_ACTION.PROJECT_MOVED:
      return navigateToProject(state, getMovedProjectId(state, action.projectIds, action.direction));
    case SHOWCASE_ACTION.PROJECT_SELECTED:
      return action.projectIds.includes(action.projectId)
        ? navigateToProject(state, action.projectId)
        : state;
    case SHOWCASE_ACTION.PROJECT_HOME:
      return navigateToProject(state, action.projectIds[0] ?? null);
    case SHOWCASE_ACTION.PROJECT_END:
      return navigateToProject(state, action.projectIds.at(-1) ?? null);
    case SHOWCASE_ACTION.DETAIL_OPENED:
      return action.projectIds.includes(action.projectId)
        ? { ...state, activeProjectId: action.projectId, detailProjectId: action.projectId }
        : state;
    case SHOWCASE_ACTION.DETAIL_CLOSED:
      return { ...state, detailProjectId: null };
  }
}
