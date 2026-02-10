/**
 * Pending Agents Polling Service
 * Extracted polling logic to improve mutation resistance and DRY compliance
 * Single Responsibility: Only handles pending agents polling
 */

import { PENDING_AGENTS } from './marketplaceConstants'

/**
 * Create polling interval for pending agents
 * Mutation-resistant: uses constants for intervals and max checks
 */
export function createPendingAgentsPolling(
  checkPendingAgents: () => void,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _logger: { debug: (message: string, ...args: any[]) => void }
): { interval: ReturnType<typeof setInterval>, cleanup: () => void } {
  let checkCount = 0
  const maxChecks = PENDING_AGENTS.MAX_CHECKS
  
  const interval = setInterval(() => {
    checkPendingAgents()
    checkCount++
    // Explicit comparison to prevent mutation survivors
    if (checkCount >= maxChecks) {
      clearInterval(interval)
    }
  }, PENDING_AGENTS.CHECK_INTERVAL)

  const cleanup = () => {
    clearInterval(interval)
  }

  return { interval, cleanup }
}
