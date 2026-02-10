/**
 * Execution Status Utilities
 * Extracted for better testability and Single Responsibility
 * Single Responsibility: Only handles execution status checking
 */

import { logicalOr } from './logicalOr'
import { EXECUTION_STATUS } from './websocketConstants'
// isTemporaryExecutionId is used via require() for dynamic import, not direct import - intentionally not imported

/**
 * Execution Status Type
 */
export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'pending' | 'paused'

/**
 * Execution Status Checker
 * Consolidates all execution status checking logic
 * DRY: Single source of truth for status checks
 */
export class ExecutionStatusChecker {
  /**
   * Check if execution status indicates completion or failure
   * Mutation-resistant: uses constants for status comparisons
   */
  static isTerminated(
    status: ExecutionStatus | undefined,
    lastKnownStatus?: ExecutionStatus | undefined
  ): boolean {
    const currentStatus = logicalOr(status, lastKnownStatus)
    return currentStatus === EXECUTION_STATUS.COMPLETED || 
           currentStatus === EXECUTION_STATUS.FAILED
  }

  /**
   * Check if connection should be skipped
   * Mutation-resistant: explicit checks
   */
  static shouldSkip(
    executionId: string | null,
    executionStatus: ExecutionStatus | undefined,
    lastKnownStatus?: ExecutionStatus | undefined
  ): boolean {
    if (!executionId) return true
    // Import here to avoid circular dependency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { isTemporaryExecutionId } = require('./executionIdValidation')
    if (isTemporaryExecutionId(executionId)) return true
    if (this.isTerminated(executionStatus, lastKnownStatus)) return true
    return false
  }

  /**
   * Check if reconnection should be attempted
   * Mutation-resistant: explicit checks
   */
  static shouldReconnect(
    wasClean: boolean,
    code: number,
    attempt: number,
    maxAttempts: number,
    executionId: string | null,
    executionStatus: ExecutionStatus | undefined,
    lastKnownStatus?: ExecutionStatus | undefined
  ): boolean {
    // Import here to avoid circular dependency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { isTemporaryExecutionId } = require('./executionIdValidation')
    
    // Don't reconnect to temporary execution IDs
    if (isTemporaryExecutionId(executionId)) return false

    // Don't reconnect if execution is terminated
    if (this.isTerminated(executionStatus, lastKnownStatus)) return false

    // Don't reconnect if connection was closed cleanly
    if (wasClean && code === 1000) return false

    // Don't reconnect if max attempts reached
    if (attempt >= maxAttempts) return false

    // Don't reconnect if no execution ID
    if (!executionId) return false

    return true
  }
}

/**
 * Legacy function exports for backward compatibility
 * @deprecated Use ExecutionStatusChecker.isTerminated instead
 */
export function isExecutionTerminated(
  status: ExecutionStatus | undefined,
  lastKnownStatus?: ExecutionStatus | undefined
): boolean {
  return ExecutionStatusChecker.isTerminated(status, lastKnownStatus)
}

/**
 * Legacy function exports for backward compatibility
 * @deprecated Use ExecutionStatusChecker.shouldSkip instead
 */
export function shouldSkipConnection(
  executionId: string | null,
  executionStatus: ExecutionStatus | undefined,
  lastKnownStatus?: ExecutionStatus | undefined
): boolean {
  return ExecutionStatusChecker.shouldSkip(executionId, executionStatus, lastKnownStatus)
}

/**
 * Legacy function exports for backward compatibility
 * @deprecated Use ExecutionStatusChecker.shouldReconnect instead
 */
export function shouldReconnect(
  wasClean: boolean,
  code: number,
  attempt: number,
  maxAttempts: number,
  executionId: string | null,
  executionStatus: ExecutionStatus | undefined,
  lastKnownStatus?: ExecutionStatus | undefined
): boolean {
  return ExecutionStatusChecker.shouldReconnect(
    wasClean,
    code,
    attempt,
    maxAttempts,
    executionId,
    executionStatus,
    lastKnownStatus
  )
}
