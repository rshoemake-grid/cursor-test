/**
 * Tests for useAgentsData Hook
 */

import { renderHook } from '@testing-library/react'
import { useAgentsData } from './useAgentsData'
import { getLocalStorageItem } from '../storage'
import { STORAGE_KEYS } from '../../config/constants'
import type { AgentTemplate } from './useMarketplaceData'

jest.mock('../storage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<
  typeof getLocalStorageItem
>

const mockHttpClient = {
  get: jest.fn().mockRejectedValue(new Error('API unavailable')),
}

describe('useAgentsData', () => {
  let mockStorage: any

  const defaultOptions = {
    httpClient: mockHttpClient,
    apiBaseUrl: 'http://api.test',
  }

  const mockAgent: AgentTemplate = {
    id: 'agent-1',
    name: 'Test Agent',
    label: 'Test Agent',
    description: 'Test Description',
    category: 'automation',
    tags: ['test'],
    difficulty: 'beginner',
    estimated_time: '5 min',
    agent_config: {},
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockStorage = {
      setItem: jest.fn(),
      getItem: jest.fn(),
    }
    mockGetLocalStorageItem.mockReturnValue([])
  })

  it('should return fetchAgents function', () => {
    const { result } = renderHook(() =>
      useAgentsData({
        ...defaultOptions,
        storage: mockStorage,
        category: '',
        searchQuery: '',
        sortBy: 'popular',
        user: null,
      })
    )

    expect(result.current.fetchAgents).toBeDefined()
    expect(typeof result.current.fetchAgents).toBe('function')
  })

  it('should fetch agents from localStorage', async () => {
    mockGetLocalStorageItem.mockReturnValue([mockAgent])

    const { result } = renderHook(() =>
      useAgentsData({
        ...defaultOptions,
        storage: mockStorage,
        category: '',
        searchQuery: '',
        sortBy: 'popular',
        user: null,
      })
    )

    const agents = await result.current.fetchAgents()

    expect(mockGetLocalStorageItem).toHaveBeenCalledWith(
      STORAGE_KEYS.PUBLISHED_AGENTS,
      []
    )
    expect(agents).toEqual([mockAgent])
  })

  it('should migrate agents with author info when user provided', async () => {
    const agentWithoutAuthor = { ...mockAgent, author_id: undefined }
    mockGetLocalStorageItem.mockReturnValue([agentWithoutAuthor])

    const { result } = renderHook(() =>
      useAgentsData({
        ...defaultOptions,
        storage: mockStorage,
        category: '',
        searchQuery: '',
        sortBy: 'popular',
        user: { id: 'user-1', username: 'testuser' },
      })
    )

    const agents = await result.current.fetchAgents()

    expect(agents[0].author_id).toBe('user-1')
    expect(agents[0].author_name).toBe('testuser')
    expect(mockStorage.setItem).toHaveBeenCalled()
  })

    it('should not migrate agents that already have author_id', async () => {
      const agentWithAuthor = { ...mockAgent, author_id: 'existing-user' }
      mockGetLocalStorageItem.mockReturnValue([agentWithAuthor])

      const { result } = renderHook(() =>
        useAgentsData({
          ...defaultOptions,
          storage: mockStorage,
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: { id: 'user-1' },
        })
      )

      const agents = await result.current.fetchAgents()

      expect(agents[0].author_id).toBe('existing-user')
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should use email when username is not provided', async () => {
      const agentWithoutAuthor = { ...mockAgent, author_id: undefined }
      mockGetLocalStorageItem.mockReturnValue([agentWithoutAuthor])

      const { result } = renderHook(() =>
        useAgentsData({
          ...defaultOptions,
          storage: mockStorage,
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: { id: 'user-1', email: 'user@example.com' },
        })
      )

      const agents = await result.current.fetchAgents()

      expect(agents[0].author_id).toBe('user-1')
      expect(agents[0].author_name).toBe('user@example.com')
    })

    it('should use null for author_name when neither username nor email provided', async () => {
      const agentWithoutAuthor = { ...mockAgent, author_id: undefined }
      mockGetLocalStorageItem.mockReturnValue([agentWithoutAuthor])

      const { result } = renderHook(() =>
        useAgentsData({
          ...defaultOptions,
          storage: mockStorage,
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: { id: 'user-1' },
        })
      )

      const agents = await result.current.fetchAgents()

      expect(agents[0].author_id).toBe('user-1')
      expect(agents[0].author_name).toBeNull()
    })

  it('should apply filters and sorting', async () => {
    const agents = [
      { ...mockAgent, id: 'agent-1', category: 'automation', name: 'Agent A' },
      { ...mockAgent, id: 'agent-2', category: 'data', name: 'Agent B' },
    ]
    mockGetLocalStorageItem.mockReturnValue(agents)

    const { result } = renderHook(() =>
      useAgentsData({
        ...defaultOptions,
        storage: mockStorage,
        category: 'automation',
        searchQuery: '',
        sortBy: 'popular',
        user: null,
      })
    )

    const filteredAgents = await result.current.fetchAgents()

    expect(filteredAgents.length).toBe(1)
    expect(filteredAgents[0].category).toBe('automation')
  })

  it('should handle null storage', async () => {
    const { result } = renderHook(() =>
      useAgentsData({
        ...defaultOptions,
        storage: null,
        category: '',
        searchQuery: '',
        sortBy: 'popular',
        user: null,
      })
    )

    const agents = await result.current.fetchAgents()

    expect(agents).toEqual([])
  })

  it('should use API when available', async () => {
    const apiAgents = [
      {
        id: 'api-1',
        name: 'API Agent',
        description: 'From API',
        category: 'automation',
        tags: [],
        difficulty: 'beginner',
        estimated_time: '5 min',
        agent_config: {},
        author_id: 'u1',
        author_name: 'admin',
        is_official: true,
      },
    ]
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(apiAgents),
    })
    const okHttpClient = { get: mockFetch }

    const { result } = renderHook(() =>
      useAgentsData({
        httpClient: okHttpClient,
        apiBaseUrl: 'http://api.test',
        storage: mockStorage,
        category: '',
        searchQuery: '',
        sortBy: 'popular',
        user: null,
      })
    )

    const agents = await result.current.fetchAgents()

    expect(mockFetch).toHaveBeenCalledWith('http://api.test/marketplace/agents')
    expect(agents).toHaveLength(1)
    expect(agents[0].name).toBe('API Agent')
    expect(agents[0].label).toBe('API Agent')
  })
})
