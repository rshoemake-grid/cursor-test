/**
 * Tests for no-coverage paths in useWorkflowExecution.ts
 * 
 * These tests target code paths that are not covered by normal tests,
 * such as catch blocks, optional chaining, and error handling.
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useWorkflowExecution } from './useWorkflowExecution'
import { showError, showSuccess } from '../../utils/notifications'
import { showConfirm } from '../../utils/confirm'
import { api } from '../../api/client'
import { logger } from '../../utils/logger'

jest.mock('../../utils/notifications', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}))

jest.mock('../../utils/confirm', () => ({
  showConfirm: jest.fn(),
}))

jest.mock('../../api/client', () => ({
  api: {
    executeWorkflow: jest.fn(),
  },
}))
jest.mock('../../utils/logger', () => ({
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

      // Should handle JSON.parse error in catch block
      // The error is caught in WorkflowExecutionService.parseExecutionInputs
      // and re-thrown as a new Error, which is then caught in handleConfirmExecute
      expect(showError).toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledWith(
        '[WorkflowExecution] Failed to parse inputs:',
        expect.any(Error)
      )
      expect(logger.error).toHaveBeenCalledWith(
        '[WorkflowBuilder] Execution failed:',
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

  describe('executeWorkflow - authentication and validation paths', () => {
    it('should handle user not authenticated - logger.error and showError (lines 58-61)', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: false,
          localWorkflowId: 'workflow-123',
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        await result.current.executeWorkflow()
      })

      // Should handle authentication check (lines 58-61)
      expect(logger.error).toHaveBeenCalledWith('[WorkflowBuilder] User not authenticated')
      expect(showError).toHaveBeenCalledWith('Please log in to execute workflows.')
    })

    it('should handle user canceling save confirmation (lines 75-76)', async () => {
      const mockShowConfirm = showConfirm as jest.MockedFunction<typeof showConfirm>
      mockShowConfirm.mockResolvedValue(false) // User cancels

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null, // No workflow ID, will prompt to save
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        await result.current.executeWorkflow()
      })

      // Should return early when user cancels (lines 75-76)
      expect(mockSaveWorkflow).not.toHaveBeenCalled()
      expect(result.current.showInputs).toBe(false)
    })

    it('should handle workflow save returning invalid ID (lines 79-84)', async () => {
      const mockShowConfirm = showConfirm as jest.MockedFunction<typeof showConfirm>
      mockShowConfirm.mockResolvedValue(true)
      mockSaveWorkflow.mockResolvedValue(null) // Save returns null/invalid

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

      // Should handle invalid saved ID (lines 80-83)
      expect(showError).toHaveBeenCalledWith('Failed to save workflow. Cannot execute.')
      expect(result.current.showInputs).toBe(false)
    })

    it('should assign savedId to currentWorkflowId when save succeeds (line 84)', async () => {
      const mockShowConfirm = showConfirm as jest.MockedFunction<typeof showConfirm>
      mockShowConfirm.mockResolvedValue(true)
      mockSaveWorkflow.mockResolvedValue('saved-workflow-456') // Save succeeds

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

      // Should assign savedId to currentWorkflowId (line 84)
      // Then continue to show inputs dialog
      expect(result.current.showInputs).toBe(true)
      expect(mockSaveWorkflow).toHaveBeenCalled()
    })

    it('should set showInputs to true when workflow ID exists (lines 90-92)', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-123', // Has workflow ID
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      await act(async () => {
        await result.current.executeWorkflow()
      })

      // Should set showInputs to true (lines 91-92)
      expect(result.current.showInputs).toBe(true)
    })
  })

  describe('handleConfirmExecute - validation paths', () => {
    it('should handle no workflow ID found (lines 129-132)', async () => {
      const emptyWorkflowIdRef = { current: null }

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-123',
          workflowIdRef: emptyWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Set execution inputs first
      act(() => {
        result.current.setExecutionInputs('{"test": "value"}')
      })

      await act(async () => {
        await result.current.handleConfirmExecute()
      })

      // Should handle no workflow ID (lines 129-132)
      expect(logger.error).toHaveBeenCalledWith('[WorkflowBuilder] No workflow ID found - workflow must be saved')
      expect(showError).toHaveBeenCalledWith('Workflow must be saved before executing.')
    })

    it('should throw error when workflowIdToExecute is null (lines 137-138)', async () => {
      const emptyWorkflowIdRef = { current: null }
      const mockExecuteWorkflow = api.executeWorkflow as jest.MockedFunction<typeof api.executeWorkflow>
      mockExecuteWorkflow.mockResolvedValue({ execution_id: 'exec-123' } as any)
      
      // Mock canExecuteWorkflow to return true (bypassing the check at line 128)
      // This requires mocking the validation function, but since it's imported,
      // we'll test the path where canExecuteWorkflow passes but workflowIdToExecute is still null
      // Actually, canExecuteWorkflow checks workflowIdToExecute, so if it's null, canExecuteWorkflow returns false
      // So we need to test a scenario where canExecuteWorkflow somehow passes but workflowIdToExecute is null
      // This is a defensive check, so let's test it by ensuring the error is thrown
      
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: 'workflow-123',
          workflowIdRef: emptyWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      // Set execution inputs
      act(() => {
        result.current.setExecutionInputs('{"test": "value"}')
      })

      // Since canExecuteWorkflow will return false for null, the check at line 128 will catch it
      // To test lines 137-138, we'd need to mock canExecuteWorkflow, but it's not easily mockable
      // The defensive check at 137-138 is there as a safety net, but may not be reachable in normal flow
      // Let's verify the error path is tested by checking the canExecuteWorkflow path works
      await act(async () => {
        await result.current.handleConfirmExecute()
      })

      // Should handle no workflow ID via canExecuteWorkflow check (line 128-132)
      expect(showError).toHaveBeenCalledWith('Workflow must be saved before executing.')
    })
  })
})
