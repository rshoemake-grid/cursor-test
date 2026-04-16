import { PROVIDER_TEMPLATES } from "./settingsConstants";

describe("PROVIDER_TEMPLATES.gemini", () => {
  it("uses current Gemini 3 preview ids and drops deprecated gemini-3-pro-preview", () => {
    const { models, defaultModel } = PROVIDER_TEMPLATES.gemini;
    expect(models).toContain("gemini-3.1-pro-preview");
    expect(models).toContain("gemini-3-flash-preview");
    expect(models).toContain("gemini-3.1-flash-lite-preview");
    expect(models).not.toContain("gemini-3-pro-preview");
    expect(defaultModel).toBe("gemini-3-flash-preview");
  });

  it("keeps Gemini 2.5 options for stable workloads", () => {
    const { models } = PROVIDER_TEMPLATES.gemini;
    expect(models).toContain("gemini-2.5-flash");
    expect(models).toContain("gemini-2.5-pro");
  });
});
