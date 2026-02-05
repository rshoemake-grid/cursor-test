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
import { isStorageAvailable } from './utils/storageValidation'

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
    
    // Try to parse storage data and catch JSON.parse errors
    let agentsData: AgentTemplate[] = []
    try {
      const savedAgents = storage.getItem(STORAGE_KEYS.REPOSITORY_AGENTS)
      agentsData = savedAgents ? JSON.parse(savedAgents) : []
    } catch (error) {
      // Log error with proper format (message + Error object)
      logger.error('Failed to load repository agents from storage:', error as Error)
      agentsData = []
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
