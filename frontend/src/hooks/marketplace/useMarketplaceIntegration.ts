/**
 * Marketplace Integration Hook
 * Handles adding agents from marketplace to workflow canvas
 */

import { useEffect, useRef, useCallback } from 'react'
import { logger as defaultLogger } from '../../utils/logger'
import type { StorageAdapter } from '../../types/adapters'
import type { Node } from '@xyflow/react'
import { calculateMultipleNodePositions } from '../utils/nodePositioning'

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

  const addAgentsToCanvas = useCallback((agentsToAdd: any[]) => {
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
      
      const newNodes = agentsToAdd.map((agent: any, index: number) => {
        const node = {
          id: `agent-${Date.now()}-${index}`,
          type: 'agent',
          position: positions[index],
          draggable: true,
          data: {
            label: agent.name || agent.label || 'Agent Node',
            name: agent.name || agent.label || 'Agent Node',
            description: agent.description || '',
            agent_config: agent.agent_config || {},
          },
        }
        return node
      })
      
      const updatedNodes = [...currentNodes, ...newNodes]
      injectedLogger.debug('[useMarketplaceIntegration] Total nodes after adding:', updatedNodes.length)
      
      // Update draft storage immediately to persist the change
      setTimeout(() => {
        const currentDraft = tabDraftsRef.current[currentTabId]
        const updatedDraft = {
          nodes: updatedNodes,
          edges: currentDraft?.edges || [],
          workflowId: currentWorkflowId,
          workflowName: currentWorkflowName,
          workflowDescription: currentWorkflowDescription,
          isUnsaved: currentTabIsUnsaved
        }
        tabDraftsRef.current[currentTabId] = updatedDraft
        saveDraftsToStorage(tabDraftsRef.current)
        injectedLogger.debug('[useMarketplaceIntegration] Draft updated with new nodes, total:', updatedNodes.length)
      }, 0)
      
      // Reset flag after a delay to allow state update
      setTimeout(() => {
        isAddingAgentsRef.current = false
        injectedLogger.debug('[useMarketplaceIntegration] Reset isAddingAgentsRef flag')
      }, 1000)
      
      return updatedNodes
    })
    
    notifyModified()
    }, [tabId, localWorkflowId, localWorkflowName, localWorkflowDescription, tabIsUnsaved, setNodes, notifyModified, tabDraftsRef, saveDraftsToStorage, injectedLogger])

  useEffect(() => {
    const handleAddAgentsToWorkflow = (event: CustomEvent) => {
      const { agents: agentsToAdd, tabId: targetTabId } = event.detail
      injectedLogger.debug('[useMarketplaceIntegration] Received addAgentsToWorkflow event:', { 
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
        const pendingData = storage.getItem('pendingAgentsToAdd')
        if (pendingData) {
          const pending = JSON.parse(pendingData)
          injectedLogger.debug('[useMarketplaceIntegration] Found pending agents:', {
            pendingTabId: pending.tabId, 
            currentTabId: tabId, 
            age: Date.now() - pending.timestamp 
          })
          // Only process if it's for this tab and recent (within last 10 seconds)
          if (pending.tabId === tabId && Date.now() - pending.timestamp < 10000) {
            injectedLogger.debug('[useMarketplaceIntegration] Adding agents to canvas:', pending.agents.length)
            addAgentsToCanvas(pending.agents)
            // Clear after processing
            storage.removeItem('pendingAgentsToAdd')
          } else if (pending.tabId !== tabId) {
            // Clear if it's for a different tab
            injectedLogger.debug('[useMarketplaceIntegration] Pending agents for different tab, clearing')
            storage.removeItem('pendingAgentsToAdd')
          } else if (Date.now() - pending.timestamp >= 10000) {
            // Clear if too old
            injectedLogger.debug('[useMarketplaceIntegration] Pending agents too old, clearing')
            storage.removeItem('pendingAgentsToAdd')
          }
        }
      } catch (e) {
        injectedLogger.error('Failed to process pending agents:', e)
        if (storage) {
          storage.removeItem('pendingAgentsToAdd')
        }
      }
    }
    
    // Check immediately when tab becomes active
    checkPendingAgents()
    
    // Also listen for events
    if (typeof window !== 'undefined') {
      window.addEventListener('addAgentsToWorkflow', handleAddAgentsToWorkflow as EventListener)
    }
    
    // Check periodically in case we missed the event (check every 1 second for 10 seconds)
    let checkCount = 0
    const maxChecks = 10
    const interval = setInterval(() => {
      checkPendingAgents()
      checkCount++
      if (checkCount >= maxChecks) {
        clearInterval(interval)
      }
    }, 1000)
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('addAgentsToWorkflow', handleAddAgentsToWorkflow as EventListener)
      }
      clearInterval(interval)
    }
  }, [tabId, storage, addAgentsToCanvas, injectedLogger])

  return {
    isAddingAgentsRef,
    addAgentsToCanvas,
  }
}
