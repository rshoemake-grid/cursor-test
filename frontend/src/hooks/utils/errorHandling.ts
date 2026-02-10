/**
 * Error Handling Utilities for Hooks
 * Common error handling patterns for hooks
 */

import { logger as defaultLogger } from '../../utils/logger'
import { showError as defaultShowError } from '../../utils/notifications'
import { logicalOr } from './logicalOr'

export interface ErrorHandlerOptions {
  showNotification?: boolean
  logError?: boolean
  defaultMessage?: string
  context?: string
  logger?: typeof defaultLogger
  showError?: typeof defaultShowError
}

/**
 * Extract error message from various error formats
 * 
 * @param error Error object or string
 * @param defaultMessage Default message if error cannot be extracted
 * @returns Error message string
 */
export function extractErrorMessage(error: any, defaultMessage: string = 'An error occurred'): string {
  if (typeof error === 'string') {
    return error
  }
  
  if (error instanceof Error) {
    const messageResult = logicalOr(error.message, defaultMessage)
    return (messageResult !== null && messageResult !== undefined) ? messageResult : defaultMessage
  }
  
  // Try to extract from API error response
  if (error?.response?.data?.detail) {
    return error.response.data.detail
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  
  if (error?.message) {
    return error.message
  }
  
  return defaultMessage
}

/**
 * Handle API errors with consistent logging and notifications
 * 
 * @param error Error object
 * @param options Error handling options
 * @returns Extracted error message
 */
export function handleApiError(
  error: any,
  options: ErrorHandlerOptions = {}
): string {
  const {
    showNotification = true,
    logError = true,
    defaultMessage = 'An error occurred',
    context,
    logger = defaultLogger,
    showError = defaultShowError,
  } = options

  const errorMessage = extractErrorMessage(error, defaultMessage)

  // Log error with context if provided
  if (logError) {
    const logContext = context ? `[${context}]` : '[Error Handler]'
    logger.error(`${logContext} API Error:`, error)
    
    // Log additional error details if available
    if (error?.response) {
      logger.error(`${logContext} Error details:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
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
 * Handle generic errors with consistent formatting
 * 
 * @param error Error object or string
 * @param options Error handling options
 * @returns Extracted error message
 */
export function handleError(
  error: any,
  options: ErrorHandlerOptions = {}
): string {
  const {
    showNotification = true,
    logError = true,
    defaultMessage = 'An unexpected error occurred',
    context,
    logger = defaultLogger,
    showError = defaultShowError,
  } = options

  const errorMessage = extractErrorMessage(error, defaultMessage)

  if (logError) {
    const logContext = context ? `[${context}]` : '[Error Handler]'
    logger.error(`${logContext} Error:`, error)
  }

  if (showNotification) {
    showError(errorMessage)
  }

  return errorMessage
}

/**
 * Create a safe error handler that won't throw
 * Useful for error handlers in hooks that must not throw synchronously
 * 
 * @param handler Error handler function
 * @param fallbackMessage Fallback message if handler fails
 * @returns Safe error handler function
 */
export function createSafeErrorHandler(
  handler: (error: any) => void,
  fallbackMessage: string = 'An error occurred'
): (error: any) => void {
  return (error: any) => {
    try {
      handler(error)
    } catch (handlerError) {
      // If the handler itself throws, log it but don't rethrow
      defaultLogger.error('[Safe Error Handler] Handler threw an error:', handlerError)
      defaultShowError(fallbackMessage)
    }
  }
}
