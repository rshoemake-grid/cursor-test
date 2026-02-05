/**
 * Workflow Execution Hook
 * Handles workflow execution logic
 */

import { useState, useCallback } from 'react'
import { showSuccess as defaultShowSuccess, showError as defaultShowError } from '../utils/notifications'
import { showConfirm as defaultShowConfirm } from '../utils/confirm'
import { api as defaultApi, createApiClient } from '../api/client'
import { logger as defaultLogger } from '../utils/logger'
import { WorkflowExecutionService } from './utils/workflowExecutionService'

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
    logger.debug('[WorkflowBuilder] handleConfirmExecute called')
    logger.debug('[WorkflowBuilder] executionInputs:', executionInputs)
    logger.debug('[WorkflowBuilder] workflowIdRef.current:', workflowIdRef.current)
    
    setIsExecuting(true)
    
    try {
      // Parse inputs using execution service
      const executionService = new WorkflowExecutionService({
        api,
        logger,
      })
      
      const inputs = executionService.parseExecutionInputs(executionInputs)
      logger.debug('[WorkflowBuilder] Parsed inputs:', inputs)
      
      // Reset inputs UI
      setShowInputs(false)
      setExecutionInputs('{}')

      // Create temp execution ID
      const tempExecutionId = executionService.createTempExecutionId()
      logger.debug('[WorkflowBuilder] Created temp execution ID:', tempExecutionId)

      // Show success message
      showSuccess('✅ Execution starting...\n\nCheck the console at the bottom of the screen to watch it run.', 6000)

      // Get workflow ID
      const workflowIdToExecute = workflowIdRef.current
      logger.debug('[WorkflowBuilder] Workflow ID to execute:', workflowIdToExecute)
      
      if (!workflowIdToExecute) {
        logger.error('[WorkflowBuilder] No workflow ID found - workflow must be saved')
        showError('Workflow must be saved before executing.')
        return
      }

      // Execute workflow
      logger.debug('[WorkflowBuilder] Calling execution service')
      await executionService.executeWorkflow({
        workflowId: workflowIdToExecute,
        inputs,
        tempExecutionId,
        onExecutionStart,
      })
    } catch (error: any) {
      logger.error('[WorkflowBuilder] Execution failed:', error)
      const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error'
      showError(`Failed to execute workflow: ${errorMessage}`)
    } finally {
      setIsExecuting(false)
    }
  }, [executionInputs, workflowIdRef, onExecutionStart, api, logger, showSuccess, showError])

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
