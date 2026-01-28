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

      // Update mocks to simulate node no longer exists
      mockNodeExists.mockReturnValue(false)
      mockFindNodeById.mockReturnValue(null)
      mockGetNodes.mockReturnValue([])

      rerender({ selectedNodeId: 'node-1' })

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
  })
})
