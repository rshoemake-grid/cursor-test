/**
 * Workflow Execution Hook
 * Handles workflow execution logic
 */

import { useState, useCallback } from 'react'
import { showSuccess as defaultShowSuccess, showError as defaultShowError } from '../utils/notifications'
import { showConfirm as defaultShowConfirm } from '../utils/confirm'
import { api as defaultApi, createApiClient } from '../api/client'
import { logger as defaultLogger } from '../utils/logger'

interface UseWorkflowExecutionOptions {
  isAuthenticated: boolean
  localWorkflowId: string | null
  workflowIdRef: React.MutableRefObject<string | null>
  saveWorkflow: () => Promise<string | null>
  onExecutionStart?: (executionId: string) => void
  // Dependency injection
  showSuccess?: typeof defaultShowSuccess
  showError?: typeof defaultShowError
  showConfirm?: typeof defaultShowConfirm
  api?: ReturnType<typeof createApiClient>
  logger?: typeof defaultLogger
}

export function useWorkflowExecution({
  isAuthenticated,
  localWorkflowId,
  workflowIdRef,
  saveWorkflow,
  onExecutionStart,
  showSuccess = defaultShowSuccess,
  showError = defaultShowError,
  showConfirm = defaultShowConfirm,
  api = defaultApi,
  logger = defaultLogger,
}: UseWorkflowExecutionOptions) {
  const [showInputs, setShowInputs] = useState(false)
  const [executionInputs, setExecutionInputs] = useState<string>('{}')
  const [isExecuting, setIsExecuting] = useState(false)

  const executeWorkflow = useCallback(async () => {
    logger.debug('[WorkflowBuilder] executeWorkflow called')
    logger.debug('[WorkflowBuilder] isAuthenticated:', isAuthenticated)
    logger.debug('[WorkflowBuilder] localWorkflowId:', localWorkflowId)
    
    if (!isAuthenticated) {
      logger.error('[WorkflowBuilder] User not authenticated')
      showError('Please log in to execute workflows.')
      return
    }

    let currentWorkflowId = localWorkflowId
    logger.debug('[WorkflowBuilder] Current workflow ID:', currentWorkflowId)
    
    if (!currentWorkflowId) {
      logger.debug('[WorkflowBuilder] No workflow ID, prompting to save')
      const confirmed = await showConfirm(
        'Workflow needs to be saved before execution. Save now?',
        { title: 'Save Workflow', confirmText: 'Save', cancelText: 'Cancel' }
      )
      if (!confirmed) {
        return
      }
      try {
        const savedId = await saveWorkflow()
        if (!savedId) {
          showError('Failed to save workflow. Cannot execute.')
          return
        }
        currentWorkflowId = savedId
      } catch (error: any) {
        showError('Failed to save workflow. Cannot execute.')
        return
      }
    }

    logger.debug('[WorkflowBuilder] Setting execution inputs and showing dialog')
    setShowInputs(true)
  }, [isAuthenticated, localWorkflowId, saveWorkflow])

  const handleConfirmExecute = useCallback(async () => {
    logger.debug('[WorkflowBuilder] ===== handleConfirmExecute CALLED =====')
    logger.debug('[WorkflowBuilder] executionInputs:', executionInputs)
    logger.debug('[WorkflowBuilder] workflowIdRef.current:', workflowIdRef.current)
    
    setIsExecuting(true)
    
    // Use setTimeout with delay 0 to defer execution to next tick
    // This allows UI to update before starting execution
    // Wrap async callback to ensure it always completes, preventing timeouts
    const timeoutId = setTimeout(() => {
      // Execute async operations in an immediately invoked async function
      // This ensures the setTimeout callback completes even if mutations break await
      (async () => {
        try {
          logger.debug('[WorkflowBuilder] Parsing execution inputs:', executionInputs)
          const inputs = JSON.parse(executionInputs)
          logger.debug('[WorkflowBuilder] Parsed inputs:', inputs)
          setShowInputs(false)
          setExecutionInputs('{}')

          const tempExecutionId = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          logger.debug('[WorkflowBuilder] Created temp execution ID:', tempExecutionId)

          if (onExecutionStart) {
            logger.debug('[WorkflowBuilder] Calling onExecutionStart with temp ID')
            onExecutionStart(tempExecutionId)
          }

          showSuccess('✅ Execution starting...\n\nCheck the console at the bottom of the screen to watch it run.', 6000)

          const workflowIdToExecute = workflowIdRef.current
          logger.debug('[WorkflowBuilder] Workflow ID to execute:', workflowIdToExecute)
          
          if (!workflowIdToExecute) {
            logger.error('[WorkflowBuilder] No workflow ID found - workflow must be saved')
            setIsExecuting(false)
            showError('Workflow must be saved before executing.')
            return
          }

          logger.debug('[WorkflowBuilder] Calling api.executeWorkflow with:', { workflowIdToExecute, inputs })
          
          // Use async/await with proper error handling to prevent timeouts
          // Ensure the promise always resolves/rejects, even when mutations affect await handling
          try {
            const execution = await api.executeWorkflow(workflowIdToExecute, inputs)
            logger.debug('[WorkflowBuilder] Execution response received:', execution)
            // Add null check to prevent crashes when mutations change execution structure
            if (execution && execution.execution_id && execution.execution_id !== tempExecutionId) {
              logger.debug('[WorkflowBuilder] Updating execution ID:', execution.execution_id)
              if (onExecutionStart) {
                onExecutionStart(execution.execution_id)
              }
            }
          } catch (error: any) {
            logger.error('[WorkflowBuilder] Execution failed:', error)
            logger.error('[WorkflowBuilder] Error details:', {
              message: error?.message,
              response: error?.response,
              status: error?.response?.status,
              data: error?.response?.data
            })
            // Use optional chaining to prevent crashes when mutations change error structure
            const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error'
            showError(`Failed to execute workflow: ${errorMessage}`)
          } finally {
            // Always reset executing state to prevent timeouts
            // This ensures state is reset even if mutations affect the promise chain
            setIsExecuting(false)
          }
        } catch (error: any) {
          logger.error('Execution setup failed:', error)
          setIsExecuting(false)
          const errorMessage = error?.message || 'Unknown error'
          showError(`Failed to execute workflow: ${errorMessage}`)
        }
      })().catch((error: any) => {
        // Catch any unhandled promise rejections to prevent timeouts
        logger.error('Unhandled error in execution callback:', error)
        setIsExecuting(false)
        showError(`Failed to execute workflow: ${error?.message || 'Unknown error'}`)
      })
    }, 0)
  }, [executionInputs, workflowIdRef, onExecutionStart])

  return {
    showInputs,
    setShowInputs,
    executionInputs,
    setExecutionInputs,
    isExecuting,
    executeWorkflow,
    handleConfirmExecute,
  }
}
