/**
 * Node Operations Hook
 * Manages node update operations, input management, and node deletion
 */

import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { showError } from '../utils/notifications'
import { showConfirm } from '../utils/confirm'
import { logger } from '../utils/logger'

interface UseNodeOperationsOptions {
  selectedNode: any | null
  setSelectedNodeId: (id: string | null) => void
  onSave?: () => void
  onSaveWorkflow?: () => Promise<string | null>
}

/**
 * Hook for managing node operations
 * 
 * @param options Configuration options
 * @returns Node operation handlers
 */
export function useNodeOperations({
  selectedNode,
  setSelectedNodeId,
  onSave,
  onSaveWorkflow,
}: UseNodeOperationsOptions) {
  const { setNodes, deleteElements } = useReactFlow()

  const handleUpdate = useCallback((field: string, value: any) => {
    if (!selectedNode) return
    
    const updatedData = { ...selectedNode.data, [field]: value }
    
    // Update label when name changes
    if (field === 'name') {
      updatedData.label = value
    }
    
    // Update the node state
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === selectedNode.id ? { ...node, data: updatedData } : node
      )
    )
  }, [selectedNode, setNodes])

  const handleConfigUpdate = useCallback((configField: string, field: string, value: any) => {
    if (!selectedNode) return
    
    const currentConfig = selectedNode.data[configField] || {}
    const updatedData = {
      ...selectedNode.data,
      [configField]: {
        ...currentConfig,
        [field]: value
      }
    }
    
    // Update the node state
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === selectedNode.id ? { ...node, data: updatedData } : node
      )
    )
  }, [selectedNode, setNodes])

  const handleDelete = useCallback(async () => {
    if (!selectedNode) return
    // Require confirmation before deleting
    const confirmed = await showConfirm(
      `Are you sure you want to delete "${selectedNode.data.name || selectedNode.data.label || selectedNode.id}"?`,
      { title: 'Delete Node', confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
    )
    if (confirmed) {
      deleteElements({ nodes: [{ id: selectedNode.id }] })
      setSelectedNodeId(null)
    }
  }, [selectedNode, deleteElements, setSelectedNodeId])

  const handleSave = useCallback(async (setSaveStatus: (status: 'idle' | 'saving' | 'saved') => void) => {
    if (!selectedNode) return
    
    setSaveStatus('saving')
    
    try {
      // Save the workflow first (if callback provided)
      if (onSaveWorkflow) {
        await onSaveWorkflow()
      }
      
      // Call optional save callback if provided
      if (onSave) {
        await onSave()
      }
      
      // Show saved feedback
      setSaveStatus('saved')
      setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
    } catch (error) {
      logger.error('Save failed:', error)
      setSaveStatus('idle')
      showError('Failed to save workflow: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }, [selectedNode, onSave, onSaveWorkflow])

  const handleAddInput = useCallback((inputName: string, sourceNode: string, sourceField: string, setShowAddInput: (show: boolean) => void) => {
    if (!selectedNode) return
    
    const currentInputs = selectedNode.data.inputs || []
    const newInput = {
      name: inputName,
      source_node: sourceNode || undefined,
      source_field: sourceField || 'output'
    }
    
    handleUpdate('inputs', [...currentInputs, newInput])
    setShowAddInput(false)
  }, [selectedNode, handleUpdate])

  const handleRemoveInput = useCallback((index: number) => {
    if (!selectedNode) return
    
    const currentInputs = selectedNode.data.inputs || []
    const newInputs = currentInputs.filter((_: any, i: number) => i !== index)
    handleUpdate('inputs', newInputs)
  }, [selectedNode, handleUpdate])

  const handleUpdateInput = useCallback((index: number, field: string, value: any) => {
    if (!selectedNode) return
    
    const currentInputs = [...(selectedNode.data.inputs || [])]
    currentInputs[index] = { ...currentInputs[index], [field]: value }
    handleUpdate('inputs', currentInputs)
  }, [selectedNode, handleUpdate])

  return {
    handleUpdate,
    handleConfigUpdate,
    handleDelete,
    handleSave,
    handleAddInput,
    handleRemoveInput,
    handleUpdateInput,
  }
}
