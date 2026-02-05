/**
 * Node Positioning Utilities
 * Common utilities for calculating node positions on the canvas
 * Refactored to use Strategy Pattern for extensibility
 */

import type { Node } from '@xyflow/react'
import { createPositioningStrategy } from './positioningStrategies'

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
 * Merge options with defaults
 * DRY: Single source of truth for option merging
 * 
 * @param options Partial options
 * @returns Complete options with defaults
 */
function mergeOptions(options: NodePositioningOptions = {}): Required<NodePositioningOptions> {
  return { ...DEFAULT_OPTIONS, ...options }
}

/**
 * Get the maximum X position from an array of nodes
 * Single Responsibility: Only calculates max X
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
 * Single Responsibility: Only calculates max Y
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
 * Uses Strategy Pattern internally
 * 
 * @param existingNodes Array of existing nodes
 * @param options Positioning options
 * @returns Position for the new node
 */
export function calculateNextNodePosition(
  existingNodes: Node[],
  options: NodePositioningOptions = {}
): Position {
  const opts = mergeOptions(options)
  const strategy = createPositioningStrategy('horizontal')
  const positions = strategy.calculatePositions(existingNodes, 1, opts)
  return positions[0]
}

/**
 * Calculate positions for multiple new nodes
 * Positions nodes vertically in a column
 * Uses Strategy Pattern internally
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
  const opts = mergeOptions(options)
  const strategy = createPositioningStrategy('vertical')
  return strategy.calculatePositions(existingNodes, count, opts)
}

/**
 * Calculate grid-based positioning for nodes
 * Arranges nodes in a grid pattern
 * Uses Strategy Pattern internally
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
  const opts = mergeOptions(options)
  const strategy = createPositioningStrategy('grid', columnsPerRow)
  return strategy.calculatePositions(existingNodes, count, opts)
}

/**
 * Calculate position relative to a reference node
 * Single Responsibility: Only calculates relative position
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
