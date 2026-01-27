/**
 * Clipboard Hook
 * Manages clipboard operations for nodes (copy, cut, paste)
 */

import { useState, useCallback } from 'react'
import { showSuccess } from '../utils/notifications'
import type { Node } from '@xyflow/react'

interface UseClipboardReturn {
  clipboardNode: Node | null
  clipboardAction: 'copy' | 'cut' | null
  copy: (node: Node) => void
  cut: (node: Node) => void
  paste: (x?: number, y?: number) => void
  clear: () => void
}

export function useClipboard(
  reactFlowInstanceRef: React.MutableRefObject<any>,
  notifyModified: () => void
): UseClipboardReturn {
  const [clipboardNode, setClipboardNode] = useState<Node | null>(null)
  const [clipboardAction, setClipboardAction] = useState<'copy' | 'cut' | null>(null)

  const copy = useCallback((node: Node) => {
    setClipboardNode(node)
    setClipboardAction('copy')
    showSuccess('Node copied to clipboard')
  }, [])

  const cut = useCallback((node: Node) => {
    setClipboardNode(node)
    setClipboardAction('cut')
    showSuccess('Node cut to clipboard')
  }, [])

  const paste = useCallback((x?: number, y?: number) => {
    if (!clipboardNode) return

    const { getNodes, screenToFlowPosition, addNodes, deleteElements } = reactFlowInstanceRef.current || {}
    if (!getNodes || !screenToFlowPosition || !addNodes) return

    const position = x !== undefined && y !== undefined 
      ? screenToFlowPosition({ x, y })
      : { x: clipboardNode.position.x + 50, y: clipboardNode.position.y + 50 }

    const newNode = {
      ...clipboardNode,
      id: `${clipboardNode.type}_${Date.now()}`,
      position,
      selected: false,
    }

    addNodes(newNode)
    
    if (clipboardAction === 'cut' && deleteElements) {
      deleteElements({ nodes: [{ id: clipboardNode.id }] })
      setClipboardNode(null)
      setClipboardAction(null)
    }
    
    notifyModified()
    showSuccess('Node pasted')
  }, [clipboardNode, clipboardAction, reactFlowInstanceRef, notifyModified])

  const clear = useCallback(() => {
    setClipboardNode(null)
    setClipboardAction(null)
  }, [])

  return {
    clipboardNode,
    clipboardAction,
    copy,
    cut,
    paste,
    clear,
  }
}
