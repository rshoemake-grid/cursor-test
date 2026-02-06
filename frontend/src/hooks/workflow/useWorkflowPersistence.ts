/**
 * Workflow Persistence Hook
 * Handles saving, loading, and exporting workflows
 */

import { useCallback } from 'react'
import { api as defaultApi } from '../../api/client'
import { showSuccess as defaultShowSuccess, showError as defaultShowError } from '../../utils/notifications'
import { logger as defaultLogger } from '../../utils/logger'
import { createWorkflowDefinition } from '../../utils/workflowFormat'
import type { Node, Edge } from '@xyflow/react'
import type { createApiClient } from '../../api/client'
import { nullishCoalesce } from '../utils/nullishCoalescing'
import { logicalOr } from '../utils/logicalOr'

interface UseWorkflowPersistenceOptions {
  isAuthenticated: boolean
  localWorkflowId: string | null
  localWorkflowName: string
  localWorkflowDescription: string
  nodes: Node[]
  edges: Edge[]
  variables: Record<string, any>
  setLocalWorkflowId: (id: string | null) => void
  onWorkflowSaved?: (workflowId: string, name: string) => void
  isSaving: boolean
  setIsSaving: (saving: boolean) => void
  // Dependency injection
  api?: ReturnType<typeof createApiClient>
  showSuccess?: typeof defaultShowSuccess
  showError?: typeof defaultShowError
  logger?: typeof defaultLogger
}

export function useWorkflowPersistence({
  isAuthenticated,
  localWorkflowId,
  localWorkflowName,
  localWorkflowDescription,
  nodes,
  edges,
  variables,
  setLocalWorkflowId,
  onWorkflowSaved,
  isSaving,
  setIsSaving,
  api = defaultApi,
  showSuccess = defaultShowSuccess,
  showError = defaultShowError,
  logger = defaultLogger,
}: UseWorkflowPersistenceOptions) {
  const saveWorkflow = useCallback(async (): Promise<string | null> => {
    if (!isAuthenticated) {
      showError('Please log in to save workflows.')
      return null
    }

    if (isSaving) {
      return nullishCoalesce(localWorkflowId, null)
    }

    const workflowDef = createWorkflowDefinition({
      name: localWorkflowName,
      description: localWorkflowDescription,
      nodes,
      edges,
      variables,
    })

    setIsSaving(true)
    try {
      if (localWorkflowId) {
        await api.updateWorkflow(localWorkflowId, workflowDef)
        showSuccess('Workflow updated successfully!')
        if (onWorkflowSaved) {
          onWorkflowSaved(localWorkflowId, workflowDef.name)
        }
        return localWorkflowId
      } else {
        const created = await api.createWorkflow(workflowDef)
        setLocalWorkflowId(created.id!)
        showSuccess('Workflow created successfully!')
        if (onWorkflowSaved) {
          onWorkflowSaved(created.id!, workflowDef.name)
        }
        return created.id!
      }
    } catch (error: any) {
      const errorMessage = 'Failed to save workflow: ' + logicalOr(error.message, 'Unknown error')
      showError(errorMessage)
      logger.error('Failed to save workflow:', error)
      throw new Error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }, [
    isAuthenticated,
    isSaving,
    localWorkflowId,
    localWorkflowName,
    localWorkflowDescription,
    nodes,
    edges,
    variables,
    setLocalWorkflowId,
    onWorkflowSaved,
    setIsSaving,
    api,
    showSuccess,
    showError,
    logger,
  ])

  const exportWorkflow = useCallback(() => {
    const workflowDef = createWorkflowDefinition({
      name: localWorkflowName,
      description: localWorkflowDescription,
      nodes,
      edges,
      variables,
    })
    
    const filename = logicalOr(localWorkflowName.trim(), 'workflow').replace(/\s+/g, '-')
    const blob = new Blob([JSON.stringify(workflowDef, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [localWorkflowName, localWorkflowDescription, nodes, edges, variables])

  return {
    saveWorkflow,
    exportWorkflow,
  }
}
