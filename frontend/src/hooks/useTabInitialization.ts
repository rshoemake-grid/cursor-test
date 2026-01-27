/**
 * Tab Initialization Hook
 * Manages tab initialization logic including active tab validation and marketplace workflow loading
 */

import { useEffect } from 'react'
import type { WorkflowTabData } from '../contexts/WorkflowTabsContext'

interface UseTabInitializationOptions {
  tabs: WorkflowTabData[]
  activeTabId: string | null
  setTabs: React.Dispatch<React.SetStateAction<WorkflowTabData[]>>
  setActiveTabId: (id: string) => void
  tabsRef: React.MutableRefObject<WorkflowTabData[]>
  initialWorkflowId?: string | null
  workflowLoadKey?: number
  processedKeys: React.MutableRefObject<Set<string>>
}

/**
 * Hook for managing tab initialization
 * 
 * @param options Configuration options
 */
export function useTabInitialization({
  tabs,
  activeTabId,
  setTabs,
  setActiveTabId,
  tabsRef,
  initialWorkflowId,
  workflowLoadKey,
  processedKeys,
}: UseTabInitializationOptions) {
  // Validate that activeTabId still exists in tabs, reset if not
  useEffect(() => {
    if (activeTabId && !tabs.some(tab => tab.id === activeTabId)) {
      // Active tab no longer exists, switch to first tab or create new one
      if (tabs.length > 0) {
        setActiveTabId(tabs[0].id)
      } else {
        // No tabs left, create a new one
        const newId = `workflow-${Date.now()}`
        const newTab: WorkflowTabData = {
          id: newId,
          name: 'Untitled Workflow',
          workflowId: null,
          isUnsaved: true,
          executions: [],
          activeExecutionId: null
        }
        setTabs([newTab])
        setActiveTabId(newId)
      }
    }
  }, [tabs, activeTabId, setTabs, setActiveTabId])

  // Handle initial workflow from marketplace - ALWAYS create new tab
  // workflowLoadKey increments each time, ensuring new tab even for same workflowId
  useEffect(() => {
    if (initialWorkflowId && workflowLoadKey !== undefined) {
      // Create unique key from workflowId + loadKey
      const uniqueKey = `${initialWorkflowId}-${workflowLoadKey}`
      
      // Only process if we haven't seen this exact combination before
      if (!processedKeys.current.has(uniqueKey)) {
        // Mark this combination as processed IMMEDIATELY to prevent duplicates
        processedKeys.current.add(uniqueKey)
        
        // Always create a new tab, even if workflow is already open in another tab
        const newId = `workflow-${Date.now()}`
        const newTab: WorkflowTabData = {
          id: newId,
          name: 'Loading...',
          workflowId: initialWorkflowId,
          isUnsaved: false,
          executions: [],
          activeExecutionId: null
        }
        
        setTabs(prev => {
          // Double-check we're not adding a duplicate
          const existingTab = prev.find(t => t.id === newId)
          if (existingTab) {
            return prev
          }
          const newTabs = [...prev, newTab]
          tabsRef.current = newTabs // Update ref immediately
          return newTabs
        })
        setActiveTabId(newId)
      }
    }
  }, [initialWorkflowId, workflowLoadKey, setTabs, setActiveTabId, tabsRef, processedKeys])
}
