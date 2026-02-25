/**
 * Custom Hook for Execution List
 * SOLID: Single Responsibility - only manages execution list state
 * DIP: Depends on abstraction (API client interface) not concrete implementation
 * DRY: Reusable hook for execution list logic
 */

import { useState, useEffect, useCallback } from 'react'
import type { ExecutionState } from '../../types/workflow'
import { logger } from '../../utils/logger'

export interface ExecutionListAPI {
  listExecutions(params?: {
    workflow_id?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<ExecutionState[]>
}

export interface ExecutionFilters {
  status?: string
  workflow_id?: string
  limit?: number
  offset?: number
}

export interface UseExecutionListOptions {
  apiClient?: ExecutionListAPI
  pollInterval?: number
  limit?: number
  filters?: ExecutionFilters
}

export interface UseExecutionListResult {
  executions: ExecutionState[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Custom hook for managing execution list
 * 
 * @param options - Configuration options
 * @returns Execution list state and refresh function
 */
export function useExecutionList(
  options: UseExecutionListOptions = {}
): UseExecutionListResult {
  const {
    apiClient,
    pollInterval = 5000,
    limit = 100,
    filters,
  } = options

  const [executions, setExecutions] = useState<ExecutionState[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadExecutions = useCallback(async () => {
    if (!apiClient) {
      setError('API client not provided')
      setLoading(false)
      return
    }

    try {
      setError(null)
      const params = {
        limit,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.workflow_id && { workflow_id: filters.workflow_id }),
        ...(filters?.offset && { offset: filters.offset }),
      }
      const data = await apiClient.listExecutions(params)
      setExecutions(data)
    } catch (err: any) {
      logger.error('Failed to load executions:', err)
      setError(err.message || 'Failed to load executions')
    } finally {
      setLoading(false)
    }
  }, [apiClient, limit, filters])

  useEffect(() => {
    loadExecutions()
    
    if (pollInterval > 0) {
      const interval = setInterval(() => {
        loadExecutions()
      }, pollInterval)

      return () => clearInterval(interval)
    }
  }, [loadExecutions, pollInterval])

  return {
    executions,
    loading,
    error,
    refresh: loadExecutions,
  }
}
