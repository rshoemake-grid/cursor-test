/**
 * HTTP Method Tests for useMarketplaceData hook
 * Phase 4.2: Tests for HTTP client method calls and options
 * Targets surviving mutants in HTTP request construction
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'

describe('useMarketplaceData - HTTP Methods (Phase 4.2)', () => {
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

  describe('httpClient.get method call', () => {
    it('should call httpClient.get with correct URL', async () => {
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

      // Should call: httpClient.get(`${apiBaseUrl}/templates/?${params}`)
      expect(mockHttpClient.get).toHaveBeenCalled()
      const callUrl = mockHttpClient.get.mock.calls[0][0]
      expect(callUrl).toContain('http://api.test/templates/')
    })

    it('should verify get method is called (not post)', async () => {
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

      // Should use get method, not post
      expect(mockHttpClient.get).toHaveBeenCalled()
      expect(mockHttpClient.post).not.toHaveBeenCalled()
    })
  })

  describe('httpClient.post method call', () => {
    it('should call httpClient.post with correct URL and options', async () => {
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
      }, { timeout: 3000 })

      // Should call: httpClient.post(`${apiBaseUrl}/templates/${workflow.id}/use`, {}, { 'Content-Type': 'application/json' })
      expect(mockHttpClient.post).toHaveBeenCalled()
      const callArgs = mockHttpClient.post.mock.calls[0]
      expect(callArgs[0]).toContain('http://api.test/templates/template-1/use')
      expect(callArgs[1]).toEqual({})
      expect(callArgs[2]).toEqual({ 'Content-Type': 'application/json' })
    })

    it('should verify post method is called with empty body object', async () => {
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
      }, { timeout: 3000 })

      // Should pass empty object as body: httpClient.post(url, {}, options)
      const callArgs = mockHttpClient.post.mock.calls[0]
      expect(callArgs[1]).toEqual({}) // Empty object
    })

    it('should verify Content-Type header is set correctly', async () => {
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
      }, { timeout: 3000 })

      // Should set: { 'Content-Type': 'application/json' }
      const callArgs = mockHttpClient.post.mock.calls[0]
      expect(callArgs[2]).toHaveProperty('Content-Type', 'application/json')
    })
  })

  describe('response.json() method call', () => {
    it('should call response.json() on get response', async () => {
      const mockJson = jest.fn().mockResolvedValue([])
      mockHttpClient.get.mockResolvedValue({
        json: mockJson,
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

      // Should call: const data = await response.json()
      expect(mockJson).toHaveBeenCalled()
    })

    it('should call response.json() on post response', async () => {
      const template = {
        id: 'template-1',
        name: 'Template',
        description: 'Description',
        tags: [],
      }
      const mockJson = jest.fn().mockResolvedValue({ nodes: [] })
      mockHttpClient.get.mockResolvedValue({
        json: async () => [template],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: mockJson,
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
      }, { timeout: 3000 })

      // Should call: const workflowDetail = await workflowResponse.json()
      expect(mockJson).toHaveBeenCalled()
    })
  })

  describe('response.ok property check', () => {
    it('should check response.ok property', async () => {
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
        ok: true, // Should check this property
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
      }, { timeout: 3000 })

      // Should check: if (workflowResponse.ok)
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should NOT process when response.ok is false', async () => {
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
        ok: false, // Not ok
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
      }, { timeout: 3000 })

      // Should check: if (workflowResponse.ok) - when false, inner block shouldn't execute
      expect(mockHttpClient.post).toHaveBeenCalled()
      // Should not add workflow since ok is false
      expect(result.current.workflowsOfWorkflows.length).toBe(0)
    })
  })
})
