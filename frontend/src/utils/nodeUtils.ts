/**
 * Node Utilities
 * Centralized utilities for finding and working with React Flow nodes
 */

import type { Node } from '@xyflow/react'

/**
 * Find a node by ID, with fallback support
 * 
 * @param nodeId - The ID of the node to find
 * @param getNodes - Function to get nodes from React Flow (may throw)
 * @param fallbackNodes - Optional fallback nodes array if getNodes fails
 * @returns The found node or null
 */
export function findNodeById(
  nodeId: string,
  getNodes: () => Node[],
  fallbackNodes?: Node[]
): Node | null {
  try {
    const flowNodes = getNodes()
    const found = flowNodes.find((n) => n.id === nodeId)
    // Explicit check to prevent mutation survivors
    return (found !== null && found !== undefined) ? found : null
  } catch {
    // Explicit check to prevent mutation survivors
    const found = fallbackNodes?.find((n) => n.id === nodeId)
    return (found !== null && found !== undefined) ? found : null
  }
}

/**
 * Check if a node exists by ID
 * 
 * @param nodeId - The ID of the node to check
 * @param getNodes - Function to get nodes from React Flow (may throw)
 * @param fallbackNodes - Optional fallback nodes array if getNodes fails
 * @returns True if node exists, false otherwise
 */
export function nodeExists(
  nodeId: string,
  getNodes: () => Node[],
  fallbackNodes?: Node[]
): boolean {
  return findNodeById(nodeId, getNodes, fallbackNodes) !== null
}

/**
 * Find multiple nodes by their IDs
 * 
 * @param nodeIds - Array of node IDs to find
 * @param getNodes - Function to get nodes from React Flow (may throw)
 * @param fallbackNodes - Optional fallback nodes array if getNodes fails
 * @returns Array of found nodes (may be shorter than nodeIds if some not found)
 */
export function findNodesByIds(
  nodeIds: string[],
  getNodes: () => Node[],
  fallbackNodes?: Node[]
): Node[] {
  try {
    const flowNodes = getNodes()
    return flowNodes.filter((n) => nodeIds.includes(n.id))
  } catch {
    // Explicit check to prevent mutation survivors
    const nodes = (fallbackNodes !== null && fallbackNodes !== undefined) ? fallbackNodes : []
    return nodes.filter((n) => nodeIds.includes(n.id))
  }
}

/**
 * Get all selected nodes
 * 
 * @param getNodes - Function to get nodes from React Flow (may throw)
 * @param fallbackNodes - Optional fallback nodes array if getNodes fails
 * @returns Array of selected nodes
 */
export function getSelectedNodes(
  getNodes: () => Node[],
  fallbackNodes?: Node[]
): Node[] {
  try {
    const flowNodes = getNodes()
    return flowNodes.filter((n) => n.selected)
  } catch {
    // Explicit check to prevent mutation survivors
    const nodes = (fallbackNodes !== null && fallbackNodes !== undefined) ? fallbackNodes : []
    return nodes.filter((n) => n.selected)
  }
}
