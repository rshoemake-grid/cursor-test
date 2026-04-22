import { mergeGeminiProviderModelsFromTemplate } from "./mergeGeminiProviderModelsFromTemplate";

describe("mergeGeminiProviderModelsFromTemplate", () => {
  it("prepends template Gemini models before saved ones, deduped", () => {
    const out = mergeGeminiProviderModelsFromTemplate([
      {
        id: "g1",
        type: "gemini",
        name: "Google Gemini",
        models: ["gemini-3-flash-preview", "custom-gemini"],
      },
      { id: "o1", type: "openai", name: "OpenAI", models: ["gpt-4"] },
    ]);
    expect(out[1]).toEqual({
      id: "o1",
      type: "openai",
      name: "OpenAI",
      models: ["gpt-4"],
    });
    expect(out[0].models[0]).toBe("gemini-3-pro-preview");
    expect(out[0].models).toContain("gemini-3-flash-preview");
    expect(out[0].models).toContain("custom-gemini");
  });

  it("returns non-array unchanged", () => {
    expect(mergeGeminiProviderModelsFromTemplate(null)).toBe(null);
  });

  it("omits null and undefined provider slots", () => {
    const out = mergeGeminiProviderModelsFromTemplate([
      null,
      void 0,
      {
        id: "o1",
        type: "openai",
        name: "OpenAI",
        models: ["gpt-4"],
      },
    ]);
    expect(out).toEqual([
      {
        id: "o1",
        type: "openai",
        name: "OpenAI",
        models: ["gpt-4"],
      },
    ]);
  });
});
