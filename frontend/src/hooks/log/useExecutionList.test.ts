/**
 * Tests for useExecutionList Hook
 * Follows SOLID, DRY, and DIP principles
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useExecutionList } from './useExecutionList'
import type { ExecutionState } from '../../types/workflow'

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}))

describe('useExecutionList', () => {
  const mockExecution: ExecutionState = {
    execution_id: 'exec-123',
    workflow_id: 'workflow-123',
    status: 'completed',
    started_at: '2024-01-01T10:00:00Z',
    completed_at: '2024-01-01T10:00:05Z',
    node_states: {},
    variables: {},
    logs: [],
  }

  const mockApiClient = {
    listExecutions: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should load executions on mount', async () => {
    mockApiClient.listExecutions.mockResolvedValue([mockExecution])

    const { result } = renderHook(() =>
      useExecutionList({
        apiClient: mockApiClient,
        pollInterval: 0, // Disable polling for this test
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockApiClient.listExecutions).toHaveBeenCalledWith({ limit: 100 })
    expect(result.current.executions).toEqual([mockExecution])
    expect(result.current.error).toBeNull()
  })

  it('should handle loading state', () => {
    mockApiClient.listExecutions.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const { result } = renderHook(() =>
      useExecutionList({
        apiClient: mockApiClient,
        pollInterval: 0,
      })
    )

    expect(result.current.loading).toBe(true)
    expect(result.current.executions).toEqual([])
  })

  it('should handle error state', async () => {
    const errorMessage = 'Failed to fetch executions'
    mockApiClient.listExecutions.mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() =>
      useExecutionList({
        apiClient: mockApiClient,
        pollInterval: 0,
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe(errorMessage)
    expect(result.current.executions).toEqual([])
  })

  it('should handle error without message', async () => {
    mockApiClient.listExecutions.mockRejectedValue({})

    const { result } = renderHook(() =>
      useExecutionList({
        apiClient: mockApiClient,
        pollInterval: 0,
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to load executions')
  })

  it('should poll for updates at specified interval', async () => {
    mockApiClient.listExecutions.mockResolvedValue([mockExecution])

    const { result } = renderHook(() =>
      useExecutionList({
        apiClient: mockApiClient,
        pollInterval: 1000,
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockApiClient.listExecutions).toHaveBeenCalledTimes(1)

    // Fast-forward time
    jest.advanceTimersByTime(1000)

    await waitFor(() => {
      expect(mockApiClient.listExecutions).toHaveBeenCalledTimes(2)
    })
  })

  it('should use custom limit when provided', async () => {
    mockApiClient.listExecutions.mockResolvedValue([])

    renderHook(() =>
      useExecutionList({
        apiClient: mockApiClient,
        pollInterval: 0,
        limit: 50,
      })
    )

    await waitFor(() => {
      expect(mockApiClient.listExecutions).toHaveBeenCalledWith({ limit: 50 })
    })
  })

  it('should handle missing API client', () => {
    const { result } = renderHook(() =>
      useExecutionList({
        apiClient: undefined,
        pollInterval: 0,
      })
    )

    expect(result.current.error).toBe('API client not provided')
    expect(result.current.loading).toBe(false)
  })

  it('should provide refresh function', async () => {
    mockApiClient.listExecutions.mockResolvedValue([mockExecution])

    const { result } = renderHook(() =>
      useExecutionList({
        apiClient: mockApiClient,
        pollInterval: 0,
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    jest.clearAllMocks()

    await result.current.refresh()

    expect(mockApiClient.listExecutions).toHaveBeenCalledTimes(1)
  })

  it('should not poll when pollInterval is 0', async () => {
    mockApiClient.listExecutions.mockResolvedValue([mockExecution])

    const { result } = renderHook(() =>
      useExecutionList({
        apiClient: mockApiClient,
        pollInterval: 0,
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockApiClient.listExecutions).toHaveBeenCalledTimes(1)

    // Fast-forward time - should not trigger another call
    jest.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(mockApiClient.listExecutions).toHaveBeenCalledTimes(1)
    })
  })

  it('should cleanup interval on unmount', async () => {
    mockApiClient.listExecutions.mockResolvedValue([mockExecution])

    const { unmount } = renderHook(() =>
      useExecutionList({
        apiClient: mockApiClient,
        pollInterval: 1000,
      })
    )

    await waitFor(() => {
      expect(mockApiClient.listExecutions).toHaveBeenCalledTimes(1)
    })

    unmount()

    // Fast-forward time - should not trigger another call after unmount
    jest.advanceTimersByTime(1000)

    await waitFor(() => {
      expect(mockApiClient.listExecutions).toHaveBeenCalledTimes(1)
    })
  })
})
