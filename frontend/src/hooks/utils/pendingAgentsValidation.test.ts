/**
 * Pending Agents Validation Tests
 * Tests for pending agents validation utilities to ensure mutation resistance
 */

import {
  isValidPendingAgents,
  isPendingAgentsValid,
  isPendingAgentsForDifferentTab,
  isPendingAgentsTooOld,
  type PendingAgents
} from './pendingAgentsValidation'

describe('pendingAgentsValidation', () => {
  describe('isValidPendingAgents', () => {
    it('should return false for null', () => {
      expect(isValidPendingAgents(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isValidPendingAgents(undefined)).toBe(false)
    })

    it('should return false for object without tabId', () => {
      expect(isValidPendingAgents({ timestamp: Date.now(), agents: [] })).toBe(false)
    })

    it('should return false for object with empty tabId', () => {
      expect(isValidPendingAgents({ tabId: '', timestamp: Date.now(), agents: [] })).toBe(false)
    })

    it('should return false for object without timestamp', () => {
      expect(isValidPendingAgents({ tabId: 'tab-1', agents: [] })).toBe(false)
    })

    it('should return false for object with negative timestamp', () => {
      expect(isValidPendingAgents({ tabId: 'tab-1', timestamp: -1, agents: [] })).toBe(false)
    })

    it('should return false for object without agents array', () => {
      expect(isValidPendingAgents({ tabId: 'tab-1', timestamp: Date.now() })).toBe(false)
    })

    it('should return false for object with non-array agents', () => {
      expect(isValidPendingAgents({ tabId: 'tab-1', timestamp: Date.now(), agents: 'not-array' })).toBe(false)
    })

    it('should return true for valid pending agents', () => {
      const pending: PendingAgents = {
        tabId: 'tab-1',
        timestamp: Date.now(),
        agents: [{ name: 'Agent 1' }]
      }
      expect(isValidPendingAgents(pending)).toBe(true)
    })
  })

  describe('isPendingAgentsValid', () => {
    it('should return false for null', () => {
      expect(isPendingAgentsValid(null, 'tab-1')).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isPendingAgentsValid(undefined as any, 'tab-1')).toBe(false)
    })

    it('should return false when tabId does not match', () => {
      const pending: PendingAgents = {
        tabId: 'tab-1',
        timestamp: Date.now(),
        agents: []
      }
      expect(isPendingAgentsValid(pending, 'tab-2')).toBe(false)
    })

    it('should return false when age is negative', () => {
      const pending: PendingAgents = {
        tabId: 'tab-1',
        timestamp: Date.now() + 1000, // Future timestamp
        agents: []
      }
      expect(isPendingAgentsValid(pending, 'tab-1')).toBe(false)
    })

    it('should return false when age exceeds maxAge', () => {
      const pending: PendingAgents = {
        tabId: 'tab-1',
        timestamp: Date.now() - 20000, // 20 seconds ago
        agents: []
      }
      expect(isPendingAgentsValid(pending, 'tab-1', 10000)).toBe(false)
    })

    it('should return true when valid and within time window', () => {
      const pending: PendingAgents = {
        tabId: 'tab-1',
        timestamp: Date.now() - 5000, // 5 seconds ago
        agents: []
      }
      expect(isPendingAgentsValid(pending, 'tab-1', 10000)).toBe(true)
    })

    it('should verify exact boundary - age === maxAge - 1', () => {
      const pending: PendingAgents = {
        tabId: 'tab-1',
        timestamp: Date.now() - 9999, // Just under maxAge
        agents: []
      }
      expect(isPendingAgentsValid(pending, 'tab-1', 10000)).toBe(true)
    })

    it('should verify exact boundary - age === maxAge', () => {
      const pending: PendingAgents = {
        tabId: 'tab-1',
        timestamp: Date.now() - 10000, // Exactly maxAge
        agents: []
      }
      expect(isPendingAgentsValid(pending, 'tab-1', 10000)).toBe(false)
    })
  })

  describe('isPendingAgentsForDifferentTab', () => {
    it('should return false for null', () => {
      expect(isPendingAgentsForDifferentTab(null, 'tab-1')).toBe(false)
    })

    it('should return false when tabId matches', () => {
      const pending: PendingAgents = {
        tabId: 'tab-1',
        timestamp: Date.now(),
        agents: []
      }
      expect(isPendingAgentsForDifferentTab(pending, 'tab-1')).toBe(false)
    })

    it('should return true when tabId does not match', () => {
      const pending: PendingAgents = {
        tabId: 'tab-1',
        timestamp: Date.now(),
        agents: []
      }
      expect(isPendingAgentsForDifferentTab(pending, 'tab-2')).toBe(true)
    })
  })

  describe('isPendingAgentsTooOld', () => {
    it('should return false for null', () => {
      expect(isPendingAgentsTooOld(null)).toBe(false)
    })

    it('should return true when age is negative (invalid timestamp)', () => {
      const pending: PendingAgents = {
        tabId: 'tab-1',
        timestamp: Date.now() + 1000, // Future timestamp
        agents: []
      }
      expect(isPendingAgentsTooOld(pending, 10000)).toBe(true)
    })

    it('should return false when age is less than maxAge', () => {
      const pending: PendingAgents = {
        tabId: 'tab-1',
        timestamp: Date.now() - 5000, // 5 seconds ago
        agents: []
      }
      expect(isPendingAgentsTooOld(pending, 10000)).toBe(false)
    })

    it('should return true when age equals maxAge', () => {
      const pending: PendingAgents = {
        tabId: 'tab-1',
        timestamp: Date.now() - 10000, // Exactly maxAge
        agents: []
      }
      expect(isPendingAgentsTooOld(pending, 10000)).toBe(true)
    })

    it('should return true when age exceeds maxAge', () => {
      const pending: PendingAgents = {
        tabId: 'tab-1',
        timestamp: Date.now() - 20000, // 20 seconds ago
        agents: []
      }
      expect(isPendingAgentsTooOld(pending, 10000)).toBe(true)
    })

    it('should verify exact boundary - age === maxAge - 1', () => {
      const pending: PendingAgents = {
        tabId: 'tab-1',
        timestamp: Date.now() - 9999, // Just under maxAge
        agents: []
      }
      expect(isPendingAgentsTooOld(pending, 10000)).toBe(false)
    })
  })
})
