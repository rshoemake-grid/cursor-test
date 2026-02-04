/**
 * Tests for Tab Utilities
 */

import {
  createNewTab,
  createTabWithWorkflow,
  updateTab,
  updateTabByWorkflowId,
  findTab,
  findTabByWorkflowId,
  removeTab,
  handleActiveTabAfterClose,
  tabExists,
  getTabIndex,
} from './tabUtils'
import type { WorkflowTabData } from '../../../contexts/WorkflowTabsContext'

describe('tabUtils', () => {
  const mockTabs: WorkflowTabData[] = [
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
      workflowId: 'workflow-2',
      isUnsaved: true,
      executions: [],
      activeExecutionId: null,
    },
    {
      id: 'tab-3',
      name: 'Untitled Workflow',
      workflowId: null,
      isUnsaved: true,
      executions: [],
      activeExecutionId: null,
    },
  ]

  describe('createNewTab', () => {
    it('should create a new tab with default values', () => {
      const tab = createNewTab()
      
      expect(tab).toMatchObject({
        name: 'Untitled Workflow',
        workflowId: null,
        isUnsaved: true,
        executions: [],
        activeExecutionId: null,
      })
      expect(tab.id).toMatch(/^workflow-\d+$/)
    })

    it('should create tabs with unique IDs', () => {
      jest.useFakeTimers()
      const tab1 = createNewTab()
      jest.advanceTimersByTime(1)
      const tab2 = createNewTab()
      jest.useRealTimers()
      
      expect(tab1.id).not.toBe(tab2.id)
      expect(tab1.id).toMatch(/^workflow-\d+$/)
      expect(tab2.id).toMatch(/^workflow-\d+$/)
    })
  })

  describe('createTabWithWorkflow', () => {
    it('should create a tab with workflow ID and default name', () => {
      const tab = createTabWithWorkflow('workflow-123')
      
      expect(tab).toMatchObject({
        workflowId: 'workflow-123',
        name: 'Loading...',
        isUnsaved: false,
        executions: [],
        activeExecutionId: null,
      })
      expect(tab.id).toMatch(/^workflow-\d+$/)
    })

    it('should create a tab with custom name', () => {
      const tab = createTabWithWorkflow('workflow-123', 'Custom Name')
      
      expect(tab).toMatchObject({
        workflowId: 'workflow-123',
        name: 'Custom Name',
        isUnsaved: false,
      })
    })
  })

  describe('updateTab', () => {
    it('should update a tab by ID', () => {
      const updated = updateTab(mockTabs, 'tab-1', { name: 'Updated Name' })
      
      expect(updated[0].name).toBe('Updated Name')
      expect(updated[1]).toEqual(mockTabs[1])
      expect(updated[2]).toEqual(mockTabs[2])
    })

    it('should update multiple fields', () => {
      const updated = updateTab(mockTabs, 'tab-2', {
        name: 'New Name',
        isUnsaved: false,
      })
      
      expect(updated[1].name).toBe('New Name')
      expect(updated[1].isUnsaved).toBe(false)
    })

    it('should not modify other tabs', () => {
      const updated = updateTab(mockTabs, 'tab-1', { name: 'Updated' })
      
      expect(updated.length).toBe(mockTabs.length)
      expect(updated[1]).toEqual(mockTabs[1])
      expect(updated[2]).toEqual(mockTabs[2])
    })

    it('should return original array if tab not found', () => {
      const updated = updateTab(mockTabs, 'non-existent', { name: 'Test' })
      
      expect(updated).toEqual(mockTabs)
    })
  })

  describe('updateTabByWorkflowId', () => {
    it('should update a tab by workflow ID', () => {
      const updated = updateTabByWorkflowId(mockTabs, 'workflow-1', {
        name: 'Updated Name',
      })
      
      expect(updated[0].name).toBe('Updated Name')
      expect(updated[1]).toEqual(mockTabs[1])
    })

    it('should not modify tabs with different workflow IDs', () => {
      const updated = updateTabByWorkflowId(mockTabs, 'workflow-1', {
        name: 'Updated',
      })
      
      expect(updated[1]).toEqual(mockTabs[1])
      expect(updated[2]).toEqual(mockTabs[2])
    })

    it('should return original array if workflow ID not found', () => {
      const updated = updateTabByWorkflowId(mockTabs, 'non-existent', {
        name: 'Test',
      })
      
      expect(updated).toEqual(mockTabs)
    })
  })

  describe('findTab', () => {
    it('should find a tab by ID', () => {
      const tab = findTab(mockTabs, 'tab-2')
      
      expect(tab).toEqual(mockTabs[1])
    })

    it('should return undefined if tab not found', () => {
      const tab = findTab(mockTabs, 'non-existent')
      
      expect(tab).toBeUndefined()
    })
  })

  describe('findTabByWorkflowId', () => {
    it('should find a tab by workflow ID', () => {
      const tab = findTabByWorkflowId(mockTabs, 'workflow-2')
      
      expect(tab).toEqual(mockTabs[1])
    })

    it('should return undefined if workflow ID not found', () => {
      const tab = findTabByWorkflowId(mockTabs, 'non-existent')
      
      expect(tab).toBeUndefined()
    })

    it('should return undefined for null workflow ID', () => {
      const tab = findTabByWorkflowId(mockTabs, 'null' as any)
      
      expect(tab).toBeUndefined()
    })
  })

  describe('removeTab', () => {
    it('should remove a tab by ID', () => {
      const removed = removeTab(mockTabs, 'tab-2')
      
      expect(removed.length).toBe(2)
      expect(removed[0]).toEqual(mockTabs[0])
      expect(removed[1]).toEqual(mockTabs[2])
    })

    it('should return original array if tab not found', () => {
      const removed = removeTab(mockTabs, 'non-existent')
      
      expect(removed).toEqual(mockTabs)
    })

    it('should handle removing first tab', () => {
      const removed = removeTab(mockTabs, 'tab-1')
      
      expect(removed.length).toBe(2)
      expect(removed[0]).toEqual(mockTabs[1])
    })

    it('should handle removing last tab', () => {
      const removed = removeTab(mockTabs, 'tab-3')
      
      expect(removed.length).toBe(2)
      expect(removed[removed.length - 1]).toEqual(mockTabs[1])
    })
  })

  describe('handleActiveTabAfterClose', () => {
    let mockSetActiveTabId: jest.Mock

    beforeEach(() => {
      mockSetActiveTabId = jest.fn()
    })

    it('should switch to last tab when closing active tab', () => {
      const remainingTabs = [mockTabs[0], mockTabs[1]]
      
      handleActiveTabAfterClose('tab-2', 'tab-2', remainingTabs, mockSetActiveTabId)
      
      // Should switch to the last tab in the remaining tabs array
      expect(mockSetActiveTabId).toHaveBeenCalledWith(remainingTabs[remainingTabs.length - 1].id)
    })

    it('should set empty string when no tabs remain', () => {
      handleActiveTabAfterClose('tab-1', 'tab-1', [], mockSetActiveTabId)
      
      expect(mockSetActiveTabId).toHaveBeenCalledWith('')
    })

    it('should not call setActiveTabId when closing non-active tab', () => {
      handleActiveTabAfterClose('tab-2', 'tab-1', mockTabs, mockSetActiveTabId)
      
      expect(mockSetActiveTabId).not.toHaveBeenCalled()
    })

    it('should handle null activeTabId', () => {
      handleActiveTabAfterClose('tab-1', null, mockTabs, mockSetActiveTabId)
      
      expect(mockSetActiveTabId).not.toHaveBeenCalled()
    })
  })

  describe('tabExists', () => {
    it('should return true if tab exists', () => {
      expect(tabExists(mockTabs, 'tab-1')).toBe(true)
      expect(tabExists(mockTabs, 'tab-2')).toBe(true)
    })

    it('should return false if tab does not exist', () => {
      expect(tabExists(mockTabs, 'non-existent')).toBe(false)
    })

    it('should handle empty array', () => {
      expect(tabExists([], 'tab-1')).toBe(false)
    })
  })

  describe('getTabIndex', () => {
    it('should return correct index for existing tab', () => {
      expect(getTabIndex(mockTabs, 'tab-1')).toBe(0)
      expect(getTabIndex(mockTabs, 'tab-2')).toBe(1)
      expect(getTabIndex(mockTabs, 'tab-3')).toBe(2)
    })

    it('should return -1 if tab not found', () => {
      expect(getTabIndex(mockTabs, 'non-existent')).toBe(-1)
    })

    it('should handle empty array', () => {
      expect(getTabIndex([], 'tab-1')).toBe(-1)
    })
  })
})
