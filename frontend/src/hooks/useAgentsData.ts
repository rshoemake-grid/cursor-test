/**
 * Agents Data Hook
 * Single Responsibility: Only fetches and manages agents data
 */

import { useCallback } from 'react'
import { logger } from '../utils/logger'
import { getLocalStorageItem } from './useLocalStorage'
import { STORAGE_KEYS } from '../config/constants'
import type { StorageAdapter } from '../types/adapters'
import { applyFilters, sortItems } from './useMarketplaceData.utils'
import type { AgentTemplate } from './useMarketplaceData'
import { canMigrateUserData, getUserDisplayName } from './utils/userValidation'

interface UseAgentsDataOptions {
  storage: StorageAdapter | null
  category: string
  searchQuery: string
  sortBy: string
  user: { id: string; username?: string; email?: string } | null
}

/**
 * Hook for fetching agents data
 * Single Responsibility: Only handles agents fetching
 */
export function useAgentsData({
  storage,
  category,
  searchQuery,
  sortBy,
  user,
}: UseAgentsDataOptions) {
  const fetchAgents = useCallback(async (): Promise<AgentTemplate[]> => {
    // Load from localStorage
    let agentsData = getLocalStorageItem<AgentTemplate[]>(STORAGE_KEYS.PUBLISHED_AGENTS, [])
    
    // One-time migration: Set current user as author for all agents without author_id
    // Use extracted validation function - mutation-resistant
    if (canMigrateUserData(user, agentsData)) {
      let updated = false
      agentsData = agentsData.map(agent => {
        if (!agent.author_id) {
          updated = true
          return {
            ...agent,
            author_id: user!.id, // Safe: canMigrateUserData ensures user is valid
            author_name: getUserDisplayName(user)
          }
        }
        return agent
      })
      
      if (updated && storage) {
        logger.debug('[Marketplace] Updated agents with author info:', user!.id)
        storage.setItem('publishedAgents', JSON.stringify(agentsData))
      }
    }
    
    // Debug: Log loaded agents with author info
    logger.debug('[Marketplace] Loaded agents:', agentsData.map(a => ({
      id: a.id,
      name: a.name,
      author_id: a.author_id,
      has_author_id: !!a.author_id
    })))
    
    // Apply filters and sort
    agentsData = applyFilters(agentsData, category, searchQuery)
    agentsData = sortItems(agentsData, sortBy, true) // Prioritize official agents
    
    return agentsData
  }, [category, searchQuery, sortBy, user?.id, user?.username, user?.email, storage])

  return {
    fetchAgents,
  }
}
