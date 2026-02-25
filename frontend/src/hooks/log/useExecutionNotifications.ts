/**
 * Custom Hook for Execution Notifications
 * SOLID: Single Responsibility - only manages execution status notifications
 * DRY: Reusable notification logic
 * DIP: Depends on abstractions
 */

import { useEffect, useRef } from 'react'
import type { ExecutionState } from '../../types/workflow'

export interface UseExecutionNotificationsOptions {
  executions: ExecutionState[]
  onSuccess?: (execution: ExecutionState) => void
  onError?: (execution: ExecutionState) => void
  enabled?: boolean
}

/**
 * Custom hook for monitoring execution status changes and triggering notifications
 * 
 * @param options - Notification options
 */
export function useExecutionNotifications({
  executions,
  onSuccess,
  onError,
  enabled = true,
}: UseExecutionNotificationsOptions) {
  const previousStatusesRef = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    if (!enabled) {
      return
    }

    executions.forEach((execution) => {
      const executionId = execution.execution_id
      const currentStatus = execution.status
      const previousStatus = previousStatusesRef.current.get(executionId)

      // Only trigger notifications on status changes
      if (previousStatus && previousStatus !== currentStatus) {
        if (currentStatus === 'completed' && onSuccess) {
          onSuccess(execution)
        } else if (currentStatus === 'failed' && onError) {
          onError(execution)
        }
      }

      // Update the previous status
      previousStatusesRef.current.set(executionId, currentStatus)
    })

    // Clean up old executions from the map
    const currentExecutionIds = new Set(executions.map((e) => e.execution_id))
    previousStatusesRef.current.forEach((_, executionId) => {
      if (!currentExecutionIds.has(executionId)) {
        previousStatusesRef.current.delete(executionId)
      }
    })
  }, [executions, enabled, onSuccess, onError])
}
