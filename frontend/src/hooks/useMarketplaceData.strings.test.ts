/**
 * String Literal Tests for useMarketplaceData hook
 * Targets surviving StringLiteral mutants (~12 mutants)
 * Tests exact string matches, URL construction, and storage keys
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from './useLocalStorage'
import { STORAGE_KEYS } from '../config/constants'

jest.mock('./useLocalStorage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - String Literals', () => {
  let mockHttpClient: any
  let mockStorage: any

  const mockTemplate: any = {
    id: 'template-1',
    name: 'Test Template',
    description: 'Test Description',
    category: 'automation',
    tags: ['test'],
  }

  const mockAgent: any = {
    id: 'agent-1',
    name: 'Test Agent',
    label: 'Test Agent',
    description: 'Test Description',
    category: 'automation',
    tags: ['test'],
    published_at: '2024-01-01T00:00:00Z',
  }

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

  describe('sortBy string literals - exact matches', () => {
    it('should use exact string "popular" for sortBy', async () => {
      const agents = [
        { ...mockAgent, published_at: '2024-01-01T00:00:00Z' },
        { ...mockAgent, id: 'agent-2', published_at: '2024-01-02T00:00:00Z' },
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

      // Should sort by date (exact match for "popular")
      expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z')
    })

    it('should use exact string "recent" for sortBy', async () => {
      const agents = [
        { ...mockAgent, published_at: '2024-01-01T00:00:00Z' },
        { ...mockAgent, id: 'agent-2', published_at: '2024-01-02T00:00:00Z' },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'recent',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should sort by date (exact match for "recent")
      expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z')
    })

    it('should NOT match "Popular" (case sensitive)', async () => {
      const agents = [
        { ...mockAgent, name: 'Zebra Agent' },
        { ...mockAgent, id: 'agent-2', name: 'Alpha Agent' },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'Popular' as any, // Wrong case
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should sort alphabetically (not "popular" or "recent")
      expect(result.current.agents[0].name).toBe('Alpha Agent')
    })

    it('should NOT match "popular " (with trailing space)', async () => {
      const agents = [
        { ...mockAgent, name: 'Zebra Agent' },
        { ...mockAgent, id: 'agent-2', name: 'Alpha Agent' },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular ' as any, // With trailing space
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should sort alphabetically (not exact match)
      expect(result.current.agents[0].name).toBe('Alpha Agent')
    })
  })

  describe('activeTab string literals - exact matches', () => {
    it('should use exact string "repository" for activeTab', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
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

      // Should fetch templates (exact match for "repository")
      expect(mockHttpClient.get).toHaveBeenCalled()
    })

    it('should use exact string "workflows-of-workflows" for activeTab', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
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
      })

      // Should fetch workflows of workflows (exact match)
      expect(mockHttpClient.get).toHaveBeenCalled()
    })

    it('should use exact string "agents" for activeTab', async () => {
      mockGetLocalStorageItem.mockReturnValue([mockAgent])

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

      // Should fetch agents (exact match for "agents")
      expect(result.current.agents.length).toBeGreaterThan(0)
    })
  })

  describe('repositorySubTab string literals - exact matches', () => {
    it('should use exact string "workflows" for repositorySubTab', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
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

      // Should fetch templates (exact match for "workflows")
      expect(mockHttpClient.get).toHaveBeenCalled()
    })

    it('should use exact string "agents" for repositorySubTab', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([mockAgent]))

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

      // Should fetch repository agents (exact match for "agents")
      expect(result.current.repositoryAgents.length).toBeGreaterThan(0)
    })

    it('should NOT match "workflow" (singular)', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([mockAgent]))

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
          repositorySubTab: 'workflow' as any, // Singular, not plural
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should fetch repository agents (not "workflows")
      expect(result.current.repositoryAgents.length).toBeGreaterThan(0)
    })
  })

  describe('URL string construction', () => {
    it('should construct exact URL path "/templates/"', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })

      renderHook(() =>
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
        expect(mockHttpClient.get).toHaveBeenCalled()
      })

      // Verify exact URL path
      const callUrl = mockHttpClient.get.mock.calls[0][0]
      expect(callUrl).toContain('/templates/')
    })

    it('should construct exact URL path "/templates/{id}/use"', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ ...mockTemplate, id: 'template-1' }],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ nodes: [] }),
      })

      renderHook(() =>
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
        expect(mockHttpClient.post).toHaveBeenCalled()
      })

      // Verify exact URL path
      const callUrl = mockHttpClient.post.mock.calls[0][0]
      expect(callUrl).toContain('/templates/')
      expect(callUrl).toContain('/use')
    })

    it('should use exact query parameter name "sort_by"', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })

      renderHook(() =>
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
        expect(mockHttpClient.get).toHaveBeenCalled()
      })

      // Verify exact parameter name (not "sortBy" or "sort-by")
      const callUrl = mockHttpClient.get.mock.calls[0][0]
      expect(callUrl).toContain('sort_by=popular')
    })
  })

  describe('Storage key string literals', () => {
    it('should use exact storage key "publishedAgents"', async () => {
      const agents = [{ ...mockAgent, author_id: null }]
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

      // Verify exact storage key
      expect(mockStorage.setItem).toHaveBeenCalledWith('publishedAgents', expect.any(String))
    })

    it('should use STORAGE_KEYS.REPOSITORY_AGENTS for repository agents', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([mockAgent]))

      renderHook(() =>
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
        expect(mockStorage.getItem).toHaveBeenCalled()
      })

      // Verify exact storage key from constants
      expect(mockStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.REPOSITORY_AGENTS)
    })
  })

  describe('String mutations would break functionality', () => {
    it('should fail if "popular" mutated to "Popular" (case sensitivity)', async () => {
      const agents = [
        { ...mockAgent, name: 'Zebra Agent' },
        { ...mockAgent, id: 'agent-2', name: 'Alpha Agent' },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'Popular' as any, // Wrong case
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should NOT sort by date (not exact match)
      expect(result.current.agents[0].name).toBe('Alpha Agent') // Alphabetical sort
    })

    it('should fail if "workflows" mutated to "workflow" (singular)', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([mockAgent]))

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
          repositorySubTab: 'workflow' as any, // Singular
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should fetch repository agents (not templates)
      expect(result.current.repositoryAgents.length).toBeGreaterThan(0)
      expect(mockHttpClient.get).not.toHaveBeenCalled()
    })

    it('should fail if URL path mutated', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })

      renderHook(() =>
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
        expect(mockHttpClient.get).toHaveBeenCalled()
      })

      // Verify exact URL path (mutation would break)
      const callUrl = mockHttpClient.get.mock.calls[0][0]
      expect(callUrl).toContain('/templates/')
      expect(callUrl).not.toContain('/template/') // Singular would be wrong
    })
  })
})
