/**
 * Tests for marketplace tab validation utilities
 * These tests ensure mutation-resistant tab routing logic
 */

import {
  isRepositoryTab,
  isWorkflowsOfWorkflowsTab,
  isAgentsTab,
  isWorkflowsSubTab,
  isAgentsSubTab,
  shouldLoadTemplates,
  shouldLoadRepositoryAgents,
  shouldLoadWorkflowsOfWorkflows,
  shouldLoadAgents,
  calculateLoadingState,
} from './marketplaceTabValidation'

describe('marketplaceTabValidation', () => {
  describe('isRepositoryTab', () => {
    it('should return true for repository tab', () => {
      expect(isRepositoryTab('repository')).toBe(true)
    })

    it('should return false for workflows-of-workflows tab', () => {
      expect(isRepositoryTab('workflows-of-workflows')).toBe(false)
    })

    it('should return false for agents tab', () => {
      expect(isRepositoryTab('agents')).toBe(false)
    })
  })

  describe('isWorkflowsOfWorkflowsTab', () => {
    it('should return true for workflows-of-workflows tab', () => {
      expect(isWorkflowsOfWorkflowsTab('workflows-of-workflows')).toBe(true)
    })

    it('should return false for repository tab', () => {
      expect(isWorkflowsOfWorkflowsTab('repository')).toBe(false)
    })

    it('should return false for agents tab', () => {
      expect(isWorkflowsOfWorkflowsTab('agents')).toBe(false)
    })
  })

  describe('isAgentsTab', () => {
    it('should return true for agents tab', () => {
      expect(isAgentsTab('agents')).toBe(true)
    })

    it('should return false for repository tab', () => {
      expect(isAgentsTab('repository')).toBe(false)
    })

    it('should return false for workflows-of-workflows tab', () => {
      expect(isAgentsTab('workflows-of-workflows')).toBe(false)
    })
  })

  describe('isWorkflowsSubTab', () => {
    it('should return true for workflows sub-tab', () => {
      expect(isWorkflowsSubTab('workflows')).toBe(true)
    })

    it('should return false for agents sub-tab', () => {
      expect(isWorkflowsSubTab('agents')).toBe(false)
    })
  })

  describe('isAgentsSubTab', () => {
    it('should return true for agents sub-tab', () => {
      expect(isAgentsSubTab('agents')).toBe(true)
    })

    it('should return false for workflows sub-tab', () => {
      expect(isAgentsSubTab('workflows')).toBe(false)
    })
  })

  describe('shouldLoadTemplates', () => {
    it('should return true when repository tab and workflows sub-tab', () => {
      expect(shouldLoadTemplates('repository', 'workflows')).toBe(true)
    })

    it('should return false when repository tab but agents sub-tab', () => {
      expect(shouldLoadTemplates('repository', 'agents')).toBe(false)
    })

    it('should return false when not repository tab', () => {
      expect(shouldLoadTemplates('agents', 'workflows')).toBe(false)
    })
  })

  describe('shouldLoadRepositoryAgents', () => {
    it('should return true when repository tab and agents sub-tab', () => {
      expect(shouldLoadRepositoryAgents('repository', 'agents')).toBe(true)
    })

    it('should return false when repository tab but workflows sub-tab', () => {
      expect(shouldLoadRepositoryAgents('repository', 'workflows')).toBe(false)
    })

    it('should return false when not repository tab', () => {
      expect(shouldLoadRepositoryAgents('agents', 'agents')).toBe(false)
    })
  })

  describe('shouldLoadWorkflowsOfWorkflows', () => {
    it('should return true for workflows-of-workflows tab', () => {
      expect(shouldLoadWorkflowsOfWorkflows('workflows-of-workflows')).toBe(true)
    })

    it('should return false for other tabs', () => {
      expect(shouldLoadWorkflowsOfWorkflows('repository')).toBe(false)
      expect(shouldLoadWorkflowsOfWorkflows('agents')).toBe(false)
    })
  })

  describe('shouldLoadAgents', () => {
    it('should return true for agents tab', () => {
      expect(shouldLoadAgents('agents')).toBe(true)
    })

    it('should return false for other tabs', () => {
      expect(shouldLoadAgents('repository')).toBe(false)
      expect(shouldLoadAgents('workflows-of-workflows')).toBe(false)
    })
  })

  describe('calculateLoadingState', () => {
    it('should return templates loading when repository/workflows', () => {
      expect(
        calculateLoadingState('repository', 'workflows', true, false, false, false)
      ).toBe(true)
      expect(
        calculateLoadingState('repository', 'workflows', false, false, false, false)
      ).toBe(false)
    })

    it('should return repository agents loading when repository/agents', () => {
      expect(
        calculateLoadingState('repository', 'agents', false, true, false, false)
      ).toBe(true)
      expect(
        calculateLoadingState('repository', 'agents', false, false, false, false)
      ).toBe(false)
    })

    it('should return workflows-of-workflows loading when workflows-of-workflows tab', () => {
      expect(
        calculateLoadingState('workflows-of-workflows', 'workflows', false, false, true, false)
      ).toBe(true)
      expect(
        calculateLoadingState('workflows-of-workflows', 'workflows', false, false, false, false)
      ).toBe(false)
    })

    it('should return agents loading when agents tab', () => {
      expect(
        calculateLoadingState('agents', 'workflows', false, false, false, true)
      ).toBe(true)
      expect(
        calculateLoadingState('agents', 'workflows', false, false, false, false)
      ).toBe(false)
    })

    it('should return false when no matching tab', () => {
      // This shouldn't happen in practice, but tests the fallback
      expect(
        calculateLoadingState('agents' as any, 'workflows', false, false, false, false)
      ).toBe(false)
    })
  })
})
