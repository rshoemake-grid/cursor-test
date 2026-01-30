/**
 * Tests for useWorkflowUpdateHandler hook
 */

import { renderHook, act } from '@testing-library/react'
import { useWorkflowUpdateHandler } from './useWorkflowUpdateHandler'
import { api } from '../api/client'
import { logger } from '../utils/logger'
import { initializeReactFlowNodes, formatEdgesForReactFlow } from '../utils/workflowFormat'
import type { Node, Edge } from '@xyflow/react'

// Mock the API client
jest.mock('../api/client', () => ({
  api: {
    getWorkflow: jest.fn(),
  }
}))

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  }
}))

// Mock workflow format utilities
jest.mock('../utils/workflowFormat', () => ({
  initializeReactFlowNodes: jest.fn((nodes: Node[]) => nodes),
  formatEdgesForReactFlow: jest.fn((edges: Edge[]) => edges),
}))

describe('useWorkflowUpdateHandler', () => {
  const mockSetNodes = jest.fn()
  const mockSetEdges = jest.fn()
  const mockWorkflowNodeToNode = jest.fn((wfNode: any) => ({
    id: wfNode.id,
    type: wfNode.type,
    data: wfNode.data || {},
    position: { x: 0, y: 0 },
  }))
  const mockApplyLocalChanges = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('handleWorkflowUpdate', () => {
    it('should return early if changes is null', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdateHandler({
          localWorkflowId: 'workflow-1',
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          workflowNodeToNode: mockWorkflowNodeToNode,
          applyLocalChanges: mockApplyLocalChanges,
        })
      )

      act(() => {
        result.current.handleWorkflowUpdate(null)
      })

      expect(mockApplyLocalChanges).not.toHaveBeenCalled()
      expect(api.getWorkflow).not.toHaveBeenCalled()
    })

    it('should return early if changes is undefined', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdateHandler({
          localWorkflowId: 'workflow-1',
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          workflowNodeToNode: mockWorkflowNodeToNode,
          applyLocalChanges: mockApplyLocalChanges,
        })
      )

      act(() => {
        result.current.handleWorkflowUpdate(undefined as any)
      })

      expect(mockApplyLocalChanges).not.toHaveBeenCalled()
      expect(api.getWorkflow).not.toHaveBeenCalled()
    })

    it('should apply local changes when there are no deletions', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdateHandler({
          localWorkflowId: 'workflow-1',
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          workflowNodeToNode: mockWorkflowNodeToNode,
          applyLocalChanges: mockApplyLocalChanges,
        })
      )

      const changes = {
        nodes_to_add: [{ id: 'node-1', type: 'agent' }],
      }

      act(() => {
        result.current.handleWorkflowUpdate(changes)
      })

      expect(mockApplyLocalChanges).toHaveBeenCalledWith(changes)
      expect(api.getWorkflow).not.toHaveBeenCalled()
    })

    it('should apply local changes when nodes_to_delete is empty array', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdateHandler({
          localWorkflowId: 'workflow-1',
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          workflowNodeToNode: mockWorkflowNodeToNode,
          applyLocalChanges: mockApplyLocalChanges,
        })
      )

      const changes = {
        nodes_to_delete: [],
      }

      act(() => {
        result.current.handleWorkflowUpdate(changes)
      })

      expect(mockApplyLocalChanges).toHaveBeenCalledWith(changes)
      expect(api.getWorkflow).not.toHaveBeenCalled()
    })

    it('should apply local changes when localWorkflowId is null', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdateHandler({
          localWorkflowId: null,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          workflowNodeToNode: mockWorkflowNodeToNode,
          applyLocalChanges: mockApplyLocalChanges,
        })
      )

      const changes = {
        nodes_to_delete: ['node-1'],
      }

      act(() => {
        result.current.handleWorkflowUpdate(changes)
      })

      expect(mockApplyLocalChanges).toHaveBeenCalledWith(changes)
      expect(api.getWorkflow).not.toHaveBeenCalled()
    })

    it('should reload workflow when there are deletions and localWorkflowId exists', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        nodes: [
          { id: 'node-1', type: 'agent', data: {} },
          { id: 'node-2', type: 'condition', data: {} },
        ],
        edges: [
          { id: 'edge-1', source: 'node-1', target: 'node-2' },
        ],
      }

      ;(api.getWorkflow as jest.Mock).mockResolvedValue(mockWorkflow)

      const { result } = renderHook(() =>
        useWorkflowUpdateHandler({
          localWorkflowId: 'workflow-1',
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          workflowNodeToNode: mockWorkflowNodeToNode,
          applyLocalChanges: mockApplyLocalChanges,
        })
      )

      const changes = {
        nodes_to_delete: ['node-1'],
      }

      act(() => {
        result.current.handleWorkflowUpdate(changes)
      })

      // Should not apply local changes immediately
      expect(mockApplyLocalChanges).not.toHaveBeenCalled()

      // Advance timers to trigger setTimeout
      act(() => {
        jest.advanceTimersByTime(200)
      })

      // Wait for async operation
      await act(async () => {
        await Promise.resolve()
      })

      expect(api.getWorkflow).toHaveBeenCalledWith('workflow-1')
      expect(logger.debug).toHaveBeenCalledWith(
        'Reloading workflow from database after deletions:',
        ['node-1']
      )
      expect(mockWorkflowNodeToNode).toHaveBeenCalledTimes(2)
      expect(initializeReactFlowNodes).toHaveBeenCalled()
      expect(formatEdgesForReactFlow).toHaveBeenCalledWith(mockWorkflow.edges)
      expect(mockSetNodes).toHaveBeenCalled()
      expect(mockSetEdges).toHaveBeenCalled()
    })

    it('should handle API error and fall back to local changes', async () => {
      const error = new Error('API Error')
      ;(api.getWorkflow as jest.Mock).mockRejectedValue(error)

      const { result } = renderHook(() =>
        useWorkflowUpdateHandler({
          localWorkflowId: 'workflow-1',
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          workflowNodeToNode: mockWorkflowNodeToNode,
          applyLocalChanges: mockApplyLocalChanges,
        })
      )

      const changes = {
        nodes_to_delete: ['node-1'],
      }

      act(() => {
        result.current.handleWorkflowUpdate(changes)
      })

      // Advance timers to trigger setTimeout
      act(() => {
        jest.advanceTimersByTime(200)
      })

      // Wait for async operation
      await act(async () => {
        await Promise.resolve()
      })

      expect(api.getWorkflow).toHaveBeenCalledWith('workflow-1')
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to reload workflow after deletion:',
        error
      )
      // Should fall back to applying local changes
      expect(mockApplyLocalChanges).toHaveBeenCalledWith(changes)
    })

    it('should log debug message when receiving changes', () => {
      const { result } = renderHook(() =>
        useWorkflowUpdateHandler({
          localWorkflowId: 'workflow-1',
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          workflowNodeToNode: mockWorkflowNodeToNode,
          applyLocalChanges: mockApplyLocalChanges,
        })
      )

      const changes = {
        nodes_to_add: [{ id: 'node-1', type: 'agent' }],
      }

      act(() => {
        result.current.handleWorkflowUpdate(changes)
      })

      expect(logger.debug).toHaveBeenCalledWith('Received workflow changes:', changes)
    })

    it('should handle multiple deletions', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        nodes: [{ id: 'node-2', type: 'condition', data: {} }],
        edges: [],
      }

      ;(api.getWorkflow as jest.Mock).mockResolvedValue(mockWorkflow)

      const { result } = renderHook(() =>
        useWorkflowUpdateHandler({
          localWorkflowId: 'workflow-1',
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          workflowNodeToNode: mockWorkflowNodeToNode,
          applyLocalChanges: mockApplyLocalChanges,
        })
      )

      const changes = {
        nodes_to_delete: ['node-1', 'node-3', 'node-4'],
      }

      act(() => {
        result.current.handleWorkflowUpdate(changes)
      })

      act(() => {
        jest.advanceTimersByTime(200)
      })

      await act(async () => {
        await Promise.resolve()
      })

      expect(api.getWorkflow).toHaveBeenCalledWith('workflow-1')
      expect(logger.debug).toHaveBeenCalledWith(
        'Reloading workflow from database after deletions:',
        ['node-1', 'node-3', 'node-4']
      )
    })

    it('should log reloaded workflow nodes', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        nodes: [
          { id: 'node-1', type: 'agent', data: {} },
          { id: 'node-2', type: 'condition', data: {} },
        ],
        edges: [],
      }

      ;(api.getWorkflow as jest.Mock).mockResolvedValue(mockWorkflow)

      const { result } = renderHook(() =>
        useWorkflowUpdateHandler({
          localWorkflowId: 'workflow-1',
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          workflowNodeToNode: mockWorkflowNodeToNode,
          applyLocalChanges: mockApplyLocalChanges,
        })
      )

      const changes = {
        nodes_to_delete: ['node-1'],
      }

      act(() => {
        result.current.handleWorkflowUpdate(changes)
      })

      act(() => {
        jest.advanceTimersByTime(200)
      })

      await act(async () => {
        await Promise.resolve()
      })

      expect(logger.debug).toHaveBeenCalledWith(
        'Reloaded workflow after deletion, nodes:',
        expect.arrayContaining(['node-1', 'node-2'])
      )
      expect(logger.debug).toHaveBeenCalledWith(
        'Expected deleted nodes:',
        ['node-1']
      )
    })
  })
})
