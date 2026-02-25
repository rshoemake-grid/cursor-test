/**
 * Tests for useBulkOperations Hook
 * Follows SOLID, DRY, and DIP principles
 */

import { renderHook, act } from '@testing-library/react'
import { useBulkOperations } from './useBulkOperations'
import type { ExecutionState } from '../../types/workflow'

describe('useBulkOperations', () => {
  const mockExecutions: ExecutionState[] = [
    {
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2024-01-01T10:00:00Z',
      completed_at: '2024-01-01T10:00:05Z',
      node_states: {},
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
      node_states: {},
      variables: {},
      logs: [],
    },
    {
      execution_id: 'exec-3',
      workflow_id: 'workflow-3',
      status: 'running',
      started_at: '2024-01-01T12:00:00Z',
      node_states: {},
      variables: {},
      logs: [],
    },
  ]

  it('should initialize with no selections', () => {
    const { result } = renderHook(() =>
      useBulkOperations({
        executions: mockExecutions,
      })
    )

    expect(result.current.selectedIds.size).toBe(0)
    expect(result.current.selectedCount).toBe(0)
    expect(result.current.isAllSelected).toBe(false)
    expect(result.current.isSomeSelected).toBe(false)
  })

  it('should toggle selection', () => {
    const { result } = renderHook(() =>
      useBulkOperations({
        executions: mockExecutions,
      })
    )

    act(() => {
      result.current.toggleSelection('exec-1')
    })

    expect(result.current.selectedIds.has('exec-1')).toBe(true)
    expect(result.current.selectedCount).toBe(1)
    expect(result.current.isSomeSelected).toBe(true)

    act(() => {
      result.current.toggleSelection('exec-1')
    })

    expect(result.current.selectedIds.has('exec-1')).toBe(false)
    expect(result.current.selectedCount).toBe(0)
  })

  it('should toggle select all', () => {
    const { result } = renderHook(() =>
      useBulkOperations({
        executions: mockExecutions,
      })
    )

    act(() => {
      result.current.toggleSelectAll()
    })

    expect(result.current.isAllSelected).toBe(true)
    expect(result.current.selectedCount).toBe(3)

    act(() => {
      result.current.toggleSelectAll()
    })

    expect(result.current.isAllSelected).toBe(false)
    expect(result.current.selectedCount).toBe(0)
  })

  it('should clear selection', () => {
    const { result } = renderHook(() =>
      useBulkOperations({
        executions: mockExecutions,
      })
    )

    act(() => {
      result.current.selectAll()
    })

    expect(result.current.selectedCount).toBe(3)

    act(() => {
      result.current.clearSelection()
    })

    expect(result.current.selectedCount).toBe(0)
  })

  it('should select all', () => {
    const { result } = renderHook(() =>
      useBulkOperations({
        executions: mockExecutions,
      })
    )

    act(() => {
      result.current.selectAll()
    })

    expect(result.current.isAllSelected).toBe(true)
    expect(result.current.selectedCount).toBe(3)
    expect(result.current.selectedIds.has('exec-1')).toBe(true)
    expect(result.current.selectedIds.has('exec-2')).toBe(true)
    expect(result.current.selectedIds.has('exec-3')).toBe(true)
  })

  it('should call onDelete when deleteSelected is called', async () => {
    const mockOnDelete = jest.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() =>
      useBulkOperations({
        executions: mockExecutions,
        onDelete: mockOnDelete,
      })
    )

    act(() => {
      result.current.toggleSelection('exec-1')
      result.current.toggleSelection('exec-2')
    })

    expect(result.current.selectedCount).toBe(2)

    await act(async () => {
      await result.current.deleteSelected()
    })

    expect(mockOnDelete).toHaveBeenCalledWith(['exec-1', 'exec-2'])
    expect(result.current.selectedCount).toBe(0)
  })

  it('should set isDeleting during delete operation', async () => {
    const mockOnDelete = jest.fn(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    const { result } = renderHook(() =>
      useBulkOperations({
        executions: mockExecutions,
        onDelete: mockOnDelete,
      })
    )

    act(() => {
      result.current.toggleSelection('exec-1')
    })

    // Start the delete operation
    const deletePromise = result.current.deleteSelected()

    // Wait a bit for state to update
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })

    // Check that isDeleting is true during the operation
    expect(result.current.isDeleting).toBe(true)

    await act(async () => {
      await deletePromise
    })

    expect(result.current.isDeleting).toBe(false)
  })

  it('should handle empty executions array', () => {
    const { result } = renderHook(() =>
      useBulkOperations({
        executions: [],
      })
    )

    // Empty array should result in isAllSelected being false (since there's nothing to select)
    expect(result.current.isAllSelected).toBe(false)
    expect(result.current.selectedCount).toBe(0)
    expect(result.current.isSomeSelected).toBe(false)

    act(() => {
      result.current.toggleSelectAll()
    })

    // After toggle, still false since there are no executions
    expect(result.current.isAllSelected).toBe(false)
    expect(result.current.selectedCount).toBe(0)
  })

  it('should not call onDelete if no executions selected', async () => {
    const mockOnDelete = jest.fn()

    const { result } = renderHook(() =>
      useBulkOperations({
        executions: mockExecutions,
        onDelete: mockOnDelete,
      })
    )

    // Ensure no selections
    expect(result.current.selectedCount).toBe(0)

    await act(async () => {
      await result.current.deleteSelected()
    })

    expect(mockOnDelete).not.toHaveBeenCalled()
  })
})
