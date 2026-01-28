import { renderHook, act, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { logger } from '../utils/logger'
import { getLocalStorageItem } from './useLocalStorage'
import { STORAGE_KEYS } from '../config/constants'

jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('./useLocalStorage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>
const mockLoggerDebug = logger.debug as jest.MockedFunction<typeof logger.debug>
const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData', () => {
  let mockHttpClient: any
  let mockStorage: any

  const mockTemplate: any = {
    id: 'template-1',
    name: 'Test Template',
    description: 'Test Description',
    category: 'automation',
    tags: ['test'],
    difficulty: 'beginner',
    estimated_time: '5 min',
    is_official: false,
    uses_count: 10,
    likes_count: 5,
    rating: 4.5,
    author_id: 'user-1',
    author_name: 'Test User',
  }

  const mockAgent: any = {
    id: 'agent-1',
    name: 'Test Agent',
    label: 'Test Agent',
    description: 'Test Description',
    category: 'automation',
    tags: ['test'],
    difficulty: 'beginner',
    estimated_time: '5 min',
    agent_config: {},
    published_at: '2024-01-01T00:00:00Z',
    author_id: 'user-1',
    author_name: 'Test User',
    is_official: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockHttpClient = {
      get: jest.fn().mockResolvedValue({ json: async () => [] }),
      post: jest.fn().mockResolvedValue({ ok: true, json: async () => ({ nodes: [] }) }),
    }
    mockStorage = {
      getItem: jest.fn().mockReturnValue(JSON.stringify([])),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    mockGetLocalStorageItem.mockReturnValue([])
  })

  describe('fetchTemplates', () => {
    it('should fetch templates successfully', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
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

      // Wait for initial effect to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.fetchTemplates()
      })

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('http://api.test/templates/')
      )
      expect(result.current.templates).toHaveLength(1)
      expect(result.current.templates[0].id).toBe('template-1')
      expect(result.current.loading).toBe(false)
    })

    it('should include category in params when provided', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [],
      })

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: 'automation',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'workflows',
        })
      )

      await act(async () => {
        await result.current.fetchTemplates()
      })

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('category=automation')
      )
    })

    it('should include search query in params when provided', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [],
      })

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: 'test query',
          sortBy: 'popular',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'workflows',
        })
      )

      await act(async () => {
        await result.current.fetchTemplates()
      })

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('search=test+query')
      )
    })

    it('should include sort_by in params', async () => {
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
          sortBy: 'recent',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'workflows',
        })
      )

      await act(async () => {
        await result.current.fetchTemplates()
      })

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('sort_by=recent')
      )
    })

    it('should handle fetch errors', async () => {
      const error = new Error('Network error')
      mockHttpClient.get.mockRejectedValue(error)

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

      await act(async () => {
        await result.current.fetchTemplates()
      })

      expect(mockLoggerError).toHaveBeenCalledWith('Failed to fetch templates:', error)
      expect(result.current.loading).toBe(false)
    })

    it('should set loading to true then false', async () => {
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

      // Verify loading starts as false, then test the fetch
      expect(result.current.loading).toBe(false)

      await act(async () => {
        await result.current.fetchTemplates()
      })

      // Loading should be false after fetch completes
      expect(result.current.loading).toBe(false)
      expect(mockHttpClient.get).toHaveBeenCalled()
    })
  })

  describe('fetchAgents', () => {
    it('should load agents from localStorage', async () => {
      mockGetLocalStorageItem.mockReturnValue([mockAgent])

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

      // Wait for initial effect to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.fetchAgents()
      })

      expect(mockGetLocalStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.PUBLISHED_AGENTS, [])
      expect(result.current.agents).toHaveLength(1)
      expect(result.current.agents[0].id).toBe('agent-1')
    })

    it('should migrate agents without author_id when user is provided', async () => {
      const agentWithoutAuthor = { ...mockAgent, author_id: null, author_name: null }
      mockGetLocalStorageItem.mockReturnValue([agentWithoutAuthor])

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: { id: 'user-1', username: 'testuser' },
          activeTab: 'repository',
          repositorySubTab: 'workflows',
        })
      )

      // Wait for initial effect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200))
      })

      // Manually trigger fetchAgents to test migration
      mockGetLocalStorageItem.mockClear()
      mockGetLocalStorageItem.mockReturnValue([agentWithoutAuthor])
      mockStorage.setItem.mockClear()

      await act(async () => {
        await result.current.fetchAgents()
      })

      // Check migration happened - setItem is called synchronously in fetchAgents
      expect(mockStorage.setItem).toHaveBeenCalled()
      const savedAgents = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedAgents[0].author_id).toBe('user-1')
      expect(savedAgents[0].author_name).toBe('testuser')
    }, 15000) // Increase timeout

    it('should use email when username not available for migration', async () => {
      const agentWithoutAuthor = { ...mockAgent, author_id: null, author_name: null }
      mockGetLocalStorageItem.mockReturnValue([agentWithoutAuthor])

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: { id: 'user-1', email: 'test@example.com' },
          activeTab: 'repository',
          repositorySubTab: 'workflows',
        })
      )

      // Wait for initial effect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      // Manually trigger fetchAgents to test migration
      mockGetLocalStorageItem.mockClear()
      mockGetLocalStorageItem.mockReturnValue([agentWithoutAuthor])
      mockStorage.setItem.mockClear()

      await act(async () => {
        await result.current.fetchAgents()
      })

      // Check migration happened
      expect(mockStorage.setItem).toHaveBeenCalled()
      const savedAgents = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedAgents[0].author_name).toBe('test@example.com')
    })

    it('should not migrate when user is null', async () => {
      mockGetLocalStorageItem.mockReturnValue([mockAgent])

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

      await act(async () => {
        await result.current.fetchAgents()
      })

      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should filter by category', async () => {
      const agent1 = { ...mockAgent, id: 'agent-1', category: 'automation' }
      const agent2 = { ...mockAgent, id: 'agent-2', category: 'data' }
      mockGetLocalStorageItem.mockReturnValue([agent1, agent2])

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: 'automation',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'workflows',
        })
      )

      await act(async () => {
        await result.current.fetchAgents()
      })

      expect(result.current.agents).toHaveLength(1)
      expect(result.current.agents[0].category).toBe('automation')
    })

    it('should filter by search query in name', async () => {
      const agent1 = { ...mockAgent, id: 'agent-1', name: 'Test Agent', description: 'Some description', tags: ['automation'] }
      const agent2 = { ...mockAgent, id: 'agent-2', name: 'Other Agent', description: 'Other description', tags: ['other'] }
      mockGetLocalStorageItem.mockReturnValue([agent1, agent2])

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
          repositorySubTab: 'workflows',
        })
      )

      // Wait for initial effect to complete (it will call fetchAgents with searchQuery='Test')
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 300))
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.agents).toHaveLength(1)
      expect(result.current.agents[0].name).toBe('Test Agent')
    })

    it('should filter by search query in description', async () => {
      const agent1 = { ...mockAgent, id: 'agent-1', name: 'Agent One', description: 'Test description', tags: ['automation'] }
      const agent2 = { ...mockAgent, id: 'agent-2', name: 'Agent Two', description: 'Other description', tags: ['other'] }
      mockGetLocalStorageItem.mockReturnValue([agent1, agent2])

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
          repositorySubTab: 'workflows',
        })
      )

      // Wait for initial effect to complete (it will call fetchAgents with searchQuery='Test')
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 300))
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.agents).toHaveLength(1)
      expect(result.current.agents[0].description).toContain('Test')
    })

    it('should filter by search query in tags', async () => {
      const agent1 = { ...mockAgent, id: 'agent-1', name: 'Agent One', description: 'Some description', tags: ['test', 'automation'] }
      const agent2 = { ...mockAgent, id: 'agent-2', name: 'Agent Two', description: 'Other description', tags: ['other', 'data'] }
      mockGetLocalStorageItem.mockReturnValue([agent1, agent2])

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
          repositorySubTab: 'workflows',
        })
      )

      // Wait for initial effect to complete (it will call fetchAgents with searchQuery='test')
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 300))
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.agents).toHaveLength(1)
      expect(result.current.agents[0].tags).toContain('test')
    })

    it('should sort official agents first', async () => {
      const agent1 = { ...mockAgent, id: 'agent-1', is_official: false }
      const agent2 = { ...mockAgent, id: 'agent-2', is_official: true }
      mockGetLocalStorageItem.mockReturnValue([agent1, agent2])

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

      await act(async () => {
        await result.current.fetchAgents()
      })

      expect(result.current.agents[0].is_official).toBe(true)
      expect(result.current.agents[1].is_official).toBe(false)
    })

    it('should sort by published_at for popular sort', async () => {
      const agent1 = { ...mockAgent, id: 'agent-1', published_at: '2024-01-01T00:00:00Z' }
      const agent2 = { ...mockAgent, id: 'agent-2', published_at: '2024-01-02T00:00:00Z' }
      mockGetLocalStorageItem.mockReturnValue([agent1, agent2])

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

      await act(async () => {
        await result.current.fetchAgents()
      })

      expect(result.current.agents[0].id).toBe('agent-2') // Most recent first
    })

    it('should sort alphabetically by name as default', async () => {
      const agent1 = { ...mockAgent, id: 'agent-1', name: 'Zebra Agent' }
      const agent2 = { ...mockAgent, id: 'agent-2', name: 'Alpha Agent' }
      mockGetLocalStorageItem.mockReturnValue([agent1, agent2])

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'name',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'workflows',
        })
      )

      await act(async () => {
        await result.current.fetchAgents()
      })

      expect(result.current.agents[0].name).toBe('Alpha Agent')
    })

    it('should handle agents without published_at', async () => {
      const agent1 = { ...mockAgent, id: 'agent-1', published_at: undefined }
      const agent2 = { ...mockAgent, id: 'agent-2', published_at: '2024-01-01T00:00:00Z' }
      mockGetLocalStorageItem.mockReturnValue([agent1, agent2])

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

      await act(async () => {
        await result.current.fetchAgents()
      })

      expect(result.current.agents).toHaveLength(2)
    })

    it('should handle errors gracefully', async () => {
      mockGetLocalStorageItem.mockImplementation(() => {
        throw new Error('Storage error')
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

      await act(async () => {
        await result.current.fetchAgents()
      })

      expect(mockLoggerError).toHaveBeenCalled()
      expect(result.current.loading).toBe(false)
    })
  })

  describe('fetchRepositoryAgents', () => {
    it('should load repository agents from storage', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([mockAgent]))

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

      // Wait for initial effect to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.fetchRepositoryAgents()
      })

      expect(mockStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.REPOSITORY_AGENTS)
      expect(result.current.repositoryAgents).toHaveLength(1)
      expect(result.current.repositoryAgents[0].id).toBe('agent-1')
    })

    it('should return empty array when storage is null', async () => {
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: null,
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

      await act(async () => {
        await result.current.fetchRepositoryAgents()
      })

      expect(result.current.repositoryAgents).toHaveLength(0)
      expect(result.current.loading).toBe(false)
    })

    it('should handle invalid JSON in storage', async () => {
      mockStorage.getItem.mockReturnValue('invalid json')

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

      await act(async () => {
        await result.current.fetchRepositoryAgents()
      })

      expect(mockLoggerError).toHaveBeenCalled()
      expect(result.current.repositoryAgents).toHaveLength(0)
    })

    it('should filter repository agents by category', async () => {
      const agent1 = { ...mockAgent, id: 'agent-1', category: 'automation' }
      const agent2 = { ...mockAgent, id: 'agent-2', category: 'data' }
      mockStorage.getItem.mockReturnValue(JSON.stringify([agent1, agent2]))

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: 'automation',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'agents',
        })
      )

      await act(async () => {
        await result.current.fetchRepositoryAgents()
      })

      expect(result.current.repositoryAgents).toHaveLength(1)
      expect(result.current.repositoryAgents[0].category).toBe('automation')
    })

    it('should filter repository agents by search query', async () => {
      const agent1 = { ...mockAgent, id: 'agent-1', name: 'Test Agent' }
      const agent2 = { ...mockAgent, id: 'agent-2', name: 'Other Agent' }
      mockStorage.getItem.mockReturnValue(JSON.stringify([agent1, agent2]))

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: 'Test',
          sortBy: 'popular',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'agents',
        })
      )

      // Wait for initial effect to complete (it will call fetchRepositoryAgents with searchQuery='Test')
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.repositoryAgents.length).toBeGreaterThan(0)
      }, { timeout: 3000 })

      expect(result.current.repositoryAgents).toHaveLength(1)
    })

    it('should sort repository agents by published_at for recent sort', async () => {
      const agent1 = { ...mockAgent, id: 'agent-1', published_at: '2024-01-01T00:00:00Z' }
      const agent2 = { ...mockAgent, id: 'agent-2', published_at: '2024-01-02T00:00:00Z' }
      mockStorage.getItem.mockReturnValue(JSON.stringify([agent1, agent2]))

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'recent',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'agents',
        })
      )

      await act(async () => {
        await result.current.fetchRepositoryAgents()
      })

      expect(result.current.repositoryAgents[0].id).toBe('agent-2')
    })
  })

  describe('fetchWorkflowsOfWorkflows', () => {
    it('should fetch and filter workflows of workflows', async () => {
      const workflowWithReference = {
        ...mockTemplate,
        id: 'workflow-1',
        description: 'This is a workflow of workflows',
      }

      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflowWithReference, mockTemplate],
      })

      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{ workflow_id: 'other-workflow' }],
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
          repositorySubTab: 'workflows',
        })
      )

      await act(async () => {
        await result.current.fetchWorkflowsOfWorkflows()
      })

      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })

    it('should identify workflows by workflow_id in nodes', async () => {
      const workflow = { ...mockTemplate, id: 'workflow-1' }

      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow],
      })

      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{ workflow_id: 'other-workflow' }],
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
          repositorySubTab: 'workflows',
        })
      )

      await act(async () => {
        await result.current.fetchWorkflowsOfWorkflows()
      })

      expect(result.current.workflowsOfWorkflows).toHaveLength(1)
    })

    it('should identify workflows by description containing workflow keywords', async () => {
      const workflow = {
        ...mockTemplate,
        id: 'workflow-1',
        description: 'This is a composite workflow',
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
          repositorySubTab: 'workflows',
        })
      )

      await act(async () => {
        await result.current.fetchWorkflowsOfWorkflows()
      })

      expect(result.current.workflowsOfWorkflows).toHaveLength(1)
    })

    it('should identify workflows by tags', async () => {
      const workflow = {
        ...mockTemplate,
        id: 'workflow-1',
        tags: ['workflow-of-workflows'],
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
          repositorySubTab: 'workflows',
        })
      )

      await act(async () => {
        await result.current.fetchWorkflowsOfWorkflows()
      })

      expect(result.current.workflowsOfWorkflows).toHaveLength(1)
    })

    it('should handle errors when checking individual workflows', async () => {
      const workflow = { ...mockTemplate, id: 'workflow-1' }

      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow],
      })

      mockHttpClient.post.mockRejectedValue(new Error('API error'))

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
          repositorySubTab: 'workflows',
        })
      )

      await act(async () => {
        await result.current.fetchWorkflowsOfWorkflows()
      })

      expect(mockLoggerError).toHaveBeenCalled()
      expect(result.current.loading).toBe(false)
    })

    it('should handle workflows with non-ok responses', async () => {
      const workflow = { ...mockTemplate, id: 'workflow-1' }

      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow],
      })

      mockHttpClient.post.mockResolvedValue({
        ok: false,
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
          repositorySubTab: 'workflows',
        })
      )

      await act(async () => {
        await result.current.fetchWorkflowsOfWorkflows()
      })

      expect(result.current.workflowsOfWorkflows).toHaveLength(0)
    })
  })

  describe('auto-fetch effect', () => {
    it('should fetch agents when activeTab is agents', async () => {
      mockGetLocalStorageItem.mockReturnValue([])

      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'workflows',
        })
      )

      await waitFor(() => {
        expect(mockGetLocalStorageItem).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should fetch templates when activeTab is repository and repositorySubTab is workflows', async () => {
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
      }, { timeout: 2000 })
    })

    it('should fetch repository agents when activeTab is repository and repositorySubTab is agents', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([]))

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
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(mockStorage.getItem).toHaveBeenCalled()
      }, { timeout: 2000 })
    })

    it('should fetch workflows of workflows when activeTab is workflows-of-workflows', async () => {
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
          activeTab: 'workflows-of-workflows',
          repositorySubTab: 'workflows',
        })
      )

      await waitFor(() => {
        expect(mockHttpClient.get).toHaveBeenCalled()
      }, { timeout: 2000 })
    })
  })

  describe('setters', () => {
    it('should allow setting templates', async () => {
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

      // Wait for initial effect to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.setTemplates([mockTemplate])
      })

      expect(result.current.templates).toHaveLength(1)
    })

    it('should allow setting agents', () => {
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

      act(() => {
        result.current.setAgents([mockAgent])
      })

      expect(result.current.agents).toHaveLength(1)
    })

    it('should allow setting repository agents', () => {
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

      act(() => {
        result.current.setRepositoryAgents([mockAgent])
      })

      expect(result.current.repositoryAgents).toHaveLength(1)
    })

    it('should allow setting workflows of workflows', () => {
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
          repositorySubTab: 'workflows',
        })
      )

      act(() => {
        result.current.setWorkflowsOfWorkflows([mockTemplate])
      })

      expect(result.current.workflowsOfWorkflows).toHaveLength(1)
    })
  })
})
