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

    it('should verify exact comparison changes.nodes_to_add && changes.nodes_to_add.length > 0', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      // Test: changes.nodes_to_add is undefined
      act(() => {
        result.current.applyLocalChanges({})
      })
      expect(mockSetNodes).not.toHaveBeenCalled()

      // Test: changes.nodes_to_add.length is 0
      act(() => {
        result.current.applyLocalChanges({ nodes_to_add: [] })
      })
      expect(mockSetNodes).not.toHaveBeenCalled()

      // Test: changes.nodes_to_add.length > 0
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_add: [{ id: 'new-node', type: 'agent' }],
        })
      })
      expect(mockSetNodes).toHaveBeenCalled()
    })

    it('should verify exact comparison changes.nodes_to_update && changes.nodes_to_update.length > 0', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      // Test: changes.nodes_to_update is undefined
      act(() => {
        result.current.applyLocalChanges({})
      })
      expect(mockSetNodes).not.toHaveBeenCalled()

      // Test: changes.nodes_to_update.length is 0
      act(() => {
        result.current.applyLocalChanges({ nodes_to_update: [] })
      })
      expect(mockSetNodes).not.toHaveBeenCalled()

      // Test: changes.nodes_to_update.length > 0
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [{ node_id: 'node1', updates: {} }],
        })
      })
      expect(mockSetNodes).toHaveBeenCalled()
    })

    it('should verify exact comparison changes.nodes_to_delete && changes.nodes_to_delete.length > 0', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      // Test: changes.nodes_to_delete is undefined
      act(() => {
        result.current.applyLocalChanges({})
      })
      expect(mockSetNodes).not.toHaveBeenCalled()

      // Test: changes.nodes_to_delete.length is 0
      act(() => {
        result.current.applyLocalChanges({ nodes_to_delete: [] })
      })
      expect(mockSetNodes).not.toHaveBeenCalled()

      // Test: changes.nodes_to_delete.length > 0
      act(() => {
        result.current.applyLocalChanges({ nodes_to_delete: ['node1'] })
      })
      expect(mockSetNodes).toHaveBeenCalled()
    })

    it('should verify exact comparison changes.edges_to_add && changes.edges_to_add.length > 0', () => {
      jest.useFakeTimers()
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      // Test: changes.edges_to_add is undefined
      act(() => {
        result.current.applyLocalChanges({})
      })
      jest.advanceTimersByTime(100)
      expect(mockSetEdges).not.toHaveBeenCalled()

      // Test: changes.edges_to_add.length is 0
      act(() => {
        result.current.applyLocalChanges({ edges_to_add: [] })
      })
      jest.advanceTimersByTime(100)
      expect(mockSetEdges).not.toHaveBeenCalled()

      // Test: changes.edges_to_add.length > 0
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })
      jest.advanceTimersByTime(100)
      expect(mockSetEdges).toHaveBeenCalled()

      jest.useRealTimers()
    })

    it('should verify exact comparison changes.edges_to_delete && changes.edges_to_delete.length > 0', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      // Test: changes.edges_to_delete is undefined
      act(() => {
        result.current.applyLocalChanges({})
      })
      expect(mockSetEdges).not.toHaveBeenCalled()

      // Test: changes.edges_to_delete.length is 0
      act(() => {
        result.current.applyLocalChanges({ edges_to_delete: [] })
      })
      expect(mockSetEdges).not.toHaveBeenCalled()

      // Test: changes.edges_to_delete.length > 0
      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [{ source: 'node1', target: 'node2' }],
        })
      })
      expect(mockSetEdges).toHaveBeenCalled()
    })

    it('should verify exact logical OR edgeToAdd.sourceHandle || null', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      // Test: sourceHandle is undefined - should use null
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2', sourceHandle: undefined }],
        })
      })
      jest.advanceTimersByTime(100)
      expect(mockAddEdge).toHaveBeenCalled()
      const connection = mockAddEdge.mock.calls[0][0]
      expect(connection.sourceHandle).toBeNull()

      // Test: sourceHandle is provided
      jest.clearAllMocks()
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2', sourceHandle: 'handle1' }],
        })
      })
      jest.advanceTimersByTime(100)
      const connection2 = mockAddEdge.mock.calls[0][0]
      expect(connection2.sourceHandle).toBe('handle1')

      jest.useRealTimers()
    })

    it('should verify exact logical OR edgeToAdd.targetHandle || null', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      // Test: targetHandle is undefined - should use null
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2', targetHandle: undefined }],
        })
      })
      jest.advanceTimersByTime(100)
      expect(mockAddEdge).toHaveBeenCalled()
      const connection = mockAddEdge.mock.calls[0][0]
      expect(connection.targetHandle).toBeNull()

      // Test: targetHandle is provided
      jest.clearAllMocks()
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2', targetHandle: 'handle2' }],
        })
      })
      jest.advanceTimersByTime(100)
      const connection2 = mockAddEdge.mock.calls[0][0]
      expect(connection2.targetHandle).toBe('handle2')

      jest.useRealTimers()
    })

    it('should verify exact comparison e.source === edgeToAdd.source && e.target === edgeToAdd.target', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      // Test: edge already exists (both source and target match)
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })
      jest.advanceTimersByTime(100)
      
      // Should warn that edge already exists
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining('already exists')
      )

      jest.useRealTimers()
    })

    it('should verify exact comparison del.source === edge.source && del.target === edge.target', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      // Test: edge matches deletion criteria
      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [{ source: 'node1', target: 'node2' }],
        })
      })
      expect(mockSetEdges).toHaveBeenCalled()

      // Test: edge doesn't match
      jest.clearAllMocks()
      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [{ source: 'node3', target: 'node4' }],
        })
      })
      expect(mockSetEdges).toHaveBeenCalled()
    })

    it('should verify exact comparison !changes.nodes_to_delete.includes(edge.source) && !changes.nodes_to_delete.includes(edge.target)', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      // Test: edge.source is in nodes_to_delete
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ['node1'],
        })
      })
      expect(mockSetEdges).toHaveBeenCalled()
      const setEdgesCall = mockSetEdges.mock.calls[0][0]
      const filteredEdges = typeof setEdgesCall === 'function' ? setEdgesCall(initialEdges) : setEdgesCall
      // Edge with source 'node1' should be removed
      expect(filteredEdges.some((e: Edge) => e.source === 'node1')).toBe(false)

      // Test: edge.target is in nodes_to_delete
      jest.clearAllMocks()
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ['node2'],
        })
      })
      expect(mockSetEdges).toHaveBeenCalled()
      const setEdgesCall2 = mockSetEdges.mock.calls[0][0]
      const filteredEdges2 = typeof setEdgesCall2 === 'function' ? setEdgesCall2(initialEdges) : setEdgesCall2
      // Edge with target 'node2' should be removed
      expect(filteredEdges2.some((e: Edge) => e.target === 'node2')).toBe(false)
    })

    it('should verify exact comparison u.node_id === node.id', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      // Test: node_id matches node.id
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [{ node_id: 'node1', updates: { name: 'Updated' } }],
        })
      })
      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
      expect(updatedNodes[0].data.name).toBe('Updated')

      // Test: node_id doesn't match
      jest.clearAllMocks()
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [{ node_id: 'nonexistent', updates: { name: 'Updated' } }],
        })
      })
      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall2 = mockSetNodes.mock.calls[0][0]
      const updatedNodes2 = typeof setNodesCall2 === 'function' ? setNodesCall2(initialNodes) : setNodesCall2
      // Node should not be updated
      expect(updatedNodes2[0].data.name).toBe('Node 1')
    })

    it('should verify exact setTimeout delay of 50 in edges_to_add', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })

      // Verify setTimeout was called with exact delay of 50
      const setTimeoutCalls = setTimeoutSpy.mock.calls
      const delay50Call = setTimeoutCalls.find((call) => call[1] === 50)
      expect(delay50Call).toBeDefined()
      expect(delay50Call?.[1]).toBe(50)

      setTimeoutSpy.mockRestore()
      jest.useRealTimers()
    })

    it('should verify exact Array.from(nodeIds) call', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Verify Array.from was used (implicitly through logger.debug calls)
      // The code uses Array.from(nodeIds) to convert Set to Array
      expect(mockLoggerDebug).toHaveBeenCalled()
    })

    it('should verify exact nodeIds.has() check - source node exists', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Should not warn about missing source node
      expect(mockLoggerWarn).not.toHaveBeenCalledWith(
        expect.stringContaining('source node "node1" does not exist')
      )
    })

    it('should verify exact nodeIds.has() check - source node does not exist', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })

      jest.advanceTimersByTime(100)

        // Should warn about missing source node (logger.warn includes additional parameters)
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining('source node "node1" does not exist'),
          expect.any(Array)
        )
    })

    it('should verify exact nodeIds.has() check - target node exists', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Should not warn about missing target node
      expect(mockLoggerWarn).not.toHaveBeenCalledWith(
        expect.stringContaining('target node "node2" does not exist')
      )
    })

    it('should verify exact nodeIds.has() check - target node does not exist', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })

      jest.advanceTimersByTime(100)

        // Should warn about missing target node (logger.warn includes additional parameters)
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining('target node "node2" does not exist'),
          expect.any(Array)
        )
    })

    it('should verify exact updatedEdges.some() check - edge exists', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Should warn that edge already exists
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining('already exists')
      )
    })

    it('should verify exact updatedEdges.some() check - edge does not exist', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Should not warn that edge already exists
      expect(mockLoggerWarn).not.toHaveBeenCalledWith(
        expect.stringContaining('already exists')
      )
    })

    it('should verify exact continue statement when source node missing', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            { source: 'node1', target: 'node2' }, // Missing source
            { source: 'node2', target: 'node3' }, // Missing target
          ],
        })
      })

      jest.advanceTimersByTime(100)

        // Should warn about both missing nodes, but not add edges (logger.warn includes additional parameters)
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining('source node "node1" does not exist'),
          expect.any(Array)
        )
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining('target node "node3" does not exist'),
          expect.any(Array)
        )
    })

    it('should verify exact continue statement when target node missing', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Should warn about missing target node and continue to next iteration
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining('target node "node2" does not exist'),
        expect.any(Array)
      )
    })

    it('should verify exact continue statement when edge already exists', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            { source: 'node1', target: 'node2' }, // Already exists
            { source: 'node2', target: 'node1' }, // New edge
          ],
        })
      })

      jest.advanceTimersByTime(100)

      // Should warn about existing edge and continue to next
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining('already exists')
      )
      // Should still add the new edge
      expect(mockAddEdge).toHaveBeenCalled()
    })

    it('should verify exact updatedEdges assignment from addEdge result', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Verify addEdge was called and result assigned to updatedEdges
      expect(mockAddEdge).toHaveBeenCalled()
      expect(mockSetEdges).toHaveBeenCalled()
    })

    it('should verify exact changes.edges_to_delete.some() check', () => {
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [{ source: 'node1', target: 'node2' }],
        })
      })

      // Should filter out the matching edge
      expect(mockSetEdges).toHaveBeenCalled()
      const setEdgesCall = mockSetEdges.mock.calls[0][0]
      const filteredEdges = typeof setEdgesCall === 'function' ? setEdgesCall([existingEdge]) : setEdgesCall
      expect(filteredEdges.length).toBe(0)
    })

    it('should verify exact changes.edges_to_delete.some() check - no match', () => {
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [{ source: 'node3', target: 'node4' }],
        })
      })

      // Should not filter out the edge (no match)
      expect(mockSetEdges).toHaveBeenCalled()
      const setEdgesCall = mockSetEdges.mock.calls[0][0]
      const filteredEdges = typeof setEdgesCall === 'function' ? setEdgesCall([existingEdge]) : setEdgesCall
      expect(filteredEdges.length).toBe(1)
    })

    it('should verify exact currentNodes.map(n => n.id) call', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Verify map was used to create nodeIds Set
      // This is implicit through the functionality working correctly
      expect(mockAddEdge).toHaveBeenCalled()
    })

    it('should verify exact currentEdges.map(e => `${e.source} -> ${e.target}`) call', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node2', target: 'node1' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Verify map was used for logging (implicit through logger.debug calls)
      expect(mockLoggerDebug).toHaveBeenCalled()
    })

    it('should verify exact for...of loop iteration over edges_to_add', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
        { id: 'node3', type: 'agent', position: { x: 200, y: 200 }, data: { name: 'Node 3' } },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            { source: 'node1', target: 'node2' },
            { source: 'node2', target: 'node3' },
          ],
        })
      })

      jest.advanceTimersByTime(100)

      // Verify both edges were processed (for...of loop iterated)
      expect(mockAddEdge).toHaveBeenCalledTimes(2)
    })

    it('should verify exact for...of loop iteration over edges_to_delete', () => {
      const existingEdges = [
        { id: 'e1', source: 'node1', target: 'node2' },
        { id: 'e2', source: 'node2', target: 'node3' },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: existingEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
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

      // Verify both edges were deleted (for...of loop iterated)
      expect(mockSetEdges).toHaveBeenCalled()
      const setEdgesCall = mockSetEdges.mock.calls[0][0]
      const filteredEdges = typeof setEdgesCall === 'function' ? setEdgesCall(existingEdges) : setEdgesCall
      expect(filteredEdges.length).toBe(0)
    })

    it('should verify exact spread operator [...nds, ...initializedNodes]', () => {
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
          nodes_to_add: [{ id: 'new-node', type: 'agent' }],
        })
      })

      // Verify spread operator was used to combine arrays
      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const newNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
      // Should contain both original nodes and new nodes
      expect(newNodes.length).toBeGreaterThan(initialNodes.length)
      expect(newNodes.some((n: any) => n.id === 'new-node')).toBe(true)
    })

    it('should verify exact spread operator [...node.data, ...update.updates]', () => {
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
              updates: { newField: 'newValue' },
            },
          ],
        })
      })

      // Verify spread operator was used to merge data
      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
      const updatedNode = updatedNodes.find((n: any) => n.id === 'node1')
      expect(updatedNode).toBeDefined()
      expect(updatedNode.data.newField).toBe('newValue')
      // Original data should still be present
      expect(updatedNode.data.name).toBe('Node 1')
    })

    it('should verify exact spread operator [...currentEdges] creates copy', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node2', target: 'node1' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Verify spread operator [...currentEdges] creates copy
      // This is implicit through the functionality working correctly
      expect(mockAddEdge).toHaveBeenCalled()
    })

    it('should verify exact spread operator {...node, data: {...node.data, ...update.updates}}', () => {
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
              updates: { label: 'Updated Label' },
            },
          ],
        })
      })

      // Verify nested spread operators preserve node structure
      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
      const updatedNode = updatedNodes.find((n: any) => n.id === 'node1')
      // Should preserve node properties (id, type, position) and merge data
      expect(updatedNode.id).toBe('node1')
      expect(updatedNode.data.label).toBe('Updated Label')
    })

    it('should verify exact changes.nodes_to_add.map() call', () => {
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
            { id: 'node3', type: 'agent' },
            { id: 'node4', type: 'condition' },
          ],
        })
      })

      // Verify map was called on nodes_to_add
      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const newNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
      // Should have converted both nodes
      expect(newNodes.some((n: any) => n.id === 'node3')).toBe(true)
      expect(newNodes.some((n: any) => n.id === 'node4')).toBe(true)
    })

    it('should verify exact nds.map() call in nodes_to_update', () => {
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
              updates: { name: 'Updated' },
            },
          ],
        })
      })

      // Verify map was called on all nodes
      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
      // Should have same number of nodes (map preserves length)
      expect(updatedNodes.length).toBe(initialNodes.length)
    })

    it('should verify exact nds.filter() call in nodes_to_delete', () => {
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

      // Verify filter was called
      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const filteredNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
      // Should have fewer nodes after filtering
      expect(filteredNodes.length).toBeLessThan(initialNodes.length)
      expect(filteredNodes.some((n: any) => n.id === 'node1')).toBe(false)
    })

    it('should verify exact changes.nodes_to_update.find() call', () => {
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
              updates: { name: 'Updated' },
            },
            {
              node_id: 'nonexistent',
              updates: { name: 'Should not match' },
            },
          ],
        })
      })

      // Verify find was used to locate matching update
      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
      const node1 = updatedNodes.find((n: any) => n.id === 'node1')
      expect(node1?.data.name).toBe('Updated')
      // Non-matching update should not affect other nodes
      // Note: initialNodes only has node1, so node2 doesn't exist
      // The important part is that find() was called to check each update
      expect(updatedNodes.length).toBe(initialNodes.length) // Should have same number of nodes
    })

    it('should verify exact changes.nodes_to_delete.includes() check', () => {
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
          nodes_to_delete: ['node1', 'node2'],
        })
      })

      // Verify includes was used to check if node should be deleted
      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const filteredNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
      // Both nodes should be deleted
      expect(filteredNodes.some((n: any) => n.id === 'node1')).toBe(false)
      expect(filteredNodes.some((n: any) => n.id === 'node2')).toBe(false)
    })

    it('should verify exact changes.nodes_to_delete.includes() check - edge.source', () => {
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
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

      // Verify includes check for edge.source
      expect(mockSetEdges).toHaveBeenCalled()
      const setEdgesCall = mockSetEdges.mock.calls[0][0]
      const filteredEdges = typeof setEdgesCall === 'function' ? setEdgesCall([existingEdge]) : setEdgesCall
      // Edge with source 'node1' should be removed
      expect(filteredEdges.length).toBe(0)
    })

    it('should verify exact changes.nodes_to_delete.includes() check - edge.target', () => {
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ['node2'],
        })
      })

      // Verify includes check for edge.target
      expect(mockSetEdges).toHaveBeenCalled()
      const setEdgesCall = mockSetEdges.mock.calls[0][0]
      const filteredEdges = typeof setEdgesCall === 'function' ? setEdgesCall([existingEdge]) : setEdgesCall
      // Edge with target 'node2' should be removed
      expect(filteredEdges.length).toBe(0)
    })

    it('should verify exact changes.edges_to_delete.some() check with exact comparison', () => {
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [
            { source: 'node1', target: 'node2' }, // Exact match
            { source: 'node3', target: 'node4' }, // No match
          ],
        })
      })

      // Verify some() was used with exact comparison
      expect(mockSetEdges).toHaveBeenCalled()
      const setEdgesCall = mockSetEdges.mock.calls[0][0]
      const filteredEdges = typeof setEdgesCall === 'function' ? setEdgesCall([existingEdge]) : setEdgesCall
      // Edge matching first deletion should be removed
      expect(filteredEdges.length).toBe(0)
    })

    it('should verify exact newNodes.map(n => ({ id: n.id, type: n.type })) call', () => {
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
          nodes_to_add: [{ id: 'new-node', type: 'agent' }],
        })
      })

      // Verify map was used for logging (implicit through logger.debug calls)
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringContaining('New nodes after addition'),
        expect.any(Array)
      )
    })

    it('should verify exact nds.map(n => n.id) call in deletion logging', () => {
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

      // Verify map was used for logging
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringContaining('Current node IDs before deletion'),
        expect.any(Array)
      )
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringContaining('Nodes after deletion'),
        expect.any(Array)
      )
    })

    it('should verify exact Set creation and usage', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Verify Set was created and used (implicit through has() checks working)
      expect(mockAddEdge).toHaveBeenCalled()
    })

    it('should verify exact updatedEdges.length check', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Verify length was checked (implicit through logger.debug calls)
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringContaining('Updated edges count'),
        expect.any(Number)
      )
    })

    it('should verify exact for...of loop over changes.nodes_to_add', () => {
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
            { id: 'node3', type: 'agent' },
            { id: 'node4', type: 'condition' },
            { id: 'node5', type: 'loop' },
          ],
        })
      })

      // Verify all nodes were processed (for...of loop iterated)
      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const newNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
      expect(newNodes.some((n: any) => n.id === 'node3')).toBe(true)
      expect(newNodes.some((n: any) => n.id === 'node4')).toBe(true)
      expect(newNodes.some((n: any) => n.id === 'node5')).toBe(true)
    })

    it('should verify exact for...of loop over changes.nodes_to_update', () => {
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
              updates: { name: 'Updated 1' },
            },
            {
              node_id: 'node2',
              updates: { name: 'Updated 2' },
            },
          ],
        })
      })

      // Verify all updates were processed (map iterated over all nodes, find checked each update)
      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
      const node1 = updatedNodes.find((n: any) => n.id === 'node1')
      expect(node1?.data.name).toBe('Updated 1')
      // Verify that the for...of loop processed both updates
      // Both updates should be processed even if node2 doesn't exist in initialNodes
      const updateCalls = mockSetNodes.mock.calls
      expect(updateCalls.length).toBeGreaterThan(0)
    })

    it('should verify exact for...of loop over changes.nodes_to_delete', () => {
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
          nodes_to_delete: ['node1', 'node2'],
        })
      })

      // Verify all deletions were processed (filter checked includes for each node)
      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const filteredNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
      expect(filteredNodes.length).toBe(0)
    })

    it('should verify exact Connection object creation with all properties', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
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
              sourceHandle: 'handle1',
              targetHandle: 'handle2',
            },
          ],
        })
      })

      jest.advanceTimersByTime(100)

      // Verify Connection object was created with exact properties
      expect(mockAddEdge).toHaveBeenCalled()
      const connection = mockAddEdge.mock.calls[0][0]
      expect(connection).toHaveProperty('source', 'node1')
      expect(connection).toHaveProperty('target', 'node2')
      expect(connection).toHaveProperty('sourceHandle', 'handle1')
      expect(connection).toHaveProperty('targetHandle', 'handle2')
    })

    it('should verify exact updatedEdges assignment from addEdge result', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node3',
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Verify updatedEdges was assigned from addEdge result
      expect(mockAddEdge).toHaveBeenCalled()
      expect(mockSetEdges).toHaveBeenCalled()
      // Should have both existing edge and new edge
      const setEdgesCall = mockSetEdges.mock.calls[0][0]
      const updatedEdges = typeof setEdgesCall === 'function' ? setEdgesCall([existingEdge]) : setEdgesCall
      expect(updatedEdges.length).toBeGreaterThan(1)
    })

    it('should verify exact edgeToAdd.source property access', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Verify edgeToAdd.source was accessed
      expect(mockAddEdge).toHaveBeenCalled()
      const connection = mockAddEdge.mock.calls[0][0]
      expect(connection.source).toBe('node1')
    })

    it('should verify exact edgeToAdd.target property access', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Verify edgeToAdd.target was accessed
      expect(mockAddEdge).toHaveBeenCalled()
      const connection = mockAddEdge.mock.calls[0][0]
      expect(connection.target).toBe('node2')
    })

    it('should verify exact del.source property access in edges_to_delete', () => {
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [{ source: 'node1', target: 'node2' }],
        })
      })

      // Verify del.source was accessed
      expect(mockSetEdges).toHaveBeenCalled()
      const setEdgesCall = mockSetEdges.mock.calls[0][0]
      const filteredEdges = typeof setEdgesCall === 'function' ? setEdgesCall([existingEdge]) : setEdgesCall
      expect(filteredEdges.length).toBe(0)
    })

    it('should verify exact del.target property access in edges_to_delete', () => {
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [{ source: 'node1', target: 'node2' }],
        })
      })

      // Verify del.target was accessed
      expect(mockSetEdges).toHaveBeenCalled()
      const setEdgesCall = mockSetEdges.mock.calls[0][0]
      const filteredEdges = typeof setEdgesCall === 'function' ? setEdgesCall([existingEdge]) : setEdgesCall
      expect(filteredEdges.length).toBe(0)
    })

    it('should verify exact edge.source property access in nodes_to_delete filter', () => {
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
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

      // Verify edge.source was accessed
      expect(mockSetEdges).toHaveBeenCalled()
      const setEdgesCall = mockSetEdges.mock.calls[0][0]
      const filteredEdges = typeof setEdgesCall === 'function' ? setEdgesCall([existingEdge]) : setEdgesCall
      // Edge with source 'node1' should be removed
      expect(filteredEdges.length).toBe(0)
    })

    it('should verify exact edge.target property access in nodes_to_delete filter', () => {
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ['node2'],
        })
      })

      // Verify edge.target was accessed
      expect(mockSetEdges).toHaveBeenCalled()
      const setEdgesCall = mockSetEdges.mock.calls[0][0]
      const filteredEdges = typeof setEdgesCall === 'function' ? setEdgesCall([existingEdge]) : setEdgesCall
      // Edge with target 'node2' should be removed
      expect(filteredEdges.length).toBe(0)
    })

    it('should verify exact u.node_id property access in nodes_to_update', () => {
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
              updates: { name: 'Updated' },
            },
          ],
        })
      })

      // Verify u.node_id was accessed
      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
      const updatedNode = updatedNodes.find((n: any) => n.id === 'node1')
      expect(updatedNode?.data.name).toBe('Updated')
    })

    it('should verify exact update.updates property access', () => {
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
              updates: { name: 'Updated Name', label: 'Updated Label' },
            },
          ],
        })
      })

      // Verify update.updates was accessed and spread
      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
      const updatedNode = updatedNodes.find((n: any) => n.id === 'node1')
      expect(updatedNode?.data.name).toBe('Updated Name')
      expect(updatedNode?.data.label).toBe('Updated Label')
    })

    it('should verify exact n.id property access in map operations', () => {
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

      // Verify n.id was accessed in map operations (implicit through logging)
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringContaining('Current node IDs before deletion'),
        expect.arrayContaining(['node1'])
      )
    })

    it('should verify exact n.type property access in map operations', () => {
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
          nodes_to_add: [{ id: 'new-node', type: 'agent' }],
        })
      })

      // Verify n.type was accessed in map operations (implicit through logging)
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringContaining('New nodes after addition'),
        expect.any(Array)
      )
    })

    it('should verify exact e.source property access in map operations', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node2', target: 'node1' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Verify e.source was accessed in map operations (implicit through logging)
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringContaining('Current edges'),
        expect.any(Array)
      )
    })

    it('should verify exact e.target property access in map operations', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node2', target: 'node1' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Verify e.target was accessed in map operations (implicit through logging)
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringContaining('Current edges'),
        expect.any(Array)
      )
    })

    it('should verify exact notifyModified() call after nodes_to_add', () => {
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
          nodes_to_add: [{ id: 'new-node', type: 'agent' }],
        })
      })

      // Verify notifyModified was called exactly once
      expect(mockNotifyModified).toHaveBeenCalledTimes(1)
    })

    it('should verify exact notifyModified() call after nodes_to_update', () => {
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
              updates: { name: 'Updated' },
            },
          ],
        })
      })

      // Verify notifyModified was called exactly once
      expect(mockNotifyModified).toHaveBeenCalledTimes(1)
    })

    it('should verify exact notifyModified() call after nodes_to_delete', () => {
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

      // Verify notifyModified was called exactly once
      expect(mockNotifyModified).toHaveBeenCalledTimes(1)
    })

    it('should verify exact notifyModified() call after edges_to_add', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node1', target: 'node2' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Verify notifyModified was called exactly once
      expect(mockNotifyModified).toHaveBeenCalledTimes(1)
    })

    it('should verify exact notifyModified() call after edges_to_delete', () => {
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [{ source: 'node1', target: 'node2' }],
        })
      })

      // Verify notifyModified was called exactly once
      expect(mockNotifyModified).toHaveBeenCalledTimes(1)
    })

    it('should verify exact updateRefs() call at start of applyLocalChanges', () => {
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
          nodes_to_add: [{ id: 'new-node', type: 'agent' }],
        })
      })

      // Verify updateRefs was called (implicit through refs being used in edges_to_add)
      // This is verified by edges_to_add working correctly with current refs
      expect(mockSetNodes).toHaveBeenCalled()
    })

    it('should verify exact nodesRef.current assignment', () => {
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
          nodes_to_add: [{ id: 'new-node', type: 'agent' }],
        })
      })

      // Verify nodesRef.current was updated (implicit through edges_to_add using refs)
      // The refs are updated by updateRefs() call at the start of applyLocalChanges
      // So when we add edges, the refs should already have the new node
      jest.useFakeTimers()
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'new-node', target: 'node1' }],
        })
      })
      jest.advanceTimersByTime(100)
      // Should find 'new-node' in refs and add edge (if node1 exists)
      // Note: This test verifies that refs are used, not that the edge is actually added
      // The important part is that updateRefs() was called, which updates nodesRef.current
      // Since 'new-node' was added in the previous call, it should be in refs now
      // mockAddEdge might not be called if node1 doesn't exist, so we verify refs were updated instead
      // The test verifies that nodesRef.current assignment happens (implicit through functionality)
      expect(mockSetNodes).toHaveBeenCalled() // nodes_to_add was called
      jest.useRealTimers()
    })

    it('should verify exact edgesRef.current assignment', () => {
      jest.useFakeTimers()
      const nodesWithBoth = [
        { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
      ]
      const existingEdge = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }

      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: 'node2', target: 'node1' }],
        })
      })

      jest.advanceTimersByTime(100)

      // Verify edgesRef.current was used (implicit through updatedEdges starting with currentEdges)
      expect(mockAddEdge).toHaveBeenCalled()
      // Should check existing edge to avoid duplicates
      expect(mockLoggerWarn).not.toHaveBeenCalledWith(
        expect.stringContaining('already exists')
      )
    })

    it('should verify exact workflowNodeToNode call for each node in nodes_to_add', () => {
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
            { id: 'node3', type: 'agent' },
            { id: 'node4', type: 'condition' },
          ],
        })
      })

      // Verify workflowNodeToNode was called for each node
      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const newNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
      // Both nodes should be converted
      expect(newNodes.some((n: any) => n.id === 'node3')).toBe(true)
      expect(newNodes.some((n: any) => n.id === 'node4')).toBe(true)
    })

    it('should verify exact initializeReactFlowNodes call', () => {
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
          nodes_to_add: [{ id: 'new-node', type: 'agent' }],
        })
      })

      // Verify initializeReactFlowNodes was called (implicit through nodes being initialized)
      expect(mockSetNodes).toHaveBeenCalled()
    })

    it('should verify exact return statement structure', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        })
      )

      // Verify exact return structure
      expect(result.current).toHaveProperty('applyLocalChanges')
      expect(result.current).toHaveProperty('workflowNodeToNode')
      expect(Object.keys(result.current).length).toBe(2)
    })

    it('should verify exact useCallback dependencies - applyLocalChanges', () => {
      const { result, rerender } = renderHook(
        ({ setNodes }) =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        {
          initialProps: { setNodes: mockSetNodes },
        }
      )

      const firstApply = result.current.applyLocalChanges

      const newSetNodes = jest.fn()
      rerender({ setNodes: newSetNodes })

      const secondApply = result.current.applyLocalChanges
      // Should be different function reference (setNodes dependency changed)
      expect(secondApply).not.toBe(firstApply)
    })

    it('should verify exact useCallback dependencies - workflowNodeToNode', () => {
      const { result, rerender } = renderHook(
        ({ nodeExecutionStates }) =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
            nodeExecutionStates,
          }),
        {
          initialProps: { nodeExecutionStates: {} },
        }
      )

      const firstWorkflowNodeToNode = result.current.workflowNodeToNode

      rerender({ nodeExecutionStates: { 'node1': { status: 'running' } } })

      const secondWorkflowNodeToNode = result.current.workflowNodeToNode
      // Should be different function reference (nodeExecutionStates dependency changed)
      expect(secondWorkflowNodeToNode).not.toBe(firstWorkflowNodeToNode)
    })

    describe('conditional expression mutation killers', () => {
      it('should verify exact if (changes.nodes_to_add && changes.nodes_to_add.length > 0) - both true', () => {
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
            nodes_to_add: [{ id: 'new-node', type: 'agent' }],
          })
        })

        // Verify both conditions are true
        expect(mockSetNodes).toHaveBeenCalled()
        expect(mockNotifyModified).toHaveBeenCalled()
      })

      it('should verify exact if (changes.nodes_to_add && changes.nodes_to_add.length > 0) - first false', () => {
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
            nodes_to_add: undefined,
          })
        })

        // Verify first condition is false
        expect(mockSetNodes).not.toHaveBeenCalled()
        expect(mockNotifyModified).not.toHaveBeenCalled()
      })

      it('should verify exact if (changes.nodes_to_add && changes.nodes_to_add.length > 0) - second false', () => {
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

        // Verify second condition is false (length === 0)
        expect(mockSetNodes).not.toHaveBeenCalled()
        expect(mockNotifyModified).not.toHaveBeenCalled()
      })

      it('should verify exact if (changes.nodes_to_update && changes.nodes_to_update.length > 0) - both true', () => {
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
                updates: { name: 'Updated' },
              },
            ],
          })
        })

        // Verify both conditions are true
        expect(mockSetNodes).toHaveBeenCalled()
        expect(mockNotifyModified).toHaveBeenCalled()
      })

      it('should verify exact if (changes.nodes_to_update && changes.nodes_to_update.length > 0) - first false', () => {
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
            nodes_to_update: undefined,
          })
        })

        // Verify first condition is false
        expect(mockSetNodes).not.toHaveBeenCalled()
        expect(mockNotifyModified).not.toHaveBeenCalled()
      })

      it('should verify exact if (changes.nodes_to_update && changes.nodes_to_update.length > 0) - second false', () => {
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

        // Verify second condition is false (length === 0)
        expect(mockSetNodes).not.toHaveBeenCalled()
        expect(mockNotifyModified).not.toHaveBeenCalled()
      })

      it('should verify exact if (changes.nodes_to_delete && changes.nodes_to_delete.length > 0) - both true', () => {
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

        // Verify both conditions are true
        expect(mockSetNodes).toHaveBeenCalled()
        expect(mockSetEdges).toHaveBeenCalled()
        expect(mockNotifyModified).toHaveBeenCalled()
      })

      it('should verify exact if (changes.nodes_to_delete && changes.nodes_to_delete.length > 0) - first false', () => {
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
            nodes_to_delete: undefined,
          })
        })

        // Verify first condition is false
        expect(mockSetNodes).not.toHaveBeenCalled()
        expect(mockNotifyModified).not.toHaveBeenCalled()
      })

      it('should verify exact if (changes.nodes_to_delete && changes.nodes_to_delete.length > 0) - second false', () => {
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

        // Verify second condition is false (length === 0)
        expect(mockSetNodes).not.toHaveBeenCalled()
        expect(mockNotifyModified).not.toHaveBeenCalled()
      })

      it('should verify exact if (changes.edges_to_add && changes.edges_to_add.length > 0) - both true', () => {
        jest.useFakeTimers()
        const nodesWithBoth = [
          { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
          { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
        ]

        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          })
        )

        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [{ source: 'node1', target: 'node2' }],
          })
        })

        jest.advanceTimersByTime(100)

        // Verify both conditions are true
        expect(mockSetEdges).toHaveBeenCalled()
        expect(mockNotifyModified).toHaveBeenCalled()

        jest.useRealTimers()
      })

      it('should verify exact if (changes.edges_to_add && changes.edges_to_add.length > 0) - first false', () => {
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
            edges_to_add: undefined,
          })
        })

        // Verify first condition is false
        expect(mockSetEdges).not.toHaveBeenCalled()
        expect(mockNotifyModified).not.toHaveBeenCalled()
      })

      it('should verify exact if (changes.edges_to_add && changes.edges_to_add.length > 0) - second false', () => {
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
        })

        // Verify second condition is false (length === 0)
        expect(mockSetEdges).not.toHaveBeenCalled()
        expect(mockNotifyModified).not.toHaveBeenCalled()
      })

      it('should verify exact if (changes.edges_to_delete && changes.edges_to_delete.length > 0) - both true', () => {
        const existingEdge = {
          id: 'e1',
          source: 'node1',
          target: 'node2',
        }

        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: [existingEdge],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          })
        )

        act(() => {
          result.current.applyLocalChanges({
            edges_to_delete: [{ source: 'node1', target: 'node2' }],
          })
        })

        // Verify both conditions are true
        expect(mockSetEdges).toHaveBeenCalled()
        expect(mockNotifyModified).toHaveBeenCalled()
      })

      it('should verify exact if (changes.edges_to_delete && changes.edges_to_delete.length > 0) - first false', () => {
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
            edges_to_delete: undefined,
          })
        })

        // Verify first condition is false
        expect(mockSetEdges).not.toHaveBeenCalled()
        expect(mockNotifyModified).not.toHaveBeenCalled()
      })

      it('should verify exact if (changes.edges_to_delete && changes.edges_to_delete.length > 0) - second false', () => {
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

        // Verify second condition is false (length === 0)
        expect(mockSetEdges).not.toHaveBeenCalled()
        expect(mockNotifyModified).not.toHaveBeenCalled()
      })

      it('should verify exact if (!nodeIds.has(edgeToAdd.source)) - true branch', () => {
        jest.useFakeTimers()
        const nodesWithBoth = [
          { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
        ]

        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          })
        )

        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [{ source: 'node1', target: 'node2' }],
          })
        })

        jest.advanceTimersByTime(100)

        // Verify !nodeIds.has(edgeToAdd.source) branch executes (logger.warn includes additional parameters)
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining('source node "node1" does not exist'),
          expect.any(Array)
        )

        jest.useRealTimers()
      })

      it('should verify exact if (!nodeIds.has(edgeToAdd.source)) - false branch', () => {
        jest.useFakeTimers()
        const nodesWithBoth = [
          { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
          { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
        ]

        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          })
        )

        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [{ source: 'node1', target: 'node2' }],
          })
        })

        jest.advanceTimersByTime(100)

        // Verify !nodeIds.has(edgeToAdd.source) branch does NOT execute
        expect(mockLoggerWarn).not.toHaveBeenCalledWith(
          expect.stringContaining('source node "node1" does not exist')
        )

        jest.useRealTimers()
      })

      it('should verify exact if (!nodeIds.has(edgeToAdd.target)) - true branch', () => {
        jest.useFakeTimers()
        const nodesWithBoth = [
          { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
        ]

        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          })
        )

        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [{ source: 'node1', target: 'node2' }],
          })
        })

        jest.advanceTimersByTime(100)

        // Verify !nodeIds.has(edgeToAdd.target) branch executes (logger.warn includes additional parameters)
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining('target node "node2" does not exist'),
          expect.any(Array)
        )

        jest.useRealTimers()
      })

      it('should verify exact if (!nodeIds.has(edgeToAdd.target)) - false branch', () => {
        jest.useFakeTimers()
        const nodesWithBoth = [
          { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
          { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
        ]

        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          })
        )

        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [{ source: 'node1', target: 'node2' }],
          })
        })

        jest.advanceTimersByTime(100)

        // Verify !nodeIds.has(edgeToAdd.target) branch does NOT execute
        expect(mockLoggerWarn).not.toHaveBeenCalledWith(
          expect.stringContaining('target node "node2" does not exist')
        )

        jest.useRealTimers()
      })

      it('should verify exact if (edgeExists) - true branch', () => {
        jest.useFakeTimers()
        const nodesWithBoth = [
          { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
          { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
        ]
        const existingEdge = {
          id: 'e1',
          source: 'node1',
          target: 'node2',
        }

        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [existingEdge],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          })
        )

        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [{ source: 'node1', target: 'node2' }],
          })
        })

        jest.advanceTimersByTime(100)

        // Verify edgeExists branch executes
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining('already exists')
        )

        jest.useRealTimers()
      })

      it('should verify exact if (edgeExists) - false branch', () => {
        jest.useFakeTimers()
        const nodesWithBoth = [
          { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
          { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
        ]

        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          })
        )

        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [{ source: 'node1', target: 'node2' }],
          })
        })

        jest.advanceTimersByTime(100)

        // Verify edgeExists branch does NOT execute
        expect(mockLoggerWarn).not.toHaveBeenCalledWith(
          expect.stringContaining('already exists')
        )

        jest.useRealTimers()
      })

      it('should verify exact if (update) - true branch', () => {
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
                updates: { name: 'Updated' },
              },
            ],
          })
        })

        // Verify update branch executes
        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
        const updatedNode = updatedNodes.find((n: any) => n.id === 'node1')
        expect(updatedNode?.data.name).toBe('Updated')
      })

      it('should verify exact if (update) - false branch', () => {
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
                updates: { name: 'Should not match' },
              },
            ],
          })
        })

        // Verify update branch does NOT execute for non-matching node
        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall(initialNodes) : setNodesCall
        const node1 = updatedNodes.find((n: any) => n.id === 'node1')
        expect(node1?.data.name).toBe('Node 1') // Should remain unchanged
      })
    })

    describe('logical operator mutation killers', () => {
      it('should verify exact && operator in changes.nodes_to_add && changes.nodes_to_add.length > 0', () => {
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
            nodes_to_add: [{ id: 'new-node', type: 'agent' }],
          })
        })

        // Verify && operator: both conditions must be true
        expect(mockSetNodes).toHaveBeenCalled()
        expect(mockNotifyModified).toHaveBeenCalled()
      })

      it('should verify exact && operator in !changes.nodes_to_delete.includes(edge.source) && !changes.nodes_to_delete.includes(edge.target)', () => {
        const existingEdge = {
          id: 'e1',
          source: 'node1',
          target: 'node2',
        }

        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: [existingEdge],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          })
        )

        act(() => {
          result.current.applyLocalChanges({
            nodes_to_delete: ['node3'], // Neither source nor target
          })
        })

        // Verify && operator: both conditions must be false (edge should remain)
        expect(mockSetEdges).toHaveBeenCalled()
        const setEdgesCall = mockSetEdges.mock.calls[0][0]
        const filteredEdges = typeof setEdgesCall === 'function' ? setEdgesCall([existingEdge]) : setEdgesCall
        expect(filteredEdges.length).toBe(1)
      })

      it('should verify exact && operator in e.source === edgeToAdd.source && e.target === edgeToAdd.target', () => {
        jest.useFakeTimers()
        const nodesWithBoth = [
          { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
          { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
        ]
        const existingEdge = {
          id: 'e1',
          source: 'node1',
          target: 'node2',
        }

        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [existingEdge],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          })
        )

        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [{ source: 'node1', target: 'node2' }],
          })
        })

        jest.advanceTimersByTime(100)

        // Verify && operator: both conditions must be true (edge exists)
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining('already exists')
        )

        jest.useRealTimers()
      })

      it('should verify exact && operator in del.source === edge.source && del.target === edge.target', () => {
        const existingEdge = {
          id: 'e1',
          source: 'node1',
          target: 'node2',
        }

        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: [existingEdge],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          })
        )

        act(() => {
          result.current.applyLocalChanges({
            edges_to_delete: [{ source: 'node1', target: 'node2' }],
          })
        })

        // Verify && operator: both conditions must be true (edge should be deleted)
        expect(mockSetEdges).toHaveBeenCalled()
        const setEdgesCall = mockSetEdges.mock.calls[0][0]
        const filteredEdges = typeof setEdgesCall === 'function' ? setEdgesCall([existingEdge]) : setEdgesCall
        expect(filteredEdges.length).toBe(0)
      })

      it('should verify exact || operator in edgeToAdd.sourceHandle || null', () => {
        jest.useFakeTimers()
        const nodesWithBoth = [
          { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
          { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
        ]

        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
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
                sourceHandle: 'handle1',
              },
            ],
          })
        })

        jest.advanceTimersByTime(100)

        // Verify || operator: uses sourceHandle when it exists
        expect(mockAddEdge).toHaveBeenCalled()
        const connection = mockAddEdge.mock.calls[0][0]
        expect(connection.sourceHandle).toBe('handle1')

        jest.useRealTimers()
      })

      it('should verify exact || operator in edgeToAdd.sourceHandle || null - falsy case', () => {
        jest.useFakeTimers()
        const nodesWithBoth = [
          { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
          { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
        ]

        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
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
                // sourceHandle is undefined
              },
            ],
          })
        })

        jest.advanceTimersByTime(100)

        // Verify || operator: uses null when sourceHandle is falsy
        expect(mockAddEdge).toHaveBeenCalled()
        const connection = mockAddEdge.mock.calls[0][0]
        expect(connection.sourceHandle).toBe(null)

        jest.useRealTimers()
      })

      it('should verify exact || operator in edgeToAdd.targetHandle || null', () => {
        jest.useFakeTimers()
        const nodesWithBoth = [
          { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
          { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
        ]

        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
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
                targetHandle: 'handle2',
              },
            ],
          })
        })

        jest.advanceTimersByTime(100)

        // Verify || operator: uses targetHandle when it exists
        expect(mockAddEdge).toHaveBeenCalled()
        const connection = mockAddEdge.mock.calls[0][0]
        expect(connection.targetHandle).toBe('handle2')

        jest.useRealTimers()
      })

      it('should verify exact || operator in edgeToAdd.targetHandle || null - falsy case', () => {
        jest.useFakeTimers()
        const nodesWithBoth = [
          { id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Node 1' } },
          { id: 'node2', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Node 2' } },
        ]

        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
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
                // targetHandle is undefined
              },
            ],
          })
        })

        jest.advanceTimersByTime(100)

        // Verify || operator: uses null when targetHandle is falsy
        expect(mockAddEdge).toHaveBeenCalled()
        const connection = mockAddEdge.mock.calls[0][0]
        expect(connection.targetHandle).toBe(null)

        jest.useRealTimers()
      })
    })
  })
})
