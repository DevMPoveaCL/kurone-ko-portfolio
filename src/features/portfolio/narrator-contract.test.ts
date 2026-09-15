import { describe, expect, it } from "vitest";
import { KURONEKO_NARRATOR_CONTRACT } from "./narrator-contract";

describe("Kuroneko narrator contract", () => {
  it("frames the builder as a learner and rejects arrogant self-praise", () => {
    expect(KURONEKO_NARRATOR_CONTRACT.voice).toMatch(/testigo/i);
    expect(KURONEKO_NARRATOR_CONTRACT.framing).toMatch(/aprende|itera/i);
    expect(KURONEKO_NARRATOR_CONTRACT.antiArrogance).toMatch(/evitar|superioridad|genio|dominio total/i);
    expect(KURONEKO_NARRATOR_CONTRACT.recruiterClarity).toMatch(/qué se hizo|por qué importa|qué falta mejorar/i);
  });
});
