/**
 * Execution ID Validation Utilities
 * Extracted from multiple hooks for better testability and mutation resistance
 * Single Responsibility: Only validates execution IDs
 */

const PENDING_EXECUTION_PREFIX = 'pending-'

/**
 * Check if execution ID is temporary/pending
 * Mutation-resistant: explicit prefix check
 */
export function isPendingExecutionId(executionId: string | null | undefined): boolean {
  if (executionId == null || executionId === '') {
    return false
  }
  return executionId.startsWith(PENDING_EXECUTION_PREFIX)
}

/**
 * Alias for isPendingExecutionId - maintains backward compatibility
 * Mutation-resistant: uses isPendingExecutionId internally
 */
export function isTemporaryExecutionId(executionId: string | null | undefined): boolean {
  return isPendingExecutionId(executionId)
}

/**
 * Check if execution ID is real (not pending)
 * Mutation-resistant: explicit prefix check
 */
export function isRealExecutionId(executionId: string | null | undefined): boolean {
  if (!isValidExecutionId(executionId)) {
    return false
  }
  return !isPendingExecutionId(executionId)
}

/**
 * Check if execution ID is valid (not null/undefined/empty)
 * Mutation-resistant: explicit null/empty checks
 */
export function isValidExecutionId(executionId: string | null | undefined): executionId is string {
  return executionId != null && executionId !== ''
}

/**
 * Safely check if execution ID starts with prefix
 * Mutation-resistant: explicit null checks before string method
 */
export function executionIdStartsWith(
  executionId: string | null | undefined,
  prefix: string
): boolean {
  if (!isValidExecutionId(executionId)) {
    return false
  }
  if (executionId.startsWith == null) {
    return false
  }
  return executionId.startsWith(prefix)
}

/**
 * Check if execution should be logged (not pending)
 * Mutation-resistant: explicit checks
 */
export function shouldLogExecutionError(
  exec: { id?: string | null } | null | undefined
): boolean {
  if (exec == null) {
    return false
  }
  if (exec.id == null) {
    return false
  }
  return isRealExecutionId(exec.id)
}
