/**
 * Conditional Expression Tests for useMarketplaceData hook
 * Targets surviving ConditionalExpression mutants (~15 mutants)
 * Tests all conditional branches, ternary operators, and nested conditionals
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from '../storage'
import { STORAGE_KEYS } from '../../config/constants'

jest.mock('../storage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - Conditional Expressions', () => {
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
    is_official: false,
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

  describe('Category conditional - if (category)', () => {
    it('should append category when category is truthy non-empty string', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('category=automation')
      )
    })

    it('should NOT append category when category is empty string', async () => {
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const callUrl = mockHttpClient.get.mock.calls[0][0]
      expect(callUrl).not.toContain('category=')
    })

    it('should NOT append category when category is null', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: null as any,
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

      const callUrl = mockHttpClient.get.mock.calls[0][0]
      expect(callUrl).not.toContain('category=')
    })

    it('should NOT append category when category is undefined', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: undefined as any,
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

      const callUrl = mockHttpClient.get.mock.calls[0][0]
      expect(callUrl).not.toContain('category=')
    })
  })

  describe('SearchQuery conditional - if (searchQuery)', () => {
    it('should append search when searchQuery is truthy non-empty string', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // URLSearchParams encodes spaces as +, not %20
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringMatching(/search=test[\+%20]query/)
      )
    })

    it('should NOT append search when searchQuery is empty string', async () => {
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const callUrl = mockHttpClient.get.mock.calls[0][0]
      expect(callUrl).not.toContain('search=')
    })
  })

  describe('User conditional - user && user.id && agentsData.length > 0', () => {
    it('should update agents when all conditions are true', async () => {
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

      // Should update agents (all AND conditions true)
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should NOT update when user is null (first condition false)', async () => {
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

    it('should NOT update when user.id is missing (second condition false)', async () => {
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

      // Should NOT update (user.id is empty string)
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should NOT update when agentsData.length is 0 (third condition false)', async () => {
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

  describe('Author ID conditional - !agent.author_id', () => {
    it('should update agent when author_id is null', async () => {
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

      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should update agent when author_id is undefined', async () => {
      const agents = [{ ...mockAgent, author_id: undefined }]
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

      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should NOT update agent when author_id exists', async () => {
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

      // Should NOT update (author_id exists)
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('Storage conditional - if (!storage)', () => {
    it('should return early when storage is null', async () => {
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should return empty array immediately
      expect(result.current.repositoryAgents).toEqual([])
      expect(mockStorage.getItem).not.toHaveBeenCalled()
    })

    it('should proceed when storage exists', async () => {
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should load from storage
      expect(mockStorage.getItem).toHaveBeenCalled()
      expect(result.current.repositoryAgents.length).toBeGreaterThan(0)
    })
  })

  describe('Updated conditional - if (updated && storage)', () => {
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

      // Should save (both conditions true)
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

  describe('SortBy conditional - sortBy === "popular" || sortBy === "recent"', () => {
    it('should sort by date when sortBy is "popular"', async () => {
      const agents = [
        { ...mockAgent, id: 'agent-1', published_at: '2024-01-01T00:00:00Z' },
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

      // Should sort by date (most recent first)
      expect(result.current.agents[0].id).toBe('agent-2')
      expect(result.current.agents[1].id).toBe('agent-1')
    })

    it('should sort by date when sortBy is "recent"', async () => {
      const agents = [
        { ...mockAgent, id: 'agent-1', published_at: '2024-01-01T00:00:00Z' },
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

      // Should sort by date (most recent first)
      expect(result.current.agents[0].id).toBe('agent-2')
      expect(result.current.agents[1].id).toBe('agent-1')
    })

    it('should sort alphabetically when sortBy is neither "popular" nor "recent"', async () => {
      const agents = [
        { ...mockAgent, id: 'agent-1', name: 'Zebra Agent' },
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
      expect(result.current.agents[1].name).toBe('Zebra Agent')
    })
  })

  describe('ActiveTab conditional - activeTab === "repository"', () => {
    it('should fetch templates when activeTab is "repository" and repositorySubTab is "workflows"', async () => {
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should fetch templates
      expect(mockHttpClient.get).toHaveBeenCalled()
      expect(result.current.templates.length).toBeGreaterThan(0)
    })

    it('should fetch repository agents when activeTab is "repository" and repositorySubTab is "agents"', async () => {
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should fetch repository agents
      expect(result.current.repositoryAgents.length).toBeGreaterThan(0)
    })

    it('should fetch workflows of workflows when activeTab is "workflows-of-workflows"', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
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
      })

      // Should fetch workflows of workflows
      expect(mockHttpClient.get).toHaveBeenCalled()
    })

    it('should fetch agents when activeTab is "agents"', async () => {
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
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should fetch agents
      expect(result.current.agents.length).toBeGreaterThan(0)
    })
  })

  describe('RepositorySubTab conditional - repositorySubTab === "workflows"', () => {
    it('should fetch templates when repositorySubTab is "workflows"', async () => {
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should fetch templates
      expect(mockHttpClient.get).toHaveBeenCalled()
    })

    it('should fetch repository agents when repositorySubTab is "agents"', async () => {
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should fetch repository agents
      expect(result.current.repositoryAgents.length).toBeGreaterThan(0)
    })
  })

  describe('Ternary operators - a.is_official ? 1 : 0', () => {
    it('should return 1 when is_official is true', async () => {
      const agents = [
        { ...mockAgent, is_official: true, name: 'Official Agent' },
        { ...mockAgent, id: 'agent-2', is_official: false, name: 'Unofficial Agent' },
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

      // Should sort official agents first (ternary returns 1 for official)
      expect(result.current.agents[0].is_official).toBe(true)
      expect(result.current.agents[1].is_official).toBe(false)
    })

    it('should return 0 when is_official is false', async () => {
      const agents = [
        { ...mockAgent, is_official: false, name: 'Unofficial Agent' },
        { ...mockAgent, id: 'agent-2', is_official: true, name: 'Official Agent' },
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

      // Should sort official agents first
      expect(result.current.agents[0].is_official).toBe(true)
      expect(result.current.agents[1].is_official).toBe(false)
    })
  })

  describe('Ternary operators - a.published_at ? new Date().getTime() : 0', () => {
    it('should return timestamp when published_at exists', async () => {
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

      // Should sort by date (most recent first)
      expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z')
    })

    it('should return 0 when published_at is undefined', async () => {
      const agents = [
        { ...mockAgent, published_at: '2024-01-01T00:00:00Z' },
        { ...mockAgent, id: 'agent-2', published_at: undefined },
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

      // Agent with published_at should come first (0 < timestamp)
      expect(result.current.agents[0].published_at).toBe('2024-01-01T00:00:00Z')
      expect(result.current.agents[1].published_at).toBeUndefined()
    })
  })

  describe('Ternary operators - savedAgents ? JSON.parse(savedAgents) : []', () => {
    it('should parse JSON when savedAgents exists', async () => {
      const agents = [mockAgent]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should parse savedAgents
      expect(result.current.repositoryAgents.length).toBe(1)
      expect(result.current.repositoryAgents[0].id).toBe('agent-1')
    })

    it('should use empty array when savedAgents is null', async () => {
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should use empty array
      expect(result.current.repositoryAgents).toEqual([])
    })
  })

  describe('Ternary operators - user.username || user.email || null', () => {
    it('should use username when username exists', async () => {
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

    it('should use email when username is missing but email exists', async () => {
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

      // Should use email (username is falsy, email is truthy)
      expect(mockStorage.setItem).toHaveBeenCalled()
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0].author_name).toBe('test@example.com')
    })

    it('should use null when neither username nor email exists', async () => {
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

      // Should use null (both username and email are falsy)
      expect(mockStorage.setItem).toHaveBeenCalled()
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0].author_name).toBeNull()
    })
  })
})
