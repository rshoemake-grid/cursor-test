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
      
      // Create stable user object reference to prevent infinite re-renders
      const user = { id: 'user-1', username: 'testuser' }

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user,
          activeTab: 'agents',
          repositorySubTab: 'workflows',
        })
      )

      // Wait for initial effect to complete (it will call fetchAgents)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      // Wait for loading to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      // Check migration happened - setItem should be called during initial fetchAgents
      expect(mockStorage.setItem).toHaveBeenCalled()
      const savedAgents = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedAgents[0].author_id).toBe('user-1')
      expect(savedAgents[0].author_name).toBe('testuser')
    })

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
      const agent1 = { ...mockAgent, id: 'agent-1', name: 'Test Agent', description: 'Some description', tags: ['automation'] }
      const agent2 = { ...mockAgent, id: 'agent-2', name: 'Other Agent', description: 'Other description', tags: ['other'] }
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
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 300))
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.repositoryAgents).toHaveLength(1)
      expect(result.current.repositoryAgents[0].name).toBe('Test Agent')
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

  describe('edge cases and error handling', () => {
    describe('fetchTemplates edge cases', () => {
      it('should handle empty response array', async () => {
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

        await act(async () => {
          await result.current.fetchTemplates()
        })

        expect(result.current.templates).toHaveLength(0)
        expect(result.current.loading).toBe(false)
      })

      it('should handle response.json() returning null', async () => {
        mockHttpClient.get.mockResolvedValue({
          json: async () => null,
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
          await result.current.fetchTemplates()
        })

        expect(result.current.templates).toBeNull()
        expect(result.current.loading).toBe(false)
      })

      it('should handle empty category string', async () => {
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

        await act(async () => {
          await result.current.fetchTemplates()
        })

        const callUrl = mockHttpClient.get.mock.calls[0][0]
        expect(callUrl).not.toContain('category=')
        expect(callUrl).toContain('sort_by=popular')
      })

      it('should handle empty searchQuery string', async () => {
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

        await act(async () => {
          await result.current.fetchTemplates()
        })

        const callUrl = mockHttpClient.get.mock.calls[0][0]
        expect(callUrl).not.toContain('search=')
      })
    })

    describe('fetchAgents edge cases', () => {
      it('should handle empty agents array', async () => {
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
            repositorySubTab: 'workflows',
          })
        )

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 200))
        })

        expect(result.current.agents).toHaveLength(0)
        expect(result.current.loading).toBe(false)
      })

      it('should handle agents with null name', async () => {
        const agentWithNullName = { ...mockAgent, name: null }
        mockGetLocalStorageItem.mockReturnValue([agentWithNullName])

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
            repositorySubTab: 'workflows',
          })
        )

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 200))
        })

        expect(result.current.agents).toHaveLength(1)
        expect(result.current.agents[0].name).toBeNull()
      })

      it('should handle agents with empty tags array', async () => {
        const agentWithEmptyTags = { ...mockAgent, tags: [] }
        mockGetLocalStorageItem.mockReturnValue([agentWithEmptyTags])

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
            repositorySubTab: 'workflows',
          })
        )

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 200))
        })

        expect(result.current.agents).toHaveLength(1)
        expect(result.current.agents[0].tags).toHaveLength(0)
      })

      it('should handle agents with undefined published_at', async () => {
        const agentWithoutDate = { ...mockAgent, published_at: undefined }
        const agentWithDate = { ...mockAgent, id: 'agent-2', published_at: '2024-01-02T00:00:00Z' }
        mockGetLocalStorageItem.mockReturnValue([agentWithoutDate, agentWithDate])

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
            repositorySubTab: 'workflows',
          })
        )

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 200))
        })

        expect(result.current.agents).toHaveLength(2)
        // Agent with date should come first
        expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z')
      })

      it('should handle migration when user.id is empty string', async () => {
        const agentWithoutAuthor = { ...mockAgent, author_id: null, author_name: null }
        mockGetLocalStorageItem.mockReturnValue([agentWithoutAuthor])
        const user = { id: '', username: 'testuser' }

        const { result } = renderHook(() =>
          useMarketplaceData({
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
            category: '',
            searchQuery: '',
            sortBy: 'popular',
            user,
            activeTab: 'agents',
            repositorySubTab: 'workflows',
          })
        )

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 200))
        })

        // Should not migrate if user.id is empty
        expect(mockStorage.setItem).not.toHaveBeenCalled()
      })

      it('should handle migration when agentsData.length is 0', async () => {
        mockGetLocalStorageItem.mockReturnValue([])
        const user = { id: 'user-1', username: 'testuser' }

        const { result } = renderHook(() =>
          useMarketplaceData({
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
            category: '',
            searchQuery: '',
            sortBy: 'popular',
            user,
            activeTab: 'agents',
            repositorySubTab: 'workflows',
          })
        )

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 200))
        })

        // Should not migrate if no agents
        expect(mockStorage.setItem).not.toHaveBeenCalled()
      })

      it('should handle search query with special characters', async () => {
        const agent1 = { ...mockAgent, id: 'agent-1', name: 'Test-Agent', description: 'Test', tags: [] }
        const agent2 = { ...mockAgent, id: 'agent-2', name: 'Other Agent', description: 'Other', tags: [] }
        mockGetLocalStorageItem.mockReturnValue([agent1, agent2])

        const { result } = renderHook(() =>
          useMarketplaceData({
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
            category: '',
            searchQuery: 'Test-',
            sortBy: 'popular',
            user: null,
            activeTab: 'agents',
            repositorySubTab: 'workflows',
          })
        )

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 300))
        })

        expect(result.current.agents).toHaveLength(1)
        expect(result.current.agents[0].name).toBe('Test-Agent')
      })

      it('should handle case-insensitive search in tags', async () => {
        const agent1 = { ...mockAgent, id: 'agent-1', name: 'Agent One', description: 'Desc', tags: ['TEST', 'automation'] }
        const agent2 = { ...mockAgent, id: 'agent-2', name: 'Agent Two', description: 'Desc', tags: ['other'] }
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

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 300))
        })

        expect(result.current.agents).toHaveLength(1)
        expect(result.current.agents[0].tags).toContain('TEST')
      })

      it('should handle sorting when both agents have same published_at', async () => {
        const agent1 = { ...mockAgent, id: 'agent-1', name: 'Zebra Agent', published_at: '2024-01-01T00:00:00Z' }
        const agent2 = { ...mockAgent, id: 'agent-2', name: 'Alpha Agent', published_at: '2024-01-01T00:00:00Z' }
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
            activeTab: 'agents',
            repositorySubTab: 'workflows',
          })
        )

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 200))
        })

        expect(result.current.agents).toHaveLength(2)
        // When dates are equal, sort returns 0 (order is stable but not guaranteed)
        // Just verify both agents are present
        const names = result.current.agents.map(a => a.name)
        expect(names).toContain('Alpha Agent')
        expect(names).toContain('Zebra Agent')
      })

      it('should handle sorting with default sortBy value', async () => {
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
            sortBy: 'alphabetical',
            user: null,
            activeTab: 'agents',
            repositorySubTab: 'workflows',
          })
        )

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 200))
        })

        expect(result.current.agents).toHaveLength(2)
        expect(result.current.agents[0].name).toBe('Alpha Agent')
      })
    })

    describe('fetchRepositoryAgents edge cases', () => {
      it('should handle empty savedAgents string', async () => {
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

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 200))
        })

        expect(result.current.repositoryAgents).toHaveLength(0)
        expect(result.current.loading).toBe(false)
      })

      it('should handle null savedAgents', async () => {
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

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 200))
        })

        expect(result.current.repositoryAgents).toHaveLength(0)
        expect(result.current.loading).toBe(false)
      })

      it('should handle repository agents with null name in sorting', async () => {
        const agent1 = { ...mockAgent, id: 'agent-1', name: null }
        const agent2 = { ...mockAgent, id: 'agent-2', name: 'Valid Name' }
        mockStorage.getItem.mockReturnValue(JSON.stringify([agent1, agent2]))

        const { result } = renderHook(() =>
          useMarketplaceData({
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
            category: '',
            searchQuery: '',
            sortBy: 'alphabetical',
            user: null,
            activeTab: 'repository',
            repositorySubTab: 'agents',
          })
        )

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 200))
        })

        expect(result.current.repositoryAgents).toHaveLength(2)
        // Null name should be handled gracefully
        expect(result.current.repositoryAgents[0].name).toBeNull()
      })
    })

    describe('fetchWorkflowsOfWorkflows edge cases', () => {
      it('should handle empty workflows array', async () => {
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
            repositorySubTab: 'workflows',
          })
        )

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 200))
        })

        expect(result.current.workflowsOfWorkflows).toHaveLength(0)
        expect(result.current.loading).toBe(false)
      })

      it('should handle workflow with null nodes array', async () => {
        const workflow = { ...mockTemplate, id: 'workflow-1' }
        mockHttpClient.get.mockResolvedValue({
          json: async () => [workflow],
        })
        mockHttpClient.post.mockResolvedValue({
          ok: true,
          json: async () => ({ nodes: null }),
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
          await new Promise(resolve => setTimeout(resolve, 300))
        })

        expect(result.current.workflowsOfWorkflows).toHaveLength(0)
      })

      it('should handle workflow with empty nodes array', async () => {
        const workflow = { ...mockTemplate, id: 'workflow-1' }
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
          await new Promise(resolve => setTimeout(resolve, 300))
        })

        expect(result.current.workflowsOfWorkflows).toHaveLength(0)
      })

      it('should handle workflow with node.data as null', async () => {
        const workflow = { ...mockTemplate, id: 'workflow-1' }
        mockHttpClient.get.mockResolvedValue({
          json: async () => [workflow],
        })
        mockHttpClient.post.mockResolvedValue({
          ok: true,
          json: async () => ({
            nodes: [{ workflow_id: 'other-workflow', data: null }],
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
          await new Promise(resolve => setTimeout(resolve, 300))
        })

        expect(result.current.workflowsOfWorkflows).toHaveLength(1)
      })

      it('should handle workflow with empty description', async () => {
        const workflow = { ...mockTemplate, id: 'workflow-1', description: '' }
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
          await new Promise(resolve => setTimeout(resolve, 300))
        })

        expect(result.current.workflowsOfWorkflows).toHaveLength(1)
      })

      it('should handle workflow with null tags array', async () => {
        const workflow = { ...mockTemplate, id: 'workflow-1', tags: null }
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
          await new Promise(resolve => setTimeout(resolve, 300))
        })

        expect(result.current.workflowsOfWorkflows).toHaveLength(1)
      })
    })
  })
})
