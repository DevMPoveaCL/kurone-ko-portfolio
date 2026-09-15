"use client";

import { useEffect, useRef } from "react";
import { useReportWebVitals } from "next/web-vitals";

const OBSERVATION_KIND = {
  WEB_VITAL: "web-vital",
  APP_ERROR: "app-error",
  FRAME_TIMEOUT: "frame-timeout",
  FRAME_ERROR: "frame-error",
  FRAME_DEGRADED: "frame-degraded",
  FRAME_RECOVERY: "frame-recovery",
  CINEMATIC_FAILURE: "cinematic-failure",
  CINEMATIC_LATENCY: "cinematic-latency",
} as const;

const OBSERVABILITY_EVENT = "kurone-ko:observability";
const OBSERVABILITY_WARNING_THRESHOLD = 3;
const OBSERVABILITY_CAPACITY = 32;

type ObservationKind = (typeof OBSERVATION_KIND)[keyof typeof OBSERVATION_KIND];

export interface BrowserObservation {
  kind: ObservationKind;
  name: string;
  value?: number;
  id?: string;
  digest?: string;
  assetIndex?: number;
  assetType?: "intro-frame";
}

export interface ObservationAggregate {
  errors: number;
  metrics: number;
  observations: Record<string, number>;
}

interface ObservationConsumer {
  observe: (observation: BrowserObservation) => void;
  snapshot: () => ObservationAggregate;
}

function isErrorObservation(observation: BrowserObservation) {
  return observation.kind !== OBSERVATION_KIND.WEB_VITAL && observation.kind !== OBSERVATION_KIND.CINEMATIC_LATENCY;
}

function getObservationKey(observation: BrowserObservation) {
  return `${observation.kind}:${observation.name}`;
}

function getSameOriginEndpoint(endpoint: string | undefined) {
  if (endpoint === undefined || endpoint.length === 0 || typeof window === "undefined") {
    return null;
  }

  const url = new URL(endpoint, window.location.origin);

  return url.origin === window.location.origin ? url.toString() : null;
}

export function createObservationConsumer(
  endpoint = process.env.NEXT_PUBLIC_OBSERVABILITY_ENDPOINT,
  emitWarning: (payload: ObservationAggregate) => void = (payload) => console.warn("[kurone-ko] observability-threshold", payload),
): ObservationConsumer {
  const observations = new Map<string, number>();
  let errors = 0;
  let metrics = 0;
  let warned = false;
  const snapshot = (): ObservationAggregate => ({ errors, metrics, observations: Object.fromEntries(observations) });

  return {
    observe(observation) {
      const key = getObservationKey(observation);
      observations.set(key, (observations.get(key) ?? 0) + 1);

      if (observations.size > OBSERVABILITY_CAPACITY) {
        const oldestKey = observations.keys().next().value;

        if (oldestKey !== undefined) {
          observations.delete(oldestKey);
        }
      }

      if (isErrorObservation(observation)) {
        errors += 1;
      } else {
        metrics += 1;
      }

      const aggregate = snapshot();

      if (!warned && errors >= OBSERVABILITY_WARNING_THRESHOLD) {
        warned = true;
        emitWarning(aggregate);
      }

      const sameOriginEndpoint = getSameOriginEndpoint(endpoint);

      if (sameOriginEndpoint !== null) {
        void fetch(sameOriginEndpoint, {
          body: JSON.stringify(aggregate),
          headers: { "content-type": "application/json" },
          keepalive: true,
          method: "POST",
        }).catch(() => console.warn("[kurone-ko] observability-delivery-failed", { endpoint: "same-origin" }));
      }
    },
    snapshot,
  };
}

export function reportBrowserObservation(observation: BrowserObservation) {
  window.dispatchEvent(new CustomEvent<BrowserObservation>(OBSERVABILITY_EVENT, { detail: observation }));
}

export function Observability() {
  const consumerRef = useRef<ObservationConsumer | null>(null);

  if (consumerRef.current === null) {
    consumerRef.current = createObservationConsumer();
  }

  useEffect(() => {
    const consume = (event: Event) => {
      const observation = (event as CustomEvent<BrowserObservation>).detail;

      if (observation !== undefined) {
        consumerRef.current?.observe(observation);
      }
    };

    window.addEventListener(OBSERVABILITY_EVENT, consume);

    return () => window.removeEventListener(OBSERVABILITY_EVENT, consume);
  }, []);

  useReportWebVitals((metric) => {
    reportBrowserObservation({
      kind: OBSERVATION_KIND.WEB_VITAL,
      name: metric.name,
      value: metric.value,
      id: metric.id,
    });
  });

  return null;
}
