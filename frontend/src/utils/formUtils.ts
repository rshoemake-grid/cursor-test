/**
 * Form Field Utilities
 * Common utilities for form field operations
 * Refactored to follow SOLID and DRY principles
 */

import { parsePath, validatePath } from '../hooks/utils/pathParser'
import { isNullOrUndefined } from './typeGuards'
// isDefined intentionally not imported - not used in this file
import { coalesce } from './coalesce'

/**
 * Type alias for nested object structures
 * Used for object traversal operations
 */
export type NestedObject = Record<string, any>

/**
 * Type union for path input parameters
 * Accepts either string (dot notation) or array of strings
 */
export type PathInput = string | string[]

/**
 * Interface for traversePath return value
 * Contains the value, parent object, and last key in the path
 */
export interface PathValue {
  /** The value at the traversed path */
  value: any
  /** The parent object containing the value */
  parent: any
  /** The last key in the path */
  lastKey: string
}

/**
 * Value Cloner interface for Strategy Pattern
 * Follows Open/Closed Principle - can extend cloning behavior without modifying existing code
 */
interface ValueCloner {
  /**
   * Check if this cloner can handle the given value
   * @param value - The value to check
   * @returns True if this cloner can handle the value
   */
  canHandle(value: any): boolean
  
  /**
   * Clone the value
   * @param value - The value to clone
   * @returns Cloned value
   */
  clone(value: any): any
}

/**
 * Array Cloner implementation
 * Handles cloning of array values
 */
class ArrayCloner implements ValueCloner {
  canHandle(value: any): boolean {
    return Array.isArray(value) === true
  }

  clone(value: any[]): any[] {
    return [...value]
  }
}

/**
 * Object Cloner implementation
 * Handles cloning of object values
 * Explicitly excludes arrays to prevent mutation survivors
 */
class ObjectCloner implements ValueCloner {
  canHandle(value: any): boolean {
    // Explicit check: must be object, not null, and not an array
    const isObject = typeof value === 'object'
    const isNotNull = value !== null
    const isNotArray = Array.isArray(value) === false
    return isObject === true && isNotNull === true && isNotArray === true
  }

  clone(value: Record<string, any>): Record<string, any> {
    return { ...value }
  }
}

/**
 * Default Cloner implementation
 * Handles primitive values (returns as-is)
 */
class DefaultCloner implements ValueCloner {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canHandle(_value: any): boolean {
    return true // Always handles any value
  }

  clone(value: any): any {
    return value // Return as-is for primitives
  }
}

/**
 * Cloner registry - ordered list of cloners
 * Order matters: more specific cloners should come first
 */
const CLONERS: ValueCloner[] = [
  new ArrayCloner(),
  new ObjectCloner(),
  new DefaultCloner(),
]

/**
 * Clone a value using the Strategy Pattern
 * Follows Open/Closed Principle - can add new cloners without modifying this function
 * 
 * @param value - The value to clone
 * @returns Cloned value
 */
function cloneValue(value: any): any {
  // Find first cloner that can handle this value
  for (const cloner of CLONERS) {
    if (cloner.canHandle(value) === true) {
      return cloner.clone(value)
    }
  }
  // Fallback (should never reach here due to DefaultCloner)
  return value
}

/**
 * Validate inputs for nested value operations
 * Follows DRY principle by eliminating duplicated validation code
 * 
 * @param obj - The object to validate
 * @param path - The path to validate (string or string[])
 * @returns True if inputs are valid, false otherwise
 */
function validateInputs(obj: NestedObject | null | undefined, path: PathInput | null | undefined): boolean {
  // Explicit checks to prevent mutation survivors
  if (isNullOrUndefined(obj) === true) return false
  if (isNullOrUndefined(path) === true) return false
  if (path === '') return false
  const isValidPath = validatePath(path) === true
  return isValidPath === true
}

/**
 * Traverse object using path keys
 * Single Responsibility: Only traverses object path
 * Uses early returns for clarity and mutation resistance
 * 
 * @param obj Object to traverse
 * @param keys Array of keys to traverse
 * @returns Object containing value, parent, and lastKey, or null if not found
 */
function traversePath(obj: NestedObject, keys: string[]): PathValue | null {
  // Early return for invalid inputs
  if (isNullOrUndefined(obj) === true) return null
  if (keys.length === 0) return null

  // Traverse to parent of target key
  let currentValue = obj
  const lastIndex = keys.length - 1
  
  for (let i = 0; i < lastIndex; i++) {
    const currentKey = keys[i]
    // Early return if intermediate value is null/undefined
    if (isNullOrUndefined(currentValue) === true) {
      return null
    }
    currentValue = currentValue[currentKey]
  }

  // Return result with parent value and last key
  return {
    value: currentValue,
    parent: currentValue,
    lastKey: keys[lastIndex]
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
  obj: NestedObject | null | undefined,
  path: PathInput,
  defaultValue?: T
): T | undefined {
  // Use validateInputs to eliminate DRY violation
  if (validateInputs(obj, path) === false) {
    return defaultValue
  }

  const keys = parsePath(path)
  if (keys.length === 0) return defaultValue

  const result = traversePath(obj as NestedObject, keys)
  // Explicit check to prevent mutation survivors
  if (isNullOrUndefined(result) === true) return defaultValue

  // If the parent value is null or undefined, we can't check for the key
  if (isNullOrUndefined(result.value) === true) {
    return defaultValue
  }

  // Check if the key exists in the parent object
  // This distinguishes between "key doesn't exist" (return default) and "key exists but value is undefined" (return undefined)
  // Explicit check to prevent mutation survivors
  const keyExists = (result.lastKey in result.value) === true
  if (keyExists === false) {
    return defaultValue
  }

  // Extract the final value before coalescing for explicit handling
  const finalValue = result.value[result.lastKey] as T | null | undefined
  return coalesce(finalValue, defaultValue as T)
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
export function setNestedValue<T extends NestedObject>(
  obj: T,
  path: PathInput,
  value: any
): T {
  // Use validateInputs to eliminate DRY violation
  if (validateInputs(obj, path) === false) {
    return obj
  }

  const keys = parsePath(path)
  if (keys.length === 0) return obj

  const result = { ...obj } as NestedObject
  let current: NestedObject = result

  // Traverse to parent of target
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    
    // Handle null/undefined intermediate values
    if (isNullOrUndefined(current[key]) === true) {
      current[key] = {}
    } else {
      // Use Strategy Pattern for cloning - follows OCP
      const cloned = cloneValue(current[key])
      // Check if cloning was successful (cloned value should be object or array)
      const isObject = typeof cloned === 'object'
      const isNotNull = cloned !== null
      if (isObject === true && isNotNull === true) {
        current[key] = cloned
      } else {
        // Invalid path - intermediate value is not an object or array
        return obj
      }
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
export function hasNestedValue(obj: NestedObject | null | undefined, path: PathInput): boolean {
  // Use validateInputs to eliminate DRY violation
  if (validateInputs(obj, path) === false) return false

  const keys = parsePath(path)
  if (keys.length === 0) return false

  const result = traversePath(obj as NestedObject, keys)
  // Explicit check to prevent mutation survivors
  if (isNullOrUndefined(result) === true) return false

  // If the parent value is null or undefined, the key doesn't exist
  if (isNullOrUndefined(result.value) === true) {
    return false
  }

  // Check if the key exists in the parent object (even if value is undefined)
  // Explicit boolean check to prevent mutation survivors
  const keyExists = (result.lastKey in result.value) === true
  return keyExists
}
