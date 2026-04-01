import { isTemporaryExecutionId } from "./executionIdValidation";
import { logicalOr } from "./logicalOr";
import { EXECUTION_STATUS } from "./websocketConstants";
function logSkipConnectionReason(executionId, executionStatus, lastKnownStatus, logger) {
  if (isTemporaryExecutionId(executionId)) {
    logger.debug(`[WebSocket] Skipping connection to temporary execution ID: ${executionId}`);
  } else {
    const status = logicalOr(executionStatus, lastKnownStatus);
    if (status === EXECUTION_STATUS.COMPLETED || status === EXECUTION_STATUS.FAILED) {
      logger.debug(`[WebSocket] Skipping connection - execution ${executionId} is ${status}`);
    }
  }
}
function logSkipReconnectReason(executionId, executionStatus, lastKnownStatus, event, isCleanClosure, logger) {
  if (isTemporaryExecutionId(executionId)) {
    logger.debug(`[WebSocket] Skipping reconnect for temporary execution ID: ${executionId}`);
  } else {
    const status = logicalOr(executionStatus, lastKnownStatus);
    if (status === EXECUTION_STATUS.COMPLETED || status === EXECUTION_STATUS.FAILED) {
      logger.debug(`[WebSocket] Skipping reconnect - execution ${executionId} is ${status}`);
    } else if (isCleanClosure(event)) {
      logger.debug(`[WebSocket] Connection closed cleanly, not reconnecting`);
    }
  }
}
export {
  logSkipConnectionReason,
  logSkipReconnectReason
};
