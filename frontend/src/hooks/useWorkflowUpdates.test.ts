/**
 * Tests for useWorkflowUpdates hook
 */

import { renderHook, act, waitFor } from '@testing-library/react'
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

      await waitFor(() => {
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

      await waitFor(() => {
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

      await waitFor(() => {
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

      await waitFor(() => {
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
