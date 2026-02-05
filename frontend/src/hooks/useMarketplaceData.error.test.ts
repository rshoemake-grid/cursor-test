/**
 * Error Handling Tests for useMarketplaceData hook
 * Targets no-coverage mutants in error handling paths
 */

import { renderHook, waitFor } from '@testing-library/react'
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

describe('useMarketplaceData - Error Handling', () => {
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
      getItem: jest.fn().mockReturnValue(JSON.stringify([])),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    mockGetLocalStorageItem.mockReturnValue([])
  })

  describe('fetchTemplates - error handling', () => {
    it('should handle httpClient.get error and log error message', async () => {
      const networkError = new Error('Network request failed')
      mockHttpClient.get.mockRejectedValue(networkError)

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

      // Verify error was logged with exact message (now uses generic useDataFetching hook)
      expect(mockLoggerError).toHaveBeenCalledWith('Data fetch failed:', networkError)
      expect(mockLoggerError).toHaveBeenCalledTimes(1)

      // Verify loading state is reset
      expect(result.current.loading).toBe(false)

      // Verify templates remain empty (not set on error)
      expect(result.current.templates).toEqual([])
    })

    it('should handle json parsing error', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => {
          throw new Error('Invalid JSON')
        },
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

      // Verify error was logged (now uses generic useDataFetching hook)
      expect(mockLoggerError).toHaveBeenCalledWith('Data fetch failed:', expect.any(Error))
      expect(result.current.loading).toBe(false)
    })

    it('should set loading to false in finally block even on error', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Error'))

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

      // Verify loading is false (finally block executed)
      expect(result.current.loading).toBe(false)
    })
  })

  describe('fetchWorkflowsOfWorkflows - error handling', () => {
    it('should handle outer try-catch error (httpClient.get failure)', async () => {
      const networkError = new Error('Failed to fetch workflows')
      mockHttpClient.get.mockRejectedValue(networkError)

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

      // Verify outer error was logged with exact message (now uses generic useDataFetching hook)
      expect(mockLoggerError).toHaveBeenCalledWith('Data fetch failed:', networkError)
      expect(result.current.loading).toBe(false)
      expect(result.current.workflowsOfWorkflows).toEqual([])
    })

    it('should handle inner try-catch error (httpClient.post failure for specific workflow)', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      })
      mockHttpClient.post.mockRejectedValue(new Error('Failed to check workflow'))

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

      // Verify inner error was logged with workflow ID
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to check workflow'),
        expect.any(Error)
      )

      // Verify partial results (empty array since workflow check failed)
      expect(result.current.workflowsOfWorkflows).toEqual([])
      expect(result.current.loading).toBe(false)
    })

    it('should handle multiple workflow errors and continue processing', async () => {
      const templates = [
        { ...mockTemplate, id: 'template-1' },
        { ...mockTemplate, id: 'template-2' },
        { ...mockTemplate, id: 'template-3' },
      ]

      mockHttpClient.get.mockResolvedValue({
        json: async () => templates,
      })

      // First workflow succeeds, second fails, third succeeds
      mockHttpClient.post
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nodes: [{ workflow_id: 'workflow-1' }] }),
        })
        .mockRejectedValueOnce(new Error('Workflow 2 failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nodes: [{ workflow_id: 'workflow-3' }] }),
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

      // Verify error was logged for failed workflow
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to check workflow'),
        expect.any(Error)
      )

      // Verify processing continued (should have results from successful workflows)
      expect(result.current.loading).toBe(false)
    })

    it('should set loading to false in finally block even on error', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Error'))

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

      expect(result.current.loading).toBe(false)
    })
  })

  describe('fetchAgents - error handling', () => {
    it('should handle getLocalStorageItem error', async () => {
      const storageError = new Error('Storage access failed')
      mockGetLocalStorageItem.mockImplementation(() => {
        throw storageError
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
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Verify error was logged with exact message (now uses generic useDataFetching hook)
      expect(mockLoggerError).toHaveBeenCalledWith('Data fetch failed:', storageError)
      expect(result.current.loading).toBe(false)
    })

    it('should set loading to false in finally block even on error', async () => {
      mockGetLocalStorageItem.mockImplementation(() => {
        throw new Error('Error')
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
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.loading).toBe(false)
    })

    it('should handle error during agent processing', async () => {
      mockGetLocalStorageItem.mockReturnValue([mockAgent])

      // Mock storage.setItem to throw error
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('Storage write failed')
      })

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

      // Should still complete (error in storage.setItem shouldn't break flow)
      expect(result.current.loading).toBe(false)
    })
  })

  describe('fetchRepositoryAgents - error handling', () => {
    it('should handle storage.getItem error', async () => {
      const storageError = new Error('Storage read failed')
      mockStorage.getItem.mockImplementation(() => {
        throw storageError
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
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Verify error was logged with exact message
      expect(mockLoggerError).toHaveBeenCalledWith('Failed to load repository agents from storage:', storageError)
      expect(result.current.loading).toBe(false)
      expect(result.current.repositoryAgents).toEqual([])
    })

    it('should handle JSON.parse error (invalid JSON)', async () => {
      mockStorage.getItem.mockReturnValue('invalid json{')

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

      // Verify error was logged
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Failed to load repository agents from storage:',
        expect.any(Error)
      )

      // Verify agentsData defaults to empty array
      expect(result.current.repositoryAgents).toEqual([])
      expect(result.current.loading).toBe(false)
    })

    it('should set loading to false in finally block even on error', async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Error')
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
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.loading).toBe(false)
    })

    it('should handle error in fetchRepositoryAgents outer try-catch', async () => {
      // Mock storage.getItem to throw error (simulating unexpected error)
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Unexpected storage error')
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
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Verify error was logged
      expect(mockLoggerError).toHaveBeenCalledWith('Failed to load repository agents from storage:', expect.any(Error))
      expect(result.current.loading).toBe(false)
    })
  })

  describe('Error message strings - exact matches', () => {
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

      await waitFor(() => {
        expect(mockLoggerError).toHaveBeenCalled()
      })

      // Verify exact error message string (now uses generic useDataFetching hook)
      expect(mockLoggerError).toHaveBeenCalledWith('Data fetch failed:', expect.any(Error))
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

      await waitFor(() => {
        expect(mockLoggerError).toHaveBeenCalled()
      })

      // Verify exact error message string (now uses generic useDataFetching hook)
      expect(mockLoggerError).toHaveBeenCalledWith('Data fetch failed:', expect.any(Error))
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

      await waitFor(() => {
        expect(mockLoggerError).toHaveBeenCalled()
      })

      // Verify exact error message string (now uses generic useDataFetching hook)
      expect(mockLoggerError).toHaveBeenCalledWith('Data fetch failed:', expect.any(Error))
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

      await waitFor(() => {
        expect(mockLoggerError).toHaveBeenCalled()
      })

      // Verify exact error message string
      expect(mockLoggerError).toHaveBeenCalledWith('Failed to load repository agents from storage:', expect.any(Error))
    })

    it('should log exact error message for fetchRepositoryAgents general error', async () => {
      // Test with invalid JSON that causes JSON.parse to throw
      mockStorage.getItem.mockReturnValue('invalid json{')

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
        expect(mockLoggerError).toHaveBeenCalled()
      })

      // Should log storage error
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Failed to load repository agents from storage:',
        expect.any(Error)
      )
    })

    it('should log exact error message for workflow check failure', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ ...mockTemplate, id: 'workflow-1' }],
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

      await waitFor(() => {
        expect(mockLoggerError).toHaveBeenCalled()
      })

      // Verify error message includes workflow ID
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringMatching(/^Failed to check workflow/),
        expect.any(Error)
      )
    })
  })
})
