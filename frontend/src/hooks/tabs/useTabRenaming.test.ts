import { renderHook, act, waitFor } from '@testing-library/react'
import { useTabRenaming } from './useTabRenaming'
import { showError } from '../../utils/notifications'
import { logger } from '../../utils/logger'
import type { WorkflowTabData } from '../../../contexts/WorkflowTabsContext'

jest.mock('../../utils/notifications', () => ({
  showError: jest.fn(),
}))

jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

const mockShowError = showError as jest.MockedFunction<typeof showError>
const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>

describe('useTabRenaming', () => {
  let mockOnRename: jest.Mock
  const mockTabs: WorkflowTabData[] = [
    {
      id: 'tab-1',
      name: 'Workflow 1',
      workflowId: 'workflow-1',
      isUnsaved: false,
      executions: [],
      activeExecutionId: null,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockOnRename = jest.fn().mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('startEditing', () => {
    it('should start editing a tab', () => {
      const { result } = renderHook(() =>
        useTabRenaming({
          tabs: mockTabs,
          onRename: mockOnRename,
        })
      )

      act(() => {
        result.current.startEditing(mockTabs[0])
      })

      expect(result.current.editingTabId).toBe('tab-1')
      expect(result.current.editingName).toBe('Workflow 1')
    })

    it('should stop propagation on event if provided', () => {
      const { result } = renderHook(() =>
        useTabRenaming({
          tabs: mockTabs,
          onRename: mockOnRename,
        })
      )

      const mockEvent = {
        stopPropagation: jest.fn(),
      } as any

      act(() => {
        result.current.startEditing(mockTabs[0], mockEvent)
      })

      expect(mockEvent.stopPropagation).toHaveBeenCalled()
    })

    it('should work without event', () => {
      const { result } = renderHook(() =>
        useTabRenaming({
          tabs: mockTabs,
          onRename: mockOnRename,
        })
      )

      act(() => {
        result.current.startEditing(mockTabs[0])
      })

      expect(result.current.editingTabId).toBe('tab-1')
    })
  })

  describe('commitRename', () => {
    it('should rename tab successfully', async () => {
      const { result } = renderHook(() =>
        useTabRenaming({
          tabs: mockTabs,
          onRename: mockOnRename,
        })
      )

      act(() => {
        result.current.startEditing(mockTabs[0])
        result.current.setEditingName('New Name')
      })

      await act(async () => {
        await result.current.commitRename('tab-1', 'New Name')
      })

      expect(mockOnRename).toHaveBeenCalledWith('tab-1', 'New Name', 'Workflow 1')
      expect(result.current.editingTabId).toBeNull()
      expect(result.current.editingName).toBe('')
    })

    it('should trim whitespace from name', async () => {
      const { result } = renderHook(() =>
        useTabRenaming({
          tabs: mockTabs,
          onRename: mockOnRename,
        })
      )

      act(() => {
        result.current.startEditing(mockTabs[0])
      })

      await act(async () => {
        await result.current.commitRename('tab-1', '  New Name  ')
      })

      expect(mockOnRename).toHaveBeenCalledWith('tab-1', 'New Name', 'Workflow 1')
    })

    it('should show error for empty name', async () => {
      const { result } = renderHook(() =>
        useTabRenaming({
          tabs: mockTabs,
          onRename: mockOnRename,
        })
      )

      act(() => {
        result.current.startEditing(mockTabs[0])
      })

      await act(async () => {
        await result.current.commitRename('tab-1', '   ')
      })

      expect(mockShowError).toHaveBeenCalledWith('Workflow name cannot be empty.')
      expect(mockOnRename).not.toHaveBeenCalled()
    })

    it('should cancel editing if name unchanged', async () => {
      const { result } = renderHook(() =>
        useTabRenaming({
          tabs: mockTabs,
          onRename: mockOnRename,
        })
      )

      act(() => {
        result.current.startEditing(mockTabs[0])
      })

      await act(async () => {
        await result.current.commitRename('tab-1', 'Workflow 1')
      })

      expect(mockOnRename).not.toHaveBeenCalled()
      expect(result.current.editingTabId).toBeNull()
    })

    it('should handle rename error', async () => {
      mockOnRename.mockRejectedValue(new Error('Rename failed'))

      const { result } = renderHook(() =>
        useTabRenaming({
          tabs: mockTabs,
          onRename: mockOnRename,
        })
      )

      act(() => {
        result.current.startEditing(mockTabs[0])
        result.current.setEditingName('New Name')
      })

      await act(async () => {
        await result.current.commitRename('tab-1', 'New Name')
      })

      expect(mockLoggerError).toHaveBeenCalled()
      // Error handling is done in onRename callback, editing state may remain
      // The implementation doesn't clear editing state on error
      expect(mockOnRename).toHaveBeenCalled()
    })

    it('should return early if tab not found', async () => {
      const { result } = renderHook(() =>
        useTabRenaming({
          tabs: mockTabs,
          onRename: mockOnRename,
        })
      )

      act(() => {
        result.current.startEditing(mockTabs[0])
      })

      await act(async () => {
        await result.current.commitRename('nonexistent', 'New Name')
      })

      expect(mockOnRename).not.toHaveBeenCalled()
      expect(result.current.editingTabId).toBeNull()
    })

    it('should prevent concurrent renames', async () => {
      const { result } = renderHook(() =>
        useTabRenaming({
          tabs: mockTabs,
          onRename: mockOnRename,
        })
      )

      act(() => {
        result.current.startEditing(mockTabs[0])
        result.current.setEditingName('New Name')
      })

      // Start first rename
      const promise1 = result.current.commitRename('tab-1', 'New Name')
      // Try to start second rename immediately
      const promise2 = result.current.commitRename('tab-1', 'Another Name')

      await act(async () => {
        await Promise.all([promise1, promise2])
      })

      // Should only call onRename once
      expect(mockOnRename).toHaveBeenCalledTimes(1)
    })
  })

  describe('cancelEditing', () => {
    it('should cancel editing', () => {
      const { result } = renderHook(() =>
        useTabRenaming({
          tabs: mockTabs,
          onRename: mockOnRename,
        })
      )

      act(() => {
        result.current.startEditing(mockTabs[0])
        result.current.setEditingName('New Name')
      })

      act(() => {
        result.current.cancelEditing()
      })

      expect(result.current.editingTabId).toBeNull()
      expect(result.current.editingName).toBe('')
    })
  })

  describe('handleInputBlur', () => {
    it('should commit rename on blur', async () => {
      const { result } = renderHook(() =>
        useTabRenaming({
          tabs: mockTabs,
          onRename: mockOnRename,
        })
      )

      act(() => {
        result.current.startEditing(mockTabs[0])
        result.current.setEditingName('New Name')
      })

      act(() => {
        result.current.handleInputBlur('tab-1')
        jest.advanceTimersByTime(100)
      })

      await waitFor(() => {
        expect(mockOnRename).toHaveBeenCalled()
      })
    })

    it('should not commit if editing different tab', async () => {
      const { result } = renderHook(() =>
        useTabRenaming({
          tabs: mockTabs,
          onRename: mockOnRename,
        })
      )

      act(() => {
        result.current.startEditing(mockTabs[0])
      })

      act(() => {
        result.current.handleInputBlur('different-tab')
        jest.advanceTimersByTime(100)
      })

      await waitFor(() => {
        expect(mockOnRename).not.toHaveBeenCalled()
      }, { timeout: 200 })
    })
  })

  describe('handleInputKeyDown', () => {
    it('should commit rename on Enter', async () => {
      const { result } = renderHook(() =>
        useTabRenaming({
          tabs: mockTabs,
          onRename: mockOnRename,
        })
      )

      act(() => {
        result.current.startEditing(mockTabs[0])
        result.current.setEditingName('New Name')
      })

      const mockEvent = {
        key: 'Enter',
        preventDefault: jest.fn(),
      } as any

      await act(async () => {
        result.current.handleInputKeyDown('tab-1', mockEvent)
      })

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockOnRename).toHaveBeenCalled()
    })

    it('should cancel editing on Escape', () => {
      const { result } = renderHook(() =>
        useTabRenaming({
          tabs: mockTabs,
          onRename: mockOnRename,
        })
      )

      act(() => {
        result.current.startEditing(mockTabs[0])
      })

      const mockEvent = {
        key: 'Escape',
        preventDefault: jest.fn(),
      } as any

      act(() => {
        result.current.handleInputKeyDown('tab-1', mockEvent)
      })

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(result.current.editingTabId).toBeNull()
    })

    it('should not handle other keys', () => {
      const { result } = renderHook(() =>
        useTabRenaming({
          tabs: mockTabs,
          onRename: mockOnRename,
        })
      )

      act(() => {
        result.current.startEditing(mockTabs[0])
      })

      const mockEvent = {
        key: 'a',
        preventDefault: jest.fn(),
      } as any

      act(() => {
        result.current.handleInputKeyDown('tab-1', mockEvent)
      })

      expect(mockEvent.preventDefault).not.toHaveBeenCalled()
      expect(mockOnRename).not.toHaveBeenCalled()
    })
  })
})
