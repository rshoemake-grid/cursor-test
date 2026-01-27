/**
 * Context Menu Hook
 * Manages context menu state and handlers for nodes and edges
 */

import { useState, useCallback } from 'react'
import type { Node, Edge } from '@xyflow/react'

interface ContextMenuState {
  nodeId?: string
  edgeId?: string
  node?: Node
  x: number
  y: number
}

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault()
      event.stopPropagation()
      
      // Get the position relative to the viewport
      setContextMenu({
        nodeId: node.id,
        node: node,
        x: event.clientX,
        y: event.clientY,
      })
    },
    []
  )

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault()
      event.stopPropagation()
      
      // Get the position relative to the viewport
      setContextMenu({
        edgeId: edge.id,
        x: event.clientX,
        y: event.clientY,
      })
    },
    []
  )

  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  return {
    contextMenu,
    setContextMenu,
    onNodeContextMenu,
    onEdgeContextMenu,
    closeContextMenu,
  }
}
