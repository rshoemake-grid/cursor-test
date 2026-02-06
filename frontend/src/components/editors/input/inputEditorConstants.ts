/**
 * Input Editor Constants
 * Centralized constants for input editor components
 * DRY: Single source of truth for editor-related constants
 */

/**
 * Configuration field name
 */
export const CONFIG_FIELD = 'input_config' as const

/**
 * Node type display names
 */
export const NODE_TYPE_DISPLAY_NAMES = {
  DATABASE: 'Database Configuration',
  FIREBASE: 'Firebase Configuration',
  BIGQUERY: 'BigQuery Configuration',
} as const
