/**
 * React Query Hook for Execution List
 * SOLID: Single Responsibility - only manages execution list query
 * DIP: Depends on abstraction (API client interface) not concrete implementation
 * DRY: Reusable hook with caching
 */

import { useQuery } from '@tanstack/react-query'
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

export interface UseExecutionListQueryOptions {
  apiClient?: ExecutionListAPI
  filters?: {
    status?: string
    workflow_id?: string
    limit?: number
    offset?: number
  }
  enabled?: boolean
  refetchInterval?: number
}

/**
 * React Query hook for execution list with caching
 * 
 * @param options - Query options
 * @returns Query result with executions, loading, error, and refetch
 */
export function useExecutionListQuery({
  apiClient,
  filters,
  enabled = true,
  refetchInterval = 5000,
}: UseExecutionListQueryOptions = {}) {
  return useQuery({
    queryKey: ['executions', filters],
    queryFn: async () => {
      if (!apiClient) {
        throw new Error('API client not provided')
      }

      const params = {
        limit: filters?.limit || 100,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.workflow_id && { workflow_id: filters.workflow_id }),
        ...(filters?.offset && { offset: filters.offset }),
      }

      try {
        const data = await apiClient.listExecutions(params)
        return data
      } catch (err: any) {
        logger.error('Failed to load executions:', err)
        throw err
      }
    },
    enabled: enabled && !!apiClient,
    refetchInterval: refetchInterval > 0 ? refetchInterval : false,
    staleTime: 3 * 1000, // 3 seconds - data is fresh for 3 seconds
  })
}
