/**
 * Tests for useRepositoryAgentsData Hook
 */

import { renderHook } from '@testing-library/react'
import { useRepositoryAgentsData } from './useRepositoryAgentsData'
import { STORAGE_KEYS } from '../../config/constants'
import { logger } from '../../utils/logger'
import type { AgentTemplate } from './useMarketplaceData'

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>

describe('useRepositoryAgentsData', () => {
  let mockStorage: any

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
      getItem: jest.fn(),
      setItem: jest.fn(),
    }
  })

  it('should return fetchRepositoryAgents function', () => {
    const { result } = renderHook(() =>
      useRepositoryAgentsData({
        storage: mockStorage,
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    expect(result.current.fetchRepositoryAgents).toBeDefined()
    expect(typeof result.current.fetchRepositoryAgents).toBe('function')
  })

  it('should fetch repository agents from storage', async () => {
    mockStorage.getItem.mockReturnValue(JSON.stringify([mockAgent]))

    const { result } = renderHook(() =>
      useRepositoryAgentsData({
        storage: mockStorage,
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    const agents = await result.current.fetchRepositoryAgents()

    expect(mockStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.REPOSITORY_AGENTS)
    expect(agents).toEqual([mockAgent])
  })

  it('should return empty array when storage is null', async () => {
    const { result } = renderHook(() =>
      useRepositoryAgentsData({
        storage: null,
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    const agents = await result.current.fetchRepositoryAgents()

    expect(agents).toEqual([])
  })

  it('should return empty array when storage item is null', async () => {
    mockStorage.getItem.mockReturnValue(null)

    const { result } = renderHook(() =>
      useRepositoryAgentsData({
        storage: mockStorage,
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    const agents = await result.current.fetchRepositoryAgents()

    expect(agents).toEqual([])
  })

  it('should handle JSON parse errors', async () => {
    mockStorage.getItem.mockReturnValue('invalid json')

    const { result } = renderHook(() =>
      useRepositoryAgentsData({
        storage: mockStorage,
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    const agents = await result.current.fetchRepositoryAgents()

    expect(agents).toEqual([])
    expect(mockLoggerError).toHaveBeenCalled()
  })

  it('should apply filters and sorting', async () => {
    const agents = [
      { ...mockAgent, id: 'agent-1', category: 'automation', name: 'Agent A' },
      { ...mockAgent, id: 'agent-2', category: 'data', name: 'Agent B' },
    ]
    mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

    const { result } = renderHook(() =>
      useRepositoryAgentsData({
        storage: mockStorage,
        category: 'automation',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    const filteredAgents = await result.current.fetchRepositoryAgents()

    expect(filteredAgents.length).toBe(1)
    expect(filteredAgents[0].category).toBe('automation')
  })
})
