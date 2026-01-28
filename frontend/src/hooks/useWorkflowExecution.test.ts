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
})
