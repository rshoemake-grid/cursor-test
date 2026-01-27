/**
 * Draft Management Hook
 * Handles loading and saving workflow drafts per tab
 */

import { useEffect, useRef } from 'react'
import { getLocalStorageItem, setLocalStorageItem } from './useLocalStorage'
import { logger } from '../utils/logger'
import type { Node, Edge } from '@xyflow/react'

export interface TabDraft {
  nodes: Node[]
  edges: Edge[]
  workflowId: string | null
  workflowName: string
  workflowDescription: string
  isUnsaved: boolean
}

const DRAFT_STORAGE_KEY = 'workflowBuilderDrafts'

export const loadDraftsFromStorage = (): Record<string, TabDraft> => {
  const drafts = getLocalStorageItem<Record<string, TabDraft>>(DRAFT_STORAGE_KEY, {})
  return typeof drafts === 'object' && drafts !== null ? drafts : {}
}

export const saveDraftsToStorage = (drafts: Record<string, TabDraft>) => {
  setLocalStorageItem(DRAFT_STORAGE_KEY, drafts)
}

interface UseDraftManagementOptions {
  tabId: string
  workflowId: string | null
  nodes: Node[]
  edges: Edge[]
  localWorkflowId: string | null
  localWorkflowName: string
  localWorkflowDescription: string
  tabIsUnsaved: boolean
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void
  setLocalWorkflowId: (id: string | null) => void
  setLocalWorkflowName: (name: string) => void
  setLocalWorkflowDescription: (description: string) => void
  normalizeNodeForStorage: (node: Node) => Node
  isAddingAgentsRef?: React.MutableRefObject<boolean>
}

export function useDraftManagement({
  tabId,
  workflowId,
  nodes,
  edges,
  localWorkflowId,
  localWorkflowName,
  localWorkflowDescription,
  tabIsUnsaved,
  setNodes,
  setEdges,
  setLocalWorkflowId,
  setLocalWorkflowName,
  setLocalWorkflowDescription,
  normalizeNodeForStorage,
  isAddingAgentsRef,
}: UseDraftManagementOptions) {
  const tabDraftsRef = useRef<Record<string, TabDraft>>(loadDraftsFromStorage())

  // Load draft when tab or workflow changes
  useEffect(() => {
    // Don't load draft if we're in the middle of adding agents
    if (isAddingAgentsRef?.current) {
      logger.debug('[useDraftManagement] Skipping draft load - adding agents in progress')
      return
    }

    const draft = tabDraftsRef.current[tabId]
    const matchesCurrentWorkflow = draft && (
      (!workflowId && !draft.workflowId) ||
      (workflowId && draft.workflowId === workflowId)
    )

    if (matchesCurrentWorkflow) {
      logger.debug('[useDraftManagement] Loading draft nodes:', draft.nodes.length)
      setNodes(draft.nodes.map(normalizeNodeForStorage))
      setEdges(draft.edges)
      setLocalWorkflowId(draft.workflowId)
      setLocalWorkflowName(draft.workflowName)
      setLocalWorkflowDescription(draft.workflowDescription)
    } else if (!workflowId) {
      setNodes([])
      setEdges([])
      setLocalWorkflowId(null)
      setLocalWorkflowName('Untitled Workflow')
      setLocalWorkflowDescription('')
    }
  }, [tabId, workflowId, isAddingAgentsRef, normalizeNodeForStorage, setNodes, setEdges, setLocalWorkflowId, setLocalWorkflowName, setLocalWorkflowDescription])

  // Save draft when workflow state changes
  useEffect(() => {
    tabDraftsRef.current[tabId] = {
      nodes: nodes.map(normalizeNodeForStorage),
      edges,
      workflowId: localWorkflowId,
      workflowName: localWorkflowName,
      workflowDescription: localWorkflowDescription,
      isUnsaved: tabIsUnsaved
    }
    saveDraftsToStorage(tabDraftsRef.current)
  }, [tabId, nodes, edges, localWorkflowId, localWorkflowName, localWorkflowDescription, tabIsUnsaved, normalizeNodeForStorage])

  return {
    tabDraftsRef,
    saveDraftsToStorage,
  }
}
