import { describe, expect, it, vi } from "vitest";
import { createBrowserNavigationAdapter, type VaultCinematicTraversalEvent } from "./VaultCinematicTransition";
import { shouldBypassVaultCinematic } from "./vault-cinematic";

function traversal(cancelable = true, sameDocument = true) {
  return Object.assign(new Event("navigate", { cancelable }), {
    destination: { sameDocument }, navigationType: "traverse",
  }) as VaultCinematicTraversalEvent;
}

describe("vault cinematic hardening boundaries", () => {
  it.each([
    [{ saveData: true }, true], [{ effectiveType: "2g" }, true], [{ supported: false }, true],
    [{ coarse: true, width: 768, deviceMemory: 4 }, false], [{ coarse: true, width: 768, hardwareConcurrency: 4 }, false],
    [{ coarse: true, width: 769, deviceMemory: 4 }, false], [{ coarse: true, width: 768, hardwareConcurrency: 5 }, false],
  ])("applies boundary policy %#", (capabilities, bypassed) => expect(shouldBypassVaultCinematic(capabilities)).toBe(bypassed));

  it("filters browser navigation events and detaches its listener", () => {
    const navigation = new EventTarget();
    Object.defineProperty(window, "navigation", { configurable: true, value: navigation });
    const listener = vi.fn(); const cleanup = createBrowserNavigationAdapter()?.addTraversalListener(listener);
    navigation.dispatchEvent(traversal()); navigation.dispatchEvent(traversal(false)); navigation.dispatchEvent(traversal(true, false)); cleanup?.(); navigation.dispatchEvent(traversal());
    expect(listener).toHaveBeenCalledTimes(1);
    Object.defineProperty(window, "navigation", { configurable: true, value: undefined });
    expect(createBrowserNavigationAdapter()).toBeNull();
  });
});
