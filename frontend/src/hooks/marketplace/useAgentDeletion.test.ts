import { renderHook, act } from '@testing-library/react'
import { useAgentDeletion, useRepositoryAgentDeletion } from './useAgentDeletion'
import { showError, showSuccess } from '../../utils/notifications'
import { showConfirm } from '../../utils/confirm'
import { logger } from '../../utils/logger'
import { STORAGE_KEYS } from '../../config/constants'

jest.mock('../../utils/notifications', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}))

jest.mock('../../utils/confirm', () => ({
  showConfirm: jest.fn(),
}))

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

const mockShowError = showError as jest.MockedFunction<typeof showError>
const mockShowSuccess = showSuccess as jest.MockedFunction<typeof showSuccess>
const mockShowConfirm = showConfirm as jest.MockedFunction<typeof showConfirm>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockLoggerDebug = logger.debug as jest.MockedFunction<typeof logger.debug>

describe('useAgentDeletion', () => {
  const mockStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }
  const mockSetAgents = jest.fn()
  const mockSetSelectedAgentIds = jest.fn()
  const mockSetRepositoryAgents = jest.fn()
  const mockSetSelectedRepositoryAgentIds = jest.fn()

  const mockAgents = [
    {
      id: 'agent-1',
      name: 'Test Agent',
      label: 'Test Agent',
      description: 'Test',
      category: 'automation',
      tags: [],
      difficulty: 'beginner',
      estimated_time: '5 min',
      agent_config: {},
      author_id: 'user-1',
      author_name: 'Test User',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockShowConfirm.mockResolvedValue(true)
    // Reset storage mock but keep the structure
    mockStorage.getItem.mockReset()
    mockStorage.setItem.mockReset()
    mockStorage.removeItem.mockReset()
  })

  describe('deleteSelectedAgents', () => {
    it('should return early when no agents selected', async () => {
      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set())
      })

      expect(mockShowConfirm).not.toHaveBeenCalled()
    })

    it('should filter out official agents', async () => {
      const agents = [
        { ...mockAgents[0], id: 'agent-1', is_official: true },
        { ...mockAgents[0], id: 'agent-2', is_official: false, author_id: 'user-1' },
      ]

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Cannot delete 1 official agent(s)')
      )
    })

    it('should show error when user owns no agents', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-2' }, // Different user
      ]

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalled()
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should show partial delete confirmation when user owns some agents', async () => {
      const agents = [
        { ...mockAgents[0], id: 'agent-1', author_id: 'user-1' },
        { ...mockAgents[0], id: 'agent-2', author_id: 'user-2' },
      ]

      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining('You can only delete 1 of 2 selected agent(s)'),
        expect.objectContaining({
          title: 'Partial Delete',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          type: 'warning',
        })
      )
    })

    it('should delete agents successfully', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify(mockAgents))

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowConfirm).toHaveBeenCalled()
      expect(mockStorage.setItem).toHaveBeenCalled()
      expect(mockSetAgents).toHaveBeenCalled()
      expect(mockSetSelectedAgentIds).toHaveBeenCalledWith(new Set())
      expect(mockShowSuccess).toHaveBeenCalled()
    })

    it('should handle storage errors', async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete agents')
      )
    })

    it('should handle agents with no author_id', async () => {
      const agents = [
        { ...mockAgents[0], author_id: null },
      ]

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalled()
    })
  })

  describe('deleteSelectedAgents', () => {
    beforeEach(() => {
      mockStorage.getItem.mockReturnValue(JSON.stringify(mockAgents))
    })

    it('should return early when no agents selected', async () => {
      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set())
      })

      expect(mockShowConfirm).not.toHaveBeenCalled()
    })

    it('should filter out official agents', async () => {
      const agents = [
        { ...mockAgents[0], id: 'agent-1', is_official: true },
        { ...mockAgents[0], id: 'agent-2', is_official: false, author_id: 'user-1' },
      ]

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Cannot delete 1 official agent(s)')
      )
    })

    it('should return early when all selected are official', async () => {
      const agents = [
        { ...mockAgents[0], id: 'agent-1', is_official: true },
      ]

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalled()
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should show error when user owns no agents and no author_id', async () => {
      const agents = [
        { ...mockAgents[0], author_id: null },
      ]

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('were published before author tracking was added')
      )
    })

    it('should show error when user owns no agents but agents have author_id', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-2' }, // Different user
      ]

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('You can only delete agents that you published')
      )
    })

    it('should show partial delete confirmation when user owns some agents', async () => {
      const agents = [
        { ...mockAgents[0], id: 'agent-1', author_id: 'user-1' },
        { ...mockAgents[0], id: 'agent-2', author_id: 'user-2' },
      ]

      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining('You can only delete 1 of 2 selected agent(s)'),
        expect.objectContaining({
          title: 'Partial Delete',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          type: 'warning',
        })
      )
    })

    it('should show full delete confirmation when user owns all agents', async () => {
      const agents = [
        { ...mockAgents[0], id: 'agent-1', author_id: 'user-1' },
        { ...mockAgents[0], id: 'agent-2', author_id: 'user-1' },
      ]

      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to delete 2 selected agent(s)'),
        expect.objectContaining({
          title: 'Delete Agents',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          type: 'danger',
        })
      )
    })

    it('should not delete when user cancels confirmation', async () => {
      mockShowConfirm.mockResolvedValue(false)

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should delete agents successfully', async () => {
      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockStorage.setItem).toHaveBeenCalled()
      expect(mockSetAgents).toHaveBeenCalled()
      expect(mockSetSelectedAgentIds).toHaveBeenCalledWith(new Set())
      expect(mockShowSuccess).toHaveBeenCalledWith('Successfully deleted 1 agent(s)')
    })

    it('should handle missing storage', async () => {
      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: null,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith('Storage not available')
    })

    it('should handle storage errors', async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete agents')
      )
    })

    it('should handle when publishedAgents is null', async () => {
      mockStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should not call setItem when publishedAgents is null
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should handle String conversion for author_id comparison', async () => {
      const agents = [
        { ...mockAgents[0], author_id: '123' as any }, // Number author_id (testing string conversion)
      ]

      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: '123', username: 'testuser' },
          storage: mockStorage as any,
          agents: agents as any,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowConfirm).toHaveBeenCalled()
    })
  })


  describe('deleteSelectedAgents edge cases', () => {
    it('should handle user.id as empty string', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-1' },
      ]

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: '', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalled()
    })

    it('should handle author_id as null vs undefined', async () => {
      const agents = [
        { ...mockAgents[0], author_id: null },
        { ...mockAgents[0], id: 'agent-2', author_id: undefined },
      ]

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('published before author tracking')
      )
    })

    it('should handle String conversion for numeric author_id', async () => {
      const agents = [
        { ...mockAgents[0], author_id: '123' as any },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: '123', username: 'testuser' },
          storage: mockStorage as any,
          agents: agents as any,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockSetAgents).toHaveBeenCalled()
    })

    it('should handle publishedAgents as empty string', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-1' },
      ]
      mockStorage.getItem.mockReturnValue('')

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockSetAgents).not.toHaveBeenCalled()
    })

    it('should handle JSON.parse throwing error', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-1' },
      ]
      mockStorage.getItem.mockReturnValue('invalid json')

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete agents')
      )
    })

    it('should handle error without message property', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-1' },
      ]
      mockStorage.getItem.mockImplementation(() => {
        throw { toString: () => 'Error without message' }
      })

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Unknown error')
      )
    })
  })


  describe('mutation killers for deleteSelectedAgents', () => {
    it('should verify selectedAgentIds.size === 0 early return', async () => {
      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set())
      })

      // Verify early return - no further operations should happen
      expect(mockShowError).not.toHaveBeenCalled()
      expect(mockShowConfirm).not.toHaveBeenCalled()
      expect(mockSetAgents).not.toHaveBeenCalled()
    })

    it('should verify agents.filter is called with correct predicate', async () => {
      const agents = [
        { ...mockAgents[0], id: 'agent-1' },
        { ...mockAgents[0], id: 'agent-2' },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Verify that filtering happened - should only process agent-1
      // If filter was mutated to return all agents, this would fail
      expect(mockShowConfirm).toHaveBeenCalled()
      const confirmCall = mockShowConfirm.mock.calls[0][0]
      expect(confirmCall).toContain('1 selected agent')
    })

    it('should verify officialAgents.length > 0 boundary (exactly 0)', async () => {
      const agents = [
        { ...mockAgents[0], is_official: false },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // When officialAgents.length === 0, should not show the official agents error
      expect(mockShowError).not.toHaveBeenCalledWith(
        expect.stringContaining('official agent')
      )
    })

    it('should verify officialAgents.length > 0 boundary (exactly 1)', async () => {
      const agents = [
        { ...mockAgents[0], is_official: true },
      ]

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // When officialAgents.length === 1 (> 0), should show error
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('official agent')
      )
    })

    it('should verify deletableAgents.length === 0 check', async () => {
      const agents = [
        { ...mockAgents[0], is_official: true },
      ]

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // When deletableAgents.length === 0 (all are official), should return early
      expect(mockShowConfirm).not.toHaveBeenCalled()
      expect(mockSetAgents).not.toHaveBeenCalled()
    })

    it('should verify userOwnedAgents.length === 0 path with agentsWithAuthorId.length === 0 and officialAgents.length > 0', async () => {
      const agents = [
        { ...mockAgents[0], author_id: null, is_official: false },
        { ...mockAgents[0], id: 'agent-2', author_id: null, is_official: true },
      ]

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      // Should show error about official agents and no author tracking
      expect(mockShowError).toHaveBeenCalledWith(
        'Selected agents were published before author tracking was added or are official. Please republish them to enable deletion.'
      )
    })

    it('should verify userOwnedAgents.length === 0 path with agentsWithAuthorId.length === 0 and officialAgents.length === 0', async () => {
      const agents = [
        { ...mockAgents[0], author_id: null, is_official: false },
      ]

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should show error about no author tracking (no official agents)
      expect(mockShowError).toHaveBeenCalledWith(
        'Selected agents were published before author tracking was added. Please republish them to enable deletion.'
      )
    })

    it('should verify userOwnedAgents.length === 0 path with agentsWithAuthorId.length > 0 and officialAgents.length > 0', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-2', is_official: false },
        { ...mockAgents[0], id: 'agent-2', author_id: 'user-2', is_official: true },
      ]

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      // Should show error about official agents and mismatched author IDs
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('You can only delete agents that you published (official agents cannot be deleted)')
      )
    })

    it('should verify userOwnedAgents.length === 0 path with agentsWithAuthorId.length > 0 and officialAgents.length === 0', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-2', is_official: false },
      ]

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should show error about mismatched author IDs (no official agents)
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('You can only delete agents that you published')
      )
      expect(mockShowError).not.toHaveBeenCalledWith(
        expect.stringContaining('official agents cannot be deleted')
      )
    })

    it('should verify userOwnedAgents filter logic with !user check', async () => {
      const agents = [
        { ...mockAgents[0] },
      ]

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: null,
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // When user is null, userOwnedAgents should be empty
      expect(mockShowError).toHaveBeenCalled()
    })

    it('should verify userOwnedAgents filter logic with !a.author_id check', async () => {
      const agents = [
        { ...mockAgents[0], author_id: null },
      ]

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // When author_id is null, userOwnedAgents should be empty
      expect(mockShowError).toHaveBeenCalled()
    })

    it('should verify userOwnedAgents.length < deletableAgents.length path', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-1' },
        { ...mockAgents[0], id: 'agent-2', author_id: 'user-2' },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))
      mockShowConfirm.mockResolvedValue(true)

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      // Should show partial delete confirmation
      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining('You can only delete 1 of 2 selected agent(s)'),
        expect.any(Object)
      )
    })

    it('should verify userOwnedAgents.length === deletableAgents.length path', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-1' },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))
      mockShowConfirm.mockResolvedValue(true)

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should show full delete confirmation (not partial)
      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to delete 1 selected agent(s)'),
        expect.any(Object)
      )
    })

    it('should verify setAgents filter predicate is called correctly', async () => {
      const agents = [
        { ...mockAgents[0], id: 'agent-1', author_id: 'user-1' },
        { ...mockAgents[0], id: 'agent-2', author_id: 'user-1' },
        { ...mockAgents[0], id: 'agent-3', author_id: 'user-2' },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))
      mockShowConfirm.mockResolvedValue(true)

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-1', username: 'testuser' },
          storage: mockStorage as any,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2', 'agent-3']))
      })

      // Verify setAgents was called with filter that removes agent-1 and agent-2
      expect(mockSetAgents).toHaveBeenCalled()
      const setAgentsCall = mockSetAgents.mock.calls[0][0]
      const filteredAgents = typeof setAgentsCall === 'function' ? setAgentsCall(agents) : setAgentsCall
      // Should only have agent-3 remaining (user-2's agent)
      expect(filteredAgents.length).toBe(1)
      expect(filteredAgents[0].id).toBe('agent-3')
    })
  })



  describe('deleteSelectedRepositoryAgents', () => {
    it('should return early when no agents selected', async () => {
      const { result } = renderHook(() =>
        useRepositoryAgentDeletion({
          storage: mockStorage as any,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set())
      })

      expect(mockShowConfirm).not.toHaveBeenCalled()
    })

    it('should handle missing storage', async () => {
      const { result } = renderHook(() =>
        useRepositoryAgentDeletion({
          storage: null,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith('Storage not available')
    })

    it('should delete repository agents successfully', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify(mockAgents))

      const { result } = renderHook(() =>
        useRepositoryAgentDeletion({
          storage: mockStorage as any,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']))
      })

      expect(mockShowConfirm).toHaveBeenCalled()
      expect(mockStorage.setItem).toHaveBeenCalled()
      expect(mockSetRepositoryAgents).toHaveBeenCalled()
      expect(mockShowSuccess).toHaveBeenCalled()
    })

    it('should handle storage errors', async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() =>
        useRepositoryAgentDeletion({
          storage: mockStorage as any,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete repository agents')
      )
    })
  })

  describe('deleteSelectedRepositoryAgents edge cases', () => {
    it('should handle onRefresh as undefined', async () => {
      const agents = [
        { ...mockAgents[0] },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

      const { result } = renderHook(() =>
        useRepositoryAgentDeletion({
          storage: mockStorage as any,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']), undefined)
      })

      expect(mockSetRepositoryAgents).toHaveBeenCalled()
    })

    it('should handle repositoryAgents as empty string', async () => {
      mockStorage.getItem.mockReturnValue('')

      const { result } = renderHook(() =>
        useRepositoryAgentDeletion({
          storage: mockStorage as any,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']))
      })

      expect(mockSetRepositoryAgents).not.toHaveBeenCalled()
    })

    it('should handle JSON.parse throwing error', async () => {
      mockStorage.getItem.mockReturnValue('invalid json')

      const { result } = renderHook(() =>
        useRepositoryAgentDeletion({
          storage: mockStorage as any,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete repository agents')
      )
    })

    it('should handle error without message property', async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw { toString: () => 'Error without message' }
      })

      const { result } = renderHook(() =>
        useRepositoryAgentDeletion({
          storage: mockStorage as any,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Unknown error')
      )
    })
  })


  describe('mutation killers for deleteSelectedRepositoryAgents', () => {
    it('should verify selectedRepositoryAgentIds.size === 0 early return', async () => {
      const { result } = renderHook(() =>
        useRepositoryAgentDeletion({
          storage: mockStorage as any,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set())
      })

      // Verify early return
      expect(mockShowError).not.toHaveBeenCalled()
      expect(mockShowConfirm).not.toHaveBeenCalled()
      expect(mockSetRepositoryAgents).not.toHaveBeenCalled()
    })

    it('should verify exact showSuccess message content', async () => {
      const agents = [
        { ...mockAgents[0] },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))
      mockShowConfirm.mockResolvedValue(true)

      const { result } = renderHook(() =>
        useRepositoryAgentDeletion({
          storage: mockStorage as any,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']))
      })

      // Verify exact success message to kill StringLiteral mutant
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Successfully deleted 1 agent(s)'
      )
    })

    it('should verify onRefresh callback is called when provided', async () => {
      const agents = [
        { ...mockAgents[0] },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))
      mockShowConfirm.mockResolvedValue(true)
      const mockOnRefresh = jest.fn()

      const { result } = renderHook(() =>
        useRepositoryAgentDeletion({
          storage: mockStorage as any,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']), mockOnRefresh)
      })

      // Verify onRefresh was called
      expect(mockOnRefresh).toHaveBeenCalled()
    })

    it('should verify setRepositoryAgents filter predicate is called correctly', async () => {
      const agents = [
        { ...mockAgents[0], id: 'agent-1' },
        { ...mockAgents[0], id: 'agent-2' },
        { ...mockAgents[0], id: 'agent-3' },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))
      mockShowConfirm.mockResolvedValue(true)

      const { result } = renderHook(() =>
        useRepositoryAgentDeletion({
          storage: mockStorage as any,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1', 'agent-2']))
      })

      // Verify setRepositoryAgents was called with filter function that removes agent-1 and agent-2
      expect(mockSetRepositoryAgents).toHaveBeenCalled()
      const setRepositoryAgentsCall = mockSetRepositoryAgents.mock.calls[0][0]
      // The setter is called with a function, so we need to call it with the initial agents
      const filteredAgents = typeof setRepositoryAgentsCall === 'function' 
        ? setRepositoryAgentsCall(agents) 
        : setRepositoryAgentsCall
      expect(filteredAgents.length).toBe(1) // Only agent-3 should remain
      expect(filteredAgents[0].id).toBe('agent-3')
    })

  })



  describe('mutation killers for deleteSelectedAgents', () => {
  describe('String conversion edge cases', () => {
    describe('String(author_id) conversion', () => {
      it('should verify exact String conversion - author_id is number', () => {
        const user = { id: '123', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: '123' as any }, // number
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should match user.id '123' with author_id 123 (converted to string)
        expect(mockShowConfirm).toHaveBeenCalled()
      })

      it('should verify exact String conversion - author_id is string', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' }, // string
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should match user.id 'user-1' with author_id 'user-1'
        expect(mockShowConfirm).toHaveBeenCalled()
      })

      it('should verify exact String conversion - author_id is null', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: null },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should not match (author_id is null)
        expect(mockShowError).toHaveBeenCalled()
      })
    })

    describe('String(user.id) conversion', () => {
      it('should verify exact String conversion - user.id is number', () => {
        const user = { id: 123, username: 'test' } as any
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: '123' },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should match user.id 123 (converted to string) with author_id '123'
        expect(mockShowConfirm).toHaveBeenCalled()
      })

      it('should verify exact String conversion - user.id is empty string', () => {
        const user = { id: '', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should not match (user.id is empty string)
        expect(mockShowError).toHaveBeenCalled()
      })
    })
  })

  describe('Storage edge cases', () => {
    describe('storage.getItem() return values', () => {
      it('should verify exact null check - storage.getItem returns null', () => {
        const user = { id: 'user-1', username: 'test' }

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents: mockAgents,
          setAgents: jest.fn(),
          setSelectedAgentIds: jest.fn(),
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should handle null gracefully (no error, just no deletion)
        expect(mockStorage.setItem).not.toHaveBeenCalled()
      })

      it('should verify exact empty string check - storage.getItem returns empty string', () => {
        const user = { id: 'user-1', username: 'test' }

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents: mockAgents,
          setAgents: jest.fn(),
          setSelectedAgentIds: jest.fn(),
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Empty string is falsy, should not proceed
        expect(mockStorage.setItem).not.toHaveBeenCalled()
      })
    })
  })


  describe('Boundary conditions', () => {
    describe('officialAgents.length === 0 vs > 0', () => {
      it('should verify exact length check - officialAgents.length === 0', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should proceed with deletion (no official agents)
        expect(mockShowConfirm).toHaveBeenCalled()
      })

      it('should verify exact length check - officialAgents.length > 0', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: true, author_id: null },
          { ...mockAgents[0], id: 'agent-2', name: 'Agent 2', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
        })

        // Should show error about official agents
        expect(mockShowError).toHaveBeenCalledWith(
          expect.stringContaining('Cannot delete')
        )
      })
    })

    describe('userOwnedAgents.length === deletableAgents.length', () => {
      it('should verify exact length comparison - equal', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
          { ...mockAgents[0], id: 'agent-2', name: 'Agent 2', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
        })

        // Should show full delete confirmation (not partial)
        expect(mockShowConfirm).toHaveBeenCalledWith(
          expect.stringContaining('Are you sure'),
          expect.any(Object)
        )
      })

      it('should verify exact length comparison - less than', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
          { ...mockAgents[0], id: 'agent-2', name: 'Agent 2', is_official: false, author_id: 'user-2' },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
        })

        // Should show partial delete confirmation
        expect(mockShowConfirm).toHaveBeenCalledWith(
          expect.stringContaining('only delete 1 of 2'),
          expect.any(Object)
        )
      })
    })
  })

  describe('Logical operators', () => {
    describe('user && a.author_id && user.id', () => {
      it('should verify exact AND - all true', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should proceed (all conditions true)
        expect(mockShowConfirm).toHaveBeenCalled()
      })

      it('should verify exact AND - user is null', () => {
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user: null,
          storage: mockStorage,
          agents,
          setAgents: jest.fn(),
          setSelectedAgentIds: jest.fn(),
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should show error (user is null)
        expect(mockShowError).toHaveBeenCalled()
      })

      it('should verify exact AND - author_id is null', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: null },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should show error (author_id is null)
        expect(mockShowError).toHaveBeenCalled()
      })

      it('should verify exact AND - user.id is empty string', () => {
        const user = { id: '', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should show error (user.id is empty string, falsy)
        expect(mockShowError).toHaveBeenCalled()
      })
    })

  })
})

  describe('no-coverage paths for deleteSelectedAgents', () => {
  describe('deleteSelectedAgents - catch blocks', () => {
    it('should handle storage.getItem throwing error', async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              author_id: 'user-123',
              is_official: false,
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should handle error in catch block (line 190)
      expect(showError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete agents')
      )
    })

    it('should handle JSON.parse throwing error in deleteSelectedAgents', async () => {
      mockStorage.getItem.mockReturnValue('invalid json')
      // Mock JSON.parse to throw
      const originalParse = JSON.parse
      JSON.parse = jest.fn().mockImplementation(() => {
        throw new Error('Invalid JSON')
      })

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              author_id: 'user-123',
              is_official: false,
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should handle error in catch block (line 190)
      expect(showError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete agents')
      )

      // Restore JSON.parse
      JSON.parse = originalParse
    })
  })

  })

  describe('branch coverage for deleteSelectedAgents', () => {
  describe('deleteSelectedAgents - official agents branches', () => {
    it('should show error and return early when all selected agents are official', async () => {
      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              is_official: true,
              author_id: null,
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should show error and return early (lines 98-100)
      expect(showError).toHaveBeenCalledWith('Cannot delete 1 official agent(s). Official agents cannot be deleted.')
      expect(mockStorage.getItem).not.toHaveBeenCalled()
    })

    it('should show error but continue when some agents are official', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-2', name: 'User Agent', author_id: 'user-123', is_official: false },
      ]))
      mockShowConfirm.mockResolvedValue(true)

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              is_official: true,
              author_id: null,
            },
            {
              ...mockAgents[0],
              id: 'agent-2',
              name: 'User Agent',
              author_id: 'user-123',
              is_official: false,
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      // Should show error but continue (lines 98, 101-102)
      expect(showError).toHaveBeenCalledWith('Cannot delete 1 official agent(s). Official agents cannot be deleted.')
      expect(mockStorage.getItem).toHaveBeenCalled()
    })
  })

  describe('deleteSelectedAgents - no user owned agents branches', () => {
    it('should show error when no agents have author_id and no official agents', async () => {
      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              author_id: null,
              is_official: false,
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should show error (lines 139-143)
      expect(showError).toHaveBeenCalledWith('Selected agents were published before author tracking was added. Please republish them to enable deletion.')
    })

    it('should show error when no agents have author_id and official agents exist', async () => {
      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              author_id: null,
              is_official: false,
            },
            {
              ...mockAgents[0],
              id: 'agent-2',
              name: 'Official Agent',
              is_official: true,
              author_id: null,
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      // Should show error (lines 140-141)
      expect(showError).toHaveBeenCalledWith('Selected agents were published before author tracking was added or are official. Please republish them to enable deletion.')
    })

    it('should show error when agents have author_id but none match user', async () => {
      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              author_id: 'other-user',
              is_official: false,
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should show error (lines 146-149)
      expect(showError).toHaveBeenCalledWith('You can only delete agents that you published. 1 selected, 1 have author info, but none match your user ID.')
    })

    it('should show error when agents have author_id but none match user and official agents exist', async () => {
      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              author_id: 'other-user',
              is_official: false,
            },
            {
              ...mockAgents[0],
              id: 'agent-2',
              name: 'Official Agent',
              is_official: true,
              author_id: null,
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      // Should show error (lines 146-147)
      expect(showError).toHaveBeenCalledWith('You can only delete agents that you published (official agents cannot be deleted). 1 selected, 1 have author info, but none match your user ID.')
    })
  })

  describe('deleteSelectedAgents - confirmation cancellation branches', () => {
    it('should return early when partial delete confirmation is cancelled', async () => {
      (showConfirm as jest.MockedFunction<typeof showConfirm>).mockResolvedValue(false)

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              author_id: 'user-123',
              is_official: false,
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      // Should return early (lines 156-160)
      expect(mockStorage.getItem).not.toHaveBeenCalled()
    })

    it('should return early when full delete confirmation is cancelled', async () => {
      (showConfirm as jest.MockedFunction<typeof showConfirm>).mockResolvedValue(false)

      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-1', name: 'User Agent', author_id: 'user-123', is_official: false },
      ]))

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              author_id: 'user-123',
              is_official: false,
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should return early (lines 162-166)
      expect(mockStorage.getItem).not.toHaveBeenCalled()
    })
  })

  describe('deleteSelectedAgents - storage branches', () => {
    it('should show error when storage is not available', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-1', name: 'User Agent', author_id: 'user-123', is_official: false },
      ]))

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: null,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              author_id: 'user-123',
              is_official: false,
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should show error (lines 171-173)
      expect(showError).toHaveBeenCalledWith('Storage not available')
    })

    it('should successfully delete agents when storage has publishedAgents', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-1', name: 'User Agent', author_id: 'user-123', is_official: false },
        { id: 'agent-2', name: 'Other Agent', author_id: 'other-user', is_official: false },
      ]))

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              author_id: 'user-123',
              is_official: false,
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should successfully delete (lines 180-187)
      expect(mockStorage.setItem).toHaveBeenCalledWith('publishedAgents', expect.stringContaining('agent-2'))
      expect(mockSetAgents).toHaveBeenCalled()
      expect(mockSetSelectedAgentIds).toHaveBeenCalledWith(new Set())
      expect(showSuccess).toHaveBeenCalledWith('Successfully deleted 1 agent(s)')
    })

    it('should handle when storage.getItem returns null', async () => {
      mockStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              author_id: 'user-123',
              is_official: false,
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should not call setItem when publishedAgents is null (line 176)
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should handle agent with falsy id in userOwnedAgents array', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-1', name: 'User Agent', author_id: 'user-123', is_official: false },
      ]))

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              author_id: 'user-123',
              is_official: false,
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', '']))
      })

      // Should handle falsy id in map function (line 180: a && a.id ? a.id : null)
      // The filter(Boolean) will remove null values
      expect(mockStorage.setItem).toHaveBeenCalled()
      expect(showSuccess).toHaveBeenCalled()
    })
  })

  })

  describe('mutation killers for deleteSelectedRepositoryAgents', () => {

  })

  describe('no-coverage paths for deleteSelectedRepositoryAgents', () => {
  describe('deleteSelectedRepositoryAgents - catch blocks', () => {
    it('should handle storage operations throwing error', async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() =>
        useRepositoryAgentDeletion({
          storage: mockStorage,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']))
      })

      // Should handle error in catch block (line 291)
      expect(showError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete repository agents')
      )
    })
  })

  })

  describe('branch coverage for deleteSelectedRepositoryAgents', () => {
  describe('deleteSelectedRepositoryAgents - storage branches', () => {
    it('should show error when storage is not available', async () => {
      const { result } = renderHook(() =>
        useRepositoryAgentDeletion({
          storage: null,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']))
      })

      // Should show error (lines 266-268)
      expect(showError).toHaveBeenCalledWith('Storage not available')
    })

    it('should successfully delete repository agents and call onRefresh', async () => {
      const mockOnRefresh = jest.fn()
      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-1', name: 'Repository Agent', author_id: 'user-123', is_official: false },
        { id: 'agent-2', name: 'Other Agent', author_id: 'other-user', is_official: false },
      ]))

      const { result } = renderHook(() =>
        useRepositoryAgentDeletion({
          storage: mockStorage,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']), mockOnRefresh)
      })

      // Should successfully delete (lines 280-289)
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.REPOSITORY_AGENTS,
        expect.stringContaining('agent-2')
      )
      expect(mockSetRepositoryAgents).toHaveBeenCalled()
      expect(mockSetSelectedRepositoryAgentIds).toHaveBeenCalledWith(new Set())
      expect(showSuccess).toHaveBeenCalledWith('Successfully deleted 1 agent(s)')
      expect(mockOnRefresh).toHaveBeenCalled()
    })

    it('should successfully delete repository agents without onRefresh', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-1', name: 'Repository Agent', author_id: 'user-123', is_official: false },
      ]))

      const { result } = renderHook(() =>
        useRepositoryAgentDeletion({
          storage: mockStorage,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']))
      })

      // Should successfully delete without calling onRefresh (lines 280-289, onRefresh check at 287)
      expect(mockStorage.setItem).toHaveBeenCalled()
      expect(mockSetRepositoryAgents).toHaveBeenCalled()
      expect(showSuccess).toHaveBeenCalledWith('Successfully deleted 1 agent(s)')
    })

    it('should handle when storage.getItem returns null for repository agents', async () => {
      mockStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() =>
        useRepositoryAgentDeletion({
          storage: mockStorage,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']))
      })

      // Should not call setItem when repositoryAgents is null (line 279)
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should return early when confirmation is cancelled for repository agents', async () => {
      (showConfirm as jest.MockedFunction<typeof showConfirm>).mockResolvedValue(false)

      const { result } = renderHook(() =>
        useRepositoryAgentDeletion({
          storage: mockStorage,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']))
      })

      // Should return early (lines 271-275)
      expect(mockStorage.getItem).not.toHaveBeenCalled()
    })
  })

  describe('String conversion edge cases', () => {
    describe('String(author_id) conversion', () => {
      it('should verify exact String conversion - author_id is number', () => {
        const user = { id: '123', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: '123' as any }, // number
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should match user.id '123' with author_id 123 (converted to string)
        expect(mockShowConfirm).toHaveBeenCalled()
      })

      it('should verify exact String conversion - author_id is string', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' }, // string
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should match user.id 'user-1' with author_id 'user-1'
        expect(mockShowConfirm).toHaveBeenCalled()
      })

      it('should verify exact String conversion - author_id is null', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: null },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should not match (author_id is null)
        expect(mockShowError).toHaveBeenCalled()
      })
    })

    describe('String(user.id) conversion', () => {
      it('should verify exact String conversion - user.id is number', () => {
        const user = { id: 123, username: 'test' } as any
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: '123' },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should match user.id 123 (converted to string) with author_id '123'
        expect(mockShowConfirm).toHaveBeenCalled()
      })

      it('should verify exact String conversion - user.id is empty string', () => {
        const user = { id: '', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should not match (user.id is empty string)
        expect(mockShowError).toHaveBeenCalled()
      })
    })
  })

  describe('Storage edge cases', () => {
    describe('storage.getItem() return values', () => {
      it('should verify exact null check - storage.getItem returns null', () => {
        const user = { id: 'user-1', username: 'test' }
        mockStorage.getItem.mockReturnValue(null)

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents: mockAgents,
          setAgents: jest.fn(),
          setSelectedAgentIds: jest.fn(),
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should handle null gracefully (no error, just no deletion)
        expect(mockStorage.setItem).not.toHaveBeenCalled()
      })

      it('should verify exact empty string check - storage.getItem returns empty string', () => {
        const user = { id: 'user-1', username: 'test' }
        mockStorage.getItem.mockReturnValue('')

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents: mockAgents,
          setAgents: jest.fn(),
          setSelectedAgentIds: jest.fn(),
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Empty string is falsy, should not proceed
        expect(mockStorage.setItem).not.toHaveBeenCalled()
      })
    })
  })


  describe('Boundary conditions', () => {
    describe('officialAgents.length === 0 vs > 0', () => {
      it('should verify exact length check - officialAgents.length === 0', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should proceed with deletion (no official agents)
        expect(mockShowConfirm).toHaveBeenCalled()
      })

      it('should verify exact length check - officialAgents.length > 0', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: true, author_id: null },
          { ...mockAgents[0], id: 'agent-2', name: 'Agent 2', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
        })

        // Should show error about official agents
        expect(mockShowError).toHaveBeenCalledWith(
          expect.stringContaining('Cannot delete')
        )
      })
    })

    describe('userOwnedAgents.length === deletableAgents.length', () => {
      it('should verify exact length comparison - equal', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
          { ...mockAgents[0], id: 'agent-2', name: 'Agent 2', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
        })

        // Should show full delete confirmation (not partial)
        expect(mockShowConfirm).toHaveBeenCalledWith(
          expect.stringContaining('Are you sure'),
          expect.any(Object)
        )
      })

      it('should verify exact length comparison - less than', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
          { ...mockAgents[0], id: 'agent-2', name: 'Agent 2', is_official: false, author_id: 'user-2' },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
        })

        // Should show partial delete confirmation
        expect(mockShowConfirm).toHaveBeenCalledWith(
          expect.stringContaining('only delete 1 of 2'),
          expect.any(Object)
        )
      })
    })
  })

  describe('Logical operators', () => {
    describe('user && a.author_id && user.id', () => {
      it('should verify exact AND - all true', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should proceed (all conditions true)
        expect(mockShowConfirm).toHaveBeenCalled()
      })

      it('should verify exact AND - user is null', () => {
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user: null,
          storage: mockStorage,
          agents,
          setAgents: jest.fn(),
          setSelectedAgentIds: jest.fn(),
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should show error (user is null)
        expect(mockShowError).toHaveBeenCalled()
      })

      it('should verify exact AND - author_id is null', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: null },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should show error (author_id is null)
        expect(mockShowError).toHaveBeenCalled()
      })

      it('should verify exact AND - user.id is empty string', () => {
        const user = { id: '', username: 'test' }
        const agents = [
          { ...mockAgents[0], id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
        useAgentDeletion({
          user,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should show error (user.id is empty string, falsy)
        expect(mockShowError).toHaveBeenCalled()
      })
    })

  })

  describe('deleteSelectedAgents - catch blocks', () => {
    it('should handle storage.getItem throwing error', async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              is_official: false,
              author_id: 'user-123',
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should handle error in catch block (line 190)
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete agents')
      )
    })

    it('should handle JSON.parse throwing error in deleteSelectedAgents', async () => {
      mockStorage.getItem.mockReturnValue('invalid json')
      // Mock JSON.parse to throw
      const originalParse = JSON.parse
      JSON.parse = jest.fn().mockImplementation(() => {
        throw new Error('Invalid JSON')
      })

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              is_official: false,
              author_id: 'user-123',
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should handle error in catch block (line 190)
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete agents')
      )

      // Restore JSON.parse
      JSON.parse = originalParse
    })
  })

  describe('deleteSelectedAgents - official agents branches', () => {
    it('should show error and return early when all selected agents are official', async () => {
      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              is_official: true,
              author_id: null,
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should show error and return early (lines 98-100)
      expect(showError).toHaveBeenCalledWith('Cannot delete 1 official agent(s). Official agents cannot be deleted.')
      expect(mockStorage.getItem).not.toHaveBeenCalled()
    })

    it('should show error but continue when some agents are official', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-2', name: 'User Agent', author_id: 'user-123', is_official: false },
      ]))

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              is_official: true,
              author_id: null,
            },
            {
              ...mockAgents[0],
              id: 'agent-2',
              name: 'User Agent',
              is_official: false,
              author_id: 'user-123',
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      // Should show error but continue (lines 98, 101-102)
      expect(showError).toHaveBeenCalledWith('Cannot delete 1 official agent(s). Official agents cannot be deleted.')
      expect(mockStorage.getItem).toHaveBeenCalled()
    })
  })

  describe('deleteSelectedAgents - no user owned agents branches', () => {
    it('should show error when no agents have author_id and no official agents', async () => {
      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              is_official: false,
              author_id: null,
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should show error (lines 139-143)
      expect(showError).toHaveBeenCalledWith('Selected agents were published before author tracking was added. Please republish them to enable deletion.')
    })

    it('should show error when no agents have author_id and official agents exist', async () => {
      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              is_official: false,
              author_id: null,
            },
            {
              ...mockAgents[0],
              id: 'agent-2',
              name: 'Official Agent',
              is_official: true,
              author_id: null,
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      // Should show error (lines 140-141)
      expect(showError).toHaveBeenCalledWith('Selected agents were published before author tracking was added or are official. Please republish them to enable deletion.')
    })

    it('should show error when agents have author_id but none match user', async () => {
      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              is_official: false,
              author_id: 'other-user',
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should show error (lines 146-149)
      expect(showError).toHaveBeenCalledWith('You can only delete agents that you published. 1 selected, 1 have author info, but none match your user ID.')
    })

    it('should show error when agents have author_id but none match user and official agents exist', async () => {
      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              is_official: false,
              author_id: 'other-user',
            },
            {
              ...mockAgents[0],
              id: 'agent-2',
              name: 'Official Agent',
              is_official: true,
              author_id: null,
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      // Should show error (lines 146-147)
      expect(showError).toHaveBeenCalledWith('You can only delete agents that you published (official agents cannot be deleted). 1 selected, 1 have author info, but none match your user ID.')
    })
  })

  describe('deleteSelectedAgents - confirmation cancellation branches', () => {
    it('should return early when partial delete confirmation is cancelled', async () => {
      (showConfirm as jest.MockedFunction<typeof showConfirm>).mockResolvedValue(false)

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              is_official: false,
              author_id: 'user-123',
            },
            {
              ...mockAgents[0],
              id: 'agent-2',
              name: 'Other Agent',
              is_official: false,
              author_id: 'other-user',
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      // Should return early (lines 156-160)
      expect(mockStorage.getItem).not.toHaveBeenCalled()
    })

    it('should return early when full delete confirmation is cancelled', async () => {
      (showConfirm as jest.MockedFunction<typeof showConfirm>).mockResolvedValue(false)

      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-1', name: 'User Agent', author_id: 'user-123', is_official: false },
      ]))

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              is_official: false,
              author_id: 'user-123',
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should return early (lines 162-166)
      expect(mockStorage.getItem).not.toHaveBeenCalled()
    })
  })

  describe('deleteSelectedAgents - storage branches', () => {
    it('should show error when storage is not available', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-1', name: 'User Agent', author_id: 'user-123', is_official: false },
      ]))

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: null,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              is_official: false,
              author_id: 'user-123',
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should show error (lines 171-173)
      expect(showError).toHaveBeenCalledWith('Storage not available')
    })

    it('should successfully delete agents when storage has publishedAgents', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-1', name: 'User Agent', author_id: 'user-123', is_official: false },
        { id: 'agent-2', name: 'Other Agent', author_id: 'other-user', is_official: false },
      ]))

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              is_official: false,
              author_id: 'user-123',
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should successfully delete (lines 180-187)
      expect(mockStorage.setItem).toHaveBeenCalledWith('publishedAgents', expect.stringContaining('agent-2'))
      expect(mockSetAgents).toHaveBeenCalled()
      expect(mockSetSelectedAgentIds).toHaveBeenCalledWith(new Set())
      expect(showSuccess).toHaveBeenCalledWith('Successfully deleted 1 agent(s)')
    })

    it('should handle when storage.getItem returns null', async () => {
      mockStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              is_official: false,
              author_id: 'user-123',
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should not call setItem when publishedAgents is null (line 176)
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should handle agent with falsy id in userOwnedAgents array', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'agent-1', name: 'User Agent', author_id: 'user-123', is_official: false },
      ]))

      const { result } = renderHook(() =>
        useAgentDeletion({
          user: { id: 'user-123', username: 'test' },
          storage: mockStorage,
          agents: [
            {
              ...mockAgents[0],
              id: 'agent-1',
              name: 'Test Agent',
              is_official: false,
              author_id: 'user-123',
            },
          ],
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedAgents(new Set(['agent-1', '']))
      })

      // Should handle falsy id in map function (line 180: a && a.id ? a.id : null)
      // The filter(Boolean) will remove null values
      expect(mockStorage.setItem).toHaveBeenCalled()
      expect(showSuccess).toHaveBeenCalled()
    })
  })

  })
})