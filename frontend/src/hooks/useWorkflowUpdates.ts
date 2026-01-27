/**
 * Workflow Updates Hook
 * Handles applying workflow changes from chat/backend updates
 */

import { useCallback, useRef } from 'react'
import { logger } from '../utils/logger'
import { addEdge } from '@xyflow/react'
import { initializeReactFlowNodes, workflowNodeToReactFlowNode } from '../utils/workflowFormat'
import type { Node, Edge, Connection } from '@xyflow/react'

interface UseWorkflowUpdatesOptions {
  nodes: Node[]
  edges: Edge[]
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void
  notifyModified: () => void
  nodeExecutionStates?: Record<string, { status: string; error?: string }>
}

export function useWorkflowUpdates({
  nodes,
  edges,
  setNodes,
  setEdges,
  notifyModified,
  nodeExecutionStates = {},
}: UseWorkflowUpdatesOptions) {
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)

  // Keep refs in sync with state
  const updateRefs = useCallback(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
  }, [nodes, edges])

  // Helper to convert WorkflowNode to React Flow Node
  const workflowNodeToNode = useCallback((wfNode: any) => {
    return workflowNodeToReactFlowNode(wfNode, nodeExecutionStates)
  }, [nodeExecutionStates])

  // Helper function to apply workflow changes locally
  const applyLocalChanges = useCallback((changes: any) => {
    updateRefs()

    // Apply node additions first (edges need nodes to exist)
    if (changes.nodes_to_add && changes.nodes_to_add.length > 0) {
      logger.debug('Adding nodes:', changes.nodes_to_add)
      setNodes((nds) => {
        // Convert backend node format to React Flow format
        const convertedNodes = changes.nodes_to_add.map((n: any) => workflowNodeToNode(n))
        const initializedNodes = initializeReactFlowNodes(convertedNodes)
        const newNodes = [...nds, ...initializedNodes]
        logger.debug('New nodes after addition:', newNodes.map(n => ({ id: n.id, type: n.type })))
        return newNodes
      })
      notifyModified()
    }

    // Apply node updates
    if (changes.nodes_to_update && changes.nodes_to_update.length > 0) {
      setNodes((nds) =>
        nds.map((node) => {
          const update = changes.nodes_to_update.find((u: any) => u.node_id === node.id)
          if (update) {
            return {
              ...node,
              data: {
                ...node.data,
                ...update.updates,
              },
            }
          }
          return node
        })
      )
      notifyModified()
    }

    // Apply node deletions
    if (changes.nodes_to_delete && changes.nodes_to_delete.length > 0) {
      logger.debug('Deleting nodes:', changes.nodes_to_delete)
      setNodes((nds) => {
        logger.debug('Current node IDs before deletion:', nds.map(n => n.id))
        const filtered = nds.filter((node) => !changes.nodes_to_delete.includes(node.id))
        logger.debug('Nodes after deletion:', filtered.map(n => n.id))
        return filtered
      })
      // Also remove edges connected to deleted nodes
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            !changes.nodes_to_delete.includes(edge.source) &&
            !changes.nodes_to_delete.includes(edge.target)
        )
      )
      notifyModified()
    }

    // Apply edge additions - use refs to access current state
    if (changes.edges_to_add && changes.edges_to_add.length > 0) {
      // Process edges after a brief delay to ensure nodes are updated
      setTimeout(() => {
        const currentNodes = nodesRef.current
        const currentEdges = edgesRef.current
        const nodeIds = new Set(currentNodes.map(n => n.id))
        
        logger.debug('Adding edges:', changes.edges_to_add)
        logger.debug('Current nodes:', Array.from(nodeIds))
        logger.debug('Current edges:', currentEdges.map(e => `${e.source} -> ${e.target}`))
        
        let updatedEdges = [...currentEdges]
        
        for (const edgeToAdd of changes.edges_to_add) {
          // Validate that both source and target nodes exist
          if (!nodeIds.has(edgeToAdd.source)) {
            logger.warn(`Cannot connect edge: source node "${edgeToAdd.source}" does not exist. Available nodes:`, Array.from(nodeIds))
            continue
          }
          if (!nodeIds.has(edgeToAdd.target)) {
            logger.warn(`Cannot connect edge: target node "${edgeToAdd.target}" does not exist. Available nodes:`, Array.from(nodeIds))
            continue
          }
          
          // Check if edge already exists
          const edgeExists = updatedEdges.some(
            e => e.source === edgeToAdd.source && e.target === edgeToAdd.target
          )
          if (edgeExists) {
            logger.warn(`Edge from "${edgeToAdd.source}" to "${edgeToAdd.target}" already exists`)
            continue
          }
          
          // Convert to React Flow Connection format and use addEdge helper
          const connection: Connection = {
            source: edgeToAdd.source,
            target: edgeToAdd.target,
            sourceHandle: edgeToAdd.sourceHandle || null,
            targetHandle: edgeToAdd.targetHandle || null,
          }
          logger.debug('Adding connection:', connection)
          // Use addEdge to properly format the edge - it returns the updated array
          updatedEdges = addEdge(connection, updatedEdges)
          logger.debug('Updated edges count:', updatedEdges.length)
        }
        
        setEdges(updatedEdges)
        notifyModified()
      }, 50) // Small delay to ensure nodes are updated
    }

    // Apply edge deletions
    if (changes.edges_to_delete && changes.edges_to_delete.length > 0) {
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            !changes.edges_to_delete.some(
              (del: any) => del.source === edge.source && del.target === edge.target
            )
        )
      )
      notifyModified()
    }
  }, [setNodes, setEdges, notifyModified, workflowNodeToNode, updateRefs])

  return {
    applyLocalChanges,
    workflowNodeToNode,
  }
}
