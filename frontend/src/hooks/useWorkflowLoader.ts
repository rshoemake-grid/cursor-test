/**
 * Workflow Loader Hook
 * Handles loading workflows from API and initializing React Flow state
 */

import { useEffect } from 'react'
import { api } from '../api/client'
import { logger } from '../utils/logger'
import { initializeReactFlowNodes, formatEdgesForReactFlow } from '../utils/workflowFormat'
import type { Node, Edge } from '@xyflow/react'

interface UseWorkflowLoaderOptions {
  workflowId: string | null
  tabIsUnsaved: boolean
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void
  setLocalWorkflowId: (id: string | null) => void
  setLocalWorkflowName: (name: string) => void
  setLocalWorkflowDescription: (description: string) => void
  setVariables: (variables: Record<string, any>) => void
  setSelectedNodeId: (id: string | null) => void
  workflowNodeToNode: (wfNode: any) => Node
  onWorkflowLoaded?: (workflowId: string, name: string) => void
  isLoadingRef: React.MutableRefObject<boolean>
  lastLoadedWorkflowIdRef: React.MutableRefObject<string | null>
}

export function useWorkflowLoader({
  workflowId,
  tabIsUnsaved,
  setNodes,
  setEdges,
  setLocalWorkflowId,
  setLocalWorkflowName,
  setLocalWorkflowDescription,
  setVariables,
  setSelectedNodeId,
  workflowNodeToNode,
  onWorkflowLoaded,
  isLoadingRef,
  lastLoadedWorkflowIdRef,
}: UseWorkflowLoaderOptions) {
  useEffect(() => {
    // Don't reload if we already have this workflow loaded (prevents reload after save)
    if (workflowId && workflowId === lastLoadedWorkflowIdRef.current) {
      return
    }
    
    if (workflowId) {
      if (tabIsUnsaved) {
        return
      }
      isLoadingRef.current = true // Prevent marking as modified during load
      api.getWorkflow(workflowId).then((workflow) => {
        // Set local state for this tab
        setLocalWorkflowId(workflow.id!)
        setLocalWorkflowName(workflow.name)
        setLocalWorkflowDescription(workflow.description || '')
        setVariables(workflow.variables || {})
        const convertedNodes = workflow.nodes.map(workflowNodeToNode)
        // Ensure all nodes have required React Flow properties
        const initializedNodes = initializeReactFlowNodes(convertedNodes)
        logger.debug('Loaded nodes:', initializedNodes.map(n => ({ id: n.id, type: n.type, position: n.position })))
        
        // Ensure edges preserve sourceHandle and targetHandle properties
        const formattedEdges = formatEdgesForReactFlow(workflow.edges || [])
        
        // Set nodes first, then edges after a brief delay to ensure nodes are rendered
        setNodes(initializedNodes)
        setTimeout(() => {
          setEdges(formattedEdges)
        }, 50)
        
        // Track that we've loaded this workflow
        lastLoadedWorkflowIdRef.current = workflowId
        
        // Clear any selected node when loading new workflow
        setSelectedNodeId(null)
        
        // Allow modifications after load completes
        setTimeout(() => {
          isLoadingRef.current = false
        }, 100)
        
        // Notify parent that workflow was loaded
        if (onWorkflowLoaded) {
          onWorkflowLoaded(workflowId, workflow.name)
        }
      }).catch(err => {
        logger.error("Failed to load workflow:", err)
        isLoadingRef.current = false
      })
    } else {
      // New workflow - reset tracking and make sure loading flag is off
      lastLoadedWorkflowIdRef.current = null
      isLoadingRef.current = false
    }
  }, [workflowId, tabIsUnsaved, workflowNodeToNode, setNodes, setEdges, setLocalWorkflowId, setLocalWorkflowName, setLocalWorkflowDescription, setVariables, setSelectedNodeId, onWorkflowLoaded, isLoadingRef, lastLoadedWorkflowIdRef])
}
