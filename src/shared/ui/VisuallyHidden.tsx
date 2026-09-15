import type { ReactNode } from "react";

interface VisuallyHiddenProps {
  children: ReactNode;
}

export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return <span className="visually-hidden">{children}</span>;
}
