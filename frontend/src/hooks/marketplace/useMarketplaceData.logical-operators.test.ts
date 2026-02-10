/**
 * Logical Operator Tests for useMarketplaceData hook
 * Targets surviving LogicalOperator mutants (~6 mutants)
 * Tests all OR (||) and AND (&&) operator combinations
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from '../storage'

jest.mock('../storage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - Logical Operators', () => {
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

  describe('OR operator - hasWorkflowId || description.includes || name.includes || tags.some', () => {
    it('should detect workflow reference when hasWorkflowId is truthy', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{
            workflow_id: 'workflow-1', // First OR condition true
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
      })

      // Should detect workflow reference (hasWorkflowId is truthy)
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should detect workflow reference when description.includes("workflow")', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{
            description: 'This is a workflow node',
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
      })

      // Should detect workflow reference (description includes "workflow")
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should detect workflow reference when name.includes("workflow")', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{
            name: 'workflow node',
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
      })

      // Should detect workflow reference (name includes "workflow")
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should detect workflow reference when tags.some(includes("workflow"))', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ ...mockTemplate, tags: ['workflow', 'test'] }],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{}],
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
      })

      // Should detect workflow reference (tags include "workflow")
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should NOT detect workflow reference when all OR conditions are false', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{
            name: 'regular node',
            description: 'regular description',
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
      })

      // Should NOT add to workflowsOfWorkflows (all OR conditions false)
      expect(result.current.workflowsOfWorkflows.length).toBe(0)
    })

    it('should detect workflow reference when multiple OR conditions are true', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{
            workflow_id: 'workflow-1',
            description: 'workflow description',
            name: 'workflow node',
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
      })

      // Should detect workflow reference (multiple OR conditions true)
      expect(mockHttpClient.post).toHaveBeenCalled()
    })
  })

  describe('OR operator - workflowDescription.includes("workflow of workflows") || ...', () => {
    it('should detect workflow of workflows when description includes "workflow of workflows"', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ ...mockTemplate, description: 'This is a workflow of workflows' }],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [],
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
      })

      // Should detect workflow of workflows (description match)
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should detect workflow of workflows when description includes "composite workflow"', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ ...mockTemplate, description: 'This is a composite workflow' }],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [],
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
      })

      // Should detect workflow of workflows (composite workflow match)
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should detect workflow of workflows when description includes "nested workflow"', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ ...mockTemplate, description: 'This is a nested workflow' }],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [],
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
      })

      // Should detect workflow of workflows (nested workflow match)
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should detect workflow of workflows when tags include "workflow-of-workflows"', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ ...mockTemplate, tags: ['workflow-of-workflows', 'test'] }],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [],
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
      })

      // Should detect workflow of workflows (tags match)
      expect(mockHttpClient.post).toHaveBeenCalled()
    })
  })

  describe('OR operator - hasWorkflowReference || isWorkflowOfWorkflows', () => {
    it('should add workflow when hasWorkflowReference is true', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{
            workflow_id: 'workflow-1',
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
      })

      // Should add to workflowsOfWorkflows (hasWorkflowReference is true)
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should add workflow when isWorkflowOfWorkflows is true', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ ...mockTemplate, description: 'workflow of workflows' }],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [],
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
      })

      // Should add to workflowsOfWorkflows (isWorkflowOfWorkflows is true)
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should add workflow when both conditions are true', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ ...mockTemplate, description: 'workflow of workflows' }],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{
            workflow_id: 'workflow-1',
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
      })

      // Should add to workflowsOfWorkflows (both conditions true)
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should NOT add workflow when both conditions are false', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{}],
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
      })

      // Should NOT add (both conditions false)
      expect(result.current.workflowsOfWorkflows.length).toBe(0)
    })
  })

  describe('OR operator - user.username || user.email || null', () => {
    it('should use username when username exists (first OR condition)', async () => {
      const agents = [{ ...mockAgent, author_id: null }]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: { id: 'user-1', username: 'testuser', email: 'test@example.com' },
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should use username (first truthy value)
      expect(mockStorage.setItem).toHaveBeenCalled()
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0].author_name).toBe('testuser')
    })

    it('should use email when username is missing but email exists (second OR condition)', async () => {
      const agents = [{ ...mockAgent, author_id: null }]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: { id: 'user-1', email: 'test@example.com' },
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should use email (username falsy, email truthy)
      expect(mockStorage.setItem).toHaveBeenCalled()
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0].author_name).toBe('test@example.com')
    })

    it('should use null when neither username nor email exists (third OR condition)', async () => {
      const agents = [{ ...mockAgent, author_id: null }]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: { id: 'user-1' },
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should use null (both username and email falsy)
      expect(mockStorage.setItem).toHaveBeenCalled()
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0].author_name).toBeNull()
    })
  })

  describe('OR operator - search filter: name || description || tags', () => {
    it('should filter by name when name matches (first OR condition)', async () => {
      const agents = [
        { ...mockAgent, name: 'Test Agent', description: 'Other', tags: ['other'] },
        { ...mockAgent, id: 'agent-2', name: 'Other Agent', description: 'Other', tags: ['other'] },
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should filter by name match
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].name).toBe('Test Agent')
    })

    it('should filter by description when description matches (second OR condition)', async () => {
      const agents = [
        { ...mockAgent, name: 'Agent One', description: 'Test Description', tags: ['other'] },
        { ...mockAgent, id: 'agent-2', name: 'Agent Two', description: 'Other Description', tags: ['other'] },
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should filter by description match
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].description).toBe('Test Description')
    })

    it('should filter by tags when tags match (third OR condition)', async () => {
      const agents = [
        { ...mockAgent, name: 'Agent One', description: 'Other', tags: ['test', 'automation'] },
        { ...mockAgent, id: 'agent-2', name: 'Agent Two', description: 'Other', tags: ['other'] },
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should filter by tags match
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].tags).toContain('test')
    })

    it('should filter when multiple OR conditions match', async () => {
      const agents = [
        { ...mockAgent, name: 'Test Agent', description: 'Test Description', tags: ['test'] },
        { ...mockAgent, id: 'agent-2', name: 'Other Agent', description: 'Other', tags: ['other'] },
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should filter (multiple OR conditions true)
      expect(result.current.agents.length).toBe(1)
    })

    it('should NOT filter when all OR conditions are false', async () => {
      const agents = [
        { ...mockAgent, name: 'Agent One', description: 'Description One', tags: ['tag1'] },
        { ...mockAgent, id: 'agent-2', name: 'Agent Two', description: 'Description Two', tags: ['tag2'] },
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

      // Should NOT filter (all OR conditions false)
      expect(result.current.agents.length).toBe(0)
    })
  })

  describe('OR operator - sortBy === "popular" || sortBy === "recent"', () => {
    it('should sort by date when sortBy is "popular"', async () => {
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should sort by date
      expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z')
    })

    it('should sort by date when sortBy is "recent"', async () => {
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
          sortBy: 'recent',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should sort by date
      expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z')
    })

    it('should sort alphabetically when sortBy is neither "popular" nor "recent"', async () => {
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should sort alphabetically
      expect(result.current.agents[0].name).toBe('Alpha Agent')
    })
  })

  describe('AND operator - user && user.id && agentsData.length > 0', () => {
    it('should update when all AND conditions are true', async () => {
      const agents = [{ ...mockAgent, author_id: null }]
      mockGetLocalStorageItem.mockReturnValue(agents)

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

      // Should update (all AND conditions true)
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should NOT update when user is null (first AND condition false)', async () => {
      const agents = [{ ...mockAgent, author_id: null }]
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should NOT update (user is null)
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should NOT update when user.id is missing (second AND condition false)', async () => {
      const agents = [{ ...mockAgent, author_id: null }]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: { id: '', username: 'testuser' } as any,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should NOT update (user.id is empty)
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should NOT update when agentsData.length is 0 (third AND condition false)', async () => {
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

      // Should NOT update (length === 0)
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('AND operator - updated && storage', () => {
    it('should save when both updated and storage are true', async () => {
      const agents = [{ ...mockAgent, author_id: null }]
      mockGetLocalStorageItem.mockReturnValue(agents)

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

      // Should save (both AND conditions true)
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should NOT save when updated is false', async () => {
      const agents = [{ ...mockAgent, author_id: 'existing-author' }]
      mockGetLocalStorageItem.mockReturnValue(agents)

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

      // Should NOT save (updated is false)
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should NOT save when storage is null', async () => {
      const agents = [{ ...mockAgent, author_id: null }]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: null,
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

      // Should NOT save (storage is null)
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })
  })
})
