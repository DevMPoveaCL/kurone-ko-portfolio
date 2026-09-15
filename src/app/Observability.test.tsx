import { createObservationConsumer } from "./Observability";
import { describe, expect, it, vi } from "vitest";

describe("observability consumer", () => {
  it("bounds aggregate keys, warns once at the error threshold, and posts only aggregates to a same-origin endpoint", async () => {
    const warning = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal("fetch", fetchMock);
    const consumer = createObservationConsumer("/observability", warning);

    for (let index = 0; index < 35; index += 1) {
      consumer.observe({ kind: "web-vital", name: `metric-${index}` });
    }

    consumer.observe({ kind: "frame-error", name: "intro-frame", assetIndex: 3, assetType: "intro-frame" });
    consumer.observe({ kind: "frame-timeout", name: "intro-frame", assetIndex: 4, assetType: "intro-frame" });
    consumer.observe({ kind: "frame-degraded", name: "intro-frame", assetIndex: 0, assetType: "intro-frame" });

    await Promise.resolve();

    const aggregate = consumer.snapshot();
    expect(Object.keys(aggregate.observations)).toHaveLength(32);
    expect(aggregate.errors).toBe(3);
    expect(warning).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://localhost:3000/observability",
      expect.objectContaining({ body: JSON.stringify(aggregate), method: "POST" }),
    );
  });

  it("rejects cross-origin endpoints", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const consumer = createObservationConsumer("https://telemetry.example.test/collect");

    consumer.observe({ kind: "web-vital", name: "LCP" });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
