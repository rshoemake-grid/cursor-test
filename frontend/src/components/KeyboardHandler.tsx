/**
 * Keyboard Handler Component
 * Handles keyboard shortcuts for workflow operations
 * Must be rendered inside ReactFlowProvider
 */

import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import type { Node } from '@xyflow/react'

interface KeyboardHandlerProps {
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
  notifyModified: () => void
  clipboardNode: Node | null
  onCopy: (node: Node) => void
  onCut: (node: Node) => void
  onPaste: (x?: number, y?: number) => void
}

export function KeyboardHandler({
  selectedNodeId,
  setSelectedNodeId,
  notifyModified,
  clipboardNode,
  onCopy,
  onCut,
  onPaste,
}: KeyboardHandlerProps) {
  useKeyboardShortcuts({
    selectedNodeId,
    setSelectedNodeId,
    notifyModified,
    clipboardNode,
    onCopy,
    onCut,
    onPaste,
  })
  
  return null
}
