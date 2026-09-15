import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MainHall } from "./MainHall";

describe("MainHall", () => {
  it("renders the main project hall landmark", () => {
    render(<MainHall />);

    expect(screen.getByRole("region", { name: "Sala principal de proyectos" })).toBeInTheDocument();
  });

  it("renders the scene-only Main Hall composition", () => {
    render(<MainHall />);

    expect(screen.queryByText("Sala principal")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Una obra en construcción" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Sala principal de proyectos" })).toBeInTheDocument();
  });

  it("keeps the interaction surface available for the deferred showcase", () => {
    render(<MainHall />);

    expect(document.querySelector(".main-hall-interaction-surface")).toBeInTheDocument();
  });
});
