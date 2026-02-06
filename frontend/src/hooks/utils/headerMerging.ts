/**
 * Header Merging Utilities
 * Extracted for better testability, mutation resistance, and SRP compliance
 * Single Responsibility: Only handles header merging logic
 * Open/Closed: Uses strategy pattern for extensibility
 */

/**
 * Header type strategies for merging
 * OCP: Can be extended without modifying mergeHeaders function
 */
const headerStrategies = {
  Headers: (headers: Headers, base: Record<string, string>): void => {
    headers.forEach((value, key) => {
      base[key.toLowerCase()] = value
    })
  },
  Array: (headers: Array<[string, string]>, base: Record<string, string>): void => {
    headers.forEach(([key, value]) => {
      base[key] = value
    })
  },
  Object: (headers: Record<string, string>, base: Record<string, string>): void => {
    Object.assign(base, headers)
  },
}

/**
 * Adds Content-Type header if needed
 * Single Responsibility: Only handles Content-Type logic
 * 
 * @param headers Headers object
 * @param method HTTP method
 */
export function addContentTypeIfNeeded(
  headers: Record<string, string>,
  method: string
): void {
  if ((method === 'POST' || method === 'PUT') && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
}

/**
 * Adds Authorization header if token provided
 * Single Responsibility: Only handles Authorization logic
 * 
 * @param headers Headers object
 * @param token Authentication token
 */
export function addAuthorizationIfNeeded(
  headers: Record<string, string>,
  token: string | null
): void {
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
}

/**
 * Builds base headers for authenticated request
 * Single Responsibility: Only builds base headers
 * SRP: Uses extracted header utilities
 * 
 * @param token Authentication token
 * @param method HTTP method
 * @returns Base headers object
 */
export function buildBaseHeaders(
  token: string | null,
  method: string
): Record<string, string> {
  const headers: Record<string, string> = {}
  addAuthorizationIfNeeded(headers, token)
  addContentTypeIfNeeded(headers, method)
  return headers
}

/**
 * Merge additional headers into base headers
 * Mutation-resistant: explicit type checks
 * OCP: Uses strategy pattern - can extend header types without modification
 * 
 * Note: This function merges additional headers INTO base, so base headers take precedence
 * 
 * @param base Base headers object (will be modified)
 * @param additional Additional headers to merge
 * @returns Merged headers object (same reference as base)
 */
export function mergeHeaders(
  base: Record<string, string>,
  additional: HeadersInit
): Record<string, string> {
  if (additional instanceof Headers) {
    headerStrategies.Headers(additional, base)
  } else if (Array.isArray(additional)) {
    headerStrategies.Array(additional, base)
  } else if (additional && typeof additional === 'object') {
    headerStrategies.Object(additional as Record<string, string>, base)
  }
  
  return base
}
