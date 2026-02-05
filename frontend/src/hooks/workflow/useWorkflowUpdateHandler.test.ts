/**
 * Tests for useWorkflowUpdateHandler hook
 */

import { renderHook, act } from '@testing-library/react'
import { useWorkflowUpdateHandler } from './useWorkflowUpdateHandler'
import { api } from '../../api/client'
import { logger } from '../../utils/logger'
import { initializeReactFlowNodes, formatEdgesForReactFlow } from '../../utils/workflowFormat'
import type { Node, Edge } from '@xyflow/react'

// Mock the API client
jest.mock('../../api/client', () => ({
  api: {
    getWorkflow: jest.fn(),
  }
}))

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  }
}))

// Mock workflow format utilities
jest.mock('../../utils/workflowFormat', () => ({
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

  afterEach(async () => {
    // Run all pending timers to ensure setTimeout callbacks complete
    // This prevents timeouts in mutation testing when async operations are mutated
    // Advance timers multiple times to ensure async operations complete
    jest.advanceTimersByTime(0)
    jest.runOnlyPendingTimers()
    jest.runAllTimers()
    // Give async operations time to complete by advancing timers
    jest.advanceTimersByTime(100)
    // Wait for any pending promises
    await Promise.resolve()
    await Promise.resolve()
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

  describe('mutation killers - exact conditionals and operators', () => {
    describe('handleWorkflowUpdate - exact conditional checks', () => {
      it('should verify exact conditional: if (!changes)', () => {
        const { result } = renderHook(() =>
          useWorkflowUpdateHandler({
            localWorkflowId: 'workflow-1',
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            workflowNodeToNode: mockWorkflowNodeToNode,
            applyLocalChanges: mockApplyLocalChanges,
          })
        )

        // Test with null
        act(() => {
          result.current.handleWorkflowUpdate(null)
        })

        // Verify exact falsy check: if (!changes)
        expect(mockApplyLocalChanges).not.toHaveBeenCalled()
        expect(api.getWorkflow).not.toHaveBeenCalled()

        // Test with undefined
        act(() => {
          result.current.handleWorkflowUpdate(undefined as any)
        })

        expect(mockApplyLocalChanges).not.toHaveBeenCalled()
        expect(api.getWorkflow).not.toHaveBeenCalled()
      })

      it('should verify exact conditional: if (hasDeletions && localWorkflowId) - both true', async () => {
        const mockWorkflow = {
          id: 'workflow-1',
          name: 'Test Workflow',
          nodes: [],
          edges: [],
        }

        ;(api.getWorkflow as jest.Mock).mockResolvedValue(mockWorkflow)

        const { result } = renderHook(() =>
          useWorkflowUpdateHandler({
            localWorkflowId: 'workflow-1', // Truthy
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            workflowNodeToNode: mockWorkflowNodeToNode,
            applyLocalChanges: mockApplyLocalChanges,
          })
        )

        const changes = {
          nodes_to_delete: ['node-1'], // hasDeletions is true
        }

        act(() => {
          result.current.handleWorkflowUpdate(changes)
        })

        // Advance timers to trigger setTimeout
        act(() => {
          jest.advanceTimersByTime(200)
        })

        await act(async () => {
          await Promise.resolve()
        })

        // Verify exact conditional: if (hasDeletions && localWorkflowId) - both true
        // Should reload from database
        expect(mockApplyLocalChanges).not.toHaveBeenCalled()
        expect(api.getWorkflow).toHaveBeenCalled()
      })

      it('should verify exact conditional: if (hasDeletions && localWorkflowId) - first true, second false', () => {
        const { result } = renderHook(() =>
          useWorkflowUpdateHandler({
            localWorkflowId: null, // Falsy
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            workflowNodeToNode: mockWorkflowNodeToNode,
            applyLocalChanges: mockApplyLocalChanges,
          })
        )

        const changes = {
          nodes_to_delete: ['node-1'], // hasDeletions is true
        }

        act(() => {
          result.current.handleWorkflowUpdate(changes)
        })

        // Verify exact conditional: if (hasDeletions && localWorkflowId) - first true, second false
        // Should apply local changes (not reload)
        expect(mockApplyLocalChanges).toHaveBeenCalledWith(changes)
        expect(api.getWorkflow).not.toHaveBeenCalled()
      })

      it('should verify exact conditional: if (hasDeletions && localWorkflowId) - first false', () => {
        const { result } = renderHook(() =>
          useWorkflowUpdateHandler({
            localWorkflowId: 'workflow-1', // Truthy
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            workflowNodeToNode: mockWorkflowNodeToNode,
            applyLocalChanges: mockApplyLocalChanges,
          })
        )

        const changes = {
          nodes_to_add: [{ id: 'node-1' }], // No deletions - hasDeletions is false
        }

        act(() => {
          result.current.handleWorkflowUpdate(changes)
        })

        // Verify exact conditional: if (hasDeletions && localWorkflowId) - first false
        // Should apply local changes (not reload)
        expect(mockApplyLocalChanges).toHaveBeenCalledWith(changes)
        expect(api.getWorkflow).not.toHaveBeenCalled()
      })
    })

    describe('handleWorkflowUpdate - exact logical AND operator', () => {
      it('should verify exact logical AND: changes.nodes_to_delete && changes.nodes_to_delete.length > 0', async () => {
        const mockWorkflow = {
          id: 'workflow-1',
          name: 'Test Workflow',
          nodes: [],
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

        // Test branch 1: changes.nodes_to_delete exists and length > 0
        const changes1 = {
          nodes_to_delete: ['node-1'], // Both conditions true
        }

        act(() => {
          result.current.handleWorkflowUpdate(changes1)
        })

        // Advance timers to trigger setTimeout
        act(() => {
          jest.advanceTimersByTime(200)
        })

        await act(async () => {
          await Promise.resolve()
        })

        expect(api.getWorkflow).toHaveBeenCalled()

        // Reset for next test
        jest.clearAllMocks()

        // Test branch 2: changes.nodes_to_delete exists but length === 0

        const changes2 = {
          nodes_to_delete: [], // First true, second false
        }

        act(() => {
          result.current.handleWorkflowUpdate(changes2)
        })

        expect(mockApplyLocalChanges).toHaveBeenCalledWith(changes2)
        expect(api.getWorkflow).not.toHaveBeenCalled()

        // Test branch 3: changes.nodes_to_delete is null/undefined
        mockApplyLocalChanges.mockClear()

        const changes3 = {
          nodes_to_add: [{ id: 'node-1' }], // First false
        }

        act(() => {
          result.current.handleWorkflowUpdate(changes3)
        })

        expect(mockApplyLocalChanges).toHaveBeenCalledWith(changes3)
        expect(api.getWorkflow).not.toHaveBeenCalled()
      })
    })

    describe('handleWorkflowUpdate - exact logical OR operator', () => {
      it('should verify exact logical OR: workflow.edges || []', async () => {
        const mockWorkflow = {
          id: 'workflow-1',
          name: 'Test Workflow',
          nodes: [],
          edges: null, // null - should use fallback
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

        // Verify exact logical OR: workflow.edges || []
        expect(formatEdgesForReactFlow).toHaveBeenCalledWith([])
      })
    })

    describe('handleWorkflowUpdate - exact setTimeout delay', () => {
      it('should verify exact setTimeout delay: 200ms', () => {
        const mockWorkflow = {
          id: 'workflow-1',
          name: 'Test Workflow',
          nodes: [],
          edges: [],
        }

        ;(api.getWorkflow as jest.Mock).mockResolvedValue(mockWorkflow)

        const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

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

        // Verify exact setTimeout delay: 200ms
        const setTimeoutCalls = setTimeoutSpy.mock.calls
        const delay200Call = setTimeoutCalls.find((call: any[]) => call[1] === 200)
        expect(delay200Call).toBeDefined()

        setTimeoutSpy.mockRestore()
      })
    })
  })
})
