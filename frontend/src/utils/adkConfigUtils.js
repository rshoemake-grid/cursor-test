/**
 * Ensure ADK nested config is always a plain object for spreads and controlled inputs.
 * Strings (e.g. double-encoded JSON) are parsed once; invalid values become {}.
 */
function normalizeAdkConfig(raw) {
  if (raw == null) {
    return {};
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) {
      return {};
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return {};
    }
    return {};
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw;
  }
  return {};
}

/** Safe string for a text field from ADK config (never [object Object]). */
function adkConfigTextField(config, key) {
  const v = config[key];
  if (typeof v === "string") {
    return v;
  }
  if (v == null) {
    return "";
  }
  if (typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  return "";
}

export { normalizeAdkConfig, adkConfigTextField };
