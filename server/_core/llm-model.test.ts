import { describe, expect, it } from "vitest";
import { normalizeModelName } from "./llm";

describe("LLM model compatibility", () => {
  it("migra o modelo Gemini indisponível para o modelo recomendado", () => {
    expect(normalizeModelName("gemini-2.5-flash")).toBe("gemini-3.6-flash");
  });

  it("preserva modelos explicitamente configurados que ainda não foram descontinuados", () => {
    expect(normalizeModelName("gemini-3.6-flash")).toBe("gemini-3.6-flash");
    expect(normalizeModelName("custom-model")).toBe("custom-model");
  });
});
