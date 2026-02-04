/**
 * Tests for no-coverage paths in useWorkflowExecution.ts
 * 
 * These tests target code paths that are not covered by normal tests,
 * such as catch blocks, optional chaining, and error handling.
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useWorkflowExecution } from './useWorkflowExecution'
import { showError, showSuccess } from '../utils/notifications'
import { showConfirm } from '../utils/confirm'
import { api } from '../api/client'
import { logger } from '../utils/logger'

jest.mock('../utils/notifications', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
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
    warn: jest.fn(),
  },
}))

describe('useWorkflowExecution - No Coverage Paths', () => {
  let mockSaveWorkflow: jest.Mock
  let mockOnExecutionStart: jest.Mock
  let mockWorkflowIdRef: React.MutableRefObject<string | null>

  beforeEach(() => {
    jest.clearAllMocks()
    mockSaveWorkflow = jest.fn().mockResolvedValue('saved-workflow-123')
    mockOnExecutionStart = jest.fn()
    mockWorkflowIdRef = { current: 'workflow-123' }
    const mockShowConfirm = showConfirm as jest.MockedFunction<typeof showConfirm>
    const mockShowError = showError as jest.MockedFunction<typeof showError>
    const mockShowSuccess = showSuccess as jest.MockedFunction<typeof showSuccess>
    const mockExecuteWorkflow = api.executeWorkflow as jest.MockedFunction<typeof api.executeWorkflow>
    
    mockShowConfirm.mockResolvedValue(true)
    mockShowError.mockImplementation(() => {})
    mockShowSuccess.mockImplementation(() => {})
    mockExecuteWorkflow.mockResolvedValue({
      execution_id: 'exec-123',
    } as any)
  })

  describe('executeWorkflow - catch block', () => {
    it('should handle saveWorkflow throwing error', async () => {
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

      // Should handle error in catch block (line 61)
      expect(showError).toHaveBeenCalledWith('Failed to save workflow. Cannot execute.')
    })
  })

  describe('handleConfirmExecute - catch blocks and optional chaining', () => {
    it('should handle JSON.parse throwing in catch block', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-123',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Set invalid JSON
      act(() => {
        result.current.setExecutionInputs('invalid json')
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        // Wait for setTimeout to execute
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      // Should handle JSON.parse error in catch block (line 142)
      expect(showError).toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledWith(
        'Execution setup failed:',
        expect.any(Error)
      )
    })

    it('should handle api.executeWorkflow error with optional chaining', async () => {
      const mockError = {
        response: {
          data: {
            detail: 'API error detail',
          },
          status: 500,
        },
        message: 'Network error',
      }

      ;(api.executeWorkflow as jest.Mock).mockRejectedValue(mockError)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-123',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.handleConfirmExecute()
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      // Should use optional chaining: error?.response?.data?.detail || error?.message
      expect(showError).toHaveBeenCalledWith(
        'Failed to execute workflow: API error detail'
      )
    })

    it('should handle api.executeWorkflow error without response.data', async () => {
      const mockError = {
        message: 'Network error',
      }

      ;(api.executeWorkflow as jest.Mock).mockRejectedValue(mockError)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-123',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.handleConfirmExecute()
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      // Should use fallback: error?.message || 'Unknown error'
      expect(showError).toHaveBeenCalledWith(
        'Failed to execute workflow: Network error'
      )
    })

    it('should handle api.executeWorkflow error without message', async () => {
      const mockError = {}

      ;(api.executeWorkflow as jest.Mock).mockRejectedValue(mockError)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-123',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        result.current.handleConfirmExecute()
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      // Should use ultimate fallback: 'Unknown error'
      expect(showError).toHaveBeenCalledWith(
        'Failed to execute workflow: Unknown error'
      )
    })

    it('should handle unhandled promise rejection catch block', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-123',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Set execution inputs first
      act(() => {
        result.current.setExecutionInputs('{"test": "value"}')
      })

      // Make api.executeWorkflow throw an error to trigger catch block
      const mockExecuteWorkflow = api.executeWorkflow as jest.MockedFunction<typeof api.executeWorkflow>
      mockExecuteWorkflow.mockImplementation(() => {
        return Promise.reject(new Error('Execution failed'))
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      // Should handle in catch block (line 126) - inner catch
      expect(showError).toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalled()
    })

    it('should verify finally block executes', async () => {
      const mockExecuteWorkflow = api.executeWorkflow as jest.MockedFunction<typeof api.executeWorkflow>
      mockExecuteWorkflow.mockResolvedValue({
        execution_id: 'exec-123',
      } as any)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-123',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Set execution inputs first
      act(() => {
        result.current.setExecutionInputs('{"test": "value"}')
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      // Finally block (line 137) should execute and reset isExecuting
      await waitFor(() => {
        expect(result.current.isExecuting).toBe(false)
      })
    })

    it('should verify optional chaining - onExecutionStart is undefined', async () => {
      const mockExecuteWorkflow = api.executeWorkflow as jest.MockedFunction<typeof api.executeWorkflow>
      mockExecuteWorkflow.mockResolvedValue({
        execution_id: 'exec-123',
      } as any)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-123',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: undefined,
        })
      )

      // Set execution inputs first
      act(() => {
        result.current.setExecutionInputs('{"test": "value"}')
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      // Should handle onExecutionStart being undefined (line 122)
      // Code: if (onExecutionStart) { onExecutionStart(...) }
      // Should not throw when onExecutionStart is undefined
      expect(showSuccess).toHaveBeenCalled()
      // onExecutionStart should not be called since it's undefined
      expect(mockOnExecutionStart).not.toHaveBeenCalled()
    })

    it('should verify logical AND - execution && execution.execution_id', async () => {
      const mockExecuteWorkflow = api.executeWorkflow as jest.MockedFunction<typeof api.executeWorkflow>
      mockExecuteWorkflow.mockResolvedValue({
        execution_id: 'exec-123',
      } as any)

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-123',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Set execution inputs first
      act(() => {
        result.current.setExecutionInputs('{"test": "value"}')
      })

      await act(async () => {
        result.current.handleConfirmExecute()
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      // Should verify: execution && execution.execution_id && execution.execution_id !== tempExecutionId
      // onExecutionStart is called twice: once with temp ID (line 97) and once with real ID (line 123)
      expect(mockOnExecutionStart).toHaveBeenCalledWith('exec-123')
    })
  })
})
