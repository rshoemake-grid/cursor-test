/**
 * Execution Polling Hook
 * Single Responsibility: Only handles polling for execution updates
 * Separated from state management for better testability
 */

import { useEffect } from 'react'
import { logger } from '../../utils/logger'
import type { WorkflowAPIClient } from '../../api/client'
import type { Execution } from '../../contexts/WorkflowTabsContext'

// Constants to prevent mutation issues
const PENDING_EXECUTION_PREFIX = 'pending-'

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
    const interval = setInterval(async () => {
      // Use ref to get current tabs without causing effect re-run
      const currentTabs = tabsRef.current
      // Add defensive checks to prevent crashes during mutation testing
      if (!currentTabs || !Array.isArray(currentTabs)) return
      
      const runningExecutions = currentTabs.flatMap(tab => {
        // Add defensive check for tab.executions
        if (!tab || !tab.executions || !Array.isArray(tab.executions)) return []
        return tab.executions.filter(e => 
          e && 
          e.id && 
          e.status === 'running' && 
          e.id.startsWith && 
          !e.id.startsWith(PENDING_EXECUTION_PREFIX)
        )
      })
      
      if (runningExecutions.length === 0) return

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
            // Add safety check to prevent crashes when mutations change exec structure
            if (exec && exec.id && exec.id.startsWith && !exec.id.startsWith(PENDING_EXECUTION_PREFIX)) {
              injectedLogger.error(`[WorkflowTabs] Failed to fetch execution ${exec.id}:`, error)
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
    }, pollInterval)

    return () => clearInterval(interval)
  }, [tabsRef, setTabs, apiClient, injectedLogger, pollInterval])
}
