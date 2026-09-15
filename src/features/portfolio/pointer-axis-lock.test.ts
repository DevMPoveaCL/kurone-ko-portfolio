import { fireEvent, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectCarousel } from "./ProjectCarousel";
import { PROJECTS } from "./project-data";
import { filterProjects } from "./project-taxonomy";
import { createPointerAxisLock, isPointerGestureTarget, isPrimaryGesturePointer, POINTER_AXIS_LOCK } from "./pointer-axis-lock";

describe("pointer axis lock", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps taps and vertical intent free of horizontal capture", () => {
    const lock = createPointerAxisLock();

    lock.start({ clientX: 100, clientY: 100, pointerId: 1 });
    expect(lock.move({ clientX: 106, clientY: 105, pointerId: 1 })).toEqual({ capture: false, preventDefault: false });
    expect(lock.end({ clientX: 106, clientY: 105, pointerId: 1 })).toBeNull();

    lock.start({ clientX: 100, clientY: 100, pointerId: 2 });
    expect(lock.move({ clientX: 108, clientY: 120, pointerId: 2 })).toEqual({ capture: false, preventDefault: false });
    expect(lock.end({ clientX: 108, clientY: 160, pointerId: 2 })).toBeNull();
  });

  it("captures only horizontally dominant gestures and releases one bounded deterministic step", () => {
    const lock = createPointerAxisLock();

    lock.start({ clientX: 100, clientY: 100, pointerId: 1 });
    expect(lock.move({ clientX: 116, clientY: 103, pointerId: 1 })).toEqual({ capture: true, preventDefault: true });
    expect(lock.move({ clientX: 200, clientY: 103, pointerId: 1 })).toEqual({ capture: false, preventDefault: true });
    expect(lock.end({ clientX: 200, clientY: 103, pointerId: 1 })).toBe("previous");

    lock.start({ clientX: 200, clientY: 100, pointerId: 2 });
    lock.move({ clientX: 184, clientY: 102, pointerId: 2 });
    expect(lock.end({ clientX: 140, clientY: 102, pointerId: 2 })).toBe("next");
  });

  it("cleans up canceled, lost-capture, and mismatched pointer sequences", () => {
    const lock = createPointerAxisLock();

    lock.start({ clientX: 100, clientY: 100, pointerId: 1 });
    lock.move({ clientX: 116, clientY: 100, pointerId: 1 });
    lock.cancel(2);
    expect(lock.end({ clientX: 160, clientY: 100, pointerId: 1 })).toBe("previous");

    lock.start({ clientX: 100, clientY: 100, pointerId: 1 });
    lock.cancel(1);
    expect(lock.end({ clientX: 160, clientY: 100, pointerId: 1 })).toBeNull();
    expect(POINTER_AXIS_LOCK.RELEASE_DISTANCE).toBe(48);
  });

  it("accepts only primary mouse, pen, and touch pointers outside controls", () => {
    const { getByRole } = render(createElement("button", { type: "button" }, "Control"));

    expect(isPrimaryGesturePointer({ button: 0, isPrimary: true, pointerType: "touch" } as PointerEvent)).toBe(true);
    expect(isPrimaryGesturePointer({ button: 2, isPrimary: true, pointerType: "mouse" } as PointerEvent)).toBe(false);
    expect(isPrimaryGesturePointer({ button: 0, isPrimary: false, pointerType: "pen" } as PointerEvent)).toBe(false);
    expect(isPointerGestureTarget(getByRole("button", { name: "Control" }))).toBe(false);
  });

  it("keeps axis lock through descendant capture loss before the rail captures and commits one step", () => {
    const projects = filterProjects(PROJECTS, []).slice(0, 2);
    const activeProject = projects[0];
    if (activeProject === undefined) throw new Error("Expected eligible project.");

    vi.stubGlobal("matchMedia", () => ({ addEventListener: vi.fn(), matches: false, removeEventListener: vi.fn() }));
    vi.stubGlobal("CSS", { supports: vi.fn(() => true) });
    const onActiveProjectChange = vi.fn();
    render(createElement(ProjectCarousel, { activeProjectId: activeProject.id, onActiveProjectChange, projects }));

    const rail = screen.getByRole("list", { name: "Proyectos filtrados" }) as HTMLUListElement;
    rail.setPointerCapture = vi.fn();
    const cardFace = rail.querySelector(".project-card-face");
    if (cardFace === null) throw new Error("Expected a project card face.");
    fireEvent.pointerDown(cardFace, { button: 0, clientX: 200, clientY: 100, isPrimary: true, pointerId: 1, pointerType: "touch" });
    expect(fireEvent.pointerMove(rail, { clientX: 180, clientY: 102, pointerId: 1, pointerType: "touch" })).toBe(false);
    fireEvent.lostPointerCapture(cardFace, { pointerId: 1 });
    fireEvent.gotPointerCapture(rail, { pointerId: 1 });
    fireEvent.pointerUp(rail, { clientX: 140, clientY: 102, pointerId: 1, pointerType: "touch" });

    expect(rail.setPointerCapture).toHaveBeenCalledWith(1);
    expect(onActiveProjectChange).toHaveBeenCalledOnce();
    expect(onActiveProjectChange).toHaveBeenCalledWith(projects[1]?.id);
    const activeItem = rail.querySelector("[data-active='true']");
    if (activeItem === null) throw new Error("Expected active item.");
    expect(within(activeItem as HTMLElement).getByRole("button", { name: /Ver historia de/ })).toBeVisible();
  });

  it("preserves vertical scroll, cancellation cleanup, static fallback, and visible controls", () => {
    const projects = filterProjects(PROJECTS, []).slice(0, 2);
    const activeProject = projects[0];
    if (activeProject === undefined) throw new Error("Expected eligible project.");

    vi.stubGlobal("matchMedia", () => ({ addEventListener: vi.fn(), matches: false, removeEventListener: vi.fn() }));
    vi.stubGlobal("CSS", { supports: vi.fn(() => true) });
    const onActiveProjectChange = vi.fn();
    const { rerender } = render(createElement(ProjectCarousel, { activeProjectId: activeProject.id, onActiveProjectChange, projects }));
    const rail = screen.getByRole("list", { name: "Proyectos filtrados" }) as HTMLUListElement;
    rail.setPointerCapture = vi.fn();
    fireEvent.pointerDown(rail, { button: 0, clientX: 100, clientY: 100, isPrimary: true, pointerId: 1, pointerType: "touch" });
    expect(fireEvent.pointerMove(rail, { clientX: 103, clientY: 120, pointerId: 1, pointerType: "touch" })).toBe(true);
    expect(rail.setPointerCapture).not.toHaveBeenCalled();
    fireEvent.pointerCancel(rail, { pointerId: 1 });
    fireEvent.pointerUp(rail, { clientX: 40, clientY: 120, pointerId: 1, pointerType: "touch" });
    expect(onActiveProjectChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Proyecto siguiente" }));
    expect(onActiveProjectChange).toHaveBeenCalledWith(projects[1]?.id);

    rerender(createElement(ProjectCarousel, { activeProjectId: activeProject.id, onActiveProjectChange, projects }));
    expect(screen.getByRole("list", { name: "Proyectos filtrados" })).toHaveAttribute("data-gesture-enabled", "true");
  });

  it("disables drag in reduced-motion static mode while retaining controls", () => {
    const projects = filterProjects(PROJECTS, []).slice(0, 2);
    const activeProject = projects[0];
    if (activeProject === undefined) throw new Error("Expected eligible project.");

    vi.stubGlobal("matchMedia", () => ({ addEventListener: vi.fn(), matches: true, removeEventListener: vi.fn() }));
    vi.stubGlobal("CSS", { supports: vi.fn(() => true) });
    render(createElement(ProjectCarousel, { activeProjectId: activeProject.id, onActiveProjectChange: vi.fn(), projects }));

    expect(screen.getByRole("list", { name: "Proyectos filtrados" })).toHaveAttribute("data-gesture-enabled", "false");
    expect(screen.getByRole("button", { name: "Proyecto siguiente" })).toBeEnabled();
  });
});
