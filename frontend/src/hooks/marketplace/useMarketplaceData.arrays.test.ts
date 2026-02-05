/**
 * Array Declaration Tests for useMarketplaceData hook
 * Targets surviving ArrayDeclaration mutants (~6 mutants)
 * Tests empty array handling and array operations
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from '../storage'
import { STORAGE_KEYS } from '../../config/constants'

jest.mock('../storage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - Array Declarations', () => {
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

  describe('Empty array initialization', () => {
    it('should initialize templates as truly empty array (not [undefined])', () => {
      mockGetLocalStorageItem.mockReturnValue([])

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

      // Verify array is truly empty
      expect(result.current.templates).toEqual([])
      expect(result.current.templates.length).toBe(0)
      expect(result.current.templates[0]).toBeUndefined()
    })

    it('should initialize workflowsOfWorkflows as truly empty array', () => {
      mockGetLocalStorageItem.mockReturnValue([])

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

      expect(result.current.workflowsOfWorkflows).toEqual([])
      expect(result.current.workflowsOfWorkflows.length).toBe(0)
    })

    it('should initialize agents as truly empty array', () => {
      mockGetLocalStorageItem.mockReturnValue([])

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

      expect(result.current.agents).toEqual([])
      expect(result.current.agents.length).toBe(0)
    })

    it('should initialize repositoryAgents as truly empty array', () => {
      mockGetLocalStorageItem.mockReturnValue([])

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

      expect(result.current.repositoryAgents).toEqual([])
      expect(result.current.repositoryAgents.length).toBe(0)
    })
  })

  describe('Array operations on empty arrays', () => {
    it('should handle filter on empty array', async () => {
      mockGetLocalStorageItem.mockReturnValue([])

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: 'automation',
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

      // Filter on empty array should return empty array
      expect(result.current.agents).toEqual([])
      expect(result.current.agents.length).toBe(0)
    })

    it('should handle map on empty array', async () => {
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

      // Map on empty array should return empty array
      expect(result.current.agents).toEqual([])
      expect(result.current.agents.length).toBe(0)
    })

    it('should handle sort on empty array', async () => {
      mockGetLocalStorageItem.mockReturnValue([])

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

      // Sort on empty array should return empty array
      expect(result.current.agents).toEqual([])
      expect(result.current.agents.length).toBe(0)
    })

    it('should handle some() on empty array (tags)', async () => {
      const agents = [
        { ...mockAgent, name: 'Agent One', description: 'Description One', tags: [] }, // Empty tags array
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: 'nonexistent',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Empty tags array should not match search (name/description also don't match)
      expect(result.current.agents.length).toBe(0)
    })
  })

  describe('Array identity matters', () => {
    it('should verify empty array is not null', async () => {
      mockGetLocalStorageItem.mockReturnValue([])

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

      // Array is not null
      expect(result.current.agents).not.toBeNull()
      expect(result.current.agents).toBeInstanceOf(Array)
    })

    it('should verify empty array is not undefined', async () => {
      mockGetLocalStorageItem.mockReturnValue([])

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

      // Array is not undefined
      expect(result.current.agents).not.toBeUndefined()
      expect(result.current.agents).toBeInstanceOf(Array)
    })

    it('should verify array operations require array type', async () => {
      mockGetLocalStorageItem.mockReturnValue([])

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

      // Verify array methods exist
      expect(typeof result.current.agents.filter).toBe('function')
      expect(typeof result.current.agents.map).toBe('function')
      expect(typeof result.current.agents.sort).toBe('function')
      expect(typeof result.current.agents.length).toBe('number')
    })
  })

  describe('Array initialization in fetchWorkflowsOfWorkflows', () => {
    it('should initialize workflowsOfWorkflows array as empty', async () => {
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
      })

      // workflowsOfWorkflows should be initialized as empty array
      expect(result.current.workflowsOfWorkflows).toEqual([])
      expect(result.current.workflowsOfWorkflows.length).toBe(0)
    })

    it('should push to workflowsOfWorkflows array', async () => {
      const template = { ...mockTemplate, id: 'template-1', description: 'workflow of workflows' }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [template],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{
            workflow_id: 'workflow-1', // This should trigger hasWorkflowReference
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
      }, { timeout: 5000 })

      // Should push to array (workflow has workflow_id in nodes OR description matches)
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })
  })

  describe('Array mutations would break functionality', () => {
    it('should fail if [] mutated to [undefined]', async () => {
      mockGetLocalStorageItem.mockReturnValue([])

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

      // Verify array is truly empty (not [undefined])
      expect(result.current.agents).toEqual([])
      expect(result.current.agents[0]).toBeUndefined()
      expect(result.current.agents.length).toBe(0)
    })

    it('should fail if [] mutated to null', async () => {
      mockGetLocalStorageItem.mockReturnValue([])

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

      // Array should not be null
      expect(result.current.agents).not.toBeNull()
      expect(result.current.agents).toBeInstanceOf(Array)
    })
  })
})
