import { createPositioningStrategy } from './positioningStrategies'
import type { Node } from '@xyflow/react'

describe('positioningStrategies', () => {
  const defaultOptions = {
    horizontalSpacing: 200,
    verticalSpacing: 150,
    defaultX: 250,
    defaultY: 250,
  }

  describe('HorizontalStrategy', () => {
    it('should position nodes horizontally on empty canvas', () => {
      const strategy = createPositioningStrategy('horizontal')
      const positions = strategy.calculatePositions([], 3, defaultOptions)

      expect(positions).toHaveLength(3)
      expect(positions[0]).toEqual({ x: 250, y: 250 })
      expect(positions[1]).toEqual({ x: 450, y: 250 })
      expect(positions[2]).toEqual({ x: 650, y: 250 })
    })

    it('should position nodes to the right of existing nodes', () => {
      const existingNodes: Node[] = [
        { id: '1', position: { x: 100, y: 100 }, data: {}, type: 'agent' },
        { id: '2', position: { x: 300, y: 100 }, data: {}, type: 'agent' },
      ]
      const strategy = createPositioningStrategy('horizontal')
      const positions = strategy.calculatePositions(existingNodes, 2, defaultOptions)

      expect(positions).toHaveLength(2)
      expect(positions[0].x).toBeGreaterThan(300)
      expect(positions[0].y).toBe(250)
      expect(positions[1].x).toBeGreaterThan(positions[0].x)
    })

    it('should handle single node positioning', () => {
      const strategy = createPositioningStrategy('horizontal')
      const positions = strategy.calculatePositions([], 1, defaultOptions)

      expect(positions).toHaveLength(1)
      expect(positions[0]).toEqual({ x: 250, y: 250 })
    })

    it('should use custom spacing', () => {
      const customOptions = { ...defaultOptions, horizontalSpacing: 300 }
      const strategy = createPositioningStrategy('horizontal')
      const positions = strategy.calculatePositions([], 2, customOptions)

      expect(positions[1].x - positions[0].x).toBe(300)
    })
  })

  describe('VerticalStrategy', () => {
    it('should position nodes vertically on empty canvas', () => {
      const strategy = createPositioningStrategy('vertical')
      const positions = strategy.calculatePositions([], 3, defaultOptions)

      expect(positions).toHaveLength(3)
      expect(positions[0]).toEqual({ x: 250, y: 250 })
      expect(positions[1]).toEqual({ x: 250, y: 400 })
      expect(positions[2]).toEqual({ x: 250, y: 550 })
    })

    it('should position nodes in column to the right of existing nodes', () => {
      const existingNodes: Node[] = [
        { id: '1', position: { x: 100, y: 100 }, data: {}, type: 'agent' },
        { id: '2', position: { x: 100, y: 250 }, data: {}, type: 'agent' },
      ]
      const strategy = createPositioningStrategy('vertical')
      const positions = strategy.calculatePositions(existingNodes, 2, defaultOptions)

      expect(positions).toHaveLength(2)
      expect(positions[0].x).toBeGreaterThan(100)
      expect(positions[0].x).toBe(positions[1].x)
      expect(positions[1].y).toBeGreaterThan(positions[0].y)
    })

    it('should use custom spacing', () => {
      const customOptions = { ...defaultOptions, verticalSpacing: 200 }
      const strategy = createPositioningStrategy('vertical')
      const positions = strategy.calculatePositions([], 2, customOptions)

      expect(positions[1].y - positions[0].y).toBe(200)
    })
  })

  describe('GridStrategy', () => {
    it('should position nodes in grid on empty canvas', () => {
      const strategy = createPositioningStrategy('grid', 2)
      const positions = strategy.calculatePositions([], 4, defaultOptions)

      expect(positions).toHaveLength(4)
      // First row
      expect(positions[0]).toEqual({ x: 250, y: 250 })
      expect(positions[1]).toEqual({ x: 450, y: 250 })
      // Second row
      expect(positions[2]).toEqual({ x: 250, y: 400 })
      expect(positions[3]).toEqual({ x: 450, y: 400 })
    })

    it('should position nodes in grid with custom columns', () => {
      const strategy = createPositioningStrategy('grid', 3)
      const positions = strategy.calculatePositions([], 6, defaultOptions)

      expect(positions).toHaveLength(6)
      // First row: 3 nodes
      expect(positions[0].y).toBe(positions[1].y)
      expect(positions[1].y).toBe(positions[2].y)
      // Second row: 3 nodes
      expect(positions[3].y).toBe(positions[4].y)
      expect(positions[4].y).toBe(positions[5].y)
      expect(positions[3].y).toBeGreaterThan(positions[0].y)
    })

    it('should position grid to the right of existing nodes', () => {
      const existingNodes: Node[] = [
        { id: '1', position: { x: 100, y: 100 }, data: {}, type: 'agent' },
      ]
      const strategy = createPositioningStrategy('grid', 2)
      const positions = strategy.calculatePositions(existingNodes, 2, defaultOptions)

      expect(positions[0].x).toBeGreaterThan(100)
      // With 2 columns, first two nodes should be in same row (same y) but different columns (different x)
      expect(positions[0].y).toBe(positions[1].y)
      expect(positions[1].x).toBeGreaterThan(positions[0].x)
    })

    it('should handle incomplete rows', () => {
      const strategy = createPositioningStrategy('grid', 3)
      const positions = strategy.calculatePositions([], 5, defaultOptions)

      expect(positions).toHaveLength(5)
      // First row: 3 nodes
      expect(positions[0].y).toBe(positions[1].y)
      expect(positions[1].y).toBe(positions[2].y)
      // Second row: 2 nodes
      expect(positions[3].y).toBe(positions[4].y)
      expect(positions[3].y).toBeGreaterThan(positions[0].y)
    })

    it('should use default columnsPerRow (3) when not specified', () => {
      const strategy = createPositioningStrategy('grid')
      const positions = strategy.calculatePositions([], 6, defaultOptions)

      expect(positions).toHaveLength(6)
      // Should have 2 rows of 3
      expect(positions[0].y).toBe(positions[2].y)
      expect(positions[3].y).toBe(positions[5].y)
    })
  })

  describe('createPositioningStrategy factory', () => {
    it('should create horizontal strategy', () => {
      const strategy = createPositioningStrategy('horizontal')
      expect(strategy).toBeDefined()
      // Test with multiple nodes to verify horizontal positioning (same y, different x)
      const positions = strategy.calculatePositions([], 2, defaultOptions)
      expect(positions[0].y).toBe(positions[1].y) // Same y (horizontal line)
      expect(positions[1].x).toBeGreaterThan(positions[0].x) // Increasing x
    })

    it('should create vertical strategy', () => {
      const strategy = createPositioningStrategy('vertical')
      expect(strategy).toBeDefined()
      const positions = strategy.calculatePositions([], 2, defaultOptions)
      expect(positions[0].x).toBe(positions[1].x) // Same x, different y
      expect(positions[1].y).toBeGreaterThan(positions[0].y)
    })

    it('should create grid strategy', () => {
      const strategy = createPositioningStrategy('grid', 2)
      expect(strategy).toBeDefined()
      const positions = strategy.calculatePositions([], 4, defaultOptions)
      expect(positions).toHaveLength(4)
    })

    it('should default to horizontal for invalid type', () => {
      const strategy = createPositioningStrategy('invalid' as any)
      expect(strategy).toBeDefined()
      const positions = strategy.calculatePositions([], 1, defaultOptions)
      expect(positions[0]).toEqual({ x: 250, y: 250 })
    })

    it('should handle zero nodes', () => {
      const strategy = createPositioningStrategy('horizontal')
      const positions = strategy.calculatePositions([], 0, defaultOptions)
      expect(positions).toHaveLength(0)
    })

    it('should handle nodes with negative positions', () => {
      const existingNodes: Node[] = [
        { id: '1', position: { x: -100, y: -50 }, data: {}, type: 'agent' },
      ]
      const strategy = createPositioningStrategy('horizontal')
      const positions = strategy.calculatePositions(existingNodes, 1, defaultOptions)
      expect(positions[0].x).toBeGreaterThan(-100)
    })

    it('should handle very large node counts', () => {
      const strategy = createPositioningStrategy('horizontal')
      const positions = strategy.calculatePositions([], 100, defaultOptions)
      expect(positions).toHaveLength(100)
      expect(positions[99].x).toBeGreaterThan(positions[0].x)
    })
  })
})
