import { PROVIDER_TEMPLATES } from "../../constants/settingsConstants";

/**
 * Merges each Gemini provider's {@code models} with the current app template so
 * saved settings (API/localStorage) pick up new model IDs (e.g. gemini-3.1-*)
 * without forcing users to delete and re-add the provider.
 */
function mergeGeminiProviderModelsFromTemplate(providers) {
  if (!Array.isArray(providers)) {
    return providers;
  }
  const tmpl = PROVIDER_TEMPLATES.gemini;
  if (!tmpl || !Array.isArray(tmpl.models) || tmpl.models.length === 0) {
    return providers;
  }
  return providers.map((p) => {
    if (p.type !== "gemini") {
      return p;
    }
    const saved = Array.isArray(p.models) ? p.models : [];
    const seen = new Set();
    const out = [];
    for (const m of tmpl.models) {
      if (typeof m === "string" && !seen.has(m)) {
        seen.add(m);
        out.push(m);
      }
    }
    for (const m of saved) {
      if (typeof m === "string" && !seen.has(m)) {
        seen.add(m);
        out.push(m);
      }
    }
    return { ...p, models: out };
  });
}

export { mergeGeminiProviderModelsFromTemplate };
