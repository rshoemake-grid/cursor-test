import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { WorkflowNode } from '../types/workflow'

interface ExecutionInputDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (inputs: Record<string, any>) => void
  nodes: WorkflowNode[]
  workflowName?: string
}

/**
 * Extracted execution input dialog component
 * Follows Single Responsibility Principle - only handles input collection UI
 */
export default function ExecutionInputDialog({
  isOpen,
  onClose,
  onSubmit,
  nodes,
  workflowName
}: ExecutionInputDialogProps) {
  const [inputs, setInputs] = useState<Record<string, any>>({})

  // Reset inputs when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      // Initialize inputs from nodes that have input_config
      const initialInputs: Record<string, any> = {}
      nodes.forEach(node => {
        if (node.type === 'start' && (node as any).input_config) {
          const inputConfig = (node as any).input_config
          if (inputConfig.inputs) {
            inputConfig.inputs.forEach((input: any) => {
              initialInputs[input.name] = input.default_value || ''
            })
          }
        }
      })
      setInputs(initialInputs)
    } else {
      setInputs({})
    }
  }, [isOpen, nodes])

  if (!isOpen) return null

  // Get input nodes (nodes with input_config)
  const inputNodes = nodes.filter(node => 
    node.type === 'start' && (node as any).input_config
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(inputs)
    onClose()
  }

  const handleInputChange = (name: string, value: any) => {
    setInputs(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {workflowName ? `Execute: ${workflowName}` : 'Execute Workflow'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {inputNodes.length === 0 ? (
            <div className="text-gray-600 mb-6">
              This workflow doesn't require any inputs. Click Execute to run it.
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {inputNodes.map(node => {
                const inputConfig = (node as any).input_config
                if (!inputConfig.inputs || inputConfig.inputs.length === 0) {
                  return null
                }

                return (
                  <div key={node.id}>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      {node.name || 'Inputs'}
                    </h3>
                    <div className="space-y-3">
                      {inputConfig.inputs.map((input: any) => (
                        <div key={input.name}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {input.label || input.name}
                            {input.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {input.type === 'textarea' ? (
                            <textarea
                              value={inputs[input.name] || ''}
                              onChange={(e) => handleInputChange(input.name, e.target.value)}
                              required={input.required}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              rows={4}
                              placeholder={input.placeholder || ''}
                            />
                          ) : (
                            <input
                              type={input.type || 'text'}
                              value={inputs[input.name] || ''}
                              onChange={(e) => handleInputChange(
                                input.name,
                                input.type === 'number' ? Number(e.target.value) : e.target.value
                              )}
                              required={input.required}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder={input.placeholder || ''}
                            />
                          )}
                          {input.description && (
                            <p className="mt-1 text-xs text-gray-500">{input.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Execute
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

