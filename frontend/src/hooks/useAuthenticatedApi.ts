import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { HttpClient } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'
import { API_CONFIG } from '../config/constants'

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

      return client.post(`${baseUrl}${endpoint}`, data, headers)
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

      return client.get(`${baseUrl}${endpoint}`, headers)
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

      return client.put(`${baseUrl}${endpoint}`, data, headers)
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

      return client.delete(`${baseUrl}${endpoint}`, headers)
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
