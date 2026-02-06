/**
 * String Literal Constants
 * DRY: Centralized string values
 * Kills: StringLiteral mutations by using constants instead of inline strings
 * 
 * Using constants ensures that string mutations are caught by tests that verify
 * exact constant values.
 */

/**
 * Condition Types
 * Used in ConditionNodeEditor and condition evaluation
 */
export const CONDITION_TYPES = {
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
  CUSTOM: 'custom',
} as const

export type ConditionType = typeof CONDITION_TYPES[keyof typeof CONDITION_TYPES]

/**
 * Execution Statuses
 * Used in ExecutionStatusBadge and execution state management
 */
export const EXECUTION_STATUSES = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused',
} as const

export type ExecutionStatus = typeof EXECUTION_STATUSES[keyof typeof EXECUTION_STATUSES]

/**
 * Log Levels
 * Used in LogLevelBadge and logging utilities
 */
export const LOG_LEVELS = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
} as const

export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS]

/**
 * Node Types
 * Used throughout the application for node type identification
 */
export const NODE_TYPES = {
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
  GCP_PUBSUB: 'gcp_pubsub',
} as const

export type NodeType = typeof NODE_TYPES[keyof typeof NODE_TYPES]

/**
 * Firebase Services
 * Used in FirebaseNodeEditor
 */
export const FIREBASE_SERVICES = {
  FIRESTORE: 'firestore',
  REALTIME_DB: 'realtime_db',
  STORAGE: 'storage',
} as const

export type FirebaseService = typeof FIREBASE_SERVICES[keyof typeof FIREBASE_SERVICES]

/**
 * Input Modes
 * Used in InputNodeEditor
 */
export const INPUT_MODES = {
  READ: 'read',
  WRITE: 'write',
} as const

export type InputMode = typeof INPUT_MODES[keyof typeof INPUT_MODES]

/**
 * Helper function to check if a string is a valid condition type
 * Kills: StringLiteral mutations by verifying against constants
 */
export function isValidConditionType(value: string): value is ConditionType {
  return Object.values(CONDITION_TYPES).includes(value as ConditionType)
}

/**
 * Helper function to check if a string is a valid execution status
 * Kills: StringLiteral mutations by verifying against constants
 */
export function isValidExecutionStatus(value: string): value is ExecutionStatus {
  return Object.values(EXECUTION_STATUSES).includes(value as ExecutionStatus)
}

/**
 * Helper function to check if a string is a valid log level
 * Kills: StringLiteral mutations by verifying against constants
 */
export function isValidLogLevel(value: string): value is LogLevel {
  return Object.values(LOG_LEVELS).includes(value as LogLevel)
}
