/**
 * Tests for useWorkflowUpdates hook
 */

import { renderHook, act, waitFor } from '@testing-library/react'

// Helper to ensure all waitFor calls have timeouts
// When using fake timers, we need to advance timers and use real timers for waitFor
const waitForWithTimeout = async (callback: () => void | Promise<void>, timeout = 2000) => {
  // Check if fake timers are currently active by checking if setTimeout is mocked
  // Note: This is a heuristic - if jest.getRealSystemTime exists, we're using fake timers
  const wasUsingFakeTimers = typeof jest.getRealSystemTime === 'function'
  
  if (wasUsingFakeTimers) {
    // Temporarily use real timers for waitFor, then restore fake timers
    jest.useRealTimers()
    try {
      return await waitFor(callback, { timeout })
    } finally {
      jest.useFakeTimers()
    }
  } else {
    // Not using fake timers, just use waitFor normally
    return await waitFor(callback, { timeout })
  }
}

import { useWorkflowUpdates } from './useWorkflowUpdates'
import { logger } from '../utils/logger'
import { addEdge } from '@xyflow/react'
import type { Node, Edge } from '@xyflow/react'

jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
  },
}))

jest.mock('../utils/workflowFormat', () => ({
  initializeReactFlowNodes: jest.fn((nodes: Node[]) => nodes),
  workflowNodeToReactFlowNode: jest.fn((node: any, nodeExecutionStates?: Record<string, { status: string; error?: string }>) => {
    const nodeExecutionState = nodeExecutionStates?.[node.id]
    return {
      id: node.id,
      type: node.type,
      position: node.position || { x: 0, y: 0 },
      draggable: true,
      selected: false,
      data: {
        ...(node.data || {}),
        name: node.data?.name || node.name || node.type,
        label: node.data?.label || node.data?.name || node.name || node.type,
        executionStatus: nodeExecutionState?.status,
        executionError: nodeExecutionState?.error,
      },
    }
  }),
}))

jest.mock('@xyflow/react', () => {
  const actual = jest.requireActual('@xyflow/react')
  return {
    ...actual,
    addEdge: jest.fn((connection: any, edges: Edge[]) => [
      ...edges,
      {
        id: `${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      },
    ]),
  }
})

const mockLoggerDebug = logger.debug as jest.MockedFunction<typeof logger.debug>
const mockLoggerWarn = logger.warn as jest.MockedFunction<typeof logger.warn>
const mockAddEdge = addEdge as jest.MockedFunction<typeof addEdge>

describe('useWorkflowUpdates', () => {
  let mockSetNodes: jest.Mock
  let mockSetEdges: jest.Mock
  let mockNotifyModified: jest.Mock

  const initialNodes: Node[] = [
    {
      id: 'node1',
      type: 'agent',
      position: { x: 0, y: 0 },
      data: { name: 'Node 1' },
    },
  ]

  const initialEdges: Edge[] = [
    {
      id: 'e1',
      source: 'node1',
      target: 'node2',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    mockSetNodes = jest.fn((updater: any) => {
      if (typeof updater === 'function') {
        return updater(initialNodes)
      }
      return updater
    })
    mockSetEdges = jest.fn((updater: any) => {
      if (typeof updater === 'function') {
        return updater(initialEdges)
      }
      return updater
    })
    mockNotifyModified = jest.fn()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('applyLocalChanges', () => {
    it('should add nodes', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          nodes_to_add: [
            {
              id: 'node3',
              type: 'agent',
              position: { x: 100, y: 100 },
            },
          ],
        })
      })

      expect(mockSetNodes).toHaveBeenCalled()
      expect(mockNotifyModified).toHaveBeenCalled()
    })

    it('should update nodes', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [
            {
              node_id: 'node1',
              updates: { name: 'Updated Node 1' },
            },
          ],
        })
      })

      expect(mockSetNodes).toHaveBeenCalled()
      expect(mockNotifyModified).toHaveBeenCalled()
    })

    it('should delete nodes', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ['node1'],
        })
      })

      expect(mockSetNodes).toHaveBeenCalled()
      expect(mockSetEdges).toHaveBeenCalled() // Should also remove connected edges
      expect(mockNotifyModified).toHaveBeenCalled()
    })

    it('should add edges', async () => {
      const nodesWithTarget = [
        ...initialNodes,
        {
          id: 'node2',
          type: 'agent',
          position: { x: 100, y: 100 },
          data: { name: 'Node 2' },
        },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithTarget,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            {
              source: 'node1',
              target: 'node2',
            },
          ],
        })
        jest.advanceTimersByTime(50)
      })

      await waitForWithTimeout(() => {
        expect(mockSetEdges).toHaveBeenCalled()
        expect(mockNotifyModified).toHaveBeenCalled()
      })
    })

    it('should not add edge if source node does not exist', async () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            {
              source: 'nonexistent',
              target: 'node2',
            },
          ],
        })
        jest.advanceTimersByTime(50)
      })

      await waitForWithTimeout(() => {
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining('source node'),
          expect.any(Array)
        )
      })
    })

    it('should not add edge if target node does not exist', async () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            {
              source: 'node1',
              target: 'nonexistent',
            },
          ],
        })
        jest.advanceTimersByTime(50)
      })

      await waitForWithTimeout(() => {
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining('target node'),
          expect.any(Array)
        )
      })
    })

    it('should not add duplicate edges', async () => {
      const nodesWithTarget = [
        ...initialNodes,
        {
          id: 'node2',
          type: 'agent',
          position: { x: 100, y: 100 },
          data: { name: 'Node 2' },
        },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithTarget,
          edges: initialEdges, // Already has edge from node1 to node2
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            {
              source: 'node1',
              target: 'node2', // Already exists
            },
          ],
        })
        jest.advanceTimersByTime(50)
      })

      await waitForWithTimeout(() => {
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining('already exists')
        )
      })
    })

    it('should delete edges', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [
            {
              source: 'node1',
              target: 'node2',
            },
          ],
        })
      })

      expect(mockSetEdges).toHaveBeenCalled()
      expect(mockNotifyModified).toHaveBeenCalled()
    })

    it('should handle empty changes', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({})
      })

      expect(mockSetNodes).not.toHaveBeenCalled()
      expect(mockSetEdges).not.toHaveBeenCalled()
      expect(mockNotifyModified).not.toHaveBeenCalled()
    })

    it('should handle multiple change types', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          nodes_to_add: [
            {
              id: 'node3',
              type: 'agent',
              position: { x: 0, y: 0 },
            },
          ],
          nodes_to_update: [
            {
              node_id: 'node1',
              updates: { name: 'Updated' },
            },
          ],
        })
      })

      expect(mockSetNodes).toHaveBeenCalledTimes(2) // Once for add, once for update
      expect(mockNotifyModified).toHaveBeenCalledTimes(2)
    })
  })

  describe('workflowNodeToNode', () => {
    it('should convert WorkflowNode to React Flow Node', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      const wfNode = {
        id: 'node1',
        type: 'agent',
        position: { x: 100, y: 200 },
      }

      const converted = result.current.workflowNodeToNode(wfNode)

      expect(converted.id).toBe('node1')
      expect(converted.type).toBe('agent')
    })

    it('should handle empty arrays for nodes_to_add', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          nodes_to_add: [],
        })
      })

      expect(mockSetNodes).not.toHaveBeenCalled()
      expect(mockNotifyModified).not.toHaveBeenCalled()
    })

    it('should handle empty arrays for nodes_to_update', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [],
        })
      })

      expect(mockSetNodes).not.toHaveBeenCalled()
      expect(mockNotifyModified).not.toHaveBeenCalled()
    })

    it('should handle empty arrays for nodes_to_delete', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: [],
        })
      })

      expect(mockSetNodes).not.toHaveBeenCalled()
      expect(mockNotifyModified).not.toHaveBeenCalled()
    })

    it('should handle empty arrays for edges_to_add', async () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [],
        })
        jest.advanceTimersByTime(50)
      })

      await waitForWithTimeout(() => {
        expect(mockSetEdges).not.toHaveBeenCalled()
        expect(mockNotifyModified).not.toHaveBeenCalled()
      })
    })

    it('should handle empty arrays for edges_to_delete', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [],
        })
      })

      expect(mockSetEdges).not.toHaveBeenCalled()
      expect(mockNotifyModified).not.toHaveBeenCalled()
    })

    it('should handle node update when node does not exist', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [
            {
              node_id: 'nonexistent',
              updates: { name: 'Updated' },
            },
          ],
        })
      })

      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
      expect(updatedNodes.find((n: Node) => n.id === 'nonexistent')).toBeUndefined()
    })

    it('should handle edge deletion with sourceHandle and targetHandle', () => {
      const edgesWithHandles = [
        {
          id: 'e1',
          source: 'node1',
          target: 'node2',
          sourceHandle: 'output-1',
          targetHandle: 'input-1',
        },
      ]

      const mockSetEdgesWithHandles = jest.fn((updater: any) => {
        if (typeof updater === 'function') {
          return updater(edgesWithHandles)
        }
        return updater
      })

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: edgesWithHandles,
          setNodes: mockSetNodes,
          setEdges: mockSetEdgesWithHandles,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [
            {
              source: 'node1',
              target: 'node2',
              sourceHandle: 'output-1',
              targetHandle: 'input-1',
            },
          ],
        })
      })

      expect(mockSetEdgesWithHandles).toHaveBeenCalled()
    })

    it('should handle edge deletion without sourceHandle and targetHandle', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [
            {
              source: 'node1',
              target: 'node2',
            },
          ],
        })
      })

      expect(mockSetEdges).toHaveBeenCalled()
    })

    it('should handle edge deletion with multiple edges', () => {
      const multipleEdges = [
        { id: 'e1', source: 'node1', target: 'node2' },
        { id: 'e2', source: 'node2', target: 'node3' },
        { id: 'e3', source: 'node1', target: 'node3' },
      ]

      const mockSetEdgesMultiple = jest.fn((updater: any) => {
        if (typeof updater === 'function') {
          return updater(multipleEdges)
        }
        return updater
      })

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: multipleEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdgesMultiple,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [
            { source: 'node1', target: 'node2' },
            { source: 'node2', target: 'node3' },
          ],
        })
      })

      expect(mockSetEdgesMultiple).toHaveBeenCalled()
      const setEdgesCall = mockSetEdgesMultiple.mock.calls[0][0]
      const filteredEdges = typeof setEdgesCall === 'function' ? setEdgesCall(multipleEdges) : setEdgesCall
      expect(filteredEdges.length).toBe(1)
      expect(filteredEdges[0].source).toBe('node1')
      expect(filteredEdges[0].target).toBe('node3')
    })

    it('should handle edge addition with sourceHandle and targetHandle', async () => {
      const nodesWithTarget = [
        ...initialNodes,
        {
          id: 'node2',
          type: 'agent',
          position: { x: 100, y: 100 },
          data: { name: 'Node 2' },
        },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithTarget,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            {
              source: 'node1',
              target: 'node2',
              sourceHandle: 'output-1',
              targetHandle: 'input-1',
            },
          ],
        })
        jest.advanceTimersByTime(50)
      })

      await waitForWithTimeout(() => {
        expect(mockSetEdges).toHaveBeenCalled()
        expect(mockNotifyModified).toHaveBeenCalled()
      })
    })

    it('should handle edge addition when edge already exists', async () => {
      const nodesWithTarget = [
        ...initialNodes,
        {
          id: 'node2',
          type: 'agent',
          position: { x: 100, y: 100 },
          data: { name: 'Node 2' },
        },
      ]

      const existingEdges = [
        { id: 'e1', source: 'node1', target: 'node2' },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithTarget,
          edges: existingEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            {
              source: 'node1',
              target: 'node2',
            },
          ],
        })
        jest.advanceTimersByTime(50)
      })

      await waitForWithTimeout(() => {
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining('already exists')
        )
      })
    })

    it('should handle node update with multiple fields', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [
            {
              node_id: 'node1',
              updates: { name: 'Updated Name', description: 'Updated Description' },
            },
          ],
        })
      })

      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
      const updatedNode = updatedNodes.find((n: Node) => n.id === 'node1')
      expect(updatedNode.data.name).toBe('Updated Name')
      expect(updatedNode.data.description).toBe('Updated Description')
    })

    it('should handle node deletion with multiple nodes', () => {
      const multipleNodes = [
        ...initialNodes,
        {
          id: 'node2',
          type: 'agent',
          position: { x: 100, y: 100 },
          data: { name: 'Node 2' },
        },
        {
          id: 'node3',
          type: 'agent',
          position: { x: 200, y: 200 },
          data: { name: 'Node 3' },
        },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: multipleNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ['node1', 'node2'],
        })
      })

      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const filteredNodes = typeof setNodesCall === 'function' ? setNodesCall(multipleNodes) : setNodesCall
      expect(filteredNodes.length).toBe(1)
      expect(filteredNodes[0].id).toBe('node3')
    })

    it('should handle node deletion and remove connected edges', () => {
      const edgesConnected = [
        { id: 'e1', source: 'node1', target: 'node2' },
        { id: 'e2', source: 'node2', target: 'node3' },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: edgesConnected,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ['node1'],
        })
      })

      expect(mockSetEdges).toHaveBeenCalled()
      const setEdgesCall = mockSetEdges.mock.calls[0][0]
      const filteredEdges = typeof setEdgesCall === 'function' ? setEdgesCall(edgesConnected) : setEdgesCall
      // Edge e1 should be removed (source is node1)
      expect(filteredEdges.every((e: Edge) => e.source !== 'node1')).toBe(true)
    })

    it('should include execution state if provided', () => {
      const nodeExecutionStates = {
        node1: { status: 'running', error: undefined },
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
          nodeExecutionStates,
        })
      )

      const wfNode = {
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
      }

      const converted = result.current.workflowNodeToNode(wfNode)

      expect(converted.data.executionStatus).toBe('running')
    })
  })
})
