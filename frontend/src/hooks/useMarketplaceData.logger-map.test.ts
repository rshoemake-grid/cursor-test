/**
 * Logger Map Operation Tests for useMarketplaceData hook
 * Phase 4.2: Tests for logger calls with map operations
 * Targets surviving mutants in logger.debug calls with map
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from './useLocalStorage'
import { logger } from '../utils/logger'

jest.mock('./useLocalStorage', () => ({
  getLocalStorageItem: jest.fn(),
}))

jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>
const mockLoggerDebug = logger.debug as jest.MockedFunction<typeof logger.debug>

describe('useMarketplaceData - Logger Map Operations (Phase 4.2)', () => {
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

  describe('Logger.debug with map - agentsData.map()', () => {
    it('should call logger.debug with agentsData.map() result', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          author_id: 'user-1',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
        {
          id: 'agent-2',
          name: 'Agent 2',
          author_id: null,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
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
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(mockLoggerDebug).toHaveBeenCalled()
      })

      // Should call: logger.debug('[Marketplace] Loaded agents:', agentsData.map(...))
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        '[Marketplace] Loaded agents:',
        expect.any(Array)
      )
    })

    it('should map agent properties in logger.debug call', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          author_id: 'user-1',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
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
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(mockLoggerDebug).toHaveBeenCalled()
      })

      // Should map: { id: a.id, name: a.name, author_id: a.author_id, has_author_id: !!a.author_id }
      const callArgs = mockLoggerDebug.mock.calls.find(
        (call) => call[0] === '[Marketplace] Loaded agents:'
      )
      expect(callArgs).toBeDefined()
      const mappedData = callArgs![1] as any[]
      expect(mappedData[0]).toHaveProperty('id')
      expect(mappedData[0]).toHaveProperty('name')
      expect(mappedData[0]).toHaveProperty('author_id')
      expect(mappedData[0]).toHaveProperty('has_author_id')
    })

    it('should access a.id property in map callback', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          author_id: null,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
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
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(mockLoggerDebug).toHaveBeenCalled()
      })

      // Should access: a.id
      const callArgs = mockLoggerDebug.mock.calls.find(
        (call) => call[0] === '[Marketplace] Loaded agents:'
      )
      const mappedData = callArgs![1] as any[]
      expect(mappedData[0].id).toBe('agent-1')
    })

    it('should access a.name property in map callback', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Test Agent',
          author_id: null,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
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
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(mockLoggerDebug).toHaveBeenCalled()
      })

      // Should access: a.name
      const callArgs = mockLoggerDebug.mock.calls.find(
        (call) => call[0] === '[Marketplace] Loaded agents:'
      )
      const mappedData = callArgs![1] as any[]
      expect(mappedData[0].name).toBe('Test Agent')
    })

    it('should access a.author_id property in map callback', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          author_id: 'user-123',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
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
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(mockLoggerDebug).toHaveBeenCalled()
      })

      // Should access: a.author_id
      const callArgs = mockLoggerDebug.mock.calls.find(
        (call) => call[0] === '[Marketplace] Loaded agents:'
      )
      const mappedData = callArgs![1] as any[]
      expect(mappedData[0].author_id).toBe('user-123')
    })

    it('should compute has_author_id with !!a.author_id', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          author_id: 'user-1',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
        {
          id: 'agent-2',
          name: 'Agent 2',
          author_id: null,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
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
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(mockLoggerDebug).toHaveBeenCalled()
      })

      // Should compute: has_author_id: !!a.author_id
      const callArgs = mockLoggerDebug.mock.calls.find(
        (call) => call[0] === '[Marketplace] Loaded agents:'
      )
      const mappedData = callArgs![1] as any[]
      expect(mappedData[0].has_author_id).toBe(true) // user-1 is truthy
      expect(mappedData[1].has_author_id).toBe(false) // null is falsy
    })

    it('should verify exact logger.debug message string', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent',
          author_id: null,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
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
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(mockLoggerDebug).toHaveBeenCalled()
      })

      // Should use exact string: '[Marketplace] Loaded agents:'
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        '[Marketplace] Loaded agents:',
        expect.any(Array)
      )
    })

    it('should map all agents in agentsData array', async () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          author_id: 'user-1',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
        {
          id: 'agent-2',
          name: 'Agent 2',
          author_id: 'user-2',
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
        },
        {
          id: 'agent-3',
          name: 'Agent 3',
          author_id: null,
          category: 'automation',
          tags: [],
          published_at: '2024-01-01T00:00:00Z',
          is_official: false,
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
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitFor(() => {
        expect(mockLoggerDebug).toHaveBeenCalled()
      })

      // Should map all agents: agentsData.map(a => ({ ... }))
      const callArgs = mockLoggerDebug.mock.calls.find(
        (call) => call[0] === '[Marketplace] Loaded agents:'
      )
      const mappedData = callArgs![1] as any[]
      expect(mappedData.length).toBe(3)
    })
  })
})
