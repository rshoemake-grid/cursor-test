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

export { mapApiStatusToExecutionUiStatus, normalizeApiExecutionStatusToken };
