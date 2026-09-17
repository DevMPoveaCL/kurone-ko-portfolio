import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useTouchActivation } from "./touch-activation";

function TouchActivationProbe({
  onActivate,
  onClick,
}: {
  onActivate: () => void;
  onClick: () => void;
}) {
  const touchActivation = useTouchActivation(onActivate);
  return (
    <button type="button" {...touchActivation} onClick={onClick}>
      Activate
    </button>
  );
}

function setButtonBounds(button: HTMLButtonElement) {
  vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
    bottom: 150,
    height: 100,
    left: 100,
    right: 300,
    top: 50,
    width: 200,
    x: 100,
    y: 50,
    toJSON: () => ({}),
  } as DOMRect);
}

function fireTouchTap(button: HTMLButtonElement, pointerId = 1) {
  fireEvent.pointerDown(button, {
    button: 0,
    clientX: 200,
    clientY: 100,
    isPrimary: true,
    pointerId,
    pointerType: "touch",
  });
  fireEvent.pointerUp(button, {
    button: 0,
    clientX: 200,
    clientY: 100,
    isPrimary: true,
    pointerId,
    pointerType: "touch",
  });
}

describe("touch activation", () => {
  it("activates a touch pointerup without requiring a click", () => {
    const onActivate = vi.fn();
    const onClick = vi.fn();
    render(<TouchActivationProbe onActivate={onActivate} onClick={onClick} />);
    const button = screen.getByRole("button", {
      name: "Activate",
    }) as HTMLButtonElement;
    setButtonBounds(button);

    fireTouchTap(button);

    expect(onActivate).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("suppresses only the compatibility click paired with a touch activation", () => {
    const onActivate = vi.fn();
    const onClick = vi.fn();
    render(<TouchActivationProbe onActivate={onActivate} onClick={onClick} />);
    const button = screen.getByRole("button", {
      name: "Activate",
    }) as HTMLButtonElement;
    setButtonBounds(button);

    fireTouchTap(button);
    const compatibilityClick = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      detail: 1,
    });
    button.dispatchEvent(compatibilityClick);

    expect(onActivate).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
    expect(compatibilityClick.defaultPrevented).toBe(true);
  });

  it.each(["cancel", "movement"])(
    "does not activate or suppress a later tap after %s",
    (failure) => {
      const onActivate = vi.fn();
      const onClick = vi.fn();
      render(
        <TouchActivationProbe onActivate={onActivate} onClick={onClick} />,
      );
      const button = screen.getByRole("button", {
        name: "Activate",
      }) as HTMLButtonElement;
      setButtonBounds(button);

      fireEvent.pointerDown(button, {
        button: 0,
        clientX: 200,
        clientY: 100,
        isPrimary: true,
        pointerId: 1,
        pointerType: "touch",
      });
      if (failure === "cancel") {
        fireEvent.pointerCancel(button, { pointerId: 1, pointerType: "touch" });
      } else {
        fireEvent.pointerUp(button, {
          clientX: 220,
          clientY: 100,
          isPrimary: true,
          pointerId: 1,
          pointerType: "touch",
        });
      }
      expect(onActivate).not.toHaveBeenCalled();

      fireEvent.click(button, { detail: 1 });
      expect(onClick).toHaveBeenCalledOnce();

      fireTouchTap(button, 2);
      expect(onActivate).toHaveBeenCalledOnce();
    },
  );

  it("leaves mouse and keyboard activation on native onClick", async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    const onClick = vi.fn();
    render(<TouchActivationProbe onActivate={onActivate} onClick={onClick} />);
    const button = screen.getByRole("button", {
      name: "Activate",
    }) as HTMLButtonElement;

    await user.click(button);
    expect(onActivate).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledOnce();

    button.focus();
    await user.keyboard("{Enter}");
    expect(onActivate).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
