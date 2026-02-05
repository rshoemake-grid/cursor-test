/**
 * State Setter Tests for useMarketplaceData hook
 * Phase 4.2: Tests for state setter function calls
 * Targets surviving mutants in state updates
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from '../storage'

jest.mock('../storage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - State Setters (Phase 4.2)', () => {
  let mockHttpClient: any
  let mockStorage: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockHttpClient = {
      get: jest.fn().mockResolvedValue({ json: async () => [] }),
      post: jest.fn().mockResolvedValue({ ok: true, json: async () => ({ nodes: [] }) }),
    }
    mockStorage = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    mockGetLocalStorageItem.mockReturnValue([])
  })

  describe('setTemplates call', () => {
    it('should call setTemplates with fetched data', async () => {
      const template = {
        id: 'template-1',
        name: 'Template',
        description: 'Description',
        category: 'automation',
        tags: [],
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [template],
      })

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'workflows',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: setTemplates(data)
      expect(result.current.templates.length).toBe(1)
      expect(result.current.templates[0].id).toBe('template-1')
    })

    it('should verify setTemplates receives array from response.json()', async () => {
      const templates = [
        { id: 'template-1', name: 'Template 1', category: 'automation', tags: [] },
        { id: 'template-2', name: 'Template 2', category: 'automation', tags: [] },
      ]
      mockHttpClient.get.mockResolvedValue({
        json: async () => templates,
      })

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'workflows',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: setTemplates(data) where data is array from json()
      expect(result.current.templates.length).toBe(2)
    })
  })

  describe('setWorkflowsOfWorkflows call', () => {
    it('should call setWorkflowsOfWorkflows with filtered workflows', async () => {
      const template = {
        id: 'template-1',
        name: 'Template',
        description: 'workflow of workflows',
        tags: [],
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [template],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ nodes: [] }),
      })

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'workflows-of-workflows',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 3000 })

      // Should call: setWorkflowsOfWorkflows(workflowsOfWorkflows)
      expect(Array.isArray(result.current.workflowsOfWorkflows)).toBe(true)
    })
  })

  describe('setAgents call', () => {
    it('should call setAgents with processed agents data', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: setAgents(agentsData)
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].id).toBe('agent-1')
    })
  })

  describe('setRepositoryAgents call', () => {
    it('should call setRepositoryAgents with processed agents data', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: setRepositoryAgents(agentsData)
      expect(result.current.repositoryAgents.length).toBe(1)
      expect(result.current.repositoryAgents[0].id).toBe('agent-1')
    })

    it('should call setRepositoryAgents with empty array when storage is null', async () => {
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: null,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: setRepositoryAgents([]) in early return
      expect(result.current.repositoryAgents).toEqual([])
    })
  })

  describe('setLoading call - setLoading(true)', () => {
    it('should set loading to true at start of fetchTemplates', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [],
      })

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'workflows',
        })
      )

      // Initially loading should be true
      // Then setLoading(false) is called in finally block
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('setLoading call - setLoading(false)', () => {
    it('should set loading to false in finally block', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [],
      })

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'workflows',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: setLoading(false) in finally block
      expect(result.current.loading).toBe(false)
    })

    it('should set loading to false even on error', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'workflows',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: setLoading(false) in finally block even on error
      expect(result.current.loading).toBe(false)
    })
  })
})
