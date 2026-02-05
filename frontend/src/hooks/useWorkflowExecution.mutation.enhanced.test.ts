/**
 * Enhanced mutation tests for useWorkflowExecution
 * Focuses on killing remaining 9 surviving mutants through:
 * 1. Testing each conditional branch independently
 * 2. Testing exact falsy checks (null, undefined, false, empty string)
 * 3. Testing error handling paths
 * 4. Testing optional chaining mutations
 */

import { renderHook, act } from '@testing-library/react'
import { useWorkflowExecution } from './useWorkflowExecution'
import { showSuccess, showError } from '../utils/notifications'
import { showConfirm } from '../utils/confirm'
import { api } from '../api/client'
import { logger } from '../utils/logger'
import { WorkflowExecutionService } from './utils/workflowExecutionService'

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
  createApiClient: jest.fn(),
}))

jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}))

jest.mock('./utils/workflowExecutionService', () => ({
  WorkflowExecutionService: jest.fn().mockImplementation(() => ({
    parseExecutionInputs: jest.fn((inputs) => JSON.parse(inputs)),
    createTempExecutionId: jest.fn(() => 'temp-exec-123'),
    executeWorkflow: jest.fn().mockResolvedValue(undefined),
  })),
}))

const mockShowSuccess = showSuccess as jest.MockedFunction<typeof showSuccess>
const mockShowError = showError as jest.MockedFunction<typeof showError>
const mockShowConfirm = showConfirm as jest.MockedFunction<typeof showConfirm>
const mockApi = api as jest.Mocked<typeof api>
const mockLogger = logger as jest.Mocked<typeof logger>

describe('useWorkflowExecution - Enhanced Mutation Killers', () => {
  let mockSaveWorkflow: jest.Mock
  let mockOnExecutionStart: jest.Mock
  let workflowIdRef: React.MutableRefObject<string | null>

  beforeEach(() => {
    jest.clearAllMocks()
    mockSaveWorkflow = jest.fn()
    mockOnExecutionStart = jest.fn()
    workflowIdRef = { current: 'workflow-1' }
  })

  describe('executeWorkflow - Independent Condition Testing', () => {
    /**
     * The executeWorkflow function has several conditionals:
     * 1. if (!isAuthenticated)
     * 2. if (!currentWorkflowId)
     * 3. if (!confirmed)
     * 4. if (!savedId)
     * 
     * We need to test each condition independently to kill mutations
     */

    describe('if (!isAuthenticated) condition', () => {
      it('should verify exact falsy check - isAuthenticated is false', async () => {
        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: false, // Explicitly false
            localWorkflowId: 'workflow-1',
            workflowIdRef,
            saveWorkflow: mockSaveWorkflow,
          })
        )

        await act(async () => {
          await result.current.executeWorkflow()
        })

        // Should show error and return early (isAuthenticated is falsy)
        expect(mockShowError).toHaveBeenCalledWith('Please log in to execute workflows.')
        expect(mockLogger.error).toHaveBeenCalledWith('[WorkflowBuilder] User not authenticated')
        expect(result.current.showInputs).toBe(false)
        expect(mockSaveWorkflow).not.toHaveBeenCalled()
      })

      it('should verify exact falsy check - isAuthenticated is true', async () => {
        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true, // Explicitly true
            localWorkflowId: 'workflow-1',
            workflowIdRef,
            saveWorkflow: mockSaveWorkflow,
          })
        )

        await act(async () => {
          await result.current.executeWorkflow()
        })

        // Should proceed (isAuthenticated is truthy)
        expect(mockShowError).not.toHaveBeenCalledWith('Please log in to execute workflows.')
        expect(result.current.showInputs).toBe(true)
      })
    })

    describe('if (!currentWorkflowId) condition', () => {
      it('should verify exact falsy check - currentWorkflowId is null', async () => {
        mockShowConfirm.mockResolvedValue(true)
        mockSaveWorkflow.mockResolvedValue('saved-workflow-1')

        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null, // Explicitly null
            workflowIdRef: { current: null },
            saveWorkflow: mockSaveWorkflow,
          })
        )

        await act(async () => {
          await result.current.executeWorkflow()
        })

        // Should prompt to save (currentWorkflowId is falsy)
        expect(mockShowConfirm).toHaveBeenCalled()
        expect(mockSaveWorkflow).toHaveBeenCalled()
        expect(result.current.showInputs).toBe(true)
      })

      it('should verify exact falsy check - currentWorkflowId is undefined', async () => {
        mockShowConfirm.mockResolvedValue(true)
        mockSaveWorkflow.mockResolvedValue('saved-workflow-1')

        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: undefined as any, // Explicitly undefined
            workflowIdRef: { current: undefined },
            saveWorkflow: mockSaveWorkflow,
          })
        )

        await act(async () => {
          await result.current.executeWorkflow()
        })

        // Should prompt to save (currentWorkflowId is falsy)
        expect(mockShowConfirm).toHaveBeenCalled()
        expect(mockSaveWorkflow).toHaveBeenCalled()
      })

      it('should verify exact falsy check - currentWorkflowId is empty string', async () => {
        mockShowConfirm.mockResolvedValue(true)
        mockSaveWorkflow.mockResolvedValue('saved-workflow-1')

        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: '', // Empty string (falsy)
            workflowIdRef: { current: '' },
            saveWorkflow: mockSaveWorkflow,
          })
        )

        await act(async () => {
          await result.current.executeWorkflow()
        })

        // Should prompt to save (empty string is falsy)
        expect(mockShowConfirm).toHaveBeenCalled()
        expect(mockSaveWorkflow).toHaveBeenCalled()
      })

      it('should verify exact falsy check - currentWorkflowId is truthy', async () => {
        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: 'workflow-1', // Truthy
            workflowIdRef: { current: 'workflow-1' },
            saveWorkflow: mockSaveWorkflow,
          })
        )

        await act(async () => {
          await result.current.executeWorkflow()
        })

        // Should not prompt to save (currentWorkflowId is truthy)
        expect(mockShowConfirm).not.toHaveBeenCalled()
        expect(mockSaveWorkflow).not.toHaveBeenCalled()
        expect(result.current.showInputs).toBe(true)
      })
    })

    describe('if (!confirmed) condition', () => {
      it('should verify exact falsy check - confirmed is false', async () => {
        mockShowConfirm.mockResolvedValue(false) // User cancels

        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: { current: null },
            saveWorkflow: mockSaveWorkflow,
          })
        )

        await act(async () => {
          await result.current.executeWorkflow()
        })

        // Should return early (confirmed is falsy)
        expect(mockShowConfirm).toHaveBeenCalled()
        expect(mockSaveWorkflow).not.toHaveBeenCalled()
        expect(result.current.showInputs).toBe(false)
      })

      it('should verify exact falsy check - confirmed is null', async () => {
        mockShowConfirm.mockResolvedValue(null as any)

        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: { current: null },
            saveWorkflow: mockSaveWorkflow,
          })
        )

        await act(async () => {
          await result.current.executeWorkflow()
        })

        // Should return early (confirmed is falsy)
        expect(mockSaveWorkflow).not.toHaveBeenCalled()
        expect(result.current.showInputs).toBe(false)
      })

      it('should verify exact falsy check - confirmed is true', async () => {
        mockShowConfirm.mockResolvedValue(true)
        mockSaveWorkflow.mockResolvedValue('saved-workflow-1')

        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: { current: null },
            saveWorkflow: mockSaveWorkflow,
          })
        )

        await act(async () => {
          await result.current.executeWorkflow()
        })

        // Should proceed (confirmed is truthy)
        expect(mockSaveWorkflow).toHaveBeenCalled()
        expect(result.current.showInputs).toBe(true)
      })
    })

    describe('if (!savedId) condition', () => {
      it('should verify exact falsy check - savedId is null', async () => {
        mockShowConfirm.mockResolvedValue(true)
        mockSaveWorkflow.mockResolvedValue(null) // Save returns null

        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: { current: null },
            saveWorkflow: mockSaveWorkflow,
          })
        )

        await act(async () => {
          await result.current.executeWorkflow()
        })

        // Should show error and return early (savedId is falsy)
        expect(mockShowError).toHaveBeenCalledWith('Failed to save workflow. Cannot execute.')
        expect(result.current.showInputs).toBe(false)
      })

      it('should verify exact falsy check - savedId is empty string', async () => {
        mockShowConfirm.mockResolvedValue(true)
        mockSaveWorkflow.mockResolvedValue('') // Save returns empty string

        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: { current: null },
            saveWorkflow: mockSaveWorkflow,
          })
        )

        await act(async () => {
          await result.current.executeWorkflow()
        })

        // Should show error and return early (empty string is falsy)
        expect(mockShowError).toHaveBeenCalledWith('Failed to save workflow. Cannot execute.')
        expect(result.current.showInputs).toBe(false)
      })

      it('should verify exact falsy check - savedId is truthy', async () => {
        mockShowConfirm.mockResolvedValue(true)
        mockSaveWorkflow.mockResolvedValue('saved-workflow-1') // Save succeeds

        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: { current: null },
            saveWorkflow: mockSaveWorkflow,
          })
        )

        await act(async () => {
          await result.current.executeWorkflow()
        })

        // Should proceed (savedId is truthy)
        expect(mockShowError).not.toHaveBeenCalledWith('Failed to save workflow. Cannot execute.')
        expect(result.current.showInputs).toBe(true)
      })
    })

    describe('Save workflow error handling', () => {
      it('should handle save workflow exception', async () => {
        mockShowConfirm.mockResolvedValue(true)
        mockSaveWorkflow.mockRejectedValue(new Error('Save failed'))

        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: { current: null },
            saveWorkflow: mockSaveWorkflow,
          })
        )

        await act(async () => {
          await result.current.executeWorkflow()
        })

        // Should show error and return early (exception caught)
        expect(mockShowError).toHaveBeenCalledWith('Failed to save workflow. Cannot execute.')
        expect(result.current.showInputs).toBe(false)
      })
    })
  })

  describe('handleConfirmExecute - Independent Condition Testing', () => {
    describe('if (!workflowIdToExecute) condition', () => {
      it('should verify exact falsy check - workflowIdToExecute is null', async () => {
        workflowIdRef.current = null

        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: 'workflow-1',
            workflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        // Set inputs first
        act(() => {
          result.current.setExecutionInputs('{"key": "value"}')
        })

        await act(async () => {
          await result.current.handleConfirmExecute()
        })

        // Should show error and return early (workflowIdToExecute is falsy)
        expect(mockShowError).toHaveBeenCalledWith('Workflow must be saved before executing.')
        expect(mockLogger.error).toHaveBeenCalledWith(
          '[WorkflowBuilder] No workflow ID found - workflow must be saved'
        )
        expect(result.current.isExecuting).toBe(false)
      })

      it('should verify exact falsy check - workflowIdToExecute is undefined', async () => {
        workflowIdRef.current = undefined as any

        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: 'workflow-1',
            workflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.setExecutionInputs('{"key": "value"}')
        })

        await act(async () => {
          await result.current.handleConfirmExecute()
        })

        // Should show error (undefined is falsy)
        expect(mockShowError).toHaveBeenCalledWith('Workflow must be saved before executing.')
        expect(result.current.isExecuting).toBe(false)
      })

      it('should verify exact falsy check - workflowIdToExecute is empty string', async () => {
        workflowIdRef.current = ''

        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: 'workflow-1',
            workflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.setExecutionInputs('{"key": "value"}')
        })

        await act(async () => {
          await result.current.handleConfirmExecute()
        })

        // Should show error (empty string is falsy)
        expect(mockShowError).toHaveBeenCalledWith('Workflow must be saved before executing.')
        expect(result.current.isExecuting).toBe(false)
      })

      it('should verify exact falsy check - workflowIdToExecute is truthy', async () => {
        workflowIdRef.current = 'workflow-1'

        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: 'workflow-1',
            workflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.setExecutionInputs('{"key": "value"}')
        })

        await act(async () => {
          await result.current.handleConfirmExecute()
        })

        // Should proceed (workflowIdToExecute is truthy)
        expect(mockShowError).not.toHaveBeenCalledWith('Workflow must be saved before executing.')
        expect(mockShowSuccess).toHaveBeenCalled()
        expect(result.current.isExecuting).toBe(false)
      })
    })

    describe('Error handling - optional chaining mutations', () => {
      it('should handle error with response.data.detail', async () => {
        workflowIdRef.current = 'workflow-1'
        const mockExecuteWorkflow = jest.fn().mockRejectedValue({
          response: {
            data: {
              detail: 'Custom error detail'
            }
          }
        })
        
        const MockedService = WorkflowExecutionService as jest.MockedClass<typeof WorkflowExecutionService>
        MockedService.mockImplementation(() => ({
          parseExecutionInputs: jest.fn((inputs) => JSON.parse(inputs)),
          createTempExecutionId: jest.fn(() => 'temp-exec-123'),
          executeWorkflow: mockExecuteWorkflow,
        }))

        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: 'workflow-1',
            workflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.setExecutionInputs('{"key": "value"}')
        })

        await act(async () => {
          await result.current.handleConfirmExecute()
        })

        // Should use error.response.data.detail
        expect(mockShowError).toHaveBeenCalledWith(
          expect.stringContaining('Custom error detail')
        )
      })

      it('should handle error with message (no response)', async () => {
        workflowIdRef.current = 'workflow-1'
        const mockExecuteWorkflow = jest.fn().mockRejectedValue({
          message: 'Network error'
        })
        
        const MockedService = WorkflowExecutionService as jest.MockedClass<typeof WorkflowExecutionService>
        MockedService.mockImplementation(() => ({
          parseExecutionInputs: jest.fn((inputs) => JSON.parse(inputs)),
          createTempExecutionId: jest.fn(() => 'temp-exec-123'),
          executeWorkflow: mockExecuteWorkflow,
        }))

        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: 'workflow-1',
            workflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.setExecutionInputs('{"key": "value"}')
        })

        await act(async () => {
          await result.current.handleConfirmExecute()
        })

        // Should use error.message
        expect(mockShowError).toHaveBeenCalledWith(
          expect.stringContaining('Network error')
        )
      })

      it('should handle error with no message or response', async () => {
        workflowIdRef.current = 'workflow-1'
        const mockExecuteWorkflow = jest.fn().mockRejectedValue({})
        
        const MockedService = WorkflowExecutionService as jest.MockedClass<typeof WorkflowExecutionService>
        MockedService.mockImplementation(() => ({
          parseExecutionInputs: jest.fn((inputs) => JSON.parse(inputs)),
          createTempExecutionId: jest.fn(() => 'temp-exec-123'),
          executeWorkflow: mockExecuteWorkflow,
        }))

        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: 'workflow-1',
            workflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.setExecutionInputs('{"key": "value"}')
        })

        await act(async () => {
          await result.current.handleConfirmExecute()
        })

        // Should use 'Unknown error' fallback
        expect(mockShowError).toHaveBeenCalledWith(
          expect.stringContaining('Unknown error')
        )
      })

      it('should handle string error', async () => {
        workflowIdRef.current = 'workflow-1'
        const mockExecuteWorkflow = jest.fn().mockRejectedValue('String error')
        
        const MockedService = WorkflowExecutionService as jest.MockedClass<typeof WorkflowExecutionService>
        MockedService.mockImplementation(() => ({
          parseExecutionInputs: jest.fn((inputs) => JSON.parse(inputs)),
          createTempExecutionId: jest.fn(() => 'temp-exec-123'),
          executeWorkflow: mockExecuteWorkflow,
        }))

        const { result } = renderHook(() =>
          useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: 'workflow-1',
            workflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart,
          })
        )

        act(() => {
          result.current.setExecutionInputs('{"key": "value"}')
        })

        await act(async () => {
          await result.current.handleConfirmExecute()
        })

        // Should handle string error
        expect(mockShowError).toHaveBeenCalled()
      })
    })
  })

  describe('Combined condition testing', () => {
    it('should handle full execution flow when all conditions are met', async () => {
      workflowIdRef.current = 'workflow-1'

      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true, // Condition 1: true
          localWorkflowId: 'workflow-1', // Condition 2: truthy
          workflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        })
      )

      act(() => {
        result.current.setExecutionInputs('{"key": "value"}')
      })

      await act(async () => {
        await result.current.handleConfirmExecute()
      })

      // All conditions met, should execute successfully
      expect(mockShowSuccess).toHaveBeenCalled()
      // onExecutionStart is called by WorkflowExecutionService.executeWorkflow
      // which is mocked, so we verify the service was called with the callback
      expect(WorkflowExecutionService).toHaveBeenCalled()
      expect(result.current.isExecuting).toBe(false)
      expect(result.current.showInputs).toBe(false)
    })
  })
})
