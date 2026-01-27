/**
 * Tests for node utilities
 */

import {
  findNodeById,
  nodeExists,
  findNodesByIds,
  getSelectedNodes,
} from './nodeUtils'
import type { Node } from '@xyflow/react'

describe('nodeUtils', () => {
  const mockNodes: Node[] = [
    {
      id: 'node1',
      type: 'agent',
      position: { x: 0, y: 0 },
      data: { name: 'Node 1' },
    },
    {
      id: 'node2',
      type: 'condition',
      position: { x: 100, y: 100 },
      data: { name: 'Node 2' },
      selected: true,
    },
    {
      id: 'node3',
      type: 'loop',
      position: { x: 200, y: 200 },
      data: { name: 'Node 3' },
      selected: true,
    },
  ]

  describe('findNodeById', () => {
    it('should find a node by ID from React Flow', () => {
      const getNodes = jest.fn(() => mockNodes)
      const result = findNodeById('node1', getNodes)

      expect(result).toEqual(mockNodes[0])
      expect(getNodes).toHaveBeenCalled()
    })

    it('should return null if node not found', () => {
      const getNodes = jest.fn(() => mockNodes)
      const result = findNodeById('nonexistent', getNodes)

      expect(result).toBeNull()
    })

    it('should fallback to fallbackNodes if getNodes throws', () => {
      const getNodes = jest.fn(() => {
        throw new Error('React Flow not available')
      })
      const result = findNodeById('node2', getNodes, mockNodes)

      expect(result).toEqual(mockNodes[1])
    })

    it('should return null if node not found in fallback', () => {
      const getNodes = jest.fn(() => {
        throw new Error('React Flow not available')
      })
      const result = findNodeById('nonexistent', getNodes, mockNodes)

      expect(result).toBeNull()
    })

    it('should return null if no fallbackNodes provided and getNodes throws', () => {
      const getNodes = jest.fn(() => {
        throw new Error('React Flow not available')
      })
      const result = findNodeById('node1', getNodes)

      expect(result).toBeNull()
    })
  })

  describe('nodeExists', () => {
    it('should return true if node exists', () => {
      const getNodes = jest.fn(() => mockNodes)
      const result = nodeExists('node1', getNodes)

      expect(result).toBe(true)
    })

    it('should return false if node does not exist', () => {
      const getNodes = jest.fn(() => mockNodes)
      const result = nodeExists('nonexistent', getNodes)

      expect(result).toBe(false)
    })

    it('should fallback to fallbackNodes if getNodes throws', () => {
      const getNodes = jest.fn(() => {
        throw new Error('React Flow not available')
      })
      const result = nodeExists('node2', getNodes, mockNodes)

      expect(result).toBe(true)
    })
  })

  describe('findNodesByIds', () => {
    it('should find multiple nodes by IDs', () => {
      const getNodes = jest.fn(() => mockNodes)
      const result = findNodesByIds(['node1', 'node3'], getNodes)

      expect(result).toHaveLength(2)
      expect(result).toContainEqual(mockNodes[0])
      expect(result).toContainEqual(mockNodes[2])
    })

    it('should return empty array if no nodes found', () => {
      const getNodes = jest.fn(() => mockNodes)
      const result = findNodesByIds(['nonexistent1', 'nonexistent2'], getNodes)

      expect(result).toEqual([])
    })

    it('should fallback to fallbackNodes if getNodes throws', () => {
      const getNodes = jest.fn(() => {
        throw new Error('React Flow not available')
      })
      const result = findNodesByIds(['node1', 'node2'], getNodes, mockNodes)

      expect(result).toHaveLength(2)
      expect(result).toContainEqual(mockNodes[0])
      expect(result).toContainEqual(mockNodes[1])
    })

    it('should return empty array if no fallbackNodes provided and getNodes throws', () => {
      const getNodes = jest.fn(() => {
        throw new Error('React Flow not available')
      })
      const result = findNodesByIds(['node1'], getNodes)

      expect(result).toEqual([])
    })
  })

  describe('getSelectedNodes', () => {
    it('should return all selected nodes', () => {
      const getNodes = jest.fn(() => mockNodes)
      const result = getSelectedNodes(getNodes)

      expect(result).toHaveLength(2)
      expect(result).toContainEqual(mockNodes[1])
      expect(result).toContainEqual(mockNodes[2])
    })

    it('should return empty array if no nodes selected', () => {
      const unselectedNodes = mockNodes.map(n => ({ ...n, selected: false }))
      const getNodes = jest.fn(() => unselectedNodes)
      const result = getSelectedNodes(getNodes)

      expect(result).toEqual([])
    })

    it('should fallback to fallbackNodes if getNodes throws', () => {
      const getNodes = jest.fn(() => {
        throw new Error('React Flow not available')
      })
      const result = getSelectedNodes(getNodes, mockNodes)

      expect(result).toHaveLength(2)
      expect(result).toContainEqual(mockNodes[1])
      expect(result).toContainEqual(mockNodes[2])
    })
  })
})
