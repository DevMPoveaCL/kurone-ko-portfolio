import type { ButtonHTMLAttributes, ReactNode } from "react";

export const BUTTON_VARIANT = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  GHOST: "ghost",
} as const;

export type ButtonVariant = (typeof BUTTON_VARIANT)[keyof typeof BUTTON_VARIANT];

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
}

export function Button({ children, className, variant = BUTTON_VARIANT.SECONDARY, ...props }: ButtonProps) {
  const variantClassName = `button button-${variant}`;
  const resolvedClassName = className ? `${variantClassName} ${className}` : variantClassName;

  return (
    <button className={resolvedClassName} {...props}>
      {children}
    </button>
  );
}
