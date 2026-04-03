import { logicalOr } from "./logicalOr";
import { EXECUTION_STATUS } from "./websocketConstants";
import { isTemporaryExecutionId } from "./executionIdValidation";
class ExecutionStatusChecker {
  /**
   * Check if execution status indicates completion or failure
   * Mutation-resistant: uses constants for status comparisons
   */
  static isTerminated(status, lastKnownStatus) {
    const currentStatus = logicalOr(status, lastKnownStatus);
    return (
      currentStatus === EXECUTION_STATUS.COMPLETED ||
      currentStatus === EXECUTION_STATUS.FAILED
    );
  }
  /**
   * Check if connection should be skipped
   * Mutation-resistant: explicit checks
   */
  static shouldSkip(executionId, executionStatus, lastKnownStatus) {
    if (!executionId) return true;
    if (isTemporaryExecutionId(executionId)) return true;
    if (this.isTerminated(executionStatus, lastKnownStatus)) return true;
    return false;
  }
  /**
   * Check if reconnection should be attempted
   * Mutation-resistant: explicit checks
   */
  static shouldReconnect(
    wasClean,
    code,
    attempt,
    maxAttempts,
    executionId,
    executionStatus,
    lastKnownStatus,
  ) {
    if (isTemporaryExecutionId(executionId)) return false;
    if (this.isTerminated(executionStatus, lastKnownStatus)) return false;
    if (wasClean && code === 1e3) return false;
    if (attempt >= maxAttempts) return false;
    if (!executionId) return false;
    return true;
  }
}
function isExecutionTerminated(status, lastKnownStatus) {
  return ExecutionStatusChecker.isTerminated(status, lastKnownStatus);
}
function shouldSkipConnection(executionId, executionStatus, lastKnownStatus) {
  return ExecutionStatusChecker.shouldSkip(
    executionId,
    executionStatus,
    lastKnownStatus,
  );
}
function shouldReconnect(
  wasClean,
  code,
  attempt,
  maxAttempts,
  executionId,
  executionStatus,
  lastKnownStatus,
) {
  return ExecutionStatusChecker.shouldReconnect(
    wasClean,
    code,
    attempt,
    maxAttempts,
    executionId,
    executionStatus,
    lastKnownStatus,
  );
}
export {
  ExecutionStatusChecker,
  isExecutionTerminated,
  shouldReconnect,
  shouldSkipConnection,
};
