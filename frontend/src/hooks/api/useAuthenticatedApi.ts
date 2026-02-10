import { useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { HttpClient } from '../../types/adapters'
import { defaultAdapters } from '../../types/adapters'
import { API_CONFIG } from '../../config/constants'
import { createSafeError } from '../../utils/errorFactory'
import {
  executeAuthenticatedRequest,
  type RequestContext,
  HTTP_CLIENT_ERROR_MSG,
  URL_EMPTY_ERROR_MSG,
} from '../utils/authenticatedRequestHandler'
import { logicalOr } from '../utils/logicalOr'

/**
 * Custom hook for authenticated API calls
 * Refactored to follow SOLID principles and DRY
 * 
 * Uses extracted authenticatedRequestHandler for common request logic
 */
export function useAuthenticatedApi(
  httpClient?: HttpClient,
  apiBaseUrl?: string
) {
  // Wrap hook initialization in try-catch to prevent crashes from mutations
  try {
    const { token } = useAuth()
    
    // Initialize client with fallback
    const clientResult = logicalOr(httpClient, defaultAdapters.createHttpClient())
    const client: HttpClient = (clientResult !== null && clientResult !== undefined) 
      ? clientResult 
      : defaultAdapters.createHttpClient()
    
    // Initialize base URL with fallback
    const baseUrlResult = logicalOr(apiBaseUrl, API_CONFIG.BASE_URL)
    const baseUrl: string = (baseUrlResult !== null && baseUrlResult !== undefined && typeof baseUrlResult === 'string')
      ? baseUrlResult
      : API_CONFIG.BASE_URL

    // Create request context (shared across all methods)
    const context: RequestContext = {
      client,
      baseUrl,
      token,
    }

    /**
     * Make an authenticated POST request
     */
    const authenticatedPost = useCallback(
      async (
        endpoint: string,
        data: any,
        additionalHeaders?: HeadersInit
      ) => {
        return executeAuthenticatedRequest(
          {
            endpoint,
            method: 'POST',
            data,
            additionalHeaders,
          },
          context
        )
      },
      [token, client, baseUrl]
    )

    /**
     * Make an authenticated GET request
     */
    const authenticatedGet = useCallback(
      async (endpoint: string, additionalHeaders?: HeadersInit) => {
        return executeAuthenticatedRequest(
          {
            endpoint,
            method: 'GET',
            additionalHeaders,
          },
          context
        )
      },
      [token, client, baseUrl]
    )

    /**
     * Make an authenticated PUT request
     */
    const authenticatedPut = useCallback(
      async (
        endpoint: string,
        data: any,
        additionalHeaders?: HeadersInit
      ) => {
        return executeAuthenticatedRequest(
          {
            endpoint,
            method: 'PUT',
            data,
            additionalHeaders,
          },
          context
        )
      },
      [token, client, baseUrl]
    )

    /**
     * Make an authenticated DELETE request
     */
    const authenticatedDelete = useCallback(
      async (endpoint: string, additionalHeaders?: HeadersInit) => {
        return executeAuthenticatedRequest(
          {
            endpoint,
            method: 'DELETE',
            additionalHeaders,
          },
          context
        )
      },
      [token, client, baseUrl]
    )

    return {
      authenticatedPost,
      authenticatedGet,
      authenticatedPut,
      authenticatedDelete,
    }
  } catch (error) {
    // If anything throws synchronously during hook initialization (from mutations),
    // return a minimal hook with functions that reject with a safe error
    const safeError = createSafeError('Hook initialization failed', 'HookInitError')
    const rejectFn = () => Promise.reject(safeError)
    return {
      authenticatedPost: rejectFn,
      authenticatedGet: rejectFn,
      authenticatedPut: rejectFn,
      authenticatedDelete: rejectFn,
    }
  }
}

// Re-export error constants for backward compatibility
export { HTTP_CLIENT_ERROR_MSG, URL_EMPTY_ERROR_MSG }
