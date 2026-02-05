/**
 * Workflow State Hook
 * Manages local workflow state (id, name, description, variables)
 */

import { useState, useEffect, useRef } from 'react'

interface UseWorkflowStateOptions {
  workflowId: string | null
  tabName: string
}

export function useWorkflowState({
  workflowId: initialWorkflowId,
  tabName,
}: UseWorkflowStateOptions) {
  const [localWorkflowId, setLocalWorkflowId] = useState<string | null>(initialWorkflowId)
  const [localWorkflowName, setLocalWorkflowName] = useState<string>('Untitled Workflow')
  const [localWorkflowDescription, setLocalWorkflowDescription] = useState<string>('')
  const [variables, setVariables] = useState<Record<string, any>>({})
  const tabNameRef = useRef<string>(tabName)

  // Sync workflow name with tab name
  useEffect(() => {
    if (tabName !== tabNameRef.current) {
      tabNameRef.current = tabName
      setLocalWorkflowName(tabName)
    }
  }, [tabName])

  // Sync local workflow ID with prop
  useEffect(() => {
    if (initialWorkflowId !== localWorkflowId) {
      setLocalWorkflowId(initialWorkflowId)
    }
  }, [initialWorkflowId])

  return {
    localWorkflowId,
    setLocalWorkflowId,
    localWorkflowName,
    setLocalWorkflowName,
    localWorkflowDescription,
    setLocalWorkflowDescription,
    variables,
    setVariables,
  }
}
