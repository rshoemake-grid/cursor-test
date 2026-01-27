import { logger } from './logger'
import { showError } from './notifications'

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
  const errorMessage = error.response?.data?.detail || 
                      error.response?.data?.message ||
                      error.message || 
                      defaultMessage

  // Log error with context if provided
  if (logError) {
    const logContext = context ? `[${context}]` : '[Error Handler]'
    logger.error(`${logContext} API Error:`, error)
    
    // Log additional error details if available
    if (error.response) {
      logger.error(`${logContext} Error details:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url
      })
    }
  }

  // Show notification if requested
  if (showNotification) {
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

  if (logError) {
    const logContext = context ? `[${context}]` : '[Storage Error Handler]'
    logger.error(`${logContext} Storage ${operation} error for key "${key}":`, error)
  }

  if (showNotification) {
    showError(`Failed to ${operation} storage: ${error.message || 'Unknown error'}`)
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

  const errorMessage = error instanceof Error 
    ? error.message 
    : (typeof error === 'string' ? error : defaultMessage)

  if (logError) {
    const logContext = context ? `[${context}]` : '[Error Handler]'
    logger.error(`${logContext} Error:`, error)
  }

  if (showNotification) {
    showError(errorMessage)
  }

  return errorMessage
}
