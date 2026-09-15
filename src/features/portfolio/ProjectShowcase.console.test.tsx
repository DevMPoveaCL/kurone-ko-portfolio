import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MainHall } from "./MainHall";
import { PROJECT_UNLOCK_CONSOLE_CLUE } from "./hidden-project-unlock";

describe("ProjectShowcase console clue", () => {
  afterEach(() => vi.restoreAllMocks());

  it("logs exactly once when the showcase starts, including Strict Mode remounts", async () => {
    const user = userEvent.setup();
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => undefined);

    expect(consoleInfo).not.toHaveBeenCalled();
    const rendered = render(
      <StrictMode>
        <MainHall />
      </StrictMode>,
    );

    await screen.findByRole("list", { name: "Proyectos filtrados" });
    await waitFor(() => expect(consoleInfo).toHaveBeenCalledTimes(1));
    expect(consoleInfo).toHaveBeenCalledWith(PROJECT_UNLOCK_CONSOLE_CLUE);

    rendered.rerender(
      <StrictMode>
        <MainHall />
      </StrictMode>,
    );
    await user.click(screen.getByRole("button", { name: "Proyecto siguiente" }));
    await user.click(screen.getByRole("button", { name: /Filtros/ }));
    await user.type(screen.getByRole("searchbox", { name: "Buscar tecnología" }), "narrador");
    await screen.findByRole("dialog", { name: "PROYECTOS DESBLOQUEADOS" }, { timeout: 4_000 });

    expect(consoleInfo).toHaveBeenCalledTimes(1);
  }, 10_000);
});
