/**
 * Tab Operations Hook
 * Manages tab creation, closing, and workflow state updates
 */

import { useCallback } from 'react'
import { showConfirm } from '../utils/confirm'
import type { WorkflowTabData } from '../contexts/WorkflowTabsContext'

interface UseTabOperationsOptions {
  tabs: WorkflowTabData[]
  activeTabId: string | null
  setTabs: React.Dispatch<React.SetStateAction<WorkflowTabData[]>>
  setActiveTabId: (id: string) => void
}

/**
 * Hook for managing tab operations
 * 
 * @param options Configuration options
 * @returns Tab operation handlers
 */
export function useTabOperations({
  tabs,
  activeTabId,
  setTabs,
  setActiveTabId,
}: UseTabOperationsOptions) {
  // Create a new workflow tab
  const handleNewWorkflow = useCallback(() => {
    const newId = `workflow-${Date.now()}`
    const newTab: WorkflowTabData = {
      id: newId,
      name: 'Untitled Workflow',
      workflowId: null,
      isUnsaved: true,
      executions: [],
      activeExecutionId: null
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newId)
  }, [setTabs, setActiveTabId])

  // Close a tab by tabId
  const handleCloseTab = useCallback((tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    const tabToClose = tabs.find(t => t.id === tabId)
    if (tabToClose?.isUnsaved) {
      showConfirm(
        'This workflow has unsaved changes. Close anyway?',
        { title: 'Unsaved Changes', confirmText: 'Close', cancelText: 'Cancel', type: 'warning' }
      ).then((confirmed) => {
        if (!confirmed) return
        setTabs(prev => {
          const filtered = prev.filter(t => t.id !== tabId)
          // If closing active tab, switch to the last tab
          if (tabId === activeTabId && filtered.length > 0) {
            setActiveTabId(filtered[filtered.length - 1].id)
          } else if (tabId === activeTabId && filtered.length === 0) {
            // If no tabs left, set to empty string (will be handled by context)
            setActiveTabId('')
          }
          return filtered
        })
      })
      return
    }

    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId)
      // If closing active tab, switch to the last tab
      if (tabId === activeTabId && filtered.length > 0) {
        setActiveTabId(filtered[filtered.length - 1].id)
      }
      return filtered
    })
  }, [tabs, activeTabId, setTabs, setActiveTabId])

  // Close a workflow by workflowId
  const handleCloseWorkflow = useCallback((workflowId: string) => {
    // Find the tab by workflowId and close it
    const tabToClose = tabs.find(t => t.workflowId === workflowId)
    if (!tabToClose) return
    
    // Check for unsaved changes
    if (tabToClose.isUnsaved) {
      showConfirm(
        'This workflow has unsaved changes. Close anyway?',
        { title: 'Unsaved Changes', confirmText: 'Close', cancelText: 'Cancel', type: 'warning' }
      ).then((confirmed) => {
        if (!confirmed) return
        setTabs(prev => {
          const filtered = prev.filter(t => t.id !== tabToClose.id)
          // If closing active tab, switch to the last tab
          if (tabToClose.id === activeTabId && filtered.length > 0) {
            setActiveTabId(filtered[filtered.length - 1].id)
          } else if (tabToClose.id === activeTabId && filtered.length === 0) {
            // If no tabs left, set to empty string (will be handled by context)
            setActiveTabId('')
          }
          return filtered
        })
      })
      return
    }
    
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabToClose.id)
      // If closing active tab, switch to the last tab
      if (tabToClose.id === activeTabId && filtered.length > 0) {
        setActiveTabId(filtered[filtered.length - 1].id)
      } else if (filtered.length === 0) {
        // If no tabs left, create a new untitled tab
        const newId = `workflow-${Date.now()}`
        const newTab: WorkflowTabData = {
          id: newId,
          name: 'Untitled Workflow',
          workflowId: null,
          isUnsaved: true,
          executions: [],
          activeExecutionId: null
        }
        setActiveTabId(newId)
        return [newTab]
      }
      return filtered
    })
  }, [tabs, activeTabId, setTabs, setActiveTabId])

  // Update tab when workflow is loaded
  const handleLoadWorkflow = useCallback((tabId: string, workflowId: string, name: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, workflowId, name, isUnsaved: false }
        : tab
    ))
  }, [setTabs])

  // Update tab when workflow is saved
  const handleWorkflowSaved = useCallback((tabId: string, workflowId: string, name: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, workflowId, name, isUnsaved: false }
        : tab
    ))
  }, [setTabs])

  // Mark tab as modified (unsaved)
  const handleWorkflowModified = useCallback((tabId: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, isUnsaved: true }
        : tab
    ))
  }, [setTabs])

  return {
    handleNewWorkflow,
    handleCloseTab,
    handleCloseWorkflow,
    handleLoadWorkflow,
    handleWorkflowSaved,
    handleWorkflowModified,
  }
}
