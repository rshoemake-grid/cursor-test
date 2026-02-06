/**
 * Node Operations Hook
 * Manages node update operations, input management, and node deletion
 */

import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { showError } from '../../utils/notifications'
import { logger } from '../../utils/logger'
import { UI_CONSTANTS } from '../../config/constants'
import { confirmDelete } from '../utils/confirmations'
import { logicalOr, logicalOrToEmptyObject, logicalOrToEmptyArray } from '../utils/logicalOr'

interface UseNodeOperationsOptions {
  selectedNode: any | null
  setSelectedNodeId: (id: string | null) => void
  onSave?: () => void
  onSaveWorkflow?: () => Promise<string | null>
  // Dependency injection
  showErrorNotification?: typeof showError
  logger?: typeof logger
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
  showErrorNotification = showError,
  logger: injectedLogger = logger,
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
    
    const itemName = logicalOr(selectedNode.data.name, logicalOr(selectedNode.data.label, selectedNode.id))
    await confirmDelete(itemName, () => {
      deleteElements({ nodes: [{ id: selectedNode.id }] })
      setSelectedNodeId(null)
    }, { title: 'Delete Node' })
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
      }, UI_CONSTANTS.SAVE_STATUS_DELAY)
    } catch (error) {
      injectedLogger.error('Save failed:', error)
      setSaveStatus('idle')
      showErrorNotification('Failed to save workflow: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }, [selectedNode, onSave, onSaveWorkflow, showErrorNotification, injectedLogger])

  const handleAddInput = useCallback((inputName: string, sourceNode: string, sourceField: string, setShowAddInput: (show: boolean) => void) => {
    if (!selectedNode) return
    
    const currentInputs = logicalOrToEmptyArray(selectedNode.data.inputs)
    const newInput = {
      name: inputName,
      source_node: logicalOr(sourceNode, undefined),
      source_field: logicalOr(sourceField, 'output')
    }
    
    handleUpdate('inputs', [...currentInputs, newInput])
    setShowAddInput(false)
  }, [selectedNode, handleUpdate])

  const handleRemoveInput = useCallback((index: number) => {
    if (!selectedNode) return
    
    const currentInputs = logicalOrToEmptyArray(selectedNode.data.inputs)
    const newInputs = currentInputs.filter((_: any, i: number) => i !== index)
    handleUpdate('inputs', newInputs)
  }, [selectedNode, handleUpdate])

  const handleUpdateInput = useCallback((index: number, field: string, value: any) => {
    if (!selectedNode) return
    
    const currentInputs = [...logicalOrToEmptyArray(selectedNode.data.inputs)]
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
