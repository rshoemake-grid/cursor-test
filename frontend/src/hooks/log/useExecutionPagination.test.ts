/**
 * Tests for useExecutionPagination Hook
 * Follows SOLID, DRY, and DIP principles
 */

import { renderHook, act } from '@testing-library/react'
import { useExecutionPagination } from './useExecutionPagination'
import type { ExecutionState } from '../../types/workflow'

describe('useExecutionPagination', () => {
  const mockExecutions: ExecutionState[] = Array.from({ length: 50 }, (_, i) => ({
    execution_id: `exec-${i + 1}`,
    workflow_id: `workflow-${i + 1}`,
    status: i % 2 === 0 ? 'completed' : 'failed',
    started_at: `2024-01-01T${10 + Math.floor(i / 10)}:00:00Z`,
    completed_at: `2024-01-01T${10 + Math.floor(i / 10)}:05:00Z`,
    node_states: {},
    variables: {},
    logs: [],
  }))

  it('should paginate executions correctly', () => {
    const { result } = renderHook(() =>
      useExecutionPagination({
        executions: mockExecutions,
        itemsPerPage: 10,
      })
    )

    expect(result.current.paginatedExecutions).toHaveLength(10)
    expect(result.current.paginatedExecutions[0].execution_id).toBe('exec-1')
    expect(result.current.totalPages).toBe(5)
    expect(result.current.totalItems).toBe(50)
  })

  it('should change page when setCurrentPage is called', () => {
    const { result } = renderHook(() =>
      useExecutionPagination({
        executions: mockExecutions,
        itemsPerPage: 10,
      })
    )

    act(() => {
      result.current.setCurrentPage(2)
    })

    expect(result.current.currentPage).toBe(2)
    expect(result.current.paginatedExecutions[0].execution_id).toBe('exec-11')
  })

  it('should change items per page', () => {
    const { result } = renderHook(() =>
      useExecutionPagination({
        executions: mockExecutions,
        itemsPerPage: 10,
      })
    )

    act(() => {
      result.current.setItemsPerPage(25)
    })

    expect(result.current.itemsPerPage).toBe(25)
    expect(result.current.totalPages).toBe(2)
    expect(result.current.paginatedExecutions).toHaveLength(25)
  })

  it('should calculate correct start and end items', () => {
    const { result } = renderHook(() =>
      useExecutionPagination({
        executions: mockExecutions,
        itemsPerPage: 10,
      })
    )

    act(() => {
      result.current.setCurrentPage(3)
    })

    expect(result.current.startItem).toBe(21)
    expect(result.current.endItem).toBe(30)
  })

  it('should handle empty executions', () => {
    const { result } = renderHook(() =>
      useExecutionPagination({
        executions: [],
        itemsPerPage: 10,
      })
    )

    expect(result.current.paginatedExecutions).toHaveLength(0)
    expect(result.current.totalPages).toBe(1)
    expect(result.current.startItem).toBe(0)
    expect(result.current.endItem).toBe(0)
  })

  it('should reset to page 1 if current page exceeds total pages', () => {
    const { result } = renderHook(() =>
      useExecutionPagination({
        executions: mockExecutions.slice(0, 10), // Only 10 items
        itemsPerPage: 10,
      })
    )

    act(() => {
      result.current.setCurrentPage(5) // Page 5 doesn't exist
    })

    // Should reset to page 1
    expect(result.current.currentPage).toBe(1)
  })

  it('should use default items per page', () => {
    const { result } = renderHook(() =>
      useExecutionPagination({
        executions: mockExecutions,
      })
    )

    expect(result.current.itemsPerPage).toBe(25)
  })
})
