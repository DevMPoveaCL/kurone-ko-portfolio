import { StrictMode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VaultCinematicTransition, type VaultCinematicNavigationAdapter } from "./VaultCinematicTransition";

function renderTransition(play = vi.fn(() => Promise.resolve()), canPlay = () => "probably") {
  window.matchMedia = vi.fn(() => ({ matches: false })) as unknown as typeof window.matchMedia;
  Object.defineProperty(HTMLVideoElement.prototype, "canPlayType", { configurable: true, value: canPlay });
  Object.defineProperty(HTMLVideoElement.prototype, "play", { configurable: true, value: play });
  const adapter: VaultCinematicNavigationAdapter = { addTraversalListener: vi.fn(() => vi.fn()) };
  const onVisible = vi.fn(); const view = render(<VaultCinematicTransition navigationAdapter={adapter} onVisible={onVisible} />);
  return { onVisible, video: screen.queryByRole("dialog")?.querySelector("video") ?? null, view };
}

function observe() { const observations: Array<{ kind: string; name: string }> = []; const listener = (event: Event) => observations.push((event as CustomEvent<(typeof observations)[number]>).detail); window.addEventListener("kurone-ko:observability", listener); return { observations, stop: () => window.removeEventListener("kurone-ko:observability", listener) }; }

describe("VaultCinematicTransition", () => {
  afterEach(() => { Reflect.deleteProperty(navigator, "connection"); vi.restoreAllMocks(); vi.useRealTimers(); });
  it("focuses the dialog first, moves to Skip on Tab, and hands off once", async () => {
    const historyLength = history.length; const { onVisible, video } = renderTransition(); const dialog = screen.getByRole("dialog", { name: "Transición a la sala principal" }); const skip = screen.getByRole("button", { name: "Saltar introducción" });
    expect(dialog).toHaveFocus(); expect(history.length).toBe(historyLength); await userEvent.setup().tab(); expect(skip).toHaveFocus(); fireEvent.click(skip); fireEvent.ended(video!); expect(onVisible).toHaveBeenCalledTimes(1);
  });
  it("keeps the cinematic active until Skip is explicitly activated with Enter", async () => {
    const user = userEvent.setup(); const { onVisible } = renderTransition(); const dialog = screen.getByRole("dialog", { name: "Transición a la sala principal" }); const skip = screen.getByRole("button", { name: "Saltar introducción" });
    expect(dialog).toHaveFocus(); await user.tab(); expect(skip).toHaveFocus(); await user.keyboard("{Enter}"); expect(onVisible).toHaveBeenCalledOnce();
  });
  it.each(["save-data", "unsupported"])("bypasses %s without failure telemetry", (bypass) => {
    if (bypass === "save-data") Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } });
    const { observations, stop } = observe(); const { onVisible, video } = renderTransition(undefined, () => bypass === "unsupported" ? "" : "probably");
    expect(video).toBeNull(); expect(onVisible).toHaveBeenCalledOnce(); expect(observations).toEqual([]); stop();
  });
  it("clears a stall on media progress and completes healthy playback", async () => {
    vi.useFakeTimers(); const { observations, stop } = observe(); const { onVisible, video } = renderTransition();
    fireEvent.stalled(video!); fireEvent.timeUpdate(video!); await vi.advanceTimersByTimeAsync(2_000); fireEvent.ended(video!);
    expect(onVisible).toHaveBeenCalledOnce(); expect(observations.map(({ name }) => name)).toEqual(["completion"]); stop();
  });
  it.each(["error", "abort"])("reports %s as a failure", (reason) => {
    const { observations, stop } = observe(); const { onVisible, video } = renderTransition();
    if (reason === "error") fireEvent.error(video!); else fireEvent.abort(video!);
    expect(onVisible).toHaveBeenCalledOnce(); expect(observations).toContainEqual({ kind: "cinematic-failure", name: reason }); stop();
  });
  it("cancels timers and ignores a late play rejection after unmount", async () => {
    let rejectPlay!: (reason?: unknown) => void; const play = vi.fn(() => new Promise<void>((_resolve, reject) => { rejectPlay = reject; }));
    const { onVisible, video, view } = renderTransition(play); fireEvent.canPlay(video!); view.unmount(); rejectPlay(new Error("blocked")); await Promise.resolve();
    expect(onVisible).not.toHaveBeenCalled();
  });
  it("survives Strict Mode setup cleanup setup and ignores a prior generation rejection", async () => {
    let rejectPlay!: (reason?: unknown) => void;
    const play = vi.fn(() => new Promise<void>((_resolve, reject) => { rejectPlay = reject; }));
    window.matchMedia = vi.fn(() => ({ matches: false })) as unknown as typeof window.matchMedia;
    Object.defineProperty(HTMLVideoElement.prototype, "canPlayType", { configurable: true, value: () => "probably" });
    Object.defineProperty(HTMLVideoElement.prototype, "play", { configurable: true, value: play });
    const firstAdapter: VaultCinematicNavigationAdapter = { addTraversalListener: vi.fn(() => vi.fn()) };
    const secondAdapter: VaultCinematicNavigationAdapter = { addTraversalListener: vi.fn(() => vi.fn()) };
    const onVisible = vi.fn();
    const view = render(<StrictMode><VaultCinematicTransition navigationAdapter={firstAdapter} onVisible={onVisible} /></StrictMode>);
    const video = screen.getByRole("dialog").querySelector("video")!;
    fireEvent.canPlay(video);
    view.rerender(<StrictMode><VaultCinematicTransition navigationAdapter={secondAdapter} onVisible={onVisible} /></StrictMode>);
    rejectPlay(new Error("blocked"));
    await Promise.resolve();
    expect(onVisible).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Saltar introducción" }));
    expect(onVisible).toHaveBeenCalledOnce();
  });
});
