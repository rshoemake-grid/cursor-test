/**
 * No Coverage Mutants Tests for useMarketplaceData hook
 * Phase 4: Targeted tests for remaining 5 no-coverage mutants
 * Focuses on specific code paths that may not be covered
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from './useLocalStorage'
import { STORAGE_KEYS } from '../config/constants'

jest.mock('./useLocalStorage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - No Coverage Mutants (Phase 4)', () => {
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

  describe('Array initialization - workflowsOfWorkflows: Template[] = []', () => {
    it('should initialize empty workflowsOfWorkflows array', async () => {
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
          activeTab: 'workflows-of-workflows',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 3000 })

      // Should initialize as empty array: const workflowsOfWorkflows: Template[] = []
      expect(Array.isArray(result.current.workflowsOfWorkflows)).toBe(true)
      expect(result.current.workflowsOfWorkflows.length).toBe(0)
    })

    it('should verify empty array initialization is executed', async () => {
      const template = {
        id: 'template-1',
        name: 'Template',
        description: 'Description',
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

      // Empty array initialization should execute before push operations
      expect(Array.isArray(result.current.workflowsOfWorkflows)).toBe(true)
    })
  })

  describe('Array push operation - workflowsOfWorkflows.push(workflow)', () => {
    it('should execute push operation when workflow matches criteria', async () => {
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

      // Should execute push: workflowsOfWorkflows.push(workflow)
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })

    it('should verify push operation adds workflow to array', async () => {
      const template = {
        id: 'template-1',
        name: 'Template',
        description: 'composite workflow',
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

      // Push operation should add workflow
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
      expect(result.current.workflowsOfWorkflows[0].id).toBe('template-1')
    })
  })

  describe('Early return - fetchRepositoryAgents when !storage', () => {
    it('should execute early return when storage is null', async () => {
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: null, // No storage
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

      // Should execute early return: if (!storage) { setRepositoryAgents([]); setLoading(false); return }
      expect(result.current.repositoryAgents).toEqual([])
      expect(result.current.loading).toBe(false)
      // Should not call storage.getItem
      expect(mockStorage.getItem).not.toHaveBeenCalled()
    })

    it('should verify early return sets repositoryAgents to empty array', async () => {
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

      // Early return should set: setRepositoryAgents([])
      expect(Array.isArray(result.current.repositoryAgents)).toBe(true)
      expect(result.current.repositoryAgents.length).toBe(0)
    })

    it('should verify early return sets loading to false', async () => {
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

      // Early return should set: setLoading(false)
      expect(result.current.loading).toBe(false)
    })
  })

  describe('Map operation for logging - agentsData.map(a => ({...}))', () => {
    it('should execute map operation in logger.debug call', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          author_id: 'user-1',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { logger } = require('../utils/logger')
      const debugSpy = jest.spyOn(logger, 'debug')

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
        expect(debugSpy).toHaveBeenCalled()
      })

      // Should execute map: agentsData.map(a => ({ id, name, author_id, has_author_id }))
      const mapCall = debugSpy.mock.calls.find(call => 
        call[0] === '[Marketplace] Loaded agents:'
      )
      expect(mapCall).toBeDefined()
      if (mapCall && Array.isArray(mapCall[1])) {
        expect(mapCall[1].length).toBe(1)
        expect(mapCall[1][0]).toHaveProperty('id')
        expect(mapCall[1][0]).toHaveProperty('name')
        expect(mapCall[1][0]).toHaveProperty('author_id')
        expect(mapCall[1][0]).toHaveProperty('has_author_id')
      }

      debugSpy.mockRestore()
    })

    it('should verify map callback creates object with specific properties', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Test Agent',
          author_id: null,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { logger } = require('../utils/logger')
      const debugSpy = jest.spyOn(logger, 'debug')

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
        expect(debugSpy).toHaveBeenCalled()
      })

      // Map callback should create: { id, name, author_id, has_author_id: !!a.author_id }
      const mapCall = debugSpy.mock.calls.find(call => 
        call[0] === '[Marketplace] Loaded agents:'
      )
      expect(mapCall).toBeDefined()
      if (mapCall && Array.isArray(mapCall[1])) {
        expect(mapCall[1][0].has_author_id).toBe(false) // author_id is null
      }

      debugSpy.mockRestore()
    })
  })

  describe('Array operations - filter and sort chains', () => {
    it('should execute filter operation after map in fetchAgents', async () => {
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
          category: 'automation',
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

      // Should execute filter after map: agentsData = agentsData.map(...).filter(...)
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].category).toBe('automation')
    })

    it('should execute sort operation after filter in fetchAgents', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Zebra Agent',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
        {
          id: 'agent-2',
          name: 'Alpha Agent',
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
          sortBy: 'alphabetical',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should execute sort after filter: agentsData.filter(...).sort(...)
      expect(result.current.agents[0].name).toBe('Alpha Agent')
      expect(result.current.agents[1].name).toBe('Zebra Agent')
    })
  })
})
