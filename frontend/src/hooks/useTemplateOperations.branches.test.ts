/**
 * Tests for remaining branches in useTemplateOperations.ts
 * 
 * These tests target branches that are not covered by existing tests,
 * focusing on edge cases and conditional paths.
 */

import { renderHook, act } from '@testing-library/react'
import { useTemplateOperations } from './useTemplateOperations'
import { showError, showSuccess } from '../utils/notifications'
import { showConfirm } from '../utils/confirm'
import { api } from '../api/client'
import { logger } from '../utils/logger'
import { STORAGE_KEYS } from '../config/constants'

jest.mock('../utils/notifications', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}))

jest.mock('../utils/confirm', () => ({
  showConfirm: jest.fn(),
}))

jest.mock('../api/client', () => ({
  api: {
    deleteTemplate: jest.fn(),
  },
}))

jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

describe('useTemplateOperations - Remaining Branches', () => {
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
    ;(showConfirm as jest.MockedFunction<typeof showConfirm>).mockResolvedValue(true)
  })

  describe('useTemplate - response.ok branches', () => {
    it('should navigate when response.ok is true', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'workflow-123' }),
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

      // Should navigate (lines 76-79)
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('workflow=workflow-123'))
      expect(logger.debug).toHaveBeenCalledWith('Created workflow from template:', { id: 'workflow-123' })
    })

    it('should handle response.ok false branch', async () => {
      const mockResponse = {
        ok: false,
        text: jest.fn().mockResolvedValue('Error message'),
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

      // Should log error (lines 81-82)
      expect(logger.error).toHaveBeenCalledWith('Failed to use template:', 'Error message')
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('deleteSelectedAgents - official agents branches', () => {
    it('should show error and return early when all selected agents are official', async () => {
      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage,
          agents: [
            {
              id: 'agent-1',
              name: 'Official Agent',
              author_id: 'user-123',
              is_official: true,
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

      // Should show error and return early (lines 98-100)
      expect(showError).toHaveBeenCalledWith('Cannot delete 1 official agent(s). Official agents cannot be deleted.')
      expect(mockStorage.getItem).not.toHaveBeenCalled()
    })

    it('should show error but continue when some agents are official', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-2', name: 'User Agent', author_id: 'user-123', is_official: false },
      ]))

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage,
          agents: [
            {
              id: 'agent-1',
              name: 'Official Agent',
              author_id: 'user-123',
              is_official: true,
            },
            {
              id: 'agent-2',
              name: 'User Agent',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      // Should show error but continue (lines 98, 101-102)
      expect(showError).toHaveBeenCalledWith('Cannot delete 1 official agent(s). Official agents cannot be deleted.')
      expect(mockStorage.getItem).toHaveBeenCalled()
    })
  })

  describe('deleteSelectedAgents - no user owned agents branches', () => {
    it('should show error when no agents have author_id and no official agents', async () => {
      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage,
          agents: [
            {
              id: 'agent-1',
              name: 'Agent without author',
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

      // Should show error (lines 139-143)
      expect(showError).toHaveBeenCalledWith('Selected agents were published before author tracking was added. Please republish them to enable deletion.')
    })

    it('should show error when no agents have author_id and official agents exist', async () => {
      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage,
          agents: [
            {
              id: 'agent-1',
              name: 'Official Agent',
              is_official: true,
            },
            {
              id: 'agent-2',
              name: 'Agent without author',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      // Should show error (lines 140-141)
      expect(showError).toHaveBeenCalledWith('Selected agents were published before author tracking was added or are official. Please republish them to enable deletion.')
    })

    it('should show error when agents have author_id but none match user', async () => {
      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage,
          agents: [
            {
              id: 'agent-1',
              name: 'Other User Agent',
              author_id: 'other-user',
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

      // Should show error (lines 146-149)
      expect(showError).toHaveBeenCalledWith('You can only delete agents that you published. 1 selected, 1 have author info, but none match your user ID.')
    })

    it('should show error when agents have author_id but none match user and official agents exist', async () => {
      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage,
          agents: [
            {
              id: 'agent-1',
              name: 'Official Agent',
              is_official: true,
            },
            {
              id: 'agent-2',
              name: 'Other User Agent',
              author_id: 'other-user',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      // Should show error (lines 146-147)
      expect(showError).toHaveBeenCalledWith('You can only delete agents that you published (official agents cannot be deleted). 1 selected, 1 have author info, but none match your user ID.')
    })
  })

  describe('deleteSelectedAgents - confirmation cancellation branches', () => {
    it('should return early when partial delete confirmation is cancelled', async () => {
      ;(showConfirm as jest.MockedFunction<typeof showConfirm>).mockResolvedValue(false)

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage,
          agents: [
            {
              id: 'agent-1',
              name: 'User Agent 1',
              author_id: 'user-123',
              is_official: false,
            },
            {
              id: 'agent-2',
              name: 'Other User Agent',
              author_id: 'other-user',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      // Should return early (lines 156-160)
      expect(mockStorage.getItem).not.toHaveBeenCalled()
    })

    it('should return early when full delete confirmation is cancelled', async () => {
      ;(showConfirm as jest.MockedFunction<typeof showConfirm>).mockResolvedValue(false)

      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-1', name: 'User Agent', author_id: 'user-123', is_official: false },
      ]))

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage,
          agents: [
            {
              id: 'agent-1',
              name: 'User Agent',
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

      // Should return early (lines 162-166)
      expect(mockStorage.getItem).not.toHaveBeenCalled()
    })
  })

  describe('deleteSelectedAgents - storage branches', () => {
    it('should show error when storage is not available', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-1', name: 'User Agent', author_id: 'user-123', is_official: false },
      ]))

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: null,
          agents: [
            {
              id: 'agent-1',
              name: 'User Agent',
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

      // Should show error (lines 171-173)
      expect(showError).toHaveBeenCalledWith('Storage not available')
    })

    it('should successfully delete agents when storage has publishedAgents', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-1', name: 'User Agent', author_id: 'user-123', is_official: false },
        { id: 'agent-2', name: 'Other Agent', author_id: 'other-user', is_official: false },
      ]))

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage,
          agents: [
            {
              id: 'agent-1',
              name: 'User Agent',
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

      // Should successfully delete (lines 180-187)
      expect(mockStorage.setItem).toHaveBeenCalledWith('publishedAgents', expect.stringContaining('agent-2'))
      expect(mockSetAgents).toHaveBeenCalled()
      expect(mockSetSelectedAgentIds).toHaveBeenCalledWith(new Set())
      expect(showSuccess).toHaveBeenCalledWith('Successfully deleted 1 agent(s)')
    })

    it('should handle when storage.getItem returns null', async () => {
      mockStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage,
          agents: [
            {
              id: 'agent-1',
              name: 'User Agent',
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

      // Should not call setItem when publishedAgents is null (line 176)
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should handle agent with falsy id in userOwnedAgents array', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-1', name: 'User Agent', author_id: 'user-123', is_official: false },
      ]))

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage,
          agents: [
            {
              id: 'agent-1',
              name: 'User Agent',
              author_id: 'user-123',
              is_official: false,
            },
            {
              id: '', // Empty string id
              name: 'Agent with empty id',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1', '']))
      })

      // Should handle falsy id in map function (line 180: a && a.id ? a.id : null)
      // The filter(Boolean) will remove null values
      expect(mockStorage.setItem).toHaveBeenCalled()
      expect(showSuccess).toHaveBeenCalled()
    })
  })

  describe('deleteSelectedWorkflows - official templates branches', () => {
    it('should show error and return early when all selected workflows are official', async () => {
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
              name: 'Official Template',
              author_id: 'user-123',
              is_official: true,
            },
          ],
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
        await result.current.deleteSelectedWorkflows(new Set(['template-1']))
      })

      // Should show error and return early (lines 214-216)
      expect(showError).toHaveBeenCalledWith('Cannot delete 1 official workflow(s). Official workflows cannot be deleted.')
      expect(api.deleteTemplate).not.toHaveBeenCalled()
    })
  })

  describe('deleteSelectedWorkflows - no user owned templates branches', () => {
    it('should show error when no templates match user and official templates exist', async () => {
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
              name: 'Official Template',
              author_id: 'user-123',
              is_official: true,
            },
            {
              id: 'template-2',
              name: 'Other User Template',
              author_id: 'other-user',
              is_official: false,
            },
          ],
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
        await result.current.deleteSelectedWorkflows(new Set(['template-1', 'template-2']))
      })

      // Should show error (lines 224-225)
      expect(showError).toHaveBeenCalledWith('You can only delete workflows that you published (official workflows cannot be deleted)')
    })

    it('should show error when no templates match user and no official templates', async () => {
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
              name: 'Other User Template',
              author_id: 'other-user',
              is_official: false,
            },
          ],
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
        await result.current.deleteSelectedWorkflows(new Set(['template-1']))
      })

      // Should show error (lines 226-227)
      expect(showError).toHaveBeenCalledWith('You can only delete workflows that you published')
    })
  })

  describe('deleteSelectedWorkflows - confirmation cancellation branches', () => {
    it('should return early when partial delete confirmation is cancelled', async () => {
      ;(showConfirm as jest.MockedFunction<typeof showConfirm>).mockResolvedValue(false)

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
              name: 'User Template',
              author_id: 'user-123',
              is_official: false,
            },
            {
              id: 'template-2',
              name: 'Other User Template',
              author_id: 'other-user',
              is_official: false,
            },
          ],
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
        await result.current.deleteSelectedWorkflows(new Set(['template-1', 'template-2']))
      })

      // Should return early (lines 233-237)
      expect(api.deleteTemplate).not.toHaveBeenCalled()
    })

    it('should return early when full delete confirmation is cancelled', async () => {
      ;(showConfirm as jest.MockedFunction<typeof showConfirm>).mockResolvedValue(false)

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
              name: 'User Template',
              author_id: 'user-123',
              is_official: false,
            },
          ],
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
        await result.current.deleteSelectedWorkflows(new Set(['template-1']))
      })

      // Should return early (lines 239-243)
      expect(api.deleteTemplate).not.toHaveBeenCalled()
    })
  })

  describe('deleteSelectedWorkflows - successful deletion branches', () => {
    it('should successfully delete workflows and update state', async () => {
      const mockDeleteTemplate = api.deleteTemplate as jest.MockedFunction<typeof api.deleteTemplate>
      mockDeleteTemplate.mockResolvedValue(undefined)

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
              name: 'User Template',
              author_id: 'user-123',
              is_official: false,
            },
            {
              id: 'template-2',
              name: 'Other Template',
              author_id: 'other-user',
              is_official: false,
            },
          ],
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
        await result.current.deleteSelectedWorkflows(new Set(['template-1']))
      })

      // Should successfully delete (lines 250-256)
      expect(mockDeleteTemplate).toHaveBeenCalledWith('template-1')
      expect(mockSetTemplates).toHaveBeenCalled()
      expect(mockSetWorkflowsOfWorkflows).toHaveBeenCalled()
      expect(mockSetSelectedTemplateIds).toHaveBeenCalledWith(new Set())
      expect(showSuccess).toHaveBeenCalledWith('Successfully deleted 1 workflow(s)')
    })

    it('should use workflowsOfWorkflows when activeTab is workflows-of-workflows', async () => {
      const mockDeleteTemplate = api.deleteTemplate as jest.MockedFunction<typeof api.deleteTemplate>
      mockDeleteTemplate.mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage,
          agents: [],
          templates: [],
          workflowsOfWorkflows: [
            {
              id: 'template-1',
              name: 'User Workflow',
              author_id: 'user-123',
              is_official: false,
            },
          ],
          activeTab: 'workflows-of-workflows',
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

      // Should use workflowsOfWorkflows (line 206)
      expect(mockDeleteTemplate).toHaveBeenCalledWith('template-1')
      expect(mockSetWorkflowsOfWorkflows).toHaveBeenCalled()
    })
  })

  describe('deleteSelectedRepositoryAgents - storage branches', () => {
    it('should show error when storage is not available', async () => {
      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          storage: null,
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

      // Should show error (lines 266-268)
      expect(showError).toHaveBeenCalledWith('Storage not available')
    })

    it('should successfully delete repository agents and call onRefresh', async () => {
      const mockOnRefresh = jest.fn()
      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-1', name: 'Repository Agent', author_id: 'user-123', is_official: false },
        { id: 'agent-2', name: 'Other Agent', author_id: 'other-user', is_official: false },
      ]))

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
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']), mockOnRefresh)
      })

      // Should successfully delete (lines 280-289)
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.REPOSITORY_AGENTS,
        expect.stringContaining('agent-2')
      )
      expect(mockSetRepositoryAgents).toHaveBeenCalled()
      expect(mockSetSelectedRepositoryAgentIds).toHaveBeenCalledWith(new Set())
      expect(showSuccess).toHaveBeenCalledWith('Successfully deleted 1 agent(s)')
      expect(mockOnRefresh).toHaveBeenCalled()
    })

    it('should successfully delete repository agents without onRefresh', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-1', name: 'Repository Agent', author_id: 'user-123', is_official: false },
      ]))

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

      // Should successfully delete without calling onRefresh (lines 280-289, onRefresh check at 287)
      expect(mockStorage.setItem).toHaveBeenCalled()
      expect(mockSetRepositoryAgents).toHaveBeenCalled()
      expect(showSuccess).toHaveBeenCalledWith('Successfully deleted 1 agent(s)')
    })

    it('should handle when storage.getItem returns null for repository agents', async () => {
      mockStorage.getItem.mockReturnValue(null)

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

      // Should not call setItem when repositoryAgents is null (line 279)
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should return early when confirmation is cancelled for repository agents', async () => {
      ;(showConfirm as jest.MockedFunction<typeof showConfirm>).mockResolvedValue(false)

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

      // Should return early (lines 271-275)
      expect(mockStorage.getItem).not.toHaveBeenCalled()
    })
  })
})
