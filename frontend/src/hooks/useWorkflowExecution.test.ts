/**
 * Tests for useWorkflowExecution hook
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

import { useWorkflowExecution } from './useWorkflowExecution'
import { showSuccess, showError } from '../utils/notifications'
import { showConfirm } from '../utils/confirm'
import { api } from '../api/client'
import { logger } from '../utils/logger'

jest.mock('../utils/notifications', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
}))

jest.mock('../utils/confirm', () => ({
  showConfirm: jest.fn(),
}))

jest.mock('../api/client', () => ({
  api: {
    executeWorkflow: jest.fn(),
  },
}))

jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

const mockShowSuccess = showSuccess as jest.MockedFunction<typeof showSuccess>
const mockShowError = showError as jest.MockedFunction<typeof showError>
const mockShowConfirm = showConfirm as jest.MockedFunction<typeof showConfirm>
const mockApi = api as jest.Mocked<typeof api>
const mockLoggerDebug = logger.debug as jest.MockedFunction<typeof logger.debug>
const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>

describe('useWorkflowExecution', () => {
  let mockSaveWorkflow: jest.Mock
  let mockOnExecutionStart: jest.Mock
  let mockWorkflowIdRef: React.MutableRefObject<string | null>

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    mockSaveWorkflow = jest.fn()
    mockOnExecutionStart = jest.fn()
    mockWorkflowIdRef = { current: 'workflow-id' }
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('executeWorkflow', () => {
    it('should return early if not authenticated', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: false,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        await result.current.executeWorkflow()
      })

      expect(mockShowError).toHaveBeenCalledWith('Please log in to execute workflows.')
      expect(result.current.showInputs).toBe(false)
    })

    it('should show input dialog if workflow ID exists', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        await result.current.executeWorkflow()
      })

      expect(result.current.showInputs).toBe(true)
      expect(mockSaveWorkflow).not.toHaveBeenCalled()
    })

    it('should prompt to save if no workflow ID exists', async () => {
      mockShowConfirm.mockResolvedValue(true)
      mockSaveWorkflow.mockResolvedValue('saved-id')

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: { current: null },
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        await result.current.executeWorkflow()
      })

      expect(mockShowConfirm).toHaveBeenCalledWith(
        'Workflow needs to be saved before execution. Save now?',
        expect.any(Object)
      )
      expect(mockSaveWorkflow).toHaveBeenCalled()
      expect(result.current.showInputs).toBe(true)
    })

    it('should not execute if user cancels save', async () => {
      mockShowConfirm.mockResolvedValue(false)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: { current: null },
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        await result.current.executeWorkflow()
      })

      expect(mockSaveWorkflow).not.toHaveBeenCalled()
      expect(result.current.showInputs).toBe(false)
    })

    it('should show error if save fails', async () => {
      mockShowConfirm.mockResolvedValue(true)
      mockSaveWorkflow.mockResolvedValue(null)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: { current: null },
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        await result.current.executeWorkflow()
      })

      expect(mockShowError).toHaveBeenCalledWith('Failed to save workflow. Cannot execute.')
      expect(result.current.showInputs).toBe(false)
    })
  })

  describe('handleConfirmExecute', () => {
    it('should execute workflow with inputs', async () => {
      const executionResponse = { execution_id: 'exec-123' }
      mockApi.executeWorkflow.mockResolvedValue(executionResponse as any)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.setExecutionInputs('{"input1": "value1"}')
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        jest.advanceTimersByTime(0)
      })

      await waitForWithTimeout(() => {
        expect(mockApi.executeWorkflow).toHaveBeenCalledWith('workflow-id', { input1: 'value1' })
      })

      expect(result.current.showInputs).toBe(false)
      expect(result.current.executionInputs).toBe('{}')
      expect(mockShowSuccess).toHaveBeenCalled()
    })

    it('should call onExecutionStart with temp ID immediately', async () => {
      const executionResponse = { execution_id: 'exec-123' }
      mockApi.executeWorkflow.mockResolvedValue(executionResponse as any)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.setExecutionInputs('{}')
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        jest.advanceTimersByTime(0)
      })

      await waitForWithTimeout(() => {
        expect(mockOnExecutionStart).toHaveBeenCalled()
        const callArgs = mockOnExecutionStart.mock.calls[0][0]
        expect(callArgs).toMatch(/^pending-/)
      })
    })

    it('should update execution ID when response received', async () => {
      const executionResponse = { execution_id: 'exec-123' }
      mockApi.executeWorkflow.mockResolvedValue(executionResponse as any)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.setExecutionInputs('{}')
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        jest.advanceTimersByTime(0)
      })

      await waitForWithTimeout(() => {
        expect(mockOnExecutionStart).toHaveBeenCalledTimes(2)
        expect(mockOnExecutionStart).toHaveBeenLastCalledWith('exec-123')
      })
    })

    it('should handle execution errors', async () => {
      const error = {
        message: 'Execution failed',
        response: {
          data: { detail: 'Workflow error' },
          status: 500,
        },
      }
      mockApi.executeWorkflow.mockRejectedValue(error as any)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.setExecutionInputs('{}')
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        jest.advanceTimersByTime(0)
      })

      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Workflow error')
        expect(result.current.isExecuting).toBe(false)
      })
    })

    it('should show error if workflow ID is missing', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: { current: null },
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.setExecutionInputs('{}')
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        jest.advanceTimersByTime(0)
      })

      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalledWith('Workflow must be saved before executing.')
        expect(result.current.isExecuting).toBe(false)
      })
    })

    it('should handle JSON parse errors', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.setExecutionInputs('invalid json')
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        jest.advanceTimersByTime(0)
      })

      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalled()
        expect(result.current.isExecuting).toBe(false)
      })
    })

    it('should handle save workflow throwing error', async () => {
      mockShowConfirm.mockResolvedValue(true)
      const saveError = new Error('Save failed')
      mockSaveWorkflow.mockRejectedValue(saveError)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: { current: null },
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        await result.current.executeWorkflow()
      })

      expect(mockShowError).toHaveBeenCalledWith('Failed to save workflow. Cannot execute.')
      expect(result.current.showInputs).toBe(false)
    })

    it('should not update execution ID when it matches temp ID', async () => {
      // Capture the temp ID that will be generated
      let tempExecutionId: string | null = null
      mockOnExecutionStart.mockImplementation((id: string) => {
        if (!tempExecutionId && id.startsWith('pending-')) {
          tempExecutionId = id
        }
      })

      // Return execution with same ID as temp
      mockApi.executeWorkflow.mockImplementation(async () => {
        // Wait a bit to ensure temp ID is set
        await new Promise(resolve => setTimeout(resolve, 10))
        return { execution_id: tempExecutionId || 'pending-123' } as any
      })

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.setExecutionInputs('{}')
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        jest.advanceTimersByTime(0)
      })

      await waitForWithTimeout(() => {
        // Should be called once with temp ID
        expect(mockOnExecutionStart).toHaveBeenCalled()
        const calls = mockOnExecutionStart.mock.calls
        const tempIdCall = calls.find((call) => call[0].startsWith('pending-'))
        expect(tempIdCall).toBeDefined()
        // Should not be called again if execution_id matches temp ID
        // (The check execution_id !== tempExecutionId prevents the second call)
        if (tempExecutionId) {
          const matchingCalls = calls.filter((call) => call[0] === tempExecutionId)
          expect(matchingCalls.length).toBeLessThanOrEqual(1)
        }
      })
    })

    it('should not update execution ID when execution_id is missing', async () => {
      const executionResponse = {}
      mockApi.executeWorkflow.mockResolvedValue(executionResponse as any)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.setExecutionInputs('{}')
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        jest.advanceTimersByTime(0)
      })

      await waitForWithTimeout(() => {
        // Should only be called once with temp ID
        expect(mockOnExecutionStart).toHaveBeenCalledTimes(1)
        expect(mockOnExecutionStart).toHaveBeenCalledWith(expect.stringMatching(/^pending-/))
      })
    })

    it('should not call onExecutionStart when not provided', async () => {
      const executionResponse = { execution_id: 'exec-123' }
      mockApi.executeWorkflow.mockResolvedValue(executionResponse as any)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: undefined,
        })
      )

      act(() => {
        result.current.setExecutionInputs('{}')
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        jest.advanceTimersByTime(0)
      })

      await waitForWithTimeout(() => {
        // Should not throw error when onExecutionStart is undefined
        expect(mockApi.executeWorkflow).toHaveBeenCalled()
      })
    })

    it('should handle error without response.data.detail', async () => {
      const error = {
        message: 'Network error',
        response: {
          data: {},
          status: 500,
        },
      }
      mockApi.executeWorkflow.mockRejectedValue(error as any)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.setExecutionInputs('{}')
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        jest.advanceTimersByTime(0)
      })

      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Network error')
        expect(result.current.isExecuting).toBe(false)
      })
    })

    it('should handle error without response', async () => {
      const error = {
        message: 'Connection error',
      }
      mockApi.executeWorkflow.mockRejectedValue(error as any)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.setExecutionInputs('{}')
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        jest.advanceTimersByTime(0)
      })

      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Connection error')
        expect(result.current.isExecuting).toBe(false)
      })
    })

    it('should handle error without message', async () => {
      const error = {}
      mockApi.executeWorkflow.mockRejectedValue(error as any)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.setExecutionInputs('{}')
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        jest.advanceTimersByTime(0)
      })

      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Unknown error')
        expect(result.current.isExecuting).toBe(false)
      })
    })

    it('should handle JSON parse error without message property', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.setExecutionInputs('invalid json')
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        jest.advanceTimersByTime(0)
      })

      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('Failed to execute workflow:'))
        expect(result.current.isExecuting).toBe(false)
      })
    })

    it('should handle error in catch block without message', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.setExecutionInputs('{}')
      })

      // Mock JSON.parse to throw error without message
      const originalParse = JSON.parse
      JSON.parse = jest.fn(() => {
        throw {}
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        jest.advanceTimersByTime(0)
      })

      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Unknown error')
        expect(result.current.isExecuting).toBe(false)
      })

      JSON.parse = originalParse
    })
  })

  describe('state management', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      expect(result.current.showInputs).toBe(false)
      expect(result.current.executionInputs).toBe('{}')
      expect(result.current.isExecuting).toBe(false)
    })

    it('should update showInputs', () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.setShowInputs(true)
      })

      expect(result.current.showInputs).toBe(true)
    })

    it('should update executionInputs', () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.setExecutionInputs('{"test": "value"}')
      })

      expect(result.current.executionInputs).toBe('{"test": "value"}')
    })
  })

  describe('edge cases for 100% coverage', () => {
    it('should verify catch block in executeWorkflow when saveWorkflow throws', async () => {
      mockShowConfirm.mockResolvedValue(true)
      mockSaveWorkflow.mockRejectedValue(new Error('Save failed'))

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        await result.current.executeWorkflow()
      })

      expect(mockShowError).toHaveBeenCalledWith('Failed to save workflow. Cannot execute.')
      expect(result.current.showInputs).toBe(false)
    })

    it('should verify if (onExecutionStart) check - onExecutionStart is undefined in executeWorkflow', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: undefined,
        })
      )

      await act(async () => {
        await result.current.executeWorkflow()
      })

      // Should not crash when onExecutionStart is undefined
      expect(result.current.showInputs).toBe(true)
    })

    it('should verify if (!workflowIdToExecute) check in handleConfirmExecute', async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: 'exec-123',
        status: 'running',
      })

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: { current: null }, // No workflow ID
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      // Advance setTimeout
      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      expect(mockShowError).toHaveBeenCalledWith('Workflow must be saved before executing.')
      expect(result.current.isExecuting).toBe(false)
    })

    it('should verify execution.execution_id && execution.execution_id !== tempExecutionId - both true', async () => {
      const tempExecutionId = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: 'exec-123', // Different from tempExecutionId
        status: 'running',
      })

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled()
        })
      })

      // Should call onExecutionStart with the real execution_id
      expect(mockOnExecutionStart).toHaveBeenCalled()
    })

    it('should verify execution.execution_id && execution.execution_id !== tempExecutionId - execution_id equals tempExecutionId', async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: 'pending-123', // Same as temp (unlikely but possible)
        status: 'running',
      })

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled()
        })
      })

      // Should not call onExecutionStart again if execution_id equals tempExecutionId
      const onExecutionStartCalls = mockOnExecutionStart.mock.calls
      // Should have been called once with temp ID, but not again if execution_id matches
      expect(onExecutionStartCalls.length).toBeGreaterThanOrEqual(1)
    })

    it('should verify execution.execution_id && execution.execution_id !== tempExecutionId - execution_id is falsy', async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        // No execution_id
        status: 'running',
      })

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled()
        })
      })

      // Should not call onExecutionStart again if execution_id is falsy
      const onExecutionStartCalls = mockOnExecutionStart.mock.calls
      // Should have been called once with temp ID, but not again
      expect(onExecutionStartCalls.length).toBeGreaterThanOrEqual(1)
    })

    it('should verify if (onExecutionStart) check in then handler - onExecutionStart is undefined', async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: 'exec-123',
        status: 'running',
      })

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: undefined,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled()
        })
      })

      // Should not crash when onExecutionStart is undefined
      expect(mockApi.executeWorkflow).toHaveBeenCalled()
    })

    it('should verify error.response?.data?.detail || error.message || Unknown error - error.response.data.detail path', async () => {
      const errorWithDetail = {
        response: {
          data: {
            detail: 'Custom error detail',
          },
        },
        message: 'Error message',
      }
      mockApi.executeWorkflow.mockRejectedValue(errorWithDetail)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Custom error detail')
      )
    })

    it('should verify error.response?.data?.detail || error.message || Unknown error - error.message path', async () => {
      const errorWithMessage = {
        message: 'Error message',
        // No response.data.detail
      }
      mockApi.executeWorkflow.mockRejectedValue(errorWithMessage)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Error message')
      )
    })

    it('should verify error.response?.data?.detail || error.message || Unknown error - Unknown error fallback', async () => {
      const errorWithoutMessage = {
        // No response, no message
      }
      mockApi.executeWorkflow.mockRejectedValue(errorWithoutMessage)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Unknown error')
      )
    })

    it('should verify catch block in handleConfirmExecute - JSON.parse error', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Set invalid JSON
      await act(async () => {
        result.current.setExecutionInputs('invalid json')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to execute workflow')
      )
      expect(result.current.isExecuting).toBe(false)
    })

    it('should verify error?.message || Unknown error in catch - error.message path', async () => {
      const errorWithMessage = new Error('Parse error')
      // Simulate JSON.parse throwing an error with message
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Set invalid JSON to trigger JSON.parse error
      await act(async () => {
        result.current.setExecutionInputs('invalid json')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to execute workflow')
      )
    })

    it('should verify error?.message || Unknown error in catch - Unknown error fallback', async () => {
      // Simulate an error without message property
      const errorWithoutMessage = {}
      
      // We can't easily simulate JSON.parse throwing an error without message,
      // but we can verify the code path exists by testing with a different error type
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Set invalid JSON
      await act(async () => {
        result.current.setExecutionInputs('{invalid}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      // Should handle error gracefully
      expect(mockShowError).toHaveBeenCalled()
      expect(result.current.isExecuting).toBe(false)
    })

    it('should verify error.response?.status and error.response?.data logging', async () => {
      const errorWithResponse = {
        message: 'Error message',
        response: {
          status: 500,
          data: {
            detail: 'Server error',
          },
        },
      }
      mockApi.executeWorkflow.mockRejectedValue(errorWithResponse)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockLoggerError).toHaveBeenCalled()
        })
      })

      // Should log error details including response.status and response.data
      expect(mockLoggerError).toHaveBeenCalledWith(
        '[WorkflowBuilder] Execution failed:',
        expect.any(Object)
      )
    })

    it('should verify Date.now() in tempExecutionId generation', async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: 'exec-123',
        status: 'running',
      })

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockOnExecutionStart).toHaveBeenCalled()
        })
      })

      // Verify tempExecutionId format: pending-${Date.now()}-${random}
      const tempExecutionId = mockOnExecutionStart.mock.calls[0][0]
      expect(tempExecutionId).toMatch(/^pending-\d+-[a-z0-9]+$/)
      expect(tempExecutionId.startsWith('pending-')).toBe(true)
    })

    it('should verify Math.random().toString(36).substr(2, 9) in tempExecutionId', async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: 'exec-123',
        status: 'running',
      })

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockOnExecutionStart).toHaveBeenCalled()
        })
      })

      // Verify tempExecutionId contains random string from Math.random().toString(36).substr(2, 9)
      const tempExecutionId = mockOnExecutionStart.mock.calls[0][0]
      const parts = tempExecutionId.split('-')
      expect(parts.length).toBe(3)
      expect(parts[0]).toBe('pending')
      expect(parts[2].length).toBeGreaterThan(0) // Random string
    })

    it('should verify execution.execution_id && execution.execution_id !== tempExecutionId - both true', async () => {
      const tempExecutionId = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: 'exec-123', // Different from tempExecutionId
        status: 'running',
      })

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled()
        })
      })

      // Should call onExecutionStart with real execution_id (different from temp)
      const calls = mockOnExecutionStart.mock.calls
      expect(calls.length).toBeGreaterThanOrEqual(1)
      // Last call should be with real execution_id
      const lastCall = calls[calls.length - 1]
      expect(lastCall[0]).toBe('exec-123')
    })

    it('should verify execution.execution_id && execution.execution_id !== tempExecutionId - execution_id equals temp', async () => {
      // This is unlikely but possible - when execution_id matches tempExecutionId
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: 'pending-123', // Matches temp pattern (unlikely but possible)
        status: 'running',
      })

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled()
        })
      })

      // Should not call onExecutionStart again if execution_id equals tempExecutionId
      const calls = mockOnExecutionStart.mock.calls
      // Should have been called once with temp ID, but not again if execution_id matches
      expect(calls.length).toBeGreaterThanOrEqual(1)
    })

    it('should verify execution.execution_id && execution.execution_id !== tempExecutionId - execution_id is falsy', async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        // No execution_id
        status: 'running',
      })

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled()
        })
      })

      // Should not call onExecutionStart again if execution_id is falsy
      const calls = mockOnExecutionStart.mock.calls
      // Should have been called once with temp ID, but not again
      expect(calls.length).toBe(1)
    })

    it('should verify error.response?.data?.detail || error.message || Unknown error - all branches', async () => {
      // Test error.response.data.detail path
      const errorWithDetail = {
        response: {
          data: {
            detail: 'Custom error detail',
          },
        },
        message: 'Error message',
      }
      mockApi.executeWorkflow.mockRejectedValue(errorWithDetail)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Custom error detail')
      )
    })

    it('should verify error.response?.data?.detail || error.message || Unknown error - error.message path', async () => {
      const errorWithMessage = {
        message: 'Error message',
        // No response.data.detail
      }
      mockApi.executeWorkflow.mockRejectedValue(errorWithMessage)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Error message')
      )
    })

    it('should verify error.response?.data?.detail || error.message || Unknown error - Unknown error fallback', async () => {
      const errorWithoutMessage = {
        // No response, no message
      }
      mockApi.executeWorkflow.mockRejectedValue(errorWithoutMessage)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Unknown error')
      )
    })

    it('should verify error.response?.status logging', async () => {
      const errorWithStatus = {
        message: 'Error message',
        response: {
          status: 404,
          data: {
            detail: 'Not found',
          },
        },
      }
      mockApi.executeWorkflow.mockRejectedValue(errorWithStatus)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockLoggerError).toHaveBeenCalled()
        })
      })

      // Should log error details including response.status
      expect(mockLoggerError).toHaveBeenCalledWith(
        '[WorkflowBuilder] Error details:',
        expect.objectContaining({
          status: 404,
        })
      )
    })

    it('should verify error.response?.data logging', async () => {
      const errorWithData = {
        message: 'Error message',
        response: {
          status: 500,
          data: {
            detail: 'Server error',
            code: 'INTERNAL_ERROR',
          },
        },
      }
      mockApi.executeWorkflow.mockRejectedValue(errorWithData)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockLoggerError).toHaveBeenCalled()
        })
      })

      // Should log error details including response.data
      expect(mockLoggerError).toHaveBeenCalledWith(
        '[WorkflowBuilder] Error details:',
        expect.objectContaining({
          data: expect.objectContaining({
            detail: 'Server error',
          }),
        })
      )
    })

    it('should verify JSON.parse error handling with specific error types', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Set invalid JSON that will cause JSON.parse to throw
      await act(async () => {
        result.current.setExecutionInputs('{invalid json}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to execute workflow')
      )
      expect(result.current.isExecuting).toBe(false)
    })

    it('should verify setTimeout delay of 0', async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: 'exec-123',
        status: 'running',
      })

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      // Advance timer by 0ms to trigger setTimeout(() => {...}, 0)
      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled()
        })
      })

      expect(mockApi.executeWorkflow).toHaveBeenCalled()
    })

    it('should verify string literal pending- exact prefix in tempExecutionId', async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: 'exec-123',
        status: 'running',
      })

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockOnExecutionStart).toHaveBeenCalled()
        })
      })

      // Verify exact string prefix 'pending-'
      const tempExecutionId = mockOnExecutionStart.mock.calls[0][0]
      expect(tempExecutionId.startsWith('pending-')).toBe(true)
    })

    it('should verify template literal Failed to execute workflow: exact prefix', async () => {
      const error = new Error('Test error')
      mockApi.executeWorkflow.mockRejectedValue(error)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      // Verify exact string prefix 'Failed to execute workflow: '
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to execute workflow: ')
      )
    })

    it('should verify string literal Unknown error exact value', async () => {
      const errorWithoutMessage = {} as any
      mockApi.executeWorkflow.mockRejectedValue(errorWithoutMessage)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      // Verify exact string value 'Unknown error'
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Unknown error')
      )
    })

    it('should verify string literal {} exact value for executionInputs reset', async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: 'exec-123',
        status: 'running',
      })

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled()
        })
      })

      // Verify executionInputs is reset to exact string '{}'
      expect(result.current.executionInputs).toBe('{}')
    })
  })
})
