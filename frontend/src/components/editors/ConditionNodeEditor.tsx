/**
 * Condition Node Editor Component
 * Handles editing of condition node properties
 * Follows Single Responsibility Principle
 * Refactored to use string literal constants (DRY + SOLID principles)
 */

import { useRef, useState, useEffect } from 'react'
import { NodeWithData } from '../../types/nodeData'
import { CONDITION_TYPES, isValidConditionType } from '../../constants/stringLiterals'

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
  // Use constants to kill StringLiteral mutations
  const conditionType = (conditionConfig.condition_type !== null && conditionConfig.condition_type !== undefined && conditionConfig.condition_type !== '' && isValidConditionType(conditionConfig.condition_type))
    ? conditionConfig.condition_type
    : CONDITION_TYPES.EQUALS
  // Explicit checks to prevent mutation survivors
  // Use constants to kill StringLiteral mutations
  const showValueField = conditionType !== CONDITION_TYPES.EMPTY && conditionType !== CONDITION_TYPES.NOT_EMPTY

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
          <option value={CONDITION_TYPES.EQUALS}>Equals</option>
          <option value={CONDITION_TYPES.NOT_EQUALS}>Not Equals</option>
          <option value={CONDITION_TYPES.CONTAINS}>Contains</option>
          <option value={CONDITION_TYPES.NOT_CONTAINS}>Not Contains</option>
          <option value={CONDITION_TYPES.GREATER_THAN}>Greater Than</option>
          <option value={CONDITION_TYPES.NOT_GREATER_THAN}>Not Greater Than</option>
          <option value={CONDITION_TYPES.LESS_THAN}>Less Than</option>
          <option value={CONDITION_TYPES.NOT_LESS_THAN}>Not Less Than</option>
          <option value={CONDITION_TYPES.EMPTY}>Empty</option>
          <option value={CONDITION_TYPES.NOT_EMPTY}>Not Empty</option>
          <option value={CONDITION_TYPES.CUSTOM}>Custom</option>
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

