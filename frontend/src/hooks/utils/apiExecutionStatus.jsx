/**
 * Map GET /executions/{id} (or similar) payload to UI execution status.
 * Defensive against casing, enum-shaped JSON, canceled vs cancelled, and
 * DB rows where completed_at is set while status still shows running.
 */

function normalizeApiExecutionStatusToken(raw) {
  if (raw == null) {
    return "";
  }
  if (typeof raw === "string") {
    return raw.trim().toLowerCase();
  }
  if (
    typeof raw === "object" &&
    raw !== null &&
    typeof raw.value === "string"
  ) {
    return raw.value.trim().toLowerCase();
  }
  return "";
}

function mapApiStatusToExecutionUiStatus(execution) {
  if (execution == null) {
    return null;
  }
  const tokenIn = normalizeApiExecutionStatusToken(execution.status);
  const token = tokenIn === "canceled" ? "cancelled" : tokenIn;
  if (token === "completed") {
    return "completed";
  }
  if (token === "failed") {
    return "failed";
  }
  if (token === "cancelled") {
    return "cancelled";
  }
  const hasCompletedAt =
    execution.completed_at != null && execution.completed_at !== "";
  if (
    hasCompletedAt === true &&
    (token === "running" || token === "pending" || token === "")
  ) {
    const hasErr =
      execution.error != null && String(execution.error).trim() !== "";
    return hasErr === true ? "failed" : "completed";
  }
  if (token === "running" || token === "pending") {
    return "running";
  }
  if (token === "paused") {
    return "running";
  }
  if (token === "") {
    return null;
  }
  return null;
}

/**
 * List/detail rows: coerce `status` to a UI string so filters, badges, and icons
 * work even when the API returns enum-shaped JSON.
 */
function normalizeExecutionListItem(raw) {
  if (raw == null || typeof raw !== "object") {
    return raw;
  }
  const mapped = mapApiStatusToExecutionUiStatus(raw);
  const fallback = normalizeApiExecutionStatusToken(raw.status);
  const status =
    mapped ?? (fallback !== "" ? fallback : null) ?? "pending";
  return { ...raw, status };
}

/**
 * GET /executions/{id} embeds logs from persisted state; that can be empty briefly
 * or missing while `GET /executions/{id}/logs` still has lines. Hydrate for terminal runs.
 */
async function hydrateExecutionLogsIfEmpty(apiClient, snapshot) {
  if (snapshot == null || typeof snapshot !== "object") {
    return snapshot;
  }
  const logs = Array.isArray(snapshot.logs) ? snapshot.logs : [];
  if (logs.length > 0) {
    return snapshot;
  }
  if (apiClient == null || typeof apiClient.getExecutionLogs !== "function") {
    return snapshot;
  }
  const id = snapshot.execution_id;
  if (id == null || id === "") {
    return snapshot;
  }
  const mapped = mapApiStatusToExecutionUiStatus(snapshot);
  const hasErr =
    snapshot.error != null && String(snapshot.error).trim() !== "";
  const hasCompletedAt =
    snapshot.completed_at != null && snapshot.completed_at !== "";
  const terminal =
    mapped === "failed" ||
    mapped === "completed" ||
    mapped === "cancelled" ||
    (hasCompletedAt === true && hasErr === true);
  if (terminal !== true) {
    return snapshot;
  }
  try {
    const lr = await apiClient.getExecutionLogs(id, {
      limit: 10000,
      offset: 0,
    });
    const fetched = lr?.logs && Array.isArray(lr.logs) ? lr.logs : [];
    if (fetched.length > 0) {
      return { ...snapshot, logs: fetched };
    }
  } catch (_e) {
    /* keep snapshot */
  }
  return snapshot;
}

export {
  mapApiStatusToExecutionUiStatus,
  normalizeApiExecutionStatusToken,
  normalizeExecutionListItem,
  hydrateExecutionLogsIfEmpty,
};
