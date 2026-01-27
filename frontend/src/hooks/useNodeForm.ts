/**
 * Node Form Hook
 * Manages form state for editing node properties (name, description)
 * Handles synchronization with selected node and prevents flickering
 */

import { useState, useEffect, useRef } from 'react'
import type { Node } from '@xyflow/react'

interface UseNodeFormOptions {
  selectedNode: Node | null
  onUpdate: (field: string, value: any) => void
}

/**
 * Hook for managing node form state
 * 
 * @param options Configuration options
 * @returns Form state, refs, and handlers
 */
export function useNodeForm({ selectedNode, onUpdate }: UseNodeFormOptions) {
  const [nameValue, setNameValue] = useState('')
  const [descriptionValue, setDescriptionValue] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)

  // Sync form values with selected node data
  useEffect(() => {
    if (!selectedNode) {
      setNameValue('')
      setDescriptionValue('')
      return
    }

    const nodeData = selectedNode.data || {}
    const nodeName = (typeof nodeData.name === 'string' ? nodeData.name : '') || 
                    (typeof nodeData.label === 'string' ? nodeData.label : '') || 
                    ''
    const nodeDescription = (typeof nodeData.description === 'string' ? nodeData.description : '') || ''

    // Only sync if the input is not currently focused (user is not typing)
    if (document.activeElement !== nameInputRef.current) {
      setNameValue(nodeName)
    }
    if (document.activeElement !== descriptionInputRef.current) {
      setDescriptionValue(nodeDescription)
    }
  }, [selectedNode])

  const handleNameChange = (value: string) => {
    setNameValue(value)
    if (selectedNode) {
      onUpdate('name', value)
    }
  }

  const handleDescriptionChange = (value: string) => {
    setDescriptionValue(value)
    if (selectedNode) {
      onUpdate('description', value)
    }
  }

  return {
    nameValue,
    descriptionValue,
    nameInputRef,
    descriptionInputRef,
    setNameValue,
    setDescriptionValue,
    handleNameChange,
    handleDescriptionChange,
  }
}
