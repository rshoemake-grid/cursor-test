/**
 * Method Expression Tests for useMarketplaceData hook
 * Targets surviving MethodExpression, ArrowFunction mutants
 * Tests sort callbacks, filter callbacks, and method chaining
 */

import { renderHook } from '@testing-library/react'
import { waitForWithTimeoutFakeTimers } from '../../test/utils/waitForWithTimeout'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from '../storage'

// Use fake timers version since this test suite uses jest.useFakeTimers()
const waitForWithTimeout = waitForWithTimeoutFakeTimers

jest.mock('../storage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - Method Expressions', () => {
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
    is_official: false,
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

  describe('Sort callback - arrow function', () => {
    it('should execute sort callback with arrow function syntax', async () => {
      const agents = [
        { ...mockAgent, id: 'agent-1', name: 'Zebra Agent', is_official: false },
        { ...mockAgent, id: 'agent-2', name: 'Alpha Agent', is_official: false },
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

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Sort callback should execute (arrow function)
      expect(result.current.agents[0].name).toBe('Alpha Agent')
      expect(result.current.agents[1].name).toBe('Zebra Agent')
    })

    it('should verify sort callback compares aIsOfficial and bIsOfficial', async () => {
      const agents = [
        { ...mockAgent, id: 'agent-1', name: 'Unofficial Agent', is_official: false },
        { ...mockAgent, id: 'agent-2', name: 'Official Agent', is_official: true },
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

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Sort callback should compare is_official values
      expect(result.current.agents[0].is_official).toBe(true)
      expect(result.current.agents[1].is_official).toBe(false)
    })

    it('should verify sort callback uses subtraction operator (bIsOfficial - aIsOfficial)', async () => {
      const agents = [
        { ...mockAgent, id: 'agent-1', is_official: false },
        { ...mockAgent, id: 'agent-2', is_official: true },
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

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should sort official first (bIsOfficial - aIsOfficial = 1 - 0 = 1, positive means b comes first)
      expect(result.current.agents[0].is_official).toBe(true)
    })

    it('should verify sort callback uses subtraction operator (dateB - dateA)', async () => {
      const agents = [
        { ...mockAgent, id: 'agent-1', published_at: '2024-01-01T00:00:00Z' },
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

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should sort by date descending (dateB - dateA, positive means b comes first)
      expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z')
      expect(result.current.agents[1].published_at).toBe('2024-01-01T00:00:00Z')
    })

    it('should verify sort callback uses localeCompare method', async () => {
      const agents = [
        { ...mockAgent, id: 'agent-1', name: 'Zebra Agent' },
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

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should use localeCompare for alphabetical sort
      expect(result.current.agents[0].name).toBe('Alpha Agent')
      expect(result.current.agents[1].name).toBe('Zebra Agent')
    })
  })

  describe('Filter callback - arrow function', () => {
    it('should execute filter callback with arrow function syntax', async () => {
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

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Filter callback should execute (arrow function)
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].category).toBe('automation')
    })

    it('should verify filter callback uses toLowerCase() method', async () => {
      const agents = [
        { ...mockAgent, name: 'Test Agent', description: 'Description', tags: ['test'] },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: 'TEST', // Uppercase
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Filter should use toLowerCase() for case-insensitive matching
      expect(result.current.agents.length).toBe(1)
    })

    it('should verify filter callback uses includes() method', async () => {
      const agents = [
        { ...mockAgent, name: 'Test Agent', description: 'Other', tags: ['other'] },
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

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Filter should use includes() method
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].name).toBe('Test Agent')
    })

    it('should verify filter callback uses some() method on tags', async () => {
      const agents = [
        { ...mockAgent, name: 'Agent One', description: 'Description', tags: ['test', 'automation'] },
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

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Filter should use tags.some() method
      expect(result.current.agents.length).toBe(1)
    })
  })

  describe('Map callback - arrow function', () => {
    it('should execute map callback with arrow function syntax', async () => {
      const agents = [
        { ...mockAgent, author_id: null },
        { ...mockAgent, id: 'agent-2', author_id: null },
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

      await waitForWithTimeout(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
      })

      // Map callback should execute (arrow function)
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData.length).toBe(2)
      expect(savedData[0].author_id).toBe('user-1')
      expect(savedData[1].author_id).toBe('user-1')
    })

    it('should verify map callback returns updated agent object', async () => {
      const agents = [
        { ...mockAgent, author_id: null },
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

      await waitForWithTimeout(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
      })

      // Map callback should return new object with updated author_id
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0]).toHaveProperty('author_id', 'user-1')
      expect(savedData[0]).toHaveProperty('author_name', 'testuser')
      expect(savedData[0]).toHaveProperty('id', 'agent-1')
    })
  })

  describe('Method chaining - toLowerCase().includes()', () => {
    it('should verify method chaining works correctly', async () => {
      const agents = [
        { ...mockAgent, name: 'Test Agent', description: 'Description', tags: ['test'] },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: 'TEST',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Method chaining: searchQuery.toLowerCase().includes() and a.name.toLowerCase().includes()
      expect(result.current.agents.length).toBe(1)
    })

    it('should verify method chaining with tags', async () => {
      const agents = [
        { ...mockAgent, name: 'Agent', description: 'Description', tags: ['TEST'] },
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

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Method chaining: tag.toLowerCase().includes(query)
      expect(result.current.agents.length).toBe(1)
    })
  })

  describe('Date method - new Date().getTime()', () => {
    it('should verify new Date().getTime() is used for date comparison', async () => {
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

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should use new Date().getTime() for timestamp conversion
      expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z')
      expect(result.current.agents[1].published_at).toBe('2024-01-01T00:00:00Z')
    })

    it('should verify new Date() constructor is called', async () => {
      const agents = [
        { ...mockAgent, published_at: '2024-01-01T00:00:00Z' },
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

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should create Date object and call getTime()
      expect(result.current.agents.length).toBe(1)
    })
  })

  describe('String method - localeCompare()', () => {
    it('should verify localeCompare() is used for alphabetical sort', async () => {
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

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should use localeCompare() for alphabetical comparison
      expect(result.current.agents[0].name).toBe('Alpha Agent')
      expect(result.current.agents[1].name).toBe('Zebra Agent')
    })

    it('should verify localeCompare() handles empty string names', async () => {
      const agents = [
        { ...mockAgent, name: '' },
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

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should handle empty string (uses || '')
      expect(result.current.agents.length).toBe(2)
    })
  })

  describe('Array method - some() callback', () => {
    it('should verify some() callback is arrow function in workflow detection', async () => {
      const mockTemplate: any = {
        id: 'template-1',
        name: 'Test Template',
        description: 'Test Description',
        category: 'automation',
        tags: ['workflow', 'test'],
      }
      const template = { ...mockTemplate, id: 'template-1', tags: ['workflow', 'test'] }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [template],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{
            // Node with workflow reference via tags
            // The check includes: workflow.tags && workflow.tags.some(tag => tag.toLowerCase().includes('workflow'))
            // Since tags include 'workflow', this should match
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

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 3000 })

      // some() callback should be arrow function: tag => tag.toLowerCase().includes('workflow')
      // The workflow.tags.some() check should detect 'workflow' tag
      // Even if node is empty, the tags check should trigger
      expect(mockHttpClient.post).toHaveBeenCalled()
      
      // Verify workflow was added (tags include 'workflow')
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })

    it('should verify some() callback uses toLowerCase().includes() in tags check', async () => {
      const agents = [
        { ...mockAgent, tags: ['TEST', 'automation'] },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: 'test', // lowercase
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // some() callback should use toLowerCase().includes()
      // Filter uses: a.tags.some(tag => tag.toLowerCase().includes(query))
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].tags).toContain('TEST')
    })
  })
})
