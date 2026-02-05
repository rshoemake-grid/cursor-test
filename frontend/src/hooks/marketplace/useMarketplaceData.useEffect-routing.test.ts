/**
 * useEffect Routing Tests for useMarketplaceData hook
 * Phase 4.2: Tests for useEffect routing logic
 * Targets surviving mutants in useEffect conditional routing
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from '../storage'

jest.mock('../storage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - useEffect Routing (Phase 4.2)', () => {
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

  describe('useEffect routing - activeTab === "repository"', () => {
    it('should call fetchTemplates when activeTab is repository and repositorySubTab is workflows', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ id: 'template-1', name: 'Template' }],
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
          activeTab: 'repository', // activeTab === 'repository'
          repositorySubTab: 'workflows', // repositorySubTab === 'workflows'
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: if (activeTab === 'repository') { if (repositorySubTab === 'workflows') { fetchTemplates() } }
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/templates/')
      )
      expect(result.current.templates.length).toBeGreaterThan(0)
    })

    it('should call fetchRepositoryAgents when activeTab is repository and repositorySubTab is agents', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
      ]
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
          activeTab: 'repository', // activeTab === 'repository'
          repositorySubTab: 'agents', // repositorySubTab === 'agents'
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: if (activeTab === 'repository') { else { fetchRepositoryAgents() } }
      expect(result.current.repositoryAgents.length).toBe(1)
    })

    it('should verify exact equality check activeTab === "repository"', async () => {
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
          activeTab: 'repository', // Should use === not ==
          repositorySubTab: 'workflows',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should use: activeTab === 'repository' (strict equality)
      expect(mockHttpClient.get).toHaveBeenCalled()
    })
  })

  describe('useEffect routing - activeTab === "workflows-of-workflows"', () => {
    it('should call fetchWorkflowsOfWorkflows when activeTab is workflows-of-workflows', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ id: 'workflow-1', name: 'Workflow' }],
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
          activeTab: 'workflows-of-workflows', // activeTab === 'workflows-of-workflows'
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 3000 })

      // Should call: else if (activeTab === 'workflows-of-workflows') { fetchWorkflowsOfWorkflows() }
      expect(mockHttpClient.get).toHaveBeenCalled()
      expect(mockHttpClient.post).toHaveBeenCalled()
    })

    it('should verify exact equality check activeTab === "workflows-of-workflows"', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [],
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
          activeTab: 'workflows-of-workflows', // Should use === not ==
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 3000 })

      // Should use: activeTab === 'workflows-of-workflows' (strict equality)
      expect(mockHttpClient.get).toHaveBeenCalled()
    })
  })

  describe('useEffect routing - else branch (fetchAgents)', () => {
    it('should call fetchAgents when activeTab is agents', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
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
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents', // Should go to else branch
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should call: else { fetchAgents() }
      expect(result.current.agents.length).toBe(1)
    })

    it('should verify else branch executes when activeTab is not repository or workflows-of-workflows', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
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
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents', // Not 'repository' or 'workflows-of-workflows'
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should execute: else { fetchAgents() }
      // When activeTab !== 'repository' && activeTab !== 'workflows-of-workflows'
      expect(result.current.agents.length).toBe(1)
    })
  })

  describe('useEffect routing - nested conditional repositorySubTab === "workflows"', () => {
    it('should verify exact equality check repositorySubTab === "workflows"', async () => {
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
          repositorySubTab: 'workflows', // Should use === not ==
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should use: repositorySubTab === 'workflows' (strict equality)
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/templates/')
      )
    })

    it('should verify else branch when repositorySubTab !== "workflows"', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
      ]
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
          repositorySubTab: 'agents', // Not 'workflows'
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should execute: else { fetchRepositoryAgents() }
      // When repositorySubTab !== 'workflows'
      expect(result.current.repositoryAgents.length).toBe(1)
    })
  })

  describe('useEffect dependency array', () => {
    it('should re-run when activeTab changes', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)
      mockHttpClient.get.mockResolvedValue({
        json: async () => [],
      })

      const { result, rerender } = renderHook(
        (props) => useMarketplaceData(props),
        {
          initialProps: {
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
            category: '',
            searchQuery: '',
            sortBy: 'popular',
            user: null,
            activeTab: 'agents' as const,
            repositorySubTab: 'agents' as const,
          },
        }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.agents.length).toBe(1)

      // Change activeTab
      rerender({
        storage: mockStorage,
        httpClient: mockHttpClient,
        apiBaseUrl: 'http://api.test',
        category: '',
        searchQuery: '',
        sortBy: 'popular',
        user: null,
        activeTab: 'repository' as const,
        repositorySubTab: 'workflows' as const,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should re-run useEffect when activeTab changes
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/templates/')
      )
    })
  })
})
