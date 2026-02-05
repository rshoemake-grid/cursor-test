/**
 * Marketplace Data Hook
 * Composes individual data fetching hooks for marketplace templates and agents
 * Follows Single Responsibility Principle by delegating to focused hooks
 */

import { useState, useEffect } from 'react'
import type { StorageAdapter, HttpClient } from '../types/adapters'
import { useTemplatesData } from './useTemplatesData'
import { useAgentsData } from './useAgentsData'
import { useRepositoryAgentsData } from './useRepositoryAgentsData'
import { useWorkflowsOfWorkflowsData } from './useWorkflowsOfWorkflowsData'
import { useDataFetching } from './utils/useDataFetching'

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
 * Composes individual data fetching hooks for better organization
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
  // Compose individual data fetching hooks
  const { fetchTemplates: fetchTemplatesFn } = useTemplatesData({
    httpClient,
    apiBaseUrl,
    category,
    searchQuery,
    sortBy,
  })

  const { fetchWorkflowsOfWorkflows: fetchWorkflowsOfWorkflowsFn } = useWorkflowsOfWorkflowsData({
    httpClient,
    apiBaseUrl,
    category,
    searchQuery,
    sortBy,
  })

  const { fetchAgents: fetchAgentsFn } = useAgentsData({
    storage,
    category,
    searchQuery,
    sortBy,
    user,
  })

  const { fetchRepositoryAgents: fetchRepositoryAgentsFn } = useRepositoryAgentsData({
    storage,
    category,
    searchQuery,
    sortBy,
  })

  // Use generic data fetching hook for templates
  const templatesFetching = useDataFetching({
    fetchFn: fetchTemplatesFn,
    initialData: [] as Template[],
  })

  // Use generic data fetching hook for workflows of workflows
  const workflowsOfWorkflowsFetching = useDataFetching({
    fetchFn: fetchWorkflowsOfWorkflowsFn,
    initialData: [] as Template[],
  })

  // Use generic data fetching hook for agents
  const agentsFetching = useDataFetching({
    fetchFn: fetchAgentsFn,
    initialData: [] as AgentTemplate[],
  })

  // Use generic data fetching hook for repository agents
  const repositoryAgentsFetching = useDataFetching({
    fetchFn: fetchRepositoryAgentsFn,
    initialData: [] as AgentTemplate[],
  })

  // Local state for setters (for backward compatibility)
  const [templates, setTemplates] = useState<Template[]>(templatesFetching.data || [])
  const [workflowsOfWorkflows, setWorkflowsOfWorkflows] = useState<Template[]>(workflowsOfWorkflowsFetching.data || [])
  const [agents, setAgents] = useState<AgentTemplate[]>(agentsFetching.data || [])
  const [repositoryAgents, setRepositoryAgents] = useState<AgentTemplate[]>(repositoryAgentsFetching.data || [])

  // Sync data fetching results to local state
  useEffect(() => {
    if (templatesFetching.data) {
      setTemplates(templatesFetching.data)
    }
  }, [templatesFetching.data])

  useEffect(() => {
    if (workflowsOfWorkflowsFetching.data) {
      setWorkflowsOfWorkflows(workflowsOfWorkflowsFetching.data)
    }
  }, [workflowsOfWorkflowsFetching.data])

  useEffect(() => {
    if (agentsFetching.data) {
      setAgents(agentsFetching.data)
    }
  }, [agentsFetching.data])

  useEffect(() => {
    if (repositoryAgentsFetching.data) {
      setRepositoryAgents(repositoryAgentsFetching.data)
    }
  }, [repositoryAgentsFetching.data])

  // Determine loading state based on active tab
  const loading = 
    (activeTab === 'repository' && repositorySubTab === 'workflows' && templatesFetching.loading) ||
    (activeTab === 'repository' && repositorySubTab === 'agents' && repositoryAgentsFetching.loading) ||
    (activeTab === 'workflows-of-workflows' && workflowsOfWorkflowsFetching.loading) ||
    (activeTab === 'agents' && agentsFetching.loading)

  // Auto-fetch based on active tab
  useEffect(() => {
    if (activeTab === 'repository') {
      if (repositorySubTab === 'workflows') {
        templatesFetching.refetch()
      } else {
        repositoryAgentsFetching.refetch()
      }
    } else if (activeTab === 'workflows-of-workflows') {
      workflowsOfWorkflowsFetching.refetch()
    } else {
      agentsFetching.refetch()
    }
  }, [activeTab, repositorySubTab, templatesFetching.refetch, workflowsOfWorkflowsFetching.refetch, agentsFetching.refetch, repositoryAgentsFetching.refetch])

  // Wrapper functions to match original API
  const fetchTemplates = async () => {
    await templatesFetching.refetch()
  }

  const fetchWorkflowsOfWorkflows = async () => {
    await workflowsOfWorkflowsFetching.refetch()
  }

  const fetchAgents = async () => {
    await agentsFetching.refetch()
  }

  const fetchRepositoryAgents = async () => {
    await repositoryAgentsFetching.refetch()
  }

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
