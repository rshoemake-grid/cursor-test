/**
 * Execution Management Hook
 * Manages execution state updates, polling, and handlers for workflow tabs
 */

import { useCallback, useEffect } from 'react'
import { api } from '../api/client'
import { logger } from '../utils/logger'
import type { WorkflowTabData, Execution } from '../contexts/WorkflowTabsContext'

// Constants to prevent mutation issues
const PENDING_EXECUTION_PREFIX = 'pending-'

interface UseExecutionManagementOptions {
  tabs: WorkflowTabData[]
  activeTabId: string | null
  setTabs: React.Dispatch<React.SetStateAction<WorkflowTabData[]>>
  tabsRef: React.MutableRefObject<WorkflowTabData[]>
  onExecutionStart?: (executionId: string) => void
}

/**
 * Hook for managing execution state and updates
 * 
 * @param options Configuration options
 * @returns Execution management handlers
 */
export function useExecutionManagement({
  tabs,
  activeTabId,
  setTabs,
  tabsRef,
  onExecutionStart,
}: UseExecutionManagementOptions) {
  // Handle execution start - add to active tab's executions
  const handleExecutionStart = useCallback((executionId: string) => {
    const activeTab = tabs.find(t => t.id === activeTabId)
    if (!activeTab) return

    setTabs(prev => prev.map(tab => {
      if (tab.id !== activeTabId) return tab
      
      // If this is a real execution ID (not pending), try to replace the oldest pending execution
      // This ensures we replace them in creation order, even if API responses come back out of order
      if (!executionId.startsWith(PENDING_EXECUTION_PREFIX)) {
        // Find all pending executions
        // Add safety checks to prevent crashes when mutations change exec structure
        const pendingExecutions = tab.executions
          .map((exec, idx) => ({ exec, idx }))
          .filter(({ exec }) => exec && exec.id && exec.id.startsWith && exec.id.startsWith(PENDING_EXECUTION_PREFIX))
        
        if (pendingExecutions.length > 0) {
          // Replace the oldest pending execution (last in array since new ones are prepended)
          const oldestPending = pendingExecutions[pendingExecutions.length - 1]
          
          return {
            ...tab,
            executions: tab.executions.map((exec, idx) =>
              idx === oldestPending.idx
                ? {
                    ...exec,
                    id: executionId
                  }
                : exec
            ),
            activeExecutionId: executionId
          }
        }
      }
      
      // Check if execution already exists (might have been created by a previous call)
      const existingExecution = tab.executions.find(exec => exec.id === executionId)
      if (existingExecution) {
        // Execution already exists, just update activeExecutionId
        return {
          ...tab,
          activeExecutionId: executionId
        }
      }
      
      // Create new execution (either pending or real)
      const newExecution: Execution = {
        id: executionId,
        status: 'running',
        startedAt: new Date(),
        nodes: {},
        logs: []
      }
      
      return {
        ...tab,
        executions: [newExecution, ...tab.executions],
        activeExecutionId: executionId
      }
    }))

    // Also call parent callback if provided
    if (onExecutionStart) {
      onExecutionStart(executionId)
    }
  }, [tabs, activeTabId, setTabs, onExecutionStart])

  // Handle clearing executions for a workflow
  const handleClearExecutions = useCallback((workflowId: string) => {
    logger.debug('handleClearExecutions called for workflowId:', workflowId)
    setTabs(prev => {
      const updated = prev.map(tab => 
        tab.workflowId === workflowId
          ? { ...tab, executions: [], activeExecutionId: null }
          : tab
      )
      logger.debug('Updated tabs:', updated)
      return updated
    })
  }, [setTabs])

  // Handle removing a single execution
  const handleRemoveExecution = useCallback((workflowId: string, executionId: string) => {
    logger.debug('handleRemoveExecution called for workflowId:', workflowId, 'executionId:', executionId)
    setTabs(prev => prev.map(tab => {
      if (tab.workflowId !== workflowId) return tab
      
      const updatedExecutions = tab.executions.filter(exec => exec.id !== executionId)
      const newActiveExecutionId = tab.activeExecutionId === executionId 
        ? (updatedExecutions.length > 0 ? updatedExecutions[0].id : null)
        : tab.activeExecutionId
      
      return {
        ...tab,
        executions: updatedExecutions,
        activeExecutionId: newActiveExecutionId
      }
    }))
  }, [setTabs])

  // Handle real-time log updates from WebSocket
  const handleExecutionLogUpdate = useCallback((workflowId: string, executionId: string, log: any) => {
    setTabs(prev => prev.map(tab => 
      tab.workflowId === workflowId
        ? {
            ...tab,
            executions: tab.executions.map(exec =>
              exec.id === executionId
                ? {
                    ...exec,
                    logs: [...exec.logs, log]
                  }
                : exec
            )
          }
        : tab
    ))
  }, [setTabs])

  // Handle execution status updates from WebSocket
  const handleExecutionStatusUpdate = useCallback((workflowId: string, executionId: string, status: 'running' | 'completed' | 'failed') => {
    setTabs(prev => prev.map(tab => 
      tab.workflowId === workflowId
        ? {
            ...tab,
            executions: tab.executions.map(exec =>
              exec.id === executionId
                ? {
                    ...exec,
                    status,
                    completedAt: (status === 'completed' || status === 'failed') ? new Date() : exec.completedAt
                  }
                : exec
            )
          }
        : tab
    ))
  }, [setTabs])

  // Handle node state updates from WebSocket
  const handleExecutionNodeUpdate = useCallback((workflowId: string, executionId: string, nodeId: string, nodeState: any) => {
    setTabs(prev => prev.map(tab => 
      tab.workflowId === workflowId
        ? {
            ...tab,
            executions: tab.executions.map(exec =>
              exec.id === executionId
                ? {
                    ...exec,
                    nodes: {
                      ...exec.nodes,
                      [nodeId]: nodeState
                    }
                  }
                : exec
            )
          }
        : tab
    ))
  }, [setTabs])

  // Poll for execution updates (fallback when WebSocket not available)
  // Reduced frequency since WebSocket handles real-time updates
  useEffect(() => {
    const interval = setInterval(async () => {
      // Use ref to get current tabs without causing effect re-run
      const currentTabs = tabsRef.current
      const runningExecutions = currentTabs.flatMap(tab => 
        tab.executions.filter(e => e && e.id && e.status === 'running' && e.id.startsWith && !e.id.startsWith(PENDING_EXECUTION_PREFIX))
      )
      
      if (runningExecutions.length === 0) return

      // Only poll occasionally as fallback - WebSocket handles real-time updates
      logger.debug(`[WorkflowTabs] Polling ${runningExecutions.length} running execution(s) (fallback)...`)

      // Update all running executions
      const updates = await Promise.all(
        runningExecutions.map(async (exec) => {
          try {
            const execution = await api.getExecution(exec.id)
            const newStatus = execution.status === 'completed' ? 'completed' as const :
                             execution.status === 'failed' ? 'failed' as const :
                             execution.status === 'paused' ? 'running' as const : // Keep as running if paused
                             'running' as const
            
            if (exec.status !== newStatus) {
              logger.debug(`[WorkflowTabs] Execution ${exec.id} status changed: ${exec.status} → ${newStatus}`)
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
              logger.error(`[WorkflowTabs] Failed to fetch execution ${exec.id}:`, error)
            }
            return null
          }
        })
      )

      // Apply updates to tabs
      setTabs(prev => {
        return prev.map(tab => ({
          ...tab,
          executions: tab.executions.map(exec => {
            const update = updates.find(u => u && u.id === exec.id)
            return update || exec
          })
        }))
      })
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [tabsRef, setTabs]) // Empty dependency array - interval runs consistently

  return {
    handleExecutionStart,
    handleClearExecutions,
    handleRemoveExecution,
    handleExecutionLogUpdate,
    handleExecutionStatusUpdate,
    handleExecutionNodeUpdate,
  }
}
