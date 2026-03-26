/**
 * Runtime type validation functions for workflow types
 * These functions ensure the types are actually executed at runtime for test coverage
 */ const VALID_NODE_TYPES = [
    'agent',
    'condition',
    'loop',
    'start',
    'end'
];
const VALID_EXECUTION_STATUSES = [
    'pending',
    'running',
    'completed',
    'failed',
    'paused'
];
const VALID_CONDITION_TYPES = [
    'equals',
    'contains',
    'greater_than',
    'less_than',
    'custom'
];
const VALID_LOOP_TYPES = [
    'for_each',
    'while',
    'until'
];
const VALID_EDGE_CONDITIONS = [
    'true',
    'false',
    'default'
];
/**
 * Type guard to validate NodeType
 */ export function isValidNodeType(value) {
    return VALID_NODE_TYPES.includes(value);
}
/**
 * Type guard to validate ExecutionStatus
 */ export function isValidExecutionStatus(value) {
    return VALID_EXECUTION_STATUSES.includes(value);
}
/**
 * Type guard to validate ConditionConfig condition_type
 */ export function isValidConditionType(value) {
    return VALID_CONDITION_TYPES.includes(value);
}
/**
 * Type guard to validate LoopConfig loop_type
 */ export function isValidLoopType(value) {
    return VALID_LOOP_TYPES.includes(value);
}
/**
 * Type guard to validate WorkflowEdge condition
 */ export function isValidEdgeCondition(value) {
    return VALID_EDGE_CONDITIONS.includes(value);
}
