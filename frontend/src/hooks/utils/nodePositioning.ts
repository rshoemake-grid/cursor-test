/**
 * Node Positioning Utilities
 * Common utilities for calculating node positions on the canvas
 */

import type { Node } from '@xyflow/react'

export interface Position {
  x: number
  y: number
}

export interface NodePositioningOptions {
  /** Horizontal spacing between nodes */
  horizontalSpacing?: number
  /** Vertical spacing between nodes */
  verticalSpacing?: number
  /** Default X position when no nodes exist */
  defaultX?: number
  /** Default Y position when no nodes exist */
  defaultY?: number
}

const DEFAULT_OPTIONS: Required<NodePositioningOptions> = {
  horizontalSpacing: 200,
  verticalSpacing: 150,
  defaultX: 250,
  defaultY: 250,
}

/**
 * Get the maximum X position from an array of nodes
 * 
 * @param nodes Array of nodes
 * @returns Maximum X position, or 0 if no nodes
 */
export function getMaxNodeX(nodes: Node[]): number {
  if (nodes.length === 0) {
    return 0
  }
  
  return Math.max(...nodes.map(n => n.position.x))
}

/**
 * Get the maximum Y position from an array of nodes
 * 
 * @param nodes Array of nodes
 * @returns Maximum Y position, or 0 if no nodes
 */
export function getMaxNodeY(nodes: Node[]): number {
  if (nodes.length === 0) {
    return 0
  }
  
  return Math.max(...nodes.map(n => n.position.y))
}

/**
 * Calculate the next position for a new node
 * Positions nodes horizontally after existing nodes
 * 
 * @param existingNodes Array of existing nodes
 * @param options Positioning options
 * @returns Position for the new node
 */
export function calculateNextNodePosition(
  existingNodes: Node[],
  options: NodePositioningOptions = {}
): Position {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  if (existingNodes.length === 0) {
    return {
      x: opts.defaultX,
      y: opts.defaultY,
    }
  }
  
  const maxX = getMaxNodeX(existingNodes)
  return {
    x: maxX + opts.horizontalSpacing,
    y: opts.defaultY,
  }
}

/**
 * Calculate positions for multiple new nodes
 * Positions nodes vertically in a column
 * 
 * @param existingNodes Array of existing nodes
 * @param count Number of nodes to position
 * @param options Positioning options
 * @returns Array of positions for the new nodes
 */
export function calculateMultipleNodePositions(
  existingNodes: Node[],
  count: number,
  options: NodePositioningOptions = {}
): Position[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  if (existingNodes.length === 0) {
    // Position all nodes vertically starting from default position
    return Array.from({ length: count }, (_, index) => ({
      x: opts.defaultX,
      y: opts.defaultY + (index * opts.verticalSpacing),
    }))
  }
  
  // Position nodes in a column to the right of existing nodes
  const startX = getMaxNodeX(existingNodes) + opts.horizontalSpacing
  const startY = opts.defaultY
  
  return Array.from({ length: count }, (_, index) => ({
    x: startX,
    y: startY + (index * opts.verticalSpacing),
  }))
}

/**
 * Calculate grid-based positioning for nodes
 * Arranges nodes in a grid pattern
 * 
 * @param existingNodes Array of existing nodes
 * @param count Number of nodes to position
 * @param columnsPerRow Number of columns per row
 * @param options Positioning options
 * @returns Array of positions for the new nodes
 */
export function calculateGridPosition(
  existingNodes: Node[],
  count: number,
  columnsPerRow: number = 3,
  options: NodePositioningOptions = {}
): Position[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  // Calculate starting position
  let startX = opts.defaultX
  let startY = opts.defaultY
  
  if (existingNodes.length > 0) {
    const maxX = getMaxNodeX(existingNodes)
    const maxY = getMaxNodeY(existingNodes)
    startX = maxX + opts.horizontalSpacing
    startY = Math.max(opts.defaultY, maxY)
  }
  
  // Calculate positions in grid
  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columnsPerRow)
    const col = index % columnsPerRow
    
    return {
      x: startX + (col * opts.horizontalSpacing),
      y: startY + (row * opts.verticalSpacing),
    }
  })
}

/**
 * Calculate position relative to a reference node
 * 
 * @param referenceNode Reference node
 * @param offset Offset from reference node
 * @returns Position relative to reference node
 */
export function calculateRelativePosition(
  referenceNode: Node,
  offset: Position = { x: 200, y: 0 }
): Position {
  return {
    x: referenceNode.position.x + offset.x,
    y: referenceNode.position.y + offset.y,
  }
}
