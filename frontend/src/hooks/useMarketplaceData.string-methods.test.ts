/**
 * String Method Tests for useMarketplaceData hook
 * Phase 4.2: Tests for string method operations
 * Targets surviving mutants in string method calls
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from './useLocalStorage'

jest.mock('./useLocalStorage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - String Methods (Phase 4.2)', () => {
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

  describe('String method - toLowerCase()', () => {
    it('should call toLowerCase() on searchQuery', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Test Agent',
          description: 'Description',
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
          searchQuery: 'TEST', // Should call toLowerCase()
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: searchQuery.toLowerCase()
      // 'TEST' should match 'Test Agent' after toLowerCase()
      expect(result.current.agents.length).toBe(1)
    })

    it('should call toLowerCase() on name property', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Test Agent',
          description: 'Description',
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
          searchQuery: 'test', // Should call a.name.toLowerCase()
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: a.name.toLowerCase().includes(query)
      expect(result.current.agents.length).toBe(1)
    })

    it('should call toLowerCase() on description property', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          description: 'Test Description',
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
          searchQuery: 'description', // Should call a.description.toLowerCase()
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: a.description.toLowerCase().includes(query)
      expect(result.current.agents.length).toBe(1)
    })

    it('should call toLowerCase() on tag strings', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          description: 'Description',
          category: 'automation',
          tags: ['TEST-TAG'],
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
          searchQuery: 'test-tag', // Should call tag.toLowerCase()
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: tag.toLowerCase().includes(query)
      expect(result.current.agents.length).toBe(1)
    })

    it('should call toLowerCase() on workflow description', async () => {
      const workflow = {
        id: 'workflow-1',
        name: 'Workflow',
        description: 'WORKFLOW OF WORKFLOWS',
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

      // Should call: (workflow.description || '').toLowerCase()
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })

    it('should call toLowerCase() on node description', async () => {
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
              data: { description: 'WORKFLOW NODE' },
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

      // Should call: (node.description || nodeData.description || '').toLowerCase()
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })

    it('should call toLowerCase() on node name', async () => {
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
              data: { name: 'WORKFLOW NODE' },
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

      // Should call: (node.name || nodeData.name || '').toLowerCase()
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })
  })

  describe('String method - includes()', () => {
    it('should call includes() on name.toLowerCase() result', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Test Agent',
          description: 'Description',
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
          searchQuery: 'test', // Should call name.toLowerCase().includes('test')
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: a.name.toLowerCase().includes(query)
      expect(result.current.agents.length).toBe(1)
    })

    it('should call includes() on description.toLowerCase() result', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          description: 'Test Description',
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
          searchQuery: 'description', // Should call description.toLowerCase().includes('description')
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: a.description.toLowerCase().includes(query)
      expect(result.current.agents.length).toBe(1)
    })

    it('should call includes() on tag.toLowerCase() result', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          description: 'Description',
          category: 'automation',
          tags: ['test-tag'],
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
          searchQuery: 'test', // Should call tag.toLowerCase().includes('test')
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: tag.toLowerCase().includes(query)
      expect(result.current.agents.length).toBe(1)
    })

    it('should call includes() with exact string "workflow"', async () => {
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
              data: { description: 'workflow node' },
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

      // Should call: description.includes('workflow')
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })

    it('should call includes() with exact string "workflow of workflows"', async () => {
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

      // Should call: workflowDescription.includes('workflow of workflows')
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })

    it('should call includes() with exact string "composite workflow"', async () => {
      const workflow = {
        id: 'workflow-1',
        name: 'Workflow',
        description: 'composite workflow',
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

      // Should call: workflowDescription.includes('composite workflow')
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })

    it('should call includes() with exact string "nested workflow"', async () => {
      const workflow = {
        id: 'workflow-1',
        name: 'Workflow',
        description: 'nested workflow',
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

      // Should call: workflowDescription.includes('nested workflow')
      expect(result.current.workflowsOfWorkflows.length).toBe(1)
    })
  })
})
