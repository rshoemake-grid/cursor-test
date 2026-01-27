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
  
  // Input config refs
  const bucketNameRef = useRef<HTMLInputElement>(null)
  const objectPathRef = useRef<HTMLInputElement>(null)
  const gcpCredentialsRef = useRef<HTMLTextAreaElement>(null)
  const objectKeyRef = useRef<HTMLInputElement>(null)
  const accessKeyIdRef = useRef<HTMLInputElement>(null)
  const secretKeyRef = useRef<HTMLInputElement>(null)
  const regionRef = useRef<HTMLInputElement>(null)
  const projectIdRef = useRef<HTMLInputElement>(null)
  const topicNameRef = useRef<HTMLInputElement>(null)
  const subscriptionNameRef = useRef<HTMLInputElement>(null)
  const filePathRef = useRef<HTMLInputElement>(null)
  const filePatternRef = useRef<HTMLInputElement>(null)

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
  
  // Input config local state
  const [bucketNameValue, setBucketNameValue] = useState('')
  const [objectPathValue, setObjectPathValue] = useState('')
  const [gcpCredentialsValue, setGcpCredentialsValue] = useState('')
  const [objectKeyValue, setObjectKeyValue] = useState('')
  const [accessKeyIdValue, setAccessKeyIdValue] = useState('')
  const [secretKeyValue, setSecretKeyValue] = useState('')
  const [regionValue, setRegionValue] = useState('us-east-1')
  const [projectIdValue, setProjectIdValue] = useState('')
  const [topicNameValue, setTopicNameValue] = useState('')
  const [subscriptionNameValue, setSubscriptionNameValue] = useState('')
  const [filePathValue, setFilePathValue] = useState('')
  const [filePatternValue, setFilePatternValue] = useState('')
  const [modeValue, setModeValue] = useState('read')
  const [overwriteValue, setOverwriteValue] = useState(true)
  
  // Sync all local state with node data only when a different node is selected
  // This prevents flickering while typing
  useEffect(() => {
    // Only clear if selectedNodeId is actually null (not just if selectedNode is null temporarily)
    if (!selectedNodeId) {
      // Reset when no node is selected
      setNameValue('')
      setDescriptionValue('')
      // Config fields are now handled by node-specific editors
      setBucketNameValue('')
      setObjectPathValue('')
      setGcpCredentialsValue('')
      setObjectKeyValue('')
      setAccessKeyIdValue('')
      setSecretKeyValue('')
      setRegionValue('us-east-1')
      setProjectIdValue('')
      setTopicNameValue('')
      setSubscriptionNameValue('')
      setFilePathValue('')
      setFilePatternValue('')
      setModeValue('read')
      setOverwriteValue(true)
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
      const agentConfig = nodeData.agent_config || {}
      const conditionConfig = nodeData.condition_config || {}
      let loopConfig = nodeData.loop_config || {}
      const inputConfig = nodeData.input_config || {}
      
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
        loopConfig = defaultLoopConfig
      }
      
      // Only sync if the input is not currently focused (user is not typing)
      if (document.activeElement !== nameInputRef.current) {
        setNameValue(nodeName)
      }
      if (document.activeElement !== descriptionInputRef.current) {
        setDescriptionValue(nodeDescription)
      }
      // Config fields are now handled by node-specific editors
      
      // Input config fields
      if (document.activeElement !== bucketNameRef.current) {
        setBucketNameValue(inputConfig.bucket_name || '')
      }
      if (document.activeElement !== objectPathRef.current) {
        setObjectPathValue(inputConfig.object_path || '')
      }
      if (document.activeElement !== gcpCredentialsRef.current) {
        setGcpCredentialsValue(inputConfig.credentials || '')
      }
      if (document.activeElement !== objectKeyRef.current) {
        setObjectKeyValue(inputConfig.object_key || '')
      }
      if (document.activeElement !== accessKeyIdRef.current) {
        setAccessKeyIdValue(inputConfig.access_key_id || '')
      }
      if (document.activeElement !== secretKeyRef.current) {
        setSecretKeyValue(inputConfig.secret_access_key || '')
      }
      if (document.activeElement !== regionRef.current) {
        setRegionValue(inputConfig.region || 'us-east-1')
      }
      if (document.activeElement !== projectIdRef.current) {
        setProjectIdValue(inputConfig.project_id || '')
      }
      if (document.activeElement !== topicNameRef.current) {
        setTopicNameValue(inputConfig.topic_name || '')
      }
      if (document.activeElement !== subscriptionNameRef.current) {
        setSubscriptionNameValue(inputConfig.subscription_name || '')
      }
      if (document.activeElement !== filePathRef.current) {
        setFilePathValue(inputConfig.file_path || '')
      }
      if (document.activeElement !== filePatternRef.current) {
        setFilePatternValue(inputConfig.file_pattern || '')
      }
      // Mode is not an input field, so always sync
      setModeValue(inputConfig.mode || 'read')
      setOverwriteValue(inputConfig.overwrite !== undefined ? inputConfig.overwrite : true)
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
    if (configField === 'input_config') {
      // Update appropriate input config field
      if (field === 'bucket_name') setBucketNameValue(value)
      else if (field === 'object_path') setObjectPathValue(value)
      else if (field === 'credentials') setGcpCredentialsValue(value)
      else if (field === 'object_key') setObjectKeyValue(value)
      else if (field === 'access_key_id') setAccessKeyIdValue(value)
      else if (field === 'secret_access_key') setSecretKeyValue(value)
      else if (field === 'region') setRegionValue(value)
      else if (field === 'project_id') setProjectIdValue(value)
      else if (field === 'topic_name') setTopicNameValue(value)
      else if (field === 'subscription_name') setSubscriptionNameValue(value)
      else if (field === 'file_path') setFilePathValue(value)
      else if (field === 'file_pattern') setFilePatternValue(value)
      else if (field === 'overwrite') setOverwriteValue(value)
    }
    
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

        {/* GCP Bucket configuration - Legacy (kept for reference, replaced by InputNodeEditor above) */}
        {selectedNode.type === 'gcp_bucket' && !['gcp_bucket', 'aws_s3', 'gcp_pubsub', 'local_filesystem'].includes(selectedNode.type) && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">GCP Bucket Configuration</h4>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
              <select
                value={modeValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setModeValue(newValue)
                  handleConfigUpdate('input_config', 'mode', newValue)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="read">Read from bucket</option>
                <option value="write">Write to bucket</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Read: Fetch data from bucket. Write: Save data to bucket.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bucket Name</label>
              <input
                ref={bucketNameRef}
                type="text"
                value={bucketNameValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setBucketNameValue(newValue)
                  handleConfigUpdate('input_config', 'bucket_name', newValue)
                }}
                placeholder="my-bucket-name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Object Path</label>
              <input
                ref={objectPathRef}
                type="text"
                value={objectPathValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setObjectPathValue(newValue)
                  handleConfigUpdate('input_config', 'object_path', newValue)
                }}
                placeholder="path/to/file.txt or leave blank for all objects"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">GCP Credentials (JSON)</label>
              <textarea
                ref={gcpCredentialsRef}
                value={gcpCredentialsValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setGcpCredentialsValue(newValue)
                  handleConfigUpdate('input_config', 'credentials', newValue)
                }}
                rows={3}
                placeholder="Paste GCP service account JSON credentials"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Service account JSON credentials for GCP access
              </p>
            </div>
          </div>
        )}

        {/* AWS S3 configuration */}
        {selectedNode.type === 'aws_s3' && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">AWS S3 Configuration</h4>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
              <select
                value={modeValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setModeValue(newValue)
                  handleConfigUpdate('input_config', 'mode', newValue)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="read">Read from bucket</option>
                <option value="write">Write to bucket</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Read: Fetch data from bucket. Write: Save data to bucket.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bucket Name</label>
              <input
                ref={bucketNameRef}
                type="text"
                value={bucketNameValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setBucketNameValue(newValue)
                  handleConfigUpdate('input_config', 'bucket_name', newValue)
                }}
                placeholder="my-bucket-name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Object Key</label>
              <input
                ref={objectKeyRef}
                type="text"
                value={objectKeyValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setObjectKeyValue(newValue)
                  handleConfigUpdate('input_config', 'object_key', newValue)
                }}
                placeholder="path/to/file.txt or leave blank for all objects"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">AWS Access Key ID</label>
              <input
                ref={accessKeyIdRef}
                type="text"
                value={accessKeyIdValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setAccessKeyIdValue(newValue)
                  handleConfigUpdate('input_config', 'access_key_id', newValue)
                }}
                placeholder="AKIAIOSFODNN7EXAMPLE"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">AWS Secret Access Key</label>
              <input
                ref={secretKeyRef}
                type="password"
                value={secretKeyValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setSecretKeyValue(newValue)
                  handleConfigUpdate('input_config', 'secret_access_key', newValue)
                }}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">AWS Region</label>
              <input
                ref={regionRef}
                type="text"
                value={regionValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setRegionValue(newValue)
                  handleConfigUpdate('input_config', 'region', newValue)
                }}
                placeholder="us-east-1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* GCP Pub/Sub configuration - Legacy (replaced by InputNodeEditor above) */}
        {selectedNode.type === 'gcp_pubsub' && !isInputNode(selectedNode) && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">GCP Pub/Sub Configuration</h4>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
              <select
                value={modeValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setModeValue(newValue)
                  handleConfigUpdate('input_config', 'mode', newValue)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="read">Subscribe (read messages)</option>
                <option value="write">Publish (write messages)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Subscribe: Receive messages from topic. Publish: Send messages to topic.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
              <input
                ref={projectIdRef}
                type="text"
                value={projectIdValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setProjectIdValue(newValue)
                  handleConfigUpdate('input_config', 'project_id', newValue)
                }}
                placeholder="my-gcp-project"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic Name</label>
              <input
                ref={topicNameRef}
                type="text"
                value={topicNameValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setTopicNameValue(newValue)
                  handleConfigUpdate('input_config', 'topic_name', newValue)
                }}
                placeholder="my-topic"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Name</label>
              <input
                ref={subscriptionNameRef}
                type="text"
                value={subscriptionNameValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setSubscriptionNameValue(newValue)
                  handleConfigUpdate('input_config', 'subscription_name', newValue)
                }}
                placeholder="my-subscription"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">GCP Credentials (JSON)</label>
              <textarea
                ref={gcpCredentialsRef}
                value={gcpCredentialsValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setGcpCredentialsValue(newValue)
                  handleConfigUpdate('input_config', 'credentials', newValue)
                }}
                rows={3}
                placeholder="Paste GCP service account JSON credentials"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>
        )}

        {/* Local File System configuration */}
        {selectedNode.type === 'database' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Database Type</label>
              <select
                value={selectedNode.data.input_config?.database_type || 'postgresql'}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'database_type', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="sqlite">SQLite</option>
                <option value="mongodb">MongoDB</option>
                <option value="mssql">Microsoft SQL Server</option>
                <option value="oracle">Oracle</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Type of database to connect to
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Connection Mode</label>
              <select
                value={selectedNode.data.input_config?.mode || 'read'}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'mode', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="read">Read</option>
                <option value="write">Write</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Whether to read from or write to the database
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Connection String (optional)</label>
              <textarea
                value={selectedNode.data.input_config?.connection_string || ''}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'connection_string', e.target.value)
                }
                placeholder="postgresql://user:password@host:port/database"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Full connection string. If provided, individual connection fields are ignored.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-3 mt-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">Or specify individual fields:</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
              <input
                type="text"
                value={selectedNode.data.input_config?.host || ''}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'host', e.target.value)
                }
                placeholder="localhost"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
              <input
                type="number"
                value={selectedNode.data.input_config?.port || ''}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'port', e.target.value ? parseInt(e.target.value) : undefined)
                }
                placeholder="5432"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Database Name</label>
              <input
                type="text"
                value={selectedNode.data.input_config?.database_name || ''}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'database_name', e.target.value)
                }
                placeholder="mydatabase"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={selectedNode.data.input_config?.username || ''}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'username', e.target.value)
                }
                placeholder="dbuser"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={selectedNode.data.input_config?.password || ''}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'password', e.target.value)
                }
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Password will be stored securely
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Query / SQL Statement</label>
              <textarea
                value={selectedNode.data.input_config?.query || ''}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'query', e.target.value)
                }
                placeholder="SELECT * FROM users WHERE id = ?"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                SQL query to execute. Use ? for parameterized queries.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SSL Mode</label>
              <select
                value={selectedNode.data.input_config?.ssl_mode || 'prefer'}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'ssl_mode', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="disable">Disable</option>
                <option value="allow">Allow</option>
                <option value="prefer">Prefer</option>
                <option value="require">Require</option>
                <option value="verify-ca">Verify CA</option>
                <option value="verify-full">Verify Full</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                SSL/TLS connection mode
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900 font-medium mb-1">💾 Database Node</p>
              <p className="text-xs text-blue-700">
                This node connects to a database and executes SQL queries. Use parameterized queries (?) for security.
              </p>
            </div>
          </>
        )}

        {selectedNode.type === 'firebase' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Firebase Service</label>
              <select
                value={selectedNode.data.input_config?.firebase_service || 'firestore'}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'firebase_service', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="firestore">Firestore (NoSQL Database)</option>
                <option value="realtime_db">Realtime Database</option>
                <option value="storage">Firebase Storage</option>
                <option value="auth">Firebase Authentication</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select which Firebase service to use
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
              <input
                type="text"
                value={selectedNode.data.input_config?.project_id || ''}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'project_id', e.target.value)
                }
                placeholder="my-firebase-project"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Firebase project ID
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Connection Mode</label>
              <select
                value={selectedNode.data.input_config?.mode || 'read'}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'mode', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="read">Read</option>
                <option value="write">Write</option>
              </select>
            </div>

            {(selectedNode.data.input_config?.firebase_service === 'firestore' || 
              selectedNode.data.input_config?.firebase_service === 'realtime_db') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection / Path</label>
                  <input
                    type="text"
                    value={selectedNode.data.input_config?.collection_path || ''}
                    onChange={(e) =>
                      handleConfigUpdate('input_config', 'collection_path', e.target.value)
                    }
                    placeholder="users or users/{userId}/posts"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Firestore collection path or Realtime DB path
                  </p>
                </div>

                {selectedNode.data.input_config?.mode === 'read' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Query Filter (optional)</label>
                    <textarea
                      value={selectedNode.data.input_config?.query_filter || ''}
                      onChange={(e) =>
                        handleConfigUpdate('input_config', 'query_filter', e.target.value)
                      }
                      placeholder='{"field": "value"} or JSON query'
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      JSON filter for querying documents
                    </p>
                  </div>
                )}
              </>
            )}

            {selectedNode.data.input_config?.firebase_service === 'storage' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bucket Name</label>
                  <input
                    type="text"
                    value={selectedNode.data.input_config?.bucket_name || ''}
                    onChange={(e) =>
                      handleConfigUpdate('input_config', 'bucket_name', e.target.value)
                    }
                    placeholder="my-firebase-storage.appspot.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Path</label>
                  <input
                    type="text"
                    value={selectedNode.data.input_config?.file_path || ''}
                    onChange={(e) =>
                      handleConfigUpdate('input_config', 'file_path', e.target.value)
                    }
                    placeholder="images/photo.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Account Credentials (JSON)</label>
              <textarea
                value={selectedNode.data.input_config?.credentials || ''}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'credentials', e.target.value)
                }
                placeholder='{"type": "service_account", ...}'
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Firebase service account JSON credentials. Leave blank to use default credentials.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900 font-medium mb-1">🔥 Firebase Node</p>
              <p className="text-xs text-blue-700">
                Connect to Firebase services. Supports Firestore, Realtime Database, Storage, and Authentication.
              </p>
            </div>
          </>
        )}

        {selectedNode.type === 'bigquery' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
              <input
                type="text"
                value={selectedNode.data.input_config?.project_id || ''}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'project_id', e.target.value)
                }
                placeholder="my-gcp-project"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Google Cloud project ID
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Connection Mode</label>
              <select
                value={selectedNode.data.input_config?.mode || 'read'}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'mode', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="read">Read (Query)</option>
                <option value="write">Write (Insert/Update)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dataset</label>
              <input
                type="text"
                value={selectedNode.data.input_config?.dataset || ''}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'dataset', e.target.value)
                }
                placeholder="my_dataset"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                BigQuery dataset name
              </p>
            </div>

            {selectedNode.data.input_config?.mode === 'read' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SQL Query</label>
                  <textarea
                    value={selectedNode.data.input_config?.query || ''}
                    onChange={(e) =>
                      handleConfigUpdate('input_config', 'query', e.target.value)
                    }
                    placeholder="SELECT * FROM `project.dataset.table` LIMIT 100"
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Standard SQL query to execute
                  </p>
                </div>
              </>
            )}

            {selectedNode.data.input_config?.mode === 'write' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
                  <input
                    type="text"
                    value={selectedNode.data.input_config?.table || ''}
                    onChange={(e) =>
                      handleConfigUpdate('input_config', 'table', e.target.value)
                    }
                    placeholder="my_table"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Target table for insert/update operations
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Write Disposition</label>
                  <select
                    value={selectedNode.data.input_config?.write_disposition || 'append'}
                    onChange={(e) =>
                      handleConfigUpdate('input_config', 'write_disposition', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="append">Append</option>
                    <option value="truncate">Truncate and Write</option>
                    <option value="merge">Merge (Upsert)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    How to handle existing data in the table
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
              <input
                type="text"
                value={selectedNode.data.input_config?.location || ''}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'location', e.target.value)
                }
                placeholder="US or EU"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                BigQuery dataset location (US, EU, etc.). Leave blank for default.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Account Credentials (JSON)</label>
              <textarea
                value={selectedNode.data.input_config?.credentials || ''}
                onChange={(e) =>
                  handleConfigUpdate('input_config', 'credentials', e.target.value)
                }
                placeholder='{"type": "service_account", ...}'
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Google Cloud service account JSON credentials. Leave blank to use default credentials.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900 font-medium mb-1">📊 BigQuery Node</p>
              <p className="text-xs text-blue-700">
                Query and write data to Google BigQuery data warehouse. Supports standard SQL queries and data loading.
              </p>
            </div>
          </>
        )}

        {selectedNode.type === 'local_filesystem' && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Local File System Configuration</h4>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
              <select
                value={modeValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setModeValue(newValue)
                  handleConfigUpdate('input_config', 'mode', newValue)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="read">Read from file</option>
                <option value="write">Write to file</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Read: Load data from file. Write: Save data to file.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Path</label>
              <input
                ref={filePathRef}
                type="text"
                value={filePathValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setFilePathValue(newValue)
                  handleConfigUpdate('input_config', 'file_path', newValue)
                }}
                placeholder="/path/to/file.txt or /path/to/directory"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">File Pattern (optional)</label>
              <input
                ref={filePatternRef}
                type="text"
                value={filePatternValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setFilePatternValue(newValue)
                  handleConfigUpdate('input_config', 'file_pattern', newValue)
                }}
                placeholder="*.txt or **/*.json"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use glob pattern if reading from directory. Leave blank for single file.
              </p>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Encoding</label>
              <select
                value={selectedNode.data.input_config?.encoding || 'utf-8'}
                onChange={(e) =>
                  handleUpdate('input_config', {
                    ...selectedNode.data.input_config,
                    encoding: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="utf-8">UTF-8</option>
                <option value="ascii">ASCII</option>
                <option value="latin1">Latin-1</option>
              </select>
            </div>
            {modeValue === 'write' && (
              <div className="mt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overwriteValue}
                    onChange={(e) => {
                      const newValue = e.target.checked
                      setOverwriteValue(newValue)
                      handleConfigUpdate('input_config', 'overwrite', newValue)
                    }}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Overwrite existing file</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  If unchecked, file number will be incremented (e.g., file.jpg, file_1.jpg, file_2.jpg)
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

