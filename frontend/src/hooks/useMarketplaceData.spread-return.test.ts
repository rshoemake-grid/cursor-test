/**
 * Spread Operator and Return Pattern Tests for useMarketplaceData hook
 * Phase 4.2: Tests for spread operator and return patterns
 * Targets surviving mutants in object spread and return statements
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from './useLocalStorage'

jest.mock('./useLocalStorage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - Spread Operator and Return Patterns (Phase 4.2)', () => {
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

  describe('Spread operator - ...agent', () => {
    it('should use spread operator to copy agent properties', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          description: 'Description',
          author_id: null,
          category: 'automation',
          tags: ['tag1', 'tag2'],
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

      // Should use: { ...agent, author_id: user.id, author_name: ... }
      // Spread operator should copy all properties
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0].id).toBe('agent-1')
      expect(savedData[0].name).toBe('Agent')
      expect(savedData[0].description).toBe('Description')
      expect(savedData[0].tags).toEqual(['tag1', 'tag2'])
      expect(savedData[0].author_id).toBe('user-1')
    })

    it('should verify spread operator preserves all original properties', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          description: 'Description',
          author_id: null,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: true,
          uses_count: 10,
          likes_count: 5,
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

      // Should use: { ...agent, author_id: user.id, author_name: ... }
      // Spread operator should preserve all properties including is_official, uses_count, etc.
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0].is_official).toBe(true)
      expect(savedData[0].uses_count).toBe(10)
      expect(savedData[0].likes_count).toBe(5)
      expect(savedData[0].author_id).toBe('user-1')
    })
  })

  describe('Return pattern - return agent vs return { ...agent }', () => {
    it('should return agent unchanged when author_id exists', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          author_id: 'existing-user',
          author_name: 'existing',
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
          user: { id: 'user-1', username: 'testuser' },
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should return: return agent (not return { ...agent, ... })
      // When author_id exists, should return agent unchanged
      expect(result.current.agents[0].author_id).toBe('existing-user')
      expect(result.current.agents[0].author_name).toBe('existing')
    })

    it('should return new object when author_id is null', async () => {
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

      // Should return: return { ...agent, author_id: user.id, author_name: ... }
      // When author_id is null, should return new object with updated properties
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0].author_id).toBe('user-1')
      expect(savedData[0].author_name).toBe('testuser')
    })

    it('should verify conditional return pattern (!agent.author_id)', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          author_id: null, // Should trigger return { ...agent, ... }
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
        {
          id: 'agent-2',
          name: 'Agent 2',
          author_id: 'existing', // Should trigger return agent
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

      // Should check: if (!agent.author_id) return { ...agent, ... } else return agent
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      const agent1 = savedData.find((a: any) => a.id === 'agent-1')
      const agent2 = savedData.find((a: any) => a.id === 'agent-2')
      
      expect(agent1.author_id).toBe('user-1') // Updated
      expect(agent2.author_id).toBe('existing') // Unchanged
    })
  })

  describe('Return pattern - return in map callback', () => {
    it('should return object from map callback when condition is true', async () => {
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

      // Should return: return { ...agent, author_id: user.id, author_name: ... }
      // From map callback when !agent.author_id is true
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0]).toHaveProperty('author_id')
      expect(savedData[0]).toHaveProperty('author_name')
    })

    it('should return original agent from map callback when condition is false', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          author_id: 'existing',
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
          user: { id: 'user-1', username: 'testuser' },
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should return: return agent
      // From map callback when !agent.author_id is false
      expect(result.current.agents[0].author_id).toBe('existing')
    })
  })

  describe('Object property assignment - author_id and author_name', () => {
    it('should assign author_id property in spread object', async () => {
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

      // Should assign: author_id: user.id
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0].author_id).toBe('user-1')
    })

    it('should assign author_name property in spread object', async () => {
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

      // Should assign: author_name: user.username || user.email || null
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0].author_name).toBe('testuser')
    })

    it('should verify property order in spread object', async () => {
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

      // Should use: { ...agent, author_id: user.id, author_name: ... }
      // Spread first, then new properties
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0].id).toBe('agent-1')
      expect(savedData[0].name).toBe('Agent')
      expect(savedData[0].author_id).toBe('user-1')
      expect(savedData[0].author_name).toBe('testuser')
    })
  })
})
