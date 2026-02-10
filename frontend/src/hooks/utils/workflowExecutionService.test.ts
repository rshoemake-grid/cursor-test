/**
 * Tests for WorkflowExecutionService
 */

import { WorkflowExecutionService } from './workflowExecutionService'
import { logger } from '../../utils/logger'
import type { WorkflowAPIClient } from '../../api/client'

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  },
}))

const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>

describe('WorkflowExecutionService', () => {
  let mockApi: jest.Mocked<WorkflowAPIClient>
  let service: WorkflowExecutionService
  let onExecutionStart: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    onExecutionStart = jest.fn()
    mockApi = {
      executeWorkflow: jest.fn(),
    } as any
    service = new WorkflowExecutionService({ api: mockApi })
  })

  describe('executeWorkflow', () => {
    it('should execute workflow successfully', async () => {
      const execution = {
        execution_id: 'exec-123',
      }
      mockApi.executeWorkflow.mockResolvedValue(execution as any)

      const result = await service.executeWorkflow({
        workflowId: 'workflow-1',
        inputs: { key: 'value' },
        tempExecutionId: 'pending-123',
        onExecutionStart,
      })

      expect(mockApi.executeWorkflow).toHaveBeenCalledWith('workflow-1', { key: 'value' })
      expect(onExecutionStart).toHaveBeenCalledWith('pending-123')
      expect(onExecutionStart).toHaveBeenCalledWith('exec-123')
      expect(result.executionId).toBe('exec-123')
      expect(result.tempExecutionId).toBe('pending-123')
    })

    it('should use temp execution ID when API returns same ID', async () => {
      const execution = {
        execution_id: 'pending-123',
      }
      mockApi.executeWorkflow.mockResolvedValue(execution as any)

      const result = await service.executeWorkflow({
        workflowId: 'workflow-1',
        inputs: {},
        tempExecutionId: 'pending-123',
        onExecutionStart,
      })

      expect(onExecutionStart).toHaveBeenCalledTimes(1)
      expect(onExecutionStart).toHaveBeenCalledWith('pending-123')
      expect(result.executionId).toBe('pending-123')
    })

    it('should not call onExecutionStart when not provided', async () => {
      const execution = {
        execution_id: 'exec-123',
      }
      mockApi.executeWorkflow.mockResolvedValue(execution as any)

      await service.executeWorkflow({
        workflowId: 'workflow-1',
        inputs: {},
        tempExecutionId: 'pending-123',
      })

      expect(mockApi.executeWorkflow).toHaveBeenCalled()
    })

    it('should handle API errors', async () => {
      const error = new Error('API Error')
      mockApi.executeWorkflow.mockRejectedValue(error)

      await expect(
        service.executeWorkflow({
          workflowId: 'workflow-1',
          inputs: {},
          tempExecutionId: 'pending-123',
          onExecutionStart,
        })
      ).rejects.toThrow('API Error')

      expect(onExecutionStart).toHaveBeenCalledWith('pending-123')
    })
  })

  describe('createTempExecutionId', () => {
    it('should create temp execution ID with correct format', () => {
      const id = service.createTempExecutionId()

      expect(id).toMatch(/^pending-\d+-[a-z0-9]+$/)
      expect(id.startsWith('pending-')).toBe(true)
    })

    it('should create unique IDs', () => {
      const id1 = service.createTempExecutionId()
      const id2 = service.createTempExecutionId()

      expect(id1).not.toBe(id2)
    })
  })

  describe('parseExecutionInputs', () => {
    it('should parse valid JSON string', () => {
      const inputs = service.parseExecutionInputs('{"key": "value"}')

      expect(inputs).toEqual({ key: 'value' })
    })

    it('should parse complex JSON', () => {
      const json = '{"nested": {"key": "value"}, "array": [1, 2, 3]}'
      const inputs = service.parseExecutionInputs(json)

      expect(inputs).toEqual({
        nested: { key: 'value' },
        array: [1, 2, 3],
      })
    })

    it('should throw error for invalid JSON', () => {
      expect(() => {
        service.parseExecutionInputs('invalid json')
      }).toThrow('Invalid JSON in execution inputs')

      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle empty JSON object', () => {
      const inputs = service.parseExecutionInputs('{}')

      expect(inputs).toEqual({})
    })
  })

  describe('custom logger', () => {
    it('should use custom logger when provided', () => {
      const customLogger = {
        debug: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        log: jest.fn(),
        warn: jest.fn(),
      }
      const customService = new WorkflowExecutionService({
        api: mockApi,
        logger: customLogger,
      })

      expect(() => {
        customService.parseExecutionInputs('invalid json')
      }).toThrow()

      expect(customLogger.error).toHaveBeenCalled()
      expect(mockLoggerError).not.toHaveBeenCalled()
    })
  })
})
