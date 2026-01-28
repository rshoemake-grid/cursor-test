import { renderHook, act } from '@testing-library/react'
import { useLoopConfig } from './useLoopConfig'
import { useReactFlow } from '@xyflow/react'

jest.mock('@xyflow/react', () => ({
  useReactFlow: jest.fn(),
}))

const mockUseReactFlow = useReactFlow as jest.MockedFunction<typeof useReactFlow>

describe('useLoopConfig', () => {
  let mockSetNodes: jest.Mock

  const mockSelectedNode = {
    id: 'loop-1',
    type: 'loop',
    data: {},
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSetNodes = jest.fn()
    mockUseReactFlow.mockReturnValue({
      setNodes: mockSetNodes,
      getNodes: jest.fn(() => [mockSelectedNode]),
      getEdges: jest.fn(() => []),
      getNode: jest.fn(),
      getEdge: jest.fn(),
      addNodes: jest.fn(),
      addEdges: jest.fn(),
      updateNode: jest.fn(),
      updateEdge: jest.fn(),
      deleteElements: jest.fn(),
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
  })

  it('should initialize loop_config when node has no config', () => {
    renderHook(() =>
      useLoopConfig({
        selectedNode: mockSelectedNode,
      })
    )

    expect(mockSetNodes).toHaveBeenCalled()
    const setNodesCall = mockSetNodes.mock.calls[0][0]
    const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall([mockSelectedNode]) : setNodesCall
    const updatedNode = updatedNodes.find((n: any) => n.id === 'loop-1')
    expect(updatedNode.data.loop_config).toEqual({
      loop_type: 'for_each',
      max_iterations: 0,
    })
  })

  it('should initialize loop_config when config is empty object', () => {
    const nodeWithEmptyConfig = {
      ...mockSelectedNode,
      data: {
        loop_config: {},
      },
    }

    renderHook(() =>
      useLoopConfig({
        selectedNode: nodeWithEmptyConfig,
      })
    )

    expect(mockSetNodes).toHaveBeenCalled()
    const setNodesCall = mockSetNodes.mock.calls[0][0]
    const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall([nodeWithEmptyConfig]) : setNodesCall
    const updatedNode = updatedNodes.find((n: any) => n.id === 'loop-1')
    expect(updatedNode.data.loop_config).toEqual({
      loop_type: 'for_each',
      max_iterations: 0,
    })
  })

  it('should not initialize when node is not a loop type', () => {
    const nonLoopNode = {
      ...mockSelectedNode,
      type: 'agent',
    }

    renderHook(() =>
      useLoopConfig({
        selectedNode: nonLoopNode,
      })
    )

    expect(mockSetNodes).not.toHaveBeenCalled()
  })

  it('should not initialize when selectedNode is null', () => {
    renderHook(() =>
      useLoopConfig({
        selectedNode: null,
      })
    )

    expect(mockSetNodes).not.toHaveBeenCalled()
  })

  it('should not initialize when loop_config already exists', () => {
    const nodeWithConfig = {
      ...mockSelectedNode,
      data: {
        loop_config: {
          loop_type: 'while',
          max_iterations: 10,
        },
      },
    }

    renderHook(() =>
      useLoopConfig({
        selectedNode: nodeWithConfig,
      })
    )

    expect(mockSetNodes).not.toHaveBeenCalled()
  })

  it('should not initialize when loop_config has properties', () => {
    const nodeWithPartialConfig = {
      ...mockSelectedNode,
      data: {
        loop_config: {
          loop_type: 'for_each',
        },
      },
    }

    renderHook(() =>
      useLoopConfig({
        selectedNode: nodeWithPartialConfig,
      })
    )

    expect(mockSetNodes).not.toHaveBeenCalled()
  })

  it('should update only the selected node', () => {
    const otherNode = {
      id: 'other-1',
      type: 'agent',
      data: {},
    }

    renderHook(() =>
      useLoopConfig({
        selectedNode: mockSelectedNode,
      })
    )

    const setNodesCall = mockSetNodes.mock.calls[0][0]
    const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall([mockSelectedNode, otherNode]) : setNodesCall
    const otherNodeUpdated = updatedNodes.find((n: any) => n.id === 'other-1')
    expect(otherNodeUpdated.data.loop_config).toBeUndefined()
  })

  it('should preserve other node data when initializing loop_config', () => {
    const nodeWithOtherData = {
      ...mockSelectedNode,
      data: {
        name: 'Test Loop',
        description: 'Test Description',
      },
    }

    renderHook(() =>
      useLoopConfig({
        selectedNode: nodeWithOtherData,
      })
    )

    const setNodesCall = mockSetNodes.mock.calls[0][0]
    const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall([nodeWithOtherData]) : setNodesCall
    const updatedNode = updatedNodes.find((n: any) => n.id === 'loop-1')
    expect(updatedNode.data.name).toBe('Test Loop')
    expect(updatedNode.data.description).toBe('Test Description')
    expect(updatedNode.data.loop_config).toEqual({
      loop_type: 'for_each',
      max_iterations: 0,
    })
  })
})
