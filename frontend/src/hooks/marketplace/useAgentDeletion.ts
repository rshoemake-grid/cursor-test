/**
 * Agent Deletion Hook
 * Handles deletion of agents from marketplace and repository
 */

import { useCallback } from 'react'
import { showError as defaultShowError, showSuccess as defaultShowSuccess } from '../../utils/notifications'
import { showConfirm as defaultShowConfirm } from '../../utils/confirm'
import { logger as defaultLogger } from '../../utils/logger'
import { STORAGE_KEYS } from '../../config/constants'
import { filterUserOwnedDeletableItems, separateOfficialItems } from '../../utils/ownershipUtils'
import { isEmptySelection } from '../../utils/validationUtils'
import { deleteAgentsFromStorage, extractAgentIds, updateStateAfterDeletion } from '../utils/agentDeletionService'
import { isValidUser, getUserId } from '../utils/userValidation'
import {
  hasOfficialItems,
  hasNoUserOwnedItems,
  ownsAllItems,
  ownsPartialItems,
  getItemsWithAuthorIdCount,
} from '../utils/deletionValidation'
import type { StorageAdapter } from '../../types/adapters'
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
    
    // Use extracted validation function - mutation-resistant
    if (hasOfficialItems(officialAgents)) {
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
    
    // Use extracted validation function - mutation-resistant
    if (hasNoUserOwnedItems(userOwnedAgents)) {
      // Check if any agents have author_id set
      // Use extracted validation function - mutation-resistant
      const agentsWithAuthorIdCount = getItemsWithAuthorIdCount(deletableAgents)
      if (agentsWithAuthorIdCount === 0) {
        if (hasOfficialItems(officialAgents)) {
          showError('Selected agents were published before author tracking was added or are official. Please republish them to enable deletion.')
        } else {
          showError('Selected agents were published before author tracking was added. Please republish them to enable deletion.')
        }
      } else {
        if (hasOfficialItems(officialAgents)) {
          showError(`You can only delete agents that you published (official agents cannot be deleted). ${deletableAgents.length} selected, ${agentsWithAuthorIdCount} have author info, but none match your user ID.`)
        } else {
          showError(`You can only delete agents that you published. ${deletableAgents.length} selected, ${agentsWithAuthorIdCount} have author info, but none match your user ID.`)
        }
      }
      return
    }
    
    // Use extracted validation function - mutation-resistant
    if (ownsPartialItems(userOwnedAgents.length, deletableAgents.length)) {
      const confirmed = await showConfirm(
        `You can only delete ${userOwnedAgents.length} of ${deletableAgents.length} selected agent(s). Delete only the ones you own?`,
        { title: 'Partial Delete', confirmText: 'Delete', cancelText: 'Cancel', type: 'warning' }
      )
      if (!confirmed) return
    } else if (ownsAllItems(userOwnedAgents.length, deletableAgents.length)) {
      const confirmed = await showConfirm(
        `Are you sure you want to delete ${userOwnedAgents.length} selected agent(s) from the marketplace?`,
        { title: 'Delete Agents', confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
      )
      if (!confirmed) return
    }

    // Extract agent IDs to delete
    const agentIdsToDelete = extractAgentIds(userOwnedAgents)
    if (agentIdsToDelete.size === 0) {
      return
    }

    // Delete from storage using shared service - SRP + DRY
    const result = deleteAgentsFromStorage(
      storage,
      'publishedAgents',
      agentIdsToDelete,
      {
        showError,
        showSuccess,
        errorPrefix: 'agents',
      }
    )

    // Update state if deletion was successful
    if (result.success) {
      updateStateAfterDeletion(agentIdsToDelete, setAgents, setSelectedAgentIds)
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

    const confirmed = await showConfirm(
      `Are you sure you want to delete ${selectedRepositoryAgentIds.size} selected agent(s) from your repository?`,
      { title: 'Delete Repository Agents', confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
    )
    if (!confirmed) return

    // Delete from storage using shared service - SRP + DRY
    const result = deleteAgentsFromStorage(
      storage,
      STORAGE_KEYS.REPOSITORY_AGENTS,
      selectedRepositoryAgentIds,
      {
        showError,
        showSuccess,
        onComplete: onRefresh,
        errorPrefix: 'repository agents',
      }
    )

    // Update state if deletion was successful
    if (result.success) {
      updateStateAfterDeletion(selectedRepositoryAgentIds, setRepositoryAgents, setSelectedRepositoryAgentIds)
    }
  }, [storage, setRepositoryAgents, setSelectedRepositoryAgentIds, showError, showSuccess, showConfirm])

  return {
    deleteSelectedRepositoryAgents,
  }
}
