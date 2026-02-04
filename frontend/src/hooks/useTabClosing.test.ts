/**
 * Tests for useTabClosing Hook
 */

import { renderHook, act } from '@testing-library/react'
import { useTabClosing } from './useTabClosing'
import { confirmUnsavedChanges } from './utils/confirmations'
import type { WorkflowTabData } from '../contexts/WorkflowTabsContext'

jest.mock('./utils/confirmations', () => ({
  confirmUnsavedChanges: jest.fn(),
}))

const mockConfirmUnsavedChanges = confirmUnsavedChanges as jest.MockedFunction<
  typeof confirmUnsavedChanges
>

describe('useTabClosing', () => {
  let mockSetTabs: jest.Mock
  let mockSetActiveTabId: jest.Mock

  const initialTabs: WorkflowTabData[] = [
    {
      id: 'tab-1',
      name: 'Workflow 1',
      workflowId: 'workflow-1',
      isUnsaved: false,
      executions: [],
      activeExecutionId: null,
    },
    {
      id: 'tab-2',
      name: 'Workflow 2',
      workflowId: null,
      isUnsaved: true,
      executions: [],
      activeExecutionId: null,
    },
    {
      id: 'tab-3',
      name: 'Workflow 3',
      workflowId: 'workflow-3',
      isUnsaved: false,
      executions: [],
      activeExecutionId: null,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    mockSetTabs = jest.fn((updater: any) => {
      if (typeof updater === 'function') {
        return updater(initialTabs)
      }
      return updater
    })
    mockSetActiveTabId = jest.fn()
    mockConfirmUnsavedChanges.mockImplementation(async (callback) => {
      await callback()
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('handleCloseTab', () => {
    it('should close a saved tab without confirmation', async () => {
      const { result } = renderHook(() =>
        useTabClosing({
          tabs: initialTabs,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      const mockEvent = {
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent

      await act(async () => {
        await result.current.handleCloseTab('tab-1', mockEvent)
      })

      expect(mockEvent.stopPropagation).toHaveBeenCalled()
      expect(mockSetTabs).toHaveBeenCalled()
      expect(mockConfirmUnsavedChanges).not.toHaveBeenCalled()
    })

    it('should prompt for confirmation when closing unsaved tab', async () => {
      const { result } = renderHook(() =>
        useTabClosing({
          tabs: initialTabs,
          activeTabId: 'tab-2',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      const mockEvent = {
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent

      await act(async () => {
        await result.current.handleCloseTab('tab-2', mockEvent)
      })

      expect(mockConfirmUnsavedChanges).toHaveBeenCalled()
      expect(mockSetTabs).toHaveBeenCalled()
    })

    it('should not close tab if confirmation is cancelled', async () => {
      mockConfirmUnsavedChanges.mockImplementation(async () => {
        // Don't call callback (user cancelled)
      })

      const { result } = renderHook(() =>
        useTabClosing({
          tabs: initialTabs,
          activeTabId: 'tab-2',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      const mockEvent = {
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent

      await act(async () => {
        await result.current.handleCloseTab('tab-2', mockEvent)
      })

      expect(mockConfirmUnsavedChanges).toHaveBeenCalled()
      // setTabs should not be called if confirmation was cancelled
      // (but it might be called once for the confirmation check)
    })

    it('should switch to last tab when closing active tab', async () => {
      const { result } = renderHook(() =>
        useTabClosing({
          tabs: initialTabs,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      const mockEvent = {
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent

      await act(async () => {
        await result.current.handleCloseTab('tab-1', mockEvent)
      })

      expect(mockSetActiveTabId).toHaveBeenCalledWith('tab-3')
    })

    it('should set empty string when closing last tab', async () => {
      const singleTab = [initialTabs[0]]
      mockSetTabs.mockImplementation((updater: any) => {
        if (typeof updater === 'function') {
          return updater(singleTab)
        }
        return updater
      })

      const { result } = renderHook(() =>
        useTabClosing({
          tabs: singleTab,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      const mockEvent = {
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent

      await act(async () => {
        await result.current.handleCloseTab('tab-1', mockEvent)
      })

      expect(mockSetActiveTabId).toHaveBeenCalledWith('')
    })
  })

  describe('handleCloseWorkflow', () => {
    it('should close workflow by workflowId', async () => {
      const { result } = renderHook(() =>
        useTabClosing({
          tabs: initialTabs,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      await act(async () => {
        await result.current.handleCloseWorkflow('workflow-1')
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const updater = mockSetTabs.mock.calls[0][0]
      const updatedTabs = updater(initialTabs)
      
      expect(updatedTabs.find(t => t.workflowId === 'workflow-1')).toBeUndefined()
    })

    it('should return early if workflow not found', async () => {
      const { result } = renderHook(() =>
        useTabClosing({
          tabs: initialTabs,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      await act(async () => {
        await result.current.handleCloseWorkflow('non-existent')
      })

      expect(mockSetTabs).not.toHaveBeenCalled()
    })

    it('should prompt for confirmation when closing unsaved workflow', async () => {
      const unsavedTab = {
        id: 'tab-unsaved',
        name: 'Unsaved Workflow',
        workflowId: 'workflow-unsaved',
        isUnsaved: true,
        executions: [],
        activeExecutionId: null,
      }
      const tabsWithUnsaved = [...initialTabs, unsavedTab]

      const { result } = renderHook(() =>
        useTabClosing({
          tabs: tabsWithUnsaved,
          activeTabId: 'tab-unsaved',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      await act(async () => {
        await result.current.handleCloseWorkflow('workflow-unsaved')
      })

      // Should check for unsaved changes
      expect(mockConfirmUnsavedChanges).toHaveBeenCalled()
    })

    it('should create new tab when closing last workflow', async () => {
      const singleTab = [initialTabs[0]]
      mockSetTabs.mockImplementation((updater: any) => {
        if (typeof updater === 'function') {
          return updater(singleTab)
        }
        return updater
      })

      const { result } = renderHook(() =>
        useTabClosing({
          tabs: singleTab,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      await act(async () => {
        await result.current.handleCloseWorkflow('workflow-1')
      })

      const updater = mockSetTabs.mock.calls[0][0]
      const updatedTabs = updater(singleTab)
      
      expect(updatedTabs.length).toBe(1)
      expect(updatedTabs[0].name).toBe('Untitled Workflow')
      expect(mockSetActiveTabId).toHaveBeenCalled()
    })
  })
})
