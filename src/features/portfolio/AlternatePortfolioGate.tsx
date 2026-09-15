"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { withPublicPath } from "@/shared/routing/public-path";
import { PROJECT_UNLOCK_CHALLENGES } from "./hidden-project-unlock";
import { AlternatePortfolio } from "./AlternatePortfolio";
import {
  consumeAlternateHandoff,
  readSessionProgression,
  resetSessionProgressionForDocumentReload,
  writeSessionProgression,
} from "./session-progression";
import { VAULT_SEALS } from "./vault-seals";

const ALTERNATE_GATE_PHASE = {
  CHECKING: "checking",
  ALLOWED: "allowed",
} as const;

type AlternateGatePhase =
  (typeof ALTERNATE_GATE_PHASE)[keyof typeof ALTERNATE_GATE_PHASE];

export function AlternatePortfolioGate() {
  const router = useRouter();
  const [phase, setPhase] = useState<AlternateGatePhase>(
    ALTERNATE_GATE_PHASE.CHECKING,
  );

  useLayoutEffect(() => {
    if (resetSessionProgressionForDocumentReload()) {
      window.history.replaceState(null, "", withPublicPath("/"));
      router.replace("/");
      return;
    }

    const options = {
      challengeIds: PROJECT_UNLOCK_CHALLENGES.map((challenge) => challenge.id),
      sealIds: VAULT_SEALS.map((seal) => seal.id),
    };
    const progression = readSessionProgression(options);
    const consumed = consumeAlternateHandoff(progression);
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      if (progression.alternateResidency === "active") {
        setPhase(ALTERNATE_GATE_PHASE.ALLOWED);
        return;
      }

      if (consumed !== null) {
        writeSessionProgression(consumed);
        setPhase(ALTERNATE_GATE_PHASE.ALLOWED);
        return;
      }

      router.replace("/");
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (phase !== ALTERNATE_GATE_PHASE.ALLOWED) {
    return (
      <main aria-busy="true" className="portfolio-route-gate" id="main-content">
        <span className="visually-hidden">Validando acceso.</span>
      </main>
    );
  }

  return <AlternatePortfolio />;
}
