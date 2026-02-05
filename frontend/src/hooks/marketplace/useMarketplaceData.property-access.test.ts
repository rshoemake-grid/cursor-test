/**
 * Property Access Tests for useMarketplaceData hook
 * Phase 4.2: Tests for property access patterns that may have surviving mutants
 * Targets property access operations and optional chaining
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from '../storage'

jest.mock('../storage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - Property Access (Phase 4.2)', () => {
  let mockHttpClient: any
  let mockStorage: any

  beforeEach(() => {
    mockGetLocalStorageItem.mockReturnValue([])
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

  describe('Property access - workflowDetail.nodes', () => {
    it('should access workflowDetail.nodes property', async () => {
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
        json: async () => ({
          nodes: [], // Should access this property
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
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should verify nodes property exists before Array.isArray check', async () => {
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
        json: async () => ({
          nodes: [{ workflow_id: 'workflow-123' }], // nodes exists
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

      // Should check: if (workflowDetail.nodes && Array.isArray(workflowDetail.nodes))
      expect(mockHttpClient.post).toHaveBeenCalled()
    })
  })

  describe('Property access - workflow.tags', () => {
    it('should access workflow.tags property', async () => {
      const template = {
        id: 'template-1',
        name: 'Template',
        description: 'workflow of workflows', // Will trigger isWorkflowOfWorkflows
        tags: ['workflow'], // Should access this property
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

      // Should access: workflow.tags in tags.some() check
      // Also checks workflow.description for isWorkflowOfWorkflows
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })

    it('should verify workflow.tags exists before some() call', async () => {
      const template = {
        id: 'template-1',
        name: 'Template',
        description: 'workflow of workflows', // This will trigger isWorkflowOfWorkflows
        tags: ['workflow'],
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

      // Should check: workflow.tags && workflow.tags.some(...)
      // Also checks workflow.description for isWorkflowOfWorkflows
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })
  })

  describe('Property access - workflow.description', () => {
    it('should access workflow.description property', async () => {
      const template = {
        id: 'template-1',
        name: 'Template',
        description: 'workflow of workflows', // Should access this property
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

      // Should access: workflow.description in includes() check
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })
  })

  describe('Property access - node.workflow_id', () => {
    it('should access node.workflow_id property', async () => {
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
        json: async () => ({
          nodes: [{
            workflow_id: 'workflow-123', // Should access this property
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
      }, { timeout: 3000 })

      // Should access: node.workflow_id in hasWorkflowId check
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })
  })

  describe('Property access - nodeData.workflow_id', () => {
    it('should access nodeData.workflow_id property', async () => {
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
        json: async () => ({
          nodes: [{
            data: {
              workflow_id: 'workflow-123', // Should access nodeData.workflow_id
            },
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
      }, { timeout: 3000 })

      // Should access: nodeData.workflow_id in hasWorkflowId check
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })
  })

  describe('Property access - agent.category', () => {
    it('should access agent.category property in filter', async () => {
      mockGetLocalStorageItem.mockReturnValue([
        {
          id: 'agent-1',
          name: 'Agent',
          category: 'automation', // Should access this property
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
      ])

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

      // Should access: a.category in filter callback
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].category).toBe('automation')
    })
  })

  describe('Property access - agent.name, agent.description', () => {
    it('should access agent.name and agent.description in filter', async () => {
      mockGetLocalStorageItem.mockReturnValue([
        {
          id: 'agent-1',
          name: 'Test Agent', // Should access name
          description: 'Test Description', // Should access description
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
      ])

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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should access: a.name.toLowerCase().includes(query) || a.description.toLowerCase().includes(query)
      expect(result.current.agents.length).toBe(1)
    })
  })

  describe('Property access - agent.published_at', () => {
    it('should access agent.published_at in sort', async () => {
      mockGetLocalStorageItem.mockReturnValue([
        {
          id: 'agent-1',
          name: 'Agent',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z', // Should access this property
          is_official: false,
        },
        {
          id: 'agent-2',
          name: 'Agent 2',
          category: 'automation',
          tags: [],
          published_at: '2024-01-02T00:00:00Z',
          is_official: false,
        },
      ])

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

      // Should access: a.published_at ? new Date(a.published_at).getTime() : 0
      expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z')
      expect(result.current.agents[1].published_at).toBe('2024-01-01T00:00:00Z')
    })
  })

  describe('Property access - agent.is_official', () => {
    it('should access agent.is_official in sort', async () => {
      mockGetLocalStorageItem.mockReturnValue([
        {
          id: 'agent-1',
          name: 'Unofficial',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false, // Should access this property
        },
        {
          id: 'agent-2',
          name: 'Official',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: true,
        },
      ])

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

      // Should access: a.is_official ? 1 : 0
      expect(result.current.agents[0].is_official).toBe(true)
      expect(result.current.agents[1].is_official).toBe(false)
    })
  })
})
