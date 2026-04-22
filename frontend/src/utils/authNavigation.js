import { STORAGE_KEYS } from "../config/constants";

/**
 * Where to send the user after a successful login/register.
 * Prefers a rich snapshot saved on {@code auth:unauthorized}; falls back to {@code location.state.from}.
 *
 * @param {Storage | null | undefined} sessionStorageLike
 * @param {{ from?: string } | null | undefined} locationState
 * @returns {{ target: string, state: { authRestore?: Record<string, unknown> } | undefined }}
 */
function getPostAuthNavigationTarget(sessionStorageLike, locationState) {
  let target = "/";
  let state = undefined;
  if (sessionStorageLike) {
    try {
      const raw = sessionStorageLike.getItem(STORAGE_KEYS.AUTH_RETURN_CONTEXT);
      if (raw) {
        const ctx = JSON.parse(raw);
        sessionStorageLike.removeItem(STORAGE_KEYS.AUTH_RETURN_CONTEXT);
        const path = `${ctx.pathname || "/"}${ctx.search || ""}`;
        target = path && path !== "" ? path : "/";
        state = { authRestore: ctx };
        return { target, state };
      }
    } catch {
      /* ignore */
    }
  }
  if (
    locationState?.from &&
    typeof locationState.from === "string" &&
    locationState.from !== "/auth"
  ) {
    target = locationState.from;
  }
  return { target, state };
}

export { getPostAuthNavigationTarget };
