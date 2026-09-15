import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { BugCesantePlayerProvider } from "./BugCesantePlayer";
import { ProfessionalVoidState } from "./ProfessionalVoidState";

function renderVoid() {
  function Harness() {
    const socialFocusRef = useRef<HTMLAnchorElement>(null);
    return (
      <BugCesantePlayerProvider>
        <ProfessionalVoidState socialFocusRef={socialFocusRef} />
      </BugCesantePlayerProvider>
    );
  }

  return render(<Harness />);
}

async function waitBeyondPreviousFocusFlash() {
  await new Promise((resolve) => window.setTimeout(resolve, 1_100));
}

describe("ProfessionalVoidState", () => {
  it("keeps the desktop authorized quote phrase and author on separate semantic blocks", async () => {
    renderVoid();

    await waitFor(() => expect(document.querySelector(".professional-void-quote-text")).toHaveTextContent("“Mi primer trabajo como desarrollador, encontrar busco; al lado oscuro de la cesantía, caer no debo.”", { normalizeWhitespace: false }));
    expect(screen.getByText("— Joda", { exact: true })).toBeInTheDocument();
    expect(document.querySelector(".professional-void-quote")).toBeInstanceOf(HTMLParagraphElement);
    expect(document.querySelector(".professional-void-quote > .visually-hidden")).not.toBeInTheDocument();
  });

  it("uses only the authorized mobile quote phrase on a coarse viewport", async () => {
    renderVoid();

    const mobileText = () => document.querySelector(".professional-void-quote-mobile .professional-void-quote-text");
    await waitFor(() => expect(mobileText()).toHaveTextContent("Mi primer trabajo como desarrollador, encontrar busco;", { normalizeWhitespace: false }));
    expect(document.querySelectorAll(".professional-void-quote-mobile .professional-void-quote-text")).toHaveLength(1);
    expect(mobileText()?.textContent).toBe("Mi primer trabajo como desarrollador, encontrar busco;\n...Al lado oscuro de la cesantía, caer no debo");
    expect(document.querySelector(".professional-void-quote")?.getAttribute("aria-label"))
      .toBe("“Mi primer trabajo como desarrollador, encontrar busco; al lado oscuro de la cesantía, caer no debo.”");
    expect(document.querySelector(".professional-void-quote-mobile"))
      .toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the remembered action focused after a passive return settles", async () => {
    renderVoid();

    const linkedin = screen.getByRole("link", { name: "LinkedIn" });
    const github = screen.getByRole("link", { name: "GitHub" });
    const voidState = screen.getByRole("region", { name: "Marco Povea" });

    await waitFor(() => expect(linkedin).toHaveFocus());
    window.dispatchEvent(new Event("blur"));
    window.dispatchEvent(new Event("focus"));
    fireEvent.pointerDown(voidState, { button: 0 });
    fireEvent.pointerUp(voidState, { button: 0 });
    fireEvent.click(voidState);

    await waitBeyondPreviousFocusFlash();
    expect(linkedin).toHaveFocus();

    fireEvent.keyDown(linkedin, { key: "ArrowRight" });
    expect(github).toHaveFocus();
  });

  it("lets a different actionable target win during the return sequence", async () => {
    renderVoid();

    const linkedin = screen.getByRole("link", { name: "LinkedIn" });
    const github = screen.getByRole("link", { name: "GitHub" });
    await waitFor(() => expect(linkedin).toHaveFocus());

    window.dispatchEvent(new Event("blur"));
    window.dispatchEvent(new Event("focus"));
    fireEvent.pointerDown(github, { button: 0 });
    github.focus();
    fireEvent.pointerUp(github, { button: 0 });
    fireEvent.click(github);

    await waitBeyondPreviousFocusFlash();
    expect(github).toHaveFocus();
  });

});
