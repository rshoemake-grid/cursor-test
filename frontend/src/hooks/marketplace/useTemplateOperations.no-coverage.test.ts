/**
 * Tests for no-coverage paths in useTemplateOperations.ts
 * 
 * These tests target code paths that are not covered by normal tests,
 * such as catch blocks and error handling.
 */

import { renderHook, act } from '@testing-library/react'
import { useTemplateOperations } from './useTemplateOperations'
import { logger } from '../../utils/logger'
import { showError, showSuccess } from '../../utils/notifications'
import { showConfirm } from '../../utils/confirm'
import { api } from '../../api/client'

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

jest.mock('../../utils/notifications', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}))

jest.mock('../../utils/confirm', () => ({
  showConfirm: jest.fn(),
}))

jest.mock('../../api/client', () => ({
  api: {
    deleteTemplate: jest.fn(),
  },
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

describe('useTemplateOperations - No Coverage Paths', () => {
  let mockHttpClient: any
  let mockStorage: any
  let mockSetAgents: any
  let mockSetTemplates: any
  let mockSetWorkflowsOfWorkflows: any
  let mockSetRepositoryAgents: any
  let mockSetSelectedAgentIds: any
  let mockSetSelectedTemplateIds: any
  let mockSetSelectedRepositoryAgentIds: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockHttpClient = {
      post: jest.fn(),
      delete: jest.fn(),
    }
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    mockSetAgents = jest.fn()
    mockSetTemplates = jest.fn()
    mockSetWorkflowsOfWorkflows = jest.fn()
    mockSetRepositoryAgents = jest.fn()
    mockSetSelectedAgentIds = jest.fn()
    mockSetSelectedTemplateIds = jest.fn()
    mockSetSelectedRepositoryAgentIds = jest.fn()
    ;(showConfirm as jest.Mock).mockResolvedValue(true)
  })

  describe('useTemplate - catch block', () => {
    it('should handle httpClient.post throwing error', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage,
          agents: [],
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
          user: null,
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-123')
      })

      // Should handle error in catch block (line 83)
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to use template:',
        expect.any(Error)
      )
    })

    it('should handle response.json() throwing in useTemplate', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        text: jest.fn(),
      }
      mockHttpClient.post.mockResolvedValue(mockResponse)

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage,
          agents: [],
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
          user: null,
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-123')
      })

      // Should handle error in catch block (line 83)
      expect(logger.error).toHaveBeenCalled()
    })
  })

  describe('deleteSelectedAgents - catch blocks', () => {
    it('should handle storage.getItem throwing error', async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage,
          agents: [
            {
              id: 'agent-1',
              name: 'Test Agent',
              author_id: 'user-123',
              is_official: false,
            },
          ],
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
          user: { id: 'user-123', username: 'test' },
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should handle error in catch block (line 190)
      expect(showError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete agents')
      )
    })

    it('should handle JSON.parse throwing error in deleteSelectedAgents', async () => {
      mockStorage.getItem.mockReturnValue('invalid json')
      // Mock JSON.parse to throw
      const originalParse = JSON.parse
      JSON.parse = jest.fn().mockImplementation(() => {
        throw new Error('Invalid JSON')
      })

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage,
          agents: [
            {
              id: 'agent-1',
              name: 'Test Agent',
              author_id: 'user-123',
              is_official: false,
            },
          ],
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
          user: { id: 'user-123', username: 'test' },
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should handle error in catch block (line 190)
      expect(showError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete agents')
      )

      // Restore JSON.parse
      JSON.parse = originalParse
    })
  })

  describe('deleteSelectedWorkflows - catch blocks', () => {
    it('should handle api.deleteTemplate throwing error', async () => {
      const mockDeleteTemplate = api.deleteTemplate as jest.MockedFunction<typeof api.deleteTemplate>
      mockDeleteTemplate.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage,
          agents: [],
          templates: [
            {
              id: 'template-1',
              name: 'Test Template',
              description: 'Test',
              author_id: 'user-123',
              is_official: false,
            },
          ],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
          user: { id: 'user-123', username: 'test' },
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedWorkflows(new Set(['template-1']))
      })

      // Should handle error in catch block (line 257)
      expect(showError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete workflows')
      )
    })
  })

  describe('deleteSelectedRepositoryAgents - catch blocks', () => {
    it('should handle storage operations throwing error', async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage,
          agents: [],
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          user: { id: 'user-123', username: 'test' },
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']))
      })

      // Should handle error in catch block (line 291)
      expect(showError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete repository agents')
      )
    })
  })
})
