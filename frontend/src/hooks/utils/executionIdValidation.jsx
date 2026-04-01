const PENDING_EXECUTION_PREFIX = "pending-";
function isPendingExecutionId(executionId) {
  if (executionId == null || executionId === "") {
    return false;
  }
  return executionId.startsWith(PENDING_EXECUTION_PREFIX);
}
function isTemporaryExecutionId(executionId) {
  return isPendingExecutionId(executionId);
}
function isRealExecutionId(executionId) {
  if (!isValidExecutionId(executionId)) {
    return false;
  }
  return !isPendingExecutionId(executionId);
}
function isValidExecutionId(executionId) {
  return executionId != null && executionId !== "";
}
function executionIdStartsWith(executionId, prefix) {
  if (!isValidExecutionId(executionId)) {
    return false;
  }
  if (executionId.startsWith == null) {
    return false;
  }
  return executionId.startsWith(prefix);
}
function shouldLogExecutionError(exec) {
  if (exec == null) {
    return false;
  }
  if (exec.id == null) {
    return false;
  }
  return isRealExecutionId(exec.id);
}
export {
  executionIdStartsWith,
  isPendingExecutionId,
  isRealExecutionId,
  isTemporaryExecutionId,
  isValidExecutionId,
  shouldLogExecutionError
};
