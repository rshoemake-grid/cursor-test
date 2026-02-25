/**
 * Tests for useExecutionListQuery Hook
 * Follows SOLID, DRY, and DIP principles
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useExecutionListQuery } from './useExecutionListQuery'
import type { ExecutionState } from '../../types/workflow'
import React from 'react'

describe('useExecutionListQuery', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  it('should fetch executions successfully', async () => {
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
    ]

    const mockApiClient = {
      listExecutions: jest.fn().mockResolvedValue(mockExecutions),
    }

    const { result } = renderHook(
      () =>
        useExecutionListQuery({
          apiClient: mockApiClient,
          filters: { limit: 100 },
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockExecutions)
    expect(result.current.error).toBeNull()
    expect(mockApiClient.listExecutions).toHaveBeenCalledWith({ limit: 100 })
  })

  it('should handle API errors', async () => {
    const mockError = new Error('API Error')
    const mockApiClient = {
      listExecutions: jest.fn().mockRejectedValue(mockError),
    }

    const { result } = renderHook(
      () =>
        useExecutionListQuery({
          apiClient: mockApiClient,
          filters: { limit: 100 },
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('should not fetch when apiClient is not provided', () => {
    const { result } = renderHook(
      () =>
        useExecutionListQuery({
          enabled: true,
        }),
      { wrapper }
    )

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('should not fetch when enabled is false', () => {
    const mockApiClient = {
      listExecutions: jest.fn(),
    }

    const { result } = renderHook(
      () =>
        useExecutionListQuery({
          apiClient: mockApiClient,
          enabled: false,
        }),
      { wrapper }
    )

    expect(result.current.isLoading).toBe(false)
    expect(mockApiClient.listExecutions).not.toHaveBeenCalled()
  })

  it('should pass filters to API client', async () => {
    const mockApiClient = {
      listExecutions: jest.fn().mockResolvedValue([]),
    }

    const filters = {
      status: 'completed',
      workflow_id: 'workflow-1',
      limit: 50,
      offset: 10,
    }

    renderHook(
      () =>
        useExecutionListQuery({
          apiClient: mockApiClient,
          filters,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(mockApiClient.listExecutions).toHaveBeenCalledWith(filters)
    })
  })

  it('should use default limit when not provided', async () => {
    const mockApiClient = {
      listExecutions: jest.fn().mockResolvedValue([]),
    }

    renderHook(
      () =>
        useExecutionListQuery({
          apiClient: mockApiClient,
          filters: {},
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(mockApiClient.listExecutions).toHaveBeenCalled()
    })

    const callArgs = mockApiClient.listExecutions.mock.calls[0][0]
    expect(callArgs.limit).toBe(100) // Default from hook
  })

  it('should refetch at specified interval', async () => {
    jest.useFakeTimers()
    const mockApiClient = {
      listExecutions: jest.fn().mockResolvedValue([]),
    }

    renderHook(
      () =>
        useExecutionListQuery({
          apiClient: mockApiClient,
          refetchInterval: 5000,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(mockApiClient.listExecutions).toHaveBeenCalledTimes(1)
    })

    jest.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(mockApiClient.listExecutions).toHaveBeenCalledTimes(2)
    })

    jest.useRealTimers()
  })

  it('should not refetch when refetchInterval is 0', async () => {
    jest.useFakeTimers()
    const mockApiClient = {
      listExecutions: jest.fn().mockResolvedValue([]),
    }

    renderHook(
      () =>
        useExecutionListQuery({
          apiClient: mockApiClient,
          refetchInterval: 0,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(mockApiClient.listExecutions).toHaveBeenCalledTimes(1)
    })

    jest.advanceTimersByTime(10000)

    // Should still only be called once
    expect(mockApiClient.listExecutions).toHaveBeenCalledTimes(1)

    jest.useRealTimers()
  })
})
