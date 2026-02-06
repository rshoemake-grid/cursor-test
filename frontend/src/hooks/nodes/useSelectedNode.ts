/**
 * Selected Node Hook
 * Manages node selection, caching, and finding logic for PropertyPanel
 * Refactored to follow SOLID principles: Single Responsibility, DRY
 */

import { useMemo, useRef } from 'react'
import { useReactFlow } from '@xyflow/react'
import { findNodeById, nodeExists as checkNodeExists } from '../../utils/nodeUtils'
import { logicalOrToEmptyArray } from '../utils/logicalOr'
import { isValidNodeId, hasValidCache, nodeExistsAndValid as isValidNode } from '../utils/nodeValidation'
import { updateNodeCacheRefs, clearNodeCache, syncCacheData, nodeExistsAndValid } from '../utils/nodeCache'

interface UseSelectedNodeOptions {
  selectedNodeId: string | null
  nodesProp?: any[]
}

/**
 * Hook for managing selected node and caching
 * Used by PropertyPanel to find and cache selected nodes
 * 
 * Refactored to follow SOLID principles:
 * - SRP: Uses extracted validation and cache utilities
 * - DRY: Eliminates duplicate null checks using utilities
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
    // Use extracted validation function - mutation-resistant
    if (!isValidNodeId(selectedNodeId)) {
      clearNodeCache(selectedNodeRef, selectedNodeIdRef)
      return null
    }
    
    // If same node ID and we have it cached, return cached version
    // Use extracted validation function - mutation-resistant
    if (hasValidCache(selectedNodeIdRef.current, selectedNodeId, selectedNodeRef.current)) {
      // Verify it still exists
      if (checkNodeExists(selectedNodeId, getNodes, nodes)) {
        // Update cache with latest data but return cached reference to prevent flicker
        const updated = findNodeById(selectedNodeId, getNodes, nodes)
        // Use extracted validation function - mutation-resistant
        if (isValidNode(updated)) {
          // Sync cache data while preserving reference
          syncCacheData(selectedNodeRef, updated)
          return selectedNodeRef.current
        }
      }
    }
    
    // Find the node
    const found = findNodeById(selectedNodeId, getNodes, nodes)
    
    // Cache it using extracted utility - mutation-resistant
    updateNodeCacheRefs(selectedNodeRef, selectedNodeIdRef, found, selectedNodeId)
    
    return found
  }, [selectedNodeId, getNodes, nodes])

  return {
    selectedNode,
    nodes,
  }
}
