/**
 * Tests for useExecutionNotifications Hook
 * Follows SOLID, DRY, and DIP principles
 */

import { renderHook } from '@testing-library/react'
import { useExecutionNotifications } from './useExecutionNotifications'
import type { ExecutionState } from '../../types/workflow'

describe('useExecutionNotifications', () => {
  const mockOnSuccess = jest.fn()
  const mockOnError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not trigger callbacks when enabled is false', () => {
    const executions: ExecutionState[] = [
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
    ]

    renderHook(() =>
      useExecutionNotifications({
        executions,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
        enabled: false,
      })
    )

    expect(mockOnSuccess).not.toHaveBeenCalled()
    expect(mockOnError).not.toHaveBeenCalled()
  })

  it('should trigger onSuccess when execution status changes to completed', () => {
    const executions: ExecutionState[] = [
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
    ]

    // First render with running status
    const { rerender } = renderHook(
      ({ execs }) =>
        useExecutionNotifications({
          executions: execs,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      {
        initialProps: {
          execs: [
            {
              ...executions[0],
              status: 'running' as const,
              completed_at: undefined,
            },
          ],
        },
      }
    )

    expect(mockOnSuccess).not.toHaveBeenCalled()

    // Rerender with completed status
    rerender({
      execs: executions,
    })

    expect(mockOnSuccess).toHaveBeenCalledWith(executions[0])
    expect(mockOnError).not.toHaveBeenCalled()
  })

  it('should trigger onError when execution status changes to failed', () => {
    const executions: ExecutionState[] = [
      {
        execution_id: 'exec-1',
        workflow_id: 'workflow-1',
        status: 'failed',
        started_at: '2024-01-01T10:00:00Z',
        completed_at: '2024-01-01T10:00:05Z',
        error: 'Test error',
        node_states: {},
        variables: {},
        logs: [],
      },
    ]

    // First render with running status
    const { rerender } = renderHook(
      ({ execs }) =>
        useExecutionNotifications({
          executions: execs,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      {
        initialProps: {
          execs: [
            {
              ...executions[0],
              status: 'running' as const,
              error: undefined,
            },
          ],
        },
      }
    )

    expect(mockOnError).not.toHaveBeenCalled()

    // Rerender with failed status
    rerender({
      execs: executions,
    })

    expect(mockOnError).toHaveBeenCalledWith(executions[0])
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('should not trigger callbacks on initial render', () => {
    const executions: ExecutionState[] = [
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
    ]

    renderHook(() =>
      useExecutionNotifications({
        executions,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    )

    expect(mockOnSuccess).not.toHaveBeenCalled()
    expect(mockOnError).not.toHaveBeenCalled()
  })

  it('should not trigger callbacks when status does not change', () => {
    const executions: ExecutionState[] = [
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
    ]

    const { rerender } = renderHook(
      ({ execs }) =>
        useExecutionNotifications({
          executions: execs,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      {
        initialProps: { execs: executions },
      }
    )

    expect(mockOnSuccess).not.toHaveBeenCalled()

    // Rerender with same status
    rerender({ execs: executions })

    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('should handle multiple executions', () => {
    const executions: ExecutionState[] = [
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
    ]

    const { rerender } = renderHook(
      ({ execs }) =>
        useExecutionNotifications({
          executions: execs,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      {
        initialProps: {
          execs: [
            { ...executions[0], status: 'running' as const, completed_at: undefined },
            { ...executions[1], status: 'running' as const, error: undefined },
          ],
        },
      }
    )

    rerender({ execs: executions })

    expect(mockOnSuccess).toHaveBeenCalledWith(executions[0])
    expect(mockOnError).toHaveBeenCalledWith(executions[1])
  })
})
