/**
 * Agent Deletion Service
 * Extracted shared deletion logic for better testability, mutation resistance, and SRP compliance
 * Single Responsibility: Only handles agent deletion operations
 * DRY: Shared logic between useAgentDeletion and useRepositoryAgentDeletion
 */

import type { StorageAdapter } from '../../types/adapters'
import type { AgentTemplate } from '../marketplace/useMarketplaceData'
import { isStorageAvailable, setStorageItem } from './storageValidation'
import { hasArrayItems } from './arrayValidation'
import { extractApiErrorMessage } from './apiUtils'
import { safeShowError, safeShowSuccess, safeOnComplete } from './safeCallbacks'

export interface DeletionResult {
  success: boolean
  error?: string
  deletedCount: number
}

export interface DeletionCallbacks {
  showError: (message: string) => void
  showSuccess: (message: string) => void
  onComplete?: () => void
  errorPrefix?: string // Optional prefix for error messages (e.g., "repository agents" vs "agents")
}

/**
 * Delete agents from storage
 * Mutation-resistant: explicit checks
 * SRP: Only handles storage deletion logic
 * 
 * @param storage Storage adapter
 * @param storageKey Storage key to delete from
 * @param agentIdsToDelete Set of agent IDs to delete
 * @param callbacks Callback functions for notifications
 * @returns Deletion result
 */
export function deleteAgentsFromStorage(
  storage: StorageAdapter | null,
  storageKey: string,
  agentIdsToDelete: Set<string>,
  callbacks: DeletionCallbacks
): DeletionResult {
  // Validate storage
  if (!isStorageAvailable(storage)) {
    const error = 'Storage not available'
    safeShowError(callbacks, error)
    return { success: false, error, deletedCount: 0 }
  }

  try {
    // Get current agents from storage
    const storedAgentsJson = storage!.getItem(storageKey)
    if (!storedAgentsJson) {
      const error = 'No agents found in storage'
      safeShowError(callbacks, error)
      return { success: false, error, deletedCount: 0 }
    }

    const allAgents: AgentTemplate[] = JSON.parse(storedAgentsJson)
    
    // Filter out agents to delete
    const remainingAgents = allAgents.filter(a => !agentIdsToDelete.has(a.id))
    const deletedCount = allAgents.length - remainingAgents.length

    // Save back to storage
    if (setStorageItem(storage, storageKey, remainingAgents)) {
      safeShowSuccess(callbacks, `Successfully deleted ${deletedCount} agent(s)`)
      safeOnComplete(callbacks)
      return { success: true, deletedCount }
    } else {
      const error = 'Failed to save to storage'
      safeShowError(callbacks, error)
      return { success: false, error, deletedCount: 0 }
    }
  } catch (error: any) {
    const errorMessage = extractApiErrorMessage(error, 'Unknown error')
    // Safe access to errorPrefix with explicit checks
    const hasCallbacks = callbacks !== null && callbacks !== undefined
    const hasErrorPrefix = hasCallbacks === true && callbacks.errorPrefix !== null && callbacks.errorPrefix !== undefined
    const itemType = hasErrorPrefix === true ? callbacks.errorPrefix : 'agents'
    const fullError = `Failed to delete ${itemType}: ${errorMessage}`
    safeShowError(callbacks, fullError)
    return { success: false, error: fullError, deletedCount: 0 }
  }
}

/**
 * Extract agent IDs from agent array
 * Mutation-resistant: explicit checks
 * 
 * @param agents Array of agents
 * @returns Set of agent IDs
 */
export function extractAgentIds(agents: AgentTemplate[]): Set<string> {
  if (!hasArrayItems(agents)) {
    return new Set()
  }
  
  return new Set(
    agents
      .map(a => a && a.id ? a.id : null)
      .filter((id): id is string => id !== null && id !== undefined)
  )
}

/**
 * Update state after deletion
 * SRP: Only handles state updates
 * 
 * @param agentIdsToDelete Set of agent IDs that were deleted
 * @param setAgents State setter for agents
 * @param setSelectedIds State setter for selected IDs
 */
export function updateStateAfterDeletion<T extends AgentTemplate>(
  agentIdsToDelete: Set<string>,
  setAgents: React.Dispatch<React.SetStateAction<T[]>>,
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>
): void {
  setAgents(prevAgents => prevAgents.filter(a => !agentIdsToDelete.has(a.id)))
  setSelectedIds(new Set())
}
