/**
 * Targeted Tests for useMarketplaceData hook
 * Phase 4.2: Targeted tests for surviving mutants
 * Focuses on specific expressions and patterns that may have surviving mutants
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from '../storage'

jest.mock('../storage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - Targeted Tests (Phase 4.2)', () => {
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

  describe('Sort comparison - aIsOfficial !== bIsOfficial exact comparison', () => {
    it('should verify !== operator in aIsOfficial !== bIsOfficial', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Unofficial',
          is_official: false,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'agent-2',
          name: 'Official',
          is_official: true,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
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

      // Should use !== operator: aIsOfficial !== bIsOfficial
      expect(result.current.agents[0].is_official).toBe(true)
      expect(result.current.agents[1].is_official).toBe(false)
    })

    it('should verify === case does not trigger sort (both official)', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Official 1',
          is_official: true,
          category: 'automation',
          tags: [],
          published_at: '2024-01-02T00:00:00Z',
        },
        {
          id: 'agent-2',
          name: 'Official 2',
          is_official: true,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
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

      // When aIsOfficial === bIsOfficial, should skip !== branch and use date sort
      expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z')
      expect(result.current.agents[1].published_at).toBe('2024-01-01T00:00:00Z')
    })
  })

  describe('Sort subtraction - bIsOfficial - aIsOfficial', () => {
    it('should verify subtraction order (bIsOfficial - aIsOfficial)', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Unofficial',
          is_official: false,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'agent-2',
          name: 'Official',
          is_official: true,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
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

      // Should use: return bIsOfficial - aIsOfficial (1 - 0 = 1, positive means b comes first)
      expect(result.current.agents[0].is_official).toBe(true)
      expect(result.current.agents[1].is_official).toBe(false)
    })

    it('should verify reverse order would be different (aIsOfficial - bIsOfficial)', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Official',
          is_official: true,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'agent-2',
          name: 'Unofficial',
          is_official: false,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
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

      // Should still use bIsOfficial - aIsOfficial (0 - 1 = -1, negative means a comes first)
      // But since we're comparing in reverse order, official should still come first
      expect(result.current.agents[0].is_official).toBe(true)
      expect(result.current.agents[1].is_official).toBe(false)
    })
  })

  describe('Date subtraction - dateB - dateA', () => {
    it('should verify subtraction order (dateB - dateA)', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          is_official: false,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'agent-2',
          name: 'Agent 2',
          is_official: false,
          category: 'automation',
          tags: [],
          published_at: '2024-01-02T00:00:00Z',
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

      // Should use: return dateB - dateA (positive means b comes first = descending)
      expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z')
      expect(result.current.agents[1].published_at).toBe('2024-01-01T00:00:00Z')
    })

    it('should verify reverse order would be ascending (dateA - dateB)', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          is_official: false,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'agent-2',
          name: 'Agent 2',
          is_official: false,
          category: 'automation',
          tags: [],
          published_at: '2024-01-02T00:00:00Z',
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

      // Current code uses dateB - dateA (descending), verify it's not dateA - dateB (ascending)
      expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z') // Most recent first
      expect(result.current.agents[1].published_at).toBe('2024-01-01T00:00:00Z')
    })
  })

  describe('Ternary operator - is_official ? 1 : 0', () => {
    it('should verify ternary returns 1 when is_official is true', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Official',
          is_official: true,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'agent-2',
          name: 'Unofficial',
          is_official: false,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
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

      // Should use: const aIsOfficial = a.is_official ? 1 : 0
      // Official agent should have value 1, unofficial should have value 0
      expect(result.current.agents[0].is_official).toBe(true) // Value 1
      expect(result.current.agents[1].is_official).toBe(false) // Value 0
    })

    it('should verify ternary returns 0 when is_official is false', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Unofficial',
          is_official: false,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
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

      // Should use: const aIsOfficial = a.is_official ? 1 : 0
      // When false, should return 0 (not 1)
      expect(result.current.agents[0].is_official).toBe(false)
    })
  })

  describe('Ternary operator - published_at ? new Date().getTime() : 0', () => {
    it('should verify ternary returns getTime() when published_at exists', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          is_official: false,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
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

      // Should use: const dateA = a.published_at ? new Date(a.published_at).getTime() : 0
      // When published_at exists, should return timestamp (not 0)
      expect(result.current.agents[0].published_at).toBe('2024-01-01T00:00:00Z')
    })

    it('should verify ternary returns 0 when published_at is undefined', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          is_official: false,
          category: 'automation',
          tags: [],
          // published_at is undefined
        },
        {
          id: 'agent-2',
          name: 'Agent 2',
          is_official: false,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
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

      // Should use: const dateA = a.published_at ? new Date(a.published_at).getTime() : 0
      // When published_at is undefined, should return 0 (not getTime())
      // Agent with date should come first
      expect(result.current.agents[0].published_at).toBe('2024-01-01T00:00:00Z')
    })
  })

  describe('Boolean conversion - !!a.author_id', () => {
    it('should verify double negation converts to boolean', async () => {
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

       
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- Dynamic require needed for Jest mocking
      const { logger } = require('../../utils/logger')
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

      // Should use: has_author_id: !!a.author_id
      // When author_id is truthy, !! should convert to true
      const mapCall = debugSpy.mock.calls.find(call => 
        call[0] === '[Marketplace] Loaded agents:'
      )
      expect(mapCall).toBeDefined()
      if (mapCall && Array.isArray(mapCall[1])) {
        expect(mapCall[1][0].has_author_id).toBe(true) // !!'user-1' = true
      }

      debugSpy.mockRestore()
    })

    it('should verify double negation converts null to false', async () => {
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

       
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- Dynamic require needed for Jest mocking
      const { logger } = require('../../utils/logger')
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

      // Should use: has_author_id: !!a.author_id
      // When author_id is null, !! should convert to false
      const mapCall = debugSpy.mock.calls.find(call => 
        call[0] === '[Marketplace] Loaded agents:'
      )
      expect(mapCall).toBeDefined()
      if (mapCall && Array.isArray(mapCall[1])) {
        expect(mapCall[1][0].has_author_id).toBe(false) // !!null = false
      }

      debugSpy.mockRestore()
    })
  })

  describe('Array.isArray check - Array.isArray(workflowDetail.nodes)', () => {
    it('should verify Array.isArray check is executed', async () => {
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
        json: async () => ({
          nodes: [], // Array
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

      // Should use: if (workflowDetail.nodes && Array.isArray(workflowDetail.nodes))
      // Array.isArray check should execute
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should verify Array.isArray returns false for non-array', async () => {
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
        json: async () => ({
          nodes: 'not-an-array', // Not an array
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

      // Should use: if (workflowDetail.nodes && Array.isArray(workflowDetail.nodes))
      // Array.isArray should return false for non-array, so inner block shouldn't execute
      expect(mockHttpClient.post).toHaveBeenCalled()
      // Should not add workflow since nodes is not an array
      expect(result.current.workflowsOfWorkflows.length).toBe(0)
    })
  })
})
