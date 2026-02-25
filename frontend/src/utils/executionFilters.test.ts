/**
 * Tests for Execution Filtering Utilities
 * Follows SOLID, DRY, and DIP principles
 */

import {
  filterByStatus,
  filterByWorkflowId,
  filterBySearchQuery,
  sortExecutions,
  applyExecutionFilters,
} from './executionFilters'
import type { ExecutionState } from '../types/workflow'
import type { ExecutionFiltersState } from '../components/log/ExecutionFilters'

describe('executionFilters utilities', () => {
  const mockExecution1: ExecutionState = {
    execution_id: 'exec-1',
    workflow_id: 'workflow-1',
    status: 'completed',
    started_at: '2024-01-01T10:00:00Z',
    completed_at: '2024-01-01T10:00:05Z',
    node_states: {},
    variables: {},
    logs: [],
  }

  const mockExecution2: ExecutionState = {
    execution_id: 'exec-2',
    workflow_id: 'workflow-2',
    status: 'failed',
    started_at: '2024-01-01T11:00:00Z',
    completed_at: '2024-01-01T11:00:10Z',
    error: 'Test error message',
    node_states: {},
    variables: {},
    logs: [],
  }

  const mockExecution3: ExecutionState = {
    execution_id: 'exec-3',
    workflow_id: 'workflow-1',
    status: 'running',
    started_at: '2024-01-01T12:00:00Z',
    current_node: 'node-1',
    node_states: {},
    variables: {},
    logs: [],
  }

  const executions = [mockExecution1, mockExecution2, mockExecution3]

  describe('filterByStatus', () => {
    it('should filter by single status', () => {
      const result = filterByStatus(executions, ['completed'])
      expect(result).toEqual([mockExecution1])
    })

    it('should filter by multiple statuses', () => {
      const result = filterByStatus(executions, ['completed', 'failed'])
      expect(result).toEqual([mockExecution1, mockExecution2])
    })

    it('should return all executions when no status filter', () => {
      const result = filterByStatus(executions, undefined)
      expect(result).toEqual(executions)
    })

    it('should return all executions when empty status array', () => {
      const result = filterByStatus(executions, [])
      expect(result).toEqual(executions)
    })
  })

  describe('filterByWorkflowId', () => {
    it('should filter by workflow ID', () => {
      const result = filterByWorkflowId(executions, 'workflow-1')
      expect(result).toEqual([mockExecution1, mockExecution3])
    })

    it('should return all executions when no workflow filter', () => {
      const result = filterByWorkflowId(executions, undefined)
      expect(result).toEqual(executions)
    })

    it('should return empty array when workflow not found', () => {
      const result = filterByWorkflowId(executions, 'workflow-999')
      expect(result).toEqual([])
    })
  })

  describe('filterBySearchQuery', () => {
    it('should filter by execution ID', () => {
      const result = filterBySearchQuery(executions, 'exec-1')
      expect(result).toEqual([mockExecution1])
    })

    it('should filter by workflow ID', () => {
      const result = filterBySearchQuery(executions, 'workflow-2')
      expect(result).toEqual([mockExecution2])
    })

    it('should filter by error message', () => {
      const result = filterBySearchQuery(executions, 'error message')
      expect(result).toEqual([mockExecution2])
    })

    it('should filter by current node', () => {
      const result = filterBySearchQuery(executions, 'node-1')
      expect(result).toEqual([mockExecution3])
    })

    it('should be case insensitive', () => {
      const result = filterBySearchQuery(executions, 'EXEC-1')
      expect(result).toEqual([mockExecution1])
    })

    it('should return all executions when no search query', () => {
      const result = filterBySearchQuery(executions, undefined)
      expect(result).toEqual(executions)
    })

    it('should return all executions when search query is empty', () => {
      const result = filterBySearchQuery(executions, '')
      expect(result).toEqual(executions)
    })

    it('should return all executions when search query is whitespace only', () => {
      const result = filterBySearchQuery(executions, '   ')
      expect(result).toEqual(executions)
    })
  })

  describe('sortExecutions', () => {
    it('should sort by started_at descending', () => {
      const result = sortExecutions(executions, 'started_at', 'desc')
      expect(result[0]).toEqual(mockExecution3)
      expect(result[2]).toEqual(mockExecution1)
    })

    it('should sort by started_at ascending', () => {
      const result = sortExecutions(executions, 'started_at', 'asc')
      expect(result[0]).toEqual(mockExecution1)
      expect(result[2]).toEqual(mockExecution3)
    })

    it('should sort by completed_at descending', () => {
      const result = sortExecutions(executions, 'completed_at', 'desc')
      expect(result[0]).toEqual(mockExecution2)
      expect(result[1]).toEqual(mockExecution1)
    })

    it('should sort by duration descending', () => {
      const result = sortExecutions(executions, 'duration', 'desc')
      // Execution 3 (running) has longest duration (current time - start time)
      // Execution 2 has 10 seconds, Execution 1 has 5 seconds
      // In descending order, running executions will be first (longest duration)
      expect(result[0].execution_id).toBe('exec-3') // Running execution
      expect(result[1].execution_id).toBe('exec-2') // 10 seconds
      expect(result[2].execution_id).toBe('exec-1') // 5 seconds
    })

    it('should sort by status', () => {
      const result = sortExecutions(executions, 'status', 'asc')
      // Alphabetically: completed, failed, running
      expect(result[0].status).toBe('completed')
      expect(result[1].status).toBe('failed')
      expect(result[2].status).toBe('running')
    })

    it('should use default sort when not specified', () => {
      const result = sortExecutions(executions)
      expect(result[0]).toEqual(mockExecution3) // Newest first
    })
  })

  describe('applyExecutionFilters', () => {
    it('should apply all filters', () => {
      const filters: ExecutionFiltersState = {
        status: ['completed'],
        workflowId: 'workflow-1',
        searchQuery: 'exec-1',
        sortBy: 'started_at',
        sortOrder: 'desc',
      }

      const result = applyExecutionFilters(executions, filters)
      expect(result).toEqual([mockExecution1])
    })

    it('should apply status filter only', () => {
      const filters: ExecutionFiltersState = {
        status: ['failed'],
      }

      const result = applyExecutionFilters(executions, filters)
      expect(result).toEqual([mockExecution2])
    })

    it('should apply search filter only', () => {
      const filters: ExecutionFiltersState = {
        searchQuery: 'exec-2',
      }

      const result = applyExecutionFilters(executions, filters)
      expect(result).toEqual([mockExecution2])
    })

    it('should apply sorting only', () => {
      const filters: ExecutionFiltersState = {
        sortBy: 'started_at',
        sortOrder: 'asc',
      }

      const result = applyExecutionFilters(executions, filters)
      expect(result[0]).toEqual(mockExecution1)
      expect(result[2]).toEqual(mockExecution3)
    })

    it('should return all executions when no filters', () => {
      const filters: ExecutionFiltersState = {}
      const result = applyExecutionFilters(executions, filters)
      // Should return all executions, sorted by default (started_at desc)
      expect(result.length).toBe(3)
      expect(result.map(e => e.execution_id)).toContain('exec-1')
      expect(result.map(e => e.execution_id)).toContain('exec-2')
      expect(result.map(e => e.execution_id)).toContain('exec-3')
    })
  })
})
