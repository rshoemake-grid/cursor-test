/**
 * Response Handler Utilities
 * Extracted from client.ts to eliminate DRY violations
 * Single Responsibility: Only handles API response processing
 */

import type { AxiosResponse } from 'axios'

/**
 * Extract data from axios response
 * DRY: Replaces repeated `response.data` pattern
 */
export function extractData<T>(response: AxiosResponse<T>): T {
  return response.data
}

/**
 * Extract data from promise that resolves to axios response
 * DRY: Convenience wrapper for async operations
 */
export async function extractDataAsync<T>(
  responsePromise: Promise<AxiosResponse<T>>
): Promise<T> {
  const response = await responsePromise
  return extractData(response)
}
