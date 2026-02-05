/**
 * Execution Management Hook
 * Manages execution state updates, polling, and handlers for workflow tabs
 */

import { useCallback, useMemo } from 'react'
import { api } from '../api/client'
import { logger } from '../utils/logger'
import type { WorkflowTabData } from '../contexts/WorkflowTabsContext'
import type { WorkflowAPIClient } from '../api/client'
import { useExecutionPolling } from './utils/useExecutionPolling'
import { ExecutionStateManager } from './utils/executionStateManager'

interface UseExecutionManagementOptions {
  tabs: WorkflowTabData[]
  activeTabId: string | null
  setTabs: React.Dispatch<React.SetStateAction<WorkflowTabData[]>>
  tabsRef: React.MutableRefObject<WorkflowTabData[]>
  onExecutionStart?: (executionId: string) => void
  // Dependency injection
  apiClient?: WorkflowAPIClient
  logger?: typeof logger
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
  apiClient = api,
  logger: injectedLogger = logger,
}: UseExecutionManagementOptions) {
  // Create state manager instance
  const stateManager = useMemo(
    () => new ExecutionStateManager({ logger: injectedLogger }),
    [injectedLogger]
  )

  // Handle execution start - add to active tab's executions
  const handleExecutionStart = useCallback((executionId: string) => {
    setTabs(prev => stateManager.handleExecutionStart(prev, activeTabId, executionId))

    // Also call parent callback if provided
    if (onExecutionStart) {
      onExecutionStart(executionId)
    }
  }, [tabs, activeTabId, setTabs, onExecutionStart, stateManager])

  // Handle clearing executions for a workflow
  const handleClearExecutions = useCallback((workflowId: string) => {
    setTabs(prev => stateManager.handleClearExecutions(prev, workflowId))
  }, [setTabs, stateManager])

  // Handle removing a single execution
  const handleRemoveExecution = useCallback((workflowId: string, executionId: string) => {
    setTabs(prev => stateManager.handleRemoveExecution(prev, workflowId, executionId))
  }, [setTabs, stateManager])

  // Handle real-time log updates from WebSocket
  const handleExecutionLogUpdate = useCallback((workflowId: string, executionId: string, log: any) => {
    setTabs(prev => stateManager.handleExecutionLogUpdate(prev, workflowId, executionId, log))
  }, [setTabs, stateManager])

  // Handle execution status updates from WebSocket
  const handleExecutionStatusUpdate = useCallback((workflowId: string, executionId: string, status: 'running' | 'completed' | 'failed') => {
    setTabs(prev => stateManager.handleExecutionStatusUpdate(prev, workflowId, executionId, status))
  }, [setTabs, stateManager])

  // Handle node state updates from WebSocket
  const handleExecutionNodeUpdate = useCallback((workflowId: string, executionId: string, nodeId: string, nodeState: any) => {
    setTabs(prev => stateManager.handleExecutionNodeUpdate(prev, workflowId, executionId, nodeId, nodeState))
  }, [setTabs, stateManager])

  // Use polling hook for execution updates (fallback when WebSocket not available)
  useExecutionPolling({
    tabsRef,
    setTabs,
    apiClient,
    logger: injectedLogger,
    pollInterval: 2000, // Poll every 2 seconds
  })

  return {
    handleExecutionStart,
    handleClearExecutions,
    handleRemoveExecution,
    handleExecutionLogUpdate,
    handleExecutionStatusUpdate,
    handleExecutionNodeUpdate,
  }
}
