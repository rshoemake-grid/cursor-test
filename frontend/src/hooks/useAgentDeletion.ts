/**
 * Agent Deletion Hook
 * Handles deletion of agents from marketplace and repository
 */

import { useCallback } from 'react'
import { showError as defaultShowError, showSuccess as defaultShowSuccess } from '../utils/notifications'
import { showConfirm as defaultShowConfirm } from '../utils/confirm'
import { logger as defaultLogger } from '../utils/logger'
import { STORAGE_KEYS } from '../config/constants'
import { filterUserOwnedDeletableItems, separateOfficialItems } from '../utils/ownershipUtils'
import { isEmptySelection } from '../utils/validationUtils'
import { extractApiErrorMessage } from './utils/apiUtils'
import { isValidUser, getUserId } from './utils/userValidation'
import { isStorageAvailable, getStorageItem, setStorageItem } from './utils/storageValidation'
import { hasArrayItems } from './utils/arrayValidation'
import type { StorageAdapter } from '../types/adapters'
import type { AgentTemplate } from './useMarketplaceData'

interface UseAgentDeletionOptions {
  user: { id: string; username?: string; email?: string } | null
  storage: StorageAdapter | null
  agents: AgentTemplate[]
  setAgents: React.Dispatch<React.SetStateAction<AgentTemplate[]>>
  setSelectedAgentIds: React.Dispatch<React.SetStateAction<Set<string>>>
  showError?: typeof defaultShowError
  showSuccess?: typeof defaultShowSuccess
  showConfirm?: typeof defaultShowConfirm
  logger?: typeof defaultLogger
}

/**
 * Hook for deleting marketplace agents
 * 
 * @param options Configuration options
 * @returns Agent deletion handler
 */
export function useAgentDeletion({
  user,
  storage,
  agents,
  setAgents,
  setSelectedAgentIds,
  showError = defaultShowError,
  showSuccess = defaultShowSuccess,
  showConfirm = defaultShowConfirm,
  logger = defaultLogger,
}: UseAgentDeletionOptions) {
  const deleteSelectedAgents = useCallback(async (selectedAgentIds: Set<string>) => {
    if (isEmptySelection(selectedAgentIds)) return
    
    const selectedAgents = agents.filter(a => selectedAgentIds.has(a.id))
    
    // Filter out official agents - they cannot be deleted
    const { official: officialAgents, deletable: deletableAgents } = separateOfficialItems(selectedAgents)
    
    if (officialAgents.length > 0) {
      showError(`Cannot delete ${officialAgents.length} official agent(s). Official agents cannot be deleted.`)
      if (deletableAgents.length === 0) {
        return // All selected are official, nothing to delete
      }
    }
    
    // Debug logging
    // Use extracted validation function - mutation-resistant
    logger.debug('[Marketplace] Delete agents check:', {
      selectedCount: deletableAgents.length,
      user: isValidUser(user) ? { id: user.id, username: user.username } : null,
      selectedAgents: deletableAgents.map(a => ({
        id: a.id,
        name: a.name,
        author_id: a.author_id,
        author_id_type: typeof a.author_id,
        user_id: getUserId(user),
        user_id_type: typeof getUserId(user)
      }))
    })
    
    const userOwnedAgents = filterUserOwnedDeletableItems(deletableAgents, user)
    
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
      // Use extracted validation function - mutation-resistant
      if (!isStorageAvailable(storage)) {
        showError('Storage not available')
        return
      }
      
      const publishedAgents = storage!.getItem('publishedAgents')
      if (publishedAgents) {
        const allAgents: AgentTemplate[] = JSON.parse(publishedAgents)
        // Use extracted validation function - mutation-resistant
        if (hasArrayItems(userOwnedAgents)) {
          const agentIdsToDelete = new Set(userOwnedAgents.map(a => a && a.id ? a.id : null).filter(Boolean))
          const filteredAgents = allAgents.filter(a => !agentIdsToDelete.has(a.id))
          
          // Use extracted storage utility - mutation-resistant
          if (setStorageItem(storage, 'publishedAgents', filteredAgents)) {
            // Update state
            setAgents(prevAgents => prevAgents.filter(a => !agentIdsToDelete.has(a.id)))
            setSelectedAgentIds(new Set())
            showSuccess(`Successfully deleted ${userOwnedAgents.length} agent(s)`)
          } else {
            showError('Failed to save to storage')
          }
        }
      }
    } catch (error: any) {
      // Add defensive check to prevent crashes during mutation testing
      const errorMessage = extractApiErrorMessage(error, 'Unknown error')
      showError(`Failed to delete agents: ${errorMessage}`)
    }
  }, [agents, user, storage, setAgents, setSelectedAgentIds, showError, showSuccess, showConfirm, logger])

  return {
    deleteSelectedAgents,
  }
}

interface UseRepositoryAgentDeletionOptions {
  storage: StorageAdapter | null
  setRepositoryAgents: React.Dispatch<React.SetStateAction<AgentTemplate[]>>
  setSelectedRepositoryAgentIds: React.Dispatch<React.SetStateAction<Set<string>>>
  showError?: typeof defaultShowError
  showSuccess?: typeof defaultShowSuccess
  showConfirm?: typeof defaultShowConfirm
}

/**
 * Hook for deleting repository agents
 * 
 * @param options Configuration options
 * @returns Repository agent deletion handler
 */
export function useRepositoryAgentDeletion({
  storage,
  setRepositoryAgents,
  setSelectedRepositoryAgentIds,
  showError = defaultShowError,
  showSuccess = defaultShowSuccess,
  showConfirm = defaultShowConfirm,
}: UseRepositoryAgentDeletionOptions) {
  const deleteSelectedRepositoryAgents = useCallback(async (
    selectedRepositoryAgentIds: Set<string>,
    onRefresh?: () => void
  ) => {
    if (isEmptySelection(selectedRepositoryAgentIds)) return
    
    if (!isStorageAvailable(storage)) {
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
      const errorMessage = extractApiErrorMessage(error, 'Unknown error')
      showError(`Failed to delete repository agents: ${errorMessage}`)
    }
  }, [storage, setRepositoryAgents, setSelectedRepositoryAgentIds, showError, showSuccess, showConfirm])

  return {
    deleteSelectedRepositoryAgents,
  }
}
