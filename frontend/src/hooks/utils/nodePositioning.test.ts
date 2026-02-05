import {
  getMaxNodeX,
  getMaxNodeY,
  calculateNextNodePosition,
  calculateMultipleNodePositions,
  calculateGridPosition,
  calculateRelativePosition,
} from './nodePositioning'
import type { Node } from '@xyflow/react'

describe('nodePositioning', () => {
  describe('getMaxNodeX', () => {
    it('should return 0 for empty array', () => {
      expect(getMaxNodeX([])).toBe(0)
    })

    it('should return x position for single node', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 100, y: 50 }, data: {}, type: 'agent' },
      ]
      expect(getMaxNodeX(nodes)).toBe(100)
    })

    it('should return maximum x for multiple nodes', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 100, y: 50 }, data: {}, type: 'agent' },
        { id: '2', position: { x: 300, y: 50 }, data: {}, type: 'agent' },
        { id: '3', position: { x: 200, y: 50 }, data: {}, type: 'agent' },
      ]
      expect(getMaxNodeX(nodes)).toBe(300)
    })

    it('should handle negative x positions', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: -100, y: 50 }, data: {}, type: 'agent' },
        { id: '2', position: { x: -50, y: 50 }, data: {}, type: 'agent' },
      ]
      expect(getMaxNodeX(nodes)).toBe(-50)
    })

    it('should handle zero x position', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 50 }, data: {}, type: 'agent' },
        { id: '2', position: { x: -100, y: 50 }, data: {}, type: 'agent' },
      ]
      expect(getMaxNodeX(nodes)).toBe(0)
    })
  })

  describe('getMaxNodeY', () => {
    it('should return 0 for empty array', () => {
      expect(getMaxNodeY([])).toBe(0)
    })

    it('should return y position for single node', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 50, y: 100 }, data: {}, type: 'agent' },
      ]
      expect(getMaxNodeY(nodes)).toBe(100)
    })

    it('should return maximum y for multiple nodes', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 50, y: 100 }, data: {}, type: 'agent' },
        { id: '2', position: { x: 50, y: 300 }, data: {}, type: 'agent' },
        { id: '3', position: { x: 50, y: 200 }, data: {}, type: 'agent' },
      ]
      expect(getMaxNodeY(nodes)).toBe(300)
    })

    it('should handle negative y positions', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 50, y: -100 }, data: {}, type: 'agent' },
        { id: '2', position: { x: 50, y: -50 }, data: {}, type: 'agent' },
      ]
      expect(getMaxNodeY(nodes)).toBe(-50)
    })
  })

  describe('calculateNextNodePosition', () => {
    it('should return default position for empty canvas', () => {
      const position = calculateNextNodePosition([])
      expect(position).toEqual({ x: 250, y: 250 })
    })

    it('should position to the right of existing nodes', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 100, y: 100 }, data: {}, type: 'agent' },
        { id: '2', position: { x: 300, y: 100 }, data: {}, type: 'agent' },
      ]
      const position = calculateNextNodePosition(nodes)
      expect(position.x).toBeGreaterThan(300)
      expect(position.y).toBe(250)
    })

    it('should use custom options', () => {
      const position = calculateNextNodePosition([], {
        defaultX: 100,
        defaultY: 200,
        horizontalSpacing: 300,
      })
      expect(position).toEqual({ x: 100, y: 200 })
    })

    it('should respect horizontal spacing', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 100, y: 100 }, data: {}, type: 'agent' },
      ]
      const position = calculateNextNodePosition(nodes, {
        horizontalSpacing: 500,
      })
      expect(position.x).toBe(100 + 500)
    })
  })

  describe('calculateMultipleNodePositions', () => {
    it('should return vertical positions for empty canvas', () => {
      const positions = calculateMultipleNodePositions([], 3)
      expect(positions).toHaveLength(3)
      expect(positions[0]).toEqual({ x: 250, y: 250 })
      expect(positions[1].y).toBeGreaterThan(positions[0].y)
      expect(positions[2].y).toBeGreaterThan(positions[1].y)
    })

    it('should position multiple nodes vertically', () => {
      const positions = calculateMultipleNodePositions([], 3)
      expect(positions[0].x).toBe(positions[1].x)
      expect(positions[1].x).toBe(positions[2].x)
    })

    it('should position to the right of existing nodes', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 100, y: 100 }, data: {}, type: 'agent' },
      ]
      const positions = calculateMultipleNodePositions(nodes, 2)
      expect(positions[0].x).toBeGreaterThan(100)
      expect(positions[0].x).toBe(positions[1].x)
    })

    it('should use custom spacing', () => {
      const positions = calculateMultipleNodePositions([], 2, {
        verticalSpacing: 300,
      })
      expect(positions[1].y - positions[0].y).toBe(300)
    })

    it('should handle zero count', () => {
      const positions = calculateMultipleNodePositions([], 0)
      expect(positions).toHaveLength(0)
    })
  })

  describe('calculateGridPosition', () => {
    it('should return grid positions for empty canvas', () => {
      const positions = calculateGridPosition([], 4, 2)
      expect(positions).toHaveLength(4)
      // First row
      expect(positions[0].y).toBe(positions[1].y)
      // Second row
      expect(positions[2].y).toBe(positions[3].y)
      expect(positions[2].y).toBeGreaterThan(positions[0].y)
    })

    it('should use default columnsPerRow (3)', () => {
      const positions = calculateGridPosition([], 6)
      expect(positions).toHaveLength(6)
      // Should have 2 rows of 3
      expect(positions[0].y).toBe(positions[2].y)
      expect(positions[3].y).toBe(positions[5].y)
    })

    it('should position grid to the right of existing nodes', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 100, y: 100 }, data: {}, type: 'agent' },
      ]
      const positions = calculateGridPosition(nodes, 2, 2)
      expect(positions[0].x).toBeGreaterThan(100)
    })

    it('should handle incomplete rows', () => {
      const positions = calculateGridPosition([], 5, 3)
      expect(positions).toHaveLength(5)
      // First row: 3 nodes
      expect(positions[0].y).toBe(positions[2].y)
      // Second row: 2 nodes
      expect(positions[3].y).toBe(positions[4].y)
    })

    it('should use custom spacing', () => {
      const positions = calculateGridPosition([], 4, 2, {
        horizontalSpacing: 300,
        verticalSpacing: 200,
      })
      expect(positions[1].x - positions[0].x).toBe(300)
      expect(positions[2].y - positions[0].y).toBe(200)
    })
  })

  describe('calculateRelativePosition', () => {
    const referenceNode: Node = {
      id: 'ref',
      position: { x: 100, y: 200 },
      data: {},
      type: 'agent',
    }

    it('should calculate position with default offset', () => {
      const position = calculateRelativePosition(referenceNode)
      expect(position).toEqual({ x: 300, y: 200 }) // 100 + 200, 200 + 0
    })

    it('should calculate position with custom offset', () => {
      const position = calculateRelativePosition(referenceNode, { x: 50, y: 100 })
      expect(position).toEqual({ x: 150, y: 300 })
    })

    it('should handle negative offsets', () => {
      const position = calculateRelativePosition(referenceNode, { x: -50, y: -100 })
      expect(position).toEqual({ x: 50, y: 100 })
    })

    it('should handle zero offset', () => {
      const position = calculateRelativePosition(referenceNode, { x: 0, y: 0 })
      expect(position).toEqual({ x: 100, y: 200 })
    })

    it('should handle large offsets', () => {
      const position = calculateRelativePosition(referenceNode, { x: 1000, y: 2000 })
      expect(position).toEqual({ x: 1100, y: 2200 })
    })
  })
})
