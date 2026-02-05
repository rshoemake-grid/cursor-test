/**
 * URL Parameter Tests for useMarketplaceData hook
 * Phase 4.2: Tests for URLSearchParams and parameter construction
 * Targets surviving mutants in URL building logic
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'

describe('useMarketplaceData - URL Parameters (Phase 4.2)', () => {
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

  describe('URLSearchParams construction - new URLSearchParams()', () => {
    it('should create new URLSearchParams instance', async () => {
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

      // Should create: const params = new URLSearchParams()
      expect(mockHttpClient.get).toHaveBeenCalled()
      const callUrl = mockHttpClient.get.mock.calls[0][0]
      expect(callUrl).toContain('?')
      expect(callUrl).toContain('sort_by=popular')
    })
  })

  describe('params.append - category parameter', () => {
    it('should append category when category is truthy', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [],
      })

      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: 'automation', // Truthy
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

      // Should execute: if (category) params.append('category', category)
      const callUrl = mockHttpClient.get.mock.calls[0][0]
      expect(callUrl).toContain('category=automation')
    })

    it('should NOT append category when category is falsy', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [],
      })

      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '', // Falsy
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

      // Should NOT execute: if (category) params.append('category', category)
      const callUrl = mockHttpClient.get.mock.calls[0][0]
      expect(callUrl).not.toContain('category=')
    })
  })

  describe('params.append - search parameter', () => {
    it('should append search when searchQuery is truthy', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [],
      })

      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: 'test query', // Truthy
          sortBy: 'popular',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'workflows',
        })
      )

      await waitFor(() => {
        expect(mockHttpClient.get).toHaveBeenCalled()
      })

      // Should execute: if (searchQuery) params.append('search', searchQuery)
      const callUrl = mockHttpClient.get.mock.calls[0][0]
      // URLSearchParams encodes spaces, check for search parameter
      expect(callUrl).toMatch(/search=(test|test%20query|test\+query)/)
    })

    it('should NOT append search when searchQuery is falsy', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [],
      })

      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '', // Falsy
          sortBy: 'popular',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'workflows',
        })
      )

      await waitFor(() => {
        expect(mockHttpClient.get).toHaveBeenCalled()
      })

      // Should NOT execute: if (searchQuery) params.append('search', searchQuery)
      const callUrl = mockHttpClient.get.mock.calls[0][0]
      expect(callUrl).not.toContain('search=')
    })
  })

  describe('params.append - sort_by parameter (always appended)', () => {
    it('should always append sort_by parameter', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [],
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

      // Should always execute: params.append('sort_by', sortBy)
      const callUrl = mockHttpClient.get.mock.calls[0][0]
      expect(callUrl).toContain('sort_by=popular')
    })

    it('should append sort_by with different values', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [],
      })

      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'recent', // Different value
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'workflows',
        })
      )

      await waitFor(() => {
        expect(mockHttpClient.get).toHaveBeenCalled()
      })

      // Should execute: params.append('sort_by', sortBy)
      const callUrl = mockHttpClient.get.mock.calls[0][0]
      expect(callUrl).toContain('sort_by=recent')
    })
  })

  describe('URL construction - template literal with params', () => {
    it('should construct URL with query parameters', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [],
      })

      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: 'automation',
          searchQuery: 'test',
          sortBy: 'popular',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'workflows',
        })
      )

      await waitFor(() => {
        expect(mockHttpClient.get).toHaveBeenCalled()
      })

      // Should construct: `${apiBaseUrl}/templates/?${params}`
      const callUrl = mockHttpClient.get.mock.calls[0][0]
      expect(callUrl).toContain('http://api.test/templates/')
      expect(callUrl).toContain('?')
      expect(callUrl).toContain('category=automation')
      expect(callUrl).toContain('search=test')
      expect(callUrl).toContain('sort_by=popular')
    })

    it('should construct URL with only sort_by when category and searchQuery are empty', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [],
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

      // Should construct URL with only sort_by
      const callUrl = mockHttpClient.get.mock.calls[0][0]
      expect(callUrl).toContain('http://api.test/templates/')
      expect(callUrl).toContain('sort_by=popular')
      expect(callUrl).not.toContain('category=')
      expect(callUrl).not.toContain('search=')
    })
  })

  describe('URL construction - workflow use endpoint', () => {
    it('should construct workflow use endpoint URL', async () => {
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
      }, { timeout: 3000 })

      // Should construct: `${apiBaseUrl}/templates/${workflow.id}/use`
      const callUrl = mockHttpClient.post.mock.calls[0][0]
      expect(callUrl).toContain('http://api.test/templates/template-1/use')
    })
  })
})
