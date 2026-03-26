/**
 * String Literal Constants
 * DRY: Centralized string values
 * Kills: StringLiteral mutations by using constants instead of inline strings
 * 
 * Using constants ensures that string mutations are caught by tests that verify
 * exact constant values.
 */ /**
 * Condition Types
 * Used in ConditionNodeEditor and condition evaluation
 */ export const CONDITION_TYPES = {
    EQUALS: 'equals',
    NOT_EQUALS: 'not_equals',
    CONTAINS: 'contains',
    NOT_CONTAINS: 'not_contains',
    GREATER_THAN: 'greater_than',
    NOT_GREATER_THAN: 'not_greater_than',
    LESS_THAN: 'less_than',
    NOT_LESS_THAN: 'not_less_than',
    EMPTY: 'empty',
    NOT_EMPTY: 'not_empty',
    CUSTOM: 'custom'
};
/**
 * Execution Statuses
 * Used in ExecutionStatusBadge and execution state management
 */ export const EXECUTION_STATUSES = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    PAUSED: 'paused'
};
/**
 * Log Levels
 * Used in LogLevelBadge and logging utilities
 */ export const LOG_LEVELS = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG'
};
/**
 * Node Types
 * Used throughout the application for node type identification
 */ export const NODE_TYPES = {
    START: 'start',
    END: 'end',
    AGENT: 'agent',
    CONDITION: 'condition',
    LOOP: 'loop',
    INPUT: 'input',
    DATABASE: 'database',
    FIREBASE: 'firebase',
    BIGQUERY: 'bigquery',
    LOCAL_FILESYSTEM: 'local_filesystem',
    AWS_S3: 'aws_s3',
    GCP_BUCKET: 'gcp_bucket',
    GCP_PUBSUB: 'gcp_pubsub'
};
/**
 * Firebase Services
 * Used in FirebaseNodeEditor
 */ export const FIREBASE_SERVICES = {
    FIRESTORE: 'firestore',
    REALTIME_DB: 'realtime_db',
    STORAGE: 'storage'
};
/**
 * Input Modes
 * Used in InputNodeEditor
 */ export const INPUT_MODES = {
    READ: 'read',
    WRITE: 'write'
};
/**
 * Helper function to check if a string is a valid condition type
 * Kills: StringLiteral mutations by verifying against constants
 */ export function isValidConditionType(value) {
    return Object.values(CONDITION_TYPES).includes(value);
}
/**
 * Helper function to check if a string is a valid execution status
 * Kills: StringLiteral mutations by verifying against constants
 */ export function isValidExecutionStatus(value) {
    return Object.values(EXECUTION_STATUSES).includes(value);
}
/**
 * Helper function to check if a string is a valid log level
 * Kills: StringLiteral mutations by verifying against constants
 */ export function isValidLogLevel(value) {
    return Object.values(LOG_LEVELS).includes(value);
}
