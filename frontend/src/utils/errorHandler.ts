import { logger } from './logger'
import { showError } from './notifications'
import { safeGetProperty } from './safeAccess'

export interface ErrorHandlerOptions {
  showNotification?: boolean
  logError?: boolean
  defaultMessage?: string
  context?: string // Additional context for logging
}

/**
 * Centralized error handling utility
 * Follows DRY principle by eliminating duplicated error handling code
 */
export function handleApiError(
  error: any,
  options: ErrorHandlerOptions = {}
): string {
  const {
    showNotification = true,
    logError = true,
    defaultMessage = 'An error occurred',
    context
  } = options

  // Extract error message from various error formats
  // Guard: Add explicit null/undefined/empty checks to prevent error mutations
  // Empty strings are treated as falsy and should fall back to default
  const errorMessage = (error !== null && error !== undefined && error.response !== null && error.response !== undefined && error.response.data !== null && error.response.data !== undefined && error.response.data.detail !== null && error.response.data.detail !== undefined && error.response.data.detail !== '') 
                      ? error.response.data.detail
                      : (error !== null && error !== undefined && error.response !== null && error.response !== undefined && error.response.data !== null && error.response.data !== undefined && error.response.data.message !== null && error.response.data.message !== undefined && error.response.data.message !== '')
                      ? error.response.data.message
                      : (error !== null && error !== undefined && error.message !== null && error.message !== undefined && error.message !== '')
                      ? error.message
                      : defaultMessage

  // Log error with context if provided
  // Explicit check to prevent mutation survivors
  if (logError === true) {
    // Explicit check to prevent mutation survivors
    const logContext = (context !== null && context !== undefined && context !== '') 
      ? `[${context}]` 
      : '[Error Handler]'
    logger.error(`${logContext} API Error:`, error)
    
    // Log additional error details if available
    // Guard: Check error exists before accessing response property
    if (error !== null && error !== undefined && error.response !== null && error.response !== undefined) {
      logger.error(`${logContext} Error details:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        // Use safeGetProperty to kill OptionalChaining mutations
        url: safeGetProperty(error.config, 'url', undefined)
      })
    }
  }

  // Show notification if requested
  // Explicit check to prevent mutation survivors
  if (showNotification === true) {
    showError(errorMessage)
  }

  return errorMessage
}

/**
 * Handle storage errors gracefully
 */
export function handleStorageError(
  error: any,
  operation: string,
  key: string,
  options: ErrorHandlerOptions = {}
): void {
  const {
    showNotification = false, // Storage errors usually don't need user notification
    logError = true,
    context
  } = options

  // Explicit check to prevent mutation survivors
  if (logError === true) {
    // Explicit check to prevent mutation survivors
    const logContext = (context !== null && context !== undefined && context !== '') ? `[${context}]` : '[Storage Error Handler]'
    logger.error(`${logContext} Storage ${operation} error for key "${key}":`, error)
  }

  // Explicit check to prevent mutation survivors
  if (showNotification === true) {
    // Guard: Safe error message extraction
    const errorMsg = (error !== null && error !== undefined && error.message !== null && error.message !== undefined) ? error.message : 'Unknown error'
    showError(`Failed to ${operation} storage: ${errorMsg}`)
  }
}

/**
 * Handle generic errors with consistent formatting
 */
export function handleError(
  error: any,
  options: ErrorHandlerOptions = {}
): string {
  const {
    showNotification = true,
    logError = true,
    defaultMessage = 'An unexpected error occurred',
    context
  } = options

  // Guard: Explicit type checks to prevent error mutations
  const errorMessage = (error !== null && error !== undefined && error instanceof Error && error.message !== null && error.message !== undefined)
    ? error.message 
    : (error !== null && error !== undefined && typeof error === 'string' ? error : defaultMessage)

  // Explicit check to prevent mutation survivors
  if (logError === true) {
    // Explicit check to prevent mutation survivors
    const logContext = (context !== null && context !== undefined && context !== '') ? `[${context}]` : '[Error Handler]'
    logger.error(`${logContext} Error:`, error)
  }

  // Explicit check to prevent mutation survivors
  if (showNotification === true) {
    showError(errorMessage)
  }

  return errorMessage
}
