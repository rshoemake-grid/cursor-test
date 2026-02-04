/**
 * Complex Pattern Tests for useMarketplaceData hook
 * Targets complex nested conditionals, OR chains, and edge cases
 * Tests workflow detection logic with all combinations
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from './useLocalStorage'

jest.mock('./useLocalStorage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - Complex Patterns', () => {
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

  describe('Complex OR chain - workflow detection (hasWorkflowId || description.includes || name.includes || tags.some)', () => {
    it('should detect workflow when only hasWorkflowId is true', async () => {
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
            workflow_id: 'workflow-123', // Only this condition is true
            description: 'other',
            name: 'other',
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

      // Should detect workflow via hasWorkflowId (first OR condition)
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })

    it('should detect workflow when only nodeData.workflow_id is true', async () => {
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
            data: { workflow_id: 'workflow-123' }, // Only nodeData.workflow_id is true
            description: 'other',
            name: 'other',
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

      // Should detect workflow via nodeData.workflow_id (second hasWorkflowId check)
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })

    it('should detect workflow when only description.includes is true', async () => {
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
            description: 'This is a workflow reference', // Only this condition is true
            name: 'other',
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

      // Should detect workflow via description.includes('workflow') (third OR condition)
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })

    it('should detect workflow when only nodeData.description.includes is true', async () => {
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
            data: { description: 'This is a workflow reference' }, // Only nodeData.description is true
            name: 'other',
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

      // Should detect workflow via nodeData.description.includes('workflow')
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })

    it('should detect workflow when only name.includes is true', async () => {
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
            name: 'Workflow Node', // Only this condition is true
            description: 'other',
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

      // Should detect workflow via name.includes('workflow') (fourth OR condition)
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })

    it('should detect workflow when only nodeData.name.includes is true', async () => {
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
            data: { name: 'Workflow Node' }, // Only nodeData.name is true
            description: 'other',
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

      // Should detect workflow via nodeData.name.includes('workflow')
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })

    it('should detect workflow when only tags.some is true', async () => {
      const template = {
        id: 'template-1',
        name: 'Template',
        description: 'Description',
        tags: ['workflow'], // Only tags.some condition is true
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [template],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{
            // No workflow_id, description, or name
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

      // Should detect workflow via tags.some (fifth OR condition)
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })

    it('should detect workflow when multiple OR conditions are true', async () => {
      const template = {
        id: 'template-1',
        name: 'Template',
        description: 'Description',
        tags: ['workflow'],
      }
      mockHttpClient.get.mockResolvedValue({
        json: async () => [template],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{
            workflow_id: 'workflow-123', // Multiple conditions true
            description: 'workflow reference',
            name: 'workflow node',
            data: { workflow_id: 'workflow-456' },
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

      // Should detect workflow when multiple OR conditions are true
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })
  })

  describe('Complex OR chain - isWorkflowOfWorkflows detection', () => {
    it('should detect when workflowDescription.includes("workflow of workflows") is true', async () => {
      const template = {
        id: 'template-1',
        name: 'Template',
        description: 'This is a workflow of workflows', // Only first condition
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

      // Should detect via workflowDescription.includes('workflow of workflows')
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })

    it('should detect when workflowDescription.includes("composite workflow") is true', async () => {
      const template = {
        id: 'template-1',
        name: 'Template',
        description: 'This is a composite workflow', // Only second condition
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

      // Should detect via workflowDescription.includes('composite workflow')
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })

    it('should detect when workflowDescription.includes("nested workflow") is true', async () => {
      const template = {
        id: 'template-1',
        name: 'Template',
        description: 'This is a nested workflow', // Only third condition
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

      // Should detect via workflowDescription.includes('nested workflow')
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })

    it('should detect when tags.some includes "workflow-of-workflows"', async () => {
      const template = {
        id: 'template-1',
        name: 'Template',
        description: 'Description',
        tags: ['workflow-of-workflows'], // Only fourth condition (first tag check)
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

      // Should detect via tags.some(tag => tag.toLowerCase().includes('workflow-of-workflows'))
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })

    it('should detect when tags.some includes "composite"', async () => {
      const template = {
        id: 'template-1',
        name: 'Template',
        description: 'Description',
        tags: ['composite'], // Only fifth condition (second tag check)
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

      // Should detect via tags.some(tag => tag.toLowerCase().includes('composite'))
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })

    it('should detect when tags.some includes "nested"', async () => {
      const template = {
        id: 'template-1',
        name: 'Template',
        description: 'Description',
        tags: ['nested'], // Only sixth condition (third tag check)
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

      // Should detect via tags.some(tag => tag.toLowerCase().includes('nested'))
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })
  })

  describe('Complex filter OR chain - search filter (name.includes || description.includes || tags.some)', () => {
    it('should filter when only name.includes is true', async () => {
      const { getLocalStorageItem } = require('./useLocalStorage')
      getLocalStorageItem.mockReturnValue([
        {
          id: 'agent-1',
          name: 'Test Agent',
          description: 'Other',
          tags: ['other'],
          category: 'automation',
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
          searchQuery: 'Test', // Only name.includes will match
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should filter via name.includes (first OR condition)
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].name).toBe('Test Agent')
    })

    it('should filter when only description.includes is true', async () => {
      mockGetLocalStorageItem.mockReturnValue([
        {
          id: 'agent-1',
          name: 'Agent',
          description: 'Test Description',
          tags: ['other'],
          category: 'automation',
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
          searchQuery: 'Test', // Only description.includes will match
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should filter via description.includes (second OR condition)
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].description).toBe('Test Description')
    })

    it('should filter when only tags.some is true', async () => {
      const { getLocalStorageItem } = require('./useLocalStorage')
      getLocalStorageItem.mockReturnValue([
        {
          id: 'agent-1',
          name: 'Agent',
          description: 'Description',
          tags: ['test'], // Only tags.some will match
          category: 'automation',
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
          searchQuery: 'test', // Only tags.some will match
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should filter via tags.some (third OR condition)
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].tags).toContain('test')
    })
  })

  describe('Nested conditionals - sort logic', () => {
    it('should handle sort when aIsOfficial !== bIsOfficial (official first)', async () => {
      mockGetLocalStorageItem.mockReturnValue([
        {
          id: 'agent-1',
          name: 'Unofficial',
          is_official: false,
          published_at: '2024-01-02T00:00:00Z',
          category: 'automation',
          tags: [],
        },
        {
          id: 'agent-2',
          name: 'Official',
          is_official: true,
          published_at: '2024-01-01T00:00:00Z',
          category: 'automation',
          tags: [],
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

      // Should sort official first (aIsOfficial !== bIsOfficial branch)
      expect(result.current.agents[0].is_official).toBe(true)
      expect(result.current.agents[1].is_official).toBe(false)
    })

    it('should handle sort when aIsOfficial === bIsOfficial and sortBy === "popular"', async () => {
      mockGetLocalStorageItem.mockReturnValue([
        {
          id: 'agent-1',
          name: 'Agent 1',
          is_official: false,
          published_at: '2024-01-01T00:00:00Z',
          category: 'automation',
          tags: [],
        },
        {
          id: 'agent-2',
          name: 'Agent 2',
          is_official: false,
          published_at: '2024-01-02T00:00:00Z',
          category: 'automation',
          tags: [],
        },
      ])

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular', // Should use date sort
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should sort by date descending (sortBy === 'popular' branch)
      expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z')
      expect(result.current.agents[1].published_at).toBe('2024-01-01T00:00:00Z')
    })

    it('should handle sort when aIsOfficial === bIsOfficial and sortBy === "recent"', async () => {
      const { getLocalStorageItem } = require('./useLocalStorage')
      getLocalStorageItem.mockReturnValue([
        {
          id: 'agent-1',
          name: 'Agent 1',
          is_official: false,
          published_at: '2024-01-01T00:00:00Z',
          category: 'automation',
          tags: [],
        },
        {
          id: 'agent-2',
          name: 'Agent 2',
          is_official: false,
          published_at: '2024-01-02T00:00:00Z',
          category: 'automation',
          tags: [],
        },
      ])

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'recent', // Should use date sort
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should sort by date descending (sortBy === 'recent' branch)
      expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z')
      expect(result.current.agents[1].published_at).toBe('2024-01-01T00:00:00Z')
    })

    it('should handle sort when aIsOfficial === bIsOfficial and sortBy is neither popular nor recent', async () => {
      mockGetLocalStorageItem.mockReturnValue([
        {
          id: 'agent-1',
          name: 'Zebra Agent',
          is_official: false,
          published_at: '2024-01-01T00:00:00Z',
          category: 'automation',
          tags: [],
        },
        {
          id: 'agent-2',
          name: 'Alpha Agent',
          is_official: false,
          published_at: '2024-01-02T00:00:00Z',
          category: 'automation',
          tags: [],
        },
      ])

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'alphabetical', // Should use localeCompare
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should sort alphabetically (default branch)
      expect(result.current.agents[0].name).toBe('Alpha Agent')
      expect(result.current.agents[1].name).toBe('Zebra Agent')
    })
  })
})
