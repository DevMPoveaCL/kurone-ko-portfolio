import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AppError from "./error";

describe("AppError", () => {
  it("renders recovery content and invokes reset", () => {
    const reset = vi.fn();
    const error = Object.assign(new Error("route failed"), { digest: "safe-digest" });

    render(<AppError error={error} reset={reset} />);

    expect(screen.getByRole("heading", { name: "La bóveda no pudo abrirse." })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Intentar de nuevo" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
