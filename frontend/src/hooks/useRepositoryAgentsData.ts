/**
 * Repository Agents Data Hook
 * Single Responsibility: Only fetches and manages repository agents data
 */

import { useCallback } from 'react'
import { logger } from '../utils/logger'
import { STORAGE_KEYS } from '../config/constants'
import type { StorageAdapter } from '../types/adapters'
import { applyFilters, sortItems } from './useMarketplaceData.utils'
import type { AgentTemplate } from './useMarketplaceData'
import { isStorageAvailable, getStorageItem } from './utils/storageValidation'

interface UseRepositoryAgentsDataOptions {
  storage: StorageAdapter | null
  category: string
  searchQuery: string
  sortBy: string
}

/**
 * Hook for fetching repository agents data
 * Single Responsibility: Only handles repository agents fetching
 */
export function useRepositoryAgentsData({
  storage,
  category,
  searchQuery,
  sortBy,
}: UseRepositoryAgentsDataOptions) {
  const fetchRepositoryAgents = useCallback(async (): Promise<AgentTemplate[]> => {
    // Load from storage
    // Use extracted validation function - mutation-resistant
    if (!isStorageAvailable(storage)) {
      return []
    }
    
    // Use extracted storage utility - mutation-resistant
    let agentsData: AgentTemplate[] = getStorageItem<AgentTemplate[]>(
      storage,
      STORAGE_KEYS.REPOSITORY_AGENTS,
      []
    )
    
    // Log error if parsing failed (getStorageItem handles it, but we log for debugging)
    if (agentsData.length === 0 && storage.getItem(STORAGE_KEYS.REPOSITORY_AGENTS)) {
      logger.error('Failed to load repository agents from storage: invalid JSON')
    }
    
    // Apply filters and sort
    agentsData = applyFilters(agentsData, category, searchQuery)
    agentsData = sortItems(agentsData, sortBy)
    
    return agentsData
  }, [storage, category, searchQuery, sortBy])

  return {
    fetchRepositoryAgents,
  }
}
