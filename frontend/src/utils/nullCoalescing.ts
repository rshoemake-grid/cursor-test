/**
 * Null Coalescing Utilities
 * DRY: Centralized null/undefined/default handling
 * SOLID: Single Responsibility - only handles null coalescing
 * 
 * These utilities kill ConditionalExpression mutations by using explicit checks
 * instead of || operators.
 */

/**
 * Get value or default with explicit checks
 * Kills: ConditionalExpression mutations (value || defaultValue)
 * 
 * @param value - The value to check
 * @param defaultValue - The default value to return if value is null/undefined
 * @returns The value if it's not null/undefined, otherwise the default value
 */
export function coalesce<T>(value: T | null | undefined, defaultValue: T): T {
  // Explicit checks kill mutations
  if (value !== null && value !== undefined) {
    return value
  }
  return defaultValue
}

/**
 * Get value or default for objects
 * Kills: ConditionalExpression mutations for object defaults
 * 
 * @param value - The object to check
 * @param defaultValue - The default object to return if value is null/undefined/invalid
 * @returns The value if it's a valid object, otherwise the default object
 */
export function coalesceObject<T extends Record<string, any>>(
  value: T | null | undefined,
  defaultValue: T
): T {
  // Explicit checks kill mutations
  if (value !== null && 
      value !== undefined && 
      typeof value === 'object' && 
      !Array.isArray(value) &&
      Object.keys(value).length >= 0) { // Allow empty objects
    return value
  }
  return defaultValue
}

/**
 * Get value or default for arrays
 * Kills: ConditionalExpression mutations for array defaults
 * 
 * @param value - The array to check
 * @param defaultValue - The default array to return if value is null/undefined/invalid
 * @returns The value if it's a valid array, otherwise the default array
 */
export function coalesceArray<T>(value: T[] | null | undefined, defaultValue: T[]): T[] {
  // Explicit checks kill mutations
  if (value !== null && value !== undefined && Array.isArray(value)) {
    return value
  }
  return defaultValue
}

/**
 * Get value or default for strings
 * Kills: ConditionalExpression mutations for string defaults
 * 
 * @param value - The string to check
 * @param defaultValue - The default string to return if value is null/undefined/empty
 * @returns The value if it's a non-empty string, otherwise the default string
 */
export function coalesceString(value: string | null | undefined, defaultValue: string): string {
  // Explicit checks kill mutations
  if (value !== null && value !== undefined && typeof value === 'string' && value !== '') {
    return value
  }
  return defaultValue
}

/**
 * Chain multiple values with explicit checks
 * Kills: Multiple || chain mutations (value1 || value2 || value3 || defaultValue)
 * 
 * @param values - Array of values to check in order
 * @returns The first non-null/non-undefined value, or null if all are null/undefined
 */
export function coalesceChain<T>(
  ...values: Array<T | null | undefined>
): T | null {
  // Explicit checks kill mutations
  for (const value of values) {
    if (value !== null && value !== undefined) {
      return value
    }
  }
  return null
}

/**
 * Chain multiple values with explicit checks and default fallback
 * Kills: Multiple || chain mutations with default (value1 || value2 || defaultValue)
 * 
 * @param defaultValue - The default value to return if all values are null/undefined
 * @param values - Array of values to check in order
 * @returns The first non-null/non-undefined value, or the default value
 */
export function coalesceChainWithDefault<T>(
  defaultValue: T,
  ...values: Array<T | null | undefined>
): T {
  // Explicit checks kill mutations
  for (const value of values) {
    if (value !== null && value !== undefined) {
      return value
    }
  }
  return defaultValue
}

/**
 * Chain multiple object values with explicit checks
 * Kills: Object || chain mutations (obj1 || obj2 || {})
 * 
 * @param defaultValue - The default object to return if all values are null/undefined/invalid
 * @param values - Array of objects to check in order
 * @returns The first valid object, or the default object
 */
export function coalesceObjectChain<T extends Record<string, any>>(
  defaultValue: T,
  ...values: Array<T | null | undefined>
): T {
  // Explicit checks kill mutations
  for (const value of values) {
    if (value !== null && 
        value !== undefined && 
        typeof value === 'object' && 
        !Array.isArray(value)) {
      return value
    }
  }
  return defaultValue
}

/**
 * Chain multiple array values with explicit checks
 * Kills: Array || chain mutations (arr1 || arr2 || [])
 * 
 * @param defaultValue - The default array to return if all values are null/undefined/invalid
 * @param values - Array of arrays to check in order
 * @returns The first valid array, or the default array
 */
export function coalesceArrayChain<T>(
  defaultValue: T[],
  ...values: Array<T[] | null | undefined>
): T[] {
  // Explicit checks kill mutations
  for (const value of values) {
    if (value !== null && value !== undefined && Array.isArray(value)) {
      return value
    }
  }
  return defaultValue
}

/**
 * Chain multiple string values with explicit checks
 * Kills: String || chain mutations (str1 || str2 || 'default')
 * 
 * @param defaultValue - The default string to return if all values are null/undefined/empty
 * @param values - Array of strings to check in order
 * @returns The first non-empty string, or the default string
 */
export function coalesceStringChain(
  defaultValue: string,
  ...values: Array<string | null | undefined>
): string {
  // Explicit checks kill mutations
  for (const value of values) {
    if (value !== null && value !== undefined && typeof value === 'string' && value !== '') {
      return value
    }
  }
  return defaultValue
}
