function isRunningStatus(status) {
  return status === "running";
}
function isCompletedStatus(status) {
  return status === "completed";
}
function isFailedStatus(status) {
  return status === "failed";
}
function isPausedStatus(status) {
  return status === "paused";
}
function isTerminatedStatus(status) {
  return status === "completed" || status === "failed";
}
function hasStatusChanged(oldStatus, newStatus) {
  return oldStatus !== newStatus;
}
function normalizeExecutionStatus(status) {
  if (status === "completed") {
    return "completed";
  }
  if (status === "failed") {
    return "failed";
  }
  if (status === "paused") {
    return "running";
  }
  return "running";
}
export {
  hasStatusChanged,
  isCompletedStatus,
  isFailedStatus,
  isPausedStatus,
  isRunningStatus,
  isTerminatedStatus,
  normalizeExecutionStatus,
};
