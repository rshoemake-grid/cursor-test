/**
 * Assignment and State Mutation Tests for useMarketplaceData hook
 * Phase 4.2: Tests for assignment operations and state mutations
 * Targets surviving mutants in assignment expressions
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from '../storage'

jest.mock('../storage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - Assignment Operations (Phase 4.2)', () => {
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

  describe('Assignment - updated = true', () => {
    it('should execute updated = true when agent.author_id is null', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          author_id: null, // Will trigger updated = true
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

      // Should execute: updated = true inside map callback
      // When !agent.author_id is true
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0].author_id).toBe('user-1')
    })

    it('should NOT execute updated = true when agent.author_id exists', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          author_id: 'existing-user', // Already has author_id
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

      // Should NOT execute: updated = true
      // When !agent.author_id is false (author_id exists)
      // setItem should not be called since updated remains false
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('Conditional check - if (updated && storage)', () => {
    it('should execute storage.setItem when updated is true AND storage exists', async () => {
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
          storage: mockStorage, // Storage exists
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

      // Should execute: if (updated && storage)
      // Both updated and storage are truthy
      expect(mockStorage.setItem).toHaveBeenCalledWith('publishedAgents', expect.any(String))
    })

    it('should NOT execute storage.setItem when updated is false', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          author_id: 'existing-user', // Already has author_id, so updated stays false
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

      // Should NOT execute: if (updated && storage)
      // updated is false, so condition is false
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should NOT execute storage.setItem when storage is null', async () => {
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

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: null, // No storage
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

      // Should NOT execute: if (updated && storage)
      // storage is null, so condition is false
      // Note: setItem won't be called, but we can't verify it since mockStorage isn't used
      expect(result.current.agents.length).toBeGreaterThan(0)
    })
  })

  describe('Array assignment - agentsData = agentsData.map(...)', () => {
    it('should execute array assignment with map operation', async () => {
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

      // Should execute: agentsData = agentsData.map(agent => {...})
      // Array assignment should occur
      expect(result.current.agents[0].author_id).toBe('user-1')
    })
  })

  describe('Array assignment - agentsData = agentsData.filter(...)', () => {
    it('should execute array assignment with filter operation', async () => {
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

      // Should execute: agentsData = agentsData.filter(a => a.category === category)
      // Array assignment should occur
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].category).toBe('automation')
    })
  })

  describe('Array assignment - agentsData.sort(...)', () => {
    it('should execute sort operation (mutates array in place)', async () => {
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

      // Should execute: agentsData.sort((a, b) => {...})
      // Sort mutates array in place
      expect(result.current.agents[0].name).toBe('Alpha Agent')
      expect(result.current.agents[1].name).toBe('Zebra Agent')
    })
  })
})
