/**
 * Form Field Utilities
 * Common utilities for form field operations
 * Refactored to follow SOLID and DRY principles
 */

import { parsePath, validatePath } from '../hooks/utils/pathParser'

/**
 * Traverse object using path keys
 * Single Responsibility: Only traverses object path
 * 
 * @param obj Object to traverse
 * @param keys Array of keys to traverse
 * @returns Object containing value, parent, and lastKey, or null if not found
 */
function traversePath(obj: any, keys: string[]): { value: any; parent: any; lastKey: string } | null {
  if (!obj || keys.length === 0) return null

  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (current === null || current === undefined) {
      return null
    }
    current = current[key]
  }

  return {
    value: current,
    parent: current,
    lastKey: keys[keys.length - 1]
  }
}

/**
 * Get nested value from object using path
 * Uses PathParser for DRY compliance
 * 
 * @param obj Object to traverse
 * @param path Path to value (e.g., 'agent_config.model' or ['agent_config', 'model'])
 * @param defaultValue Default value if path not found
 * @returns Value at path or defaultValue if not found
 */
export function getNestedValue<T = any>(
  obj: any,
  path: string | string[],
  defaultValue?: T
): T | undefined {
  if (!obj || !path) return defaultValue

  const keys = parsePath(path)
  if (keys.length === 0) return defaultValue

  const result = traversePath(obj, keys)
  if (!result) return defaultValue

  // If the parent value is null or undefined, we can't check for the key
  if (result.value === null || result.value === undefined) {
    return defaultValue
  }

  // Check if the key exists in the parent object
  // This distinguishes between "key doesn't exist" (return default) and "key exists but value is undefined" (return undefined)
  if (!(result.lastKey in result.value)) {
    return defaultValue
  }

  return result.value[result.lastKey] as T
}

/**
 * Set nested value in object using path
 * Single Responsibility: Only sets values
 * Uses PathParser for DRY compliance
 * Creates intermediate objects if they don't exist
 * 
 * @param obj Object to modify
 * @param path Path to value (e.g., 'agent_config.model' or ['agent_config', 'model'])
 * @param value Value to set
 * @returns New object with value set (does not mutate original)
 */
export function setNestedValue<T extends Record<string, any>>(
  obj: T,
  path: string | string[],
  value: any
): T {
  if (!obj || !path || !validatePath(path)) {
    return obj
  }

  const keys = parsePath(path)
  if (keys.length === 0) return obj

  const result = { ...obj } as any
  let current = result

  // Traverse to parent of target
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    
    // Handle null/undefined intermediate values
    if (current[key] === null || current[key] === undefined) {
      current[key] = {}
    } else if (Array.isArray(current[key])) {
      // Clone array to avoid mutation
      current[key] = [...current[key]]
    } else if (typeof current[key] === 'object') {
      // Clone object to avoid mutation
      current[key] = { ...current[key] }
    } else {
      // Invalid path - intermediate value is not an object or array
      return obj
    }
    current = current[key]
  }

  // Set the value
  current[keys[keys.length - 1]] = value
  return result as T
}

/**
 * Check if nested value exists in object
 * Checks if the key exists in the object, regardless of its value
 * 
 * @param obj Object to check
 * @param path Path to value
 * @returns True if key exists (even if value is undefined), false otherwise
 */
export function hasNestedValue(obj: any, path: string | string[]): boolean {
  if (!obj || !path) return false

  const keys = parsePath(path)
  if (keys.length === 0) return false

  const result = traversePath(obj, keys)
  if (!result) return false

  // If the parent value is null or undefined, the key doesn't exist
  if (result.value === null || result.value === undefined) {
    return false
  }

  // Check if the key exists in the parent object (even if value is undefined)
  return result.lastKey in result.value
}
