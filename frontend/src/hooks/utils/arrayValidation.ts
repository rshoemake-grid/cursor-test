/**
 * Array Validation Utilities
 * Extracted from multiple hooks for better testability and mutation resistance
 * Single Responsibility: Only validates array data
 */

/**
 * Check if value is a valid array
 * Mutation-resistant: explicit array check
 */
export function isValidArray<T>(value: any): value is T[] {
  return Array.isArray(value)
}

/**
 * Check if array has items (is array and length > 0)
 * Mutation-resistant: explicit checks for each condition
 */
export function hasArrayItems<T>(array: T[] | null | undefined): boolean {
  if (!isValidArray(array)) {
    return false
  }
  return array.length > 0
}

/**
 * Check if array is empty (is array and length === 0)
 * Mutation-resistant: explicit checks
 */
export function isArrayEmpty<T>(array: T[] | null | undefined): boolean {
  if (!isValidArray(array)) {
    return true // Non-arrays are considered empty
  }
  return array.length === 0
}

/**
 * Get array length safely (returns 0 for non-arrays)
 * Mutation-resistant: explicit array check
 */
export function getArrayLength<T>(array: T[] | null | undefined): number {
  if (!isValidArray(array)) {
    return 0
  }
  return array.length
}

/**
 * Check if array has items and is valid
 * Combines array validation and length check
 * Mutation-resistant: explicit function calls
 */
export function canProcessArray<T>(array: T[] | null | undefined): boolean {
  return hasArrayItems(array)
}
