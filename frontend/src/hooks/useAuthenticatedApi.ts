import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { HttpClient } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'
import { API_CONFIG } from '../config/constants'

// Error message constants to prevent mutation issues
export const HTTP_CLIENT_ERROR_MSG = 'HTTP client is not properly initialized'
export const URL_EMPTY_ERROR_MSG = 'URL cannot be empty'

/**
 * Custom hook for authenticated API calls
 * Follows DRY principle by eliminating duplicated header construction code
 */
export function useAuthenticatedApi(
  httpClient?: HttpClient,
  apiBaseUrl?: string
) {
  const { token } = useAuth()
  const client = httpClient || defaultAdapters.createHttpClient()
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
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...additionalHeaders,
      }

      if (token) {
        ;(headers as any)['Authorization'] = `Bearer ${token}`
      }

      // Ensure client and URL are valid before making request
      if (!client || typeof client.post !== 'function') {
        const error = new Error(HTTP_CLIENT_ERROR_MSG)
        error.name = 'HttpClientError'
        throw error
      }
      
      const url = `${baseUrl}${endpoint}`
      if (!url || url.trim() === '') {
        const error = new Error(URL_EMPTY_ERROR_MSG)
        error.name = 'InvalidUrlError'
        throw error
      }

      return client.post(url, data, headers)
    },
    [token, client, baseUrl]
  )

  /**
   * Make an authenticated GET request
   */
  const authenticatedGet = useCallback(
    async (endpoint: string, additionalHeaders?: HeadersInit) => {
      const headers: HeadersInit = {
        ...additionalHeaders,
      }

      if (token) {
        ;(headers as any)['Authorization'] = `Bearer ${token}`
      }

      // Ensure client and URL are valid before making request
      if (!client || typeof client.get !== 'function') {
        const error = new Error('HTTP client is not properly initialized')
        error.name = 'HttpClientError'
        throw error
      }
      
      const url = `${baseUrl}${endpoint}`
      if (!url || url.trim() === '') {
        const error = new Error('URL cannot be empty')
        error.name = 'InvalidUrlError'
        throw error
      }

      return client.get(url, headers)
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
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...additionalHeaders,
      }

      if (token) {
        ;(headers as any)['Authorization'] = `Bearer ${token}`
      }

      // Ensure client and URL are valid before making request
      if (!client || typeof client.put !== 'function') {
        const error = new Error('HTTP client is not properly initialized')
        error.name = 'HttpClientError'
        throw error
      }
      
      const url = `${baseUrl}${endpoint}`
      if (!url || url.trim() === '') {
        const error = new Error('URL cannot be empty')
        error.name = 'InvalidUrlError'
        throw error
      }

      return client.put(url, data, headers)
    },
    [token, client, baseUrl]
  )

  /**
   * Make an authenticated DELETE request
   */
  const authenticatedDelete = useCallback(
    async (endpoint: string, additionalHeaders?: HeadersInit) => {
      const headers: HeadersInit = {
        ...additionalHeaders,
      }

      if (token) {
        ;(headers as any)['Authorization'] = `Bearer ${token}`
      }

      // Ensure client and URL are valid before making request
      if (!client || typeof client.delete !== 'function') {
        const error = new Error('HTTP client is not properly initialized')
        error.name = 'HttpClientError'
        throw error
      }
      
      const url = `${baseUrl}${endpoint}`
      if (!url || url.trim() === '') {
        const error = new Error('URL cannot be empty')
        error.name = 'InvalidUrlError'
        throw error
      }

      return client.delete(url, headers)
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
