/**
 * Normalize WebSocket execution `completion` payloads from the backend.
 * Handles inconsistent shapes (missing status, enum-like objects, error-only).
 */

function statusTokenFromWsCompletionResult(result) {
  if (result == null) {
    return "";
  }
  const raw = result.status;
  if (typeof raw === "string") {
    return raw.toLowerCase().trim();
  }
  if (
    raw != null &&
    typeof raw === "object" &&
    typeof raw.value === "string"
  ) {
    return raw.value.toLowerCase().trim();
  }
  return "";
}

function normalizeWsCompletionErrorField(error) {
  if (error == null) {
    return undefined;
  }
  if (typeof error === "string") {
    const t = error.trim();
    return t === "" ? undefined : error;
  }
  if (typeof error === "number" || typeof error === "boolean") {
    return String(error);
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function deriveExecutionCompletionFromWsResult(result) {
  const token = statusTokenFromWsCompletionResult(result);
  const errMsg = normalizeWsCompletionErrorField(result?.error);
  const failedByStatus = token === "failed";
  const failedByError = errMsg !== undefined;
  const status = failedByStatus || failedByError ? "failed" : "completed";
  const errorMessage = status === "failed" ? errMsg : undefined;
  return { status, errorMessage };
}

const DEFAULT_WS_EXECUTION_ERROR = "Execution error";

function formatWebSocketExecutionErrorPayload(error) {
  if (error == null) {
    return DEFAULT_WS_EXECUTION_ERROR;
  }
  if (typeof error === "string") {
    return error.trim() === "" ? DEFAULT_WS_EXECUTION_ERROR : error;
  }
  if (typeof error === "number" || typeof error === "boolean") {
    return String(error);
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export {
  deriveExecutionCompletionFromWsResult,
  formatWebSocketExecutionErrorPayload,
  normalizeWsCompletionErrorField,
  statusTokenFromWsCompletionResult,
};
