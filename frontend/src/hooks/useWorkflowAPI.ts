import { useCallback } from 'react'
import { api } from '../api/client'
import type { WorkflowDefinition, ExecutionState } from '../types/workflow'
import { logger } from '../utils/logger'

/**
 * Custom hook for workflow API operations
 * Follows Dependency Inversion Principle by abstracting API calls
 * Makes components easier to test by allowing API injection
 */
export function useWorkflowAPI() {
  const getWorkflows = useCallback(async (): Promise<WorkflowDefinition[]> => {
    try {
      return await api.getWorkflows()
    } catch (error) {
      logger.error('Failed to fetch workflows:', error)
      throw error
    }
  }, [])

  const getWorkflow = useCallback(async (id: string): Promise<WorkflowDefinition> => {
    try {
      return await api.getWorkflow(id)
    } catch (error) {
      logger.error(`Failed to fetch workflow ${id}:`, error)
      throw error
    }
  }, [])

  const createWorkflow = useCallback(async (workflow: WorkflowDefinition): Promise<WorkflowDefinition> => {
    try {
      return await api.createWorkflow(workflow)
    } catch (error) {
      logger.error('Failed to create workflow:', error)
      throw error
    }
  }, [])

  const updateWorkflow = useCallback(async (id: string, workflow: WorkflowDefinition): Promise<WorkflowDefinition> => {
    try {
      return await api.updateWorkflow(id, workflow)
    } catch (error) {
      logger.error(`Failed to update workflow ${id}:`, error)
      throw error
    }
  }, [])

  const deleteWorkflow = useCallback(async (id: string): Promise<void> => {
    try {
      await api.deleteWorkflow(id)
    } catch (error) {
      logger.error(`Failed to delete workflow ${id}:`, error)
      throw error
    }
  }, [])

  const executeWorkflow = useCallback(async (
    workflowId: string,
    inputs?: Record<string, any>
  ): Promise<ExecutionState> => {
    try {
      return await api.executeWorkflow(workflowId, inputs)
    } catch (error) {
      logger.error(`Failed to execute workflow ${workflowId}:`, error)
      throw error
    }
  }, [])

  const getExecution = useCallback(async (executionId: string): Promise<ExecutionState> => {
    try {
      return await api.getExecution(executionId)
    } catch (error) {
      logger.error(`Failed to fetch execution ${executionId}:`, error)
      throw error
    }
  }, [])

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

