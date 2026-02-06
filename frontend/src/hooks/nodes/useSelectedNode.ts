/**
 * Selected Node Hook
 * Manages node selection, caching, and finding logic for PropertyPanel
 */

import { useMemo, useRef } from 'react'
import { useReactFlow } from '@xyflow/react'
import { findNodeById, nodeExists } from '../../utils/nodeUtils'
import { logicalOrToEmptyArray } from '../utils/logicalOr'

interface UseSelectedNodeOptions {
  selectedNodeId: string | null
  nodesProp?: any[]
}

/**
 * Hook for managing selected node and caching
 * Used by PropertyPanel to find and cache selected nodes
 * 
 * @param options Configuration options
 * @returns Selected node and nodes array
 */
export function useSelectedNode({
  selectedNodeId,
  nodesProp,
}: UseSelectedNodeOptions) {
  const { getNodes } = useReactFlow()
  
  // Cache for selected node to prevent flickering
  const selectedNodeRef = useRef<any>(null)
  const selectedNodeIdRef = useRef<string | null>(null)

  // Get nodes directly from React Flow store for stability, fallback to prop
  const nodes = useMemo(() => {
    try {
      const flowNodes = getNodes()
      return flowNodes.length > 0 ? flowNodes : logicalOrToEmptyArray(nodesProp)
    } catch {
      return logicalOrToEmptyArray(nodesProp)
    }
  }, [getNodes, nodesProp])

  const selectedNode = useMemo(() => {
    // If no selection, clear cache
    // Explicit null/undefined/empty check to prevent mutation survivors
    if (selectedNodeId === null || selectedNodeId === undefined || selectedNodeId === '') {
      selectedNodeRef.current = null
      selectedNodeIdRef.current = null
      return null
    }
    
    // If same node ID and we have it cached, return cached version
    // Explicit checks to prevent mutation survivors
    if (selectedNodeIdRef.current === selectedNodeId && selectedNodeRef.current !== null && selectedNodeRef.current !== undefined) {
        // Verify it still exists
        if (nodeExists(selectedNodeId, getNodes, nodes)) {
          // Update cache with latest data but return cached reference to prevent flicker
          const updated = findNodeById(selectedNodeId, getNodes, nodes)
          // Explicit check to prevent mutation survivors
          if (updated !== null && updated !== undefined) {
          // Only update cache, but return the cached reference for stability
          Object.assign(selectedNodeRef.current, updated)
          return selectedNodeRef.current
        }
      }
    }
    
    // Find the node
    const found = findNodeById(selectedNodeId, getNodes, nodes)
    
    // Cache it
    // Explicit check to prevent mutation survivors
    if (found !== null && found !== undefined) {
      selectedNodeRef.current = { ...found } // Create a copy to stabilize reference
      selectedNodeIdRef.current = selectedNodeId
    } else {
      selectedNodeRef.current = null
      selectedNodeIdRef.current = null
    }
    
    return found
  }, [selectedNodeId, getNodes, nodes])

  return {
    selectedNode,
    nodes,
  }
}
