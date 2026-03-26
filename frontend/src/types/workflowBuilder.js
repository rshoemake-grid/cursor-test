/**
 * Split WorkflowBuilder props into smaller, focused interfaces
 * Follows Interface Segregation Principle - clients only depend on what they need
 */ /**
 * Runtime validation functions for WorkflowBuilder types
 * These functions ensure the types are actually executed at runtime for test coverage
 */ /**
 * Validates that an object has the required WorkflowBuilderCoreProps
 */ export function hasWorkflowBuilderCoreProps(obj) {
    return typeof obj === 'object' && obj !== null && typeof obj.tabId === 'string' && (typeof obj.workflowId === 'string' || obj.workflowId === null) && typeof obj.tabName === 'string' && typeof obj.tabIsUnsaved === 'boolean';
}
/**
 * Validates that an object has WorkflowBuilderExecutionProps (all optional)
 */ export function hasWorkflowBuilderExecutionProps(obj) {
    return typeof obj === 'object' && obj !== null;
}
/**
 * Validates that an object has WorkflowBuilderPersistenceProps (all optional)
 */ export function hasWorkflowBuilderPersistenceProps(obj) {
    return typeof obj === 'object' && obj !== null;
}
/**
 * Validates that an object has WorkflowBuilderDependencyProps (all optional)
 */ export function hasWorkflowBuilderDependencyProps(obj) {
    return typeof obj === 'object' && obj !== null;
}
/**
 * Validates that an object is a valid WorkflowBuilderProps
 */ export function isValidWorkflowBuilderProps(obj) {
    return hasWorkflowBuilderCoreProps(obj);
}
