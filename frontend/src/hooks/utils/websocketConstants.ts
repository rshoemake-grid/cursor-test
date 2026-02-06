/**
 * WebSocket Constants
 * Centralized constants for WebSocket operations to prevent string literal mutations
 * DRY: Single source of truth for magic values
 */

/**
 * WebSocket close codes
 */
export const WS_CLOSE_CODES = {
  NORMAL_CLOSURE: 1000,
  GOING_AWAY: 1001,
  ABNORMAL_CLOSURE: 1006,
} as const

/**
 * WebSocket status strings
 */
export const WS_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
} as const

/**
 * Execution status constants
 * Used for status comparisons to prevent string literal mutations
 */
export const EXECUTION_STATUS = {
  COMPLETED: 'completed',
  FAILED: 'failed',
  RUNNING: 'running',
  PENDING: 'pending',
  PAUSED: 'paused',
} as const

/**
 * WebSocket reconnection constants
 */
export const WS_RECONNECT = {
  BASE_DELAY: 1000,
  MAX_DELAY: 60000,
  MIN_DELAY: 1,
  DEFAULT_MAX_DELAY: 10000,
  DEFAULT_SAFE_DELAY: 1000,
} as const

/**
 * WebSocket close reasons
 */
export const WS_CLOSE_REASONS = {
  EXECUTION_COMPLETED: 'Execution completed',
  NO_REASON_PROVIDED: 'No reason provided',
} as const
