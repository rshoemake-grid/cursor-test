/**
 * Templates Data Hook
 * Single Responsibility: Only fetches and manages templates data
 */

import { useCallback } from 'react'
import type { HttpClient } from '../types/adapters'
import { buildSearchParams } from './useMarketplaceData.utils'
import type { Template } from './useMarketplaceData'

interface UseTemplatesDataOptions {
  httpClient: HttpClient
  apiBaseUrl: string
  category: string
  searchQuery: string
  sortBy: string
}

/**
 * Hook for fetching templates data
 * Single Responsibility: Only handles templates fetching
 */
export function useTemplatesData({
  httpClient,
  apiBaseUrl,
  category,
  searchQuery,
  sortBy,
}: UseTemplatesDataOptions) {
  const fetchTemplates = useCallback(async (): Promise<Template[]> => {
    const params = buildSearchParams(category, searchQuery, sortBy)
    const response = await httpClient.get(`${apiBaseUrl}/templates/?${params}`)
    const data = await response.json() as Template[]
    return data
  }, [httpClient, apiBaseUrl, category, searchQuery, sortBy])

  return {
    fetchTemplates,
  }
}
