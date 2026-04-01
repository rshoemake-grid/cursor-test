import { logicalOrToEmptyArray } from "./logicalOr";
import { DRAFT_UPDATE } from "./marketplaceConstants";
function updateDraftStorage(tabDraftsRef, tabId, updatedNodes, workflowId, workflowName, workflowDescription, tabIsUnsaved, saveDraftsToStorage, logger) {
  setTimeout(() => {
    const currentDraft = tabDraftsRef.current[tabId];
    const updatedDraft = {
      nodes: updatedNodes,
      edges: logicalOrToEmptyArray(currentDraft?.edges),
      workflowId,
      workflowName,
      workflowDescription,
      isUnsaved: tabIsUnsaved
    };
    tabDraftsRef.current[tabId] = updatedDraft;
    saveDraftsToStorage(tabDraftsRef.current);
    logger.debug("[DraftUpdate] Draft updated with new nodes, total:", updatedNodes.length);
  }, DRAFT_UPDATE.IMMEDIATE_DELAY);
}
function resetFlagAfterDelay(flagRef, logger) {
  setTimeout(() => {
    flagRef.current = false;
    logger.debug("[DraftUpdate] Reset flag");
  }, DRAFT_UPDATE.FLAG_RESET_DELAY);
}
export {
  resetFlagAfterDelay,
  updateDraftStorage
};
