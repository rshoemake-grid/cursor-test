/**
 * Tab Creation Hook
 * Handles creation of new workflow tabs
 * Extracted from useTabOperations.ts to follow Single Responsibility Principle
 */

import { useCallback } from 'react'
import type { WorkflowTabData } from '../../contexts/WorkflowTabsContext'
import { createNewTab } from '../utils/tabUtils'

interface UseTabCreationOptions {
  setTabs: React.Dispatch<React.SetStateAction<WorkflowTabData[]>>
  setActiveTabId: (id: string) => void
}

/**
 * Hook for creating new workflow tabs
 * 
 * @param options Configuration options
 * @returns Tab creation handler
 */
export function useTabCreation({
  setTabs,
  setActiveTabId,
}: UseTabCreationOptions) {
  // Create a new workflow tab
  const handleNewWorkflow = useCallback(() => {
    const newTab = createNewTab()
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
  }, [setTabs, setActiveTabId])

  return {
    handleNewWorkflow,
  }
}
