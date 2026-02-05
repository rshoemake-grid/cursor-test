/**
 * Enhanced mutation tests for WorkflowExecutionService
 * Focuses on killing remaining 2 surviving mutants through:
 * 1. Testing optional chaining mutations
 * 2. Testing conditional logic independently
 * 3. Testing edge cases for execution ID comparison
 */

import { WorkflowExecutionService } from './workflowExecutionService'
import { logger } from '../../utils/logger'
import type { WorkflowAPIClient } from '../../api/client'

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}))

const mockLogger = logger as jest.Mocked<typeof logger>

describe('WorkflowExecutionService - Enhanced Mutation Killers', () => {
  let mockApi: jest.Mocked<WorkflowAPIClient>
  let service: WorkflowExecutionService

  beforeEach(() => {
    jest.clearAllMocks()
    mockApi = {
      executeWorkflow: jest.fn(),
    } as any
    service = new WorkflowExecutionService({ api: mockApi })
  })

  describe('executeWorkflow - Optional Chaining and Conditionals', () => {
    describe('onExecutionStart callback - Independent Testing', () => {
      it('should verify exact truthy check - onExecutionStart is provided', async () => {
        const onExecutionStart = jest.fn()
        const execution = {
          execution_id: 'exec-123',
        }
        mockApi.executeWorkflow.mockResolvedValue(execution as any)

        await service.executeWorkflow({
          workflowId: 'workflow-1',
          inputs: { key: 'value' },
          tempExecutionId: 'pending-123',
          onExecutionStart, // Provided
        })

        // Should call onExecutionStart (callback is truthy)
        expect(onExecutionStart).toHaveBeenCalledWith('pending-123')
        expect(onExecutionStart).toHaveBeenCalledWith('exec-123')
      })

      it('should verify exact falsy check - onExecutionStart is undefined', async () => {
        const execution = {
          execution_id: 'exec-123',
        }
        mockApi.executeWorkflow.mockResolvedValue(execution as any)

        await service.executeWorkflow({
          workflowId: 'workflow-1',
          inputs: { key: 'value' },
          tempExecutionId: 'pending-123',
          // onExecutionStart missing (undefined)
        })

        // Should not crash (callback is falsy)
        expect(mockApi.executeWorkflow).toHaveBeenCalled()
      })

      it('should verify exact falsy check - onExecutionStart is null', async () => {
        const execution = {
          execution_id: 'exec-123',
        }
        mockApi.executeWorkflow.mockResolvedValue(execution as any)

        await service.executeWorkflow({
          workflowId: 'workflow-1',
          inputs: { key: 'value' },
          tempExecutionId: 'pending-123',
          onExecutionStart: null as any, // Explicitly null
        })

        // Should not crash (callback is falsy)
        expect(mockApi.executeWorkflow).toHaveBeenCalled()
      })
    })

    describe('execution?.execution_id optional chaining', () => {
      it('should verify optional chaining - execution is null', async () => {
        const onExecutionStart = jest.fn()
        mockApi.executeWorkflow.mockResolvedValue(null as any)

        const result = await service.executeWorkflow({
          workflowId: 'workflow-1',
          inputs: {},
          tempExecutionId: 'pending-123',
          onExecutionStart,
        })

        // Should use tempExecutionId when execution is null
        expect(result.executionId).toBe('pending-123')
        expect(onExecutionStart).toHaveBeenCalledWith('pending-123')
        expect(onExecutionStart).toHaveBeenCalledTimes(1) // Only once, no update
      })

      it('should verify optional chaining - execution is undefined', async () => {
        const onExecutionStart = jest.fn()
        mockApi.executeWorkflow.mockResolvedValue(undefined as any)

        const result = await service.executeWorkflow({
          workflowId: 'workflow-1',
          inputs: {},
          tempExecutionId: 'pending-123',
          onExecutionStart,
        })

        // Should use tempExecutionId when execution is undefined
        expect(result.executionId).toBe('pending-123')
        expect(onExecutionStart).toHaveBeenCalledWith('pending-123')
        expect(onExecutionStart).toHaveBeenCalledTimes(1) // Only once, no update
      })

      it('should verify optional chaining - execution.execution_id is null', async () => {
        const onExecutionStart = jest.fn()
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: null,
        } as any)

        const result = await service.executeWorkflow({
          workflowId: 'workflow-1',
          inputs: {},
          tempExecutionId: 'pending-123',
          onExecutionStart,
        })

        // Should use tempExecutionId when execution_id is null
        expect(result.executionId).toBe('pending-123')
        expect(onExecutionStart).toHaveBeenCalledWith('pending-123')
        expect(onExecutionStart).toHaveBeenCalledTimes(1) // Only once, no update
      })

      it('should verify optional chaining - execution.execution_id is undefined', async () => {
        const onExecutionStart = jest.fn()
        mockApi.executeWorkflow.mockResolvedValue({
          // execution_id missing (undefined)
        } as any)

        const result = await service.executeWorkflow({
          workflowId: 'workflow-1',
          inputs: {},
          tempExecutionId: 'pending-123',
          onExecutionStart,
        })

        // Should use tempExecutionId when execution_id is undefined
        expect(result.executionId).toBe('pending-123')
        expect(onExecutionStart).toHaveBeenCalledWith('pending-123')
        expect(onExecutionStart).toHaveBeenCalledTimes(1) // Only once, no update
      })

      it('should verify optional chaining - execution.execution_id exists', async () => {
        const onExecutionStart = jest.fn()
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: 'exec-123',
        } as any)

        const result = await service.executeWorkflow({
          workflowId: 'workflow-1',
          inputs: {},
          tempExecutionId: 'pending-123',
          onExecutionStart,
        })

        // Should use execution_id when it exists
        expect(result.executionId).toBe('exec-123')
        expect(onExecutionStart).toHaveBeenCalledWith('pending-123')
        expect(onExecutionStart).toHaveBeenCalledWith('exec-123') // Updated
      })
    })

    describe('execution.execution_id !== tempExecutionId comparison', () => {
      it('should verify exact inequality - execution_id different from temp', async () => {
        const onExecutionStart = jest.fn()
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: 'exec-123', // Different from temp
        } as any)

        const result = await service.executeWorkflow({
          workflowId: 'workflow-1',
          inputs: {},
          tempExecutionId: 'pending-123',
          onExecutionStart,
        })

        // Should use execution_id (different from temp)
        expect(result.executionId).toBe('exec-123')
        expect(result.executionId).not.toBe('pending-123')
        expect(onExecutionStart).toHaveBeenCalledWith('exec-123') // Updated
      })

      it('should verify exact equality - execution_id same as temp', async () => {
        const onExecutionStart = jest.fn()
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: 'pending-123', // Same as temp
        } as any)

        const result = await service.executeWorkflow({
          workflowId: 'workflow-1',
          inputs: {},
          tempExecutionId: 'pending-123',
          onExecutionStart,
        })

        // Should use tempExecutionId (same as execution_id)
        expect(result.executionId).toBe('pending-123')
        expect(onExecutionStart).toHaveBeenCalledTimes(1) // Only once, no update
        expect(onExecutionStart).not.toHaveBeenCalledWith('exec-123')
      })
    })

    describe('finalExecutionId !== tempExecutionId && onExecutionStart combined condition', () => {
      it('should verify both conditions true - different ID and callback provided', async () => {
        const onExecutionStart = jest.fn()
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: 'exec-123',
        } as any)

        await service.executeWorkflow({
          workflowId: 'workflow-1',
          inputs: {},
          tempExecutionId: 'pending-123',
          onExecutionStart, // Provided
        })

        // Both conditions true: different ID && callback provided
        expect(onExecutionStart).toHaveBeenCalledWith('exec-123') // Updated
        expect(onExecutionStart).toHaveBeenCalledTimes(2) // Initial + update
      })

      it('should verify first condition false - same ID', async () => {
        const onExecutionStart = jest.fn()
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: 'pending-123', // Same as temp
        } as any)

        await service.executeWorkflow({
          workflowId: 'workflow-1',
          inputs: {},
          tempExecutionId: 'pending-123',
          onExecutionStart, // Provided
        })

        // First condition false: same ID, so no update call
        expect(onExecutionStart).toHaveBeenCalledTimes(1) // Only initial call
        expect(onExecutionStart).not.toHaveBeenCalledWith('exec-123')
      })

      it('should verify second condition false - callback not provided', async () => {
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: 'exec-123', // Different from temp
        } as any)

        await service.executeWorkflow({
          workflowId: 'workflow-1',
          inputs: {},
          tempExecutionId: 'pending-123',
          // onExecutionStart not provided
        })

        // Second condition false: callback not provided, so no update call
        // Should not crash
        expect(mockApi.executeWorkflow).toHaveBeenCalled()
      })

      it('should verify both conditions false - same ID and no callback', async () => {
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: 'pending-123', // Same as temp
        } as any)

        await service.executeWorkflow({
          workflowId: 'workflow-1',
          inputs: {},
          tempExecutionId: 'pending-123',
          // onExecutionStart not provided
        })

        // Both conditions false: same ID && no callback
        // Should not crash
        expect(mockApi.executeWorkflow).toHaveBeenCalled()
      })
    })
  })

  describe('parseExecutionInputs - Error Handling', () => {
    describe('try-catch error handling', () => {
      it('should verify successful parse - valid JSON', () => {
        const inputs = service.parseExecutionInputs('{"key": "value"}')

        // Should parse successfully
        expect(inputs).toEqual({ key: 'value' })
        expect(mockLogger.error).not.toHaveBeenCalled()
      })

      it('should verify error catch - invalid JSON', () => {
        expect(() => {
          service.parseExecutionInputs('invalid json')
        }).toThrow('Invalid JSON in execution inputs')

        // Should log error
        expect(mockLogger.error).toHaveBeenCalled()
      })

      it('should verify error catch - malformed JSON', () => {
        expect(() => {
          service.parseExecutionInputs('{"key": "value"')
        }).toThrow('Invalid JSON in execution inputs')

        // Should log error
        expect(mockLogger.error).toHaveBeenCalled()
      })

      it('should verify error catch - empty string', () => {
        expect(() => {
          service.parseExecutionInputs('')
        }).toThrow('Invalid JSON in execution inputs')

        // Should log error
        expect(mockLogger.error).toHaveBeenCalled()
      })
    })
  })

  describe('createTempExecutionId - ID Generation', () => {
    it('should generate unique IDs', () => {
      const id1 = service.createTempExecutionId()
      const id2 = service.createTempExecutionId()

      // Should generate different IDs
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^pending-\d+-[a-z0-9]+$/)
      expect(id2).toMatch(/^pending-\d+-[a-z0-9]+$/)
    })

    it('should generate IDs with correct format', () => {
      const id = service.createTempExecutionId()

      // Should match expected format
      expect(id).toMatch(/^pending-\d+-[a-z0-9]+$/)
      expect(id.startsWith('pending-')).toBe(true)
    })
  })
})
