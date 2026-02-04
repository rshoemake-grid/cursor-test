/**
 * Tab Workflow Sync Hook
 * Handles synchronization between tabs and workflow state (loading, saving, modification tracking)
 * Extracted from useTabOperations.ts to follow Single Responsibility Principle
 */

import { useCallback } from 'react'
import type { WorkflowTabData } from '../contexts/WorkflowTabsContext'
import { updateTab } from './utils/tabUtils'

interface UseTabWorkflowSyncOptions {
  setTabs: React.Dispatch<React.SetStateAction<WorkflowTabData[]>>
}

/**
 * Hook for synchronizing tab state with workflow operations
 * 
 * @param options Configuration options
 * @returns Workflow sync handlers
 */
export function useTabWorkflowSync({
  setTabs,
}: UseTabWorkflowSyncOptions) {
  // Update tab when workflow is loaded
  const handleLoadWorkflow = useCallback((tabId: string, workflowId: string, name: string) => {
    setTabs(prev => updateTab(prev, tabId, { workflowId, name, isUnsaved: false }))
  }, [setTabs])

  // Update tab when workflow is saved
  const handleWorkflowSaved = useCallback((tabId: string, workflowId: string, name: string) => {
    setTabs(prev => updateTab(prev, tabId, { workflowId, name, isUnsaved: false }))
  }, [setTabs])

  // Mark tab as modified (unsaved)
  const handleWorkflowModified = useCallback((tabId: string) => {
    setTabs(prev => updateTab(prev, tabId, { isUnsaved: true }))
  }, [setTabs])

  return {
    handleLoadWorkflow,
    handleWorkflowSaved,
    handleWorkflowModified,
  }
}
