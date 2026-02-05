import { useCallback } from 'react'
import { api } from '../../api/client'
import type { WorkflowDefinition, ExecutionState } from '../../types/workflow'
import { logger } from '../../utils/logger'

/**
 * Workflow API client interface
 */
export interface WorkflowAPIClient {
  getWorkflows(): Promise<WorkflowDefinition[]>
  getWorkflow(id: string): Promise<WorkflowDefinition>
  createWorkflow(workflow: WorkflowDefinition): Promise<WorkflowDefinition>
  updateWorkflow(id: string, workflow: WorkflowDefinition): Promise<WorkflowDefinition>
  deleteWorkflow(id: string): Promise<void>
  executeWorkflow(workflowId: string, inputs?: Record<string, any>): Promise<ExecutionState>
  getExecution(executionId: string): Promise<ExecutionState>
}

/**
 * Custom hook for workflow API operations
 * Follows Dependency Inversion Principle by abstracting API calls
 * Makes components easier to test by allowing API injection
 */
export function useWorkflowAPI(options?: {
  apiClient?: WorkflowAPIClient
  logger?: typeof logger
}) {
  const {
    apiClient = api,
    logger: injectedLogger = logger
  } = options ?? {}

  const getWorkflows = useCallback(async (): Promise<WorkflowDefinition[]> => {
    try {
      return await apiClient.getWorkflows()
    } catch (error) {
      injectedLogger.error('Failed to fetch workflows:', error)
      throw error
    }
  }, [apiClient, injectedLogger])

  const getWorkflow = useCallback(async (id: string): Promise<WorkflowDefinition> => {
    try {
      return await apiClient.getWorkflow(id)
    } catch (error) {
      injectedLogger.error(`Failed to fetch workflow ${id}:`, error)
      throw error
    }
  }, [apiClient, injectedLogger])

  const createWorkflow = useCallback(async (workflow: WorkflowDefinition): Promise<WorkflowDefinition> => {
    try {
      return await apiClient.createWorkflow(workflow)
    } catch (error) {
      injectedLogger.error('Failed to create workflow:', error)
      throw error
    }
  }, [apiClient, injectedLogger])

  const updateWorkflow = useCallback(async (id: string, workflow: WorkflowDefinition): Promise<WorkflowDefinition> => {
    try {
      return await apiClient.updateWorkflow(id, workflow)
    } catch (error) {
      injectedLogger.error(`Failed to update workflow ${id}:`, error)
      throw error
    }
  }, [apiClient, injectedLogger])

  const deleteWorkflow = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.deleteWorkflow(id)
    } catch (error) {
      injectedLogger.error(`Failed to delete workflow ${id}:`, error)
      throw error
    }
  }, [apiClient, injectedLogger])

  const executeWorkflow = useCallback(async (
    workflowId: string,
    inputs?: Record<string, any>
  ): Promise<ExecutionState> => {
    try {
      return await apiClient.executeWorkflow(workflowId, inputs)
    } catch (error) {
      injectedLogger.error(`Failed to execute workflow ${workflowId}:`, error)
      throw error
    }
  }, [apiClient, injectedLogger])

  const getExecution = useCallback(async (executionId: string): Promise<ExecutionState> => {
    try {
      return await apiClient.getExecution(executionId)
    } catch (error) {
      injectedLogger.error(`Failed to fetch execution ${executionId}:`, error)
      throw error
    }
  }, [apiClient, injectedLogger])

  return {
    getWorkflows,
    getWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    getExecution,
  }
}

