/**
 * Draft Management Hook
 * Handles loading and saving workflow drafts per tab
 */

import { useEffect, useRef } from 'react'
import { getLocalStorageItem, setLocalStorageItem } from './useLocalStorage'
import { logger as defaultLogger } from '../utils/logger'
import type { Node, Edge } from '@xyflow/react'
import type { StorageAdapter } from '../types/adapters'

export interface TabDraft {
  nodes: Node[]
  edges: Edge[]
  workflowId: string | null
  workflowName: string
  workflowDescription: string
  isUnsaved: boolean
}

const DRAFT_STORAGE_KEY = 'workflowBuilderDrafts'

export const loadDraftsFromStorage = (options?: {
  storage?: StorageAdapter | null
  logger?: typeof defaultLogger
}): Record<string, TabDraft> => {
  const drafts = getLocalStorageItem<Record<string, TabDraft>>(DRAFT_STORAGE_KEY, {}, options)
  return typeof drafts === 'object' && drafts !== null ? drafts : {}
}

export const saveDraftsToStorage = (
  drafts: Record<string, TabDraft>,
  options?: {
    storage?: StorageAdapter | null
    logger?: typeof defaultLogger
  }
) => {
  setLocalStorageItem(DRAFT_STORAGE_KEY, drafts, options)
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
  storage?: StorageAdapter | null
  logger?: typeof defaultLogger
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
  storage,
  logger = defaultLogger,
}: UseDraftManagementOptions) {
  const storageOptions = { storage, logger }
  const tabDraftsRef = useRef<Record<string, TabDraft>>(loadDraftsFromStorage(storageOptions))

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
    saveDraftsToStorage(tabDraftsRef.current, storageOptions)
  }, [tabId, nodes, edges, localWorkflowId, localWorkflowName, localWorkflowDescription, tabIsUnsaved, normalizeNodeForStorage, storageOptions])

  return {
    tabDraftsRef,
    saveDraftsToStorage,
  }
}
