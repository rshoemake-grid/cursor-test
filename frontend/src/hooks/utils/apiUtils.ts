/**
 * API Utilities
 * Common utilities for API requests and headers
 */

export interface AuthHeadersOptions {
  token?: string | null
  contentType?: string
  additionalHeaders?: Record<string, string>
}

/**
 * Build headers with authorization token
 * 
 * @param options Header options
 * @returns Headers object with authorization and content type
 */
export function buildAuthHeaders(options: AuthHeadersOptions = {}): HeadersInit {
  const {
    token,
    contentType = 'application/json',
    additionalHeaders = {},
  } = options

  const headers: HeadersInit = {
    'Content-Type': contentType,
    ...additionalHeaders,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

/**
 * Build JSON content-type headers
 * 
 * @param additionalHeaders Additional headers to include
 * @returns Headers object with JSON content type
 */
export function buildJsonHeaders(
  additionalHeaders: Record<string, string> = {}
): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  }
}

/**
 * Build headers for file uploads
 * 
 * @param additionalHeaders Additional headers to include
 * @returns Headers object without content type (browser will set it)
 */
export function buildUploadHeaders(
  additionalHeaders: Record<string, string> = {}
): HeadersInit {
  return {
    ...additionalHeaders,
  }
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
