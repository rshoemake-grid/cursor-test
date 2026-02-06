/**
 * Workflow Update Handler Hook
 * Handles workflow updates from chat/backend, including reload logic for deletions
 */

import { useCallback } from 'react'
import { api } from '../../api/client'
import { logger } from '../../utils/logger'
import { initializeReactFlowNodes, formatEdgesForReactFlow } from '../../utils/workflowFormat'
import type { Node, Edge } from '@xyflow/react'
import { logicalOrToEmptyArray } from '../utils/logicalOr'

interface UseWorkflowUpdateHandlerOptions {
  localWorkflowId: string | null
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void
  workflowNodeToNode: (wfNode: any) => Node
  applyLocalChanges: (changes: any) => void
}

export function useWorkflowUpdateHandler({
  localWorkflowId,
  setNodes,
  setEdges,
  workflowNodeToNode,
  applyLocalChanges,
}: UseWorkflowUpdateHandlerOptions) {
  const handleWorkflowUpdate = useCallback((changes: any) => {
    if (!changes) return

    logger.debug('Received workflow changes:', changes)
    
    // If there are deletions and we have a workflowId, reload from database
    // The chat agent saves deletions to the database, so we need to reload to ensure UI matches
    const hasDeletions = changes.nodes_to_delete && changes.nodes_to_delete.length > 0
    
    if (hasDeletions && localWorkflowId) {
      // Reload workflow from database to ensure UI matches saved state
      logger.debug('Reloading workflow from database after deletions:', changes.nodes_to_delete)
      // Small delay to ensure backend has finished saving
      setTimeout(() => {
        api.getWorkflow(localWorkflowId).then((workflow) => {
          const convertedNodes = workflow.nodes.map(workflowNodeToNode)
          const initializedNodes = initializeReactFlowNodes(convertedNodes)
          setNodes(initializedNodes)
          setEdges(formatEdgesForReactFlow(logicalOrToEmptyArray(workflow.edges)))
          logger.debug('Reloaded workflow after deletion, nodes:', initializedNodes.map(n => n.id))
          logger.debug('Expected deleted nodes:', changes.nodes_to_delete)
        }).catch(err => {
          logger.error('Failed to reload workflow after deletion:', err)
          // Fall back to applying changes locally
          applyLocalChanges(changes)
        })
      }, 200) // Small delay to ensure backend save is complete
      return
    }
    
    applyLocalChanges(changes)
  }, [localWorkflowId, workflowNodeToNode, setNodes, setEdges, applyLocalChanges])

  return {
    handleWorkflowUpdate,
  }
}
