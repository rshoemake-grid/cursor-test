/**
 * WebSocket Logging Utilities
 * Extracted logging logic to improve DRY compliance
 * Single Responsibility: Only handles WebSocket logging
 */

import { isTemporaryExecutionId } from './executionIdValidation'
import { logicalOr } from './logicalOr'
import { EXECUTION_STATUS } from './websocketConstants'
import type { ExecutionStatus } from '../execution/useWebSocket.utils'

/**
 * Log skip connection reason
 * DRY: Centralized logging for skip reasons
 * Mutation-resistant: uses constants for status comparisons
 */
export function logSkipConnectionReason(
  executionId: string | null,
  executionStatus: ExecutionStatus | undefined,
  lastKnownStatus: ExecutionStatus | undefined,
  logger: { debug: (message: string, ...args: any[]) => void }
): void {
  if (isTemporaryExecutionId(executionId)) {
    logger.debug(`[WebSocket] Skipping connection to temporary execution ID: ${executionId}`)
  } else {
    const status = logicalOr(executionStatus, lastKnownStatus)
    // Use constants to prevent string literal mutations
    if (status === EXECUTION_STATUS.COMPLETED || status === EXECUTION_STATUS.FAILED) {
      logger.debug(`[WebSocket] Skipping connection - execution ${executionId} is ${status}`)
    }
  }
}

/**
 * Log skip reconnect reason
 * DRY: Centralized logging for reconnect skip reasons
 * Mutation-resistant: uses constants for status comparisons
 */
export function logSkipReconnectReason(
  executionId: string | null,
  executionStatus: ExecutionStatus | undefined,
  lastKnownStatus: ExecutionStatus | undefined,
  event: CloseEvent,
  isCleanClosure: (event: CloseEvent) => boolean,
  logger: { debug: (message: string, ...args: any[]) => void }
): void {
  if (isTemporaryExecutionId(executionId)) {
    logger.debug(`[WebSocket] Skipping reconnect for temporary execution ID: ${executionId}`)
  } else {
    const status = logicalOr(executionStatus, lastKnownStatus)
    // Use constants to prevent string literal mutations
    if (status === EXECUTION_STATUS.COMPLETED || status === EXECUTION_STATUS.FAILED) {
      logger.debug(`[WebSocket] Skipping reconnect - execution ${executionId} is ${status}`)
    } else if (isCleanClosure(event)) {
      logger.debug(`[WebSocket] Connection closed cleanly, not reconnecting`)
    }
  }
}
