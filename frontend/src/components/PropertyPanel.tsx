import { X, Plus, Trash2, Save, Check } from 'lucide-react'
import { useState } from 'react'
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
// Domain-based imports - Phase 7
import { useNodeForm, useSelectedNode, useNodeOperations } from '../hooks/nodes'
import { usePanelState } from '../hooks/ui'
import { useLoopConfig } from '../hooks/forms'

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
// Domain-based imports - Phase 7
import { useLLMProviders } from '../hooks/providers'
import { useAuth } from '../contexts/AuthContext'

export default function PropertyPanel({ selectedNodeId, setSelectedNodeId, selectedNodeIds, nodes: nodesProp, onSave, onSaveWorkflow, storage = defaultAdapters.createLocalStorageAdapter() }: PropertyPanelProps) {
  const { isAuthenticated } = useAuth()
  const { availableModels } = useLLMProviders({ storage, isAuthenticated })
  const [showAddInput, setShowAddInput] = useState(false)

  // Node selection hook
  const { selectedNode } = useSelectedNode({
    selectedNodeId,
    nodesProp,
  })

  // Panel state hook
  const { panelOpen, setPanelOpen, saveStatus, setSaveStatus, closePanel } = usePanelState({
    selectedNode,
  })

  // Loop config initialization hook
  useLoopConfig({ selectedNode })

  // Node operations hook
  const nodeOperations = useNodeOperations({
    selectedNode,
    setSelectedNodeId,
    onSave,
    onSaveWorkflow,
  })
  const {
    handleUpdate,
    handleConfigUpdate,
    handleDelete,
    handleSave,
    handleAddInput: handleAddInputOperation,
    handleRemoveInput,
    handleUpdateInput,
  } = nodeOperations

  // Node form state management - MUST be called before any early returns (Rules of Hooks)
  const nodeForm = useNodeForm({
    selectedNode,
    onUpdate: handleUpdate,
  })
  const { nameValue, descriptionValue, nameInputRef, descriptionInputRef, handleNameChange, handleDescriptionChange } = nodeForm

  // LLM providers are now loaded via useLLMProviders hook

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

  const handleClose = () => {
    // Just close the panel (deselect node) without deleting
    setSelectedNodeId(null)
    closePanel()
  }

  const handleSaveWrapper = async () => {
    await handleSave(setSaveStatus)
  }

  const handleAddInput = (inputName: string, sourceNode: string, sourceField: string) => {
    handleAddInputOperation(inputName, sourceNode, sourceField, setShowAddInput)
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
            onClick={handleSaveWrapper}
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
            onChange={(e) => handleNameChange(e.target.value)}
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
            onChange={(e) => handleDescriptionChange(e.target.value)}
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

