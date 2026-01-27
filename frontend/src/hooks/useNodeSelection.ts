/**
 * Node Selection Hook
 * Manages node selection state and syncs with React Flow selection
 */

import { useState, useCallback } from 'react'
import type { Node } from '@xyflow/react'

interface UseNodeSelectionOptions {
  reactFlowInstanceRef: React.MutableRefObject<any>
  notifyModified: () => void
}

export function useNodeSelection({ reactFlowInstanceRef, notifyModified }: UseNodeSelectionOptions) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())

  const handleNodesChange = useCallback((changes: any, onNodesChangeBase: (changes: any) => void) => {
    // Pass all changes to base handler - this handles position changes, etc.
    onNodesChangeBase(changes)
    
    // Track selection changes and update selectedNodeIds
    const reactFlowInstance = reactFlowInstanceRef.current
    if (reactFlowInstance) {
      const allSelectedNodes = reactFlowInstance.getNodes().filter((n: Node) => n.selected)
      const allSelectedIds = new Set<string>(allSelectedNodes.map((n: Node) => n.id as string))
      setSelectedNodeIds(allSelectedIds)
      
      // Update selectedNodeId based on selection count
      if (allSelectedIds.size === 0) {
        setSelectedNodeId(null)
      } else if (allSelectedIds.size === 1) {
        // Single selection - set the selected node ID
        const singleId = Array.from(allSelectedIds)[0] as string
        setSelectedNodeId(singleId)
      } else {
        // Multiple selection - clear selectedNodeId to disable properties panel
        setSelectedNodeId(null)
      }
    }
    
    // Notify on actual modifications (position changes, add, remove, etc.)
    const hasActualChange = changes.some((change: any) => 
      change.type === 'position' || 
      change.type === 'dimensions' ||
      change.type === 'add' || 
      change.type === 'remove' || 
      change.type === 'reset'
    )
    if (hasActualChange) {
      notifyModified()
    }
  }, [reactFlowInstanceRef, notifyModified])

  return {
    selectedNodeId,
    setSelectedNodeId,
    selectedNodeIds,
    setSelectedNodeIds,
    handleNodesChange,
  }
}
