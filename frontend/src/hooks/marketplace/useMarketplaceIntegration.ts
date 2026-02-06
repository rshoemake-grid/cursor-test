/**
 * Marketplace Integration Hook
 * Handles adding agents from marketplace to workflow canvas
 * Refactored to use extracted utilities for better SOLID compliance and mutation resistance
 */

import { useEffect, useRef, useCallback } from 'react'
import { logger as defaultLogger } from '../../utils/logger'
import type { StorageAdapter } from '../../types/adapters'
import type { Node } from '@xyflow/react'
import { calculateMultipleNodePositions } from '../utils/nodePositioning'
import { logicalOrToEmptyArray } from '../utils/logicalOr'
import {
  convertAgentsToNodes,
  type AgentTemplate
} from '../utils/agentNodeConversion'
import {
  isValidPendingAgents,
  isPendingAgentsValid,
  isPendingAgentsForDifferentTab,
  isPendingAgentsTooOld,
  type PendingAgents
} from '../utils/pendingAgentsValidation'
import {
  PENDING_AGENTS_STORAGE_KEY,
  PENDING_AGENTS,
  DRAFT_UPDATE
} from '../utils/marketplaceConstants'
import { MARKETPLACE_EVENTS } from '../utils/marketplaceEventConstants'
import {
  updateDraftStorage,
  resetFlagAfterDelay
} from '../utils/draftUpdateService'
import { createPendingAgentsPolling } from '../utils/pendingAgentsPolling'
import { clearPendingAgents } from '../utils/pendingAgentsStorage'

interface UseMarketplaceIntegrationOptions {
  tabId: string
  storage?: StorageAdapter | null
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void
  notifyModified: () => void
  localWorkflowId: string | null
  localWorkflowName: string
  localWorkflowDescription: string
  tabIsUnsaved: boolean
  tabDraftsRef: React.MutableRefObject<Record<string, any>>
  saveDraftsToStorage: (drafts: Record<string, any>) => void
  logger?: typeof defaultLogger
}

export function useMarketplaceIntegration({
  tabId,
  storage,
  setNodes,
  notifyModified,
  localWorkflowId,
  localWorkflowName,
  localWorkflowDescription,
  tabIsUnsaved,
  tabDraftsRef,
  saveDraftsToStorage,
  logger: injectedLogger = defaultLogger,
}: UseMarketplaceIntegrationOptions) {
  const isAddingAgentsRef = useRef(false)

  const addAgentsToCanvas = useCallback((agentsToAdd: AgentTemplate[]) => {
    injectedLogger.debug('[useMarketplaceIntegration] addAgentsToCanvas called with', agentsToAdd.length, 'agents')
    injectedLogger.debug('[useMarketplaceIntegration] Current tabId:', tabId)
    isAddingAgentsRef.current = true
    
    // Get current state values
    const currentTabId = tabId
    const currentWorkflowId = localWorkflowId
    const currentWorkflowName = localWorkflowName
    const currentWorkflowDescription = localWorkflowDescription
    const currentTabIsUnsaved = tabIsUnsaved
    
    // Add each agent as a node
    // Use functional update to get current nodes for positioning
    setNodes((currentNodes) => {
      injectedLogger.debug('[useMarketplaceIntegration] Current nodes before adding:', currentNodes.length)
      
      // Calculate positions for all new nodes
      const positions = calculateMultipleNodePositions(currentNodes, agentsToAdd.length)
      
      // Use extracted conversion utility - mutation-resistant
      const newNodes = convertAgentsToNodes(agentsToAdd, positions)
      
      const updatedNodes = [...currentNodes, ...newNodes]
      injectedLogger.debug('[useMarketplaceIntegration] Total nodes after adding:', updatedNodes.length)
      
      // Use extracted draft update service - mutation-resistant and DRY
      updateDraftStorage(
        tabDraftsRef,
        currentTabId,
        updatedNodes,
        currentWorkflowId,
        currentWorkflowName,
        currentWorkflowDescription,
        currentTabIsUnsaved,
        saveDraftsToStorage,
        injectedLogger
      )
      
      // Reset flag after a delay to allow state update
      resetFlagAfterDelay(isAddingAgentsRef, injectedLogger)
      
      return updatedNodes
    })
    
    notifyModified()
    }, [tabId, localWorkflowId, localWorkflowName, localWorkflowDescription, tabIsUnsaved, setNodes, notifyModified, tabDraftsRef, saveDraftsToStorage, injectedLogger])

  useEffect(() => {
    const handleAddAgentsToWorkflow = (event: CustomEvent) => {
      const { agents: agentsToAdd, tabId: targetTabId } = event.detail
      injectedLogger.debug(`[useMarketplaceIntegration] Received ${MARKETPLACE_EVENTS.ADD_AGENTS_TO_WORKFLOW} event:`, { 
        targetTabId, 
        currentTabId: tabId, 
        agentCount: agentsToAdd.length 
      })
      
      // Only process if this is the active tab
      if (targetTabId !== tabId) {
        injectedLogger.debug('[useMarketplaceIntegration] Event for different tab, ignoring')
        return
      }
      
      injectedLogger.debug('[useMarketplaceIntegration] Adding agents via event')
      addAgentsToCanvas(agentsToAdd)
    }
    
    // Check storage for pending agents (more reliable than events)
    const checkPendingAgents = () => {
      if (!storage) return
      
      try {
        const pendingData = storage.getItem(PENDING_AGENTS_STORAGE_KEY)
        if (pendingData) {
          const parsed = JSON.parse(pendingData)
          
          // Use extracted validation utility - mutation-resistant
          if (!isValidPendingAgents(parsed)) {
            injectedLogger.debug('[useMarketplaceIntegration] Invalid pending agents data, clearing')
            clearPendingAgents(storage)
            return
          }

          const pending = parsed as PendingAgents
          injectedLogger.debug('[useMarketplaceIntegration] Found pending agents:', {
            pendingTabId: pending.tabId, 
            currentTabId: tabId, 
            age: Date.now() - pending.timestamp 
          })
          
          // Use extracted validation utilities - mutation-resistant
          if (isPendingAgentsValid(pending, tabId, PENDING_AGENTS.MAX_AGE)) {
            injectedLogger.debug('[useMarketplaceIntegration] Adding agents to canvas:', pending.agents.length)
            addAgentsToCanvas(pending.agents)
            // Clear after processing - use extracted utility (DRY)
            clearPendingAgents(storage)
          } else if (isPendingAgentsForDifferentTab(pending, tabId)) {
            // Clear if it's for a different tab - use extracted utility (DRY)
            injectedLogger.debug('[useMarketplaceIntegration] Pending agents for different tab, clearing')
            clearPendingAgents(storage)
          } else if (isPendingAgentsTooOld(pending, PENDING_AGENTS.MAX_AGE)) {
            // Clear if too old - use extracted utility (DRY)
            injectedLogger.debug('[useMarketplaceIntegration] Pending agents too old, clearing')
            clearPendingAgents(storage)
          }
        }
      } catch (e) {
        injectedLogger.error('Failed to process pending agents:', e)
        // Use extracted utility (DRY)
        clearPendingAgents(storage)
      }
    }
    
    // Check immediately when tab becomes active
    checkPendingAgents()
    
    // Also listen for events
    if (typeof window !== 'undefined') {
      window.addEventListener(MARKETPLACE_EVENTS.ADD_AGENTS_TO_WORKFLOW, handleAddAgentsToWorkflow as EventListener)
    }
    
    // Use extracted polling service - mutation-resistant and DRY
    const { cleanup: cleanupPolling } = createPendingAgentsPolling(
      checkPendingAgents,
      injectedLogger
    )
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(MARKETPLACE_EVENTS.ADD_AGENTS_TO_WORKFLOW, handleAddAgentsToWorkflow as EventListener)
      }
      cleanupPolling()
    }
  }, [tabId, storage, addAgentsToCanvas, injectedLogger])

  return {
    isAddingAgentsRef,
    addAgentsToCanvas,
  }
}
