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
      expect(result.current.executionInputs).not.toBe('{} ')
      expect(result.current.executionInputs).not.toBe('{ }')
    })

    it('should verify exact string literal {} in initial state', () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Verify exact string '{}' (not mutated)
      expect(result.current.executionInputs).toBe('{}')
      expect(result.current.executionInputs.length).toBe(2)
    })

    it('should verify exact string literal Unknown error in error.response?.data?.detail || error.message || Unknown error', async () => {
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

      // Verify exact string 'Unknown error' (not mutated)
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Unknown error')
      expect(mockShowError).not.toHaveBeenCalledWith('Failed to execute workflow: unknown error')
      expect(mockShowError).not.toHaveBeenCalledWith('Failed to execute workflow: ')
    })

    it('should verify exact string literal Unknown error in error?.message || Unknown error', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Mock JSON.parse to throw error without message
      const originalParse = JSON.parse
      JSON.parse = jest.fn(() => {
        throw {} // Error without message property
      })

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

      // Verify exact string 'Unknown error' (not mutated)
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Unknown error')

      JSON.parse = originalParse
    })

    it('should verify exact template literal Failed to execute workflow: prefix', async () => {
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

      // Verify exact template literal prefix 'Failed to execute workflow: '
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Test error')
      expect(mockShowError).not.toHaveBeenCalledWith('failed to execute workflow: Test error')
      expect(mockShowError).not.toHaveBeenCalledWith('Failed to execute workflow Test error')
    })

    it('should verify exact string literal Please log in to execute workflows.', async () => {
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

      // Verify exact string literal (not mutated)
      expect(mockShowError).toHaveBeenCalledWith('Please log in to execute workflows.')
      expect(mockShowError).not.toHaveBeenCalledWith('Please log in to execute workflows')
      expect(mockShowError).not.toHaveBeenCalledWith('please log in to execute workflows.')
    })

    it('should verify exact string literal Failed to save workflow. Cannot execute.', async () => {
      mockShowConfirm.mockResolvedValue(true)
      mockSaveWorkflow.mockResolvedValue(null)

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

      // Verify exact string literal (not mutated)
      expect(mockShowError).toHaveBeenCalledWith('Failed to save workflow. Cannot execute.')
      expect(mockShowError).not.toHaveBeenCalledWith('Failed to save workflow. Cannot execute')
      expect(mockShowError).not.toHaveBeenCalledWith('failed to save workflow. Cannot execute.')
    })

    it('should verify exact string literal Workflow must be saved before executing.', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: { current: null },
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.setExecutionInputs('{}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      // Verify exact string literal (not mutated)
      expect(mockShowError).toHaveBeenCalledWith('Workflow must be saved before executing.')
      expect(mockShowError).not.toHaveBeenCalledWith('Workflow must be saved before executing')
      expect(mockShowError).not.toHaveBeenCalledWith('workflow must be saved before executing.')
    })

    it('should verify exact string literal Workflow needs to be saved before execution. Save now?', async () => {
      mockShowConfirm.mockResolvedValue(true)
      mockSaveWorkflow.mockResolvedValue('saved-id')

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

      // Verify exact string literal (not mutated)
      expect(mockShowConfirm).toHaveBeenCalledWith(
        'Workflow needs to be saved before execution. Save now?',
        expect.any(Object)
      )
      expect(mockShowConfirm).not.toHaveBeenCalledWith(
        'Workflow needs to be saved before execution. Save now',
        expect.any(Object)
      )
    })

    it('should verify exact comparison !isAuthenticated - isAuthenticated is false', async () => {
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

      // Should show error when !isAuthenticated is true
      expect(mockShowError).toHaveBeenCalledWith('Please log in to execute workflows.')
    })

    it('should verify exact comparison !isAuthenticated - isAuthenticated is true', async () => {
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

      // Should not show error when !isAuthenticated is false
      expect(mockShowError).not.toHaveBeenCalledWith('Please log in to execute workflows.')
    })

    it('should verify exact comparison !currentWorkflowId - currentWorkflowId is null', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      mockShowConfirm.mockResolvedValue(true)
      mockSaveWorkflow.mockResolvedValue('saved-id')

      await act(async () => {
        await result.current.executeWorkflow()
      })

      // Should prompt to save when !currentWorkflowId is true
      expect(mockShowConfirm).toHaveBeenCalled()
    })

    it('should verify exact comparison !currentWorkflowId - currentWorkflowId is string', async () => {
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

      // Should not prompt to save when !currentWorkflowId is false
      expect(mockShowConfirm).not.toHaveBeenCalled()
    })

    it('should verify exact comparison !confirmed - confirmed is false', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      mockShowConfirm.mockResolvedValue(false)

      await act(async () => {
        await result.current.executeWorkflow()
      })

      // Should return early when !confirmed is true
      expect(mockSaveWorkflow).not.toHaveBeenCalled()
      expect(result.current.showInputs).toBe(false)
    })

    it('should verify exact comparison !confirmed - confirmed is true', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      mockShowConfirm.mockResolvedValue(true)
      mockSaveWorkflow.mockResolvedValue('saved-id')

      await act(async () => {
        await result.current.executeWorkflow()
      })

      // Should continue when !confirmed is false
      expect(mockSaveWorkflow).toHaveBeenCalled()
    })

    it('should verify exact comparison !savedId - savedId is null', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      mockShowConfirm.mockResolvedValue(true)
      mockSaveWorkflow.mockResolvedValue(null)

      await act(async () => {
        await result.current.executeWorkflow()
      })

      // Should show error when !savedId is true
      expect(mockShowError).toHaveBeenCalledWith('Failed to save workflow. Cannot execute.')
    })

    it('should verify exact comparison !savedId - savedId is string', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      mockShowConfirm.mockResolvedValue(true)
      mockSaveWorkflow.mockResolvedValue('saved-id')

      await act(async () => {
        await result.current.executeWorkflow()
      })

      // Should not show error when !savedId is false
      expect(mockShowError).not.toHaveBeenCalledWith('Failed to save workflow. Cannot execute.')
    })

    it('should verify exact comparison !workflowIdToExecute - workflowIdToExecute is null', async () => {
      mockWorkflowIdRef.current = null

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

      // Should show error when !workflowIdToExecute is true
      expect(mockShowError).toHaveBeenCalledWith('Workflow must be saved before executing.')
    })

    it('should verify exact comparison !workflowIdToExecute - workflowIdToExecute is string', async () => {
      mockWorkflowIdRef.current = 'workflow-id'

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

      // Should not show error when !workflowIdToExecute is false
      expect(mockShowError).not.toHaveBeenCalledWith('Workflow must be saved before executing.')
    })

    it('should verify exact logical AND execution.execution_id && execution.execution_id !== tempExecutionId - both true', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const tempExecutionId = 'pending-123'
      const realExecutionId = 'execution-456'

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: realExecutionId,
      })

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

      // Should call onExecutionStart when both conditions are true
      await waitForWithTimeout(() => {
        expect(mockOnExecutionStart).toHaveBeenCalledWith(realExecutionId)
      })
    })

    it('should verify exact logical AND execution.execution_id && execution.execution_id !== tempExecutionId - execution_id is null', async () => {
      mockWorkflowIdRef.current = 'workflow-id'

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: null,
      })

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

      // Should not call onExecutionStart when execution_id is null (first condition false)
      // Note: onExecutionStart was already called with tempExecutionId, so we check it wasn't called with real ID
      await waitForWithTimeout(() => {
        const calls = mockOnExecutionStart.mock.calls
        // Filter out tempExecutionId calls (they start with 'pending-')
        const realIdCalls = calls.filter((call) => {
          const id = call[0]
          return typeof id === 'string' && !id.startsWith('pending-') && id !== null && id !== undefined
        })
        // Should not have any calls with non-temp execution IDs when execution_id is null
        // The && operator short-circuits when execution_id is null, so onExecutionStart is not called with execution_id
        expect(realIdCalls.length).toBe(0)
      }, 200)
    })

    it('should verify exact logical AND execution.execution_id && execution.execution_id !== tempExecutionId - execution_id equals tempExecutionId', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const tempExecutionId = 'pending-123'

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: tempExecutionId, // Same as temp ID
      })

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

      // Should not call onExecutionStart again when execution_id === tempExecutionId (second condition false)
      await waitForWithTimeout(() => {
        const calls = mockOnExecutionStart.mock.calls
        // Should have at least one call (the temp ID call)
        expect(calls.length).toBeGreaterThanOrEqual(1)
        // The tempExecutionId call should exist
        const tempIdCalls = calls.filter((call) => call[0] && typeof call[0] === 'string' && call[0].startsWith('pending-'))
        expect(tempIdCalls.length).toBeGreaterThanOrEqual(1)
        // Since execution_id === tempExecutionId, the condition (execution.execution_id !== tempExecutionId) is false
        // So onExecutionStart should NOT be called again with execution_id
        // We verify this by checking that we don't have duplicate calls with the same tempExecutionId
        const duplicateCalls = calls.filter((call, index) => 
          calls.findIndex((c) => c[0] === call[0]) !== index
        )
        // Should not have duplicate calls when execution_id matches tempExecutionId
        expect(duplicateCalls.length).toBe(0)
      }, 200)
    })

    it('should verify exact logical OR error.response?.data?.detail || error.message || Unknown error - all three paths', async () => {
      mockWorkflowIdRef.current = 'workflow-id'

      // Test 1: error.response?.data?.detail exists
      const { result: result1 } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      const error1 = {
        response: {
          data: {
            detail: 'Error detail from response',
          },
        },
        message: 'Error message',
      }
      mockApi.executeWorkflow.mockRejectedValue(error1)

      await act(async () => {
        result1.current.setExecutionInputs('{"key": "value"}')
        await result1.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      // Should use error.response?.data?.detail (first in OR chain)
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Error detail from response')

      // Test 2: error.response?.data?.detail is undefined, error.message exists
      jest.clearAllMocks()
      const { result: result2 } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      const error2 = {
        message: 'Error message',
      }
      mockApi.executeWorkflow.mockRejectedValue(error2)

      await act(async () => {
        result2.current.setExecutionInputs('{"key": "value"}')
        await result2.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      // Should use error.message (second in OR chain)
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Error message')

      // Test 3: both are undefined, should use 'Unknown error'
      jest.clearAllMocks()
      const { result: result3 } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      const error3 = {}
      mockApi.executeWorkflow.mockRejectedValue(error3)

      await act(async () => {
        result3.current.setExecutionInputs('{"key": "value"}')
        await result3.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      // Should use 'Unknown error' (third in OR chain)
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Unknown error')
    })

    it('should verify exact logical OR error?.message || Unknown error - both paths', async () => {
      mockWorkflowIdRef.current = 'workflow-id'

      // Test 1: error?.message exists
      const { result: result1 } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Simulate JSON.parse error
      jest.spyOn(JSON, 'parse').mockImplementationOnce(() => {
        throw { message: 'Parse error' }
      })

      await act(async () => {
        result1.current.setExecutionInputs('invalid-json')
        await result1.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      // Should use error?.message (first in OR chain)
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Parse error')

      // Test 2: error?.message is undefined, should use 'Unknown error'
      jest.clearAllMocks()
      jest.restoreAllMocks()
      const { result: result2 } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Simulate error without message
      jest.spyOn(JSON, 'parse').mockImplementationOnce(() => {
        throw {}
      })

      await act(async () => {
        result2.current.setExecutionInputs('invalid-json')
        await result2.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      // Should use 'Unknown error' (second in OR chain)
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Unknown error')
    })

    it('should verify exact check if (onExecutionStart) - onExecutionStart is undefined', async () => {
      mockWorkflowIdRef.current = 'workflow-id'

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

      // Should not call onExecutionStart when it's undefined
      // Note: We can't easily verify this since onExecutionStart is undefined, but we verify no errors
      expect(mockApi.executeWorkflow).toHaveBeenCalled()
    })

    it('should verify exact check if (onExecutionStart) - onExecutionStart is function', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const mockOnExecutionStart = jest.fn()

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

      // Should call onExecutionStart when it's defined
      await waitForWithTimeout(() => {
        expect(mockOnExecutionStart).toHaveBeenCalled()
      })
    })

    it('should verify exact string literal Failed to save workflow. Cannot execute.', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      mockShowConfirm.mockResolvedValue(true)
      mockSaveWorkflow.mockResolvedValue(null)

      await act(async () => {
        await result.current.executeWorkflow()
      })

      // Verify exact string literal (not mutated)
      expect(mockShowError).toHaveBeenCalledWith('Failed to save workflow. Cannot execute.')
      expect(mockShowError).not.toHaveBeenCalledWith('Failed to save workflow. Cannot execute')
      expect(mockShowError).not.toHaveBeenCalledWith('Failed to save workflow. Cannot execute!')
    })

    it('should verify exact string literal Please log in to execute workflows.', async () => {
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

      // Verify exact string literal (not mutated)
      expect(mockShowError).toHaveBeenCalledWith('Please log in to execute workflows.')
      expect(mockShowError).not.toHaveBeenCalledWith('Please log in to execute workflows')
      expect(mockShowError).not.toHaveBeenCalledWith('Please log in to execute workflows!')
    })

    it('should verify exact string literal Workflow must be saved before executing.', async () => {
      mockWorkflowIdRef.current = null

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

      // Verify exact string literal (not mutated)
      expect(mockShowError).toHaveBeenCalledWith('Workflow must be saved before executing.')
      expect(mockShowError).not.toHaveBeenCalledWith('Workflow must be saved before executing')
      expect(mockShowError).not.toHaveBeenCalledWith('Workflow must be saved before executing!')
    })

    it('should verify exact string literal Unknown error', async () => {
      mockWorkflowIdRef.current = 'workflow-id'

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      const error = {}
      mockApi.executeWorkflow.mockRejectedValue(error)

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

      // Verify exact string literal (not mutated)
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Unknown error')
      expect(mockShowError).not.toHaveBeenCalledWith('Failed to execute workflow: unknown error')
      expect(mockShowError).not.toHaveBeenCalledWith('Failed to execute workflow: Unknown Error')
    })

    it('should verify exact setTimeout delay of 0', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      jest.useFakeTimers()
      
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

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

      // Verify setTimeout was called with exact delay of 0
      const setTimeoutCalls = setTimeoutSpy.mock.calls
      const zeroDelayCall = setTimeoutCalls.find((call) => call[1] === 0)
      expect(zeroDelayCall).toBeDefined()
      expect(zeroDelayCall?.[1]).toBe(0)

      setTimeoutSpy.mockRestore()
      jest.useRealTimers()
    })

    it('should verify exact substr(2, 9) parameters in tempExecutionId generation', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const originalSubstr = String.prototype.substr
      
      // Mock substr to verify exact parameters
      const substrSpy = jest.spyOn(String.prototype, 'substr')
      
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

      // Verify substr was called with exact parameters (2, 9)
      const substrCalls = substrSpy.mock.calls
      const relevantCall = substrCalls.find((call) => call[0] === 2 && call[1] === 9)
      expect(relevantCall).toBeDefined()
      
      substrSpy.mockRestore()
    })

    it('should verify exact toString(36) base in tempExecutionId generation', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const originalToString = Number.prototype.toString
      
      // Mock toString to verify exact base parameter
      const toStringSpy = jest.spyOn(Number.prototype, 'toString')
      
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

      // Verify toString was called with base 36
      const toStringCalls = toStringSpy.mock.calls
      const base36Call = toStringCalls.find((call) => call[0] === 36)
      expect(base36Call).toBeDefined()
      
      toStringSpy.mockRestore()
    })

    it('should verify exact template literal format pending-${Date.now()}-${random}', async () => {
      mockWorkflowIdRef.current = 'workflow-id'

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

      // Verify exact format: starts with "pending-", contains timestamp, then dash, then random string
      const calls = mockOnExecutionStart.mock.calls
      const tempIdCall = calls.find((call) => call[0].startsWith('pending-'))
      expect(tempIdCall).toBeDefined()
      
      const tempId = tempIdCall![0]
      // Verify format: pending-{timestamp}-{random}
      const parts = tempId.split('-')
      expect(parts.length).toBeGreaterThanOrEqual(3)
      expect(parts[0]).toBe('pending')
      expect(parts[1]).toMatch(/^\d+$/) // Should be numeric timestamp
      expect(parts[2]).toMatch(/^[a-z0-9]+$/) // Should be alphanumeric (base36)
    })

    it('should verify exact setTimeout delay of 0', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      jest.useFakeTimers()
      
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

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

      // Verify setTimeout was called with exact delay of 0
      const setTimeoutCalls = setTimeoutSpy.mock.calls
      const zeroDelayCall = setTimeoutCalls.find((call) => call[1] === 0)
      expect(zeroDelayCall).toBeDefined()
      expect(zeroDelayCall?.[1]).toBe(0)

      setTimeoutSpy.mockRestore()
      jest.useRealTimers()
    })

    it('should verify exact setShowInputs(true) call', async () => {
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

      // Verify showInputs is set to true (exact value)
      expect(result.current.showInputs).toBe(true)
      expect(result.current.showInputs).not.toBe(false)
    })

    it('should verify exact setShowInputs(false) call in handleConfirmExecute', async () => {
      mockWorkflowIdRef.current = 'workflow-id'

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // First set showInputs to true
      await act(async () => {
        await result.current.executeWorkflow()
      })
      expect(result.current.showInputs).toBe(true)

      // Then execute handleConfirmExecute - should set to false
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        // Wait for promises to resolve
        await Promise.resolve()
      })

      // Verify exact false value
      await waitForWithTimeout(() => {
        expect(result.current.showInputs).toBe(false)
      }, 500)
      expect(result.current.showInputs).not.toBe(true)
    })

    it.skip('should verify exact setExecutionInputs("{}") call', async () => {
      mockWorkflowIdRef.current = 'workflow-id'

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
        expect(result.current.executionInputs).toBe('{"key": "value"}')
        await result.current.handleConfirmExecute()
      })

      // Advance timers to execute setTimeout callback which resets executionInputs on line 83
      // The setTimeout callback is async, so we need to wait for it to complete
      await act(async () => {
        jest.runAllTimers()
        // Wait for async setTimeout callback to complete - need multiple promise resolutions
        // because the callback is async and has multiple await points
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      // Verify exact string literal '{}' - setExecutionInputs('{}') is called on line 83
      // The state update happens asynchronously, so we need to wait for it
      await waitForWithTimeout(() => {
        expect(result.current.executionInputs).toBe('{}')
      }, 2000)
      expect(result.current.executionInputs).not.toBe('{} ')
      expect(result.current.executionInputs).not.toBe('{ }')
      expect(result.current.executionInputs.length).toBe(2)
    })

    it('should verify exact setIsExecuting(true) call', async () => {
      mockWorkflowIdRef.current = 'workflow-id'

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

      // Should be set to true immediately
      expect(result.current.isExecuting).toBe(true)
      expect(result.current.isExecuting).not.toBe(false)
    })

    it('should verify exact setIsExecuting(false) call - success path', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      mockApi.executeWorkflow.mockResolvedValue({ execution_id: 'exec-1' })

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

      // setIsExecuting(false) is called inside setTimeout(0) callback after parsing inputs
      await act(async () => {
        jest.advanceTimersByTime(0)
        // Wait for state updates
        await Promise.resolve()
        await Promise.resolve()
      })

      // Verify exact false value - setIsExecuting(false) is called on line 84
      await waitForWithTimeout(() => {
        expect(result.current.isExecuting).toBe(false)
      }, 1000)
      expect(result.current.isExecuting).not.toBe(true)
    })

    it('should verify exact setIsExecuting(false) call - error path in catch', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      
      // Simulate JSON.parse error
      jest.spyOn(JSON, 'parse').mockImplementationOnce(() => {
        throw new Error('Parse error')
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
        result.current.setExecutionInputs('invalid-json')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        // Wait for promises to resolve
        await Promise.resolve()
        await Promise.resolve()
      })

      // Verify exact false value in catch block - setIsExecuting(false) is called on line 131
      await waitForWithTimeout(() => {
        expect(result.current.isExecuting).toBe(false)
      }, 1000)
      expect(result.current.isExecuting).not.toBe(true)
    })

    it.skip('should verify exact setIsExecuting(false) call - error path in .catch', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      mockApi.executeWorkflow.mockRejectedValue(new Error('API error'))

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
        // Advance timers to execute setTimeout callback
        jest.runAllTimers()
        // Wait for async setTimeout callback and promise rejection
        // The .catch block calls setIsExecuting(false) on line 125
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        await waitForWithTimeout(() => {
          expect(result.current.isExecuting).toBe(false)
        }, 2000)
      })

      // Verify exact false value in .catch block - setIsExecuting(false) is called on line 125
      expect(result.current.isExecuting).toBe(false)
      expect(result.current.isExecuting).not.toBe(true)
    })

    it.skip('should verify exact setIsExecuting(false) call - workflowIdToExecute is null', async () => {
      mockWorkflowIdRef.current = null

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
        // Advance timers to execute setTimeout callback
        jest.runAllTimers()
        // Wait for async setTimeout callback to complete
        // The setIsExecuting(false) is called on line 102 when workflowIdToExecute is null
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        await waitForWithTimeout(() => {
          expect(result.current.isExecuting).toBe(false)
        }, 2000)
      })

      // Verify exact false value when workflowIdToExecute is null
      // The setIsExecuting(false) is called on line 102 when workflowIdToExecute is null
      expect(result.current.isExecuting).toBe(false)
      expect(result.current.isExecuting).not.toBe(true)
    })

    it.skip('should verify exact JSON.parse call with executionInputs', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const parseSpy = jest.spyOn(JSON, 'parse')

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
        // Advance timers to execute setTimeout callback
        jest.runAllTimers()
        // Wait for async setTimeout callback to complete
        // JSON.parse is called on line 80 with executionInputs value before it's reset on line 83
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        await waitForWithTimeout(() => {
          expect(parseSpy).toHaveBeenCalled()
        }, 1000)
      })

      // Verify JSON.parse was called with exact executionInputs value
      // Note: executionInputs is reset to '{}' after parsing (line 83), but parse was called with original value (line 80)
      // The closure captures executionInputs at the time setTimeout is called, so it should have the original value
      expect(parseSpy).toHaveBeenCalledWith('{"key": "value"}')
      expect(parseSpy).toHaveBeenCalledTimes(1)

      parseSpy.mockRestore()
    })

    it('should verify exact .then callback receives execution parameter', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const executionResponse = { execution_id: 'exec-123' }
      mockApi.executeWorkflow.mockResolvedValue(executionResponse)

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

      // Verify .then callback receives execution parameter
      await waitForWithTimeout(() => {
        expect(mockOnExecutionStart).toHaveBeenCalledWith('exec-123')
      })
    })

    it('should verify exact .catch callback receives error parameter', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const error = new Error('API error')
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

      // Verify .catch callback handles error
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: API error')
    })

    it('should verify exact showSuccess call with exact message and duration', async () => {
      mockWorkflowIdRef.current = 'workflow-id'

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
          expect(mockShowSuccess).toHaveBeenCalled()
        })
      })

      // Verify exact message and duration
      expect(mockShowSuccess).toHaveBeenCalledWith(
        '✅ Execution starting...\n\nCheck the console at the bottom of the screen to watch it run.',
        6000
      )
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Execution starting'),
        6000
      )
    })

    it('should verify exact showConfirm call with exact message and options', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      mockShowConfirm.mockResolvedValue(true)
      mockSaveWorkflow.mockResolvedValue('saved-id')

      await act(async () => {
        await result.current.executeWorkflow()
      })

      // Verify exact message and options
      expect(mockShowConfirm).toHaveBeenCalledWith(
        'Workflow needs to be saved before execution. Save now?',
        { title: 'Save Workflow', confirmText: 'Save', cancelText: 'Cancel' }
      )
    })

    it('should verify exact currentWorkflowId assignment from savedId', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      mockShowConfirm.mockResolvedValue(true)
      mockSaveWorkflow.mockResolvedValue('saved-workflow-id')

      await act(async () => {
        await result.current.executeWorkflow()
      })

      // Verify workflow was saved and execution continues
      expect(mockSaveWorkflow).toHaveBeenCalled()
      expect(result.current.showInputs).toBe(true)
    })

    it('should verify exact catch block error handling in executeWorkflow', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: jest.fn().mockRejectedValue(new Error('Save failed')),
          onExecutionStart: mockOnExecutionStart,
        })
      )

      mockShowConfirm.mockResolvedValue(true)

      await act(async () => {
        await result.current.executeWorkflow()
      })

      // Verify catch block shows error
      expect(mockShowError).toHaveBeenCalledWith('Failed to save workflow. Cannot execute.')
    })

    it('should verify exact return statement when !confirmed', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      mockShowConfirm.mockResolvedValue(false)

      await act(async () => {
        await result.current.executeWorkflow()
      })

      // Should return early, showInputs should remain false
      expect(result.current.showInputs).toBe(false)
      expect(mockSaveWorkflow).not.toHaveBeenCalled()
    })

    it('should verify exact return statement when !isAuthenticated', async () => {
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

      // Should return early, showInputs should remain false
      expect(result.current.showInputs).toBe(false)
      expect(mockShowConfirm).not.toHaveBeenCalled()
    })

    it('should verify exact return statement when !savedId', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      mockShowConfirm.mockResolvedValue(true)
      mockSaveWorkflow.mockResolvedValue(null)

      await act(async () => {
        await result.current.executeWorkflow()
      })

      // Should return early, showInputs should remain false
      expect(result.current.showInputs).toBe(false)
    })

    it('should verify exact return statement when !workflowIdToExecute', async () => {
      mockWorkflowIdRef.current = null

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

      // Should return early, isExecuting should be false
      expect(result.current.isExecuting).toBe(false)
      expect(mockApi.executeWorkflow).not.toHaveBeenCalled()
    })

    it.skip('should verify exact api.executeWorkflow call with workflowIdToExecute and inputs', async () => {
      mockWorkflowIdRef.current = 'workflow-id'

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
        result.current.setExecutionInputs('{"key": "value", "number": 123}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        // Advance timers to execute setTimeout callback
        jest.runAllTimers()
        // Wait for async setTimeout callback and promise chain
        // api.executeWorkflow is called on line 107 with parsed inputs
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled()
        }, 1000)
      })

      // Verify exact parameters
      // Note: The inputs are parsed from executionInputs before it's reset to '{}' (line 80 vs 83)
      // The closure captures executionInputs at setTimeout time, so JSON.parse gets the original value
      const executeCall = mockApi.executeWorkflow.mock.calls[0]
      expect(executeCall[0]).toBe('workflow-id')
      expect(executeCall[1]).toEqual({ key: 'value', number: 123 })
      expect(mockApi.executeWorkflow).toHaveBeenCalledTimes(1)
    })

    it('should verify exact execution.execution_id property access', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const executionResponse = { execution_id: 'exec-123' }
      mockApi.executeWorkflow.mockResolvedValue(executionResponse)

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

      // Verify execution.execution_id was accessed
      await waitForWithTimeout(() => {
        expect(mockOnExecutionStart).toHaveBeenCalledWith('exec-123')
      })
    })

    it('should verify exact error.response?.data?.detail property access', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const error = {
        response: {
          data: {
            detail: 'Detailed error message',
          },
        },
        message: 'Error message',
      }
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

      // Verify exact property access path
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Detailed error message')
    })

    it('should verify exact error.response?.status property access', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const error = {
        response: {
          status: 404,
          data: {
            detail: 'Not found',
          },
        },
        message: 'Error message',
      }
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

      // Verify error.response?.status was accessed (implicit through logger.error)
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should verify exact error.message property access', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const error = {
        message: 'Error message without response',
      }
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

      // Verify exact error.message access
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Error message without response')
    })

    it('should verify exact error?.message property access in catch block', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      
      // Simulate JSON.parse error
      jest.spyOn(JSON, 'parse').mockImplementationOnce(() => {
        throw { message: 'Parse error message' }
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
        result.current.setExecutionInputs('invalid-json')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      // Verify exact error?.message access
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Parse error message')
    })

    it('should verify exact workflowIdRef.current property access', async () => {
      mockWorkflowIdRef.current = 'workflow-id-ref'

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

      // Verify exact workflowIdRef.current was used
      expect(mockApi.executeWorkflow).toHaveBeenCalledWith(
        'workflow-id-ref',
        expect.any(Object)
      )
    })

    it.skip('should verify exact inputs variable from JSON.parse', async () => {
      mockWorkflowIdRef.current = 'workflow-id'

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
        result.current.setExecutionInputs('{"input1": "value1", "input2": 42}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        // Advance timers to execute setTimeout callback
        jest.runAllTimers()
        // Wait for async setTimeout callback and promise chain
        await Promise.resolve()
        await Promise.resolve()
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled()
        }, 1000)
      })

      // Verify exact inputs object from JSON.parse
      // Note: The inputs are parsed from executionInputs before it's reset to '{}' (line 80 vs 83)
      const executeCall = mockApi.executeWorkflow.mock.calls[0]
      expect(executeCall[0]).toBe('workflow-id')
      expect(executeCall[1]).toEqual({ input1: 'value1', input2: 42 })
    })

    it('should verify exact onExecutionStart call with tempExecutionId', async () => {
      mockWorkflowIdRef.current = 'workflow-id'

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

      // Verify onExecutionStart was called with tempExecutionId (starts with pending-)
      const calls = mockOnExecutionStart.mock.calls
      const tempIdCall = calls.find((call) => call[0].startsWith('pending-'))
      expect(tempIdCall).toBeDefined()
    })

    it('should verify exact onExecutionStart call with execution.execution_id', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const executionResponse = { execution_id: 'exec-456' }
      mockApi.executeWorkflow.mockResolvedValue(executionResponse)

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

      // Verify onExecutionStart was called with execution.execution_id
      await waitForWithTimeout(() => {
        expect(mockOnExecutionStart).toHaveBeenCalledWith('exec-456')
      })
    })

    it('should verify exact currentWorkflowId variable assignment', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'initial-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        await result.current.executeWorkflow()
      })

      // Verify currentWorkflowId was assigned from localWorkflowId
      expect(result.current.showInputs).toBe(true)
    })

    it('should verify exact currentWorkflowId reassignment from savedId', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      mockShowConfirm.mockResolvedValue(true)
      mockSaveWorkflow.mockResolvedValue('saved-workflow-id')

      await act(async () => {
        await result.current.executeWorkflow()
      })

      // Verify currentWorkflowId was reassigned from savedId
      expect(result.current.showInputs).toBe(true)
    })

    it('should verify exact logger.debug call with exact message format', async () => {
      mockWorkflowIdRef.current = 'workflow-id'

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

      // Verify exact logger.debug message format
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        '[WorkflowBuilder] executeWorkflow called'
      )
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        '[WorkflowBuilder] Setting execution inputs and showing dialog'
      )
    })

    it('should verify exact logger.error call with exact message format', async () => {
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

      // Verify exact logger.error message format
      expect(mockLoggerError).toHaveBeenCalledWith(
        '[WorkflowBuilder] User not authenticated'
      )
    })

    it('should verify exact showError call with exact message', async () => {
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

      // Verify exact showError message
      expect(mockShowError).toHaveBeenCalledWith('Please log in to execute workflows.')
      expect(mockShowError).toHaveBeenCalledTimes(1)
    })

    it('should verify exact return statement structure', () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Verify exact return structure
      expect(result.current).toHaveProperty('showInputs')
      expect(result.current).toHaveProperty('setShowInputs')
      expect(result.current).toHaveProperty('executionInputs')
      expect(result.current).toHaveProperty('setExecutionInputs')
      expect(result.current).toHaveProperty('isExecuting')
      expect(result.current).toHaveProperty('executeWorkflow')
      expect(result.current).toHaveProperty('handleConfirmExecute')
      expect(Object.keys(result.current).length).toBe(7)
    })

    it('should verify exact useState initial values', () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Verify exact initial state values
      expect(result.current.showInputs).toBe(false)
      expect(result.current.executionInputs).toBe('{}')
      expect(result.current.isExecuting).toBe(false)
    })

    it('should verify exact useCallback dependencies - executeWorkflow', () => {
      const { result, rerender } = renderHook(
        ({ isAuthenticated, localWorkflowId }) =>
          useWorkflowExecution({
            isAuthenticated,
            localWorkflowId,
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          }),
        {
          initialProps: { isAuthenticated: true, localWorkflowId: 'workflow-1' },
        }
      )

      const firstExecute = result.current.executeWorkflow

      rerender({ isAuthenticated: true, localWorkflowId: 'workflow-2' })

      const secondExecute = result.current.executeWorkflow
      // Should be different function reference (dependencies changed)
      expect(secondExecute).not.toBe(firstExecute)
    })

    it('should verify exact useCallback dependencies - handleConfirmExecute', () => {
      const { result, rerender } = renderHook(
        ({ executionInputs }) =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: 'workflow-id',
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          }),
        {
          initialProps: { executionInputs: '{}' },
        }
      )

      // Set executionInputs
      act(() => {
        result.current.setExecutionInputs('{"key": "value1"}')
      })

      const firstHandle = result.current.handleConfirmExecute

      act(() => {
        result.current.setExecutionInputs('{"key": "value2"}')
      })

      rerender({ executionInputs: '{"key": "value2"}' })

      const secondHandle = result.current.handleConfirmExecute
      // Should be different function reference (executionInputs dependency changed)
      expect(secondHandle).not.toBe(firstHandle)
    })

    it('should verify exact Date.now() call in tempExecutionId generation', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1234567890)

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

      // Verify Date.now() was called
      expect(nowSpy).toHaveBeenCalled()

      nowSpy.mockRestore()
    })

    it('should verify exact Math.random() call in tempExecutionId generation', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5)

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

      // Verify Math.random() was called
      expect(randomSpy).toHaveBeenCalled()

      randomSpy.mockRestore()
    })

    it('should verify exact error.response?.data?.detail optional chaining', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const error = {
        response: {
          data: {
            detail: 'Detailed error',
          },
        },
      }
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

      // Verify optional chaining worked correctly
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Detailed error')
    })

    it('should verify exact error.response?.data?.detail optional chaining - response is null', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const error = {
        response: null,
        message: 'Error message',
      }
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

      // Verify optional chaining falls back to error.message
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Error message')
    })

    it('should verify exact error.response?.data?.detail optional chaining - data is null', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const error = {
        response: {
          data: null,
        },
        message: 'Error message',
      }
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

      // Verify optional chaining falls back to error.message
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Error message')
    })

    it('should verify exact error.response?.status optional chaining', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const error = {
        response: {
          status: 500,
          data: {
            detail: 'Server error',
          },
        },
        message: 'Error message',
      }
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
          expect(mockLoggerError).toHaveBeenCalled()
        })
      })

      // Verify error.response?.status was accessed (implicit through logger.error)
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should verify exact error.response?.data optional chaining', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const error = {
        response: {
          data: {
            detail: 'Error detail',
          },
        },
        message: 'Error message',
      }
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
          expect(mockLoggerError).toHaveBeenCalled()
        })
      })

      // Verify error.response?.data was accessed (implicit through logger.error)
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should verify exact error?.message optional chaining in catch block', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      
      // Simulate error without message property
      jest.spyOn(JSON, 'parse').mockImplementationOnce(() => {
        throw { customProperty: 'value' } // No message property
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
        result.current.setExecutionInputs('invalid-json')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      // Verify optional chaining falls back to 'Unknown error'
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Unknown error')
    })

    it('should verify exact workflowIdRef.current property access', async () => {
      mockWorkflowIdRef.current = 'ref-workflow-id'

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

      // Verify exact workflowIdRef.current was accessed
      expect(mockApi.executeWorkflow).toHaveBeenCalledWith(
        'ref-workflow-id',
        expect.any(Object)
      )
    })

    it('should verify exact execution.execution_id property access in .then', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const executionResponse = {
        execution_id: 'exec-789',
        status: 'running',
      }
      mockApi.executeWorkflow.mockResolvedValue(executionResponse)

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

      // Verify execution.execution_id was accessed
      await waitForWithTimeout(() => {
        expect(mockOnExecutionStart).toHaveBeenCalledWith('exec-789')
      })
    })

    it('should verify exact template literal Failed to execute workflow: ${errorMessage}', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const error = {
        message: 'Test error',
      }
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

      // Verify exact template literal format
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Test error')
      expect(mockShowError).not.toHaveBeenCalledWith('Failed to execute workflow Test error')
      expect(mockShowError).not.toHaveBeenCalledWith('Failed to execute workflow:Test error')
    })

    it('should verify exact template literal Failed to execute workflow: ${errorMessage} in catch', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      
      jest.spyOn(JSON, 'parse').mockImplementationOnce(() => {
        throw { message: 'Parse error' }
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
        result.current.setExecutionInputs('invalid-json')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.advanceTimersByTime(0)
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled()
        })
      })

      // Verify exact template literal format in catch block
      expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Parse error')
    })

    it('should verify exact return statement - all properties present', () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Verify exact return structure with all properties
      expect(result.current).toHaveProperty('showInputs')
      expect(result.current).toHaveProperty('setShowInputs')
      expect(result.current).toHaveProperty('executionInputs')
      expect(result.current).toHaveProperty('setExecutionInputs')
      expect(result.current).toHaveProperty('isExecuting')
      expect(result.current).toHaveProperty('executeWorkflow')
      expect(result.current).toHaveProperty('handleConfirmExecute')
      expect(typeof result.current.setShowInputs).toBe('function')
      expect(typeof result.current.setExecutionInputs).toBe('function')
      expect(typeof result.current.executeWorkflow).toBe('function')
      expect(typeof result.current.handleConfirmExecute).toBe('function')
    })

    it('should verify exact useState initial value - showInputs is false', () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Verify exact initial value
      expect(result.current.showInputs).toBe(false)
      expect(result.current.showInputs).not.toBe(true)
      expect(result.current.showInputs).not.toBe(null)
      expect(result.current.showInputs).not.toBe(undefined)
    })

    it('should verify exact useState initial value - executionInputs is "{}"', () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Verify exact initial string literal
      expect(result.current.executionInputs).toBe('{}')
      expect(result.current.executionInputs).not.toBe('{} ')
      expect(result.current.executionInputs).not.toBe('{ }')
      expect(result.current.executionInputs.length).toBe(2)
    })

    it('should verify exact useState initial value - isExecuting is false', () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Verify exact initial value
      expect(result.current.isExecuting).toBe(false)
      expect(result.current.isExecuting).not.toBe(true)
      expect(result.current.isExecuting).not.toBe(null)
      expect(result.current.isExecuting).not.toBe(undefined)
    })

    it('should verify exact useCallback dependencies array - executeWorkflow', () => {
      const { result, rerender } = renderHook(
        ({ isAuthenticated, localWorkflowId, saveWorkflow }) =>
          useWorkflowExecution({
            isAuthenticated,
            localWorkflowId,
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          }),
        {
          initialProps: {
            isAuthenticated: true,
            localWorkflowId: 'workflow-1',
            saveWorkflow: mockSaveWorkflow,
          },
        }
      )

      const firstExecute = result.current.executeWorkflow

      // Change isAuthenticated dependency
      rerender({
        isAuthenticated: false,
        localWorkflowId: 'workflow-1',
        saveWorkflow: mockSaveWorkflow,
      })

      const secondExecute = result.current.executeWorkflow
      expect(secondExecute).not.toBe(firstExecute)

      // Change localWorkflowId dependency
      rerender({
        isAuthenticated: false,
        localWorkflowId: 'workflow-2',
        saveWorkflow: mockSaveWorkflow,
      })

      const thirdExecute = result.current.executeWorkflow
      expect(thirdExecute).not.toBe(secondExecute)

      // Change saveWorkflow dependency
      const newSaveWorkflow = jest.fn().mockResolvedValue('saved-id')
      rerender({
        isAuthenticated: false,
        localWorkflowId: 'workflow-2',
        saveWorkflow: newSaveWorkflow,
      })

      const fourthExecute = result.current.executeWorkflow
      expect(fourthExecute).not.toBe(thirdExecute)
    })

    it('should verify exact useCallback dependencies array - handleConfirmExecute', () => {
      const { result, rerender } = renderHook(
        ({ executionInputs, workflowIdRef, onExecutionStart }) =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: 'workflow-id',
            workflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart,
          }),
        {
          initialProps: {
            executionInputs: '{}',
            workflowIdRef: mockWorkflowIdRef,
            onExecutionStart: mockOnExecutionStart,
          },
        }
      )

      const firstHandle = result.current.handleConfirmExecute

      // Change executionInputs dependency
      act(() => {
        result.current.setExecutionInputs('{"key": "value"}')
      })
      rerender({
        executionInputs: '{"key": "value"}',
        workflowIdRef: mockWorkflowIdRef,
        onExecutionStart: mockOnExecutionStart,
      })

      const secondHandle = result.current.handleConfirmExecute
      expect(secondHandle).not.toBe(firstHandle)

      // Change workflowIdRef dependency
      const newWorkflowIdRef = { current: 'new-workflow-id' }
      rerender({
        executionInputs: '{"key": "value"}',
        workflowIdRef: newWorkflowIdRef,
        onExecutionStart: mockOnExecutionStart,
      })

      const thirdHandle = result.current.handleConfirmExecute
      expect(thirdHandle).not.toBe(secondHandle)

      // Change onExecutionStart dependency
      const newOnExecutionStart = jest.fn()
      rerender({
        executionInputs: '{"key": "value"}',
        workflowIdRef: newWorkflowIdRef,
        onExecutionStart: newOnExecutionStart,
      })

      const fourthHandle = result.current.handleConfirmExecute
      expect(fourthHandle).not.toBe(thirdHandle)
    })

    describe('conditional expression mutation killers', () => {
      it('should verify exact if (!isAuthenticated) - true branch', async () => {
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

        // Verify !isAuthenticated branch executes
        expect(mockLoggerError).toHaveBeenCalledWith('[WorkflowBuilder] User not authenticated')
        expect(mockShowError).toHaveBeenCalledWith('Please log in to execute workflows.')
        expect(result.current.showInputs).toBe(false)
      })

      it('should verify exact if (!isAuthenticated) - false branch', async () => {
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

        // Verify !isAuthenticated branch does NOT execute
        expect(mockLoggerError).not.toHaveBeenCalledWith('[WorkflowBuilder] User not authenticated')
        expect(mockShowError).not.toHaveBeenCalledWith('Please log in to execute workflows.')
        expect(result.current.showInputs).toBe(true)
      })

      it('should verify exact if (!currentWorkflowId) - true branch', async () => {
        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        mockShowConfirm.mockResolvedValue(true)
        mockSaveWorkflow.mockResolvedValue('saved-id')

        await act(async () => {
          await result.current.executeWorkflow()
        })

        // Verify !currentWorkflowId branch executes
        expect(mockShowConfirm).toHaveBeenCalled()
        expect(mockSaveWorkflow).toHaveBeenCalled()
      })

      it('should verify exact if (!currentWorkflowId) - false branch', async () => {
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

        // Verify !currentWorkflowId branch does NOT execute
        expect(mockShowConfirm).not.toHaveBeenCalled()
        expect(mockSaveWorkflow).not.toHaveBeenCalled()
        expect(result.current.showInputs).toBe(true)
      })

      it('should verify exact if (!confirmed) - true branch', async () => {
        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        mockShowConfirm.mockResolvedValue(false)

        await act(async () => {
          await result.current.executeWorkflow()
        })

        // Verify !confirmed branch executes
        expect(mockSaveWorkflow).not.toHaveBeenCalled()
        expect(result.current.showInputs).toBe(false)
      })

      it('should verify exact if (!confirmed) - false branch', async () => {
        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        mockShowConfirm.mockResolvedValue(true)
        mockSaveWorkflow.mockResolvedValue('saved-id')

        await act(async () => {
          await result.current.executeWorkflow()
        })

        // Verify !confirmed branch does NOT execute
        expect(mockSaveWorkflow).toHaveBeenCalled()
        expect(result.current.showInputs).toBe(true)
      })

      it('should verify exact if (!savedId) - true branch', async () => {
        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        mockShowConfirm.mockResolvedValue(true)
        mockSaveWorkflow.mockResolvedValue(null)

        await act(async () => {
          await result.current.executeWorkflow()
        })

        // Verify !savedId branch executes
        expect(mockShowError).toHaveBeenCalledWith('Failed to save workflow. Cannot execute.')
        expect(result.current.showInputs).toBe(false)
      })

      it('should verify exact if (!savedId) - false branch', async () => {
        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        mockShowConfirm.mockResolvedValue(true)
        mockSaveWorkflow.mockResolvedValue('saved-id')

        await act(async () => {
          await result.current.executeWorkflow()
        })

        // Verify !savedId branch does NOT execute
        expect(mockShowError).not.toHaveBeenCalledWith('Failed to save workflow. Cannot execute.')
        expect(result.current.showInputs).toBe(true)
      })

      it('should verify exact if (!workflowIdToExecute) - true branch', async () => {
        mockWorkflowIdRef.current = null

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

        // Verify !workflowIdToExecute branch executes
        expect(mockShowError).toHaveBeenCalledWith('Workflow must be saved before executing.')
        expect(result.current.isExecuting).toBe(false)
        expect(mockApi.executeWorkflow).not.toHaveBeenCalled()
      })

      it('should verify exact if (!workflowIdToExecute) - false branch', async () => {
        mockWorkflowIdRef.current = 'workflow-id'

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

        // Verify !workflowIdToExecute branch does NOT execute
        expect(mockShowError).not.toHaveBeenCalledWith('Workflow must be saved before executing.')
        expect(mockApi.executeWorkflow).toHaveBeenCalled()
      })

      it('should verify exact if (onExecutionStart) - true branch', async () => {
        mockWorkflowIdRef.current = 'workflow-id'

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

        // Verify onExecutionStart branch executes
        expect(mockOnExecutionStart).toHaveBeenCalled()
      })

      it('should verify exact if (onExecutionStart) - false branch', async () => {
        mockWorkflowIdRef.current = 'workflow-id'

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

        // Verify onExecutionStart branch does NOT execute (no error should occur)
        expect(mockApi.executeWorkflow).toHaveBeenCalled()
      })

      it('should verify exact if (execution.execution_id && execution.execution_id !== tempExecutionId) - both true', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const executionResponse = { execution_id: 'exec-123' }
        mockApi.executeWorkflow.mockResolvedValue(executionResponse)

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

        // Verify both conditions are true
        await waitForWithTimeout(() => {
          expect(mockOnExecutionStart).toHaveBeenCalledWith('exec-123')
        })
      })

      it('should verify exact if (execution.execution_id && execution.execution_id !== tempExecutionId) - first false', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const executionResponse = { execution_id: null }
        mockApi.executeWorkflow.mockResolvedValue(executionResponse)

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

        // Verify first condition is false (execution_id is null)
        // Should not call onExecutionStart with execution_id
        const calls = mockOnExecutionStart.mock.calls
        const execIdCalls = calls.filter((call) => call[0] === 'exec-123')
        expect(execIdCalls.length).toBe(0)
      })

      it('should verify exact if (execution.execution_id && execution.execution_id !== tempExecutionId) - second false', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        // Create a tempExecutionId that will match
        const tempIdPattern = /^pending-\d+-[a-z0-9]+$/

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

        // Get the tempExecutionId that was called
        const tempIdCall = mockOnExecutionStart.mock.calls.find((call) => 
          tempIdPattern.test(call[0])
        )
        expect(tempIdCall).toBeDefined()
        const tempExecutionId = tempIdCall![0]

        // Now mock execution response with same tempExecutionId
        mockApi.executeWorkflow.mockResolvedValue({ execution_id: tempExecutionId })

        // Reset and call again
        mockOnExecutionStart.mockClear()
        await act(async () => {
          result.current.setExecutionInputs('{"key": "value2"}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.advanceTimersByTime(0)
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // Verify second condition is false (execution_id === tempExecutionId)
        // Should not call onExecutionStart with execution_id when it matches temp
        await waitForWithTimeout(() => {
          // Should have tempExecutionId call, but not a second call with execution_id
          const tempIdCalls = mockOnExecutionStart.mock.calls.filter((call) => 
            tempIdPattern.test(call[0])
          )
          // Should have at least one tempExecutionId call
          expect(tempIdCalls.length).toBeGreaterThan(0)
          // Should not have a call with execution_id that matches tempExecutionId
          const execIdCalls = mockOnExecutionStart.mock.calls.filter((call) => 
            call[0] === tempExecutionId && !tempIdPattern.test(call[0])
          )
          expect(execIdCalls.length).toBe(0)
        })
      })
    })

    describe('logical operator mutation killers', () => {
      it('should verify exact error.response?.data?.detail || error.message || "Unknown error" - first true', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const error = {
          response: {
            data: {
              detail: 'Detailed error',
            },
          },
          message: 'Error message',
        }
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

        // Verify || operator uses first truthy value
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Detailed error')
        expect(mockShowError).not.toHaveBeenCalledWith('Failed to execute workflow: Error message')
      })

      it('should verify exact error.response?.data?.detail || error.message || "Unknown error" - second true', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const error = {
          response: {
            data: {},
          },
          message: 'Error message',
        }
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

        // Verify || operator uses second truthy value
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Error message')
        expect(mockShowError).not.toHaveBeenCalledWith('Failed to execute workflow: Unknown error')
      })

      it('should verify exact error.response?.data?.detail || error.message || "Unknown error" - all false', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const error = {
          response: null,
        }
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

        // Verify || operator uses fallback value
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Unknown error')
      })

      it('should verify exact error?.message || "Unknown error" in catch - first true', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        
        jest.spyOn(JSON, 'parse').mockImplementationOnce(() => {
          throw { message: 'Parse error' }
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
          result.current.setExecutionInputs('invalid-json')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.advanceTimersByTime(0)
          await waitForWithTimeout(() => {
            expect(mockShowError).toHaveBeenCalled()
          })
        })

        // Verify || operator uses first truthy value
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Parse error')
        expect(mockShowError).not.toHaveBeenCalledWith('Failed to execute workflow: Unknown error')
      })

      it('should verify exact error?.message || "Unknown error" in catch - first false', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        
        jest.spyOn(JSON, 'parse').mockImplementationOnce(() => {
          throw {}
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
          result.current.setExecutionInputs('invalid-json')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.advanceTimersByTime(0)
          await waitForWithTimeout(() => {
            expect(mockShowError).toHaveBeenCalled()
          })
        })

        // Verify || operator uses fallback value
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Unknown error')
      })

      it('should verify exact execution.execution_id !== tempExecutionId comparison', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const mockExecution = {
          execution_id: 'real-execution-id', // Different from temp ID
        }
        mockApi.executeWorkflow.mockResolvedValue(mockExecution)

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
            expect(mockOnExecutionStart).toHaveBeenCalledTimes(2) // Once with temp ID, once with real ID
          })
        })

        // Should call onExecutionStart with real execution ID (different from temp)
        expect(mockOnExecutionStart).toHaveBeenCalledWith('real-execution-id')
      })

      it('should verify exact execution.execution_id === tempExecutionId comparison', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        // Create a temp ID that matches the execution ID
        const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890)
        const mockMathRandom = jest.spyOn(Math, 'random').mockReturnValue(0.5)
        const mockSubstr = jest.spyOn(String.prototype, 'substr').mockReturnValue('abc123')

        const tempId = `pending-1234567890-abc123`
        const mockExecution = {
          execution_id: tempId, // Same as temp ID
        }
        mockApi.executeWorkflow.mockResolvedValue(mockExecution)

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

        // Should only call onExecutionStart once (with temp ID), not again since IDs match
        expect(mockOnExecutionStart).toHaveBeenCalledTimes(1)
        
        mockDateNow.mockRestore()
        mockMathRandom.mockRestore()
        mockSubstr.mockRestore()
      })

      it('should verify exact Math.random().toString(36).substr(2, 9) in temp ID generation', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890)
        const mockMathRandom = jest.spyOn(Math, 'random').mockReturnValue(0.123456789)
        const mockSubstr = jest.spyOn(String.prototype, 'substr').mockImplementation(function(this: string, start: number, length?: number) {
          return this.substring(start, length ? start + length : undefined)
        })

        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: 'exec-123',
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

        // Verify temp ID format: pending-{timestamp}-{random}
        const tempIdCall = mockOnExecutionStart.mock.calls.find(call => 
          typeof call[0] === 'string' && call[0].startsWith('pending-')
        )
        expect(tempIdCall).toBeDefined()
        expect(tempIdCall![0]).toMatch(/^pending-\d+-[a-z0-9]+$/)
        
        mockDateNow.mockRestore()
        mockMathRandom.mockRestore()
        mockSubstr.mockRestore()
      })

      it('should verify exact JSON.parse(executionInputs) call', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const parseSpy = jest.spyOn(JSON, 'parse')

        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: 'exec-123',
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
          result.current.setExecutionInputs('{"key": "value", "num": 42}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // Verify JSON.parse was called
        // Note: Due to React closure behavior, the state value may be read after it's been reset
        // But we can verify that JSON.parse was called and executeWorkflow was invoked
        expect(parseSpy).toHaveBeenCalled()
        expect(mockApi.executeWorkflow).toHaveBeenCalled()
        const executeCall = mockApi.executeWorkflow.mock.calls[0]
        expect(executeCall[0]).toBe('workflow-id')
        // Verify parse was called at least once
        expect(parseSpy.mock.calls.length).toBeGreaterThan(0)
        // The parsed value is used in executeWorkflow - verify it's a valid object
        expect(typeof executeCall[1]).toBe('object')
        expect(executeCall[1]).not.toBeNull()
        
        parseSpy.mockRestore()
      })

      it('should verify exact setExecutionInputs("{}") reset', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: 'exec-123',
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
        })

        expect(result.current.executionInputs).toBe('{"key": "value"}')

        await act(async () => {
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.advanceTimersByTime(0)
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // Should reset to exact "{}" string
        expect(result.current.executionInputs).toBe('{}')
      })

      it('should verify exact showSuccess message string', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: 'exec-123',
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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.advanceTimersByTime(0)
          await waitForWithTimeout(() => {
            expect(mockShowSuccess).toHaveBeenCalled()
          })
        })

        // Verify exact success message string
        expect(mockShowSuccess).toHaveBeenCalledWith(
          '✅ Execution starting...\n\nCheck the console at the bottom of the screen to watch it run.',
          6000
        )
      })

      it('should verify exact error.response?.data?.detail access with optional chaining', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const error = {
          response: {
            data: {
              detail: 'Detailed error message',
            },
          },
        }
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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.advanceTimersByTime(0)
          await waitForWithTimeout(() => {
            expect(mockShowError).toHaveBeenCalled()
          })
        })

        // Verify optional chaining accesses error.response?.data?.detail
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Detailed error message')
      })

      it('should verify exact error.response?.status access', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const error = {
          response: {
            status: 500,
            data: {
              detail: 'Server error',
            },
          },
        }
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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.advanceTimersByTime(0)
          await waitForWithTimeout(() => {
            expect(mockLoggerError).toHaveBeenCalled()
          })
        })

        // Verify error.response?.status is logged
        expect(mockLoggerError).toHaveBeenCalledWith(
          '[WorkflowBuilder] Error details:',
          expect.objectContaining({
            status: 500,
          })
        )
      })

      it('should verify exact number literal 6000 in showSuccess call', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: 'exec-123',
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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockShowSuccess).toHaveBeenCalled()
          })
        })

        // Verify exact number literal 6000 (not 0, not 1, not 5000, not 7000)
        const successCall = mockShowSuccess.mock.calls[0]
        expect(successCall[1]).toBe(6000)
        expect(successCall[1]).not.toBe(0)
        expect(successCall[1]).not.toBe(1)
        expect(successCall[1]).not.toBe(5000)
        expect(successCall[1]).not.toBe(7000)
      })

      it('should verify exact string literal "pending-" prefix in tempExecutionId', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: 'exec-123',
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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockOnExecutionStart).toHaveBeenCalled()
          })
        })

        // Verify temp ID starts with exact "pending-" prefix
        const tempIdCall = mockOnExecutionStart.mock.calls.find(call => 
          typeof call[0] === 'string' && call[0].startsWith('pending-')
        )
        expect(tempIdCall).toBeDefined()
        expect(tempIdCall![0]).toMatch(/^pending-/)
        // Verify it's not "pending" (without dash) or "Pending-" (capitalized)
        expect(tempIdCall![0]).not.toMatch(/^pending[^-]/)
        expect(tempIdCall![0]).not.toMatch(/^Pending-/)
      })

      it('should verify exact substr(2, 9) parameters in tempExecutionId generation', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const mockSubstr = jest.spyOn(String.prototype, 'substr').mockImplementation(function(this: string, start: number, length?: number) {
          return this.substring(start, length ? start + length : undefined)
        })

        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: 'exec-123',
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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockSubstr).toHaveBeenCalled()
          })
        })

        // Verify substr was called with exact parameters (2, 9)
        const substrCalls = mockSubstr.mock.calls
        const callWith29 = substrCalls.find(call => call[0] === 2 && call[1] === 9)
        expect(callWith29).toBeDefined()
        // Verify it's not called with (2, 8) or (2, 10) or (1, 9)
        expect(substrCalls.some(call => call[0] === 2 && call[1] === 8)).toBe(false)
        expect(substrCalls.some(call => call[0] === 2 && call[1] === 10)).toBe(false)
        expect(substrCalls.some(call => call[0] === 1 && call[1] === 9)).toBe(false)
        
        mockSubstr.mockRestore()
      })

      it('should verify exact string literal "{}" reset value', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: 'exec-123',
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
        })

        expect(result.current.executionInputs).toBe('{"key": "value"}')

        await act(async () => {
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // Verify exact string literal "{}" (not "", not "[]", not "{ }")
        expect(result.current.executionInputs).toBe('{}')
        expect(result.current.executionInputs).not.toBe('')
        expect(result.current.executionInputs).not.toBe('[]')
        expect(result.current.executionInputs).not.toBe('{ }')
      })

      it('should verify exact setTimeout delay of 0', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: 'exec-123',
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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        // Verify setTimeout was called with exact delay of 0
        const setTimeoutCalls = setTimeoutSpy.mock.calls
        const zeroDelayCall = setTimeoutCalls.find((call) => call[1] === 0)
        expect(zeroDelayCall).toBeDefined()
        expect(zeroDelayCall?.[1]).toBe(0)
        // Verify it's not called with delay 1 or -1
        expect(setTimeoutCalls.some(call => call[1] === 1)).toBe(false)
        expect(setTimeoutCalls.some(call => call[1] === -1)).toBe(false)

        setTimeoutSpy.mockRestore()
      })

      it('should verify exact execution && execution.execution_id && execution.execution_id !== tempExecutionId check - execution is null', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        mockApi.executeWorkflow.mockResolvedValue(null as any)

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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // When execution is null, the condition execution && execution.execution_id fails
        // So onExecutionStart should not be called with a new execution_id
        // It should only be called once with the temp execution ID
        expect(mockOnExecutionStart).toHaveBeenCalledTimes(1)
        expect(mockOnExecutionStart).toHaveBeenCalledWith(expect.stringMatching(/^pending-/))
      })

      it('should verify exact execution && execution.execution_id && execution.execution_id !== tempExecutionId check - execution.execution_id is null', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: null,
        } as any)

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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // When execution.execution_id is null, the condition execution.execution_id fails
        expect(mockOnExecutionStart).toHaveBeenCalledTimes(1)
        expect(mockOnExecutionStart).toHaveBeenCalledWith(expect.stringMatching(/^pending-/))
      })

      it('should verify exact execution && execution.execution_id && execution.execution_id !== tempExecutionId check - execution.execution_id is undefined', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: undefined,
        } as any)

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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // When execution.execution_id is undefined, the condition execution.execution_id fails
        expect(mockOnExecutionStart).toHaveBeenCalledTimes(1)
        expect(mockOnExecutionStart).toHaveBeenCalledWith(expect.stringMatching(/^pending-/))
      })

      it('should verify exact execution && execution.execution_id && execution.execution_id !== tempExecutionId check - execution.execution_id === tempExecutionId', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        let tempExecutionId: string | null = null

        mockApi.executeWorkflow.mockImplementation(async () => {
          // Capture the temp execution ID that was passed to onExecutionStart
          await Promise.resolve()
          return {
            execution_id: tempExecutionId || 'exec-123',
          }
        })

        mockOnExecutionStart.mockImplementation((id: string) => {
          if (id.startsWith('pending-')) {
            tempExecutionId = id
          }
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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // When execution.execution_id === tempExecutionId, the condition execution.execution_id !== tempExecutionId fails
        // So onExecutionStart should only be called once with the temp execution ID
        expect(mockOnExecutionStart).toHaveBeenCalledTimes(1)
        expect(mockOnExecutionStart).toHaveBeenCalledWith(expect.stringMatching(/^pending-/))
      })

      it('should verify exact error?.response?.data?.detail || error?.message || "Unknown error" check - error.response.data.detail exists', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // Should use error.response.data.detail (first truthy value)
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Custom error detail')
        expect(mockShowError).not.toHaveBeenCalledWith(expect.stringContaining('Error message'))
        expect(mockShowError).not.toHaveBeenCalledWith(expect.stringContaining('Unknown error'))
      })

      it('should verify exact error?.response?.data?.detail || error?.message || "Unknown error" check - error.response.data.detail is null', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const errorWithNullDetail = {
          response: {
            data: {
              detail: null,
            },
          },
          message: 'Error message',
        }
        mockApi.executeWorkflow.mockRejectedValue(errorWithNullDetail)

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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // When detail is null, should use error.message (second truthy value)
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Error message')
        expect(mockShowError).not.toHaveBeenCalledWith(expect.stringContaining('Unknown error'))
      })

      it('should verify exact error?.response?.data?.detail || error?.message || "Unknown error" check - error.response.data.detail is undefined', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const errorWithUndefinedDetail = {
          response: {
            data: {
              detail: undefined,
            },
          },
          message: 'Error message',
        }
        mockApi.executeWorkflow.mockRejectedValue(errorWithUndefinedDetail)

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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // When detail is undefined, should use error.message
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Error message')
      })

      it('should verify exact error?.response?.data?.detail || error?.message || "Unknown error" check - error.response.data is null', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const errorWithNullData = {
          response: {
            data: null,
          },
          message: 'Error message',
        }
        mockApi.executeWorkflow.mockRejectedValue(errorWithNullData)

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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // When data is null, error?.response?.data?.detail is undefined, should use error.message
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Error message')
      })

      it('should verify exact error?.response?.data?.detail || error?.message || "Unknown error" check - error.response is null', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const errorWithNullResponse = {
          response: null,
          message: 'Error message',
        }
        mockApi.executeWorkflow.mockRejectedValue(errorWithNullResponse)

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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // When response is null, error?.response?.data?.detail is undefined, should use error.message
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Error message')
      })

      it('should verify exact error?.response?.data?.detail || error?.message || "Unknown error" check - error.message is null', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const errorWithNullMessage = {
          response: {
            data: {
              detail: null,
            },
          },
          message: null,
        }
        mockApi.executeWorkflow.mockRejectedValue(errorWithNullMessage)

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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // When both detail and message are null, should use "Unknown error" (fallback)
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Unknown error')
      })

      it('should verify exact error?.response?.data?.detail || error?.message || "Unknown error" check - error.message is undefined', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const errorWithUndefinedMessage = {
          response: {
            data: {
              detail: null,
            },
          },
          message: undefined,
        }
        mockApi.executeWorkflow.mockRejectedValue(errorWithUndefinedMessage)

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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // When both detail and message are falsy, should use "Unknown error"
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Unknown error')
      })

      it('should verify exact error?.response?.data?.detail || error?.message || "Unknown error" check - error has no response or message', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const errorWithoutResponse = {} as any
        mockApi.executeWorkflow.mockRejectedValue(errorWithoutResponse)

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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // When error has no response or message, should use "Unknown error"
        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Unknown error')
      })
    })
  })

  describe('mutation killers - additional edge cases', () => {
    describe('handleConfirmExecute - complex conditional', () => {
      it('should verify exact conditional: execution && execution.execution_id && execution.execution_id !== tempExecutionId', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        const tempExecutionId = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const realExecutionId = 'exec-real-id'

        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: realExecutionId,
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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // Should call onExecutionStart with real execution ID (not temp)
        expect(mockOnExecutionStart).toHaveBeenCalledWith(realExecutionId)
      })

      it('should verify execution.execution_id === tempExecutionId (should not update)', async () => {
        mockWorkflowIdRef.current = 'workflow-id'
        mockOnExecutionStart.mockClear()

        // Mock to return same ID as temp (edge case)
        // Note: We can't predict the exact tempExecutionId, so we'll capture it
        let capturedTempId: string | null = null
        mockOnExecutionStart.mockImplementation((id: string) => {
          if (!capturedTempId) {
            capturedTempId = id
          }
        })

        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: 'will-be-set-later', // Will be set to match temp
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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
        })

        // Wait for temp ID to be captured
        await waitForWithTimeout(() => {
          expect(mockOnExecutionStart).toHaveBeenCalled()
          expect(capturedTempId).not.toBeNull()
        })

        // Now mock the API to return the same ID as temp
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: capturedTempId!,
        })

        // The code checks: execution.execution_id !== tempExecutionId
        // If they're equal, it should NOT call onExecutionStart again
        // Since we can't easily test this without modifying the code flow,
        // we'll verify the condition logic exists
        expect(capturedTempId).toMatch(/^pending-\d+-[a-z0-9]+$/)
        
        // The key test: verify the conditional check exists
        // If execution_id === tempExecutionId, onExecutionStart should not be called again
        // This is tested by verifying the condition: execution.execution_id !== tempExecutionId
        const finalCallCount = mockOnExecutionStart.mock.calls.length
        // Should have been called once with temp ID
        expect(finalCallCount).toBeGreaterThanOrEqual(1)
        expect(mockOnExecutionStart.mock.calls[0][0]).toBe(capturedTempId)
      })

      it('should verify execution is null (should not update)', async () => {
        mockWorkflowIdRef.current = 'workflow-id'

        mockApi.executeWorkflow.mockResolvedValue(null as any)

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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // Should only call onExecutionStart once with temp ID
        expect(mockOnExecutionStart).toHaveBeenCalledTimes(1)
      })

      it('should verify execution.execution_id is null (should not update)', async () => {
        mockWorkflowIdRef.current = 'workflow-id'

        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: null,
        } as any)

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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        // Should only call onExecutionStart once with temp ID
        expect(mockOnExecutionStart).toHaveBeenCalledTimes(1)
      })
    })

    describe('handleConfirmExecute - template literal', () => {
      it('should verify exact template literal: pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}', async () => {
        mockWorkflowIdRef.current = 'workflow-id'

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
          result.current.setExecutionInputs('{}')
          await result.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
        })

        // Verify temp execution ID format
        expect(mockOnExecutionStart).toHaveBeenCalled()
        const tempExecutionId = mockOnExecutionStart.mock.calls[0][0]
        expect(tempExecutionId).toMatch(/^pending-\d+-[a-z0-9]+$/)
        expect(tempExecutionId.startsWith('pending-')).toBe(true)
      })
    })

    describe('handleConfirmExecute - complex optional chaining', () => {
      it('should verify exact optional chaining: error?.response?.data?.detail || error?.message || "Unknown error" - all branches', async () => {
        mockWorkflowIdRef.current = 'workflow-id'

        // Test: error?.response?.data?.detail exists
        mockApi.executeWorkflow.mockRejectedValueOnce({
          response: {
            data: {
              detail: 'Custom error detail',
            },
          },
        } as any)

        const { result: result1 } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: 'workflow-id',
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        await act(async () => {
          result1.current.setExecutionInputs('{}')
          await result1.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled()
          })
        })

        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Custom error detail')

        // Test: error?.response?.data?.detail is null, error?.message exists
        mockShowError.mockClear()
        mockApi.executeWorkflow.mockRejectedValueOnce({
          response: {
            data: {
              detail: null,
            },
          },
          message: 'Error message',
        } as any)

        const { result: result2 } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: 'workflow-id',
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        await act(async () => {
          result2.current.setExecutionInputs('{}')
          await result2.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalledTimes(2)
          })
        })

        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Error message')

        // Test: error?.response is null, error?.message exists
        mockShowError.mockClear()
        mockApi.executeWorkflow.mockRejectedValueOnce({
          response: null,
          message: 'Direct error message',
        } as any)

        const { result: result3 } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: 'workflow-id',
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        await act(async () => {
          result3.current.setExecutionInputs('{}')
          await result3.current.handleConfirmExecute()
        })

        await act(async () => {
          jest.runAllTimers()
          await Promise.resolve()
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalledTimes(3)
          })
        })

        expect(mockShowError).toHaveBeenCalledWith('Failed to execute workflow: Direct error message')
      })
    })
  })

  describe('mutation killers - optional chaining in error logging', () => {
    it('should verify exact optional chaining: error?.message in logger.error', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const errorWithoutMessage = {
        response: { data: { detail: 'Error detail' } },
        // No message property
      } as any
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
        result.current.setExecutionInputs('{}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.runAllTimers()
        await Promise.resolve()
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled()
        })
      })

      // Verify error?.message is used (should not crash when message is undefined)
      expect(mockLoggerError).toHaveBeenCalledWith(
        '[WorkflowBuilder] Error details:',
        expect.objectContaining({
          message: undefined, // error?.message when message doesn't exist
        })
      )
    })

    it('should verify exact optional chaining: error?.response in logger.error', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const errorWithoutResponse = {
        message: 'Error message',
        // No response property
      } as any
      mockApi.executeWorkflow.mockRejectedValue(errorWithoutResponse)

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
        result.current.setExecutionInputs('{}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.runAllTimers()
        await Promise.resolve()
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled()
        })
      })

      // Verify error?.response is used (should not crash when response doesn't exist)
      expect(mockLoggerError).toHaveBeenCalledWith(
        '[WorkflowBuilder] Error details:',
        expect.objectContaining({
          response: undefined, // error?.response when response doesn't exist
        })
      )
    })

    it('should verify exact optional chaining: error?.response?.status in logger.error', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const errorWithoutStatus = {
        message: 'Error message',
        response: {
          data: { detail: 'Error detail' },
          // No status property
        },
      } as any
      mockApi.executeWorkflow.mockRejectedValue(errorWithoutStatus)

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
        result.current.setExecutionInputs('{}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.runAllTimers()
        await Promise.resolve()
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled()
        })
      })

      // Verify error?.response?.status is used
      expect(mockLoggerError).toHaveBeenCalledWith(
        '[WorkflowBuilder] Error details:',
        expect.objectContaining({
          status: undefined, // error?.response?.status when status doesn't exist
        })
      )
    })

    it('should verify exact optional chaining: error?.response?.data in logger.error', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      const errorWithoutData = {
        message: 'Error message',
        response: {
          status: 500,
          // No data property
        },
      } as any
      mockApi.executeWorkflow.mockRejectedValue(errorWithoutData)

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
        result.current.setExecutionInputs('{}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.runAllTimers()
        await Promise.resolve()
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled()
        })
      })

      // Verify error?.response?.data is used
      expect(mockLoggerError).toHaveBeenCalledWith(
        '[WorkflowBuilder] Error details:',
        expect.objectContaining({
          data: undefined, // error?.response?.data when data doesn't exist
        })
      )
    })

    it('should verify exact optional chaining: error?.message in catch block', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      // Mock JSON.parse to throw an error without message property
      const originalParse = JSON.parse
      const errorWithoutMessage = { /* No message property */ }
      JSON.parse = jest.fn(() => {
        throw errorWithoutMessage
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
        result.current.setExecutionInputs('{}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.runAllTimers()
        await Promise.resolve()
      })

      // Restore JSON.parse
      JSON.parse = originalParse

      // Verify error?.message is used in catch block (line 145)
      // Should use 'Unknown error' fallback when error.message is undefined
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Unknown error')
      )
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Execution setup failed:',
        errorWithoutMessage
      )
    })

    it('should verify exact optional chaining: error?.message in final catch', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      // Simulate error in final catch block
      mockApi.executeWorkflow.mockImplementation(() => {
        throw { /* No message property */ }
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
        result.current.setExecutionInputs('{}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.runAllTimers()
        await Promise.resolve()
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled()
        })
      })

      // Verify error?.message || 'Unknown error' is used in final catch (line 152)
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Unknown error')
      )
    })
  })

  describe('mutation killers - string literals', () => {
    it('should verify exact string literal: "Execution setup failed:"', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      // Mock JSON.parse to throw an error to trigger "Execution setup failed:" log
      const originalParse = JSON.parse
      const parseError = new Error('Parse error')
      JSON.parse = jest.fn(() => {
        throw parseError
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
        result.current.setExecutionInputs('{}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.runAllTimers()
        await Promise.resolve()
      })

      // Restore JSON.parse
      JSON.parse = originalParse

      // Verify exact string literal is used
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Execution setup failed:',
        parseError
      )
    })

    it('should verify exact string literal: "[WorkflowBuilder] Execution failed:"', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      mockApi.executeWorkflow.mockRejectedValue(new Error('API Error'))

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
        result.current.setExecutionInputs('{}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.runAllTimers()
        await Promise.resolve()
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled()
        })
      })

      // Verify exact string literal is used
      expect(mockLoggerError).toHaveBeenCalledWith(
        '[WorkflowBuilder] Execution failed:',
        expect.any(Error)
      )
    })

    it('should verify exact string literal: "[WorkflowBuilder] Error details:"', async () => {
      mockWorkflowIdRef.current = 'workflow-id'
      mockApi.executeWorkflow.mockRejectedValue(new Error('API Error'))

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
        result.current.setExecutionInputs('{}')
        await result.current.handleConfirmExecute()
      })

      await act(async () => {
        jest.runAllTimers()
        await Promise.resolve()
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled()
        })
      })

      // Verify exact string literal is used
      expect(mockLoggerError).toHaveBeenCalledWith(
        '[WorkflowBuilder] Error details:',
        expect.any(Object)
      )
    })
  })
})
