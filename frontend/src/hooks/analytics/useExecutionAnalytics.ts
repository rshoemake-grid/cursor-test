/**
 * Custom Hook for Execution Analytics
 * SOLID: Single Responsibility - only calculates analytics metrics
 * DRY: Reusable analytics logic
 * DIP: Depends on abstractions
 */

import { useMemo } from 'react'
import type { ExecutionState } from '../../types/workflow'

export interface ExecutionAnalytics {
  totalExecutions: number
  successRate: number
  averageDuration: number
  totalDuration: number
  statusCounts: Record<string, number>
  executionsByWorkflow: Record<string, number>
  recentExecutions: ExecutionState[]
  failedExecutions: ExecutionState[]
}

export interface UseExecutionAnalyticsOptions {
  executions: ExecutionState[]
  recentLimit?: number
}

/**
 * Custom hook for calculating execution analytics
 * 
 * @param options - Analytics options
 * @returns Calculated analytics metrics
 */
export function useExecutionAnalytics({
  executions,
  recentLimit = 10,
}: UseExecutionAnalyticsOptions): ExecutionAnalytics {
  return useMemo(() => {
    const totalExecutions = executions.length

    if (totalExecutions === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        averageDuration: 0,
        totalDuration: 0,
        statusCounts: {},
        executionsByWorkflow: {},
        recentExecutions: [],
        failedExecutions: [],
      }
    }

    // Calculate status counts
    const statusCounts: Record<string, number> = {}
    executions.forEach((execution) => {
      statusCounts[execution.status] = (statusCounts[execution.status] || 0) + 1
    })

    // Calculate success rate
    const completedCount = statusCounts.completed || 0
    const successRate = totalExecutions > 0 ? (completedCount / totalExecutions) * 100 : 0

    // Calculate durations
    const durations = executions
      .map((execution) => {
        if (execution.completed_at) {
          return (
            new Date(execution.completed_at).getTime() -
            new Date(execution.started_at).getTime()
          )
        }
        return Date.now() - new Date(execution.started_at).getTime()
      })
      .filter((duration) => duration > 0)

    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0)
    const averageDuration =
      durations.length > 0 ? totalDuration / durations.length : 0

    // Group by workflow
    const executionsByWorkflow: Record<string, number> = {}
    executions.forEach((execution) => {
      executionsByWorkflow[execution.workflow_id] =
        (executionsByWorkflow[execution.workflow_id] || 0) + 1
    })

    // Get recent executions (sorted by start time, newest first)
    const recentExecutions = [...executions]
      .sort(
        (a, b) =>
          new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      )
      .slice(0, recentLimit)

    // Get failed executions
    const failedExecutions = executions.filter(
      (execution) => execution.status === 'failed'
    )

    return {
      totalExecutions,
      successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
      averageDuration: Math.round(averageDuration / 1000), // Convert to seconds
      totalDuration: Math.round(totalDuration / 1000), // Convert to seconds
      statusCounts,
      executionsByWorkflow,
      recentExecutions,
      failedExecutions,
    }
  }, [executions, recentLimit])
}
