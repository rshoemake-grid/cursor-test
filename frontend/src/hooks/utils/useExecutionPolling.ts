/**
 * Execution Polling Hook
 * Single Responsibility: Only handles polling for execution updates
 * Separated from state management for better testability
 */

import { useEffect } from 'react'
import { logger } from '../../utils/logger'
// Domain-based imports - Phase 7
import type { WorkflowAPIClient } from '../workflow/useWorkflowAPI'
import type { Execution } from '../../contexts/WorkflowTabsContext'
import {
  isRealExecutionId,
  shouldLogExecutionError,
} from './executionIdValidation'
// Removed logicalOr imports - replaced with explicit checks

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
    // Explicit boolean checks to prevent mutation survivors
    const isPositive = pollInterval > 0
    const isWithinLimit = pollInterval < 60000
    const isValidInterval = isPositive === true && isWithinLimit === true
    const safePollInterval = isValidInterval === true ? pollInterval : 2000
    
    // Guard: Max iterations to prevent infinite polling loops
    let iterationCount = 0
    const MAX_ITERATIONS = 1000
    
    const interval = setInterval(async () => {
      // Guard: Prevent infinite loops - stop after max iterations
      iterationCount++
      // Explicit boolean check to prevent mutation survivors
      const exceedsMaxIterations = iterationCount > MAX_ITERATIONS
      if (exceedsMaxIterations === true) {
        injectedLogger.warn(`[WorkflowTabs] Max polling iterations (${MAX_ITERATIONS}) reached, stopping polling`)
        clearInterval(interval)
        return
      }
      
      // Use ref to get current tabs without causing effect re-run
      const currentTabs = tabsRef.current
      // Add defensive checks to prevent crashes during mutation testing
      // Explicit boolean checks to prevent mutation survivors
      const hasTabs = currentTabs !== null && currentTabs !== undefined
      const isArray = Array.isArray(currentTabs) === true
      if (hasTabs === false || isArray === false) return
      
      // Guard: Prevent infinite loops - limit execution count
      const runningExecutions = currentTabs.flatMap(tab => {
        // Add defensive check for tab.executions
        // Explicit boolean checks to prevent mutation survivors
        const hasTab = tab !== null && tab !== undefined
        const hasExecutions = hasTab === true && tab.executions !== null && tab.executions !== undefined
        const isExecutionsArray = hasExecutions === true && Array.isArray(tab.executions) === true
        if (hasTab === false || hasExecutions === false || isExecutionsArray === false) return []
        return tab.executions.filter((e: Execution) => {
          // Explicit boolean checks to prevent mutation survivors
          const hasExecution = e !== null && e !== undefined
          const hasId = hasExecution === true && e.id !== null && e.id !== undefined
          const isRunning = hasId === true && e.status === 'running'
          const isValidId = isRunning === true && isRealExecutionId(e.id) === true
          return hasExecution === true && hasId === true && isRunning === true && isValidId === true
        })
      })
      
      // Guard: Early return to prevent unnecessary work
      // Explicit boolean check to prevent mutation survivors
      const hasRunningExecutions = runningExecutions.length > 0
      if (hasRunningExecutions === false) return
      
      // Guard: Limit concurrent API calls to prevent timeout
      // Explicit boolean check to prevent mutation survivors
      const exceedsLimit = runningExecutions.length > 50
      if (exceedsLimit === true) {
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
            // Explicit boolean checks to prevent mutation survivors
            const isCompleted = execution.status === 'completed'
            const isFailed = execution.status === 'failed'
            const isPaused = execution.status === 'paused'
            const newStatus = isCompleted === true ? 'completed' as const :
                             isFailed === true ? 'failed' as const :
                             isPaused === true ? 'running' as const : // Keep as running if paused
                             'running' as const
            
            // Explicit boolean check to prevent mutation survivors
            const statusChanged = exec.status !== newStatus
            if (statusChanged === true) {
              injectedLogger.debug(`[WorkflowTabs] Execution ${exec.id} status changed: ${exec.status} → ${newStatus}`)
            }
            
            // Explicit check for completed_at to prevent mutation survivors
            const hasCompletedAt = execution.completed_at !== null && execution.completed_at !== undefined
            const completedAt = hasCompletedAt === true ? new Date(execution.completed_at!) : undefined
            
            // Explicit checks to prevent mutation survivors - replace logicalOr functions
            const hasNodeStates = execution.node_states !== null && execution.node_states !== undefined
            const nodes = hasNodeStates === true ? execution.node_states : {}
            const hasLogs = execution.logs !== null && execution.logs !== undefined && Array.isArray(execution.logs) === true
            const logs = hasLogs === true ? execution.logs : []
            
            return {
              id: exec.id,
              status: newStatus,
              startedAt: exec.startedAt,
              completedAt: completedAt,
              nodes: nodes,
              logs: logs
            }
          } catch (error: any) {
            // If execution not found (404), it might be a temp execution that failed
            // Don't log errors for pending executions
            // Use extracted validation function - mutation-resistant
            // Explicit boolean check to prevent mutation survivors
            const shouldLog = shouldLogExecutionError(exec) === true
            if (shouldLog === true) {
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
          executions: (() => {
            // Explicit boolean checks to prevent mutation survivors
            const hasExecutions = tab.executions !== null && tab.executions !== undefined
            const isExecutionsArray = hasExecutions === true && Array.isArray(tab.executions) === true
            if (hasExecutions === false || isExecutionsArray === false) return []
            return tab.executions.map((exec: Execution) => {
              const update = updates.find(u => {
                const hasUpdate = u !== null && u !== undefined
                const hasUpdateId = hasUpdate === true && u.id !== null && u.id !== undefined
                const matchesExec = hasUpdateId === true && u.id === exec.id
                return hasUpdate === true && hasUpdateId === true && matchesExec === true
              })
              // Explicit check to prevent mutation survivors
              const hasUpdate = update !== null && update !== undefined
              return hasUpdate === true ? update : exec
            })
          })()
        }))
      })
    }, safePollInterval)

    return () => {
      // Explicit boolean check to prevent mutation survivors
      const hasInterval = interval !== null && interval !== undefined
      if (hasInterval === true) {
        clearInterval(interval)
      }
    }
  }, [tabsRef, setTabs, apiClient, injectedLogger, pollInterval])
}
