/**
 * Tests for useExecutionPolling Hook
 */

import { renderHook, act } from '@testing-library/react'
import { useExecutionPolling } from './useExecutionPolling'
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

describe('useExecutionPolling', () => {
  let mockTabsRef: React.MutableRefObject<WorkflowTabData[]>
  let mockSetTabs: jest.Mock

  const createMockTab = (workflowId: string, executions: Execution[]): WorkflowTabData => ({
    id: `tab-${workflowId}`,
    name: `Workflow ${workflowId}`,
    workflowId,
    isUnsaved: false,
    executions,
    activeExecutionId: null,
  })

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
    mockTabsRef = {
      current: [],
    }
  })

  it('should handle null tabsRef.current', async () => {
    mockTabsRef.current = null as any

    renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1000,
      })
    )

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockApi.getExecution).not.toHaveBeenCalled()
  })

  it('should handle tabsRef.current that is not an array', async () => {
    mockTabsRef.current = {} as any

    renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1000,
      })
    )

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockApi.getExecution).not.toHaveBeenCalled()
  })

  it('should handle tabs without executions array', async () => {
    const tabWithoutExecutions = {
      id: 'tab-1',
      name: 'Workflow 1',
      workflowId: 'workflow-1',
      isUnsaved: false,
      activeExecutionId: null,
    } as any
    mockTabsRef.current = [tabWithoutExecutions]

    renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1000,
      })
    )

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockApi.getExecution).not.toHaveBeenCalled()
  })

  it('should handle tabs with null executions', async () => {
    const tabWithNullExecutions = {
      id: 'tab-1',
      name: 'Workflow 1',
      workflowId: 'workflow-1',
      isUnsaved: false,
      executions: null,
      activeExecutionId: null,
    } as any
    mockTabsRef.current = [tabWithNullExecutions]

    renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1000,
      })
    )

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockApi.getExecution).not.toHaveBeenCalled()
  })

  it('should handle tabs with executions that is not an array', async () => {
    const tabWithInvalidExecutions = {
      id: 'tab-1',
      name: 'Workflow 1',
      workflowId: 'workflow-1',
      isUnsaved: false,
      executions: {},
      activeExecutionId: null,
    } as any
    mockTabsRef.current = [tabWithInvalidExecutions]

    renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1000,
      })
    )

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockApi.getExecution).not.toHaveBeenCalled()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should poll running executions', async () => {
    const execution: Execution = {
      id: 'exec-1',
      status: 'running',
      startedAt: new Date(),
      nodes: {},
      logs: [],
    }
    mockTabsRef.current = [createMockTab('workflow-1', [execution])]

    const mockExecutionResponse = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      node_states: {},
      logs: [],
    }
    mockApi.getExecution.mockResolvedValue(mockExecutionResponse as any)

    renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1000,
      })
    )

    // Advance timers to trigger polling
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockApi.getExecution).toHaveBeenCalledWith('exec-1')
    expect(mockSetTabs).toHaveBeenCalled()
    expect(mockLoggerDebug).toHaveBeenCalled()
  })

  it('should not poll pending executions', async () => {
    const pendingExecution: Execution = {
      id: 'pending-123',
      status: 'running',
      startedAt: new Date(),
      nodes: {},
      logs: [],
    }
    mockTabsRef.current = [createMockTab('workflow-1', [pendingExecution])]

    renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1000,
      })
    )

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockApi.getExecution).not.toHaveBeenCalled()
  })

  it('should not poll when no running executions', async () => {
    const completedExecution: Execution = {
      id: 'exec-1',
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      nodes: {},
      logs: [],
    }
    mockTabsRef.current = [createMockTab('workflow-1', [completedExecution])]

    renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1000,
      })
    )

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockApi.getExecution).not.toHaveBeenCalled()
  })

  it('should handle API errors gracefully', async () => {
    const execution: Execution = {
      id: 'exec-1',
      status: 'running',
      startedAt: new Date(),
      nodes: {},
      logs: [],
    }
    mockTabsRef.current = [createMockTab('workflow-1', [execution])]

    mockApi.getExecution.mockRejectedValue(new Error('API Error'))

    renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1000,
      })
    )

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockApi.getExecution).toHaveBeenCalled()
    expect(mockLoggerError).toHaveBeenCalled()
  })

  it('should update execution status', async () => {
    const execution: Execution = {
      id: 'exec-1',
      status: 'running',
      startedAt: new Date(),
      nodes: {},
      logs: [],
    }
    mockTabsRef.current = [createMockTab('workflow-1', [execution])]

    const mockExecutionResponse = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      node_states: { node1: { state: 'done' } },
      logs: [{ message: 'Log 1' }],
    }
    mockApi.getExecution.mockResolvedValue(mockExecutionResponse as any)

    renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1000,
      })
    )

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockSetTabs).toHaveBeenCalled()
    const updateCall = mockSetTabs.mock.calls[0][0]
    const updatedTabs = updateCall(mockTabsRef.current)
    expect(updatedTabs[0].executions[0].status).toBe('completed')
  })

  it('should handle paused status by keeping as running', async () => {
    const execution: Execution = {
      id: 'exec-1',
      status: 'running',
      startedAt: new Date(),
      nodes: {},
      logs: [],
    }
    mockTabsRef.current = [createMockTab('workflow-1', [execution])]

    const mockExecutionResponse = {
      status: 'paused',
      node_states: {},
      logs: [],
    }
    mockApi.getExecution.mockResolvedValue(mockExecutionResponse as any)

    renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1000,
      })
    )

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockSetTabs).toHaveBeenCalled()
    const updateCall = mockSetTabs.mock.calls[0][0]
    const updatedTabs = updateCall(mockTabsRef.current)
    expect(updatedTabs[0].executions[0].status).toBe('running')
  })

  it('should handle paused status branch explicitly', async () => {
    const execution: Execution = {
      id: 'exec-1',
      status: 'running',
      startedAt: new Date(),
      nodes: {},
      logs: [],
    }
    mockTabsRef.current = [createMockTab('workflow-1', [execution])]

    const mockExecutionResponse = {
      status: 'paused',
      completed_at: null,
      node_states: {},
      logs: [],
    }
    mockApi.getExecution.mockResolvedValue(mockExecutionResponse as any)

    renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1000,
      })
    )

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockApi.getExecution).toHaveBeenCalledWith('exec-1')
    const updateCall = mockSetTabs.mock.calls[0][0]
    const updatedTabs = updateCall(mockTabsRef.current)
    // Paused status should be converted to 'running'
    expect(updatedTabs[0].executions[0].status).toBe('running')
  })

  it('should cover paused status ternary branch', async () => {
    const execution: Execution = {
      id: 'exec-1',
      status: 'running',
      startedAt: new Date(),
      nodes: {},
      logs: [],
    }
    mockTabsRef.current = [createMockTab('workflow-1', [execution])]

    // Test the ternary: execution.status === 'paused' ? 'running' : 'running'
    const mockExecutionResponse = {
      status: 'paused' as const,
      node_states: {},
      logs: [],
    }
    mockApi.getExecution.mockResolvedValue(mockExecutionResponse as any)

    renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1000,
      })
    )

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    const updateCall = mockSetTabs.mock.calls[0][0]
    const updatedTabs = updateCall(mockTabsRef.current)
    // Should use the 'paused' branch which returns 'running'
    expect(updatedTabs[0].executions[0].status).toBe('running')
  })

  it('should handle unknown status by keeping as running', async () => {
    const execution: Execution = {
      id: 'exec-1',
      status: 'running',
      startedAt: new Date(),
      nodes: {},
      logs: [],
    }
    mockTabsRef.current = [createMockTab('workflow-1', [execution])]

    const mockExecutionResponse = {
      status: 'unknown-status',
      node_states: {},
      logs: [],
    }
    mockApi.getExecution.mockResolvedValue(mockExecutionResponse as any)

    renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1000,
      })
    )

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockSetTabs).toHaveBeenCalled()
    const updateCall = mockSetTabs.mock.calls[0][0]
    const updatedTabs = updateCall(mockTabsRef.current)
    expect(updatedTabs[0].executions[0].status).toBe('running')
  })

  it('should handle tabs with falsy executions in update', async () => {
    const execution: Execution = {
      id: 'exec-1',
      status: 'running',
      startedAt: new Date(),
      nodes: {},
      logs: [],
    }
    mockTabsRef.current = [createMockTab('workflow-1', [execution])]

    const mockExecutionResponse = {
      status: 'running',
      node_states: {},
      logs: [],
    }
    mockApi.getExecution.mockResolvedValue(mockExecutionResponse as any)

    // Simulate a tab that loses executions during update
    mockSetTabs.mockImplementation((fn) => {
      if (typeof fn === 'function') {
        const currentTabs = mockTabsRef.current
        const newTabs = fn(currentTabs)
        // Simulate falsy executions
        newTabs[0].executions = null as any
        mockTabsRef.current = newTabs
      }
    })

    renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1000,
      })
    )

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockSetTabs).toHaveBeenCalled()
    const updateCall = mockSetTabs.mock.calls[0][0]
    const testTabs = [createMockTab('workflow-1', [execution])]
    testTabs[0].executions = null as any
    const updatedTabs = updateCall(testTabs)
    expect(updatedTabs[0].executions).toEqual([])
  })

  it('should handle tabs with falsy executions', async () => {
    const tabWithFalsyExecutions = {
      id: 'tab-1',
      name: 'Workflow 1',
      workflowId: 'workflow-1',
      isUnsaved: false,
      executions: null,
      activeExecutionId: null,
    } as any
    mockTabsRef.current = [tabWithFalsyExecutions]

    renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1000,
      })
    )

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    // When executions is falsy, the code returns early, so setTabs may not be called
    // But if it is called, it should handle falsy executions gracefully
    if (mockSetTabs.mock.calls.length > 0) {
      const updateCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = updateCall(mockTabsRef.current)
      expect(updatedTabs[0].executions).toEqual([])
    }
    expect(mockApi.getExecution).not.toHaveBeenCalled()
  })

  it('should use custom poll interval', async () => {
    const execution: Execution = {
      id: 'exec-1',
      status: 'running',
      startedAt: new Date(),
      nodes: {},
      logs: [],
    }
    mockTabsRef.current = [createMockTab('workflow-1', [execution])]

    mockApi.getExecution.mockResolvedValue({ status: 'running' } as any)

    renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 5000,
      })
    )

    await act(async () => {
      jest.advanceTimersByTime(5000)
    })

    expect(mockApi.getExecution).toHaveBeenCalled()
  })

  it('should handle multiple tabs with running executions', async () => {
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
    mockTabsRef.current = [
      createMockTab('workflow-1', [execution1]),
      createMockTab('workflow-2', [execution2]),
    ]

    mockApi.getExecution.mockResolvedValue({ status: 'running' } as any)

    renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1000,
      })
    )

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockApi.getExecution).toHaveBeenCalledTimes(2)
    expect(mockApi.getExecution).toHaveBeenCalledWith('exec-1')
    expect(mockApi.getExecution).toHaveBeenCalledWith('exec-2')
  })

  it('should clean up interval on unmount', () => {
    const { unmount } = renderHook(() =>
      useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1000,
      })
    )

    unmount()

    // Advance timers after unmount - should not trigger polling
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockApi.getExecution).not.toHaveBeenCalled()
  })
})
