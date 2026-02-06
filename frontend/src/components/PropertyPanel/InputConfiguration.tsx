/**
 * Input Configuration Component
 * Extracted from PropertyPanel to improve SRP compliance
 * Single Responsibility: Only handles input configuration UI and interactions
 */

import { Plus, Trash2 } from 'lucide-react'
import { coalesceString } from '../../utils/nullCoalescing'
import { isNonEmptyArray, isNotEmpty } from '../../utils/nullChecks'

export interface InputConfigurationProps {
  inputs: any[] | null | undefined
  showAddInput: boolean
  onAddInput: (inputName: string, sourceNode: string, sourceField: string) => void
  onRemoveInput: (index: number) => void
  onUpdateInput: (index: number, field: 'source_node' | 'source_field', value: string | undefined) => void
  onShowAddInput: (show: boolean) => void
}

/**
 * Input Configuration Component
 * DRY: Centralized input configuration logic
 */
export function InputConfiguration({
  inputs,
  showAddInput,
  onAddInput,
  onRemoveInput,
  onUpdateInput,
  onShowAddInput,
}: InputConfigurationProps) {
  const safeInputs = isNonEmptyArray(inputs) ? inputs : []

  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-semibold text-gray-900">Inputs</label>
        <button
          onClick={() => onShowAddInput(true)}
          className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 flex items-center gap-1"
          aria-label="Add input to node"
          data-testid="add-input-button"
        >
          <Plus className="w-3 h-3" />
          Add Input
        </button>
      </div>

      {/* List existing inputs */}
      <div className="space-y-2 mb-3">
        {safeInputs.map((input: any, index: number) => (
          <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">{input.name}</span>
              <button
                onClick={() => onRemoveInput(index)}
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
                  value={coalesceString(input.source_node, '(workflow variable)')}
                  onChange={(e) => {
                    const value = e.target.value
                    onUpdateInput(
                      index,
                      'source_node',
                      isNotEmpty(value) ? value : undefined
                    )
                  }}
                  placeholder="node_id or leave blank"
                  className="w-full mt-1 px-2 py-1 text-xs border rounded"
                />
              </div>
              <div>
                <span className="text-gray-500">Source Field:</span>
                <input
                  type="text"
                  value={
                    isNotEmpty(input.source_field)
                      ? input.source_field!
                      : 'output'
                  }
                  onChange={(e) => onUpdateInput(index, 'source_field', e.target.value)}
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
            <h4 id="add-input-title" className="font-semibold mb-3" data-testid="add-input-modal-title">
              Add Input
            </h4>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                onAddInput(
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
                    Get data from another node's output. Leave blank to get from workflow input
                    variables.
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
                  onClick={() => onShowAddInput(false)}
                  className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  aria-label="Cancel adding input"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                  aria-label="Add input to node"
                  data-testid="add-input-submit-button"
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
  )
}
