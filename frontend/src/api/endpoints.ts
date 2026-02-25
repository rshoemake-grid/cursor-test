/**
 * API Endpoints Configuration
 * Centralized endpoint definitions to eliminate DRY violations
 * Single Responsibility: Only defines API endpoint URLs
 * DRY: Single source of truth for endpoint paths
 */

/**
 * Workflow endpoints
 */
export const workflowEndpoints = {
  list: () => '/workflows',
  detail: (id: string) => `/workflows/${id}`,
  execute: (id: string) => `/workflows/${id}/execute`,
  publish: (id: string) => `/workflows/${id}/publish`,
  bulkDelete: () => '/workflows/bulk-delete',
} as const

/**
 * Execution endpoints
 */
export const executionEndpoints = {
  list: () => '/executions',
  detail: (id: string) => `/executions/${id}`,
} as const

/**
 * Template endpoints
 */
export const templateEndpoints = {
  delete: (id: string) => `/templates/${id}`,
} as const

/**
 * Marketplace endpoints
 */
export const marketplaceEndpoints = {
  agents: () => '/marketplace/agents',
} as const

/**
 * Settings endpoints
 */
export const settingsEndpoints = {
  llm: () => '/settings/llm',
} as const
