import { useReactFlow } from '@xyflow/react'
import { X, Plus, Trash2, Save, Check } from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { showError } from '../utils/notifications'
import { showConfirm } from '../utils/confirm'
import { api } from '../api/client'

interface PropertyPanelProps {
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
  selectedNodeIds?: Set<string> // Multiple selected node IDs
  nodes?: any[] // Pass nodes as prop for better reactivity
  onSave?: () => void // Optional callback when save is clicked
  onSaveWorkflow?: () => Promise<string | null> // Callback to save the entire workflow
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

export default function PropertyPanel({ selectedNodeId, setSelectedNodeId, selectedNodeIds, nodes: nodesProp, onSave, onSaveWorkflow }: PropertyPanelProps) {
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
  
  // Refs for all other input fields
  const systemPromptRef = useRef<HTMLTextAreaElement>(null)
  const maxTokensRef = useRef<HTMLInputElement>(null)
  const conditionFieldRef = useRef<HTMLInputElement>(null)
  const conditionValueRef = useRef<HTMLInputElement>(null)
  const loopMaxIterationsRef = useRef<HTMLInputElement>(null)
  
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
    if (selectedNode) {
      setPanelOpen(true)
    }
  }, [selectedNode])
  
  
  // Local state for all config fields
  const [systemPromptValue, setSystemPromptValue] = useState('')
  const [maxTokensValue, setMaxTokensValue] = useState<string | number>('')
  const [conditionFieldValue, setConditionFieldValue] = useState('')
  const [conditionValueValue, setConditionValueValue] = useState('')
  const [loopMaxIterationsValue, setLoopMaxIterationsValue] = useState<number>(10)
  
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
      setSystemPromptValue('')
      setMaxTokensValue('')
      setConditionFieldValue('')
      setConditionValueValue('')
      setLoopMaxIterationsValue(0)
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
      if (document.activeElement !== systemPromptRef.current) {
        setSystemPromptValue(agentConfig.system_prompt || '')
      }
      if (document.activeElement !== maxTokensRef.current) {
        setMaxTokensValue(agentConfig.max_tokens || '')
      }
      if (document.activeElement !== conditionFieldRef.current) {
        setConditionFieldValue(conditionConfig.field || '')
      }
      if (document.activeElement !== conditionValueRef.current) {
        setConditionValueValue(conditionConfig.value || '')
      }
      if (document.activeElement !== loopMaxIterationsRef.current) {
        setLoopMaxIterationsValue(loopConfig.max_iterations ?? 0)
      }
      
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
        console.log('Could not load from backend, trying localStorage', e)
      }
      
      // Fallback to localStorage
      const saved = localStorage.getItem('llm_providers')
      if (saved) {
        try {
          const providers: LLMProvider[] = JSON.parse(saved)
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
          setAvailableModels(models)
        } catch (e) {
          console.error('Failed to load providers:', e)
          // Fallback to default GPT models if no providers found
          setAvailableModels([
            { value: 'gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)', provider: 'OpenAI' },
            { value: 'gpt-4o', label: 'GPT-4o (OpenAI)', provider: 'OpenAI' },
            { value: 'gpt-4', label: 'GPT-4 (OpenAI)', provider: 'OpenAI' },
            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (OpenAI)', provider: 'OpenAI' }
          ])
        }
      } else {
        // Fallback to default GPT models if no providers found
        setAvailableModels([
          { value: 'gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)', provider: 'OpenAI' },
          { value: 'gpt-4o', label: 'GPT-4o (OpenAI)', provider: 'OpenAI' },
          { value: 'gpt-4', label: 'GPT-4 (OpenAI)', provider: 'OpenAI' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (OpenAI)', provider: 'OpenAI' }
        ])
      }
    }
    
    loadModels()
  }, [])


  // Check if multiple nodes are selected
  const multipleSelected = selectedNodeIds && selectedNodeIds.size > 1
  
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

  if (!selectedNode || multipleSelected) {
    return (
      <div className="w-80 h-full bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Properties</h3>
        {multipleSelected ? (
          <div className="text-sm text-gray-500 mb-2">
            <p className="mb-2">Multiple nodes selected ({selectedNodeIds?.size})</p>
            <p className="text-xs text-gray-400">Select a single node to edit its properties</p>
            <p className="text-xs text-gray-400 mt-2">You can drag selected nodes together to move them</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-2">Select a node to edit its properties</p>
        )}
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
    
    // Update local state immediately for text fields
    if (configField === 'agent_config' && field === 'system_prompt') {
      setSystemPromptValue(value)
    } else if (configField === 'agent_config' && field === 'max_tokens') {
      setMaxTokensValue(value)
    } else if (configField === 'condition_config' && field === 'field') {
      setConditionFieldValue(value)
    } else if (configField === 'condition_config' && field === 'value') {
      setConditionValueValue(value)
    } else if (configField === 'loop_config' && field === 'max_iterations') {
      setLoopMaxIterationsValue(value)
    } else if (configField === 'input_config') {
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
      console.error('Save failed:', error)
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            ref={descriptionInputRef}
            value={descriptionValue}
            onChange={(e) => {
              const newValue = e.target.value
              setDescriptionValue(newValue)
              handleUpdate('description', newValue)
            }}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-4 w-96">
                  <h4 className="font-semibold mb-3">Add Input</h4>
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
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
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
        {selectedNode.type === 'agent' && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">LLM Agent Configuration</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select
                value={selectedNode.data.agent_config?.model || (availableModels.length > 0 ? availableModels[0].value : 'gpt-4o-mini')}
                onChange={(e) =>
                  handleUpdate('agent_config', {
                    ...selectedNode.data.agent_config,
                    model: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {availableModels.length > 0 ? (
                  availableModels.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="gpt-4o-mini">GPT-4o Mini (OpenAI)</option>
                    <option value="gpt-4o">GPT-4o (OpenAI)</option>
                    <option value="gpt-4">GPT-4 (OpenAI)</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (OpenAI)</option>
                  </>
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {availableModels.length > 0 
                  ? `This agent will use the configured LLM provider with the selected model`
                  : 'This agent will call the OpenAI API with this model. Configure providers in Settings.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
              <textarea
                ref={systemPromptRef}
                value={systemPromptValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setSystemPromptValue(newValue)
                  handleConfigUpdate('agent_config', 'system_prompt', newValue)
                }}
                rows={4}
                placeholder="You are a helpful assistant that..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Instructions that define the agent's role and behavior
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature: {selectedNode.data.agent_config?.temperature?.toFixed(1) || '0.7'}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={selectedNode.data.agent_config?.temperature || 0.7}
                onChange={(e) =>
                  handleUpdate('agent_config', {
                    ...selectedNode.data.agent_config,
                    temperature: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Focused (0.0)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens (optional)</label>
              <input
                ref={maxTokensRef}
                type="number"
                value={maxTokensValue}
                onChange={(e) => {
                  const newValue = e.target.value ? parseInt(e.target.value) : undefined
                  setMaxTokensValue(e.target.value)
                  handleConfigUpdate('agent_config', 'max_tokens', newValue)
                }}
                placeholder="Leave blank for default"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum length of the agent's response
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900 font-medium mb-1">🤖 This is a Real LLM Agent</p>
              <p className="text-xs text-blue-700">
                When executed, this agent will call OpenAI's API with your configured model and prompt.
                The agent receives data from its inputs and produces output for the next nodes.
              </p>
            </div>
          </div>
        )}

        {/* Condition-specific properties */}
        {selectedNode.type === 'condition' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition Type</label>
              <select
                value={selectedNode.data.condition_config?.condition_type || 'equals'}
                onChange={(e) =>
                  handleUpdate('condition_config', {
                    ...selectedNode.data.condition_config,
                    condition_type: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="not_contains">Not Contains</option>
                <option value="greater_than">Greater Than</option>
                <option value="not_greater_than">Not Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="not_less_than">Not Less Than</option>
                <option value="empty">Empty</option>
                <option value="not_empty">Not Empty</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
              <input
                ref={conditionFieldRef}
                type="text"
                value={conditionFieldValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setConditionFieldValue(newValue)
                  handleConfigUpdate('condition_config', 'field', newValue)
                }}
                placeholder="Field to check"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {(selectedNode.data.condition_config?.condition_type !== 'empty' && 
              selectedNode.data.condition_config?.condition_type !== 'not_empty') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <input
                  ref={conditionValueRef}
                  type="text"
                  value={conditionValueValue}
                  onChange={(e) => {
                    const newValue = e.target.value
                    setConditionValueValue(newValue)
                    handleConfigUpdate('condition_config', 'value', newValue)
                  }}
                  placeholder="Value to compare"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
          </>
        )}

        {/* Loop-specific properties */}
        {selectedNode.type === 'loop' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loop Type</label>
              <select
                value={selectedNode.data.loop_config?.loop_type || 'for_each'}
                onChange={(e) => {
                  const currentLoopConfig = selectedNode.data.loop_config || {}
                  handleUpdate('loop_config', {
                    loop_type: e.target.value,
                    max_iterations: currentLoopConfig.max_iterations ?? 0,
                    items_source: currentLoopConfig.items_source,
                    condition: currentLoopConfig.condition,
                  })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="for_each">For Each</option>
                <option value="while">While</option>
                <option value="until">Until</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Iterations</label>
              <input
                ref={loopMaxIterationsRef}
                type="number"
                value={loopMaxIterationsValue}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) || 0
                  setLoopMaxIterationsValue(newValue)
                  handleConfigUpdate('loop_config', 'max_iterations', newValue)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </>
        )}

        {/* GCP Bucket configuration */}
        {selectedNode.type === 'gcp_bucket' && (
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

        {/* GCP Pub/Sub configuration */}
        {selectedNode.type === 'gcp_pubsub' && (
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

