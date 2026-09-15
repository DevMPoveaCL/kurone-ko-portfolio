import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExternalLink, ExternalNavigationProvider } from "./ExternalNavigation";

function renderExternalLink(confirmationPurpose = "Redirección a mi perfil de GitHub") {
  return render(
    <ExternalNavigationProvider>
      <ExternalLink
        {...(confirmationPurpose === undefined ? {} : { confirmationPurpose })}
        href="https://github.com/DevMPoveaCL/software-engineering-playbook"
      >
        Abrir destino
      </ExternalLink>
    </ExternalNavigationProvider>,
  );
}

describe("ExternalNavigation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("centralizes the custom purpose grammar and the new-tab clause exactly once", async () => {
    const user = userEvent.setup();
    renderExternalLink("Explorarás Software Engineering Playbook en su repositorio de GitHub");

    await user.click(screen.getByRole("link", { name: "Abrir destino" }));
    const description = await screen.findByRole("paragraph");

    expect(description).toBeVisible();
    expect(description).toHaveAttribute("aria-label", "Explorarás Software Engineering Playbook en su repositorio de GitHub (se abrirá en una pestaña nueva).");
    expect(description.querySelector(".external-navigation-description-note")).toHaveTextContent(/^\(se abrirá en una pestaña nueva\)\.$/u);
    expect(description.textContent).toContain("Explorarás Software Engineering Playbook en su repositorio de GitHub");
    expect(screen.getByRole("heading", { name: "Vas a salir del portafolio" })).toBeVisible();
  });

  it("uses the hostname fallback and preserves arrow, Escape, Continue, and restoration focus", async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    renderExternalLink();

    const link = screen.getByRole("link", { name: "Abrir destino" });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
    await user.click(link);

    const dialog = await screen.findByRole("dialog", { name: "Vas a salir del portafolio" });
    const description = screen.getByRole("paragraph");
    expect(description).toHaveAttribute("aria-label", "Redirección a mi perfil de GitHub (se abrirá en una pestaña nueva).");
    expect(description.querySelector(".external-navigation-description-purpose")).toHaveTextContent("Redirección a mi perfil de GitHub");
    expect(description.querySelector(".external-navigation-description-note")).toHaveTextContent(/^\(se abrirá en una pestaña nueva\)\.$/u);
    const cancel = screen.getByRole("button", { name: "Cancelar" });
    const continueButton = screen.getByRole("button", { name: "Continuar" });
    await waitFor(() => expect(cancel).toHaveFocus());

    await user.keyboard("{ArrowRight}");
    expect(continueButton).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(cancel).toHaveFocus();
    await user.keyboard("{Tab}");
    expect(continueButton).toHaveFocus();
    await user.keyboard("{Tab}");
    expect(cancel).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(dialog).not.toBeVisible());
    await waitFor(() => expect(link).toHaveFocus());

    await user.click(link);
    await waitFor(() => expect(cancel).toHaveFocus());
    await user.click(continueButton);

    expect(open).toHaveBeenCalledWith(
      "https://github.com/DevMPoveaCL/software-engineering-playbook",
      "_blank",
      "noopener,noreferrer",
    );
    await waitFor(() => expect(link).toHaveFocus());
  });

  it("uses the personalized LinkedIn destination copy", async () => {
    const user = userEvent.setup();
    render(
      <ExternalNavigationProvider>
        <ExternalLink confirmationPurpose="Redirección a mi perfil de LinkedIn" href="https://www.linkedin.com/in/marco-povea-b21038258/">
          LinkedIn
        </ExternalLink>
      </ExternalNavigationProvider>,
    );

    await user.click(screen.getByRole("link", { name: "LinkedIn" }));
    const description = screen.getByRole("paragraph");
    expect(description).toHaveAttribute("aria-label", "Redirección a mi perfil de LinkedIn (se abrirá en una pestaña nueva).");
    expect(description.querySelector(".external-navigation-description-purpose")).toHaveTextContent("Redirección a mi perfil de LinkedIn");
    expect(description.querySelector(".external-navigation-description-note")).toHaveTextContent(/^\(se abrirá en una pestaña nueva\)\.$/u);
  });

  it.each(["Enter", " "]) ("opens the confirmation dialog exactly once with %s", async (key) => {
    const user = userEvent.setup();
    renderExternalLink();
    const link = screen.getByRole("link", { name: "Abrir destino" });

    link.focus();
    await user.keyboard(key === "Enter" ? "{Enter}" : " ");

    expect(screen.getAllByRole("dialog", { name: "Vas a salir del portafolio" })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { name: "Vas a salir del portafolio" })).toHaveLength(1);
  });
});
