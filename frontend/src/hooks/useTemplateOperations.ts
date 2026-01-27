/**
 * Template Operations Hook
 * Manages template operations like using templates, deleting templates/agents
 */

import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { showError, showSuccess } from '../utils/notifications'
import { showConfirm } from '../utils/confirm'
import { api } from '../api/client'
import { logger } from '../utils/logger'
import { STORAGE_KEYS } from '../config/constants'
import type { StorageAdapter } from '../types/adapters'
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
  const navigate = useNavigate()

  const useTemplate = useCallback(async (templateId: string) => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await httpClient.post(
        `${apiBaseUrl}/templates/${templateId}/use`,
        {},
        headers
      )

      if (response.ok) {
        const workflow = await response.json()
        logger.debug('Created workflow from template:', workflow)
        // Navigate to builder with workflow ID and timestamp to ensure new tab is always created
        // The timestamp makes each navigation unique, even for the same workflow
        navigate(`/?workflow=${workflow.id}&_new=${Date.now()}`)
      } else {
        logger.error('Failed to use template:', await response.text())
      }
    } catch (error) {
      logger.error('Failed to use template:', error)
    }
  }, [token, httpClient, apiBaseUrl, navigate])

  const deleteSelectedAgents = useCallback(async (selectedAgentIds: Set<string>) => {
    if (selectedAgentIds.size === 0) return
    
    const selectedAgents = agents.filter(a => selectedAgentIds.has(a.id))
    
    // Filter out official agents - they cannot be deleted
    const officialAgents = selectedAgents.filter(a => a.is_official)
    const deletableAgents = selectedAgents.filter(a => !a.is_official)
    
    if (officialAgents.length > 0) {
      showError(`Cannot delete ${officialAgents.length} official agent(s). Official agents cannot be deleted.`)
      if (deletableAgents.length === 0) {
        return // All selected are official, nothing to delete
      }
    }
    
    // Debug logging
    logger.debug('[Marketplace] Delete agents check:', {
      selectedCount: deletableAgents.length,
      user: user ? { id: user.id, username: user.username } : null,
      selectedAgents: deletableAgents.map(a => ({
        id: a.id,
        name: a.name,
        author_id: a.author_id,
        author_id_type: typeof a.author_id,
        user_id: user?.id,
        user_id_type: typeof user?.id
      }))
    })
    
    const userOwnedAgents = deletableAgents.filter(a => {
      if (!user || !a.author_id || !user.id) return false
      const authorIdStr = String(a.author_id)
      const userIdStr = String(user.id)
      const isMatch = authorIdStr === userIdStr
      logger.debug(`[Marketplace] Agent ${a.id} ownership:`, {
        authorId: a.author_id,
        authorIdStr,
        userId: user.id,
        userIdStr,
        isMatch
      })
      return isMatch
    })
    
    logger.debug('[Marketplace] User owned agents:', userOwnedAgents.length)
    
    if (userOwnedAgents.length === 0) {
      // Check if any agents have author_id set
      const agentsWithAuthorId = deletableAgents.filter(a => a.author_id)
      if (agentsWithAuthorId.length === 0) {
        if (officialAgents.length > 0) {
          showError('Selected agents were published before author tracking was added or are official. Please republish them to enable deletion.')
        } else {
          showError('Selected agents were published before author tracking was added. Please republish them to enable deletion.')
        }
      } else {
        if (officialAgents.length > 0) {
          showError(`You can only delete agents that you published (official agents cannot be deleted). ${deletableAgents.length} selected, ${agentsWithAuthorId.length} have author info, but none match your user ID.`)
        } else {
          showError(`You can only delete agents that you published. ${deletableAgents.length} selected, ${agentsWithAuthorId.length} have author info, but none match your user ID.`)
        }
      }
      return
    }
    
    if (userOwnedAgents.length < deletableAgents.length) {
      const confirmed = await showConfirm(
        `You can only delete ${userOwnedAgents.length} of ${deletableAgents.length} selected agent(s). Delete only the ones you own?`,
        { title: 'Partial Delete', confirmText: 'Delete', cancelText: 'Cancel', type: 'warning' }
      )
      if (!confirmed) return
    } else {
      const confirmed = await showConfirm(
        `Are you sure you want to delete ${userOwnedAgents.length} selected agent(s) from the marketplace?`,
        { title: 'Delete Agents', confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
      )
      if (!confirmed) return
    }

    try {
      // Remove from storage
      if (!storage) {
        showError('Storage not available')
        return
      }
      const publishedAgents = storage.getItem('publishedAgents')
      if (publishedAgents) {
        const allAgents: AgentTemplate[] = JSON.parse(publishedAgents)
        const agentIdsToDelete = new Set(userOwnedAgents.map(a => a.id))
        const filteredAgents = allAgents.filter(a => !agentIdsToDelete.has(a.id))
        storage.setItem('publishedAgents', JSON.stringify(filteredAgents))
        
        // Update state
        setAgents(prevAgents => prevAgents.filter(a => !agentIdsToDelete.has(a.id)))
        setSelectedAgentIds(new Set())
        showSuccess(`Successfully deleted ${userOwnedAgents.length} agent(s)`)
      }
    } catch (error: any) {
      showError(`Failed to delete agents: ${error?.message ?? 'Unknown error'}`)
    }
  }, [agents, user, storage, setAgents, setSelectedAgentIds])

  const deleteSelectedAgentsWrapper = useCallback(async (selectedAgentIds: Set<string>) => {
    await deleteSelectedAgents(selectedAgentIds)
  }, [deleteSelectedAgents])

  const deleteSelectedWorkflows = useCallback(async (selectedTemplateIds: Set<string>) => {
    if (selectedTemplateIds.size === 0) return
    
    const currentTemplates = activeTab === 'workflows-of-workflows' ? workflowsOfWorkflows : templates
    const selectedTemplates = currentTemplates.filter(t => selectedTemplateIds.has(t.id))
    
    // Filter out official workflows - they cannot be deleted
    const officialTemplates = selectedTemplates.filter(t => t.is_official)
    const deletableTemplates = selectedTemplates.filter(t => !t.is_official)
    
    if (officialTemplates.length > 0) {
      showError(`Cannot delete ${officialTemplates.length} official workflow(s). Official workflows cannot be deleted.`)
      if (deletableTemplates.length === 0) {
        return // All selected are official, nothing to delete
      }
    }
    
    const userOwnedTemplates = deletableTemplates.filter(t => user && t.author_id && String(t.author_id) === String(user.id))
    
    if (userOwnedTemplates.length === 0) {
      if (officialTemplates.length > 0) {
        showError('You can only delete workflows that you published (official workflows cannot be deleted)')
      } else {
        showError('You can only delete workflows that you published')
      }
      return
    }
    
    if (userOwnedTemplates.length < deletableTemplates.length) {
      const confirmed = await showConfirm(
        `You can only delete ${userOwnedTemplates.length} of ${deletableTemplates.length} selected workflow(s). Delete only the ones you own?`,
        { title: 'Partial Delete', confirmText: 'Delete', cancelText: 'Cancel', type: 'warning' }
      )
      if (!confirmed) return
    } else {
      const confirmed = await showConfirm(
        `Are you sure you want to delete ${userOwnedTemplates.length} selected workflow(s) from the marketplace?`,
        { title: 'Delete Workflows', confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
      )
      if (!confirmed) return
    }

    try {
      // Delete each template via API
      const deletePromises = userOwnedTemplates.map(template => api.deleteTemplate(template.id))
      await Promise.all(deletePromises)
      
      // Update state
      const templateIdsToDelete = new Set(userOwnedTemplates.map(t => t.id))
      setTemplates(prevTemplates => prevTemplates.filter(t => !templateIdsToDelete.has(t.id)))
      setWorkflowsOfWorkflows(prevWorkflows => prevWorkflows.filter(t => !templateIdsToDelete.has(t.id)))
      setSelectedTemplateIds(new Set())
      showSuccess(`Successfully deleted ${userOwnedTemplates.length} workflow(s)`)
    } catch (error: any) {
      const detail = error?.response?.data?.detail ?? error?.message ?? 'Unknown error'
      showError(`Failed to delete workflows: ${detail}`)
    }
  }, [templates, workflowsOfWorkflows, activeTab, user, setTemplates, setWorkflowsOfWorkflows, setSelectedTemplateIds])

  const deleteSelectedRepositoryAgents = useCallback(async (selectedRepositoryAgentIds: Set<string>, onRefresh?: () => void) => {
    if (selectedRepositoryAgentIds.size === 0) return
    
    if (!storage) {
      showError('Storage not available')
      return
    }

    const confirmed = await showConfirm(
      `Are you sure you want to delete ${selectedRepositoryAgentIds.size} selected agent(s) from your repository?`,
      { title: 'Delete Repository Agents', confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
    )
    if (!confirmed) return

                try {
                  const repositoryAgents = storage.getItem(STORAGE_KEYS.REPOSITORY_AGENTS)
                  if (repositoryAgents) {
                    const allAgents: AgentTemplate[] = JSON.parse(repositoryAgents)
                    const remainingAgents = allAgents.filter(a => !selectedRepositoryAgentIds.has(a.id))
                    storage.setItem(STORAGE_KEYS.REPOSITORY_AGENTS, JSON.stringify(remainingAgents))
        setRepositoryAgents(remainingAgents)
        setSelectedRepositoryAgentIds(new Set())
        showSuccess(`Successfully deleted ${selectedRepositoryAgentIds.size} agent(s)`)
        // Refresh the list if callback provided
        if (onRefresh) {
          onRefresh()
        }
      }
    } catch (error: any) {
      showError(`Failed to delete repository agents: ${error?.message ?? 'Unknown error'}`)
    }
  }, [storage, setRepositoryAgents, setSelectedRepositoryAgentIds])

  return {
    useTemplate,
    deleteSelectedAgents: deleteSelectedAgentsWrapper,
    deleteSelectedWorkflows,
    deleteSelectedRepositoryAgents,
  }
}
