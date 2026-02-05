/**
 * Workflow Execution Validation Utilities
 * Extracted from useWorkflowExecution for better testability and mutation resistance
 * Single Responsibility: Only validates execution conditions
 */

/**
 * Check if user is authenticated
 * Mutation-resistant: explicit boolean check
 */
export function isUserAuthenticated(isAuthenticated: boolean): boolean {
  return isAuthenticated === true
}

/**
 * Check if workflow ID exists
 * Mutation-resistant: explicit falsy check
 */
export function hasWorkflowId(workflowId: string | null | undefined): boolean {
  return workflowId != null && workflowId !== ''
}

/**
 * Check if confirmation was given
 * Mutation-resistant: explicit truthy check
 */
export function isConfirmed(confirmed: boolean | null | undefined): boolean {
  return confirmed === true
}

/**
 * Check if workflow was saved successfully
 * Mutation-resistant: explicit truthy check
 */
export function isWorkflowSaved(savedId: string | null | undefined): boolean {
  return savedId != null && savedId !== ''
}

/**
 * Check if workflow ID is available for execution
 * Mutation-resistant: explicit falsy check
 */
export function canExecuteWorkflow(workflowId: string | null | undefined): boolean {
  return workflowId != null && workflowId !== ''
}
