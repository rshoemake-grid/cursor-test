/**
 * Node Cache Utilities
 * Extracted for better testability, mutation resistance, and SRP compliance
 * Single Responsibility: Only handles node caching logic
 */

import type { Node } from '@xyflow/react'
import { nodeExistsAndValid } from './nodeValidation'
import type React from 'react'

/**
 * Cache update result
 */
export interface CacheUpdateResult {
  cached: Node | null
  idCached: string | null
}

/**
 * Update node cache
 * Mutation-resistant: explicit null/undefined checks
 * 
 * @param node The node to cache (can be null/undefined)
 * @param nodeId The node ID to cache
 * @returns Cache update result
 */
export function updateNodeCache(
  node: Node | null | undefined,
  nodeId: string | null
): CacheUpdateResult {
  if (nodeExistsAndValid(node)) {
    return {
      cached: { ...node }, // Create a copy to stabilize reference
      idCached: nodeId,
    }
  } else {
    return {
      cached: null,
      idCached: null,
    }
  }
}

/**
 * Update cached node data while preserving reference
 * Mutation-resistant: explicit checks
 * 
 * @param cachedNode The cached node reference
 * @param updatedNode The updated node data
 * @returns True if update was successful
 */
export function updateCachedNodeData(
  cachedNode: Node | null | undefined,
  updatedNode: Node | null | undefined
): boolean {
  if (!nodeExistsAndValid(cachedNode)) {
    return false
  }
  if (!nodeExistsAndValid(updatedNode)) {
    return false
  }
  
  // Update cache with latest data but preserve reference
  Object.assign(cachedNode, updatedNode)
  return true
}

/**
 * Clear node cache
 * Mutation-resistant: explicit checks
 * 
 * @param nodeRef Reference to cached node
 * @param idRef Reference to cached node ID
 */
export function clearNodeCache(
  nodeRef: React.MutableRefObject<any>,
  idRef: React.MutableRefObject<string | null>
): void {
  nodeRef.current = null
  idRef.current = null
}

/**
 * Sync cache data while preserving reference
 * Mutation-resistant: explicit checks
 * 
 * @param nodeRef Reference to cached node
 * @param updatedNode The updated node data
 */
export function syncCacheData(
  nodeRef: React.MutableRefObject<any>,
  updatedNode: Node | null | undefined
): void {
  if (nodeExistsAndValid(nodeRef.current) && nodeExistsAndValid(updatedNode)) {
    Object.assign(nodeRef.current, updatedNode)
  }
}

/**
 * Update node cache (overloaded version for refs)
 * Mutation-resistant: explicit checks
 * 
 * @param nodeRef Reference to cached node
 * @param idRef Reference to cached node ID
 * @param node The node to cache (can be null/undefined)
 * @param nodeId The node ID to cache
 */
export function updateNodeCacheRefs(
  nodeRef: React.MutableRefObject<any>,
  idRef: React.MutableRefObject<string | null>,
  node: Node | null | undefined,
  nodeId: string | null
): void {
  const result = updateNodeCache(node, nodeId)
  nodeRef.current = result.cached
  idRef.current = result.idCached
}
