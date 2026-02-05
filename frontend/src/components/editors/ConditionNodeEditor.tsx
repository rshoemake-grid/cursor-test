/**
 * Condition Node Editor Component
 * Handles editing of condition node properties
 * Follows Single Responsibility Principle
 */

import { useRef, useState, useEffect } from 'react'
import { NodeWithData } from '../../types/nodeData'

interface ConditionNodeEditorProps {
  node: NodeWithData & { type: 'condition' }
  onConfigUpdate: (configField: string, field: string, value: unknown) => void
}

export default function ConditionNodeEditor({
  node,
  onConfigUpdate
}: ConditionNodeEditorProps) {
  const conditionFieldRef = useRef<HTMLInputElement>(null)
  const conditionValueRef = useRef<HTMLInputElement>(null)
  
  const [conditionFieldValue, setConditionFieldValue] = useState('')
  const [conditionValueValue, setConditionValueValue] = useState('')

  // Sync local state with node data
  useEffect(() => {
    // Explicit check to prevent mutation survivors
    const conditionConfig = (node.data.condition_config !== null && node.data.condition_config !== undefined)
      ? node.data.condition_config
      : {}
    
    // Explicit checks to prevent mutation survivors
    if (document.activeElement !== conditionFieldRef.current) {
      const fieldValue = (conditionConfig.field !== null && conditionConfig.field !== undefined && conditionConfig.field !== '')
        ? conditionConfig.field
        : ''
      setConditionFieldValue(fieldValue)
    }
    if (document.activeElement !== conditionValueRef.current) {
      const valueValue = (conditionConfig.value !== null && conditionConfig.value !== undefined && conditionConfig.value !== '')
        ? conditionConfig.value
        : ''
      setConditionValueValue(valueValue)
    }
  }, [node.data.condition_config])

  // Explicit check to prevent mutation survivors
  const conditionConfig = (node.data.condition_config !== null && node.data.condition_config !== undefined)
    ? node.data.condition_config
    : {}
  // Explicit check to prevent mutation survivors
  const conditionType = (conditionConfig.condition_type !== null && conditionConfig.condition_type !== undefined && conditionConfig.condition_type !== '')
    ? conditionConfig.condition_type
    : 'equals'
  // Explicit checks to prevent mutation survivors
  const showValueField = conditionType !== 'empty' && conditionType !== 'not_empty'

  return (
    <>
      {/* Condition Type */}
      <div>
        <label 
          htmlFor="condition-type"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Condition Type
        </label>
        <select
          id="condition-type"
          value={conditionType}
          onChange={(e) =>
            onConfigUpdate('condition_config', 'condition_type', e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="Select condition type"
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

      {/* Field */}
      <div className="mt-4">
        <label 
          htmlFor="condition-field"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Field
        </label>
        <input
          id="condition-field"
          ref={conditionFieldRef}
          type="text"
          value={conditionFieldValue}
          onChange={(e) => {
            const newValue = e.target.value
            setConditionFieldValue(newValue)
            onConfigUpdate('condition_config', 'field', newValue)
          }}
          placeholder="Field to check"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="Field name to check in condition"
        />
      </div>

      {/* Value (conditional) */}
      {showValueField && (
        <div className="mt-4">
          <label 
            htmlFor="condition-value"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Value
          </label>
          <input
            id="condition-value"
            ref={conditionValueRef}
            type="text"
            value={conditionValueValue}
            onChange={(e) => {
              const newValue = e.target.value
              setConditionValueValue(newValue)
              onConfigUpdate('condition_config', 'value', newValue)
            }}
            placeholder="Value to compare"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            aria-label="Value to compare against field"
          />
        </div>
      )}
    </>
  )
}

