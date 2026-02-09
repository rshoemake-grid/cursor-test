/**
 * Condition Validation Utilities
 * Extracted validation logic for condition node configuration
 * Follows DRY principle by reusing validation logic
 */

import { CONDITION_TYPES, isValidConditionType } from '../../../constants/stringLiterals'

/**
 * Interface for condition configuration
 */
export interface ConditionConfig {
  condition_type?: string
  field?: string | null | undefined
  value?: string | null | undefined
}

/**
 * Validate condition configuration
 * Uses explicit checks to prevent mutation survivors
 * 
 * @param config - The condition configuration to validate
 * @returns True if configuration is valid, false otherwise
 */
export function validateConditionConfig(config: ConditionConfig | null | undefined): boolean {
  // Explicit null/undefined check
  if (config === null || config === undefined) {
    return false
  }
  
  // Explicit check for condition type
  const hasConditionType = config.condition_type !== null && config.condition_type !== undefined
  if (hasConditionType === false) {
    return false
  }
  
  // Explicit check for valid condition type
  const isValidType = isValidConditionType(config.condition_type!) === true
  if (isValidType === false) {
    return false
  }
  
  // Explicit check for field (required for all condition types)
  const hasField = config.field !== null && config.field !== undefined && config.field !== ''
  if (hasField === false) {
    return false
  }
  
  return true
}

/**
 * Validate condition operator
 * Uses explicit checks to prevent mutation survivors
 * 
 * @param operator - The operator to validate
 * @returns True if operator is valid, false otherwise
 */
export function validateOperator(operator: string | null | undefined): boolean {
  // Explicit null/undefined check
  if (operator === null || operator === undefined) {
    return false
  }
  
  // Explicit check for empty string
  if (operator === '') {
    return false
  }
  
  // Explicit check for valid condition type
  const isValid = isValidConditionType(operator) === true
  return isValid === true
}

/**
 * Validate condition operands
 * Uses explicit checks to prevent mutation survivors
 * 
 * @param field - The field operand
 * @param value - The value operand (optional for some condition types)
 * @param conditionType - The condition type
 * @returns True if operands are valid, false otherwise
 */
export function validateOperands(
  field: string | null | undefined,
  value: string | null | undefined,
  conditionType: string
): boolean {
  // Explicit check for field (always required)
  const hasField = field !== null && field !== undefined && field !== ''
  if (hasField === false) {
    return false
  }
  
  // Check if value is required based on condition type
  const requiresValue = conditionType !== CONDITION_TYPES.EMPTY && conditionType !== CONDITION_TYPES.NOT_EMPTY
  if (requiresValue === true) {
    // Explicit check for value when required
    const hasValue = value !== null && value !== undefined && value !== ''
    if (hasValue === false) {
      return false
    }
  }
  
  return true
}

/**
 * Get default condition config
 * Uses explicit checks to prevent mutation survivors
 * 
 * @returns Default condition configuration
 */
export function getDefaultConditionConfig(): ConditionConfig {
  return {
    condition_type: CONDITION_TYPES.EQUALS,
    field: '',
    value: ''
  }
}
