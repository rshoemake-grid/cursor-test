/**
 * Agents Data Hook
 * Single Responsibility: Only fetches and manages agents data
 * Uses GET /marketplace/agents when available, fallback to localStorage
 */

import { useCallback } from 'react'
import { getLocalStorageItem } from '../storage'
import { STORAGE_KEYS } from '../../config/constants'
import type { StorageAdapter, HttpClient } from '../../types/adapters'
import { applyFilters, sortItems } from './useMarketplaceData.utils'
import type { AgentTemplate } from './useMarketplaceData'
import { canMigrateUserData, getUserDisplayName } from '../utils/userValidation'
import { canSaveToStorage } from '../utils/storageValidation'

interface UseAgentsDataOptions {
  storage: StorageAdapter | null
  httpClient: HttpClient
  apiBaseUrl: string
  category: string
  searchQuery: string
  sortBy: string
  user: { id: string; username?: string; email?: string } | null
}

/**
 * Normalize API response to AgentTemplate shape (handles snake_case)
 */
function normalizeAgent(agent: Record<string, unknown>): AgentTemplate {
  return {
    id: String(agent.id ?? ''),
    name: String(agent.name ?? ''),
    label: String(agent.name ?? agent.label ?? ''),
    description: String(agent.description ?? ''),
    category: String(agent.category ?? ''),
    tags: Array.isArray(agent.tags) ? agent.tags.map(String) : [],
    difficulty: String(agent.difficulty ?? 'beginner'),
    estimated_time: String(agent.estimated_time ?? ''),
    agent_config: (agent.agent_config as Record<string, unknown>) ?? {},
    published_at: agent.published_at != null ? String(agent.published_at) : undefined,
    author_id: agent.author_id != null ? String(agent.author_id) : null,
    author_name: agent.author_name != null ? String(agent.author_name) : null,
    is_official: Boolean(agent.is_official),
  }
}

/**
 * Hook for fetching agents data
 * Tries GET /marketplace/agents first, fallback to localStorage
 */
export function useAgentsData({
  storage,
  httpClient,
  apiBaseUrl,
  category,
  searchQuery,
  sortBy,
  user,
}: UseAgentsDataOptions) {
  const fetchAgents = useCallback(async (): Promise<AgentTemplate[]> => {
    try {
      const base = apiBaseUrl.replace(/\/$/, '')
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (searchQuery) params.set('search', searchQuery)
      const qs = params.toString()
      const url = `${base}/marketplace/agents${qs ? `?${qs}` : ''}`
      const response = await httpClient.get(url)
      const data = await response.json()
      const raw = Array.isArray(data) ? data : (data?.items ?? data?.data ?? [])
      const agentsData = raw.map((a: Record<string, unknown>) => normalizeAgent(a))
      return applyFilters(sortItems(agentsData, sortBy, true), category, searchQuery)
    } catch {
      // Fallback to localStorage
    }

    let agentsData = getLocalStorageItem<AgentTemplate[]>(STORAGE_KEYS.PUBLISHED_AGENTS, [])

    if (canMigrateUserData(user, agentsData)) {
      let updated = false
      agentsData = agentsData.map(agent => {
        if (!agent.author_id) {
          updated = true
          return {
            ...agent,
            author_id: user!.id,
            author_name: getUserDisplayName(user)
          }
        }
        return agent
      })

      if (canSaveToStorage(storage, updated)) {
        storage!.setItem('publishedAgents', JSON.stringify(agentsData))
      }
    }

    agentsData = applyFilters(agentsData, category, searchQuery)
    agentsData = sortItems(agentsData, sortBy, true)

    return agentsData
  }, [httpClient, apiBaseUrl, category, searchQuery, sortBy, user?.id, user?.username, user?.email, storage])

  return {
    fetchAgents,
  }
}
