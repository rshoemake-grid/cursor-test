import { useReactFlow } from '@xyflow/react'
import { useWorkflowStore } from '../store/workflowStore'
import { X } from 'lucide-react'
import { useState } from 'react'

export default function PropertyPanel() {
  const { getNodes, setNodes } = useReactFlow()
  const { updateNode, removeNode } = useWorkflowStore()
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const selectedNode = getNodes().find((n) => n.id === selectedNodeId)

  if (!selectedNode) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Properties</h3>
        <p className="text-sm text-gray-500">Select a node to edit its properties</p>
      </div>
    )
  }

  const handleUpdate = (field: string, value: any) => {
    const updatedData = { ...selectedNode.data, [field]: value }
    updateNode(selectedNode.id, updatedData)
    
    // Also update the local state
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === selectedNode.id ? { ...node, data: updatedData } : node
      )
    )
  }

  const handleDelete = () => {
    removeNode(selectedNode.id)
    setSelectedNodeId(null)
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
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

        {/* Agent-specific properties */}
        {selectedNode.type === 'agent' && (
          <>
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
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
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
                placeholder="Instructions for the agent..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature: {selectedNode.data.agent_config?.temperature || 0.7}
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
            </div>
          </>
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

