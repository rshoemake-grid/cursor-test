/**
 * Execution Filtering Utilities
 * DRY: Centralized filtering logic
 * SOLID: Single Responsibility - only handles filtering
 */

import type { ExecutionState, ExecutionStatus } from '../types/workflow'
import type { ExecutionFiltersState } from '../components/log/ExecutionFilters'
import { formatExecutionDuration } from './executionFormat'

/**
 * Filter executions by status
 */
export function filterByStatus(
  executions: ExecutionState[],
  statuses?: ExecutionStatus[]
): ExecutionState[] {
  if (!statuses || statuses.length === 0) {
    return executions
  }
  return executions.filter((execution) => statuses.includes(execution.status))
}

/**
 * Filter executions by workflow ID
 */
export function filterByWorkflowId(
  executions: ExecutionState[],
  workflowId?: string
): ExecutionState[] {
  if (!workflowId) {
    return executions
  }
  return executions.filter(
    (execution) => execution.workflow_id === workflowId
  )
}

/**
 * Filter executions by search query
 */
export function filterBySearchQuery(
  executions: ExecutionState[],
  searchQuery?: string
): ExecutionState[] {
  if (!searchQuery || searchQuery.trim() === '') {
    return executions
  }

  const query = searchQuery.toLowerCase().trim()

  return executions.filter((execution) => {
    // Search in execution ID
    if (execution.execution_id.toLowerCase().includes(query)) {
      return true
    }

    // Search in workflow ID
    if (execution.workflow_id.toLowerCase().includes(query)) {
      return true
    }

    // Search in error message
    if (execution.error && execution.error.toLowerCase().includes(query)) {
      return true
    }

    // Search in current node
    if (
      execution.current_node &&
      execution.current_node.toLowerCase().includes(query)
    ) {
      return true
    }

    return false
  })
}

/**
 * Sort executions
 */
export function sortExecutions(
  executions: ExecutionState[],
  sortBy: ExecutionFiltersState['sortBy'] = 'started_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): ExecutionState[] {
  const sorted = [...executions].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'started_at':
        comparison =
          new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
        break

      case 'completed_at':
        const aCompleted = a.completed_at
          ? new Date(a.completed_at).getTime()
          : 0
        const bCompleted = b.completed_at
          ? new Date(b.completed_at).getTime()
          : 0
        comparison = aCompleted - bCompleted
        break

      case 'duration':
        const aDuration = a.completed_at
          ? new Date(a.completed_at).getTime() -
            new Date(a.started_at).getTime()
          : Date.now() - new Date(a.started_at).getTime()
        const bDuration = b.completed_at
          ? new Date(b.completed_at).getTime() -
            new Date(b.started_at).getTime()
          : Date.now() - new Date(b.started_at).getTime()
        comparison = aDuration - bDuration
        break

      case 'status':
        comparison = a.status.localeCompare(b.status)
        break

      default:
        comparison = 0
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  return sorted
}

/**
 * Apply all filters to executions
 */
export function applyExecutionFilters(
  executions: ExecutionState[],
  filters: ExecutionFiltersState
): ExecutionState[] {
  let filtered = executions

  // Apply status filter
  filtered = filterByStatus(filtered, filters.status)

  // Apply workflow filter
  filtered = filterByWorkflowId(filtered, filters.workflowId)

  // Apply search filter
  filtered = filterBySearchQuery(filtered, filters.searchQuery)

  // Apply sorting
  filtered = sortExecutions(
    filtered,
    filters.sortBy,
    filters.sortOrder
  )

  return filtered
}
