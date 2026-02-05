/**
 * Tab Operations Hook
 * Composes tab creation, closing, and workflow sync hooks
 * Follows Single Responsibility Principle by delegating to focused hooks
 */

import type { WorkflowTabData } from '../../contexts/WorkflowTabsContext'
import { useTabCreation } from './useTabCreation'
import { useTabClosing } from './useTabClosing'
import { useTabWorkflowSync } from './useTabWorkflowSync'

interface UseTabOperationsOptions {
  tabs: WorkflowTabData[]
  activeTabId: string | null
  setTabs: React.Dispatch<React.SetStateAction<WorkflowTabData[]>>
  setActiveTabId: (id: string) => void
}

/**
 * Hook for managing tab operations
 * Composes focused hooks to provide complete tab management functionality
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
  const { handleNewWorkflow } = useTabCreation({ setTabs, setActiveTabId })
  const { handleCloseTab, handleCloseWorkflow } = useTabClosing({
    tabs,
    activeTabId,
    setTabs,
    setActiveTabId,
  })
  const { handleLoadWorkflow, handleWorkflowSaved, handleWorkflowModified } = useTabWorkflowSync({
    setTabs,
  })

  return {
    handleNewWorkflow,
    handleCloseTab,
    handleCloseWorkflow,
    handleLoadWorkflow,
    handleWorkflowSaved,
    handleWorkflowModified,
  }
}
