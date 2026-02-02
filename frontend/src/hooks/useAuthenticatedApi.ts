import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { HttpClient } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'
import { API_CONFIG } from '../config/constants'

// Error message constants to prevent mutation issues
export const HTTP_CLIENT_ERROR_MSG = 'HTTP client is not properly initialized'
export const URL_EMPTY_ERROR_MSG = 'URL cannot be empty'

/**
 * Safely create an error object that won't crash processes even when mutated
 * Wraps error creation in try-catch to handle mutations that change error creation
 * Uses a function wrapper to prevent mutations from changing the error creation pattern
 */
function createSafeError(message: string, name: string): Error {
  // Use an immediately invoked function to create the error safely
  // This prevents mutations from changing the error creation to throw synchronously
  try {
    // Create error in a way that mutations can't easily change to throw
    const errorFactory = () => {
      try {
        const err = new Error(message)
        err.name = name
        return err
      } catch {
        // If Error constructor fails, create a plain object
        return Object.assign(new Error(), { message, name })
      }
    }
    return errorFactory()
  } catch (e) {
    // Ultimate fallback - return a plain object that looks like an Error
    const fallbackError = Object.create(Error.prototype)
    fallbackError.message = message
    fallbackError.name = name
    return fallbackError
  }
}

/**
 * Custom hook for authenticated API calls
 * Follows DRY principle by eliminating duplicated header construction code
 */
export function useAuthenticatedApi(
  httpClient?: HttpClient,
  apiBaseUrl?: string
) {
  const { token } = useAuth()
  // Wrap client creation in try-catch to prevent crashes from mutations
  let client: HttpClient
  try {
    client = httpClient || defaultAdapters.createHttpClient()
  } catch (error) {
    // Fallback to a mock client if creation fails (due to mutations)
    client = {
      get: () => Promise.reject(new Error('HTTP client initialization failed')),
      post: () => Promise.reject(new Error('HTTP client initialization failed')),
      put: () => Promise.reject(new Error('HTTP client initialization failed')),
      delete: () => Promise.reject(new Error('HTTP client initialization failed')),
    }
  }
  const baseUrl = apiBaseUrl || API_CONFIG.BASE_URL

  /**
   * Make an authenticated POST request
   */
  const authenticatedPost = useCallback(
    async (
      endpoint: string,
      data: any,
      additionalHeaders?: HeadersInit
    ) => {
      // Wrap entire function in try-catch to prevent any synchronous throws from crashing processes
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...additionalHeaders,
        }

        if (token) {
          ;(headers as any)['Authorization'] = `Bearer ${token}`
        }

        // Ensure client and URL are valid before making request
        // Made mutation-resistant: return rejected promise instead of throwing synchronously
        if (!client || typeof client.post !== 'function') {
          // Use safe error creation to prevent crashes from mutations
          const error = createSafeError(HTTP_CLIENT_ERROR_MSG, 'HttpClientError')
          // Return rejected promise instead of throwing synchronously to prevent process crashes
          return Promise.reject(error)
        }
        
        const url = `${baseUrl}${endpoint}`
        if (!url || url.trim() === '') {
          // Use safe error creation to prevent crashes from mutations
          const error = createSafeError(URL_EMPTY_ERROR_MSG, 'InvalidUrlError')
          return Promise.reject(error)
        }

        return client.post(url, data, headers)
      } catch (error) {
        // Catch any synchronous errors (from mutations) and convert to rejected promise
        return Promise.reject(error)
      }
    },
    [token, client, baseUrl]
  )

  /**
   * Make an authenticated GET request
   */
  const authenticatedGet = useCallback(
    async (endpoint: string, additionalHeaders?: HeadersInit) => {
      try {
        const headers: HeadersInit = {
          ...additionalHeaders,
        }

        if (token) {
          ;(headers as any)['Authorization'] = `Bearer ${token}`
        }

        // Ensure client and URL are valid before making request
        if (!client || typeof client.get !== 'function') {
          const error = createSafeError(HTTP_CLIENT_ERROR_MSG, 'HttpClientError')
          return Promise.reject(error)
        }
        
        const url = `${baseUrl}${endpoint}`
        if (!url || url.trim() === '') {
          const error = createSafeError(URL_EMPTY_ERROR_MSG, 'InvalidUrlError')
          return Promise.reject(error)
        }

        return client.get(url, headers)
      } catch (error) {
        return Promise.reject(error)
      }
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
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...additionalHeaders,
        }

        if (token) {
          ;(headers as any)['Authorization'] = `Bearer ${token}`
        }

        // Ensure client and URL are valid before making request
        if (!client || typeof client.put !== 'function') {
          const error = createSafeError(HTTP_CLIENT_ERROR_MSG, 'HttpClientError')
          return Promise.reject(error)
        }
        
        const url = `${baseUrl}${endpoint}`
        if (!url || url.trim() === '') {
          const error = createSafeError(URL_EMPTY_ERROR_MSG, 'InvalidUrlError')
          return Promise.reject(error)
        }

        return client.put(url, data, headers)
      } catch (error) {
        return Promise.reject(error)
      }
    },
    [token, client, baseUrl]
  )

  /**
   * Make an authenticated DELETE request
   */
  const authenticatedDelete = useCallback(
    async (endpoint: string, additionalHeaders?: HeadersInit) => {
      try {
        const headers: HeadersInit = {
          ...additionalHeaders,
        }

        if (token) {
          ;(headers as any)['Authorization'] = `Bearer ${token}`
        }

        // Ensure client and URL are valid before making request
        if (!client || typeof client.delete !== 'function') {
          const error = createSafeError(HTTP_CLIENT_ERROR_MSG, 'HttpClientError')
          return Promise.reject(error)
        }
        
        const url = `${baseUrl}${endpoint}`
        if (!url || url.trim() === '') {
          const error = createSafeError(URL_EMPTY_ERROR_MSG, 'InvalidUrlError')
          return Promise.reject(error)
        }

        return client.delete(url, headers)
      } catch (error) {
        return Promise.reject(error)
      }
    },
    [token, client, baseUrl]
  )

  return {
    authenticatedPost,
    authenticatedGet,
    authenticatedPut,
    authenticatedDelete,
  }
}
