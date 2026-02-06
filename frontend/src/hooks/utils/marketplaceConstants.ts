/**
 * Marketplace Constants
 * Centralized constants for marketplace operations to prevent string literal mutations
 * DRY: Single source of truth for magic values
 */

/**
 * Pending agents storage key
 */
export const PENDING_AGENTS_STORAGE_KEY = 'pendingAgentsToAdd' as const

/**
 * Pending agents validation constants
 */
export const PENDING_AGENTS = {
  MAX_AGE: 10000, // 10 seconds
  MAX_CHECKS: 10,
  CHECK_INTERVAL: 1000, // 1 second
} as const

/**
 * Agent node constants
 */
export const AGENT_NODE = {
  DEFAULT_LABEL: 'Agent Node',
  SPACING: 150,
  TYPE: 'agent',
} as const

/**
 * Draft update delay constants
 */
export const DRAFT_UPDATE = {
  IMMEDIATE_DELAY: 0,
  FLAG_RESET_DELAY: 1000, // 1 second
} as const
