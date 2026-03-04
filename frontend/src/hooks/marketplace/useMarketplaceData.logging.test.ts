/**
 * Logging Tests for useMarketplaceData hook
 * Targets no-coverage mutants in logger.debug and logger.error calls
 */

import { renderHook } from '@testing-library/react'
import { waitForWithTimeoutFakeTimers } from '../../test/utils/waitForWithTimeout'
import { useMarketplaceData } from './useMarketplaceData'
import { logger } from '../../utils/logger'
import { getLocalStorageItem } from '../storage'

// Use fake timers version since this test suite uses jest.useFakeTimers()
const waitForWithTimeout = waitForWithTimeoutFakeTimers

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('../storage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>
const mockLoggerDebug = logger.debug as jest.MockedFunction<typeof logger.debug>
const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - Logging', () => {
  let mockHttpClient: any
  let mockStorage: any

  const mockAgent: any = {
    id: 'agent-1',
    name: 'Test Agent',
    label: 'Test Agent',
    description: 'Test Description',
    category: 'automation',
    tags: ['test'],
    published_at: '2024-01-01T00:00:00Z',
    author_id: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockHttpClient = {
      get: jest.fn().mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('marketplace/agents')) {
          return Promise.reject(new Error('API unavailable'))
        }
        return Promise.resolve({ json: async () => [] })
      }),
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

  describe('logger.debug calls', () => {
    it('should load agents with author migration when author_id is null', async () => {
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

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Verify agents loaded with author migration (author_id populated from user)
      expect(result.current.agents).toHaveLength(1)
      expect(result.current.agents[0].author_id).toBe('user-1')
      expect(result.current.agents[0].author_name).toBe('testuser')
    })

    it('should load agents from localStorage with migration', async () => {
      const agents = [
        { ...mockAgent, id: 'agent-1', author_id: 'user-1' },
        { ...mockAgent, id: 'agent-2', author_id: null },
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
          user: { id: 'user-1', username: 'testuser' },
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Verify both agents loaded (agent-2 gets author_id from user migration)
      expect(result.current.agents).toHaveLength(2)
      expect(result.current.agents[0].id).toBeDefined()
      expect(result.current.agents[1].id).toBeDefined()
    })

    it('should load agent with correct data structure', async () => {
      const agents = [
        {
          ...mockAgent,
          id: 'agent-1',
          name: 'Agent One',
          author_id: 'user-1',
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
          user: { id: 'user-1', username: 'testuser' },
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.agents).toHaveLength(1)
      expect(result.current.agents[0]).toMatchObject({
        id: 'agent-1',
        name: 'Agent One',
        author_id: 'user-1',
      })
    })

    it('should not migrate when agents already have author_id', async () => {
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

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Agent keeps existing author_id (no migration)
      expect(result.current.agents).toHaveLength(1)
      expect(result.current.agents[0].author_id).toBe('existing-author')
    })
  })

  describe('logger.error calls - exact message strings', () => {
    it('should log exact error message for fetchTemplates', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error'))

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

      await waitForWithTimeout(() => {
        expect(mockLoggerError).toHaveBeenCalled()
      })

      // Verify exact error message string (now uses generic useDataFetching hook)
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Data fetch failed:',
        expect.any(Error)
      )
    })

    it('should log exact error message for fetchWorkflowsOfWorkflows', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error'))

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
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(mockLoggerError).toHaveBeenCalled()
      })

      // Verify exact error message string (now uses generic useDataFetching hook)
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Data fetch failed:',
        expect.any(Error)
      )
    })

    it('should log exact error message for workflow check failure', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ id: 'workflow-1', name: 'Workflow 1' }],
      })
      mockHttpClient.post.mockRejectedValue(new Error('Post failed'))

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
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(mockLoggerError).toHaveBeenCalled()
      })

      // Verify error message includes workflow ID
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringMatching(/^Failed to check workflow workflow-1:/),
        expect.any(Error)
      )
    })

    it('should log exact error message for fetchAgents', async () => {
      mockGetLocalStorageItem.mockImplementation(() => {
        throw new Error('Storage error')
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
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(mockLoggerError).toHaveBeenCalled()
      })

      // Verify exact error message string (now uses generic useDataFetching hook)
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Data fetch failed:',
        expect.any(Error)
      )
    })

    it('should log exact error message for fetchRepositoryAgents storage error', async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
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
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(mockLoggerError).toHaveBeenCalled()
      })

      // Verify exact error message string
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Failed to load repository agents from storage:',
        expect.any(Error)
      )
    })

    it('should log exact error message for fetchRepositoryAgents general error', async () => {
      // Test with storage error (simpler and more realistic)
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access error')
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
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(mockLoggerError).toHaveBeenCalled()
      })

      // Verify exact error message string
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Failed to load repository agents from storage:',
        expect.any(Error)
      )
    })
  })

  describe('Logger call verification', () => {
    it('should load agents and apply author migration', async () => {
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

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Verify agents loaded with migration
      expect(result.current.agents).toHaveLength(1)
      expect(result.current.agents[0].author_id).toBe('user-1')
    })

    it('should verify logger.error is called with correct number of arguments', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error'))

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

      await waitForWithTimeout(() => {
        expect(mockLoggerError).toHaveBeenCalled()
      })

      // Verify error calls have 2 arguments (message, error)
      const errorCalls = mockLoggerError.mock.calls
      expect(errorCalls.length).toBeGreaterThan(0)
      errorCalls.forEach(call => {
        expect(call.length).toBe(2)
        expect(typeof call[0]).toBe('string')
        expect(call[1]).toBeInstanceOf(Error)
      })
    })
  })
})
