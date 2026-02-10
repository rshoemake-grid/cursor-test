/**
 * Object Literal Tests for useMarketplaceData hook
 * Targets surviving ObjectLiteral mutants (~2 mutants)
 * Tests object property assignments and structure
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from '../storage'

jest.mock('../storage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - Object Literals', () => {
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
    author_id: null,
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

  describe('Agent object update - author_id and author_name', () => {
    it('should update agent with exact object structure', async () => {
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

      // Verify exact object structure
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0]).toHaveProperty('author_id', 'user-1')
      expect(savedData[0]).toHaveProperty('author_name', 'testuser')
      expect(savedData[0]).toHaveProperty('id', 'agent-1')
      expect(savedData[0]).toHaveProperty('name', 'Test Agent')
    })

    it('should preserve all existing agent properties', async () => {
      const agents = [{
        ...mockAgent,
        author_id: null,
        category: 'automation',
        tags: ['test', 'automation'],
        published_at: '2024-01-01T00:00:00Z',
      }]
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

      // Verify all properties are preserved
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0].id).toBe('agent-1')
      expect(savedData[0].name).toBe('Test Agent')
      expect(savedData[0].category).toBe('automation')
      expect(savedData[0].tags).toEqual(['test', 'automation'])
      expect(savedData[0].published_at).toBe('2024-01-01T00:00:00Z')
      expect(savedData[0].author_id).toBe('user-1')
      expect(savedData[0].author_name).toBe('testuser')
    })

    it('should set author_name to email when username is missing', async () => {
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
          user: { id: 'user-1', email: 'test@example.com' },
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
      })

      // Verify author_name is set to email
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0].author_name).toBe('test@example.com')
    })

    it('should set author_name to null when neither username nor email exists', async () => {
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
          user: { id: 'user-1' },
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
      })

      // Verify author_name is set to null
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0].author_name).toBeNull()
    })
  })

  describe('Object spread preserves properties', () => {
    it('should use spread operator to preserve all properties', async () => {
      const agents = [{
        ...mockAgent,
        author_id: null,
        customProperty: 'customValue', // Additional property
      }]
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

      // Verify spread preserves custom properties
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0]).toHaveProperty('customProperty', 'customValue')
      expect(savedData[0]).toHaveProperty('author_id', 'user-1')
      expect(savedData[0]).toHaveProperty('author_name', 'testuser')
    })
  })

  describe('Object mutations would break functionality', () => {
    it('should fail if object structure mutated', async () => {
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

      // Verify exact property names (mutation would break)
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0]).toHaveProperty('author_id')
      expect(savedData[0]).toHaveProperty('author_name')
      expect(savedData[0]).not.toHaveProperty('authorId') // camelCase would be wrong
      expect(savedData[0]).not.toHaveProperty('author-name') // kebab-case would be wrong
    })

    it('should fail if property value mutated', async () => {
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

      // Verify exact property values
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0].author_id).toBe('user-1')
      expect(savedData[0].author_id).not.toBe('user-2') // Mutation would break
      expect(savedData[0].author_name).toBe('testuser')
      expect(savedData[0].author_name).not.toBe('testuser2') // Mutation would break
    })
  })
})
