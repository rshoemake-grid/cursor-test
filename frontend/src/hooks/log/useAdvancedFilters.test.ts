/**
 * Tests for useAdvancedFilters Hook
 * Follows SOLID, DRY, and DIP principles
 */

import { renderHook } from '@testing-library/react'
import { useAdvancedFilters } from './useAdvancedFilters'
import type { ExecutionState } from '../../types/workflow'

describe('useAdvancedFilters', () => {
  const mockExecutions: ExecutionState[] = [
    {
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2024-01-01T10:00:00Z',
      completed_at: '2024-01-01T10:00:05Z',
      node_states: { 'node-1': { status: 'completed' } },
      variables: {},
      logs: [],
    },
    {
      execution_id: 'exec-2',
      workflow_id: 'workflow-2',
      status: 'failed',
      started_at: '2024-01-01T11:00:00Z',
      completed_at: '2024-01-01T11:00:10Z',
      error: 'Test error',
      node_states: { 'node-2': { status: 'failed' } },
      variables: {},
      logs: [],
    },
    {
      execution_id: 'exec-3',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2024-01-02T10:00:00Z',
      completed_at: '2024-01-02T10:00:20Z',
      node_states: { 'node-3': { status: 'completed' } },
      variables: {},
      logs: [],
    },
  ]

  it('should return all executions when no filters applied', () => {
    const { result } = renderHook(() =>
      useAdvancedFilters({
        executions: mockExecutions,
        filters: {},
      })
    )

    expect(result.current.filteredExecutions).toHaveLength(3)
    expect(result.current.filterCount).toBe(0)
  })

  it('should filter by date range', () => {
    const { result } = renderHook(() =>
      useAdvancedFilters({
        executions: mockExecutions,
        filters: {
          dateRange: {
            start: new Date('2024-01-01T11:00:00Z'),
            end: new Date('2024-01-01T12:00:00Z'),
          },
        },
      })
    )

    expect(result.current.filteredExecutions).toHaveLength(1)
    expect(result.current.filteredExecutions[0].execution_id).toBe('exec-2')
    expect(result.current.filterCount).toBe(1)
  })

  it('should filter by minimum duration', () => {
    const { result } = renderHook(() =>
      useAdvancedFilters({
        executions: mockExecutions,
        filters: {
          minDuration: 10, // seconds
        },
      })
    )

    // exec-1: 5s, exec-2: 10s, exec-3: 20s
    // Should include exec-2 and exec-3
    expect(result.current.filteredExecutions.length).toBeGreaterThanOrEqual(2)
    expect(result.current.filterCount).toBe(1)
  })

  it('should filter by maximum duration', () => {
    const { result } = renderHook(() =>
      useAdvancedFilters({
        executions: mockExecutions,
        filters: {
          maxDuration: 10, // seconds
        },
      })
    )

    // Should include exec-1 and exec-2
    expect(result.current.filteredExecutions.length).toBeLessThanOrEqual(2)
    expect(result.current.filterCount).toBe(1)
  })

  it('should filter by error status', () => {
    const { result } = renderHook(() =>
      useAdvancedFilters({
        executions: mockExecutions,
        filters: {
          hasError: true,
        },
      })
    )

    expect(result.current.filteredExecutions).toHaveLength(1)
    expect(result.current.filteredExecutions[0].execution_id).toBe('exec-2')
    expect(result.current.filterCount).toBe(1)
  })

  it('should filter by workflow IDs', () => {
    const { result } = renderHook(() =>
      useAdvancedFilters({
        executions: mockExecutions,
        filters: {
          workflowIds: ['workflow-1'],
        },
      })
    )

    expect(result.current.filteredExecutions).toHaveLength(2)
    expect(result.current.filteredExecutions.every((e) => e.workflow_id === 'workflow-1')).toBe(
      true
    )
    expect(result.current.filterCount).toBe(1)
  })

  it('should filter by node IDs', () => {
    const { result } = renderHook(() =>
      useAdvancedFilters({
        executions: mockExecutions,
        filters: {
          nodeIds: ['node-1'],
        },
      })
    )

    expect(result.current.filteredExecutions).toHaveLength(1)
    expect(result.current.filteredExecutions[0].execution_id).toBe('exec-1')
    expect(result.current.filterCount).toBe(1)
  })

  it('should combine multiple filters', () => {
    const { result } = renderHook(() =>
      useAdvancedFilters({
        executions: mockExecutions,
        filters: {
          workflowIds: ['workflow-1'],
          minDuration: 5,
        },
      })
    )

    expect(result.current.filterCount).toBe(2)
    expect(result.current.filteredExecutions.every((e) => e.workflow_id === 'workflow-1')).toBe(
      true
    )
  })

  it('should handle empty executions array', () => {
    const { result } = renderHook(() =>
      useAdvancedFilters({
        executions: [],
        filters: {
          hasError: true,
        },
      })
    )

    expect(result.current.filteredExecutions).toHaveLength(0)
    expect(result.current.filterCount).toBe(1)
  })

  it('should calculate filter count correctly', () => {
    const { result } = renderHook(() =>
      useAdvancedFilters({
        executions: mockExecutions,
        filters: {
          dateRange: { start: new Date() },
          minDuration: 5,
          maxDuration: 20,
          hasError: false,
          workflowIds: ['workflow-1'],
          nodeIds: ['node-1'],
        },
      })
    )

    expect(result.current.filterCount).toBe(6)
  })
})
