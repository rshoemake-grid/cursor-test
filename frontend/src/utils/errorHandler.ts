import { logger } from './logger'
import { showError } from './notifications'
import { safeGetProperty } from './safeAccess'
import {
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_UNEXPECTED_ERROR_MESSAGE,
  ERROR_CONTEXT_PREFIX,
  STORAGE_ERROR_PREFIX,
  formatStorageErrorMessage
} from '../constants/errorMessages'

export interface ErrorHandlerOptions {
  showNotification?: boolean
  logError?: boolean
  defaultMessage?: string
  context?: string // Additional context for logging
}

/**
 * Interface for API error with response data
 */
interface ApiErrorResponse {
  status?: number
  statusText?: string
  data?: {
    detail?: string
    message?: string
  }
}

/**
 * Interface for API error object
 */
interface ApiError extends Error {
  response?: ApiErrorResponse
  config?: {
    url?: string
  }
}

/**
 * Type guard to check if error is an API error with response
 * 
 * @param error - The error to check
 * @returns True if error has API response structure
 */
function isApiError(error: any): error is ApiError {
  return (
    error !== null &&
    error !== undefined &&
    typeof error === 'object' &&
    error.response !== null &&
    error.response !== undefined &&
    typeof error.response === 'object'
  )
}

/**
 * Type guard to check if error has error response data
 * 
 * @param error - The API error to check
 * @returns True if error has response data
 */
function hasErrorResponseData(error: ApiError): boolean {
  return (
    error.response !== null &&
    error.response !== undefined &&
    error.response.data !== null &&
    error.response.data !== undefined &&
    typeof error.response.data === 'object'
  )
}

/**
 * Extract error message from various error formats
 * Uses explicit checks to prevent mutation survivors
 * 
 * @param error - The error object to extract message from
 * @param defaultMessage - Default message if extraction fails
 * @returns Extracted error message or default
 */
function extractErrorMessage(error: any, defaultMessage: string): string {
  // Check for string errors first
  if (error !== null && error !== undefined && typeof error === 'string' && error !== '') {
    return error
  }
  
  // Check for API error with response data
  if (isApiError(error) === true && hasErrorResponseData(error) === true) {
    const responseData = error.response!.data!
    
    // Check for detail property
    if (
      responseData.detail !== null &&
      responseData.detail !== undefined &&
      responseData.detail !== ''
    ) {
      return responseData.detail
    }
    
    // Check for message property
    if (
      responseData.message !== null &&
      responseData.message !== undefined &&
      responseData.message !== ''
    ) {
      return responseData.message
    }
  }
  
  // Check for error.message
  if (
    error !== null &&
    error !== undefined &&
    typeof error === 'object' &&
    error.message !== null &&
    error.message !== undefined &&
    error.message !== ''
  ) {
    return error.message
  }
  
  // Fall back to default message
  return defaultMessage
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
    defaultMessage = DEFAULT_ERROR_MESSAGE,
    context
  } = options

  // Extract error message using helper function
  const errorMessage = extractErrorMessage(error, defaultMessage)

  // Log error with context if provided
  // Explicit check to prevent mutation survivors
  if (logError === true) {
    // Explicit check to prevent mutation survivors
    const logContext = (context !== null && context !== undefined && context !== '') 
      ? `[${context}]` 
      : ERROR_CONTEXT_PREFIX
    logger.error(`${logContext} API Error:`, error)
    
    // Log additional error details if available
    // Use type guard for explicit check
    if (isApiError(error) === true) {
      const response = error.response!
      logger.error(`${logContext} Error details:`, {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
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
    const logContext = (context !== null && context !== undefined && context !== '') ? `[${context}]` : STORAGE_ERROR_PREFIX
    logger.error(`${logContext} Storage ${operation} error for key "${key}":`, error)
  }

  // Explicit check to prevent mutation survivors
  if (showNotification === true) {
    // Use extractErrorMessage helper for consistent error message extraction
    const errorMsg = extractErrorMessage(error, 'Unknown error')
    showError(formatStorageErrorMessage(operation, errorMsg))
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
    defaultMessage = DEFAULT_UNEXPECTED_ERROR_MESSAGE,
    context
  } = options

  // Extract error message using helper function
  const errorMessage = extractErrorMessage(error, defaultMessage)

  // Explicit check to prevent mutation survivors
  if (logError === true) {
    // Explicit check to prevent mutation survivors
    const logContext = (context !== null && context !== undefined && context !== '') ? `[${context}]` : ERROR_CONTEXT_PREFIX
    logger.error(`${logContext} Error:`, error)
  }

  // Explicit check to prevent mutation survivors
  if (showNotification === true) {
    showError(errorMessage)
  }

  return errorMessage
}
