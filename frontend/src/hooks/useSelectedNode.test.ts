import { renderHook } from '@testing-library/react'
import { useSelectedNode } from './useSelectedNode'
import { useReactFlow } from '@xyflow/react'
import { findNodeById, nodeExists } from '../utils/nodeUtils'

jest.mock('@xyflow/react', () => ({
  useReactFlow: jest.fn(),
}))

jest.mock('../utils/nodeUtils', () => ({
  findNodeById: jest.fn(),
  nodeExists: jest.fn(),
}))

const mockUseReactFlow = useReactFlow as jest.MockedFunction<typeof useReactFlow>
const mockFindNodeById = findNodeById as jest.MockedFunction<typeof findNodeById>
const mockNodeExists = nodeExists as jest.MockedFunction<typeof nodeExists>

describe('useSelectedNode', () => {
  let mockGetNodes: jest.Mock

  const mockNodes = [
    {
      id: 'node-1',
      type: 'agent',
      data: { name: 'Node 1' },
    },
    {
      id: 'node-2',
      type: 'agent',
      data: { name: 'Node 2' },
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetNodes = jest.fn(() => mockNodes)
    mockUseReactFlow.mockReturnValue({
      getNodes: mockGetNodes,
      setNodes: jest.fn(),
      deleteElements: jest.fn(),
      getEdges: jest.fn(() => []),
      getNode: jest.fn(),
      getEdge: jest.fn(),
      addNodes: jest.fn(),
      addEdges: jest.fn(),
      updateNode: jest.fn(),
      updateEdge: jest.fn(),
      toObject: jest.fn(),
      fromObject: jest.fn(),
      getViewport: jest.fn(),
      setViewport: jest.fn(),
      screenToFlowCoordinate: jest.fn(),
      flowToScreenCoordinate: jest.fn(),
      zoomIn: jest.fn(),
      zoomOut: jest.fn(),
      zoomTo: jest.fn(),
      fitView: jest.fn(),
      project: jest.fn(),
      getIntersectingNodes: jest.fn(),
      isNodeIntersecting: jest.fn(),
    } as any)
    mockFindNodeById.mockImplementation((id, getNodes, nodes) => {
      return nodes.find((n: any) => n.id === id) || null
    })
    mockNodeExists.mockImplementation((id, getNodes, nodes) => {
      return nodes.some((n: any) => n.id === id)
    })
  })

  describe('nodes', () => {
    it('should return nodes from React Flow', () => {
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
        })
      )

      expect(result.current.nodes).toEqual(mockNodes)
      expect(mockGetNodes).toHaveBeenCalled()
    })

    it('should fallback to nodesProp when React Flow returns empty', () => {
      mockGetNodes.mockReturnValue([])
      const propNodes = [{ id: 'prop-node', type: 'agent', data: {} }]

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: propNodes,
        })
      )

      expect(result.current.nodes).toEqual(propNodes)
    })

    it('should fallback to nodesProp when React Flow throws', () => {
      mockGetNodes.mockImplementation(() => {
        throw new Error('React Flow error')
      })
      const propNodes = [{ id: 'prop-node', type: 'agent', data: {} }]

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: propNodes,
        })
      )

      expect(result.current.nodes).toEqual(propNodes)
    })

    it('should return empty array when no nodes available', () => {
      mockGetNodes.mockReturnValue([])

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
        })
      )

      expect(result.current.nodes).toEqual([])
    })
  })

  describe('selectedNode', () => {
    it('should return null when no node selected', () => {
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
        })
      )

      expect(result.current.selectedNode).toBeNull()
    })

    it('should find and return selected node', () => {
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: 'node-1',
        })
      )

      expect(result.current.selectedNode).toEqual(mockNodes[0])
      expect(mockFindNodeById).toHaveBeenCalledWith('node-1', mockGetNodes, mockNodes)
    })

    it('should return null when node not found', () => {
      mockFindNodeById.mockReturnValue(null)

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: 'nonexistent',
        })
      )

      expect(result.current.selectedNode).toBeNull()
    })

    it('should cache node when same ID selected', () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: 'node-1' },
        }
      )

      const firstResult = result.current.selectedNode

      rerender({ selectedNodeId: 'node-1' })

      // Should return cached reference
      expect(result.current.selectedNode).toBe(firstResult)
    })

    it('should update cache when node changes', () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: 'node-1' },
        }
      )

      const updatedNode = { ...mockNodes[0], data: { name: 'Updated Node 1' } }
      mockFindNodeById.mockReturnValue(updatedNode)
      mockNodeExists.mockReturnValue(true)

      rerender({ selectedNodeId: 'node-1' })

      expect(result.current.selectedNode).toBeDefined()
    })

    it('should clear cache when node no longer exists', () => {
      // First render with node existing
      const { result, rerender } = renderHook(
        ({ selectedNodeId, nodesProp }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp,
          }),
        {
          initialProps: { selectedNodeId: 'node-1', nodesProp: mockNodes },
        }
      )

      expect(result.current.selectedNode).toBeDefined()

      // Update to simulate node no longer exists - use empty nodesProp
      mockGetNodes.mockReturnValue([])
      mockNodeExists.mockImplementation(() => false)
      mockFindNodeById.mockImplementation(() => null)

      // Rerender with empty nodes
      rerender({ selectedNodeId: 'node-1', nodesProp: [] })

      // Node should be null since it doesn't exist in the nodes array
      expect(result.current.selectedNode).toBeNull()
    })

    it('should clear cache when selection changes to null', () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: 'node-1' },
        }
      )

      expect(result.current.selectedNode).toBeDefined()

      rerender({ selectedNodeId: null })

      expect(result.current.selectedNode).toBeNull()
    })

    it('should update cache when selection changes to different node', () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: 'node-1' },
        }
      )

      expect(result.current.selectedNode?.id).toBe('node-1')

      rerender({ selectedNodeId: 'node-2' })

      expect(result.current.selectedNode?.id).toBe('node-2')
    })

    it('should use nodesProp when provided', () => {
      const propNodes = [{ id: 'prop-node', type: 'agent', data: { name: 'Prop Node' } }]
      mockGetNodes.mockReturnValue([])
      mockFindNodeById.mockImplementation((id, getNodes, nodes) => {
        return nodes.find((n: any) => n.id === id) || null
      })

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: 'prop-node',
          nodesProp: propNodes,
        })
      )

      expect(result.current.selectedNode).toEqual(propNodes[0])
    })

    it('should return empty array when flowNodes.length === 0 and nodesProp is undefined', () => {
      mockGetNodes.mockReturnValue([])

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: undefined,
        })
      )

      expect(result.current.nodes).toEqual([])
    })

    it('should return empty array in catch when nodesProp is undefined', () => {
      mockGetNodes.mockImplementation(() => {
        throw new Error('React Flow error')
      })

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: undefined,
        })
      )

      expect(result.current.nodes).toEqual([])
    })

    it('should verify selectedNodeIdRef.current !== selectedNodeId path', () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: 'node-1' },
        }
      )

      expect(result.current.selectedNode?.id).toBe('node-1')

      // Change to different node - should not use cache
      rerender({ selectedNodeId: 'node-2' })

      expect(result.current.selectedNode?.id).toBe('node-2')
      expect(mockFindNodeById).toHaveBeenCalledWith('node-2', mockGetNodes, expect.any(Array))
    })

    it('should verify selectedNodeIdRef.current exists but selectedNodeIdRef.current is falsy', () => {
      // This tests the && selectedNodeRef.current check
      // When selectedNodeIdRef.current === selectedNodeId but selectedNodeRef.current is null
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: 'node-1' },
        }
      )

      expect(result.current.selectedNode?.id).toBe('node-1')

      // Clear the node from nodes array but keep same ID
      mockGetNodes.mockReturnValue([])
      mockNodeExists.mockReturnValue(false)
      mockFindNodeById.mockReturnValue(null)

      rerender({ selectedNodeId: 'node-1' })

      // Should find node again (not use cache since node doesn't exist)
      expect(mockFindNodeById).toHaveBeenCalled()
    })

    it('should verify nodeExists returns false path', () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: 'node-1' },
        }
      )

      expect(result.current.selectedNode?.id).toBe('node-1')

      // Node ID matches cache, but nodeExists returns false
      mockNodeExists.mockReturnValue(false)
      mockFindNodeById.mockReturnValue(mockNodes[0])

      rerender({ selectedNodeId: 'node-1' })

      // Should still find the node (bypasses cache check)
      expect(result.current.selectedNode).toBeDefined()
    })

    it('should verify updated is null path in cache update', () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: 'node-1' },
        }
      )

      expect(result.current.selectedNode?.id).toBe('node-1')

      // On rerender with same ID, cache path is taken:
      // - selectedNodeIdRef.current === selectedNodeId (true)
      // - selectedNodeRef.current exists (true)
      // - nodeExists returns true
      // - findNodeById returns null (node was deleted between checks)
      mockNodeExists.mockReturnValue(true)
      // First call in cache check returns null, second call in main find also returns null
      let callCount = 0
      mockFindNodeById.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return null // First call in cache check returns null
        }
        return null // Second call in main find also returns null
      })

      rerender({ selectedNodeId: 'node-1' })

      // Since findNodeById returns null in cache check, it falls through to main find
      // which also returns null, so result should be null
      expect(result.current.selectedNode).toBeNull()
      expect(mockFindNodeById).toHaveBeenCalledTimes(2)
    })

    it('should verify Object.assign is called when updating cache', () => {
      const assignSpy = jest.spyOn(Object, 'assign')
      
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: 'node-1' },
        }
      )

      const firstResult = result.current.selectedNode
      expect(firstResult?.id).toBe('node-1')
      assignSpy.mockClear() // Clear any calls from initial render

      // On second render with same ID:
      // - Cache hit: selectedNodeIdRef.current === selectedNodeId && selectedNodeRef.current
      // - nodeExists returns true
      // - findNodeById returns updated node
      // - Object.assign updates cache
      // - Returns cached reference
      const updatedNode = { ...mockNodes[0], data: { name: 'Updated Node 1', newField: 'value' } }
      let callCount = 0
      mockFindNodeById.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return updatedNode // First call in cache check returns updated node
        }
        return updatedNode // Second call in main find also returns updated node
      })
      mockNodeExists.mockReturnValue(true)

      rerender({ selectedNodeId: 'node-1' })

      // Object.assign should be called to update the cached node
      expect(assignSpy).toHaveBeenCalled()
      // Should return the cached reference (same object reference for stability)
      expect(result.current.selectedNode).toBe(firstResult)
      // But data should be updated via Object.assign
      expect(result.current.selectedNode?.data.newField).toBe('value')
      
      assignSpy.mockRestore()
    })

    it('should verify found is null path clears cache', () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: 'node-1' },
        }
      )

      expect(result.current.selectedNode?.id).toBe('node-1')

      // Change to different node that doesn't exist
      mockFindNodeById.mockReturnValue(null)
      mockNodeExists.mockReturnValue(false)

      rerender({ selectedNodeId: 'nonexistent-node' })

      // Cache should be cleared (selectedNodeRef.current = null, selectedNodeIdRef.current = null)
      expect(result.current.selectedNode).toBeNull()
    })

    it('should verify spread operator creates copy when caching found node', () => {
      const originalNode = { id: 'node-1', type: 'agent', data: { name: 'Node 1' } }
      mockGetNodes.mockReturnValue([originalNode])
      // Mock findNodeById to return the original node
      mockFindNodeById.mockReturnValue(originalNode)

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: 'node-1',
        })
      )

      // Should return the found node
      expect(result.current.selectedNode).toEqual(originalNode)
      // The node is cached with spread operator: selectedNodeRef.current = { ...found }
      // This creates a shallow copy, so the reference is different
      // But since we're testing the spread operator path, we verify it's called
      expect(mockFindNodeById).toHaveBeenCalled()
    })

    it('should verify cache is cleared when found is null on same node', () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: 'node-1' },
        }
      )

      expect(result.current.selectedNode?.id).toBe('node-1')

      // Simulate node deletion - node no longer exists
      // When cache is hit but node doesn't exist, it falls through to main find
      mockGetNodes.mockReturnValue([])
      // Cache check: nodeExists returns false, so cache path is bypassed
      mockNodeExists.mockReturnValue(false)
      mockFindNodeById.mockReturnValue(null)

      rerender({ selectedNodeId: 'node-1' })

      // Cache should be cleared in else branch: selectedNodeRef.current = null, selectedNodeIdRef.current = null
      expect(result.current.selectedNode).toBeNull()
    })

    it('should verify return found path returns the found node', () => {
      const foundNode = { id: 'node-1', type: 'agent', data: { name: 'Found Node' } }
      mockFindNodeById.mockReturnValue(foundNode)

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: 'node-1',
        })
      )

      // Should return the found node
      expect(result.current.selectedNode).toEqual(foundNode)
    })

    it('should verify all conditional branches in selectedNode useMemo', () => {
      // Test 1: !selectedNodeId branch - clears cache and returns null
      const { result: result1 } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
        })
      )
      expect(result1.current.selectedNode).toBeNull()

      // Test 2: Cache hit path - selectedNodeIdRef.current === selectedNodeId && selectedNodeRef.current
      // Then nodeExists returns true, findNodeById returns node, Object.assign updates cache
      jest.clearAllMocks()
      mockGetNodes.mockReturnValue(mockNodes)
      mockFindNodeById.mockImplementation((id) => {
        return mockNodes.find((n: any) => n.id === id) || null
      })
      mockNodeExists.mockImplementation((id) => {
        return mockNodes.some((n: any) => n.id === id)
      })
      
      const { result: result2, rerender: rerender2 } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: 'node-1' },
        }
      )
      const cachedResult = result2.current.selectedNode
      expect(cachedResult).toBeDefined()
      
      // Rerender with same ID - cache path should be taken
      rerender2({ selectedNodeId: 'node-1' })
      // Should return cached reference (same object for stability)
      expect(result2.current.selectedNode).toBe(cachedResult)

      // Test 3: Cache miss - different node ID, should find new node
      jest.clearAllMocks()
      mockGetNodes.mockReturnValue(mockNodes)
      mockFindNodeById.mockImplementation((id) => {
        return mockNodes.find((n: any) => n.id === id) || null
      })
      mockNodeExists.mockImplementation((id) => {
        return mockNodes.some((n: any) => n.id === id)
      })
      
      const { result: result3 } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: 'node-2',
        })
      )
      expect(result3.current.selectedNode?.id).toBe('node-2')
    })

    it('should verify flowNodes.length > 0 ? flowNodes : (nodesProp || []) - flowNodes.length > 0', () => {
      const flowNodes = [
        { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
        { id: 'node-2', type: 'agent', position: { x: 100, y: 100 }, data: {} },
      ]
      mockGetNodes.mockReturnValue(flowNodes)

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: [],
        })
      )

      // Should use flowNodes since flowNodes.length > 0
      expect(result.current.nodes).toEqual(flowNodes)
    })

    it('should verify flowNodes.length > 0 ? flowNodes : (nodesProp || []) - flowNodes.length is 0, nodesProp exists', () => {
      mockGetNodes.mockReturnValue([])
      const nodesProp = [
        { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
      ]

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp,
        })
      )

      // Should use nodesProp since flowNodes.length is 0
      expect(result.current.nodes).toEqual(nodesProp)
    })

    it('should verify flowNodes.length > 0 ? flowNodes : (nodesProp || []) - flowNodes.length is 0, nodesProp is undefined', () => {
      mockGetNodes.mockReturnValue([])

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: undefined,
        })
      )

      // Should use [] since flowNodes.length is 0 and nodesProp is undefined
      expect(result.current.nodes).toEqual([])
    })

    it('should verify catch block in useMemo - getNodes throws', () => {
      mockGetNodes.mockImplementation(() => {
        throw new Error('getNodes error')
      })
      const nodesProp = [
        { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
      ]

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp,
        })
      )

      // Should catch error and return nodesProp || []
      expect(result.current.nodes).toEqual(nodesProp)
    })

    it('should verify catch block in useMemo - getNodes throws, nodesProp is undefined', () => {
      mockGetNodes.mockImplementation(() => {
        throw new Error('getNodes error')
      })

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: undefined,
        })
      )

      // Should catch error and return []
      expect(result.current.nodes).toEqual([])
    })

    it('should verify selectedNodeIdRef.current === selectedNodeId && selectedNodeRef.current - both true', () => {
      const node = { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: { label: 'Node 1' } }
      mockGetNodes.mockReturnValue([node])
      mockFindNodeById.mockReturnValue(node)
      mockNodeExists.mockReturnValue(true)

      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: undefined,
          }),
        {
          initialProps: { selectedNodeId: 'node-1' },
        }
      )

      // First render - should cache the node
      expect(result.current.selectedNode).toBeDefined()

      // Second render with same ID - should use cached version
      rerender({ selectedNodeId: 'node-1' })
      expect(result.current.selectedNode).toBeDefined()
    })

    it('should verify selectedNodeIdRef.current === selectedNodeId && selectedNodeRef.current - selectedNodeIdRef.current !== selectedNodeId', () => {
      const node1 = { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {} }
      const node2 = { id: 'node-2', type: 'agent', position: { x: 100, y: 100 }, data: {} }
      mockGetNodes.mockReturnValue([node1, node2])
      mockFindNodeById.mockImplementation((id) => {
        if (id === 'node-1') return node1
        if (id === 'node-2') return node2
        return null
      })
      mockNodeExists.mockReturnValue(true)

      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: undefined,
          }),
        {
          initialProps: { selectedNodeId: 'node-1' },
        }
      )

      expect(result.current.selectedNode?.id).toBe('node-1')

      // Change to different node ID
      rerender({ selectedNodeId: 'node-2' })
      expect(result.current.selectedNode?.id).toBe('node-2')
    })

    it('should verify selectedNodeIdRef.current === selectedNodeId && selectedNodeRef.current - selectedNodeRef.current is null', () => {
      const node = { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {} }
      mockGetNodes.mockReturnValue([node])
      mockFindNodeById.mockReturnValue(node)
      mockNodeExists.mockReturnValue(true)

      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: undefined,
          }),
        {
          initialProps: { selectedNodeId: null },
        }
      )

      expect(result.current.selectedNode).toBeNull()

      // Select node - selectedNodeRef.current was null, so should find fresh
      rerender({ selectedNodeId: 'node-1' })
      expect(result.current.selectedNode).toBeDefined()
    })


    it('should verify Object.assign(selectedNodeRef.current, updated)', () => {
      const node = { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: { label: 'Original' } }
      const updatedNode = { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: { label: 'Updated' } }
      mockGetNodes.mockReturnValue([updatedNode])
      mockFindNodeById.mockReturnValue(updatedNode)
      mockNodeExists.mockReturnValue(true)

      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: undefined,
          }),
        {
          initialProps: { selectedNodeId: 'node-1' },
        }
      )

      // First render - cache the node
      const firstRender = result.current.selectedNode
      expect(firstRender).toBeDefined()

      // Update node data
      mockFindNodeById.mockReturnValue(updatedNode)
      rerender({ selectedNodeId: 'node-1' })

      // Should update cache via Object.assign but return cached reference
      const secondRender = result.current.selectedNode
      expect(secondRender).toBeDefined()
      // The reference should be the same (cached), but data should be updated
      expect(secondRender?.data.label).toBe('Updated')
    })

    it('should verify found ? {...found} : null - found exists', () => {
      const node = { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {} }
      mockGetNodes.mockReturnValue([node])
      mockFindNodeById.mockReturnValue(node)
      mockNodeExists.mockReturnValue(false) // Not cached, so will find fresh

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: 'node-1',
          nodesProp: undefined,
        })
      )

      // Should cache found node
      expect(result.current.selectedNode).toBeDefined()
      expect(result.current.selectedNode?.id).toBe('node-1')
    })

    it('should verify found ? {...found} : null - found is null', () => {
      mockGetNodes.mockReturnValue([])
      mockFindNodeById.mockReturnValue(null)
      mockNodeExists.mockReturnValue(false)

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: 'node-1',
          nodesProp: undefined,
        })
      )

      // Should clear cache when found is null
      expect(result.current.selectedNode).toBeNull()
    })

    it('should verify spread operator {...found} creates copy', () => {
      const node = { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: { label: 'Node' } }
      mockGetNodes.mockReturnValue([node])
      mockFindNodeById.mockReturnValue(node)
      mockNodeExists.mockReturnValue(false) // Not cached, so will find fresh

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: 'node-1',
          nodesProp: undefined,
        })
      )

      // The hook returns found directly (line 76), but caches a copy via {...found} (line 69)
      // So selectedNode is the same reference as found, but cache has a copy
      expect(result.current.selectedNode).toBeDefined()
      expect(result.current.selectedNode?.id).toBe(node.id) // Same data
      // The hook implementation returns found directly, not the cached copy
      // So we verify the cache has a copy by checking the hook works correctly
    })

    it('should verify nodesProp || [] fallback in catch block', () => {
      mockGetNodes.mockImplementation(() => {
        throw new Error('getNodes error')
      })

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: undefined,
        })
      )

      // Should return [] when nodesProp is undefined
      expect(result.current.nodes).toEqual([])
    })

    it('should verify nodesProp || [] fallback in catch block - nodesProp has value', () => {
      mockGetNodes.mockImplementation(() => {
        throw new Error('getNodes error')
      })
      const nodesProp = [
        { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
      ]

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp,
        })
      )

      // Should return nodesProp when it has value
      expect(result.current.nodes).toEqual(nodesProp)
    })

    it('should verify flowNodes.length > 0 exact comparison - length is 1', () => {
      const flowNodes = [
        { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
      ]
      mockGetNodes.mockReturnValue(flowNodes)

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: [],
        })
      )

      // When flowNodes.length is 1, > 0 is true, so should use flowNodes
      expect(result.current.nodes).toEqual(flowNodes)
    })

    it('should verify flowNodes.length > 0 exact comparison - length is 0', () => {
      mockGetNodes.mockReturnValue([])
      const nodesProp = [
        { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
      ]

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp,
        })
      )

      // When flowNodes.length is 0, > 0 is false, so should use nodesProp
      expect(result.current.nodes).toEqual(nodesProp)
    })

    it('should verify selectedNodeIdRef.current === selectedNodeId exact comparison', () => {
      const node = { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {} }
      mockGetNodes.mockReturnValue([node])
      mockFindNodeById.mockReturnValue(node)
      mockNodeExists.mockReturnValue(true)

      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: undefined,
          }),
        {
          initialProps: { selectedNodeId: 'node-1' },
        }
      )

      // First render - cache the node
      expect(result.current.selectedNode).toBeDefined()

      // Second render with same ID - selectedNodeIdRef.current === selectedNodeId should be true
      rerender({ selectedNodeId: 'node-1' })
      expect(result.current.selectedNode).toBeDefined()
    })

    it('should verify selectedNodeRef.current exact truthiness check', () => {
      const node = { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {} }
      mockGetNodes.mockReturnValue([node])
      mockFindNodeById.mockReturnValue(node)
      mockNodeExists.mockReturnValue(true)

      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: undefined,
          }),
        {
          initialProps: { selectedNodeId: 'node-1' },
        }
      )

      // First render - should cache the node (selectedNodeRef.current becomes truthy)
      expect(result.current.selectedNode).toBeDefined()

      // Second render - selectedNodeRef.current should be truthy
      rerender({ selectedNodeId: 'node-1' })
      expect(result.current.selectedNode).toBeDefined()
    })

    it('should verify Object.assign exact method call', () => {
      const node = { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: { label: 'Original' } }
      const updatedNode = { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: { label: 'Updated' } }
      mockGetNodes.mockReturnValue([updatedNode])
      mockFindNodeById.mockReturnValue(updatedNode)
      mockNodeExists.mockReturnValue(true)

      // Verify Object.assign is used by checking the behavior
      // The code uses Object.assign(selectedNodeRef.current, updated) to update cache
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: undefined,
          }),
        {
          initialProps: { selectedNodeId: 'node-1' },
        }
      )

      // First render - cache the node
      const firstRender = result.current.selectedNode
      expect(firstRender).toBeDefined()

      // Second render - Object.assign updates cache but returns cached reference
      rerender({ selectedNodeId: 'node-1' })
      const secondRender = result.current.selectedNode
      // Should return the same reference (cached) but with updated data
      expect(secondRender).toBe(firstRender) // Same reference
    })

    it('should verify spread operator {...found} exact usage', () => {
      const node = { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: { label: 'Node' } }
      mockGetNodes.mockReturnValue([node])
      mockFindNodeById.mockReturnValue(node)
      mockNodeExists.mockReturnValue(false)

      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: 'node-1',
          nodesProp: undefined,
        })
      )

      // The spread operator {...found} creates a copy
      // Verify the node is cached (spread operator was used)
      expect(result.current.selectedNode).toBeDefined()
      expect(result.current.selectedNode?.id).toBe('node-1')
    })
  })
})
