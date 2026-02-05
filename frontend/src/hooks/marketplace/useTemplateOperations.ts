/**
 * Template Operations Hook
 * Composes template-related operations from focused hooks
 * 
 * This hook follows the composition pattern, combining:
 * - useTemplateUsage - Template usage/navigation
 * - useAgentDeletion - Agent deletion logic
 * - useWorkflowDeletion - Workflow deletion logic
 * - useRepositoryAgentDeletion - Repository agent deletion
 */

import { useTemplateUsage } from './useTemplateUsage'
import { useAgentDeletion, useRepositoryAgentDeletion } from './useAgentDeletion'
import { useWorkflowDeletion } from '../workflow'
import type { StorageAdapter } from '../../types/adapters'
import type { Template, AgentTemplate } from './useMarketplaceData'

interface UseTemplateOperationsOptions {
  token: string | null
  user: { id: string; username?: string; email?: string } | null
  httpClient: any
  apiBaseUrl: string
  storage: StorageAdapter | null
  agents: AgentTemplate[]
  templates: Template[]
  workflowsOfWorkflows: Template[]
  activeTab: 'agents' | 'repository' | 'workflows-of-workflows'
  setAgents: React.Dispatch<React.SetStateAction<AgentTemplate[]>>
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>
  setWorkflowsOfWorkflows: React.Dispatch<React.SetStateAction<Template[]>>
  setRepositoryAgents: React.Dispatch<React.SetStateAction<AgentTemplate[]>>
  setSelectedAgentIds: React.Dispatch<React.SetStateAction<Set<string>>>
  setSelectedTemplateIds: React.Dispatch<React.SetStateAction<Set<string>>>
  setSelectedRepositoryAgentIds: React.Dispatch<React.SetStateAction<Set<string>>>
}

/**
 * Hook for managing template operations
 * Composes focused hooks for template-related operations
 * 
 * @param options Configuration options
 * @returns Template operation handlers
 */
export function useTemplateOperations({
  token,
  user,
  httpClient,
  apiBaseUrl,
  storage,
  agents,
  templates,
  workflowsOfWorkflows,
  activeTab,
  setAgents,
  setTemplates,
  setWorkflowsOfWorkflows,
  setRepositoryAgents,
  setSelectedAgentIds,
  setSelectedTemplateIds,
  setSelectedRepositoryAgentIds,
}: UseTemplateOperationsOptions) {
  // Compose focused hooks
  const { useTemplate } = useTemplateUsage({
    token,
    httpClient,
    apiBaseUrl,
  })

  const { deleteSelectedAgents } = useAgentDeletion({
    user,
    storage,
    agents,
    setAgents,
    setSelectedAgentIds,
  })

  const { deleteSelectedWorkflows } = useWorkflowDeletion({
    user,
    templates,
    workflowsOfWorkflows,
    activeTab,
    setTemplates,
    setWorkflowsOfWorkflows,
    setSelectedTemplateIds,
  })

  const { deleteSelectedRepositoryAgents } = useRepositoryAgentDeletion({
    storage,
    setRepositoryAgents,
    setSelectedRepositoryAgentIds,
  })

  return {
    useTemplate,
    deleteSelectedAgents,
    deleteSelectedWorkflows,
    deleteSelectedRepositoryAgents,
  }
}
