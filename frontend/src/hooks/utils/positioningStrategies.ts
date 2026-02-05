/**
 * Positioning Strategies
 * Strategy Pattern implementation for node positioning algorithms
 * Follows Open/Closed Principle - extensible without modification
 */

import type { Node } from '@xyflow/react'
import type { Position, NodePositioningOptions } from './nodePositioning'

/**
 * Base positioning strategy interface
 * Open/Closed: Extensible without modification
 */
interface PositioningStrategy {
  calculatePositions(
    existingNodes: Node[],
    count: number,
    options: Required<NodePositioningOptions>
  ): Position[]
}

/**
 * Horizontal positioning strategy
 * Single Responsibility: Only handles horizontal positioning
 */
class HorizontalStrategy implements PositioningStrategy {
  calculatePositions(
    existingNodes: Node[],
    count: number,
    options: Required<NodePositioningOptions>
  ): Position[] {
    if (existingNodes.length === 0) {
      // Position all nodes horizontally starting from default position
      return Array.from({ length: count }, (_, i) => ({
        x: options.defaultX + (i * options.horizontalSpacing),
        y: options.defaultY
      }))
    }

    // Position nodes to the right of existing nodes
    const maxX = Math.max(...existingNodes.map(n => n.position.x))
    return Array.from({ length: count }, (_, i) => ({
      x: maxX + options.horizontalSpacing + (i * options.horizontalSpacing),
      y: options.defaultY
    }))
  }
}

/**
 * Vertical positioning strategy
 * Single Responsibility: Only handles vertical positioning
 */
class VerticalStrategy implements PositioningStrategy {
  calculatePositions(
    existingNodes: Node[],
    count: number,
    options: Required<NodePositioningOptions>
  ): Position[] {
    if (existingNodes.length === 0) {
      // Position all nodes vertically starting from default position
      return Array.from({ length: count }, (_, i) => ({
        x: options.defaultX,
        y: options.defaultY + (i * options.verticalSpacing)
      }))
    }

    // Position nodes in a column to the right of existing nodes
    const maxX = Math.max(...existingNodes.map(n => n.position.x))
    return Array.from({ length: count }, (_, i) => ({
      x: maxX + options.horizontalSpacing,
      y: options.defaultY + (i * options.verticalSpacing)
    }))
  }
}

/**
 * Grid positioning strategy
 * Single Responsibility: Only handles grid positioning
 */
class GridStrategy implements PositioningStrategy {
  constructor(private columnsPerRow: number = 3) {}

  calculatePositions(
    existingNodes: Node[],
    count: number,
    options: Required<NodePositioningOptions>
  ): Position[] {
    // Calculate starting position
    let startX = options.defaultX
    let startY = options.defaultY

    if (existingNodes.length > 0) {
      const maxX = Math.max(...existingNodes.map(n => n.position.x))
      const maxY = Math.max(...existingNodes.map(n => n.position.y))
      startX = maxX + options.horizontalSpacing
      startY = Math.max(options.defaultY, maxY)
    }

    // Calculate positions in grid
    return Array.from({ length: count }, (_, index) => {
      const row = Math.floor(index / this.columnsPerRow)
      const col = index % this.columnsPerRow
      return {
        x: startX + (col * options.horizontalSpacing),
        y: startY + (row * options.verticalSpacing)
      }
    })
  }
}

/**
 * Strategy factory
 * Factory Pattern: Creates appropriate strategy
 * 
 * @param type Positioning strategy type
 * @param columnsPerRow Number of columns per row (for grid strategy)
 * @returns Positioning strategy instance
 */
export function createPositioningStrategy(
  type: 'horizontal' | 'vertical' | 'grid',
  columnsPerRow?: number
): PositioningStrategy {
  switch (type) {
    case 'horizontal':
      return new HorizontalStrategy()
    case 'vertical':
      return new VerticalStrategy()
    case 'grid':
      return new GridStrategy(columnsPerRow)
    default:
      return new HorizontalStrategy()
  }
}
