/**
 * Tools Data Hook
 * Single Responsibility: Only fetches and manages tools data
 * Uses localStorage (PUBLISHED_TOOLS) - backend API can be added later
 */

import { useCallback } from 'react'
import { getLocalStorageItem } from '../storage'
import { STORAGE_KEYS } from '../../config/constants'
import type { StorageAdapter } from '../../types/adapters'
import { applyFilters, sortItems } from './useMarketplaceData.utils'
import type { ToolTemplate } from './useMarketplaceData'

interface UseToolsDataOptions {
  storage: StorageAdapter | null
  category: string
  searchQuery: string
  sortBy: string
}

/**
 * Hook for fetching tools data from localStorage
 * Backend API integration can be added when available
 */
export function useToolsData({
  storage,
  category,
  searchQuery,
  sortBy,
}: UseToolsDataOptions) {
  const fetchTools = useCallback(async (): Promise<ToolTemplate[]> => {
    const toolsData = getLocalStorageItem<ToolTemplate[]>(STORAGE_KEYS.PUBLISHED_TOOLS, [])
    const filtered = applyFilters(toolsData, category, searchQuery)
    return sortItems(filtered, sortBy, true)
  }, [category, searchQuery, sortBy, storage])

  return {
    fetchTools,
  }
}
