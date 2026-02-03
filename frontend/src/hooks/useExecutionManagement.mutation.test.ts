/**
 * Mutation tests to kill surviving mutants in useExecutionManagement
 * Focuses on exact comparisons, boundary conditions, and edge cases
 */

import { renderHook, act } from '@testing-library/react'
import { useExecutionManagement } from './useExecutionManagement'
import { api } from '../api/client'
import { logger } from '../utils/logger'
import type { WorkflowTabData, Execution } from '../contexts/WorkflowTabsContext'

jest.mock('../api/client', () => ({
  api: {
    getExecution: jest.fn(),
  },
}))

jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

const mockApi = api as jest.Mocked<typeof api>
const mockLoggerDebug = logger.debug as jest.MockedFunction<typeof logger.debug>
const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>

describe('useExecutionManagement - Mutation Killers', () => {
  let mockSetTabs: jest.Mock
  let mockTabsRef: React.MutableRefObject<WorkflowTabData[]>
  let mockOnExecutionStart: jest.Mock

  const mockTab: WorkflowTabData = {
    id: 'tab-1',
    name: 'Test Workflow',
    workflowId: 'workflow-1',
    isUnsaved: false,
    executions: [],
    activeExecutionId: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockSetTabs = jest.fn((fn) => {
      if (typeof fn === 'function') {
        const currentTabs = mockTabsRef.current
        const newTabs = fn(currentTabs)
        mockTabsRef.current = newTabs
      }
    })
    mockTabsRef = { current: [mockTab] }
    mockOnExecutionStart = jest.fn()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Exact string comparisons', () => {
    describe('executionId.startsWith("pending-")', () => {
      it('should verify exact startsWith check - executionId starts with pending-', () => {
        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [mockTab],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.handleExecutionStart('pending-123')
        })

        // Should create new execution (not replace pending)
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([mockTab]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.executions.some((e: Execution) => e.id === 'pending-123')).toBe(true)
      })

      it('should verify exact startsWith check - executionId does not start with pending-', () => {
        const tabWithPending: WorkflowTabData = {
          ...mockTab,
          executions: [
            { id: 'pending-1', status: 'running', startedAt: new Date(), nodes: {}, logs: [] },
            { id: 'pending-2', status: 'running', startedAt: new Date(), nodes: {}, logs: [] },
          ],
        }
        mockTabsRef.current = [tabWithPending]

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithPending],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.handleExecutionStart('exec-real-1')
        })

        // Should replace oldest pending execution
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithPending]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        // Oldest pending (pending-2, last in array) should be replaced
        expect(updatedTab.executions.some((e: Execution) => e.id === 'exec-real-1')).toBe(true)
      })
    })

    describe('tab.workflowId === workflowId', () => {
      it('should verify exact workflowId comparison - match', () => {
        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [mockTab],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.handleClearExecutions('workflow-1')
        })

        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([mockTab]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.executions).toHaveLength(0)
        expect(updatedTab.activeExecutionId).toBeNull()
      })

      it('should verify exact workflowId comparison - no match', () => {
        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [mockTab],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.handleClearExecutions('workflow-2')
        })

        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([mockTab]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        // Should not clear executions for different workflow
        expect(updatedTab.executions).toEqual(mockTab.executions)
      })
    })

    describe('exec.id === executionId', () => {
      it('should verify exact executionId comparison - match', () => {
        const execution: Execution = {
          id: 'exec-1',
          status: 'running',
          startedAt: new Date(),
          nodes: {},
          logs: [],
        }
        const tabWithExecution: WorkflowTabData = {
          ...mockTab,
          executions: [execution],
          activeExecutionId: 'exec-1',
        }
        mockTabsRef.current = [tabWithExecution]

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.handleExecutionLogUpdate('workflow-1', 'exec-1', { message: 'test log' })
        })

        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        const updatedExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
        expect(updatedExec.logs).toHaveLength(1)
      })

      it('should verify exact executionId comparison - no match', () => {
        const execution: Execution = {
          id: 'exec-1',
          status: 'running',
          startedAt: new Date(),
          nodes: {},
          logs: [],
        }
        const tabWithExecution: WorkflowTabData = {
          ...mockTab,
          executions: [execution],
        }
        mockTabsRef.current = [tabWithExecution]

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.handleExecutionLogUpdate('workflow-1', 'exec-2', { message: 'test log' })
        })

        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        const updatedExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
        // Should not update logs for different execution
        expect(updatedExec.logs).toHaveLength(0)
      })
    })

    describe('tab.activeExecutionId === executionId', () => {
      it('should verify exact activeExecutionId comparison - match', () => {
        const execution1: Execution = {
          id: 'exec-1',
          status: 'running',
          startedAt: new Date(),
          nodes: {},
          logs: [],
        }
        const execution2: Execution = {
          id: 'exec-2',
          status: 'running',
          startedAt: new Date(),
          nodes: {},
          logs: [],
        }
        const tabWithExecutions: WorkflowTabData = {
          ...mockTab,
          executions: [execution1, execution2],
          activeExecutionId: 'exec-1',
        }
        mockTabsRef.current = [tabWithExecutions]

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecutions],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.handleRemoveExecution('workflow-1', 'exec-1')
        })

        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecutions]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        // Should set activeExecutionId to exec-2 (first remaining)
        expect(updatedTab.activeExecutionId).toBe('exec-2')
      })

      it('should verify exact activeExecutionId comparison - no match', () => {
        const execution1: Execution = {
          id: 'exec-1',
          status: 'running',
          startedAt: new Date(),
          nodes: {},
          logs: [],
        }
        const execution2: Execution = {
          id: 'exec-2',
          status: 'running',
          startedAt: new Date(),
          nodes: {},
          logs: [],
        }
        const tabWithExecutions: WorkflowTabData = {
          ...mockTab,
          executions: [execution1, execution2],
          activeExecutionId: 'exec-1',
        }
        mockTabsRef.current = [tabWithExecutions]

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecutions],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.handleRemoveExecution('workflow-1', 'exec-2')
        })

        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecutions]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        // Should keep activeExecutionId as exec-1
        expect(updatedTab.activeExecutionId).toBe('exec-1')
      })
    })
  })

  describe('Boundary conditions', () => {
    describe('pendingExecutions.length === 0', () => {
      it('should verify exact length check - no pending executions', () => {
        const tabWithoutPending: WorkflowTabData = {
          ...mockTab,
          executions: [
            { id: 'exec-1', status: 'running', startedAt: new Date(), nodes: {}, logs: [] },
          ],
        }
        mockTabsRef.current = [tabWithoutPending]

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithoutPending],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.handleExecutionStart('exec-real-1')
        })

        // Should create new execution (not replace, since no pending)
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithoutPending]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.executions.some((e: Execution) => e.id === 'exec-real-1')).toBe(true)
      })
    })

    describe('updatedExecutions.length === 0 vs > 0', () => {
      it('should verify exact length check - length === 0', () => {
        const execution: Execution = {
          id: 'exec-1',
          status: 'running',
          startedAt: new Date(),
          nodes: {},
          logs: [],
        }
        const tabWithExecution: WorkflowTabData = {
          ...mockTab,
          executions: [execution],
          activeExecutionId: 'exec-1',
        }
        mockTabsRef.current = [tabWithExecution]

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.handleRemoveExecution('workflow-1', 'exec-1')
        })

        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        // Should set activeExecutionId to null when no executions remain
        expect(updatedTab.activeExecutionId).toBeNull()
        expect(updatedTab.executions).toHaveLength(0)
      })

      it('should verify exact length check - length > 0', () => {
        const execution1: Execution = {
          id: 'exec-1',
          status: 'running',
          startedAt: new Date(),
          nodes: {},
          logs: [],
        }
        const execution2: Execution = {
          id: 'exec-2',
          status: 'running',
          startedAt: new Date(),
          nodes: {},
          logs: [],
        }
        const tabWithExecutions: WorkflowTabData = {
          ...mockTab,
          executions: [execution1, execution2],
          activeExecutionId: 'exec-1',
        }
        mockTabsRef.current = [tabWithExecutions]

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecutions],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.handleRemoveExecution('workflow-1', 'exec-1')
        })

        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecutions]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        // Should set activeExecutionId to exec-2 (first remaining)
        expect(updatedTab.activeExecutionId).toBe('exec-2')
        expect(updatedTab.executions).toHaveLength(1)
      })
    })
  })

  describe('Logical operators', () => {
    describe('status === "completed" || status === "failed"', () => {
      it('should verify exact OR - status === "completed"', () => {
        const execution: Execution = {
          id: 'exec-1',
          status: 'running',
          startedAt: new Date(),
          nodes: {},
          logs: [],
        }
        const tabWithExecution: WorkflowTabData = {
          ...mockTab,
          executions: [execution],
        }
        mockTabsRef.current = [tabWithExecution]

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.handleExecutionStatusUpdate('workflow-1', 'exec-1', 'completed')
        })

        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        const updatedExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
        expect(updatedExec.status).toBe('completed')
        expect(updatedExec.completedAt).toBeDefined()
      })

      it('should verify exact OR - status === "failed"', () => {
        const execution: Execution = {
          id: 'exec-1',
          status: 'running',
          startedAt: new Date(),
          nodes: {},
          logs: [],
        }
        const tabWithExecution: WorkflowTabData = {
          ...mockTab,
          executions: [execution],
        }
        mockTabsRef.current = [tabWithExecution]

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.handleExecutionStatusUpdate('workflow-1', 'exec-1', 'failed')
        })

        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        const updatedExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
        expect(updatedExec.status).toBe('failed')
        expect(updatedExec.completedAt).toBeDefined()
      })

      it('should verify exact OR - status === "running" (neither)', () => {
        const execution: Execution = {
          id: 'exec-1',
          status: 'running',
          startedAt: new Date(),
          nodes: {},
          logs: [],
          completedAt: new Date(), // Pre-existing completedAt
        }
        const tabWithExecution: WorkflowTabData = {
          ...mockTab,
          executions: [execution],
        }
        mockTabsRef.current = [tabWithExecution]

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.handleExecutionStatusUpdate('workflow-1', 'exec-1', 'running')
        })

        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        const updatedExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
        expect(updatedExec.status).toBe('running')
        // Should preserve existing completedAt (not set new one)
        expect(updatedExec.completedAt).toEqual(execution.completedAt)
      })
    })
  })

  describe('Callback execution', () => {
    it('should verify onExecutionStart callback - undefined', () => {
      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [mockTab],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
          onExecutionStart: undefined,
        })
      )

      act(() => {
        result.current.handleExecutionStart('exec-1')
      })

      // Should not throw, callback is optional
      expect(mockSetTabs).toHaveBeenCalled()
    })

    it('should verify onExecutionStart callback - null', () => {
      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [mockTab],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
          onExecutionStart: null as any,
        })
      )

      act(() => {
        result.current.handleExecutionStart('exec-1')
      })

      // Should not throw, callback is optional
      expect(mockSetTabs).toHaveBeenCalled()
    })
  })

  describe('Polling - exact comparisons', () => {
    it('should verify exec.status !== newStatus - status changed', async () => {
      const execution: Execution = {
        id: 'exec-1',
        status: 'running',
        startedAt: new Date(),
        nodes: {},
        logs: [],
      }
      const tabWithExecution: WorkflowTabData = {
        ...mockTab,
        executions: [execution],
      }
      mockTabsRef.current = [tabWithExecution]

      mockApi.getExecution.mockResolvedValue({
        id: 'exec-1',
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        node_states: {},
        logs: [],
      })

      renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Advance timers to trigger polling
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await act(async () => {
        await Promise.resolve()
      })

      // Should log status change
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringContaining('status changed')
      )
    })

    it('should verify exec.status !== newStatus - status unchanged', async () => {
      const execution: Execution = {
        id: 'exec-1',
        status: 'running',
        startedAt: new Date(),
        nodes: {},
        logs: [],
      }
      const tabWithExecution: WorkflowTabData = {
        ...mockTab,
        executions: [execution],
      }
      mockTabsRef.current = [tabWithExecution]

      mockApi.getExecution.mockResolvedValue({
        id: 'exec-1',
        status: 'running',
        started_at: new Date().toISOString(),
        node_states: {},
        logs: [],
      })

      renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Advance timers to trigger polling
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await act(async () => {
        await Promise.resolve()
      })

      // Should not log status change when status is same
      expect(mockLoggerDebug).not.toHaveBeenCalledWith(
        expect.stringContaining('status changed')
      )
    })

    it('should verify execution.status === "completed" exact comparison', async () => {
      const execution: Execution = {
        id: 'exec-1',
        status: 'running',
        startedAt: new Date(),
        nodes: {},
        logs: [],
      }
      const tabWithExecution: WorkflowTabData = {
        ...mockTab,
        executions: [execution],
      }
      mockTabsRef.current = [tabWithExecution]

      mockApi.getExecution.mockResolvedValue({
        id: 'exec-1',
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        node_states: {},
        logs: [],
      })

      renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      const updatedExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
      expect(updatedExec.status).toBe('completed')
    })

    it('should verify execution.status === "failed" exact comparison', async () => {
      const execution: Execution = {
        id: 'exec-1',
        status: 'running',
        startedAt: new Date(),
        nodes: {},
        logs: [],
      }
      const tabWithExecution: WorkflowTabData = {
        ...mockTab,
        executions: [execution],
      }
      mockTabsRef.current = [tabWithExecution]

      mockApi.getExecution.mockResolvedValue({
        id: 'exec-1',
        status: 'failed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        node_states: {},
        logs: [],
      })

      renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      const updatedExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
      expect(updatedExec.status).toBe('failed')
    })

    it('should verify !exec.id.startsWith("pending-") in error handling', async () => {
      const execution: Execution = {
        id: 'exec-real-1',
        status: 'running',
        startedAt: new Date(),
        nodes: {},
        logs: [],
      }
      const tabWithExecution: WorkflowTabData = {
        ...mockTab,
        executions: [execution],
      }
      mockTabsRef.current = [tabWithExecution]

      mockApi.getExecution.mockRejectedValue(new Error('Not found'))

      renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await act(async () => {
        await Promise.resolve()
      })

      // Should log error for non-pending execution
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch execution'),
        expect.any(Error)
      )
    })

    it('should verify exec.id.startsWith("pending-") in error handling - skip logging', async () => {
      const execution: Execution = {
        id: 'pending-123',
        status: 'running',
        startedAt: new Date(),
        nodes: {},
        logs: [],
      }
      const tabWithExecution: WorkflowTabData = {
        ...mockTab,
        executions: [execution],
      }
      mockTabsRef.current = [tabWithExecution]

      mockApi.getExecution.mockRejectedValue(new Error('Not found'))

      renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await act(async () => {
        await Promise.resolve()
      })

      // Should not log error for pending execution
      expect(mockLoggerError).not.toHaveBeenCalled()
    })
  })

  describe('Optional/nullish handling', () => {
    it('should verify execution.completed_at - null vs undefined vs missing', async () => {
      const execution: Execution = {
        id: 'exec-1',
        status: 'running',
        startedAt: new Date(),
        nodes: {},
        logs: [],
      }
      const tabWithExecution: WorkflowTabData = {
        ...mockTab,
        executions: [execution],
      }
      mockTabsRef.current = [tabWithExecution]

      mockApi.getExecution.mockResolvedValue({
        id: 'exec-1',
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: null, // null value
        node_states: {},
        logs: [],
      })

      renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      const updatedExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
      // Should handle null completed_at
      expect(updatedExec.completedAt).toBeUndefined()
    })

    it('should verify execution.node_states || {} fallback', async () => {
      const execution: Execution = {
        id: 'exec-1',
        status: 'running',
        startedAt: new Date(),
        nodes: {},
        logs: [],
      }
      const tabWithExecution: WorkflowTabData = {
        ...mockTab,
        executions: [execution],
      }
      mockTabsRef.current = [tabWithExecution]

      mockApi.getExecution.mockResolvedValue({
        id: 'exec-1',
        status: 'running',
        started_at: new Date().toISOString(),
        node_states: null, // null value
        logs: [],
      })

      renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      const updatedExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
      // Should use empty object fallback
      expect(updatedExec.nodes).toEqual({})
    })

    it('should verify execution.logs || [] fallback', async () => {
      const execution: Execution = {
        id: 'exec-1',
        status: 'running',
        startedAt: new Date(),
        nodes: {},
        logs: [],
      }
      const tabWithExecution: WorkflowTabData = {
        ...mockTab,
        executions: [execution],
      }
      mockTabsRef.current = [tabWithExecution]

      mockApi.getExecution.mockResolvedValue({
        id: 'exec-1',
        status: 'running',
        started_at: new Date().toISOString(),
        node_states: {},
        logs: null, // null value
      })

      renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      const updatedExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
      // Should use empty array fallback
      expect(updatedExec.logs).toEqual([])
    })

    it('should verify update || exec fallback when update is null', async () => {
      const execution: Execution = {
        id: 'exec-1',
        status: 'running',
        startedAt: new Date(),
        nodes: {},
        logs: [],
      }
      const tabWithExecution: WorkflowTabData = {
        ...mockTab,
        executions: [execution],
      }
      mockTabsRef.current = [tabWithExecution]

      mockApi.getExecution.mockRejectedValue(new Error('Not found'))

      renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      const updatedExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
      // Should keep original execution when update is null
      expect(updatedExec).toEqual(execution)
    })
  })
})
