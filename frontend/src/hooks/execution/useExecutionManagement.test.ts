import { renderHook, act, waitFor } from '@testing-library/react'
import { useExecutionManagement } from './useExecutionManagement'
import { api } from '../../api/client'
import { logger } from '../../utils/logger'
import type { WorkflowTabData, Execution } from '../../contexts/WorkflowTabsContext'

jest.mock('../../api/client', () => ({
  api: {
    getExecution: jest.fn(),
  },
}))

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

const mockApi = api as jest.Mocked<typeof api>
const mockLoggerDebug = logger.debug as jest.MockedFunction<typeof logger.debug>
const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>

describe('useExecutionManagement', () => {
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
    mockSetTabs = jest.fn()
    mockTabsRef = { current: [mockTab] }
    mockOnExecutionStart = jest.fn()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('handleExecutionStart', () => {
    it('should return early when no active tab', () => {
      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [],
          activeTabId: null,
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.handleExecutionStart('exec-1')
      })

      expect(mockSetTabs).not.toHaveBeenCalled()
    })

    it('should create new execution when none exist', () => {
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
        result.current.handleExecutionStart('exec-1')
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([mockTab]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      expect(updatedTab.executions).toHaveLength(1)
      expect(updatedTab.executions[0].id).toBe('exec-1')
      expect(updatedTab.activeExecutionId).toBe('exec-1')
      expect(mockOnExecutionStart).toHaveBeenCalledWith('exec-1')
    })

    it('should create pending execution', () => {
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

      expect(mockSetTabs).toHaveBeenCalled()
      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([mockTab]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      expect(updatedTab.executions[0].id).toBe('pending-123')
    })

    it('should replace oldest pending execution with real execution ID', () => {
      const tabWithPending: WorkflowTabData = {
        ...mockTab,
        executions: [
          { id: 'pending-1', status: 'running', startedAt: new Date(), nodes: {}, logs: [] },
          { id: 'pending-2', status: 'running', startedAt: new Date(), nodes: {}, logs: [] },
        ],
      }

      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithPending],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: { current: [tabWithPending] },
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.handleExecutionStart('exec-real')
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithPending]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      // Should replace pending-2 (oldest, last in array)
      expect(updatedTab.executions.find((e: Execution) => e.id === 'exec-real')).toBeDefined()
      expect(updatedTab.executions.find((e: Execution) => e.id === 'pending-2')).toBeUndefined()
    })

    it('should update activeExecutionId when execution already exists', () => {
      const existingExecution: Execution = {
        id: 'exec-1',
        status: 'running',
        startedAt: new Date(),
        nodes: {},
        logs: [],
      }
      const tabWithExecution: WorkflowTabData = {
        ...mockTab,
        executions: [existingExecution],
        activeExecutionId: null,
      }

      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: { current: [tabWithExecution] },
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.handleExecutionStart('exec-1')
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      expect(updatedTab.activeExecutionId).toBe('exec-1')
      expect(updatedTab.executions).toHaveLength(1)
    })

    it('should not call onExecutionStart when not provided', () => {
      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [mockTab],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      act(() => {
        result.current.handleExecutionStart('exec-1')
      })

      expect(mockOnExecutionStart).not.toHaveBeenCalled()
    })

    it('should prepend new execution to existing executions', () => {
      const existingExecution: Execution = {
        id: 'exec-1',
        status: 'running',
        startedAt: new Date(),
        nodes: {},
        logs: [],
      }
      const tabWithExecution: WorkflowTabData = {
        ...mockTab,
        executions: [existingExecution],
      }

      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: { current: [tabWithExecution] },
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.handleExecutionStart('exec-2')
      })

      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      expect(updatedTab.executions[0].id).toBe('exec-2')
      expect(updatedTab.executions[1].id).toBe('exec-1')
    })
  })

  describe('handleClearExecutions', () => {
    it('should clear executions for matching workflow', () => {
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

      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      act(() => {
        result.current.handleClearExecutions('workflow-1')
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      expect(updatedTab.executions).toHaveLength(0)
      expect(updatedTab.activeExecutionId).toBeNull()
    })

    it('should not affect other workflows', () => {
      const tab1: WorkflowTabData = {
        ...mockTab,
        workflowId: 'workflow-1',
        executions: [{ id: 'exec-1', status: 'running', startedAt: new Date(), nodes: {}, logs: [] }],
      }
      const tab2: WorkflowTabData = {
        id: 'tab-2',
        name: 'Other Workflow',
        workflowId: 'workflow-2',
        isUnsaved: false,
        executions: [{ id: 'exec-2', status: 'running', startedAt: new Date(), nodes: {}, logs: [] }],
        activeExecutionId: 'exec-2',
      }

      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [tab1, tab2],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: { current: [tab1, tab2] },
        })
      )

      act(() => {
        result.current.handleClearExecutions('workflow-1')
      })

      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tab1, tab2]) : setTabsCall
      const updatedTab2 = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-2')
      expect(updatedTab2.executions).toHaveLength(1)
    })
  })

  describe('handleRemoveExecution', () => {
    it('should remove execution from matching workflow', () => {
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

      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecutions],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      act(() => {
        result.current.handleRemoveExecution('workflow-1', 'exec-1')
      })

      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecutions]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      expect(updatedTab.executions).toHaveLength(1)
      expect(updatedTab.executions[0].id).toBe('exec-2')
      expect(updatedTab.activeExecutionId).toBe('exec-2')
    })

    it('should set activeExecutionId to null when removing last execution', () => {
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

      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      act(() => {
        result.current.handleRemoveExecution('workflow-1', 'exec-1')
      })

      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      expect(updatedTab.executions).toHaveLength(0)
      expect(updatedTab.activeExecutionId).toBeNull()
    })

    it('should not change activeExecutionId when removing non-active execution', () => {
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

      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecutions],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      act(() => {
        result.current.handleRemoveExecution('workflow-1', 'exec-2')
      })

      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecutions]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      expect(updatedTab.activeExecutionId).toBe('exec-1')
    })
  })

  describe('handleExecutionLogUpdate', () => {
    it('should add log to matching execution', () => {
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

      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      const newLog = { message: 'Test log', timestamp: new Date() }

      act(() => {
        result.current.handleExecutionLogUpdate('workflow-1', 'exec-1', newLog)
      })

      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      const updatedExecution = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
      expect(updatedExecution.logs).toHaveLength(1)
      expect(updatedExecution.logs[0]).toEqual(newLog)
    })

    it('should not affect other executions', () => {
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
        logs: ['existing log'],
      }
      const tabWithExecutions: WorkflowTabData = {
        ...mockTab,
        executions: [execution1, execution2],
      }

      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecutions],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      act(() => {
        result.current.handleExecutionLogUpdate('workflow-1', 'exec-1', { message: 'New log' })
      })

      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecutions]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      const exec2 = updatedTab.executions.find((e: Execution) => e.id === 'exec-2')
      expect(exec2.logs).toHaveLength(1)
      expect(exec2.logs[0]).toBe('existing log')
    })
  })

  describe('handleExecutionStatusUpdate', () => {
    it('should update status to completed', () => {
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

      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      act(() => {
        result.current.handleExecutionStatusUpdate('workflow-1', 'exec-1', 'completed')
      })

      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      const updatedExecution = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
      expect(updatedExecution.status).toBe('completed')
      expect(updatedExecution.completedAt).toBeDefined()
    })

    it('should update status to failed', () => {
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

      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      act(() => {
        result.current.handleExecutionStatusUpdate('workflow-1', 'exec-1', 'failed')
      })

      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      const updatedExecution = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
      expect(updatedExecution.status).toBe('failed')
      expect(updatedExecution.completedAt).toBeDefined()
    })

    it('should not set completedAt when status is running', () => {
      const execution: Execution = {
        id: 'exec-1',
        status: 'running',
        startedAt: new Date(),
        nodes: {},
        logs: [],
        completedAt: undefined,
      }
      const tabWithExecution: WorkflowTabData = {
        ...mockTab,
        executions: [execution],
      }

      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      act(() => {
        result.current.handleExecutionStatusUpdate('workflow-1', 'exec-1', 'running')
      })

      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      const updatedExecution = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
      expect(updatedExecution.completedAt).toBeUndefined()
    })
  })

  describe('handleExecutionNodeUpdate', () => {
    it('should update node state for matching execution', () => {
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

      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      const nodeState = { status: 'completed', output: 'result' }

      act(() => {
        result.current.handleExecutionNodeUpdate('workflow-1', 'exec-1', 'node-1', nodeState)
      })

      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      const updatedExecution = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
      expect(updatedExecution.nodes['node-1']).toEqual(nodeState)
    })

    it('should preserve existing node states', () => {
      const execution: Execution = {
        id: 'exec-1',
        status: 'running',
        startedAt: new Date(),
        nodes: { 'node-1': { status: 'running' } },
        logs: [],
      }
      const tabWithExecution: WorkflowTabData = {
        ...mockTab,
        executions: [execution],
      }

      const { result } = renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      act(() => {
        result.current.handleExecutionNodeUpdate('workflow-1', 'exec-1', 'node-2', { status: 'completed' })
      })

      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
      const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
      const updatedExecution = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
      expect(updatedExecution.nodes['node-1']).toEqual({ status: 'running' })
      expect(updatedExecution.nodes['node-2']).toEqual({ status: 'completed' })
    })
  })

  describe('polling effect', () => {
    it('should not poll when no running executions', async () => {
      renderHook(() =>
        useExecutionManagement({
          tabs: [mockTab],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(mockApi.getExecution).not.toHaveBeenCalled()
    })

    it('should poll running executions', async () => {
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

      mockApi.getExecution.mockResolvedValue({
        id: 'exec-1',
        status: 'completed',
        completed_at: new Date().toISOString(),
        node_states: {},
        logs: [],
      } as any)

      mockTabsRef.current = [tabWithExecution]

      renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(mockApi.getExecution).toHaveBeenCalledWith('exec-1')
      })
    })

    it('should not poll pending executions', async () => {
      const pendingExecution: Execution = {
        id: 'pending-123',
        status: 'running',
        startedAt: new Date(),
        nodes: {},
        logs: [],
      }
      const tabWithPending: WorkflowTabData = {
        ...mockTab,
        executions: [pendingExecution],
      }

      mockTabsRef.current = [tabWithPending]

      renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithPending],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(mockApi.getExecution).not.toHaveBeenCalled()
    })

    it('should handle execution status changes', async () => {
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

      mockApi.getExecution.mockResolvedValue({
        id: 'exec-1',
        status: 'failed',
        completed_at: new Date().toISOString(),
        node_states: {},
        logs: [],
      } as any)

      mockTabsRef.current = [tabWithExecution]

      renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(mockSetTabs).toHaveBeenCalled()
      })

      const setTabsCall = mockSetTabs.mock.calls.find((call) => {
        const updatedTabs = typeof call[0] === 'function' ? call[0]([tabWithExecution]) : call[0]
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        return updatedTab && updatedTab.executions[0]?.status === 'failed'
      })
      expect(setTabsCall).toBeDefined()
    })

    it('should handle paused status as running', async () => {
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

      mockApi.getExecution.mockResolvedValue({
        id: 'exec-1',
        status: 'paused',
        node_states: {},
        logs: [],
      } as any)

      mockTabsRef.current = [tabWithExecution]

      renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(mockSetTabs).toHaveBeenCalled()
      })

      const setTabsCall = mockSetTabs.mock.calls.find((call) => {
        const updatedTabs = typeof call[0] === 'function' ? call[0]([tabWithExecution]) : call[0]
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        return updatedTab && updatedTab.executions[0]?.status === 'running'
      })
      expect(setTabsCall).toBeDefined()
    })

    it('should handle API errors gracefully', async () => {
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

      mockApi.getExecution.mockRejectedValue(new Error('API Error'))

      mockTabsRef.current = [tabWithExecution]

      renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(mockLoggerError).toHaveBeenCalled()
      })
    })

    it('should not log errors for pending executions', async () => {
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

      mockApi.getExecution.mockRejectedValue(new Error('Not found'))

      mockTabsRef.current = [tabWithExecution]

      renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      // Should not log error for pending executions
      expect(mockLoggerError).not.toHaveBeenCalled()
    })

    it('should clean up interval on unmount', () => {
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

      const { unmount } = renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

      unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()
      clearIntervalSpy.mockRestore()
    })
  })

  describe('edge cases and error handling', () => {
    describe('handleExecutionStart edge cases', () => {
      it('should handle executionId starting with pending- when no pending executions exist', () => {
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

        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([mockTab]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.executions[0].id).toBe('pending-123')
      })

      it('should handle replacing oldest pending execution when multiple exist', () => {
        const tabWithPending: WorkflowTabData = {
          ...mockTab,
          executions: [
            { id: 'pending-1', status: 'running' as const, startedAt: new Date(), nodes: {}, logs: [] },
            { id: 'pending-2', status: 'running' as const, startedAt: new Date(), nodes: {}, logs: [] },
          ],
        }

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
          result.current.handleExecutionStart('exec-real')
        })

        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithPending]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        // Should replace pending-2 (oldest, last in pendingExecutions array at index 1)
        const realExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-real')
        expect(realExec).toBeDefined()
        // pending-2 should be replaced, pending-1 should remain
        expect(updatedTab.executions.find((e: Execution) => e.id === 'pending-1')).toBeDefined()
        expect(updatedTab.executions.find((e: Execution) => e.id === 'pending-2')).toBeUndefined()
        // Check that pending-2 was replaced (exec-real should be at index 1)
        expect(updatedTab.executions[1].id).toBe('exec-real')
        expect(updatedTab.executions[0].id).toBe('pending-1')
      })

      it('should handle executionId that already exists', () => {
        const existingExecution: Execution = {
          id: 'exec-1',
          status: 'running',
          startedAt: new Date(),
          nodes: {},
          logs: [],
        }
        const tabWithExecution: WorkflowTabData = {
          ...mockTab,
          executions: [existingExecution],
        }

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
          result.current.handleExecutionStart('exec-1')
        })

        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.executions).toHaveLength(1)
        expect(updatedTab.activeExecutionId).toBe('exec-1')
      })

      it('should handle onExecutionStart as undefined', () => {
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

        expect(mockSetTabs).toHaveBeenCalled()
      })

      it('should handle activeTabId as null', () => {
        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [mockTab],
            activeTabId: null,
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.handleExecutionStart('exec-1')
        })

        expect(mockSetTabs).not.toHaveBeenCalled()
      })

      it('should handle tab.id not matching activeTabId', () => {
        const otherTab: WorkflowTabData = {
          ...mockTab,
          id: 'tab-2',
        }

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [otherTab],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.handleExecutionStart('exec-1')
        })

        // setTabs is called, but tab-2 is not updated because activeTabId is 'tab-1' (no active tab found)
        // Actually, handleExecutionStart returns early if no activeTab is found
        expect(mockSetTabs).not.toHaveBeenCalled()
      })
    })

    describe('handleClearExecutions edge cases', () => {
      it('should handle workflowId that does not exist', () => {
        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [mockTab],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
          })
        )

        act(() => {
          result.current.handleClearExecutions('non-existent-workflow')
        })

        // setTabs is still called, but no tab is updated because workflowId doesn't match
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([mockTab]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.executions).toHaveLength(0) // Still empty, no change
      })

      it('should handle tab with no executions', () => {
        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [mockTab],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
          })
        )

        act(() => {
          result.current.handleClearExecutions('workflow-1')
        })

        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([mockTab]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.executions).toHaveLength(0)
        expect(updatedTab.activeExecutionId).toBeNull()
      })
    })

    describe('handleRemoveExecution edge cases', () => {
      it('should handle removing execution when it is activeExecutionId', () => {
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

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
          })
        )

        act(() => {
          result.current.handleRemoveExecution('workflow-1', 'exec-1')
        })

        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.executions).toHaveLength(0)
        expect(updatedTab.activeExecutionId).toBeNull()
      })

      it('should handle removing execution when workflowId does not match', () => {
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

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
          })
        )

        act(() => {
          result.current.handleRemoveExecution('wrong-workflow', 'exec-1')
        })

        // setTabs is still called, but tab is not updated because workflowId doesn't match
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.executions).toHaveLength(1) // Execution should still be there
      })

      it('should handle removing non-existent execution', () => {
        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [mockTab],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
          })
        )

        act(() => {
          result.current.handleRemoveExecution('workflow-1', 'non-existent-exec')
        })

        // setTabs is still called, but execution list remains unchanged
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([mockTab]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.executions).toHaveLength(0) // Still empty
      })
    })

    describe('handleExecutionLogUpdate edge cases', () => {
      it('should handle executionId that does not exist', () => {
        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [mockTab],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
          })
        )

        const newLog = { message: 'Test log', timestamp: new Date() }
        act(() => {
          result.current.handleExecutionLogUpdate('workflow-1', 'non-existent-exec', newLog)
        })

        // setTabs is still called, but execution is not updated (map returns same exec)
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([mockTab]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.executions).toHaveLength(0) // No executions to update
      })

      it('should handle workflowId that does not match', () => {
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

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
          })
        )

        const newLog = { message: 'Test log', timestamp: new Date() }
        act(() => {
          result.current.handleExecutionLogUpdate('wrong-workflow', 'exec-1', newLog)
        })

        // setTabs is still called, but tab is not updated because workflowId doesn't match (returns tab unchanged)
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.executions[0].logs).toHaveLength(0) // Log should not be added
      })
    })

    describe('handleExecutionStatusUpdate edge cases', () => {
      it('should handle executionId that does not exist', () => {
        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [mockTab],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
          })
        )

        act(() => {
          result.current.handleExecutionStatusUpdate('workflow-1', 'non-existent-exec', 'completed')
        })

        // setTabs is still called, but execution is not updated
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([mockTab]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.executions).toHaveLength(0)
      })

      it('should handle workflowId that does not match', () => {
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

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
          })
        )

        act(() => {
          result.current.handleExecutionStatusUpdate('wrong-workflow', 'exec-1', 'completed')
        })

        // setTabs is still called, but tab is not updated because workflowId doesn't match
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.executions[0].status).toBe('running') // Status should not change
      })
    })

    describe('handleExecutionNodeUpdate edge cases', () => {
      it('should handle executionId that does not exist', () => {
        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [mockTab],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
          })
        )

        act(() => {
          result.current.handleExecutionNodeUpdate('workflow-1', 'non-existent-exec', 'node-1', { status: 'running' })
        })

        // setTabs is still called, but execution is not updated
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([mockTab]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.executions).toHaveLength(0)
      })

      it('should handle workflowId that does not match', () => {
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

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
          })
        )

        act(() => {
          result.current.handleExecutionNodeUpdate('wrong-workflow', 'exec-1', 'node-1', { status: 'running' })
        })

        // setTabs is still called, but tab is not updated because workflowId doesn't match
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.executions[0].nodes).toEqual({}) // Nodes should not be updated
      })
    })
  })

  describe('mutation killers for polling useEffect', () => {
    it('should verify runningExecutions.length === 0 early return', async () => {
      renderHook(() =>
        useExecutionManagement({
          tabs: [mockTab],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      // Advance timers to trigger polling
      await act(async () => {
        jest.advanceTimersByTime(2000)
        await Promise.resolve()
      })

      // When no running executions, should not call api.getExecution
      expect(mockApi.getExecution).not.toHaveBeenCalled()
    })

    it('should verify execution.status === completed check', async () => {
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
        })
      )

      await act(async () => {
        jest.advanceTimersByTime(2000)
        await Promise.resolve()
      })

      // Should call getExecution and update status to completed
      expect(mockApi.getExecution).toHaveBeenCalledWith('exec-1')
      expect(mockSetTabs).toHaveBeenCalled()
    })

    it('should verify execution.status === failed check', async () => {
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
        })
      )

      await act(async () => {
        jest.advanceTimersByTime(2000)
        await Promise.resolve()
      })

      // Should update status to failed
      expect(mockApi.getExecution).toHaveBeenCalledWith('exec-1')
      expect(mockSetTabs).toHaveBeenCalled()
    })

    it('should verify execution.status === paused check', async () => {
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
        status: 'paused',
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
        })
      )

      await act(async () => {
        jest.advanceTimersByTime(2000)
        await Promise.resolve()
      })

      // Should keep status as running when paused
      expect(mockApi.getExecution).toHaveBeenCalledWith('exec-1')
      expect(mockSetTabs).toHaveBeenCalled()
    })

    it('should verify exec.status !== newStatus check', async () => {
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
        status: 'running', // Same status
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
        })
      )

      await act(async () => {
        jest.advanceTimersByTime(2000)
        await Promise.resolve()
      })

      // Should still call getExecution even if status hasn't changed
      expect(mockApi.getExecution).toHaveBeenCalledWith('exec-1')
    })

    it('should verify exact logger.debug message for status change', async () => {
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
        })
      )

      await act(async () => {
        jest.advanceTimersByTime(2000)
        await Promise.resolve()
      })

      // Verify exact log message format
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringMatching(/\[WorkflowTabs\] Execution exec-1 status changed: running → completed/)
      )
    })

    it('should verify exact logger.debug message for polling', async () => {
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
        })
      )

      await act(async () => {
        jest.advanceTimersByTime(2000)
        await Promise.resolve()
      })

      // Verify exact polling log message
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringMatching(/\[WorkflowTabs\] Polling \d+ running execution\(s\) \(fallback\)\.\.\./)
      )
    })

    it('should verify error handling for 404 on non-pending execution', async () => {
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
      const error: any = new Error('Not found')
      error.response = { status: 404 }
      mockApi.getExecution.mockRejectedValue(error)

      renderHook(() =>
        useExecutionManagement({
          tabs: [tabWithExecution],
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          tabsRef: mockTabsRef,
        })
      )

      await act(async () => {
        jest.advanceTimersByTime(2000)
        await Promise.resolve()
      })

      // Should log error for non-pending execution
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringContaining('[WorkflowTabs] Failed to fetch execution exec-1:'),
        error
      )
    })

    it('should verify error handling skips logging for pending execution', async () => {
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
        })
      )

      await act(async () => {
        jest.advanceTimersByTime(2000)
        await Promise.resolve()
      })

      // Should not log error for pending execution
      const errorLogs = mockLoggerError.mock.calls.filter((call: any[]) =>
        call[0] && typeof call[0] === 'string' && call[0].includes('pending-123')
      )
      expect(errorLogs.length).toBe(0)
    })
  })

  describe('additional coverage for no-coverage mutants', () => {
    describe('handleExecutionStart - edge cases', () => {
      it('should handle pendingExecutions.length === 0 when executionId does not start with pending-', () => {
        const tabWithoutPending: WorkflowTabData = {
          ...mockTab,
          executions: [
            { id: 'exec-existing', status: 'running', startedAt: new Date(), nodes: {}, logs: [] },
          ],
        }

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithoutPending],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: { current: [tabWithoutPending] },
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.handleExecutionStart('exec-new')
        })

        // Should create new execution since no pending executions exist
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithoutPending]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.executions.find((e: Execution) => e.id === 'exec-new')).toBeDefined()
      })

      it('should handle executionId.startsWith exact comparison with pending-', () => {
        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [mockTab],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        // Test exact 'pending-' prefix
        act(() => {
          result.current.handleExecutionStart('pending-exact')
        })

        // Should not try to replace pending execution (it IS a pending execution)
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([mockTab]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.executions[0].id).toBe('pending-exact')
      })

      it('should handle onExecutionStart is undefined', () => {
        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [mockTab],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
            onExecutionStart: undefined, // No callback
          })
        )

        act(() => {
          result.current.handleExecutionStart('exec-1')
        })

        // Should not crash when onExecutionStart is undefined
        expect(mockSetTabs).toHaveBeenCalled()
      })

      it('should handle tab.id === activeTabId exact comparison', () => {
        const tab1: WorkflowTabData = { ...mockTab, id: 'tab-1' }
        const tab2: WorkflowTabData = { ...mockTab, id: 'tab-2', workflowId: 'workflow-2' }

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tab1, tab2],
            activeTabId: 'tab-1', // Exact match
            setTabs: mockSetTabs,
            tabsRef: { current: [tab1, tab2] },
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.handleExecutionStart('exec-1')
        })

        // Should only update tab-1, not tab-2
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tab1, tab2]) : setTabsCall
        const updatedTab1 = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        const updatedTab2 = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-2')
        expect(updatedTab1.executions.length).toBe(1)
        expect(updatedTab2.executions.length).toBe(0)
      })
    })

    describe('handleRemoveExecution - boundary conditions', () => {
      it('should handle updatedExecutions.length === 0 exact boundary', () => {
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

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: { current: [tabWithExecution] },
          })
        )

        act(() => {
          result.current.handleRemoveExecution('workflow-1', 'exec-1')
        })

        // Should set activeExecutionId to null when updatedExecutions.length === 0
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.activeExecutionId).toBeNull()
        expect(updatedTab.executions.length).toBe(0)
      })

      it('should handle updatedExecutions.length > 0 and set first execution as active', () => {
        const executions: Execution[] = [
          { id: 'exec-1', status: 'running', startedAt: new Date(), nodes: {}, logs: [] },
          { id: 'exec-2', status: 'running', startedAt: new Date(), nodes: {}, logs: [] },
        ]
        const tabWithExecutions: WorkflowTabData = {
          ...mockTab,
          executions,
          activeExecutionId: 'exec-1',
        }

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecutions],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: { current: [tabWithExecutions] },
          })
        )

        act(() => {
          result.current.handleRemoveExecution('workflow-1', 'exec-1')
        })

        // Should set activeExecutionId to exec-2 (first remaining execution)
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecutions]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.activeExecutionId).toBe('exec-2')
        expect(updatedTab.executions.length).toBe(1)
      })

      it('should handle tab.activeExecutionId === executionId exact comparison', () => {
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
          activeExecutionId: 'exec-1', // Exact match
        }

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: { current: [tabWithExecution] },
          })
        )

        act(() => {
          result.current.handleRemoveExecution('workflow-1', 'exec-1')
        })

        // Should update activeExecutionId since it matches
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        expect(updatedTab.activeExecutionId).toBeNull()
      })
    })

    describe('handleExecutionStatusUpdate - status combinations', () => {
      it('should handle status === completed exact comparison', () => {
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

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: { current: [tabWithExecution] },
          })
        )

        act(() => {
          result.current.handleExecutionStatusUpdate('workflow-1', 'exec-1', 'completed')
        })

        // Should set completedAt when status === 'completed'
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        const updatedExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
        expect(updatedExec.status).toBe('completed')
        expect(updatedExec.completedAt).toBeDefined()
      })

      it('should handle status === failed exact comparison', () => {
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

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: { current: [tabWithExecution] },
          })
        )

        act(() => {
          result.current.handleExecutionStatusUpdate('workflow-1', 'exec-1', 'failed')
        })

        // Should set completedAt when status === 'failed'
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        const updatedExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
        expect(updatedExec.status).toBe('failed')
        expect(updatedExec.completedAt).toBeDefined()
      })

      it('should handle status === running and preserve completedAt', () => {
        const execution: Execution = {
          id: 'exec-1',
          status: 'completed',
          startedAt: new Date(),
          completedAt: new Date('2024-01-01'),
          nodes: {},
          logs: [],
        }
        const tabWithExecution: WorkflowTabData = {
          ...mockTab,
          executions: [execution],
        }

        const { result } = renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: { current: [tabWithExecution] },
          })
        )

        act(() => {
          result.current.handleExecutionStatusUpdate('workflow-1', 'exec-1', 'running')
        })

        // Should preserve completedAt when status is 'running'
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        const updatedExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
        expect(updatedExec.status).toBe('running')
        expect(updatedExec.completedAt).toEqual(new Date('2024-01-01'))
      })
    })

    describe('useEffect polling - edge cases', () => {
      it('should handle execution.status === paused exact comparison', async () => {
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
          status: 'paused' as any, // Paused status
          started_at: new Date().toISOString(),
        } as any)

        renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
          })
        )

        await act(async () => {
          jest.advanceTimersByTime(2000)
          await Promise.resolve()
        })

        // Should map 'paused' to 'running'
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        const updatedExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
        expect(updatedExec.status).toBe('running')
      })

      it('should handle execution.completed_at is null', async () => {
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
          completed_at: null, // Null completed_at
        } as any)

        renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
          })
        )

        await act(async () => {
          jest.advanceTimersByTime(2000)
          await Promise.resolve()
        })

        // Should use undefined when completed_at is null
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        const updatedExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
        expect(updatedExec.completedAt).toBeUndefined()
      })

      it('should handle execution.node_states is null', async () => {
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
          node_states: null, // Null node_states
        } as any)

        renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
          })
        )

        await act(async () => {
          jest.advanceTimersByTime(2000)
          await Promise.resolve()
        })

        // Should use empty object fallback when node_states is null
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        const updatedExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
        expect(updatedExec.nodes).toEqual({})
      })

      it('should handle execution.logs is null', async () => {
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
          logs: null, // Null logs
        } as any)

        renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
          })
        )

        await act(async () => {
          jest.advanceTimersByTime(2000)
          await Promise.resolve()
        })

        // Should use empty array fallback when logs is null
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        const updatedExec = updatedTab.executions.find((e: Execution) => e.id === 'exec-1')
        expect(updatedExec.logs).toEqual([])
      })

      it('should handle update is null in updates.find', async () => {
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
        mockApi.getExecution.mockRejectedValue(new Error('API error'))

        renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
          })
        )

        await act(async () => {
          jest.advanceTimersByTime(2000)
          await Promise.resolve()
        })

        // Should use exec fallback when update is null
        expect(mockSetTabs).toHaveBeenCalled()
        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall([tabWithExecution]) : setTabsCall
        const updatedTab = updatedTabs.find((t: WorkflowTabData) => t.id === 'tab-1')
        // Execution should remain unchanged when update is null
        expect(updatedTab.executions[0].id).toBe('exec-1')
      })

      it('should handle exec.status !== newStatus exact comparison', async () => {
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
          status: 'completed', // Different from 'running'
          started_at: new Date().toISOString(),
        } as any)

        renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
          })
        )

        await act(async () => {
          jest.advanceTimersByTime(2000)
          await Promise.resolve()
        })

        // Should log status change when exec.status !== newStatus
        expect(mockLoggerDebug).toHaveBeenCalledWith(
          expect.stringContaining('status changed: running → completed')
        )
      })

      it('should handle exec.status === newStatus (no change)', async () => {
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
          status: 'running', // Same as current
          started_at: new Date().toISOString(),
        } as any)

        renderHook(() =>
          useExecutionManagement({
            tabs: [tabWithExecution],
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            tabsRef: mockTabsRef,
          })
        )

        await act(async () => {
          jest.advanceTimersByTime(2000)
          await Promise.resolve()
        })

        // Should not log status change when exec.status === newStatus
        const statusChangeLogs = mockLoggerDebug.mock.calls.filter((call: any[]) =>
          call[0] && typeof call[0] === 'string' && call[0].includes('status changed')
        )
        expect(statusChangeLogs.length).toBe(0)
      })
    })
  })
})
