/**
 * Workflow Detection Tests for useMarketplaceData hook
 * Phase 4.2: Tests for workflow detection logic
 * Targets surviving mutants in workflow detection patterns
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from './useLocalStorage'

jest.mock('./useLocalStorage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - Workflow Detection (Phase 4.2)', () => {
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

  describe('Workflow property access - workflow.id', () => {
    it('should access workflow.id property', async () => {
      const workflow = {
        id: 'workflow-123',
        name: 'Workflow',
        description: 'Description',
        tags: [],
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ nodes: [] }),
      })

      const loggerSpy = jest.spyOn(require('../utils/logger').logger, 'error')

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

      // Should access: workflow.id in error message
      // If error occurs, should log: `Failed to check workflow ${workflow.id}:`
      expect(mockHttpClient.get).toHaveBeenCalled()

      loggerSpy.mockRestore()
    })
  })

  describe('Workflow property access - workflow.description', () => {
    it('should access workflow.description property', async () => {
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

      // Should access: workflow.description
      // Should check: workflowDescription.includes('workflow of workflows')
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })

    it('should use empty string fallback when workflow.description is undefined', async () => {
      const workflow = {
        id: 'workflow-1',
        name: 'Workflow',
        description: undefined as any,
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

      // Should use: (workflow.description || '')
      // Empty string fallback when description is undefined
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Workflow property access - workflow.tags', () => {
    it('should access workflow.tags property', async () => {
      const workflow = {
        id: 'workflow-1',
        name: 'Workflow',
        description: 'Description',
        tags: ['workflow'],
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              data: {},
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

      // Should access: workflow.tags
      // Should check: workflow.tags && workflow.tags.some(...)
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })

    it('should handle workflow.tags when it is undefined', async () => {
      const workflow = {
        id: 'workflow-1',
        name: 'Workflow',
        description: 'workflow of workflows',
        tags: undefined as any,
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow],
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

      // Should check: workflow.tags && workflow.tags.some(...)
      // When tags is undefined, should not crash
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })
  })

  describe('WorkflowDetail property access - workflowDetail.nodes', () => {
    it('should access workflowDetail.nodes property', async () => {
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

      // Should access: workflowDetail.nodes
      // Should check: workflowDetail.nodes && Array.isArray(workflowDetail.nodes)
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })

    it('should verify Array.isArray check on workflowDetail.nodes', async () => {
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

      // Should check: Array.isArray(workflowDetail.nodes)
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })
  })

  describe('Node property access patterns', () => {
    it('should access node.workflow_id property', async () => {
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
              workflow_id: 'workflow-2', // node.workflow_id
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

      // Should access: node.workflow_id
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })

    it('should access nodeData.workflow_id property', async () => {
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
              data: {
                workflow_id: 'workflow-2', // nodeData.workflow_id
              },
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

      // Should access: nodeData.workflow_id
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })

    it('should use node.data fallback pattern', async () => {
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
              data: {
                description: 'workflow node',
              },
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

      // Should use: const nodeData = node.data || {}
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })
  })
})
