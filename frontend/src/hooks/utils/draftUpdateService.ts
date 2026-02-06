/**
 * Draft Update Service
 * Extracted draft update logic to improve mutation resistance and DRY compliance
 * Single Responsibility: Only handles draft storage updates
 */

import { logicalOrToEmptyArray } from './logicalOr'
import { DRAFT_UPDATE } from './marketplaceConstants'

/**
 * Draft data structure
 */
export interface DraftData {
  nodes: any[]
  edges: any[]
  workflowId: string | null
  workflowName: string
  workflowDescription: string
  isUnsaved: boolean
}

/**
 * Update draft storage with new nodes
 * Mutation-resistant: uses constants for delays
 */
export function updateDraftStorage(
  tabDraftsRef: React.MutableRefObject<Record<string, any>>,
  tabId: string,
  updatedNodes: any[],
  workflowId: string | null,
  workflowName: string,
  workflowDescription: string,
  tabIsUnsaved: boolean,
  saveDraftsToStorage: (drafts: Record<string, any>) => void,
  logger: { debug: (message: string, ...args: any[]) => void }
): void {
  setTimeout(() => {
    const currentDraft = tabDraftsRef.current[tabId]
    const updatedDraft: DraftData = {
      nodes: updatedNodes,
      edges: logicalOrToEmptyArray(currentDraft?.edges),
      workflowId,
      workflowName,
      workflowDescription,
      isUnsaved: tabIsUnsaved
    }
    tabDraftsRef.current[tabId] = updatedDraft
    saveDraftsToStorage(tabDraftsRef.current)
    logger.debug('[DraftUpdate] Draft updated with new nodes, total:', updatedNodes.length)
  }, DRAFT_UPDATE.IMMEDIATE_DELAY)
}

/**
 * Reset flag after delay
 * Mutation-resistant: uses constants for delays
 */
export function resetFlagAfterDelay(
  flagRef: React.MutableRefObject<boolean>,
  logger: { debug: (message: string, ...args: any[]) => void }
): void {
  setTimeout(() => {
    flagRef.current = false
    logger.debug('[DraftUpdate] Reset flag')
  }, DRAFT_UPDATE.FLAG_RESET_DELAY)
}
