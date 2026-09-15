import { describe, expect, it } from "vitest";
import {
  createShowcaseState,
  SHOWCASE_ACTION,
  showcaseReducer,
} from "./showcase-reducer";

describe("showcaseReducer", () => {
  it("adds, removes, and clears individual filters without changing their selection order", () => {
    let state = createShowcaseState();

    state = showcaseReducer(state, { type: SHOWCASE_ACTION.FILTER_TOGGLED, filterId: "react" });
    state = showcaseReducer(state, { type: SHOWCASE_ACTION.FILTER_TOGGLED, filterId: "typescript" });
    state = showcaseReducer(state, { type: SHOWCASE_ACTION.FILTER_TOGGLED, filterId: "react" });

    expect(state.selectedIds).toEqual(["typescript"]);
    expect(showcaseReducer(state, { type: SHOWCASE_ACTION.FILTERS_CLEARED }).selectedIds).toEqual([]);
  });

  it("wraps, homes, and ends within caller-supplied eligible ID order", () => {
    const projectIds = ["timer", "alarm", "elemental-tcg"];
    let state = createShowcaseState("timer");
    state = { ...state, detailProjectId: "timer" };

    state = showcaseReducer(state, { type: SHOWCASE_ACTION.PROJECT_MOVED, projectIds, direction: "previous" });
    expect(state.activeProjectId).toBe("elemental-tcg");
    expect(state.detailProjectId).toBeNull();

    state = { ...state, detailProjectId: "elemental-tcg" };
    state = showcaseReducer(state, { type: SHOWCASE_ACTION.PROJECT_HOME, projectIds });
    expect(state.activeProjectId).toBe("timer");
    expect(state.detailProjectId).toBeNull();

    state = { ...state, detailProjectId: "timer" };
    state = showcaseReducer(state, { type: SHOWCASE_ACTION.PROJECT_END, projectIds });
    expect(state.activeProjectId).toBe("elemental-tcg");
    expect(state.detailProjectId).toBeNull();
  });

  it.each([
    ["preserves eligible active and detail IDs", { ...createShowcaseState("timer"), detailProjectId: "timer" }, ["alarm", "timer"], { activeProjectId: "timer", detailProjectId: "timer" }],
    ["falls back and clears an ineligible detail ID", { ...createShowcaseState("timer"), detailProjectId: "timer" }, ["alarm"], { activeProjectId: "alarm", detailProjectId: null }],
    ["clears active and detail IDs for empty results", { ...createShowcaseState("alarm"), detailProjectId: "alarm" }, [], { activeProjectId: null, detailProjectId: null }],
  ])("reconciles results: %s", (_description, state, projectIds, expected) => {
    expect(showcaseReducer(state, { type: SHOWCASE_ACTION.PROJECTS_RECONCILED, projectIds })).toMatchObject(expected);
  });

  it("closes detail when navigation moves the active project", () => {
    const state = showcaseReducer(
      { ...createShowcaseState("timer"), detailProjectId: "timer" },
      { type: SHOWCASE_ACTION.PROJECT_MOVED, projectIds: ["timer", "alarm"], direction: "next" },
    );

    expect(state).toMatchObject({ activeProjectId: "alarm", detailProjectId: null });
  });

  it("does not open detail for a project outside current results", () => {
    const state = createShowcaseState("timer");
    expect(showcaseReducer(state, { type: SHOWCASE_ACTION.DETAIL_OPENED, projectId: "elemental-tcg", projectIds: ["timer", "alarm"] })).toBe(state);
  });

  it("opens detail for a project in current results", () => {
    const state = showcaseReducer(
      createShowcaseState("timer"),
      { type: SHOWCASE_ACTION.DETAIL_OPENED, projectId: "alarm", projectIds: ["timer", "alarm"] },
    );

    expect(state).toMatchObject({ activeProjectId: "alarm", detailProjectId: "alarm" });
  });

  it("clears filters without changing unrelated state", () => {
    const state = {
      ...createShowcaseState("timer"),
      detailProjectId: "timer",
      selectedIds: ["react", "typescript"] as const,
    };

    expect(showcaseReducer(state, { type: SHOWCASE_ACTION.FILTERS_CLEARED })).toEqual({ ...state, selectedIds: [] });
    expect(showcaseReducer(state, { type: SHOWCASE_ACTION.DETAIL_CLOSED }).detailProjectId).toBeNull();
  });
});
