/**
 * Marketplace Data Hook
 * Manages data fetching, filtering, and sorting for marketplace templates and agents
 */

import { useState, useEffect, useCallback } from 'react'
import { logger } from '../utils/logger'
import { getLocalStorageItem } from './useLocalStorage'
import { STORAGE_KEYS } from '../config/constants'
import type { StorageAdapter, HttpClient } from '../types/adapters'

interface Template {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  difficulty: string
  estimated_time: string
  is_official: boolean
  uses_count: number
  likes_count: number
  rating: number
  author_id?: string | null
  author_name?: string | null
}

interface AgentTemplate {
  id: string
  name: string
  label: string
  description: string
  category: string
  tags: string[]
  difficulty: string
  estimated_time: string
  agent_config: any
  published_at?: string
  author_id?: string | null
  author_name?: string | null
  is_official?: boolean
}

interface UseMarketplaceDataOptions {
  storage: StorageAdapter | null
  httpClient: HttpClient
  apiBaseUrl: string
  category: string
  searchQuery: string
  sortBy: string
  user: { id: string; username?: string; email?: string } | null
  activeTab: 'agents' | 'repository' | 'workflows-of-workflows'
  repositorySubTab: 'workflows' | 'agents'
}

/**
 * Hook for managing marketplace data fetching, filtering, and sorting
 * 
 * @param options Configuration options
 * @returns Data state and fetch functions
 */
export function useMarketplaceData({
  storage,
  httpClient,
  apiBaseUrl,
  category,
  searchQuery,
  sortBy,
  user,
  activeTab,
  repositorySubTab,
}: UseMarketplaceDataOptions) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [workflowsOfWorkflows, setWorkflowsOfWorkflows] = useState<Template[]>([])
  const [agents, setAgents] = useState<AgentTemplate[]>([])
  const [repositoryAgents, setRepositoryAgents] = useState<AgentTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (searchQuery) params.append('search', searchQuery)
      params.append('sort_by', sortBy)
      
      const response = await httpClient.get(`${apiBaseUrl}/templates/?${params}`)
      const data = await response.json() as Template[]
      setTemplates(data)
    } catch (error) {
      logger.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }, [httpClient, apiBaseUrl, category, searchQuery, sortBy])

  const fetchWorkflowsOfWorkflows = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all workflows
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (searchQuery) params.append('search', searchQuery)
      params.append('sort_by', sortBy)
      
      const response = await httpClient.get(`${apiBaseUrl}/templates/?${params}`)
      const allWorkflows = await response.json() as Template[]
      
      // Filter workflows that contain references to other workflows
      // A "workflow of workflows" is one that references other workflows in its definition
      const workflowsOfWorkflows: Template[] = []
      
      for (const workflow of allWorkflows) {
        try {
          // Use the /use endpoint to get workflow details
          const workflowResponse = await httpClient.post(
            `${apiBaseUrl}/templates/${workflow.id}/use`,
            {},
            { 'Content-Type': 'application/json' }
          )
          
          if (workflowResponse.ok) {
            const workflowDetail = await workflowResponse.json()
            
            // Check if workflow has nodes that reference other workflows
            if (workflowDetail.nodes && Array.isArray(workflowDetail.nodes)) {
              const hasWorkflowReference = workflowDetail.nodes.some((node: any) => {
                const nodeData = node.data || {}
                const hasWorkflowId = node.workflow_id || nodeData.workflow_id
                const description = (node.description || nodeData.description || '').toLowerCase()
                const name = (node.name || nodeData.name || '').toLowerCase()
                
                return hasWorkflowId || 
                       description.includes('workflow') || 
                       name.includes('workflow') ||
                       (workflow.tags && workflow.tags.some(tag => tag.toLowerCase().includes('workflow')))
              })
              
              // Also check if workflow description or tags indicate it's a workflow of workflows
              const workflowDescription = (workflow.description || '').toLowerCase()
              const isWorkflowOfWorkflows = workflowDescription.includes('workflow of workflows') ||
                                           workflowDescription.includes('composite workflow') ||
                                           workflowDescription.includes('nested workflow') ||
                                           (workflow.tags && workflow.tags.some(tag => 
                                             tag.toLowerCase().includes('workflow-of-workflows') ||
                                             tag.toLowerCase().includes('composite') ||
                                             tag.toLowerCase().includes('nested')
                                           ))
              
              if (hasWorkflowReference || isWorkflowOfWorkflows) {
                workflowsOfWorkflows.push(workflow)
              }
            }
          }
        } catch (error) {
          logger.error(`Failed to check workflow ${workflow.id}:`, error)
        }
      }
      
      setWorkflowsOfWorkflows(workflowsOfWorkflows)
    } catch (error) {
      logger.error('Failed to fetch workflows of workflows:', error)
    } finally {
      setLoading(false)
    }
  }, [httpClient, apiBaseUrl, category, searchQuery, sortBy])

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    try {
      // For now, load from localStorage (until backend API is ready)
      let agentsData = getLocalStorageItem<AgentTemplate[]>(STORAGE_KEYS.PUBLISHED_AGENTS, [])
      
      // One-time migration: Set current user as author for all agents without author_id
      if (user && user.id && agentsData.length > 0) {
        let updated = false
        agentsData = agentsData.map(agent => {
          if (!agent.author_id) {
            updated = true
            return {
              ...agent,
              author_id: user.id,
              author_name: user.username || user.email || null
            }
          }
          return agent
        })
        
        if (updated && storage) {
          logger.debug('[Marketplace] Updated agents with author info:', user.id)
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
      
      // Apply filters
      if (category) {
        agentsData = agentsData.filter(a => a.category === category)
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        agentsData = agentsData.filter(a => 
          a.name.toLowerCase().includes(query) || 
          a.description.toLowerCase().includes(query) ||
          a.tags.some(tag => tag.toLowerCase().includes(query))
        )
      }
      
      // Sort: Official agents first, then by selected sort order
      agentsData.sort((a, b) => {
        // First, prioritize official agents
        const aIsOfficial = a.is_official ? 1 : 0
        const bIsOfficial = b.is_official ? 1 : 0
        if (aIsOfficial !== bIsOfficial) {
          return bIsOfficial - aIsOfficial // Official first
        }
        
        // If both are official or both are not, apply the selected sort
        if (sortBy === 'popular') {
          // For now, sort by published_at (most recent first)
          const dateA = a.published_at ? new Date(a.published_at).getTime() : 0
          const dateB = b.published_at ? new Date(b.published_at).getTime() : 0
          return dateB - dateA
        } else if (sortBy === 'recent') {
          const dateA = a.published_at ? new Date(a.published_at).getTime() : 0
          const dateB = b.published_at ? new Date(b.published_at).getTime() : 0
          return dateB - dateA
        }
        
        // Default: alphabetical by name
        return (a.name || '').localeCompare(b.name || '')
      })
      
      setAgents(agentsData)
    } catch (error) {
      logger.error('Failed to fetch agents:', error)
    } finally {
      setLoading(false)
    }
  }, [category, searchQuery, sortBy, user, storage])

  const fetchRepositoryAgents = useCallback(async () => {
    setLoading(true)
    try {
      // Load from storage
      if (!storage) {
        setRepositoryAgents([])
        setLoading(false)
        return
      }
      
      let agentsData: AgentTemplate[] = []
      try {
        const savedAgents = storage.getItem(STORAGE_KEYS.REPOSITORY_AGENTS)
        agentsData = savedAgents ? JSON.parse(savedAgents) : []
      } catch (error) {
        logger.error('Failed to load repository agents from storage:', error)
        agentsData = []
      }
      
      // Apply filters
      if (category) {
        agentsData = agentsData.filter(a => a.category === category)
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        agentsData = agentsData.filter(a => 
          a.name.toLowerCase().includes(query) || 
          a.description.toLowerCase().includes(query) ||
          a.tags.some(tag => tag.toLowerCase().includes(query))
        )
      }
      
      // Sort
      agentsData.sort((a, b) => {
        if (sortBy === 'popular' || sortBy === 'recent') {
          const dateA = a.published_at ? new Date(a.published_at).getTime() : 0
          const dateB = b.published_at ? new Date(b.published_at).getTime() : 0
          return dateB - dateA
        }
        return (a.name || '').localeCompare(b.name || '')
      })
      
      setRepositoryAgents(agentsData)
    } catch (error) {
      logger.error('Failed to fetch repository agents:', error)
    } finally {
      setLoading(false)
    }
  }, [storage, category, searchQuery, sortBy])

  // Auto-fetch based on active tab
  useEffect(() => {
    if (activeTab === 'repository') {
      if (repositorySubTab === 'workflows') {
        fetchTemplates()
      } else {
        fetchRepositoryAgents()
      }
    } else if (activeTab === 'workflows-of-workflows') {
      fetchWorkflowsOfWorkflows()
    } else {
      fetchAgents()
    }
  }, [activeTab, repositorySubTab, fetchTemplates, fetchWorkflowsOfWorkflows, fetchAgents, fetchRepositoryAgents])

  return {
    templates,
    workflowsOfWorkflows,
    agents,
    repositoryAgents,
    loading,
    setTemplates,
    setWorkflowsOfWorkflows,
    setAgents,
    setRepositoryAgents,
    fetchTemplates,
    fetchWorkflowsOfWorkflows,
    fetchAgents,
    fetchRepositoryAgents,
  }
}

// Export types for use in components
export type { Template, AgentTemplate }
