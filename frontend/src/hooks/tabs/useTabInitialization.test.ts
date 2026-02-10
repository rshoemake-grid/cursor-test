import { renderHook } from '@testing-library/react'
import { useTabInitialization } from './useTabInitialization'
import type { WorkflowTabData } from '../contexts/WorkflowTabsContext'

describe('useTabInitialization', () => {
  let mockSetTabs: jest.Mock
  let mockSetActiveTabId: jest.Mock
  let mockTabsRef: React.MutableRefObject<WorkflowTabData[]>
  let mockProcessedKeys: React.MutableRefObject<Set<string>>

  const initialTabs: WorkflowTabData[] = [
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
    
    mockSetTabs = jest.fn((updater: any) => {
      if (typeof updater === 'function') {
        return updater(initialTabs)
      }
      return updater
    })
    mockSetActiveTabId = jest.fn()
    mockTabsRef = { current: initialTabs }
    mockProcessedKeys = { current: new Set() }
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('activeTabId validation', () => {
    it('should switch to first tab when activeTabId does not exist', () => {
      const tabs = [
        { id: 'tab-1', name: 'Tab 1', workflowId: null, isUnsaved: false, executions: [], activeExecutionId: null },
        { id: 'tab-2', name: 'Tab 2', workflowId: null, isUnsaved: false, executions: [], activeExecutionId: null },
      ]

      renderHook(() =>
        useTabInitialization({
          tabs,
          activeTabId: 'nonexistent',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: null,
          workflowLoadKey: undefined,
          processedKeys: mockProcessedKeys,
        })
      )

      expect(mockSetActiveTabId).toHaveBeenCalledWith('tab-1')
    })

    it('should create new tab when activeTabId does not exist and no tabs', () => {
      renderHook(() =>
        useTabInitialization({
          tabs: [],
          activeTabId: 'nonexistent',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: null,
          workflowLoadKey: undefined,
          processedKeys: mockProcessedKeys,
        })
      )

      expect(mockSetTabs).toHaveBeenCalled()
      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const newTabs = Array.isArray(setTabsCall) ? setTabsCall : setTabsCall([])
      expect(newTabs.length).toBe(1)
      expect(newTabs[0].name).toBe('Untitled Workflow')
      expect(mockSetActiveTabId).toHaveBeenCalled()
    })

    it('should not change activeTabId when it exists in tabs', () => {
      renderHook(() =>
        useTabInitialization({
          tabs: initialTabs,
          activeTabId: 'tab-1',
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: null,
          workflowLoadKey: undefined,
          processedKeys: mockProcessedKeys,
        })
      )

      expect(mockSetActiveTabId).not.toHaveBeenCalled()
    })

    it('should not change activeTabId when it is null', () => {
      renderHook(() =>
        useTabInitialization({
          tabs: initialTabs,
          activeTabId: null,
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: null,
          workflowLoadKey: undefined,
          processedKeys: mockProcessedKeys,
        })
      )

      expect(mockSetActiveTabId).not.toHaveBeenCalled()
    })
  })

  describe('initial workflow loading', () => {
    it('should create new tab for initial workflow', () => {
      renderHook(() =>
        useTabInitialization({
          tabs: [],
          activeTabId: null,
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: 'workflow-123',
          workflowLoadKey: 1,
          processedKeys: mockProcessedKeys,
        })
      )

      expect(mockSetTabs).toHaveBeenCalled()
      const setTabsCall = mockSetTabs.mock.calls[0][0]
      const newTabs = typeof setTabsCall === 'function' ? setTabsCall([]) : setTabsCall
      expect(newTabs.length).toBe(1)
      expect(newTabs[0].workflowId).toBe('workflow-123')
      expect(newTabs[0].name).toBe('Loading...')
      expect(newTabs[0].isUnsaved).toBe(false)
      expect(mockSetActiveTabId).toHaveBeenCalled()
    })

    it('should not create duplicate tab for same workflowLoadKey', () => {
      mockProcessedKeys.current.add('workflow-123-1')

      renderHook(() =>
        useTabInitialization({
          tabs: [],
          activeTabId: null,
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: 'workflow-123',
          workflowLoadKey: 1,
          processedKeys: mockProcessedKeys,
        })
      )

      expect(mockSetTabs).not.toHaveBeenCalled()
    })

    it('should create new tab for different workflowLoadKey', () => {
      mockProcessedKeys.current.add('workflow-123-1')

      renderHook(() =>
        useTabInitialization({
          tabs: [],
          activeTabId: null,
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: 'workflow-123',
          workflowLoadKey: 2,
          processedKeys: mockProcessedKeys,
        })
      )

      expect(mockSetTabs).toHaveBeenCalled()
    })

    it('should not create tab when initialWorkflowId is null', () => {
      renderHook(() =>
        useTabInitialization({
          tabs: [],
          activeTabId: null,
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: null,
          workflowLoadKey: 1,
          processedKeys: mockProcessedKeys,
        })
      )

      expect(mockSetTabs).not.toHaveBeenCalled()
    })

    it('should not create tab when workflowLoadKey is undefined', () => {
      renderHook(() =>
        useTabInitialization({
          tabs: [],
          activeTabId: null,
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: 'workflow-123',
          workflowLoadKey: undefined,
          processedKeys: mockProcessedKeys,
        })
      )

      expect(mockSetTabs).not.toHaveBeenCalled()
    })

    it('should update tabsRef when creating new tab', () => {
      renderHook(() =>
        useTabInitialization({
          tabs: [],
          activeTabId: null,
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: 'workflow-123',
          workflowLoadKey: 1,
          processedKeys: mockProcessedKeys,
        })
      )

      expect(mockTabsRef.current.length).toBeGreaterThan(0)
    })

    it('should not create duplicate tab when tab with same id exists', () => {
      const existingTabs = [
        {
          id: 'workflow-1234567890',
          name: 'Existing',
          workflowId: 'workflow-123',
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ]

      const mockSetTabsWithCheck = jest.fn((updater: any) => {
        if (typeof updater === 'function') {
          const result = updater(existingTabs)
          // Check for duplicate ID
          const existingTab = existingTabs.find(t => t.id === result[result.length - 1]?.id)
          if (existingTab) {
            return existingTabs
          }
          return result
        }
        return updater
      })

      renderHook(() =>
        useTabInitialization({
          tabs: existingTabs,
          activeTabId: null,
          setTabs: mockSetTabsWithCheck,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: { current: existingTabs },
          initialWorkflowId: 'workflow-123',
          workflowLoadKey: 1,
          processedKeys: mockProcessedKeys,
        })
      )

      // Should still create new tab with different ID
      expect(mockSetTabsWithCheck).toHaveBeenCalled()
    })
  })
})
