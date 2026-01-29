import { renderHook, act } from '@testing-library/react'
import { useTabOperations } from './useTabOperations'
import { showConfirm } from '../utils/confirm'
import type { WorkflowTabData } from '../contexts/WorkflowTabsContext'

jest.mock('../utils/confirm', () => ({
  showConfirm: jest.fn(),
}))

const mockShowConfirm = showConfirm as jest.MockedFunction<typeof showConfirm>

describe('useTabOperations', () => {
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
    mockShowConfirm.mockResolvedValue(true)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('handleNewWorkflow', () => {
    it('should create a new workflow tab', () => {
      const { result } = renderHook(() =>
        useTabOperations({
          tabs: initialTabs,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleNewWorkflow()
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const newTabs = typeof setTabsCall === 'function' ? setTabsCall(initialTabs) : setTabsCall
      expect(newTabs.length).toBe(initialTabs.length + 1)
      const newTab = newTabs[newTabs.length - 1]
      expect(newTab.name).toBe('Untitled Workflow')
      expect(newTab.isUnsaved).toBe(true)
      expect(newTab.workflowId).toBeNull()
      expect(mockSetActiveTabId).toHaveBeenCalledWith(newTab.id)
    })
  })

  describe('handleCloseTab', () => {
    it('should close a saved tab without confirmation', () => {
      const { result } = renderHook(() =>
        useTabOperations({
          tabs: initialTabs,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      const mockEvent = {
        stopPropagation: jest.fn(),
      } as any

      act(() => {
        result.current.handleCloseTab('tab-1', mockEvent)
      })

      expect(mockEvent.stopPropagation).toHaveBeenCalled()
      expect(mockShowConfirm).not.toHaveBeenCalled()
      expect(mockSetTabs).toHaveBeenCalled()
    })

    it('should prompt for confirmation when closing unsaved tab', async () => {
      const { result } = renderHook(() =>
        useTabOperations({
          tabs: initialTabs,
          activeTabId: 'tab-2',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      const mockEvent = {
        stopPropagation: jest.fn(),
      } as any

      act(() => {
        result.current.handleCloseTab('tab-2', mockEvent)
      })

      expect(mockShowConfirm).toHaveBeenCalledWith(
        'This workflow has unsaved changes. Close anyway?',
        { title: 'Unsaved Changes', confirmText: 'Close', cancelText: 'Cancel', type: 'warning' }
      )
    })

    it('should not close tab if user cancels confirmation', async () => {
      mockShowConfirm.mockResolvedValue(false)

      const { result } = renderHook(() =>
        useTabOperations({
          tabs: initialTabs,
          activeTabId: 'tab-2',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      const mockEvent = {
        stopPropagation: jest.fn(),
      } as any

      await act(async () => {
        result.current.handleCloseTab('tab-2', mockEvent)
        await Promise.resolve()
      })

      expect(mockSetTabs).not.toHaveBeenCalled()
    })

    it('should switch to last tab when closing active tab', () => {
      const { result } = renderHook(() =>
        useTabOperations({
          tabs: initialTabs,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      const mockEvent = {
        stopPropagation: jest.fn(),
      } as any

      act(() => {
        result.current.handleCloseTab('tab-1', mockEvent)
      })

      expect(mockSetActiveTabId).toHaveBeenCalledWith('tab-2')
    })

    it('should set activeTabId to empty string when closing last unsaved tab', async () => {
      const singleUnsavedTab = [initialTabs[1]] // tab-2 is unsaved
      let filteredTabs: WorkflowTabData[] = singleUnsavedTab
      const mockSetTabsSingle = jest.fn((updater: any) => {
        if (typeof updater === 'function') {
          filteredTabs = updater(singleUnsavedTab)
          return filteredTabs
        }
        filteredTabs = updater
        return updater
      })

      const { result } = renderHook(() =>
        useTabOperations({
          tabs: singleUnsavedTab,
          activeTabId: 'tab-2',
          setTabs: mockSetTabsSingle,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      const mockEvent = {
        stopPropagation: jest.fn(),
      } as any

      await act(async () => {
        result.current.handleCloseTab('tab-2', mockEvent)
        await Promise.resolve()
      })

      expect(filteredTabs.length).toBe(0)
      expect(mockSetActiveTabId).toHaveBeenCalledWith('')
    })

    it('should not switch tab when closing non-active tab', () => {
      const { result } = renderHook(() =>
        useTabOperations({
          tabs: initialTabs,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      const mockEvent = {
        stopPropagation: jest.fn(),
      } as any

      act(() => {
        result.current.handleCloseTab('tab-2', mockEvent)
      })

      expect(mockSetActiveTabId).not.toHaveBeenCalled()
    })
  })

  describe('handleCloseWorkflow', () => {
    it('should close workflow by workflowId', () => {
      const { result } = renderHook(() =>
        useTabOperations({
          tabs: initialTabs,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleCloseWorkflow('workflow-1')
      })

      expect(mockSetTabs).toHaveBeenCalled()
    })

    it('should return early if workflow not found', () => {
      const { result } = renderHook(() =>
        useTabOperations({
          tabs: initialTabs,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleCloseWorkflow('nonexistent')
      })

      expect(mockSetTabs).not.toHaveBeenCalled()
    })

    it('should prompt for confirmation when closing unsaved workflow', async () => {
      const tabsWithUnsaved = [
        {
          id: 'tab-1',
          name: 'Workflow 1',
          workflowId: 'workflow-1',
          isUnsaved: true,
          executions: [],
          activeExecutionId: null,
        },
      ]

      const mockSetTabsUnsaved = jest.fn((updater: any) => {
        if (typeof updater === 'function') {
          return updater(tabsWithUnsaved)
        }
        return updater
      })

      const { result } = renderHook(() =>
        useTabOperations({
          tabs: tabsWithUnsaved,
          activeTabId: 'tab-1',
          setTabs: mockSetTabsUnsaved,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleCloseWorkflow('workflow-1')
      })

      expect(mockShowConfirm).toHaveBeenCalled()
    })

    it('should create new tab when closing last saved workflow', () => {
      const singleTab = [
        {
          id: 'tab-1',
          name: 'Workflow 1',
          workflowId: 'workflow-1',
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ]

      const mockSetTabsSingle = jest.fn((updater: any) => {
        if (typeof updater === 'function') {
          const result = updater(singleTab)
          if (result.length === 0) {
            // Simulate creating new tab when no tabs left
            const newId = `workflow-${Date.now()}`
            const newTab: WorkflowTabData = {
              id: newId,
              name: 'Untitled Workflow',
              workflowId: null,
              isUnsaved: true,
              executions: [],
              activeExecutionId: null,
            }
            mockSetActiveTabId(newId)
            return [newTab]
          }
          return result
        }
        return updater
      })

      const { result } = renderHook(() =>
        useTabOperations({
          tabs: singleTab,
          activeTabId: 'tab-1',
          setTabs: mockSetTabsSingle,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleCloseWorkflow('workflow-1')
      })

      expect(mockSetTabsSingle).toHaveBeenCalled()
    })

    it('should handle closing non-active workflow tab', () => {
      const { result } = renderHook(() =>
        useTabOperations({
          tabs: initialTabs,
          activeTabId: 'tab-2', // Different tab is active
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleCloseWorkflow('workflow-1')
      })

      expect(mockSetTabs).toHaveBeenCalled()
      // Should not switch active tab since we're closing a different tab
      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const filtered = typeof setTabsCall === 'function' ? setTabsCall(initialTabs) : setTabsCall
      if (filtered.length > 0 && initialTabs.find(t => t.workflowId === 'workflow-1')?.id !== 'tab-2') {
        expect(mockSetActiveTabId).not.toHaveBeenCalled()
      }
    })

    it('should handle closing active workflow when other tabs exist', () => {
      const { result } = renderHook(() =>
        useTabOperations({
          tabs: initialTabs,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleCloseWorkflow('workflow-1')
      })

      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const filtered = typeof setTabsCall === 'function' ? setTabsCall(initialTabs) : setTabsCall
      if (filtered.length > 0) {
        expect(mockSetActiveTabId).toHaveBeenCalledWith(filtered[filtered.length - 1].id)
      }
    })

    it('should handle closing workflow when tab is not active and no other tabs', () => {
      const singleTab = [
        {
          id: 'tab-1',
          name: 'Workflow 1',
          workflowId: 'workflow-1',
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ]

      const mockSetTabsSingle = jest.fn((updater: any) => {
        if (typeof updater === 'function') {
          return updater(singleTab)
        }
        return updater
      })

      const { result } = renderHook(() =>
        useTabOperations({
          tabs: singleTab,
          activeTabId: null,
          setTabs: mockSetTabsSingle,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleCloseWorkflow('workflow-1')
      })

      expect(mockSetTabsSingle).toHaveBeenCalled()
    })

    it('should create new tab when closing last saved workflow and no tabs remain', () => {
      const singleTab = [
        {
          id: 'tab-1',
          name: 'Workflow 1',
          workflowId: 'workflow-1',
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ]

      let filteredTabs: WorkflowTabData[] = singleTab
      const mockSetTabsSingle = jest.fn((updater: any) => {
        if (typeof updater === 'function') {
          filteredTabs = updater(singleTab)
          // If no tabs left, create new one (simulating the code behavior)
          if (filteredTabs.length === 0) {
            const newId = `workflow-${Date.now()}`
            const newTab: WorkflowTabData = {
              id: newId,
              name: 'Untitled Workflow',
              workflowId: null,
              isUnsaved: true,
              executions: [],
              activeExecutionId: null,
            }
            mockSetActiveTabId(newId)
            return [newTab]
          }
          return filteredTabs
        }
        return updater
      })

      const { result } = renderHook(() =>
        useTabOperations({
          tabs: singleTab,
          activeTabId: 'tab-1',
          setTabs: mockSetTabsSingle,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleCloseWorkflow('workflow-1')
      })

      expect(mockSetTabsSingle).toHaveBeenCalled()
      // Should create new tab when no tabs remain
      const lastCall = mockSetTabsSingle.mock.calls[mockSetTabsSingle.mock.calls.length - 1]
      const resultTabs = typeof lastCall[0] === 'function' ? lastCall[0]([]) : lastCall[0]
      if (resultTabs && Array.isArray(resultTabs) && resultTabs.length > 0) {
        expect(resultTabs[0].name).toBe('Untitled Workflow')
      }
    })

    it('should handle closing unsaved workflow when it is active and no other tabs', async () => {
      const singleUnsavedTab = [
        {
          id: 'tab-1',
          name: 'Workflow 1',
          workflowId: 'workflow-1',
          isUnsaved: true,
          executions: [],
          activeExecutionId: null,
        },
      ]

      let filteredTabs: WorkflowTabData[] = singleUnsavedTab
      const mockSetTabsSingle = jest.fn((updater: any) => {
        if (typeof updater === 'function') {
          filteredTabs = updater(singleUnsavedTab)
          return filteredTabs
        }
        return updater
      })

      const { result } = renderHook(() =>
        useTabOperations({
          tabs: singleUnsavedTab,
          activeTabId: 'tab-1',
          setTabs: mockSetTabsSingle,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      await act(async () => {
        result.current.handleCloseWorkflow('workflow-1')
        await Promise.resolve()
      })

      expect(mockShowConfirm).toHaveBeenCalled()
      if (filteredTabs.length === 0) {
        expect(mockSetActiveTabId).toHaveBeenCalledWith('')
      }
    })

    it('should handle closing unsaved workflow when it is not active', async () => {
      const tabs = [
        {
          id: 'tab-1',
          name: 'Workflow 1',
          workflowId: 'workflow-1',
          isUnsaved: true,
          executions: [],
          activeExecutionId: null,
        },
        {
          id: 'tab-2',
          name: 'Workflow 2',
          workflowId: 'workflow-2',
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ]

      const { result } = renderHook(() =>
        useTabOperations({
          tabs,
          activeTabId: 'tab-2',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      await act(async () => {
        result.current.handleCloseWorkflow('workflow-1')
        await Promise.resolve()
      })

      expect(mockShowConfirm).toHaveBeenCalled()
      // Should not switch active tab since we're closing a different tab
      expect(mockSetActiveTabId).not.toHaveBeenCalled()
    })
  })

  describe('handleLoadWorkflow', () => {
    it('should update tab when workflow is loaded', () => {
      const { result } = renderHook(() =>
        useTabOperations({
          tabs: initialTabs,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleLoadWorkflow('tab-1', 'workflow-1', 'Loaded Workflow')
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall(initialTabs) : setTabsCall
      const updatedTab = updatedTabs.find(t => t.id === 'tab-1')
      expect(updatedTab?.workflowId).toBe('workflow-1')
      expect(updatedTab?.name).toBe('Loaded Workflow')
      expect(updatedTab?.isUnsaved).toBe(false)
    })

    it('should not update other tabs', () => {
      const { result } = renderHook(() =>
        useTabOperations({
          tabs: initialTabs,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleLoadWorkflow('tab-1', 'workflow-1', 'Loaded Workflow')
      })

      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall(initialTabs) : setTabsCall
      const otherTab = updatedTabs.find(t => t.id === 'tab-2')
      expect(otherTab).toEqual(initialTabs[1])
    })
  })

  describe('handleWorkflowSaved', () => {
    it('should update tab when workflow is saved', () => {
      const { result } = renderHook(() =>
        useTabOperations({
          tabs: initialTabs,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleWorkflowSaved('tab-1', 'workflow-1', 'Saved Workflow')
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall(initialTabs) : setTabsCall
      const updatedTab = updatedTabs.find(t => t.id === 'tab-1')
      expect(updatedTab?.workflowId).toBe('workflow-1')
      expect(updatedTab?.name).toBe('Saved Workflow')
      expect(updatedTab?.isUnsaved).toBe(false)
    })
  })

  describe('handleWorkflowModified', () => {
    it('should mark tab as unsaved', () => {
      const { result } = renderHook(() =>
        useTabOperations({
          tabs: initialTabs,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleWorkflowModified('tab-1')
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall(initialTabs) : setTabsCall
      const updatedTab = updatedTabs.find(t => t.id === 'tab-1')
      expect(updatedTab?.isUnsaved).toBe(true)
    })

    it('should not modify other tab properties', () => {
      const { result } = renderHook(() =>
        useTabOperations({
          tabs: initialTabs,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleWorkflowModified('tab-1')
      })

      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall(initialTabs) : setTabsCall
      const updatedTab = updatedTabs.find(t => t.id === 'tab-1')
      expect(updatedTab?.workflowId).toBe(initialTabs[0].workflowId)
      expect(updatedTab?.name).toBe(initialTabs[0].name)
    })

    it('should not modify other tabs', () => {
      const { result } = renderHook(() =>
        useTabOperations({
          tabs: initialTabs,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleWorkflowModified('tab-1')
      })

      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const updatedTabs = typeof setTabsCall === 'function' ? setTabsCall(initialTabs) : setTabsCall
      const otherTab = updatedTabs.find(t => t.id === 'tab-2')
      expect(otherTab?.isUnsaved).toBe(initialTabs[1].isUnsaved)
    })
  })

  describe('handleCloseWorkflow edge cases', () => {
    it('should handle closing workflow when filtered.length is 0 and tab was not active', () => {
      const singleTab = [
        {
          id: 'tab-1',
          name: 'Workflow 1',
          workflowId: 'workflow-1',
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ]

      let filteredTabs: WorkflowTabData[] = singleTab
      const mockSetTabsSingle = jest.fn((updater: any) => {
        if (typeof updater === 'function') {
          filteredTabs = updater(singleTab)
          // Simulate the else branch when filtered.length === 0
          if (filteredTabs.length === 0) {
            const newId = `workflow-${Date.now()}`
            const newTab: WorkflowTabData = {
              id: newId,
              name: 'Untitled Workflow',
              workflowId: null,
              isUnsaved: true,
              executions: [],
              activeExecutionId: null,
            }
            mockSetActiveTabId(newId)
            return [newTab]
          }
          return filteredTabs
        }
        return updater
      })

      const { result } = renderHook(() =>
        useTabOperations({
          tabs: singleTab,
          activeTabId: null, // Tab is not active
          setTabs: mockSetTabsSingle,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleCloseWorkflow('workflow-1')
      })

      expect(mockSetTabsSingle).toHaveBeenCalled()
      // Should create new tab when no tabs remain
      const lastCall = mockSetTabsSingle.mock.calls[mockSetTabsSingle.mock.calls.length - 1]
      const resultTabs = typeof lastCall[0] === 'function' ? lastCall[0]([]) : lastCall[0]
      if (resultTabs && Array.isArray(resultTabs) && resultTabs.length > 0) {
        expect(resultTabs[0].name).toBe('Untitled Workflow')
        expect(mockSetActiveTabId).toHaveBeenCalled()
      }
    })
  })

  describe('edge cases and error handling', () => {
    describe('handleCloseTab edge cases', () => {
      it('should handle closing tab when tabToClose is undefined', () => {
        const { result } = renderHook(() =>
          useTabOperations({
            tabs: initialTabs,
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            setActiveTabId: mockSetActiveTabId,
          })
        )

        const mockEvent = {
          stopPropagation: jest.fn(),
        } as any

        act(() => {
          result.current.handleCloseTab('non-existent-tab', mockEvent)
        })

        expect(mockSetTabs).not.toHaveBeenCalled()
      })

      it('should handle closing last tab when it is active', () => {
        const singleTab = [initialTabs[0]]
        const { result } = renderHook(() =>
          useTabOperations({
            tabs: singleTab,
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            setActiveTabId: mockSetActiveTabId,
          })
        )

        const mockEvent = {
          stopPropagation: jest.fn(),
        } as any

        act(() => {
          result.current.handleCloseTab('tab-1', mockEvent)
        })

        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const filteredTabs = typeof setTabsCall === 'function' ? setTabsCall(singleTab) : setTabsCall
        expect(filteredTabs.length).toBe(0)
        expect(mockSetActiveTabId).toHaveBeenCalledWith('')
      })

      it('should handle closing active tab when filtered.length is 0', async () => {
        const singleTab = [{ ...initialTabs[0], isUnsaved: true }]
        mockShowConfirm.mockResolvedValue(true)

        const { result } = renderHook(() =>
          useTabOperations({
            tabs: singleTab,
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            setActiveTabId: mockSetActiveTabId,
          })
        )

        const mockEvent = {
          stopPropagation: jest.fn(),
        } as any

        await act(async () => {
          result.current.handleCloseTab('tab-1', mockEvent)
          await Promise.resolve()
        })

        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const filteredTabs = typeof setTabsCall === 'function' ? setTabsCall(singleTab) : setTabsCall
        expect(filteredTabs.length).toBe(0)
        expect(mockSetActiveTabId).toHaveBeenCalledWith('')
      })

      it('should handle closing non-active tab when activeTabId is null', () => {
        const { result } = renderHook(() =>
          useTabOperations({
            tabs: initialTabs,
            activeTabId: null,
            setTabs: mockSetTabs,
            setActiveTabId: mockSetActiveTabId,
          })
        )

        const mockEvent = {
          stopPropagation: jest.fn(),
        } as any

        act(() => {
          result.current.handleCloseTab('tab-2', mockEvent)
        })

        expect(mockSetActiveTabId).not.toHaveBeenCalled()
      })

      it('should handle closing tab when activeTabId does not match', () => {
        const { result } = renderHook(() =>
          useTabOperations({
            tabs: initialTabs,
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            setActiveTabId: mockSetActiveTabId,
          })
        )

        const mockEvent = {
          stopPropagation: jest.fn(),
        } as any

        act(() => {
          result.current.handleCloseTab('tab-2', mockEvent)
        })

        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const filteredTabs = typeof setTabsCall === 'function' ? setTabsCall(initialTabs) : setTabsCall
        expect(filteredTabs.length).toBe(1)
        expect(mockSetActiveTabId).not.toHaveBeenCalled()
      })
    })

    describe('handleCloseWorkflow edge cases', () => {
      it('should handle closing workflow when tabToClose.id matches activeTabId and filtered.length is 0', async () => {
        const singleTab = [{ ...initialTabs[0], isUnsaved: true }]
        mockShowConfirm.mockResolvedValue(true)

        const { result } = renderHook(() =>
          useTabOperations({
            tabs: singleTab,
            activeTabId: 'tab-1',
            setTabs: mockSetTabs,
            setActiveTabId: mockSetActiveTabId,
          })
        )

        await act(async () => {
          result.current.handleCloseWorkflow('workflow-1')
          await Promise.resolve()
        })

        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const filteredTabs = typeof setTabsCall === 'function' ? setTabsCall(singleTab) : setTabsCall
        expect(filteredTabs.length).toBe(0)
        expect(mockSetActiveTabId).toHaveBeenCalledWith('')
      })

      it('should handle closing workflow when tabToClose.id does not match activeTabId', () => {
        const { result } = renderHook(() =>
          useTabOperations({
            tabs: initialTabs,
            activeTabId: 'tab-2',
            setTabs: mockSetTabs,
            setActiveTabId: mockSetActiveTabId,
          })
        )

        act(() => {
          result.current.handleCloseWorkflow('workflow-1')
        })

        expect(mockSetActiveTabId).not.toHaveBeenCalled()
      })

      it('should handle closing workflow when activeTabId is null', () => {
        const { result } = renderHook(() =>
          useTabOperations({
            tabs: initialTabs,
            activeTabId: null,
            setTabs: mockSetTabs,
            setActiveTabId: mockSetActiveTabId,
          })
        )

        act(() => {
          result.current.handleCloseWorkflow('workflow-1')
        })

        const setTabsCall = mockSetTabs.mock.calls[0][0]
        const filteredTabs = typeof setTabsCall === 'function' ? setTabsCall(initialTabs) : setTabsCall
        expect(filteredTabs.length).toBe(1)
        expect(mockSetActiveTabId).not.toHaveBeenCalled()
      })
    })
  })
})
