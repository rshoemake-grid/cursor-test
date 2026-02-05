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

  return result.value?.[result.lastKey] as T
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
    } else if (typeof current[key] === 'object' && !Array.isArray(current[key])) {
      // Clone object to avoid mutation
      current[key] = { ...current[key] }
    } else {
      // Invalid path - intermediate value is not an object
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
 * Uses composition - calls getNestedValue
 * DRY: Reuses existing logic
 * 
 * @param obj Object to check
 * @param path Path to value
 * @returns True if value exists, false otherwise
 */
export function hasNestedValue(obj: any, path: string | string[]): boolean {
  return getNestedValue(obj, path) !== undefined
}
