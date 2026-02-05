/**
 * Workflow Deletion Hook
 * Handles deletion of workflows/templates from marketplace
 */

import { useCallback } from 'react'
import { showError as defaultShowError, showSuccess as defaultShowSuccess } from '../../utils/notifications'
import { showConfirm as defaultShowConfirm } from '../../utils/confirm'
import { api as defaultApi, createApiClient } from '../../api/client'
import { filterUserOwnedDeletableItems, separateOfficialItems } from '../utils/ownership'
import { isEmptySelection } from '../../utils/validationUtils'
import { extractApiErrorMessage } from '../utils/apiUtils'
import {
  hasOfficialItems,
  hasNoUserOwnedItems,
  ownsAllItems,
  ownsPartialItems,
} from '../utils/deletionValidation'
import type { Template } from '../marketplace'

interface UseWorkflowDeletionOptions {
  user: { id: string; username?: string; email?: string } | null
  templates: Template[]
  workflowsOfWorkflows: Template[]
  activeTab: 'agents' | 'repository' | 'workflows-of-workflows'
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>
  setWorkflowsOfWorkflows: React.Dispatch<React.SetStateAction<Template[]>>
  setSelectedTemplateIds: React.Dispatch<React.SetStateAction<Set<string>>>
  showError?: typeof defaultShowError
  showSuccess?: typeof defaultShowSuccess
  showConfirm?: typeof defaultShowConfirm
  api?: ReturnType<typeof createApiClient>
}

/**
 * Hook for deleting workflows/templates
 * 
 * @param options Configuration options
 * @returns Workflow deletion handler
 */
export function useWorkflowDeletion({
  user,
  templates,
  workflowsOfWorkflows,
  activeTab,
  setTemplates,
  setWorkflowsOfWorkflows,
  setSelectedTemplateIds,
  showError = defaultShowError,
  showSuccess = defaultShowSuccess,
  showConfirm = defaultShowConfirm,
  api = defaultApi,
}: UseWorkflowDeletionOptions) {
  const deleteSelectedWorkflows = useCallback(async (selectedTemplateIds: Set<string>) => {
    if (isEmptySelection(selectedTemplateIds)) return
    
    const currentTemplates = activeTab === 'workflows-of-workflows' ? workflowsOfWorkflows : templates
    const selectedTemplates = currentTemplates.filter(t => selectedTemplateIds.has(t.id))
    
    // Filter out official workflows - they cannot be deleted
    const { official: officialTemplates, deletable: deletableTemplates } = separateOfficialItems(selectedTemplates)
    
    // Use extracted validation function - mutation-resistant
    if (hasOfficialItems(officialTemplates)) {
      showError(`Cannot delete ${officialTemplates.length} official workflow(s). Official workflows cannot be deleted.`)
      if (deletableTemplates.length === 0) {
        return // All selected are official, nothing to delete
      }
    }
    
    // Filter to user-owned templates
    const userOwnedTemplates = filterUserOwnedDeletableItems(deletableTemplates, user)
    
    // Use extracted validation function - mutation-resistant
    if (hasNoUserOwnedItems(userOwnedTemplates)) {
      if (hasOfficialItems(officialTemplates)) {
        showError('You can only delete workflows that you published (official workflows cannot be deleted)')
      } else {
        showError('You can only delete workflows that you published')
      }
      return
    }
    
    // Use extracted validation function - mutation-resistant
    if (ownsPartialItems(userOwnedTemplates.length, deletableTemplates.length)) {
      const confirmed = await showConfirm(
        `You can only delete ${userOwnedTemplates.length} of ${deletableTemplates.length} selected workflow(s). Delete only the ones you own?`,
        { title: 'Partial Delete', confirmText: 'Delete', cancelText: 'Cancel', type: 'warning' }
      )
      if (!confirmed) return
    } else if (ownsAllItems(userOwnedTemplates.length, deletableTemplates.length)) {
      const confirmed = await showConfirm(
        `Are you sure you want to delete ${userOwnedTemplates.length} selected workflow(s) from the marketplace?`,
        { title: 'Delete Workflows', confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
      )
      if (!confirmed) return
    }

    try {
      // Delete each template via API
      const deletePromises = userOwnedTemplates.map(template => api.deleteTemplate(template.id))
      await Promise.all(deletePromises)
      
      // Update state
      const templateIdsToDelete = new Set(userOwnedTemplates.map(t => t.id))
      setTemplates(prevTemplates => prevTemplates.filter(t => !templateIdsToDelete.has(t.id)))
      setWorkflowsOfWorkflows(prevWorkflows => prevWorkflows.filter(t => !templateIdsToDelete.has(t.id)))
      setSelectedTemplateIds(new Set())
      showSuccess(`Successfully deleted ${userOwnedTemplates.length} workflow(s)`)
    } catch (error: any) {
      const errorMessage = extractApiErrorMessage(error, 'Unknown error')
      showError(`Failed to delete workflows: ${errorMessage}`)
    }
  }, [templates, workflowsOfWorkflows, activeTab, user, setTemplates, setWorkflowsOfWorkflows, setSelectedTemplateIds, showError, showSuccess, showConfirm, api])

  return {
    deleteSelectedWorkflows,
  }
}
