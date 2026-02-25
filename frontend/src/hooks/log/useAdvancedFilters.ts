/**
 * Custom Hook for Advanced Filters
 * SOLID: Single Responsibility - only manages advanced filter state
 * DRY: Reusable filter logic
 * DIP: Depends on abstractions
 */

import { useMemo } from 'react'
import type { ExecutionState } from '../../types/workflow'

export interface AdvancedFilterOptions {
  dateRange?: {
    start?: Date
    end?: Date
  }
  minDuration?: number // in seconds
  maxDuration?: number // in seconds
  hasError?: boolean
  workflowIds?: string[]
  nodeIds?: string[]
}

export interface UseAdvancedFiltersOptions {
  executions: ExecutionState[]
  filters: AdvancedFilterOptions
}

export interface UseAdvancedFiltersResult {
  filteredExecutions: ExecutionState[]
  filterCount: number
}

/**
 * Custom hook for advanced filtering of executions
 * 
 * @param options - Filter options
 * @returns Filtered executions and filter count
 */
export function useAdvancedFilters({
  executions,
  filters,
}: UseAdvancedFiltersOptions): UseAdvancedFiltersResult {
  const filteredExecutions = useMemo(() => {
    let result = [...executions]

    // Date range filter
    if (filters.dateRange?.start || filters.dateRange?.end) {
      result = result.filter((execution) => {
        const startDate = new Date(execution.started_at)
        const startMatch = !filters.dateRange?.start || startDate >= filters.dateRange.start
        const endMatch = !filters.dateRange?.end || startDate <= filters.dateRange.end
        return startMatch && endMatch
      })
    }

    // Duration filters
    if (filters.minDuration !== undefined || filters.maxDuration !== undefined) {
      result = result.filter((execution) => {
        const duration = execution.completed_at
          ? Math.floor(
              (new Date(execution.completed_at).getTime() -
                new Date(execution.started_at).getTime()) /
                1000
            )
          : Math.floor((Date.now() - new Date(execution.started_at).getTime()) / 1000)

        const minMatch = filters.minDuration === undefined || duration >= filters.minDuration
        const maxMatch = filters.maxDuration === undefined || duration <= filters.maxDuration
        return minMatch && maxMatch
      })
    }

    // Error filter
    if (filters.hasError !== undefined) {
      result = result.filter((execution) => {
        if (filters.hasError) {
          return !!execution.error
        } else {
          return !execution.error
        }
      })
    }

    // Workflow IDs filter
    if (filters.workflowIds && filters.workflowIds.length > 0) {
      result = result.filter((execution) =>
        filters.workflowIds!.includes(execution.workflow_id)
      )
    }

    // Node IDs filter
    if (filters.nodeIds && filters.nodeIds.length > 0) {
      result = result.filter((execution) => {
        if (!execution.node_states) {
          return false
        }
        return filters.nodeIds!.some((nodeId) => nodeId in execution.node_states!)
      })
    }

    return result
  }, [executions, filters])

  const filterCount = useMemo(() => {
    let count = 0
    if (filters.dateRange?.start || filters.dateRange?.end) count++
    if (filters.minDuration !== undefined) count++
    if (filters.maxDuration !== undefined) count++
    if (filters.hasError !== undefined) count++
    if (filters.workflowIds && filters.workflowIds.length > 0) count++
    if (filters.nodeIds && filters.nodeIds.length > 0) count++
    return count
  }, [filters])

  return {
    filteredExecutions,
    filterCount,
  }
}
