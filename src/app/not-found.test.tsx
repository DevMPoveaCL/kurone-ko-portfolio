import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import NotFound from "./not-found";

describe("NotFound", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders the invalid-access plaque with one clear recovery path", () => {
    render(<NotFound />);

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Esta puerta no existe." })).toBeInTheDocument();
    expect(screen.getByText("404 · RUTA FUERA DE LA BÓVEDA")).toBeInTheDocument();
    expect(
      screen.getByText("La dirección solicitada no conduce a una sección pública del portfolio."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a la bóveda" })).toHaveAttribute("href", "/");
    expect(screen.getAllByRole("link", { name: "Volver a la bóveda" })).toHaveLength(1);
    expect(screen.getByText("404", { exact: true })).toHaveAttribute("aria-hidden", "true");
  });

  it("does not mutate browser navigation or session state while rendering", () => {
    window.sessionStorage.clear();
    const historyLength = window.history.length;
    const pushState = vi.spyOn(window.history, "pushState");
    const replaceState = vi.spyOn(window.history, "replaceState");
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    render(<NotFound />);

    expect(screen.getByRole("link", { name: "Volver a la bóveda" })).toHaveAttribute("href", "/");
    expect(window.history.length).toBe(historyLength);
    expect(pushState).not.toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(window.sessionStorage.length).toBe(0);
  });
});
