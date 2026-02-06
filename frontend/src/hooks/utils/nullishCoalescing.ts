/**
 * Nullish Coalescing Utilities
 * Extracted for better testability and mutation resistance
 * Single Responsibility: Only handles nullish coalescing operations
 */

/**
 * Get value or default if null/undefined
 * Mutation-resistant: explicit null/undefined checks
 * 
 * @param value The value to check
 * @param defaultValue The default value to return if value is null/undefined
 * @returns value if not null/undefined, otherwise defaultValue
 */
export function nullishCoalesce<T>(value: T | null | undefined, defaultValue: T): T {
  if (value === null) {
    return defaultValue
  }
  if (value === undefined) {
    return defaultValue
  }
  return value
}

/**
 * Get value or null if null/undefined
 * Mutation-resistant: explicit null/undefined checks
 * 
 * @param value The value to check
 * @returns value if not null/undefined, otherwise null
 */
export function nullishCoalesceToNull<T>(value: T | null | undefined): T | null {
  if (value === null) {
    return null
  }
  if (value === undefined) {
    return null
  }
  return value
}
