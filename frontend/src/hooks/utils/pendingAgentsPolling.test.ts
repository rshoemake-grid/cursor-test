/**
 * Pending Agents Polling Tests
 * Tests for pending agents polling service to ensure mutation resistance
 */

import { createPendingAgentsPolling } from './pendingAgentsPolling'
import { PENDING_AGENTS } from './marketplaceConstants'

describe('pendingAgentsPolling', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('createPendingAgentsPolling', () => {
    it('should call checkPendingAgents at intervals', () => {
      const checkPendingAgents = jest.fn()
      const logger = { debug: jest.fn() }

      const { cleanup } = createPendingAgentsPolling(checkPendingAgents, logger)

      // Should not call immediately
      expect(checkPendingAgents).not.toHaveBeenCalled()

      // Fast-forward first interval
      jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL)
      expect(checkPendingAgents).toHaveBeenCalledTimes(1)

      // Fast-forward second interval
      jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL)
      expect(checkPendingAgents).toHaveBeenCalledTimes(2)

      cleanup()
    })

    it('should stop polling after max checks', () => {
      const checkPendingAgents = jest.fn()
      const logger = { debug: jest.fn() }

      createPendingAgentsPolling(checkPendingAgents, logger)

      // Fast-forward through all checks
      for (let i = 0; i < PENDING_AGENTS.MAX_CHECKS; i++) {
        jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL)
      }

      expect(checkPendingAgents).toHaveBeenCalledTimes(PENDING_AGENTS.MAX_CHECKS)

      // Fast-forward one more interval - should not call again
      jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL)
      expect(checkPendingAgents).toHaveBeenCalledTimes(PENDING_AGENTS.MAX_CHECKS)
    })

    it('should stop polling when cleanup is called', () => {
      const checkPendingAgents = jest.fn()
      const logger = { debug: jest.fn() }

      const { cleanup } = createPendingAgentsPolling(checkPendingAgents, logger)

      // Fast-forward first interval
      jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL)
      expect(checkPendingAgents).toHaveBeenCalledTimes(1)

      // Cleanup
      cleanup()

      // Fast-forward more intervals - should not call again
      jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL * 5)
      expect(checkPendingAgents).toHaveBeenCalledTimes(1)
    })

    it('should return interval and cleanup function', () => {
      const checkPendingAgents = jest.fn()
      const logger = { debug: jest.fn() }

      const result = createPendingAgentsPolling(checkPendingAgents, logger)

      expect(result).toHaveProperty('interval')
      expect(result).toHaveProperty('cleanup')
      expect(typeof result.cleanup).toBe('function')
    })

    it('should use correct interval from constants', () => {
      const checkPendingAgents = jest.fn()
      const logger = { debug: jest.fn() }

      createPendingAgentsPolling(checkPendingAgents, logger)

      // Fast-forward exactly CHECK_INTERVAL
      jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL)
      expect(checkPendingAgents).toHaveBeenCalledTimes(1)

      // Fast-forward less than CHECK_INTERVAL - should not call again
      jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL - 1)
      expect(checkPendingAgents).toHaveBeenCalledTimes(1)

      // Fast-forward to complete the interval
      jest.advanceTimersByTime(1)
      expect(checkPendingAgents).toHaveBeenCalledTimes(2)
    })

    it('should use correct max checks from constants', () => {
      const checkPendingAgents = jest.fn()
      const logger = { debug: jest.fn() }

      createPendingAgentsPolling(checkPendingAgents, logger)

      // Fast-forward through exactly MAX_CHECKS
      for (let i = 0; i < PENDING_AGENTS.MAX_CHECKS; i++) {
        jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL)
      }

      expect(checkPendingAgents).toHaveBeenCalledTimes(PENDING_AGENTS.MAX_CHECKS)

      // One more should not trigger
      jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL)
      expect(checkPendingAgents).toHaveBeenCalledTimes(PENDING_AGENTS.MAX_CHECKS)
    })
  })
})
