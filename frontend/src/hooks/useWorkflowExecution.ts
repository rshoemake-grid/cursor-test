/**
 * Workflow Execution Hook
 * Handles workflow execution logic
 */

import { useState, useCallback } from 'react'
import { showSuccess, showError } from '../utils/notifications'
import { showConfirm } from '../utils/confirm'
import { api } from '../api/client'
import { logger } from '../utils/logger'

interface UseWorkflowExecutionOptions {
  isAuthenticated: boolean
  localWorkflowId: string | null
  workflowIdRef: React.MutableRefObject<string | null>
  saveWorkflow: () => Promise<string | null>
  onExecutionStart?: (executionId: string) => void
}

export function useWorkflowExecution({
  isAuthenticated,
  localWorkflowId,
  workflowIdRef,
  saveWorkflow,
  onExecutionStart,
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
    setTimeout(async () => {
      try {
        logger.debug('[WorkflowBuilder] Parsing execution inputs:', executionInputs)
        const inputs = JSON.parse(executionInputs)
        logger.debug('[WorkflowBuilder] Parsed inputs:', inputs)
        setShowInputs(false)
        setExecutionInputs('{}')
        setIsExecuting(false)

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
          showError('Workflow must be saved before executing.')
          setIsExecuting(false)
          return
        }

        logger.debug('[WorkflowBuilder] Calling api.executeWorkflow with:', { workflowIdToExecute, inputs })
        api.executeWorkflow(workflowIdToExecute, inputs)
          .then((execution) => {
            logger.debug('[WorkflowBuilder] Execution response received:', execution)
            if (execution.execution_id && execution.execution_id !== tempExecutionId) {
              logger.debug('[WorkflowBuilder] Updating execution ID:', execution.execution_id)
              if (onExecutionStart) {
                onExecutionStart(execution.execution_id)
              }
            }
          })
          .catch((error: any) => {
            logger.error('[WorkflowBuilder] Execution failed:', error)
            logger.error('[WorkflowBuilder] Error details:', {
              message: error.message,
              response: error.response,
              status: error.response?.status,
              data: error.response?.data
            })
            setIsExecuting(false)
            const errorMessage = error.response?.data?.detail || error.message || 'Unknown error'
            showError(`Failed to execute workflow: ${errorMessage}`)
          })
      } catch (error: any) {
        logger.error('Execution setup failed:', error)
        setIsExecuting(false)
        const errorMessage = error?.message || 'Unknown error'
        showError(`Failed to execute workflow: ${errorMessage}`)
      }
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
