/**
 * Array Method Tests for useMarketplaceData hook
 * Phase 4.2: Tests for array method operations
 * Targets surviving mutants in array method calls
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from '../storage'

jest.mock('../storage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - Array Methods (Phase 4.2)', () => {
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

  describe('Array method - some()', () => {
    it('should call tags.some() with tag.toLowerCase().includes() callback', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          description: 'Description',
          category: 'automation',
          tags: ['test-tag'],
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
          searchQuery: 'test', // Should call tags.some(tag => tag.toLowerCase().includes('test'))
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: a.tags.some(tag => tag.toLowerCase().includes(query))
      expect(result.current.agents.length).toBe(1)
    })

    it('should call tags.some() with workflow tag check', async () => {
      const workflow = {
        id: 'workflow-1',
        name: 'Workflow',
        description: 'Description',
        tags: ['workflow'],
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              data: {},
            },
          ],
        }),
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

      // Should call: workflow.tags.some(tag => tag.toLowerCase().includes('workflow'))
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })

    it('should call tags.some() with workflow-of-workflows tag check', async () => {
      const workflow = {
        id: 'workflow-1',
        name: 'Workflow',
        description: 'Description',
        tags: ['workflow-of-workflows'],
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow],
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

      // Should call: workflow.tags.some(tag => tag.toLowerCase().includes('workflow-of-workflows'))
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })

    it('should call tags.some() with composite tag check', async () => {
      const workflow = {
        id: 'workflow-1',
        name: 'Workflow',
        description: 'Description',
        tags: ['composite'],
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow],
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

      // Should call: workflow.tags.some(tag => tag.toLowerCase().includes('composite'))
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })

    it('should call tags.some() with nested tag check', async () => {
      const workflow = {
        id: 'workflow-1',
        name: 'Workflow',
        description: 'Description',
        tags: ['nested'],
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow],
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

      // Should call: workflow.tags.some(tag => tag.toLowerCase().includes('nested'))
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })

    it('should call nodes.some() with workflow detection callback', async () => {
      const workflow = {
        id: 'workflow-1',
        name: 'Workflow',
        description: 'Description',
        tags: [],
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              workflow_id: 'workflow-2',
            },
          ],
        }),
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

      // Should call: workflowDetail.nodes.some((node: any) => { ... })
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })
  })

  describe('Array method - filter()', () => {
    it('should call filter() with category comparison callback', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
        {
          id: 'agent-2',
          name: 'Other Agent',
          category: 'other',
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
          category: 'automation', // Should call filter(a => a.category === 'automation')
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

      // Should call: agentsData.filter(a => a.category === category)
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].category).toBe('automation')
    })

    it('should call filter() with search query callback', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Test Agent',
          description: 'Description',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
        {
          id: 'agent-2',
          name: 'Other Agent',
          description: 'Description',
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
          searchQuery: 'Test', // Should call filter with search callback
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: agentsData.filter(a => a.name.toLowerCase().includes(query) || ...)
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].name).toBe('Test Agent')
    })
  })

  describe('Array method - map()', () => {
    it('should call map() on agentsData with author update callback', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          author_id: null,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: { id: 'user-1', username: 'testuser' },
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
      })

      // Should call: agentsData.map(agent => { ... })
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0].author_id).toBe('user-1')
    })

    it('should call map() on agentsData for logging', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          author_id: 'user-1',
          author_name: 'testuser',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const loggerSpy = jest.spyOn(require('../../utils/logger').logger, 'debug')

      renderHook(() =>
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
        expect(loggerSpy).toHaveBeenCalled()
      })

      // Should call: agentsData.map(a => ({ id: a.id, name: a.name, author_id: a.author_id, author_name: a.author_name }))
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Marketplace] Loaded agents:'),
        expect.any(Array)
      )

      loggerSpy.mockRestore()
    })
  })

  describe('Array method - sort()', () => {
    it('should call sort() with comparison callback', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
        {
          id: 'agent-2',
          name: 'Agent 2',
          category: 'automation',
          tags: [],
          published_at: '2024-01-02T00:00:00Z',
          is_official: true,
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
          sortBy: 'popular', // Should call sort with comparison callback
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: agentsData.sort((a, b) => { ... })
      // Official agent should be first
      expect(result.current.agents[0].is_official).toBe(true)
    })
  })
})
