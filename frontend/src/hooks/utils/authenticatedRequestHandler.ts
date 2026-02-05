/**
 * Authenticated Request Handler
 * Extracted common logic for authenticated API requests
 * Follows SOLID principles: Single Responsibility, DRY
 */

import type { HttpClient } from '../../types/adapters'
import { createSafeError } from '../../utils/errorFactory'

// Error message constants
export const HTTP_CLIENT_ERROR_MSG = 'HTTP client is not properly initialized'
export const URL_EMPTY_ERROR_MSG = 'URL cannot be empty'

export interface RequestConfig {
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  additionalHeaders?: HeadersInit
}

export interface RequestContext {
  client: HttpClient
  baseUrl: string
  token: string | null
}

/**
 * Validates request configuration
 * Single Responsibility: Only validates inputs
 * 
 * @param config Request configuration
 * @param context Request context with client and base URL
 * @returns Error if validation fails, null if valid
 */
export function validateRequest(
  config: RequestConfig,
  context: RequestContext
): Error | null {
  // Validate client
  const methodName = config.method.toLowerCase() as keyof HttpClient
  if (!context.client || typeof context.client[methodName] !== 'function') {
    return createSafeError(HTTP_CLIENT_ERROR_MSG, 'HttpClientError')
  }

  // Validate URL
  const url = `${context.baseUrl}${config.endpoint}`
  if (!url || url.trim() === '') {
    return createSafeError(URL_EMPTY_ERROR_MSG, 'InvalidUrlError')
  }

  return null
}

/**
 * Builds headers for authenticated request
 * Single Responsibility: Only builds headers
 * 
 * @param token Authentication token
 * @param method HTTP method
 * @param additionalHeaders Additional headers to include (can override Content-Type)
 * @returns Headers object
 */
export function buildRequestHeaders(
  token: string | null,
  method: string,
  additionalHeaders?: HeadersInit
): HeadersInit {
  const headers: HeadersInit = { ...additionalHeaders }

  // Add Content-Type for methods that send data (only if not already provided)
  if ((method === 'POST' || method === 'PUT') && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  // Add authorization header if token provided (can override existing)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

/**
 * Executes authenticated HTTP request
 * Single Responsibility: Only executes requests
 * Open/Closed: Extensible for new HTTP methods via config.method
 * 
 * @param config Request configuration
 * @param context Request context
 * @returns Promise resolving to response or rejecting with error
 */
export function executeAuthenticatedRequest(
  config: RequestConfig,
  context: RequestContext
): Promise<any> {
  // Validate request
  const validationError = validateRequest(config, context)
  if (validationError) {
    return Promise.reject(validationError)
  }

  // Build headers
  const headers = buildRequestHeaders(
    context.token,
    config.method,
    config.additionalHeaders
  )

  // Build URL
  const url = `${context.baseUrl}${config.endpoint}`

  // Execute request based on method (Strategy Pattern)
  const methodMap: Record<string, () => Promise<any>> = {
    GET: () => context.client.get(url, headers),
    POST: () => context.client.post(url, config.data, headers),
    PUT: () => context.client.put(url, config.data, headers),
    DELETE: () => context.client.delete(url, headers),
  }

  const requestFn = methodMap[config.method]
  if (!requestFn) {
    return Promise.reject(
      createSafeError(`Unsupported HTTP method: ${config.method}`, 'UnsupportedMethodError')
    )
  }

  try {
    return requestFn()
  } catch (error) {
    // Catch any synchronous errors and convert to rejected promise
    return Promise.reject(error)
  }
}
