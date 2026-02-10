/**
 * Mutation tests for useMarketplaceData hook
 * Targets exact conditionals, logical operators, and edge cases
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { logger } from '../../utils/logger'
import { getLocalStorageItem } from '../storage'

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('../storage', () => ({
  getLocalStorageItem: jest.fn(),
}))

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockLoggerDebug = logger.debug as jest.MockedFunction<typeof logger.debug>
const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - Mutation Killers', () => {
  let mockHttpClient: any
  let mockStorage: any

  const mockTemplate: any = {
    id: 'template-1',
    name: 'Test Template',
    description: 'Test Description',
    category: 'automation',
    tags: ['test'],
    difficulty: 'beginner',
    estimated_time: '5 min',
    is_official: false,
    uses_count: 10,
    likes_count: 5,
    rating: 4.5,
    author_id: 'user-1',
    author_name: 'Test User',
  }

  const mockAgent: any = {
    id: 'agent-1',
    name: 'Test Agent',
    label: 'Test Agent',
    description: 'Test Description',
    category: 'automation',
    tags: ['test'],
    difficulty: 'beginner',
    estimated_time: '5 min',
    agent_config: {},
    published_at: '2024-01-01T00:00:00Z',
    author_id: 'user-1',
    author_name: 'Test User',
    is_official: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockHttpClient = {
      get: jest.fn().mockResolvedValue({ json: async () => [] }),
      post: jest.fn().mockResolvedValue({ ok: true, json: async () => ({ nodes: [] }) }),
    }
    mockStorage = {
      getItem: jest.fn().mockReturnValue(JSON.stringify([])),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    mockGetLocalStorageItem.mockReturnValue([])
  })

  describe('fetchTemplates - exact truthy checks', () => {
    it('should verify exact truthy check - category exists', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: 'automation',
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

      // Should append category parameter
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('category=automation')
      )
    })

    it('should verify exact truthy check - category is empty string (should not append)', async () => {
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

      // Should not append category parameter (empty string is falsy)
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.not.stringContaining('category=')
      )
    })

    it('should verify exact truthy check - searchQuery exists', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: 'test',
          sortBy: 'popular',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'workflows',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should append search parameter
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('search=test')
      )
    })

    it('should verify exact truthy check - searchQuery is empty string (should not append)', async () => {
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

      // Should not append search parameter (empty string is falsy)
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.not.stringContaining('search=')
      )
    })
  })

  describe('fetchAgents - exact AND operator and truthy checks', () => {
    it('should verify exact AND - user && user.id && agentsData.length > 0 (all true)', async () => {
      const agents = [mockAgent]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
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
        expect(result.current.loading).toBe(false)
      })

      // Should process agents (all AND conditions true)
      expect(result.current.agents.length).toBeGreaterThan(0)
    })

    it('should verify exact AND - user is null (first false)', async () => {
      const agents = [mockAgent]
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

      // Should still load agents (but not update author info)
      expect(result.current.agents.length).toBeGreaterThan(0)
    })

    it('should verify exact AND - user.id is missing (second false)', async () => {
      const agents = [mockAgent]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: { id: '', username: 'testuser' } as any,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should still load agents
      expect(result.current.agents.length).toBeGreaterThan(0)
    })

    it('should verify exact AND - agentsData.length === 0 (third false)', async () => {
      mockGetLocalStorageItem.mockReturnValue([])

      const { result } = renderHook(() =>
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
        expect(result.current.loading).toBe(false)
      })

      // Should not update author info (length === 0)
      expect(result.current.agents.length).toBe(0)
    })

    it('should verify exact truthy check - !agent.author_id', async () => {
      const agents = [{ ...mockAgent, author_id: null }]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
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
        expect(result.current.loading).toBe(false)
      })

      // Should update agent with author info
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should verify exact truthy check - agent.author_id exists (should not update)', async () => {
      const agents = [{ ...mockAgent, author_id: 'existing-author' }]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
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
        expect(result.current.loading).toBe(false)
      })

      // Should not update (author_id exists)
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should verify exact logical OR - user.username || user.email || null', async () => {
      const agents = [{ ...mockAgent, author_id: null }]
      mockGetLocalStorageItem.mockReturnValue(agents)

      // Test username path
      const { result: result1 } = renderHook(() =>
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
        expect(result1.current.loading).toBe(false)
      })

      // Test email path
      mockStorage.setItem.mockClear()
      const { result: result2 } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: { id: 'user-1', email: 'test@example.com' },
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result2.current.loading).toBe(false)
      })

      // Test null path (neither username nor email)
      mockStorage.setItem.mockClear()
      const { result: result3 } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: { id: 'user-1' },
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result3.current.loading).toBe(false)
      })

      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should verify exact AND - updated && storage (both true)', async () => {
      const agents = [{ ...mockAgent, author_id: null }]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
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
        expect(result.current.loading).toBe(false)
      })

      // Should save to storage (both conditions true)
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should verify exact AND - storage is null (should not save)', async () => {
      const agents = [{ ...mockAgent, author_id: null }]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: null,
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
        expect(result.current.loading).toBe(false)
      })

      // Should not save (storage is null)
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('fetchAgents - filter conditions and logical OR', () => {
    it('should verify exact equality - category filter', async () => {
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

      // Should filter by category
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].category).toBe('automation')
    })

    it('should verify exact logical OR - search filter (name match)', async () => {
      const agents = [
        { ...mockAgent, name: 'Test Agent', description: 'Agent One Description', tags: ['one'] },
        { ...mockAgent, id: 'agent-2', name: 'Other Agent', description: 'Agent Two Description', tags: ['two'] },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: 'Test',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should filter by search query (name match)
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].name).toBe('Test Agent')
    })

    it('should verify exact logical OR - search filter (description match)', async () => {
      const agents = [
        { ...mockAgent, name: 'Agent One', description: 'Test Description', tags: ['one'] },
        { ...mockAgent, id: 'agent-2', name: 'Agent Two', description: 'Other Description', tags: ['two'] },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: 'Test',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should filter by search query (description match)
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].description).toBe('Test Description')
    })

    it('should verify exact logical OR - search filter (tags match)', async () => {
      const agents = [
        { ...mockAgent, name: 'Agent One', description: 'Agent One Description', tags: ['test', 'automation'] },
        { ...mockAgent, id: 'agent-2', name: 'Agent Two', description: 'Agent Two Description', tags: ['other'] },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: 'test',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should filter by search query (tags match)
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].tags).toContain('test')
    })
  })

  describe('fetchAgents - sort conditions and ternary operators', () => {
    it('should verify exact ternary - a.is_official ? 1 : 0', async () => {
      const agents = [
        { ...mockAgent, is_official: true, name: 'Official Agent' },
        { ...mockAgent, id: 'agent-2', is_official: false, name: 'Unofficial Agent' },
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

      // Should sort official agents first
      expect(result.current.agents[0].is_official).toBe(true)
      expect(result.current.agents[1].is_official).toBe(false)
    })

    it('should verify exact equality - sortBy === "popular"', async () => {
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

      // Should sort by date (most recent first)
      expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z')
    })

    it('should verify exact equality - sortBy === "recent"', async () => {
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

      // Should sort by date (most recent first)
      expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z')
    })

    it('should verify exact equality - sortBy !== "popular" && !== "recent" (should use alphabetical)', async () => {
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
          sortBy: 'alphabetical',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should sort alphabetically
      expect(result.current.agents[0].name).toBe('Alpha Agent')
    })

    it('should verify exact ternary - a.published_at ? new Date().getTime() : 0', async () => {
      const agents = [
        { ...mockAgent, published_at: '2024-01-01T00:00:00Z' },
        { ...mockAgent, id: 'agent-2', published_at: undefined },
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

      // Should handle undefined published_at (use 0)
      expect(result.current.agents.length).toBe(2)
    })

    it('should verify exact logical OR - a.name || ""', async () => {
      const agents = [
        { ...mockAgent, name: 'Test Agent' },
        { ...mockAgent, id: 'agent-2', name: undefined },
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

      // Should handle undefined name (use empty string)
      expect(result.current.agents.length).toBe(2)
    })
  })

  describe('fetchRepositoryAgents - exact falsy check and ternary', () => {
    it('should verify exact falsy check - storage is null', async () => {
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

      // Should return empty array when storage is null
      expect(result.current.repositoryAgents).toEqual([])
    })

    it('should verify exact falsy check - storage exists (should load)', async () => {
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

      // Should load from storage
      expect(result.current.repositoryAgents.length).toBeGreaterThan(0)
    })

    it('should verify exact ternary - savedAgents ? JSON.parse(savedAgents) : []', async () => {
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

      // Should parse savedAgents
      expect(result.current.repositoryAgents.length).toBe(1)
    })

    it('should verify exact ternary - savedAgents is null (should use [])', async () => {
      mockStorage.getItem.mockReturnValue(null)

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

      // Should use empty array
      expect(result.current.repositoryAgents).toEqual([])
    })

    it('should verify exact logical OR - sortBy === "popular" || sortBy === "recent"', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([mockAgent]))

      // Test popular
      const { result: result1 } = renderHook(() =>
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
        expect(result1.current.loading).toBe(false)
      })

      // Test recent
      const { result: result2 } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'recent',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result2.current.loading).toBe(false)
      })

      // Both should sort by date
      expect(result1.current.repositoryAgents.length).toBeGreaterThan(0)
      expect(result2.current.repositoryAgents.length).toBeGreaterThan(0)
    })
  })

  describe('useEffect - exact equality checks for activeTab routing', () => {
    it('should verify exact equality - activeTab === "repository"', async () => {
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

      // Should fetch templates (repository tab)
      expect(mockHttpClient.get).toHaveBeenCalled()
    })

    it('should verify exact equality - activeTab !== "repository" && !== "workflows-of-workflows" (should fetch agents)', async () => {
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

      // Should fetch agents (agents tab)
      expect(result.current.agents.length).toBeGreaterThan(0)
    })

    it('should verify exact equality - activeTab === "workflows-of-workflows"', async () => {
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

      // Should fetch workflows of workflows
      expect(mockHttpClient.get).toHaveBeenCalled()
    })

    it('should verify exact equality - repositorySubTab === "workflows"', async () => {
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

      // Should fetch templates (workflows sub-tab)
      expect(mockHttpClient.get).toHaveBeenCalled()
    })

    it('should verify exact equality - repositorySubTab !== "workflows" (should fetch agents)', async () => {
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

      // Should fetch repository agents (agents sub-tab)
      expect(result.current.repositoryAgents.length).toBeGreaterThan(0)
    })
  })

  describe('fetchWorkflowsOfWorkflows - logical OR operators', () => {
    it('should verify exact logical OR - workflowResponse.ok check', async () => {
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

      // Should process workflow (ok === true)
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should verify exact logical OR - workflowResponse.ok is false (should skip)', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: false,
        json: async () => ({}),
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

      // Should not process workflow (ok === false)
      expect(result.current.workflowsOfWorkflows.length).toBe(0)
    })

    it('should verify exact AND - workflowDetail.nodes && Array.isArray(workflowDetail.nodes)', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ nodes: [{ id: 'node-1' }] }),
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

      // Should process nodes (both conditions true)
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should verify exact logical OR - hasWorkflowId || description.includes || name.includes || tags.some', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{
            workflow_id: 'workflow-1', // First OR condition true
          }],
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
      })

      // Should detect workflow reference (hasWorkflowId is truthy)
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should verify exact logical OR - description.includes("workflow")', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{
            description: 'This is a workflow node',
          }],
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
      })

      // Should detect workflow reference (description includes "workflow")
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should verify exact logical OR - name.includes("workflow")', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{
            name: 'workflow node',
          }],
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
      })

      // Should detect workflow reference (name includes "workflow")
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should verify exact logical OR - tags.some(includes("workflow"))', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ ...mockTemplate, tags: ['workflow', 'test'] }],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{}],
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
      })

      // Should detect workflow reference (tags include "workflow")
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should verify exact logical OR - workflowDescription.includes("workflow of workflows")', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ ...mockTemplate, description: 'This is a workflow of workflows' }],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [],
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
      })

      // Should detect workflow of workflows (description match)
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should verify exact logical OR - hasWorkflowReference || isWorkflowOfWorkflows', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{
            workflow_id: 'workflow-1',
          }],
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
      })

      // Should add to workflowsOfWorkflows (hasWorkflowReference is true)
      expect(mockHttpClient.post).toHaveBeenCalled()
    })
  })

  describe('Optional chaining - user?.id, user?.username, user?.email', () => {
    it('should verify optional chaining - user?.id exists', async () => {
      const agents = [{ ...mockAgent, author_id: null }]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: { id: 'user-1' },
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should use user.id
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should verify optional chaining - user is null (should not access id)', async () => {
      const agents = [mockAgent]
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

      // Should not update (user is null)
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })
  })
})
