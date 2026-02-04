/**
 * Response.ok Property Tests for useMarketplaceData hook
 * Phase 4.2: Tests for response.ok property checks
 * Targets surviving mutants in response.ok checks
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from './useLocalStorage'

jest.mock('./useLocalStorage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - Response.ok Property (Phase 4.2)', () => {
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

  describe('Response.ok check - workflowResponse.ok', () => {
    it('should check workflowResponse.ok property', async () => {
      const workflow = {
        id: 'workflow-1',
        name: 'Workflow',
        description: 'Description',
        tags: [],
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true, // workflowResponse.ok is true
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
      // When ok is true, should process workflow
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should NOT process when workflowResponse.ok is false', async () => {
      const workflow = {
        id: 'workflow-1',
        name: 'Workflow',
        description: 'Description',
        tags: [],
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: false, // workflowResponse.ok is false
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
      // When ok is false, should NOT process workflow
      expect(mockHttpClient.post).toHaveBeenCalled()
      // Workflow should not be added when ok is false
      expect(result.current.workflowsOfWorkflows.length).toBe(0)
    })

    it('should verify exact property access workflowResponse.ok', async () => {
      const workflow = {
        id: 'workflow-1',
        name: 'Workflow',
        description: 'workflow of workflows',
        tags: [],
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true, // Should access workflowResponse.ok (not workflowResponse.status)
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

      // Should access: workflowResponse.ok (not workflowResponse.status or other properties)
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })
  })

  describe('Response.ok check - conditional execution', () => {
    it('should execute workflow processing when ok is true', async () => {
      const workflow = {
        id: 'workflow-1',
        name: 'Workflow',
        description: 'Description',
        tags: [],
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              workflow_id: 'workflow-2',
            },
          ],
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
      }, { timeout: 3000 })

      // Should execute: if (workflowResponse.ok) { ... process workflow ... }
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })

    it('should skip workflow processing when ok is false', async () => {
      const workflow = {
        id: 'workflow-1',
        name: 'Workflow',
        description: 'workflow of workflows',
        tags: [],
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: false, // Should skip processing
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

      // Should skip: if (workflowResponse.ok) { ... }
      // When ok is false, should not add workflow
      expect(result.current.workflowsOfWorkflows.length).toBe(0)
    })
  })

  describe('Response.ok check - boolean evaluation', () => {
    it('should evaluate ok as boolean true', async () => {
      const workflow = {
        id: 'workflow-1',
        name: 'Workflow',
        description: 'Description',
        tags: [],
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true, // Boolean true
        json: async () => ({
          nodes: [
            {
              workflow_id: 'workflow-2',
            },
          ],
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
      }, { timeout: 3000 })

      // Should evaluate: workflowResponse.ok as boolean
      // true should be truthy
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })

    it('should evaluate ok as boolean false', async () => {
      const workflow = {
        id: 'workflow-1',
        name: 'Workflow',
        description: 'Description',
        tags: [],
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: false, // Boolean false
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

      // Should evaluate: workflowResponse.ok as boolean
      // false should be falsy
      expect(result.current.workflowsOfWorkflows.length).toBe(0)
    })
  })
})
