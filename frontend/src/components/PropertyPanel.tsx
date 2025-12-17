import { useReactFlow } from '@xyflow/react'
import { useWorkflowStore } from '../store/workflowStore'
import { X, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface PropertyPanelProps {
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
}

export default function PropertyPanel({ selectedNodeId, setSelectedNodeId }: PropertyPanelProps) {
  const { getNodes, setNodes } = useReactFlow()
  const { updateNode, removeNode } = useWorkflowStore()
  const [showAddInput, setShowAddInput] = useState(false)

  const selectedNode = getNodes().find((n) => n.id === selectedNodeId)

  if (!selectedNode) {
    return (
      <div className="w-80 h-full bg-white border-l border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Properties</h3>
        <p className="text-sm text-gray-500">Select a node to edit its properties</p>
      </div>
    )
  }

  const handleUpdate = (field: string, value: any) => {
    if (!selectedNode) return
    
    const updatedData = { ...selectedNode.data, [field]: value }
    
    // Update label when name changes
    if (field === 'name') {
      updatedData.label = value
    }
    
    updateNode(selectedNode.id, updatedData)
    
    // Also update the local state
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === selectedNode.id ? { ...node, data: updatedData } : node
      )
    )
  }

  const handleDelete = () => {
    if (!selectedNode) return
    removeNode(selectedNode.id)
    setSelectedNodeId(null)
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
    <div className="w-80 h-full bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
        <button
          onClick={handleDelete}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
          title="Delete node"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={selectedNode.data.name || ''}
            onChange={(e) => handleUpdate('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={selectedNode.data.description || ''}
            onChange={(e) => handleUpdate('description', e.target.value)}
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
                value={selectedNode.data.agent_config?.model || 'gpt-4o-mini'}
                onChange={(e) =>
                  handleUpdate('agent_config', {
                    ...selectedNode.data.agent_config,
                    model: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cheap)</option>
                <option value="gpt-4o">GPT-4o (Better Quality)</option>
                <option value="gpt-4">GPT-4 (Best Quality)</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                This agent will call the OpenAI API with this model
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
              <textarea
                value={selectedNode.data.agent_config?.system_prompt || ''}
                onChange={(e) =>
                  handleUpdate('agent_config', {
                    ...selectedNode.data.agent_config,
                    system_prompt: e.target.value,
                  })
                }
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
                type="number"
                value={selectedNode.data.agent_config?.max_tokens || ''}
                onChange={(e) =>
                  handleUpdate('agent_config', {
                    ...selectedNode.data.agent_config,
                    max_tokens: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
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
                <option value="contains">Contains</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
              <input
                type="text"
                value={selectedNode.data.condition_config?.field || ''}
                onChange={(e) =>
                  handleUpdate('condition_config', {
                    ...selectedNode.data.condition_config,
                    field: e.target.value,
                  })
                }
                placeholder="Field to check"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
              <input
                type="text"
                value={selectedNode.data.condition_config?.value || ''}
                onChange={(e) =>
                  handleUpdate('condition_config', {
                    ...selectedNode.data.condition_config,
                    value: e.target.value,
                  })
                }
                placeholder="Value to compare"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </>
        )}

        {/* Loop-specific properties */}
        {selectedNode.type === 'loop' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loop Type</label>
              <select
                value={selectedNode.data.loop_config?.loop_type || 'for_each'}
                onChange={(e) =>
                  handleUpdate('loop_config', {
                    ...selectedNode.data.loop_config,
                    loop_type: e.target.value,
                  })
                }
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
                type="number"
                value={selectedNode.data.loop_config?.max_iterations || 10}
                onChange={(e) =>
                  handleUpdate('loop_config', {
                    ...selectedNode.data.loop_config,
                    max_iterations: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

