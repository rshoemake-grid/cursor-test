/**
 * Input Default Values Constants
 * Centralized default values to prevent string literal mutations
 * DRY: Single source of truth for default values
 */

/**
 * Mode values
 */
export const INPUT_MODE = {
  READ: 'read',
  WRITE: 'write',
} as const

/**
 * Region defaults
 */
export const INPUT_REGION = {
  DEFAULT: 'us-east-1',
} as const

/**
 * Empty string constant
 */
export const EMPTY_STRING = '' as const

/**
 * Default overwrite value
 */
export const DEFAULT_OVERWRITE = true as const
