/**
 * Tests for Agent Deletion Service
 * Tests shared deletion logic functionality
 */

import {
  deleteAgentsFromStorage,
  extractAgentIds,
  updateStateAfterDeletion,
  DeletionResult,
} from './agentDeletionService'
import type { StorageAdapter } from '../../types/adapters'
import type { AgentTemplate } from '../marketplace/useMarketplaceData'

describe('deleteAgentsFromStorage', () => {
  let mockStorage: StorageAdapter
  let mockCallbacks: {
    showError: jest.Mock
    showSuccess: jest.Mock
    onComplete?: jest.Mock
    errorPrefix?: string
  }

  const mockAgents: AgentTemplate[] = [
    {
      id: 'agent-1',
      name: 'Agent 1',
      label: 'Agent 1',
      description: 'Test',
      category: 'automation',
      tags: [],
      difficulty: 'beginner',
      estimated_time: '5 min',
      agent_config: {},
    },
    {
      id: 'agent-2',
      name: 'Agent 2',
      label: 'Agent 2',
      description: 'Test',
      category: 'automation',
      tags: [],
      difficulty: 'beginner',
      estimated_time: '5 min',
      agent_config: {},
    },
    {
      id: 'agent-3',
      name: 'Agent 3',
      label: 'Agent 3',
      description: 'Test',
      category: 'automation',
      tags: [],
      difficulty: 'beginner',
      estimated_time: '5 min',
      agent_config: {},
    },
  ]

  beforeEach(() => {
    mockCallbacks = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
      onComplete: jest.fn(),
    }

    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as any
  })

  it('should return error when storage is not available', () => {
    const result = deleteAgentsFromStorage(
      null,
      'testKey',
      new Set(['agent-1']),
      mockCallbacks
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('Storage not available')
    expect(result.deletedCount).toBe(0)
    expect(mockCallbacks.showError).toHaveBeenCalledWith('Storage not available')
  })

  it('should return error when storage.getItem returns null', () => {
    mockStorage.getItem!.mockReturnValue(null)

    const result = deleteAgentsFromStorage(
      mockStorage,
      'testKey',
      new Set(['agent-1']),
      mockCallbacks
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('No agents found in storage')
    expect(result.deletedCount).toBe(0)
    expect(mockCallbacks.showError).toHaveBeenCalledWith('No agents found in storage')
  })

  it('should successfully delete agents', () => {
    mockStorage.getItem!.mockReturnValue(JSON.stringify(mockAgents))
    mockStorage.setItem!.mockReturnValue(undefined)

    const result = deleteAgentsFromStorage(
      mockStorage,
      'testKey',
      new Set(['agent-1', 'agent-2']),
      mockCallbacks
    )

    expect(result.success).toBe(true)
    expect(result.deletedCount).toBe(2)
    expect(mockCallbacks.showSuccess).toHaveBeenCalledWith('Successfully deleted 2 agent(s)')
    expect(mockCallbacks.onComplete).toHaveBeenCalled()
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'testKey',
      JSON.stringify([mockAgents[2]])
    )
  })

  it('should handle deletion of all agents', () => {
    mockStorage.getItem!.mockReturnValue(JSON.stringify(mockAgents))
    mockStorage.setItem!.mockReturnValue(undefined)

    const result = deleteAgentsFromStorage(
      mockStorage,
      'testKey',
      new Set(['agent-1', 'agent-2', 'agent-3']),
      mockCallbacks
    )

    expect(result.success).toBe(true)
    expect(result.deletedCount).toBe(3)
    expect(mockStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify([]))
  })

  it('should handle deletion of non-existent agents', () => {
    mockStorage.getItem!.mockReturnValue(JSON.stringify(mockAgents))
    mockStorage.setItem!.mockReturnValue(undefined)

    const result = deleteAgentsFromStorage(
      mockStorage,
      'testKey',
      new Set(['agent-999']),
      mockCallbacks
    )

    expect(result.success).toBe(true)
    expect(result.deletedCount).toBe(0)
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'testKey',
      JSON.stringify(mockAgents)
    )
  })

  it('should return error when setItem fails', () => {
    mockStorage.getItem!.mockReturnValue(JSON.stringify(mockAgents))
    // setStorageItem returns false when setItem throws an error
    mockStorage.setItem!.mockImplementation(() => {
      throw new Error('Storage write failed')
    })

    const result = deleteAgentsFromStorage(
      mockStorage,
      'testKey',
      new Set(['agent-1']),
      mockCallbacks
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to save to storage')
    expect(result.deletedCount).toBe(0)
    expect(mockCallbacks.showError).toHaveBeenCalledWith('Failed to save to storage')
  })

  it('should handle JSON parse errors', () => {
    mockStorage.getItem!.mockReturnValue('invalid json')

    const result = deleteAgentsFromStorage(
      mockStorage,
      'testKey',
      new Set(['agent-1']),
      mockCallbacks
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to delete agents')
    expect(result.deletedCount).toBe(0)
    expect(mockCallbacks.showError).toHaveBeenCalled()
  })

  it('should use errorPrefix in error messages', () => {
    mockStorage.getItem!.mockReturnValue('invalid json')
    const callbacksWithPrefix = {
      ...mockCallbacks,
      errorPrefix: 'repository agents',
    }

    const result = deleteAgentsFromStorage(
      mockStorage,
      'testKey',
      new Set(['agent-1']),
      callbacksWithPrefix
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('repository agents')
    expect(mockCallbacks.showError).toHaveBeenCalledWith(
      expect.stringContaining('repository agents')
    )
  })

  it('should handle empty agentIdsToDelete set', () => {
    mockStorage.getItem!.mockReturnValue(JSON.stringify(mockAgents))
    mockStorage.setItem!.mockReturnValue(undefined)

    const result = deleteAgentsFromStorage(
      mockStorage,
      'testKey',
      new Set(),
      mockCallbacks
    )

    expect(result.success).toBe(true)
    expect(result.deletedCount).toBe(0)
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'testKey',
      JSON.stringify(mockAgents)
    )
  })
})

describe('extractAgentIds', () => {
  it('should extract IDs from agent array', () => {
    const agents: AgentTemplate[] = [
      {
        id: 'agent-1',
        name: 'Agent 1',
        label: 'Agent 1',
        description: 'Test',
        category: 'automation',
        tags: [],
        difficulty: 'beginner',
        estimated_time: '5 min',
        agent_config: {},
      },
      {
        id: 'agent-2',
        name: 'Agent 2',
        label: 'Agent 2',
        description: 'Test',
        category: 'automation',
        tags: [],
        difficulty: 'beginner',
        estimated_time: '5 min',
        agent_config: {},
      },
    ]

    const result = extractAgentIds(agents)

    expect(result).toBeInstanceOf(Set)
    expect(result.size).toBe(2)
    expect(result.has('agent-1')).toBe(true)
    expect(result.has('agent-2')).toBe(true)
  })

  it('should return empty set for empty array', () => {
    const result = extractAgentIds([])

    expect(result).toBeInstanceOf(Set)
    expect(result.size).toBe(0)
  })

  it('should filter out agents with null/undefined ids', () => {
    const agents: any[] = [
      { id: 'agent-1' },
      { id: null },
      { id: undefined },
      { id: 'agent-2' },
      {}, // no id property
    ]

    const result = extractAgentIds(agents as AgentTemplate[])

    expect(result.size).toBe(2)
    expect(result.has('agent-1')).toBe(true)
    expect(result.has('agent-2')).toBe(true)
  })

  it('should handle null agents in array', () => {
    const agents: any[] = [
      { id: 'agent-1' },
      null,
      { id: 'agent-2' },
    ]

    const result = extractAgentIds(agents as AgentTemplate[])

    expect(result.size).toBe(2)
    expect(result.has('agent-1')).toBe(true)
    expect(result.has('agent-2')).toBe(true)
  })

  it('should return empty set for null array', () => {
    const result = extractAgentIds(null as any)

    expect(result).toBeInstanceOf(Set)
    expect(result.size).toBe(0)
  })
})

describe('updateStateAfterDeletion', () => {
  it('should update agents state by removing deleted IDs', () => {
    const mockSetAgents = jest.fn()
    const mockSetSelectedIds = jest.fn()

    const agents: AgentTemplate[] = [
      {
        id: 'agent-1',
        name: 'Agent 1',
        label: 'Agent 1',
        description: 'Test',
        category: 'automation',
        tags: [],
        difficulty: 'beginner',
        estimated_time: '5 min',
        agent_config: {},
      },
      {
        id: 'agent-2',
        name: 'Agent 2',
        label: 'Agent 2',
        description: 'Test',
        category: 'automation',
        tags: [],
        difficulty: 'beginner',
        estimated_time: '5 min',
        agent_config: {},
      },
      {
        id: 'agent-3',
        name: 'Agent 3',
        label: 'Agent 3',
        description: 'Test',
        category: 'automation',
        tags: [],
        difficulty: 'beginner',
        estimated_time: '5 min',
        agent_config: {},
      },
    ]

    updateStateAfterDeletion(
      new Set(['agent-1', 'agent-3']),
      mockSetAgents,
      mockSetSelectedIds
    )

    expect(mockSetAgents).toHaveBeenCalled()
    const updateFn = mockSetAgents.mock.calls[0][0]
    const result = updateFn(agents)
    expect(result).toEqual([agents[1]]) // Only agent-2 remains

    expect(mockSetSelectedIds).toHaveBeenCalledWith(new Set())
  })

  it('should clear selected IDs', () => {
    const mockSetAgents = jest.fn()
    const mockSetSelectedIds = jest.fn()

    updateStateAfterDeletion(
      new Set(['agent-1']),
      mockSetAgents,
      mockSetSelectedIds
    )

    expect(mockSetSelectedIds).toHaveBeenCalledWith(new Set())
  })

  it('should handle empty deletion set', () => {
    const mockSetAgents = jest.fn()
    const mockSetSelectedIds = jest.fn()
    const agents: AgentTemplate[] = [
      {
        id: 'agent-1',
        name: 'Agent 1',
        label: 'Agent 1',
        description: 'Test',
        category: 'automation',
        tags: [],
        difficulty: 'beginner',
        estimated_time: '5 min',
        agent_config: {},
      },
    ]

    updateStateAfterDeletion(new Set(), mockSetAgents, mockSetSelectedIds)

    const updateFn = mockSetAgents.mock.calls[0][0]
    const result = updateFn(agents)
    expect(result).toEqual(agents) // All agents remain

    expect(mockSetSelectedIds).toHaveBeenCalledWith(new Set())
  })

  it('should handle deletion of all agents', () => {
    const mockSetAgents = jest.fn()
    const mockSetSelectedIds = jest.fn()
    const agents: AgentTemplate[] = [
      {
        id: 'agent-1',
        name: 'Agent 1',
        label: 'Agent 1',
        description: 'Test',
        category: 'automation',
        tags: [],
        difficulty: 'beginner',
        estimated_time: '5 min',
        agent_config: {},
      },
    ]

    updateStateAfterDeletion(new Set(['agent-1']), mockSetAgents, mockSetSelectedIds)

    const updateFn = mockSetAgents.mock.calls[0][0]
    const result = updateFn(agents)
    expect(result).toEqual([]) // No agents remain

    expect(mockSetSelectedIds).toHaveBeenCalledWith(new Set())
  })
})
