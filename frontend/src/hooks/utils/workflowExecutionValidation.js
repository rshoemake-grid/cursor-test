/**
 * Workflow Execution Validation Utilities
 * Extracted from useWorkflowExecution for better testability and mutation resistance
 * Single Responsibility: Only validates execution conditions
 */ /**
 * Check if user is authenticated
 * Mutation-resistant: explicit boolean check
 */ export function isUserAuthenticated(isAuthenticated) {
    return isAuthenticated === true;
}
/**
 * Check if workflow ID exists
 * Mutation-resistant: explicit falsy check
 */ export function hasWorkflowId(workflowId) {
    return workflowId != null && workflowId !== '';
}
/**
 * Check if confirmation was given
 * Mutation-resistant: explicit truthy check
 */ export function isConfirmed(confirmed) {
    return confirmed === true;
}
/**
 * Check if workflow was saved successfully
 * Mutation-resistant: explicit truthy check
 */ export function isWorkflowSaved(savedId) {
    return savedId != null && savedId !== '';
}
/**
 * Check if workflow ID is available for execution
 * Mutation-resistant: explicit falsy check
 */ export function canExecuteWorkflow(workflowId) {
    return workflowId != null && workflowId !== '';
}
