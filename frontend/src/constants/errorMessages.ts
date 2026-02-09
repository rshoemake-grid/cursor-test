/**
 * Error Message Constants
 * Centralized error messages to eliminate string literal mutations
 * Follows DRY principle by reusing error messages across the codebase
 */

/**
 * Default error message when no specific error message is available
 */
export const DEFAULT_ERROR_MESSAGE = 'An error occurred' as const

/**
 * Default error message for generic/unexpected errors
 */
export const DEFAULT_UNEXPECTED_ERROR_MESSAGE = 'An unexpected error occurred' as const

/**
 * Error context prefix for error handler logs
 */
export const ERROR_CONTEXT_PREFIX = '[Error Handler]' as const

/**
 * Error context prefix for storage error handler logs
 */
export const STORAGE_ERROR_PREFIX = '[Storage Error Handler]' as const

/**
 * Template for storage operation error messages
 * @param operation - The storage operation that failed
 * @param errorMsg - The error message
 * @returns Formatted error message
 */
export function formatStorageErrorMessage(operation: string, errorMsg: string): string {
  return `Failed to ${operation} storage: ${errorMsg}`
}
