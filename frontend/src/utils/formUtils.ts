/**
 * Form Field Utilities
 * Common utilities for form field operations
 */

/**
 * Get nested value from object using path
 * Supports both dot-notation strings and array paths
 * 
 * @param obj Object to traverse
 * @param path Path to value (e.g., 'agent_config.model' or ['agent_config', 'model'])
 * @returns Value at path or undefined if not found
 */
export function getNestedValue(obj: any, path: string | string[]): any {
  if (!obj || !path) return undefined
  
  const keys = Array.isArray(path) ? path : path.split('.')
  let value = obj
  
  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined
    }
    value = value[key]
  }
  
  return value
}

/**
 * Set nested value in object using path
 * Creates intermediate objects if they don't exist
 * 
 * @param obj Object to modify
 * @param path Path to value (e.g., 'agent_config.model' or ['agent_config', 'model'])
 * @param value Value to set
 * @returns New object with value set (does not mutate original)
 */
export function setNestedValue(obj: any, path: string | string[], value: any): any {
  if (!obj || !path) return obj
  
  const keys = Array.isArray(path) ? path : path.split('.')
  const result = { ...obj }
  let current = result
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (current[key] === null || current[key] === undefined) {
      current[key] = {}
    } else {
      current[key] = { ...current[key] }
    }
    current = current[key]
  }
  
  current[keys[keys.length - 1]] = value
  return result
}

/**
 * Check if nested value exists in object
 * 
 * @param obj Object to check
 * @param path Path to value
 * @returns True if value exists, false otherwise
 */
export function hasNestedValue(obj: any, path: string | string[]): boolean {
  return getNestedValue(obj, path) !== undefined
}
