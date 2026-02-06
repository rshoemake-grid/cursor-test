/**
 * Marketplace Constants Tests
 * Tests for centralized constants to ensure mutation resistance
 */

import {
  PENDING_AGENTS_STORAGE_KEY,
  PENDING_AGENTS,
  AGENT_NODE,
  DRAFT_UPDATE
} from './marketplaceConstants'

describe('marketplaceConstants', () => {
  describe('PENDING_AGENTS_STORAGE_KEY', () => {
    it('should be "pendingAgentsToAdd"', () => {
      expect(PENDING_AGENTS_STORAGE_KEY).toBe('pendingAgentsToAdd')
    })
  })

  describe('PENDING_AGENTS', () => {
    it('should have MAX_AGE as 10000', () => {
      expect(PENDING_AGENTS.MAX_AGE).toBe(10000)
    })

    it('should have MAX_CHECKS as 10', () => {
      expect(PENDING_AGENTS.MAX_CHECKS).toBe(10)
    })

    it('should have CHECK_INTERVAL as 1000', () => {
      expect(PENDING_AGENTS.CHECK_INTERVAL).toBe(1000)
    })

    it('should have readonly properties', () => {
      // as const provides type-level immutability
      expect(PENDING_AGENTS.MAX_AGE).toBe(10000)
    })
  })

  describe('AGENT_NODE', () => {
    it('should have DEFAULT_LABEL as "Agent Node"', () => {
      expect(AGENT_NODE.DEFAULT_LABEL).toBe('Agent Node')
    })

    it('should have SPACING as 150', () => {
      expect(AGENT_NODE.SPACING).toBe(150)
    })

    it('should have TYPE as "agent"', () => {
      expect(AGENT_NODE.TYPE).toBe('agent')
    })

    it('should have readonly properties', () => {
      // as const provides type-level immutability
      expect(AGENT_NODE.DEFAULT_LABEL).toBe('Agent Node')
    })
  })

  describe('DRAFT_UPDATE', () => {
    it('should have IMMEDIATE_DELAY as 0', () => {
      expect(DRAFT_UPDATE.IMMEDIATE_DELAY).toBe(0)
    })

    it('should have FLAG_RESET_DELAY as 1000', () => {
      expect(DRAFT_UPDATE.FLAG_RESET_DELAY).toBe(1000)
    })

    it('should have readonly properties', () => {
      // as const provides type-level immutability
      expect(DRAFT_UPDATE.IMMEDIATE_DELAY).toBe(0)
    })
  })
})
