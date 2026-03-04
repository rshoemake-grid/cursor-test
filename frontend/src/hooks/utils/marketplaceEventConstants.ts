/**
 * Marketplace Event Constants
 * Centralized event names to prevent string literal mutations
 * DRY: Single source of truth for event names
 */

/**
 * Event name for adding agents to workflow
 */
export const MARKETPLACE_EVENTS = {
  ADD_AGENTS_TO_WORKFLOW: 'addAgentsToWorkflow',
  ADD_TOOLS_TO_WORKFLOW: 'addToolsToWorkflow',
} as const
