import { useReactFlow } from '@xyflow/react'
import { X, Plus, Trash2, Save, Check } from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { showError } from '../utils/notifications'
import { showConfirm } from '../utils/confirm'
import { api } from '../api/client'
import { logger } from '../utils/logger'
import { isAgentNode, isConditionNode, isLoopNode, isInputNode } from '../types/nodeData'
import AgentNodeEditor from './editors/AgentNodeEditor'
import ConditionNodeEditor from './editors/ConditionNodeEditor'
import LoopNodeEditor from './editors/LoopNodeEditor'
import InputNodeEditor from './editors/InputNodeEditor'
import DatabaseNodeEditor from './editors/DatabaseNodeEditor'
import FirebaseNodeEditor from './editors/FirebaseNodeEditor'
import BigQueryNodeEditor from './editors/BigQueryNodeEditor'
import type { StorageAdapter } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'

interface PropertyPanelProps {
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
  selectedNodeIds?: Set<string> // Multiple selected node IDs
  nodes?: any[] // Pass nodes as prop for better reactivity
  onSave?: () => void // Optional callback when save is clicked
  onSaveWorkflow?: () => Promise<string | null> // Callback to save the entire workflow
  // Dependency injection
  storage?: StorageAdapter | null
}


interface LLMProvider {
  id: string
  name: string
  type: string
  apiKey: string
  baseUrl?: string
  defaultModel: string
  models: string[]
  enabled: boolean
}

export default function PropertyPanel({ selectedNodeId, setSelectedNodeId, selectedNodeIds, nodes: nodesProp, onSave, onSaveWorkflow, storage = defaultAdapters.createLocalStorageAdapter() }: PropertyPanelProps) {
  const { setNodes, deleteElements, getNodes } = useReactFlow()
  const [showAddInput, setShowAddInput] = useState(false)
  const [availableModels, setAvailableModels] = useState<Array<{ value: string; label: string; provider: string }>>([])
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [panelOpen, setPanelOpen] = useState(true)

  // Get nodes directly from React Flow store for stability, fallback to prop
  const nodes = useMemo(() => {
    try {
      const flowNodes = getNodes()
      return flowNodes.length > 0 ? flowNodes : (nodesProp || [])
    } catch {
      return nodesProp || []
    }
  }, [getNodes, nodesProp])
  
  
  // Local state for input fields to prevent flickering
  const [nameValue, setNameValue] = useState('')
  const [descriptionValue, setDescriptionValue] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)
  
  // Refs removed - now handled by node-specific editors

  // Get selected node - use a ref to cache and prevent flickering
  const selectedNodeRef = useRef<any>(null)
  const selectedNodeIdRef = useRef<string | null>(null)
  
  const selectedNode = useMemo(() => {
    // If no selection, clear cache
    if (!selectedNodeId) {
      selectedNodeRef.current = null
      selectedNodeIdRef.current = null
      return null
    }
    
    // If same node ID and we have it cached, return cached version
    if (selectedNodeIdRef.current === selectedNodeId && selectedNodeRef.current) {
      // Verify it still exists
      try {
        const flowNodes = getNodes()
        const stillExists = flowNodes.some(n => n.id === selectedNodeId)
        if (stillExists) {
          // Update cache with latest data but return cached reference to prevent flicker
          const updated = flowNodes.find((n) => n.id === selectedNodeId)
          if (updated) {
            // Only update cache, but return the cached reference for stability
            Object.assign(selectedNodeRef.current, updated)
            return selectedNodeRef.current
          }
        }
      } catch {
        // Fallback
        const stillExists = nodes.some(n => n.id === selectedNodeId)
        if (stillExists) {
          const updated = nodes.find((n) => n.id === selectedNodeId)
          if (updated) {
            Object.assign(selectedNodeRef.current, updated)
            return selectedNodeRef.current
          }
        }
      }
    }
    
    // Find the node
    let found = null
    try {
      const flowNodes = getNodes()
      found = flowNodes.find((n) => n.id === selectedNodeId) || null
    } catch {
      found = nodes.find((n) => n.id === selectedNodeId) || null
    }
    
    // Cache it
    if (found) {
      selectedNodeRef.current = { ...found } // Create a copy to stabilize reference
      selectedNodeIdRef.current = selectedNodeId
    } else {
      selectedNodeRef.current = null
      selectedNodeIdRef.current = null
    }
    
    return found
  }, [selectedNodeId, getNodes, nodes])

  useEffect(() => {
    setPanelOpen(Boolean(selectedNode))
  }, [selectedNode])
  
  
  // Local state for config fields removed - now handled by node-specific editors
  
  // Sync all local state with node data only when a different node is selected
  // This prevents flickering while typing
  useEffect(() => {
    // Only clear if selectedNodeId is actually null (not just if selectedNode is null temporarily)
    if (!selectedNodeId) {
      // Reset when no node is selected
      setNameValue('')
      setDescriptionValue('')
      // Config fields are now handled by node-specific editors
      return
    }
    
    // Get node data directly to avoid dependency on selectedNode
    let nodeData = null
    try {
      const flowNodes = getNodes()
      const node = flowNodes.find((n) => n.id === selectedNodeId)
      if (node) {
        nodeData = node.data
      }
    } catch {
      const node = nodes.find((n) => n.id === selectedNodeId)
      if (node) {
        nodeData = node.data
      }
    }
    
    // Only update if we found the node
    if (nodeData) {
      const nodeName = nodeData.name || nodeData.label || ''
      const nodeDescription = nodeData.description || ''
      
      // Initialize loop_config with defaults if it's missing or empty for Loop nodes
      const selectedNode = nodes.find((n) => n.id === selectedNodeId) || 
                          (() => {
                            try {
                              const flowNodes = getNodes()
                              return flowNodes.find((n) => n.id === selectedNodeId)
                            } catch {
                              return null
                            }
                          })()
      
      if (selectedNode && selectedNode.type === 'loop' && (!nodeData.loop_config || Object.keys(nodeData.loop_config).length === 0)) {
        const defaultLoopConfig = {
          loop_type: 'for_each',
          max_iterations: 0,
        }
        // Update the node with default config
        setNodes((nodes) =>
          nodes.map((node) =>
            node.id === selectedNodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    loop_config: defaultLoopConfig,
                  },
                }
              : node
          )
        )
      }
      
      // Only sync if the input is not currently focused (user is not typing)
      if (document.activeElement !== nameInputRef.current) {
        setNameValue(nodeName)
      }
      if (document.activeElement !== descriptionInputRef.current) {
        setDescriptionValue(nodeDescription)
      }
      // Config fields are now handled by node-specific editors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId]) // Only depend on selectedNodeId, not the node data

  // Load available models from configured providers
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Try to load from backend first using authenticated API client
        const data = await api.getLLMSettings()
        if (data.providers && data.providers.length > 0) {
          const models: Array<{ value: string; label: string; provider: string }> = []
          data.providers.forEach((provider: LLMProvider) => {
            if (provider.enabled && provider.models && provider.models.length > 0) {
              provider.models.forEach((model) => {
                models.push({
                  value: model,
                  label: `${model} (${provider.name})`,
                  provider: provider.name
                })
              })
            }
          })
          setAvailableModels(models)
          return
        }
      } catch (e) {
        logger.debug('Could not load from backend, trying localStorage', e)
      }
      
      // Fallback to storage
      if (!storage) {
        setAvailableModels([])
        return
      }

      try {
        const saved = storage.getItem('llm_settings')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            const providers: LLMProvider[] = parsed.providers || []
            const models: Array<{ value: string; label: string; provider: string }> = []
            providers.forEach((provider) => {
              if (provider.enabled && provider.models && provider.models.length > 0) {
                provider.models.forEach((model) => {
                  models.push({
                    value: model,
                    label: `${model} (${provider.name})`,
                    provider: provider.name
                  })
                })
              }
            })
            if (models.length > 0) {
              setAvailableModels(models)
              return
            }
          } catch (e) {
            logger.error('Failed to load providers:', e)
          }
        }
      } catch (loadError) {
        logger.error('Failed to load models from storage', loadError)
      }

      // Fallback to default GPT models if no providers found
      setAvailableModels([
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)', provider: 'OpenAI' },
        { value: 'gpt-4o', label: 'GPT-4o (OpenAI)', provider: 'OpenAI' },
        { value: 'gpt-4', label: 'GPT-4 (OpenAI)', provider: 'OpenAI' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (OpenAI)', provider: 'OpenAI' }
      ])
    }
    
    loadModels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // storage is accessed via closure in loadModels


  // Check if multiple nodes are selected
  const multipleSelected = selectedNodeIds && selectedNodeIds.size > 1
  
  if (!selectedNode) {
    return null
  }

  if (!panelOpen) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-10">
        <button
          onClick={() => setPanelOpen(true)}
          className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-l-full shadow hover:bg-gray-100 focus:outline-none"
          title="Reopen properties panel"
        >
          Properties
        </button>
      </div>
    )
  }

  if (multipleSelected) {
    return (
      <div className="w-80 h-full bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Properties</h3>
        <div className="text-sm text-gray-500 mb-2">
          <p className="mb-2">Multiple nodes selected ({selectedNodeIds?.size})</p>
          <p className="text-xs text-gray-400">Select a single node to edit its properties</p>
          <p className="text-xs text-gray-400 mt-2">You can drag selected nodes together to move them</p>
        </div>
      </div>
    )
  }

  const handleUpdate = (field: string, value: any) => {
    if (!selectedNode) return
    
    const updatedData = { ...selectedNode.data, [field]: value }
    
    // Update label when name changes
    if (field === 'name') {
      updatedData.label = value
      setNameValue(value) // Update local state immediately
    }
    
    if (field === 'description') {
      setDescriptionValue(value) // Update local state immediately
    }
    
    // Update the node state
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === selectedNode.id ? { ...node, data: updatedData } : node
      )
    )
  }
  
  // Helper to update nested config objects
  const handleConfigUpdate = (configField: string, field: string, value: any) => {
    if (!selectedNode) return
    
    const currentConfig = selectedNode.data[configField] || {}
    const updatedData = {
      ...selectedNode.data,
      [configField]: {
        ...currentConfig,
        [field]: value
      }
    }
    
    // Config fields are now handled by node-specific editors
    // No need to update local state here - editors handle their own state
    
    // Update the node state
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === selectedNode.id ? { ...node, data: updatedData } : node
      )
    )
  }

  const handleDelete = async () => {
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
  }

  const handleClose = () => {
    // Just close the panel (deselect node) without deleting
    setSelectedNodeId(null)
    setPanelOpen(false)
  }

  const handleSave = async () => {
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
  }

  const handleAddInput = (inputName: string, sourceNode: string, sourceField: string) => {
    if (!selectedNode) return
    
    const currentInputs = selectedNode.data.inputs || []
    const newInput = {
      name: inputName,
      source_node: sourceNode || undefined,
      source_field: sourceField || 'output'
    }
    
    handleUpdate('inputs', [...currentInputs, newInput])
    setShowAddInput(false)
  }

  const handleRemoveInput = (index: number) => {
    if (!selectedNode) return
    
    const currentInputs = selectedNode.data.inputs || []
    const newInputs = currentInputs.filter((_: any, i: number) => i !== index)
    handleUpdate('inputs', newInputs)
  }

  const handleUpdateInput = (index: number, field: string, value: any) => {
    if (!selectedNode) return
    
    const currentInputs = [...(selectedNode.data.inputs || [])]
    currentInputs[index] = { ...currentInputs[index], [field]: value }
    handleUpdate('inputs', currentInputs)
  }

  return (
    <div className="relative w-80 h-full bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 p-1 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
        title="Close properties panel"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 transition-colors ${
              saveStatus === 'saved'
                ? 'bg-green-100 text-green-700'
                : saveStatus === 'saving'
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
            title="Save changes"
          >
            {saveStatus === 'saved' ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : saveStatus === 'saving' ? (
              <>
                <Save className="w-4 h-4 animate-pulse" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Delete node"
            aria-label="Delete selected node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            ref={nameInputRef}
            type="text"
            value={nameValue}
            onChange={(e) => {
              const newValue = e.target.value
              setNameValue(newValue)
              handleUpdate('name', newValue)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="node-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            id="node-description"
            ref={descriptionInputRef}
            value={descriptionValue}
            onChange={(e) => {
              const newValue = e.target.value
              setDescriptionValue(newValue)
              handleUpdate('description', newValue)
            }}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            aria-label="Node description"
          />
        </div>

        {/* Inputs Configuration - for all node types except Start */}
        {selectedNode.type !== 'start' && selectedNode.type !== 'end' && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-900">Inputs</label>
              <button
                onClick={() => setShowAddInput(true)}
                className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 flex items-center gap-1"
                aria-label="Add input to node"
              >
                <Plus className="w-3 h-3" />
                Add Input
              </button>
            </div>

            {/* List existing inputs */}
            <div className="space-y-2 mb-3">
              {(selectedNode.data.inputs || []).map((input: any, index: number) => (
                <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">{input.name}</span>
                    <button
                      onClick={() => handleRemoveInput(index)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                      aria-label={`Remove input ${input.name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="text-gray-500">Source Node:</span>
                      <input
                        type="text"
                        value={input.source_node || '(workflow variable)'}
                        onChange={(e) => handleUpdateInput(index, 'source_node', e.target.value || undefined)}
                        placeholder="node_id or leave blank"
                        className="w-full mt-1 px-2 py-1 text-xs border rounded"
                      />
                    </div>
                    <div>
                      <span className="text-gray-500">Source Field:</span>
                      <input
                        type="text"
                        value={input.source_field || 'output'}
                        onChange={(e) => handleUpdateInput(index, 'source_field', e.target.value)}
                        placeholder="output"
                        className="w-full mt-1 px-2 py-1 text-xs border rounded"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Input Modal */}
            {showAddInput && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-input-title"
              >
                <div className="bg-white rounded-lg p-4 w-96">
                  <h4 id="add-input-title" className="font-semibold mb-3">Add Input</h4>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.currentTarget)
                      handleAddInput(
                        formData.get('inputName') as string,
                        formData.get('sourceNode') as string,
                        formData.get('sourceField') as string
                      )
                    }}
                  >
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Input Name *
                        </label>
                        <input
                          name="inputName"
                          type="text"
                          required
                          placeholder="e.g., topic, text, data"
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Name this agent will use to access the data
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Source Node ID (optional)
                        </label>
                        <input
                          name="sourceNode"
                          type="text"
                          placeholder="Leave blank for workflow input"
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Get data from another node's output. Leave blank to get from workflow input variables.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Source Field
                        </label>
                        <input
                          name="sourceField"
                          type="text"
                          defaultValue="output"
                          placeholder="output"
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Which field to get from the source (usually 'output')
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddInput(false)}
                        className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        aria-label="Cancel adding input"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                        aria-label="Add input to node"
                      >
                        Add Input
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
              💡 Inputs connect this node to data from previous nodes or workflow variables
            </div>
          </div>
        )}

        {/* Agent-specific properties */}
        {isAgentNode(selectedNode) && (
          <AgentNodeEditor
            node={selectedNode}
            availableModels={availableModels}
            onUpdate={handleUpdate}
            onConfigUpdate={handleConfigUpdate}
          />
        )}

        {/* Condition-specific properties */}
        {isConditionNode(selectedNode) && (
          <ConditionNodeEditor
            node={selectedNode}
            onConfigUpdate={handleConfigUpdate}
          />
        )}

        {/* Loop-specific properties */}
        {isLoopNode(selectedNode) && (
          <LoopNodeEditor
            node={selectedNode}
            onUpdate={handleUpdate}
            onConfigUpdate={handleConfigUpdate}
          />
        )}

        {/* Input node configurations - use InputNodeEditor for simpler types */}
        {isInputNode(selectedNode) && ['gcp_bucket', 'aws_s3', 'gcp_pubsub', 'local_filesystem'].includes(selectedNode.type) && (
          <InputNodeEditor
            node={selectedNode}
            onConfigUpdate={handleConfigUpdate}
          />
        )}

        {/* Database configuration - use DatabaseNodeEditor */}
        {selectedNode.type === 'database' && (
          <DatabaseNodeEditor
            node={selectedNode}
            onConfigUpdate={handleConfigUpdate}
          />
        )}

        {selectedNode.type === 'firebase' && (
          <FirebaseNodeEditor
            node={selectedNode}
            onConfigUpdate={handleConfigUpdate}
          />
        )}

        {selectedNode.type === 'bigquery' && (
          <BigQueryNodeEditor
            node={selectedNode}
            onConfigUpdate={handleConfigUpdate}
          />
        )}
      </div>
    </div>
  )
}

