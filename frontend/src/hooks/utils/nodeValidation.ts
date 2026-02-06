/**
 * Node Validation Utilities
 * Extracted for better testability, mutation resistance, and DRY compliance
 * Single Responsibility: Only validates node IDs and selection state
 */

/**
 * Check if node ID is valid (not null, undefined, or empty)
 * Mutation-resistant: explicit checks for each condition
 * DRY: Single source of truth for node ID validation
 * 
 * @param nodeId The node ID to validate
 * @returns True if node ID is valid, false otherwise
 */
export function isValidNodeId(nodeId: string | null | undefined): nodeId is string {
  if (nodeId === null) {
    return false
  }
  if (nodeId === undefined) {
    return false
  }
  if (nodeId === '') {
    return false
  }
  return true
}

/**
 * Check if cached node is valid
 * Mutation-resistant: explicit checks
 * 
 * @param cachedId The cached node ID
 * @param currentId The current node ID
 * @param cachedNode The cached node object
 * @returns True if cache is valid and matches current ID
 */
export function hasValidCache(
  cachedId: string | null,
  currentId: string,
  cachedNode: any | null | undefined
): boolean {
  if (cachedId !== currentId) {
    return false
  }
  if (cachedNode === null) {
    return false
  }
  if (cachedNode === undefined) {
    return false
  }
  return true
}

/**
 * Check if node exists and is not null/undefined
 * Mutation-resistant: explicit checks
 * 
 * @param node The node to check
 * @returns True if node exists, false otherwise
 */
export function nodeExistsAndValid(node: any | null | undefined): node is any {
  if (node === null) {
    return false
  }
  if (node === undefined) {
    return false
  }
  return true
}
