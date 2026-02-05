/**
 * Execution Polling Hook
 * Single Responsibility: Only handles polling for execution updates
 * Separated from state management for better testability
 */

import { useEffect } from 'react'
import { logger } from '../../utils/logger'
// Domain-based imports - Phase 7
import type { WorkflowAPIClient } from '../workflow'
import type { Execution } from '../../contexts/WorkflowTabsContext'
import {
  isRealExecutionId,
  shouldLogExecutionError,
} from './executionIdValidation'

interface UseExecutionPollingOptions {
  tabsRef: React.MutableRefObject<any[]>
  setTabs: React.Dispatch<React.SetStateAction<any[]>>
  apiClient: WorkflowAPIClient
  logger?: typeof logger
  pollInterval?: number
}

/**
 * Hook for polling execution updates
 * Single Responsibility: Only handles polling logic
 */
export function useExecutionPolling({
  tabsRef,
  setTabs,
  apiClient,
  logger: injectedLogger = logger,
  pollInterval = 2000,
}: UseExecutionPollingOptions) {
  useEffect(() => {
    // Guard: Ensure pollInterval is valid to prevent timeout mutations
    const safePollInterval = pollInterval > 0 && pollInterval < 60000 ? pollInterval : 2000
    
    // Guard: Max iterations to prevent infinite polling loops
    let iterationCount = 0
    const MAX_ITERATIONS = 1000
    
    const interval = setInterval(async () => {
      // Guard: Prevent infinite loops - stop after max iterations
      iterationCount++
      if (iterationCount > MAX_ITERATIONS) {
        injectedLogger.warn(`[WorkflowTabs] Max polling iterations (${MAX_ITERATIONS}) reached, stopping polling`)
        clearInterval(interval)
        return
      }
      
      // Use ref to get current tabs without causing effect re-run
      const currentTabs = tabsRef.current
      // Add defensive checks to prevent crashes during mutation testing
      if (!currentTabs || !Array.isArray(currentTabs)) return
      
      // Guard: Prevent infinite loops - limit execution count
      const runningExecutions = currentTabs.flatMap(tab => {
        // Add defensive check for tab.executions
        if (!tab || !tab.executions || !Array.isArray(tab.executions)) return []
        return tab.executions.filter((e: Execution) => 
          e !== null && 
          e !== undefined &&
          e.id !== null && 
          e.id !== undefined &&
          e.status === 'running' && 
          // Use extracted validation function - mutation-resistant
          isRealExecutionId(e.id)
        )
      })
      
      // Guard: Early return to prevent unnecessary work
      if (runningExecutions.length === 0) return
      
      // Guard: Limit concurrent API calls to prevent timeout
      if (runningExecutions.length > 50) {
        injectedLogger.warn(`[WorkflowTabs] Too many running executions (${runningExecutions.length}), limiting to 50`)
        runningExecutions.splice(50)
      }

      // Only poll occasionally as fallback - WebSocket handles real-time updates
      injectedLogger.debug(`[WorkflowTabs] Polling ${runningExecutions.length} running execution(s) (fallback)...`)

      // Update all running executions
      const updates = await Promise.all(
        runningExecutions.map(async (exec) => {
          try {
            const execution = await apiClient.getExecution(exec.id)
            const newStatus = execution.status === 'completed' ? 'completed' as const :
                             execution.status === 'failed' ? 'failed' as const :
                             execution.status === 'paused' ? 'running' as const : // Keep as running if paused
                             'running' as const
            
            if (exec.status !== newStatus) {
              injectedLogger.debug(`[WorkflowTabs] Execution ${exec.id} status changed: ${exec.status} → ${newStatus}`)
            }
            
            return {
              id: exec.id,
              status: newStatus,
              startedAt: exec.startedAt,
              completedAt: execution.completed_at ? new Date(execution.completed_at) : undefined,
              nodes: execution.node_states || {},
              logs: execution.logs || []
            }
          } catch (error: any) {
            // If execution not found (404), it might be a temp execution that failed
            // Don't log errors for pending executions
            // Use extracted validation function - mutation-resistant
            if (shouldLogExecutionError(exec)) {
              injectedLogger.error(`[WorkflowTabs] Failed to fetch execution ${exec!.id}:`, error)
            }
            return null
          }
        })
      )

      // Apply updates to tabs
      setTabs(prev => {
        return prev.map(tab => ({
          ...tab,
          executions: (tab.executions && Array.isArray(tab.executions)) 
            ? tab.executions.map((exec: Execution) => {
                const update = updates.find(u => u && u.id === exec.id)
                return update || exec
              })
            : []
        }))
      })
    }, safePollInterval)

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [tabsRef, setTabs, apiClient, injectedLogger, pollInterval])
}
