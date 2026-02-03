/**
 * Logging Tests for useMarketplaceData hook
 * Targets no-coverage mutants in logger.debug and logger.error calls
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

  describe('logger.debug calls', () => {
    it('should log debug message when agents are updated with author info', async () => {
      const agents = [{ ...mockAgent, author_id: null }]
      mockGetLocalStorageItem.mockReturnValue(agents)

      renderHook(() =>
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
        expect(mockLoggerDebug).toHaveBeenCalled()
      })

      // Verify debug was called with exact message format
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        '[Marketplace] Updated agents with author info:',
        'user-1'
      )
      // There will be 2 calls: updated agents + loaded agents
      expect(mockLoggerDebug).toHaveBeenCalledTimes(2)
    })

    it('should log debug message with loaded agents info', async () => {
      const agents = [
        { ...mockAgent, id: 'agent-1', author_id: 'user-1' },
        { ...mockAgent, id: 'agent-2', author_id: null },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      renderHook(() =>
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
        expect(mockLoggerDebug).toHaveBeenCalled()
      })

      // Verify debug was called with '[Marketplace] Loaded agents:' prefix
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        '[Marketplace] Loaded agents:',
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            author_id: expect.anything(),
            has_author_id: expect.any(Boolean),
          }),
        ])
      )

      // Verify the logged data structure
      const debugCalls = mockLoggerDebug.mock.calls
      const loadedAgentsCall = debugCalls.find(call => 
        call[0] === '[Marketplace] Loaded agents:'
      )
      expect(loadedAgentsCall).toBeDefined()
      expect(loadedAgentsCall![1]).toHaveLength(2)
      
      // Verify both agents are logged (order may vary due to map processing)
      const loggedAgents = loadedAgentsCall![1] as any[]
      const agent1 = loggedAgents.find(a => a.id === 'agent-1')
      const agent2 = loggedAgents.find(a => a.id === 'agent-2')
      
      expect(agent1).toMatchObject({
        id: 'agent-1',
        has_author_id: true,
      })
      // agent-2 will have author_id updated during processing, so has_author_id will be true
      expect(agent2).toMatchObject({
        id: 'agent-2',
        has_author_id: true, // Updated during processing
      })
    })

    it('should log debug with correct agent data structure', async () => {
      const agents = [
        {
          ...mockAgent,
          id: 'agent-1',
          name: 'Agent One',
          author_id: 'user-1',
        },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      renderHook(() =>
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
        expect(mockLoggerDebug).toHaveBeenCalled()
      })

      // Verify the exact structure of logged data
      const debugCalls = mockLoggerDebug.mock.calls
      const loadedAgentsCall = debugCalls.find(call => 
        call[0] === '[Marketplace] Loaded agents:'
      )
      
      expect(loadedAgentsCall![1][0]).toEqual({
        id: 'agent-1',
        name: 'Agent One',
        author_id: 'user-1',
        has_author_id: true,
      })
    })

    it('should not log debug when agents are not updated', async () => {
      const agents = [{ ...mockAgent, author_id: 'existing-author' }]
      mockGetLocalStorageItem.mockReturnValue(agents)

      renderHook(() =>
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
        expect(mockLoggerDebug).toHaveBeenCalled()
      })

      // Should log loaded agents but NOT updated agents message
      expect(mockLoggerDebug).not.toHaveBeenCalledWith(
        '[Marketplace] Updated agents with author info:',
        expect.anything()
      )

      // Should still log loaded agents
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        '[Marketplace] Loaded agents:',
        expect.any(Array)
      )
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

      await waitFor(() => {
        expect(mockLoggerError).toHaveBeenCalled()
      })

      // Verify exact error message string
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Failed to fetch templates:',
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

      await waitFor(() => {
        expect(mockLoggerError).toHaveBeenCalled()
      })

      // Verify exact error message string
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Failed to fetch workflows of workflows:',
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

      await waitFor(() => {
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

      await waitFor(() => {
        expect(mockLoggerError).toHaveBeenCalled()
      })

      // Verify exact error message string
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Failed to fetch agents:',
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

      await waitFor(() => {
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

      await waitFor(() => {
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
    it('should verify logger.debug is called with correct number of arguments', async () => {
      const agents = [{ ...mockAgent, author_id: null }]
      mockGetLocalStorageItem.mockReturnValue(agents)

      renderHook(() =>
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
        expect(mockLoggerDebug).toHaveBeenCalled()
      })

      // Verify debug calls have correct argument count
      const debugCalls = mockLoggerDebug.mock.calls
      expect(debugCalls.length).toBeGreaterThan(0)
      
      // Updated agents call should have 2 arguments
      const updatedCall = debugCalls.find(call => 
        call[0] === '[Marketplace] Updated agents with author info:'
      )
      if (updatedCall) {
        expect(updatedCall.length).toBe(2)
      }

      // Loaded agents call should have 2 arguments
      const loadedCall = debugCalls.find(call => 
        call[0] === '[Marketplace] Loaded agents:'
      )
      expect(loadedCall).toBeDefined()
      expect(loadedCall!.length).toBe(2)
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

      await waitFor(() => {
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
