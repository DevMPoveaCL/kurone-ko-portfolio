"use client";

import { useEffect } from "react";
import { reportBrowserObservation } from "./Observability";

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    reportBrowserObservation({
      kind: "app-error",
      name: "route-error",
      ...(error.digest === undefined ? {} : { digest: error.digest }),
    });
    console.error("[kurone-ko] app-error", { digest: error.digest });
  }, [error]);

  return (
    <main className="recovery-page" id="main-content">
      <h1>La bóveda no pudo abrirse.</h1>
      <p>El contenido del portfolio sigue disponible al recargar esta página.</p>
      <button onClick={reset} type="button">Intentar de nuevo</button>
    </main>
  );
}
