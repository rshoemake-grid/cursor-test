/**
 * Pending Agents Validation Utilities
 * Extracted validation logic to improve mutation resistance and DRY compliance
 * Single Responsibility: Only handles pending agents validation
 */

import { PENDING_AGENTS } from './marketplaceConstants'

/**
 * Pending agents data structure
 */
export interface PendingAgents {
  tabId: string
  timestamp: number
  agents: any[]
}

/**
 * Validate pending agents data
 * Mutation-resistant: explicit null/undefined checks
 */
export function isValidPendingAgents(
  pending: any
): pending is PendingAgents {
  if (pending === null || pending === undefined) {
    return false
  }

  if (typeof pending.tabId !== 'string' || pending.tabId === '') {
    return false
  }

  if (typeof pending.timestamp !== 'number' || pending.timestamp < 0) {
    return false
  }

  if (!Array.isArray(pending.agents)) {
    return false
  }

  return true
}

/**
 * Check if pending agents are valid for current tab and time window
 * Mutation-resistant: explicit comparisons
 */
export function isPendingAgentsValid(
  pending: PendingAgents | null,
  currentTabId: string,
  maxAge: number = PENDING_AGENTS.MAX_AGE
): boolean {
  if (pending === null || pending === undefined) {
    return false
  }

  // Explicit comparison to prevent mutation survivors
  if (pending.tabId !== currentTabId) {
    return false
  }

  const age = Date.now() - pending.timestamp
  
  // Explicit boundary checks to prevent mutation survivors
  if (age < 0) {
    return false
  }

  if (age >= maxAge) {
    return false
  }

  return true
}

/**
 * Check if pending agents are for different tab
 * Mutation-resistant: explicit comparison
 */
export function isPendingAgentsForDifferentTab(
  pending: PendingAgents | null,
  currentTabId: string
): boolean {
  if (pending === null || pending === undefined) {
    return false
  }

  // Explicit comparison to prevent mutation survivors
  return pending.tabId !== currentTabId
}

/**
 * Check if pending agents are too old
 * Mutation-resistant: explicit boundary check
 */
export function isPendingAgentsTooOld(
  pending: PendingAgents | null,
  maxAge: number = PENDING_AGENTS.MAX_AGE
): boolean {
  if (pending === null || pending === undefined) {
    return false
  }

  const age = Date.now() - pending.timestamp
  
  // Explicit boundary check to prevent mutation survivors
  if (age < 0) {
    return true // Invalid timestamp
  }

  return age >= maxAge
}
