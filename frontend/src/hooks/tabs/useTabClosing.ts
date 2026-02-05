/**
 * Tab Closing Hook
 * Handles closing of workflow tabs with confirmation for unsaved changes
 * Extracted from useTabOperations.ts to follow Single Responsibility Principle
 */

import { useCallback } from 'react'
import type { WorkflowTabData } from '../../contexts/WorkflowTabsContext'
import { findTab, removeTab, handleActiveTabAfterClose, createNewTab } from '../utils/tabUtils'
import { confirmUnsavedChanges } from '../utils/confirmations'

interface UseTabClosingOptions {
  tabs: WorkflowTabData[]
  activeTabId: string | null
  setTabs: React.Dispatch<React.SetStateAction<WorkflowTabData[]>>
  setActiveTabId: (id: string) => void
}

/**
 * Hook for closing workflow tabs
 * 
 * @param options Configuration options
 * @returns Tab closing handlers
 */
export function useTabClosing({
  tabs,
  activeTabId,
  setTabs,
  setActiveTabId,
}: UseTabClosingOptions) {
  // Close a tab by tabId
  const handleCloseTab = useCallback(async (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    const tabToClose = findTab(tabs, tabId)
    if (tabToClose?.isUnsaved) {
      await confirmUnsavedChanges(() => {
        setTabs(prev => {
          const filtered = removeTab(prev, tabId)
          handleActiveTabAfterClose(tabId, activeTabId, filtered, setActiveTabId)
          return filtered
        })
      })
      return
    }

    setTabs(prev => {
      const filtered = removeTab(prev, tabId)
      handleActiveTabAfterClose(tabId, activeTabId, filtered, setActiveTabId)
      return filtered
    })
  }, [tabs, activeTabId, setTabs, setActiveTabId])

  // Close a workflow by workflowId
  const handleCloseWorkflow = useCallback(async (workflowId: string) => {
    // Find the tab by workflowId and close it
    const tabToClose = tabs.find(t => t.workflowId === workflowId)
    if (!tabToClose) return
    
    // Check for unsaved changes
    if (tabToClose.isUnsaved) {
      await confirmUnsavedChanges(() => {
        setTabs(prev => {
          const filtered = removeTab(prev, tabToClose.id)
          handleActiveTabAfterClose(tabToClose.id, activeTabId, filtered, setActiveTabId)
          return filtered
        })
      })
      return
    }
    
    setTabs(prev => {
      const filtered = removeTab(prev, tabToClose.id)
      handleActiveTabAfterClose(tabToClose.id, activeTabId, filtered, setActiveTabId)
      
      // If no tabs left, create a new untitled tab
      if (filtered.length === 0) {
        const newTab = createNewTab()
        setActiveTabId(newTab.id)
        return [newTab]
      }
      
      return filtered
    })
  }, [tabs, activeTabId, setTabs, setActiveTabId])

  return {
    handleCloseTab,
    handleCloseWorkflow,
  }
}
