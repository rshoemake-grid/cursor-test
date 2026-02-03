/**
 * Initialization Tests for useMarketplaceData hook
 * Targets no-coverage mutants in initialization and default values
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from './useLocalStorage'
import { STORAGE_KEYS } from '../config/constants'

jest.mock('./useLocalStorage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - Initialization', () => {
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
  })

  describe('Initial state values', () => {
    it('should initialize templates as empty array', () => {
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

      // Verify initial state is exactly empty array (not undefined, not null)
      expect(result.current.templates).toEqual([])
      expect(result.current.templates).toBeInstanceOf(Array)
      expect(result.current.templates.length).toBe(0)
    })

    it('should initialize workflowsOfWorkflows as empty array', () => {
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

      // Verify initial state is exactly empty array
      expect(result.current.workflowsOfWorkflows).toEqual([])
      expect(result.current.workflowsOfWorkflows).toBeInstanceOf(Array)
      expect(result.current.workflowsOfWorkflows.length).toBe(0)
    })

    it('should initialize agents as empty array', () => {
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

      // Verify initial state is exactly empty array
      expect(result.current.agents).toEqual([])
      expect(result.current.agents).toBeInstanceOf(Array)
      expect(result.current.agents.length).toBe(0)
    })

    it('should initialize repositoryAgents as empty array', () => {
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

      // Verify initial state is exactly empty array
      expect(result.current.repositoryAgents).toEqual([])
      expect(result.current.repositoryAgents).toBeInstanceOf(Array)
      expect(result.current.repositoryAgents.length).toBe(0)
    })

    it('should initialize loading as true', async () => {
      mockGetLocalStorageItem.mockReturnValue([])
      // Delay the response to verify loading state
      let resolvePromise: (value: any) => void
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      
      mockHttpClient.get.mockImplementation(() => delayedPromise)

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

      // Verify loading starts as true
      expect(result.current.loading).toBe(true)
      expect(typeof result.current.loading).toBe('boolean')

      // Resolve the promise to allow test to complete
      resolvePromise!({ json: async () => [] })
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('Default empty array handling', () => {
    it('should use empty array when getLocalStorageItem returns undefined', async () => {
      mockGetLocalStorageItem.mockReturnValue(undefined as any)

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

      // Should use empty array default
      expect(result.current.agents).toEqual([])
      expect(result.current.agents.length).toBe(0)
    })

    it('should use empty array when getLocalStorageItem returns null', async () => {
      mockGetLocalStorageItem.mockReturnValue(null as any)

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

      // Should use empty array default
      expect(result.current.agents).toEqual([])
      expect(result.current.agents.length).toBe(0)
    })

    it('should use empty array when storage.getItem returns null', async () => {
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

      // Should use empty array default (from ternary: savedAgents ? JSON.parse(savedAgents) : [])
      expect(result.current.repositoryAgents).toEqual([])
      expect(result.current.repositoryAgents.length).toBe(0)
    })

    it('should use empty array when storage.getItem returns empty string', async () => {
      mockStorage.getItem.mockReturnValue('')

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

      // Empty string is falsy, should use empty array default
      expect(result.current.repositoryAgents).toEqual([])
      expect(result.current.repositoryAgents.length).toBe(0)
    })

    it('should initialize workflowsOfWorkflows array in fetchWorkflowsOfWorkflows', async () => {
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
      expect(result.current.workflowsOfWorkflows).toBeInstanceOf(Array)
      expect(result.current.workflowsOfWorkflows.length).toBe(0)
    })

    it('should handle empty array operations correctly', async () => {
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

      // Empty array should handle filter operations
      expect(result.current.agents).toEqual([])
      
      // Empty array should handle sort operations
      expect(result.current.agents.length).toBe(0)
    })
  })

  describe('Array identity and operations', () => {
    it('should verify empty arrays are truly empty (not [undefined])', async () => {
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

      // Verify array is truly empty (not [undefined] or [null])
      expect(result.current.agents).toEqual([])
      expect(result.current.agents[0]).toBeUndefined()
      expect(result.current.agents.length).toBe(0)
    })

    it('should verify array operations work on empty arrays', async () => {
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
      const filtered = result.current.agents.filter(() => true)
      expect(filtered).toEqual([])
      expect(filtered.length).toBe(0)

      // Map on empty array should return empty array
      const mapped = result.current.agents.map(() => ({}))
      expect(mapped).toEqual([])
      expect(mapped.length).toBe(0)

      // Sort on empty array should return empty array
      const sorted = [...result.current.agents].sort()
      expect(sorted).toEqual([])
      expect(sorted.length).toBe(0)
    })
  })
})
