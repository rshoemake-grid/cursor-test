import { X, Trash2, Save, Check } from 'lucide-react'
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
// DRY: Use centralized null checks
import { isNotNullOrUndefined, hasMultipleSelected, isExplicitlyFalse, safeArray } from '../utils/nullChecks'
// DRY: Extract input configuration component
import { InputConfiguration } from './PropertyPanel/InputConfiguration'

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

  // Local state - MUST be called before any early returns (Rules of Hooks)
  const [showAddInput, setShowAddInput] = useState(false)

  // LLM providers are now loaded via useLLMProviders hook

  // DRY: Use centralized null check utilities
  const multipleSelected = hasMultipleSelected(selectedNodeIds)
  
  // DRY: Use centralized null check
  if (!isNotNullOrUndefined(selectedNode)) {
    return null
  }

  // DRY: Use centralized false check
  if (isExplicitlyFalse(panelOpen)) {
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

  // DRY: Use centralized check
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

  // DRY: Get safe inputs array
  const nodeInputs = safeArray(selectedNode.data.inputs)

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

        {/* Inputs Configuration - DRY: Use extracted component */}
        {selectedNode.type !== 'start' && selectedNode.type !== 'end' && (
          <InputConfiguration
            inputs={nodeInputs}
            showAddInput={showAddInput}
            onAddInput={handleAddInput}
            onRemoveInput={handleRemoveInput}
            onUpdateInput={handleUpdateInput}
            onShowAddInput={setShowAddInput}
          />
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

