/**
 * Workflow Execution Service
 * Extracted business logic from useWorkflowExecution hook
 * Follows Single Responsibility Principle - only handles execution logic
 */

import { logger } from '../../utils/logger'
import type { WorkflowAPIClient } from '../useWorkflowAPI'

export interface ExecutionServiceOptions {
  api: WorkflowAPIClient
  logger?: typeof logger
}

export interface ExecuteWorkflowParams {
  workflowId: string
  inputs: Record<string, any>
  tempExecutionId: string
  onExecutionStart?: (executionId: string) => void
}

export interface ExecutionResult {
  executionId: string
  tempExecutionId: string
}

/**
 * Service for workflow execution logic
 * Separated from React hook for better testability and reusability
 */
export class WorkflowExecutionService {
  private api: WorkflowAPIClient
  private logger: typeof logger

  constructor({ api, logger: injectedLogger = logger }: ExecutionServiceOptions) {
    this.api = api
    this.logger = injectedLogger
  }

  /**
   * Execute a workflow
   * Single Responsibility: Only executes workflow
   */
  async executeWorkflow({
    workflowId,
    inputs,
    tempExecutionId,
    onExecutionStart,
  }: ExecuteWorkflowParams): Promise<ExecutionResult> {
    this.logger.debug('[WorkflowExecution] Executing workflow:', { workflowId, inputs })

    // Notify about temp execution ID
    if (onExecutionStart) {
      onExecutionStart(tempExecutionId)
    }

    // Execute workflow
    const execution = await this.api.executeWorkflow(workflowId, inputs)
    this.logger.debug('[WorkflowExecution] Execution response:', execution)

    // Update execution ID if different from temp
    const finalExecutionId =
      execution?.execution_id && execution.execution_id !== tempExecutionId
        ? execution.execution_id
        : tempExecutionId

    if (finalExecutionId !== tempExecutionId && onExecutionStart) {
      onExecutionStart(finalExecutionId)
    }

    return {
      executionId: finalExecutionId,
      tempExecutionId,
    }
  }

  /**
   * Create a temporary execution ID
   */
  createTempExecutionId(): string {
    return `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Parse execution inputs safely
   */
  parseExecutionInputs(inputsString: string): Record<string, any> {
    try {
      return JSON.parse(inputsString)
    } catch (error) {
      this.logger.error('[WorkflowExecution] Failed to parse inputs:', error)
      throw new Error('Invalid JSON in execution inputs')
    }
  }
}
