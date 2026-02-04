/**
 * Validation Utilities
 * Shared validation functions for marketplace operations
 */

/**
 * Check if a set of IDs is empty
 * 
 * @param ids - Set of IDs to check
 * @returns true if the set is empty, false otherwise
 */
export function isEmptySelection(ids: Set<string>): boolean {
  return ids.size === 0
}

/**
 * Validate that storage is available
 * 
 * @param storage - Storage adapter to validate
 * @returns true if storage is available, false otherwise
 */
export function isStorageAvailable(storage: any): boolean {
  return storage !== null && storage !== undefined
}
