/**
 * Equality Operator Tests for useMarketplaceData hook
 * Targets surviving EqualityOperator mutants (~4 mutants)
 * Tests exact equality checks (=== vs !== vs ==)
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from './useLocalStorage'
import { STORAGE_KEYS } from '../config/constants'

jest.mock('./useLocalStorage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - Equality Operators', () => {
  let mockHttpClient: any
  let mockStorage: any

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

  describe('Category equality - a.category === category', () => {
    it('should filter when category matches exactly', async () => {
      const agents = [
        { ...mockAgent, category: 'automation' },
        { ...mockAgent, id: 'agent-2', category: 'other' },
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

      // Should filter by exact category match
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].category).toBe('automation')
    })

    it('should NOT filter when category does not match', async () => {
      const agents = [
        { ...mockAgent, category: 'automation' },
        { ...mockAgent, id: 'agent-2', category: 'other' },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: 'different',
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

      // Should filter out all (no matches)
      expect(result.current.agents.length).toBe(0)
    })

    it('should use strict equality (=== not ==)', async () => {
      const agents = [
        { ...mockAgent, category: '5' }, // String '5'
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: 5 as any, // Number 5
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

      // Should NOT match (strict equality: '5' !== 5)
      expect(result.current.agents.length).toBe(0)
    })
  })

  describe('SortBy equality - sortBy === "popular"', () => {
    it('should match exactly "popular"', async () => {
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

      // Should sort by date (exact match)
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
          sortBy: 'Popular' as any,
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

  describe('SortBy equality - sortBy === "recent"', () => {
    it('should match exactly "recent"', async () => {
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

      // Should sort by date (exact match)
      expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z')
    })
  })

  describe('ActiveTab equality - activeTab === "repository"', () => {
    it('should match exactly "repository"', async () => {
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

      // Should fetch templates (exact match)
      expect(mockHttpClient.get).toHaveBeenCalled()
    })

    it('should NOT match "Repository" (case sensitive)', async () => {
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
          activeTab: 'Repository' as any,
          repositorySubTab: 'workflows',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should fetch agents (not exact match for "repository")
      expect(result.current.agents.length).toBeGreaterThan(0)
    })
  })

  describe('RepositorySubTab equality - repositorySubTab === "workflows"', () => {
    it('should match exactly "workflows"', async () => {
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

      // Should fetch templates (exact match)
      expect(mockHttpClient.get).toHaveBeenCalled()
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
          repositorySubTab: 'workflow' as any,
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should fetch repository agents (not exact match)
      expect(result.current.repositoryAgents.length).toBeGreaterThan(0)
    })
  })

  describe('Equality mutations would break functionality', () => {
    it('should fail if === mutated to == (type coercion)', async () => {
      const agents = [
        { ...mockAgent, category: '5' }, // String
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: 5 as any, // Number
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

      // Strict equality: '5' !== 5 (mutation to == would match incorrectly)
      expect(result.current.agents.length).toBe(0)
    })

    it('should fail if === mutated to !==', async () => {
      const agents = [
        { ...mockAgent, category: 'automation' },
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

      // Should match (mutation to !== would break)
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].category).toBe('automation')
    })
  })
})
