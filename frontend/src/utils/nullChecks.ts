/**
 * Null Check Utilities
 * Centralized null/undefined checking to eliminate DRY violations
 * DRY: Single source of truth for null checks
 */

/**
 * Type guard to check if value is not null or undefined
 * DRY: Replaces repeated (value !== null && value !== undefined) patterns
 */
export function isNotNullOrUndefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Check if a Set has size greater than threshold
 * DRY: Replaces repeated (set !== null && set !== undefined && set.size > threshold) patterns
 */
export function hasSize(set: Set<any> | null | undefined, threshold: number = 1): boolean {
  return isNotNullOrUndefined(set) && set.size > threshold
}

/**
 * Check if multiple nodes are selected
 * DRY: Replaces repeated (selectedNodeIds !== null && selectedNodeIds !== undefined && selectedNodeIds.size > 1) patterns
 */
export function hasMultipleSelected(selectedNodeIds: Set<string> | null | undefined): boolean {
  return hasSize(selectedNodeIds, 1)
}

/**
 * Check if value is explicitly false (not just falsy)
 * DRY: Replaces repeated (value === false) patterns
 */
export function isExplicitlyFalse(value: boolean | null | undefined): boolean {
  return value === false
}

/**
 * Check if value is truthy and not empty
 * DRY: Common pattern for checking if values exist
 */
export function isNotEmpty(value: string | null | undefined): boolean {
  return isNotNullOrUndefined(value) && value !== ''
}

/**
 * Check if array exists and has items
 * DRY: Common pattern for checking arrays
 */
export function hasItems<T>(array: T[] | null | undefined): boolean {
  return isNotNullOrUndefined(array) && Array.isArray(array) && array.length > 0
}

/**
 * Check if array is non-empty (alias for hasItems)
 * DRY: Common pattern for checking arrays
 */
export function isNonEmptyArray<T>(array: T[] | null | undefined): array is T[] {
  return hasItems(array)
}

/**
 * Get safe array (returns empty array if null/undefined)
 * DRY: Replaces repeated (array !== null && array !== undefined && Array.isArray(array) ? array : []) patterns
 */
export function safeArray<T>(array: T[] | null | undefined): T[] {
  return isNotNullOrUndefined(array) && Array.isArray(array) ? array : []
}

/**
 * Get value or default if null/undefined
 * DRY: Replaces repeated ternary patterns
 */
export function getOrDefault<T>(value: T | null | undefined, defaultValue: T): T {
  return isNotNullOrUndefined(value) ? value : defaultValue
}
