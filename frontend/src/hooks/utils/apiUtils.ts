/**
 * API Utilities
 * Common utilities for API requests and headers
 * Refactored to follow DRY and SOLID principles using composition
 */

export interface AuthHeadersOptions {
  token?: string | null
  contentType?: string | null  // null means omit Content-Type header
  additionalHeaders?: Record<string, string>
}

/**
 * Unified header builder using composition
 * Single Responsibility: Only builds headers
 * Open/Closed: Extensible without modification
 * DRY: Single source of truth for header building
 * 
 * @param options Header options
 * @returns Headers object with authorization and content type (if specified)
 */
export function buildHeaders(options: AuthHeadersOptions = {}): HeadersInit {
  const {
    token,
    contentType,
    additionalHeaders = {},
  } = options

  const headers: HeadersInit = { ...additionalHeaders }

  // Only add Content-Type if specified (not null or undefined)
  // null explicitly means "omit Content-Type" (useful for file uploads)
  if (contentType !== null && contentType !== undefined) {
    headers['Content-Type'] = contentType
  }

  // Add authorization header if token provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

/**
 * Build headers with authorization token
 * Convenience function using composition (DRY)
 * 
 * @param options Header options
 * @returns Headers object with authorization and JSON content type
 */
export function buildAuthHeaders(options: Omit<AuthHeadersOptions, 'contentType'> & { contentType?: string } = {}): HeadersInit {
  return buildHeaders({
    contentType: 'application/json',
    ...options,
  })
}

/**
 * Build JSON content-type headers
 * Convenience function using composition (DRY)
 * 
 * @param additionalHeaders Additional headers to include
 * @returns Headers object with JSON content type
 */
export function buildJsonHeaders(
  additionalHeaders: Record<string, string> = {}
): HeadersInit {
  return buildHeaders({
    contentType: 'application/json',
    additionalHeaders,
  })
}

/**
 * Build headers for file uploads
 * Convenience function using composition (DRY)
 * null contentType means browser will set Content-Type automatically
 * 
 * @param additionalHeaders Additional headers to include
 * @returns Headers object without content type (browser will set it)
 */
export function buildUploadHeaders(
  additionalHeaders: Record<string, string> = {}
): HeadersInit {
  return buildHeaders({
    contentType: null,  // Explicitly omit Content-Type for file uploads
    additionalHeaders,
  })
}

/**
 * Extract error message from API error response
 * 
 * @param error Error object from API call
 * @param defaultMessage Default message if error cannot be extracted
 * @returns Error message string
 */
export function extractApiErrorMessage(
  error: any,
  defaultMessage: string = 'An error occurred'
): string {
  if (typeof error === 'string') {
    return error
  }

  // Try to extract from API error response first (before checking instanceof Error)
  // This handles cases where Error objects have response.data.detail
  if (error?.response?.data?.detail) {
    return error.response.data.detail
  }

  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error instanceof Error) {
    return error.message || defaultMessage
  }

  if (error?.message) {
    return error.message
  }

  return defaultMessage
}

/**
 * Check if an API response is successful
 * 
 * @param response Response object
 * @returns True if response is successful (status 200-299)
 */
export function isApiResponseOk(response: Response): boolean {
  return response.ok && response.status >= 200 && response.status < 300
}

/**
 * Parse JSON response safely
 * 
 * @param response Response object
 * @returns Parsed JSON data, or null if parsing fails
 */
export async function parseJsonResponse<T = any>(
  response: Response
): Promise<T | null> {
  try {
    const text = await response.text()
    if (!text) {
      return null
    }
    return JSON.parse(text) as T
  } catch (error) {
    return null
  }
}
