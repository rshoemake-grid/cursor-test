/**
 * Tests for useTabCreation Hook
 */

import { renderHook, act } from '@testing-library/react'
import { useTabCreation } from './useTabCreation'
import type { WorkflowTabData } from '../contexts/WorkflowTabsContext'

describe('useTabCreation', () => {
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
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('handleNewWorkflow', () => {
    it('should create a new tab and add it to tabs', () => {
      const { result } = renderHook(() =>
        useTabCreation({
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleNewWorkflow()
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const updater = mockSetTabs.mock.calls[0][0]
      const newTabs = updater(initialTabs)
      
      expect(newTabs.length).toBe(2)
      expect(newTabs[1]).toMatchObject({
        name: 'Untitled Workflow',
        workflowId: null,
        isUnsaved: true,
        executions: [],
        activeExecutionId: null,
      })
      expect(newTabs[1].id).toMatch(/^workflow-\d+$/)
    })

    it('should set the new tab as active', () => {
      const { result } = renderHook(() =>
        useTabCreation({
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleNewWorkflow()
      })

      expect(mockSetActiveTabId).toHaveBeenCalled()
      const newTabId = mockSetActiveTabId.mock.calls[0][0]
      expect(newTabId).toMatch(/^workflow-\d+$/)
    })

    it('should create tab with correct default values', () => {
      const { result } = renderHook(() =>
        useTabCreation({
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleNewWorkflow()
      })

      const updater = mockSetTabs.mock.calls[0][0]
      const newTabs = updater(initialTabs)
      const newTab = newTabs[newTabs.length - 1]

      expect(newTab.name).toBe('Untitled Workflow')
      expect(newTab.workflowId).toBeNull()
      expect(newTab.isUnsaved).toBe(true)
      expect(newTab.executions).toEqual([])
      expect(newTab.activeExecutionId).toBeNull()
    })

    it('should create unique tab IDs on multiple calls', () => {
      const { result } = renderHook(() =>
        useTabCreation({
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleNewWorkflow()
      })
      const firstId = mockSetActiveTabId.mock.calls[0][0]

      // Advance timer to ensure different timestamp
      act(() => {
        jest.advanceTimersByTime(1)
        result.current.handleNewWorkflow()
      })
      const secondId = mockSetActiveTabId.mock.calls[1][0]

      expect(firstId).not.toBe(secondId)
      expect(firstId).toMatch(/^workflow-\d+$/)
      expect(secondId).toMatch(/^workflow-\d+$/)
    })

    it('should handle empty tabs array', () => {
      mockSetTabs.mockImplementation((updater: any) => {
        if (typeof updater === 'function') {
          return updater([])
        }
        return updater
      })

      const { result } = renderHook(() =>
        useTabCreation({
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
        })
      )

      act(() => {
        result.current.handleNewWorkflow()
      })

      const updater = mockSetTabs.mock.calls[0][0]
      const newTabs = updater([])
      
      expect(newTabs.length).toBe(1)
      expect(newTabs[0].name).toBe('Untitled Workflow')
    })
  })
})
