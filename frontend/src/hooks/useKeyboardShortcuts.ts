/**
 * Keyboard Shortcuts Hook
 * Handles keyboard shortcuts for workflow builder (Copy, Cut, Paste, Delete)
 */

import { useEffect } from 'react'
import { useReactFlow } from '@xyflow/react'
import type { Node } from '@xyflow/react'
import {
  isInputElement,
  matchesKeyCombination,
  isDeleteKey
} from './useKeyboardShortcuts.utils'

interface UseKeyboardShortcutsOptions {
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
  notifyModified: () => void
  clipboardNode: any
  onCopy: (node: Node) => void
  onCut: (node: Node) => void
  onPaste: () => void
}

export function useKeyboardShortcuts({
  selectedNodeId,
  setSelectedNodeId,
  notifyModified,
  clipboardNode,
  onCopy,
  onCut,
  onPaste,
}: UseKeyboardShortcutsOptions) {
  const { deleteElements, getNodes, getEdges } = useReactFlow()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input field
      const target = event.target as HTMLElement
      if (isInputElement(target)) {
        return
      }

      // Handle Copy (Ctrl/Cmd + C)
      if (matchesKeyCombination(event, 'c')) {
        const selectedNodes = getNodes().filter(node => node.selected)
        if (selectedNodes.length === 1) {
          event.preventDefault()
          onCopy(selectedNodes[0])
        }
        return
      }
      
      // Handle Cut (Ctrl/Cmd + X)
      if (matchesKeyCombination(event, 'x')) {
        const selectedNodes = getNodes().filter(node => node.selected)
        if (selectedNodes.length === 1) {
          event.preventDefault()
          onCut(selectedNodes[0])
        }
        return
      }
      
      // Handle Paste (Ctrl/Cmd + V)
      if (matchesKeyCombination(event, 'v')) {
        if (clipboardNode) {
          event.preventDefault()
          onPaste()
        }
        return
      }
      
      // Handle Delete (Delete or Backspace)
      if (isDeleteKey(event)) {
        // Get selected nodes and edges
        const selectedNodes = getNodes().filter(node => node.selected)
        const selectedEdges = getEdges().filter(edge => edge.selected)
        
        // Delete selected items
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          event.preventDefault()
          event.stopPropagation()
          
          deleteElements({
            nodes: selectedNodes,
            edges: selectedEdges
          })
          
          // Clear selection if deleted node was selected
          if (selectedNodes.some(node => node.id === selectedNodeId)) {
            setSelectedNodeId(null)
          }
          
          notifyModified()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [deleteElements, getNodes, getEdges, selectedNodeId, setSelectedNodeId, notifyModified, clipboardNode, onCopy, onCut, onPaste])
}
