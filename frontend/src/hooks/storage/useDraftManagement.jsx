import { useEffect, useRef } from "react";
import { getLocalStorageItem, setLocalStorageItem } from "./useLocalStorage";
import { logger as defaultLogger } from "../../utils/logger";
const DRAFT_STORAGE_KEY = "workflowBuilderDrafts";
const loadDraftsFromStorage = (options) => {
  const drafts = getLocalStorageItem(DRAFT_STORAGE_KEY, {}, options);
  return typeof drafts === "object" && drafts !== null ? drafts : {};
};
const saveDraftsToStorage = (drafts, options) => {
  setLocalStorageItem(DRAFT_STORAGE_KEY, drafts, options);
};
function useDraftManagement({
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
  logger = defaultLogger
}) {
  const storageOptions = { storage, logger };
  const tabDraftsRef = useRef(loadDraftsFromStorage(storageOptions));
  useEffect(() => {
    if (isAddingAgentsRef?.current) {
      logger.debug("[useDraftManagement] Skipping draft load - adding agents in progress");
      return;
    }
    const draft = tabDraftsRef.current[tabId];
    const matchesCurrentWorkflow = draft && (!workflowId && !draft.workflowId || workflowId && draft.workflowId === workflowId);
    if (matchesCurrentWorkflow) {
      logger.debug("[useDraftManagement] Loading draft nodes:", draft.nodes.length);
      setNodes(draft.nodes.map(normalizeNodeForStorage));
      setEdges(draft.edges);
      setLocalWorkflowId(draft.workflowId);
      setLocalWorkflowName(draft.workflowName);
      setLocalWorkflowDescription(draft.workflowDescription);
    } else if (!workflowId) {
      setNodes([]);
      setEdges([]);
      setLocalWorkflowId(null);
      setLocalWorkflowName("Untitled Workflow");
      setLocalWorkflowDescription("");
    }
  }, [tabId, workflowId, isAddingAgentsRef, normalizeNodeForStorage, setNodes, setEdges, setLocalWorkflowId, setLocalWorkflowName, setLocalWorkflowDescription]);
  useEffect(() => {
    tabDraftsRef.current[tabId] = {
      nodes: nodes.map(normalizeNodeForStorage),
      edges,
      workflowId: localWorkflowId,
      workflowName: localWorkflowName,
      workflowDescription: localWorkflowDescription,
      isUnsaved: tabIsUnsaved
    };
    saveDraftsToStorage(tabDraftsRef.current, storageOptions);
  }, [tabId, nodes, edges, localWorkflowId, localWorkflowName, localWorkflowDescription, tabIsUnsaved, normalizeNodeForStorage, storageOptions]);
  return {
    tabDraftsRef,
    saveDraftsToStorage
  };
}
export {
  loadDraftsFromStorage,
  saveDraftsToStorage,
  useDraftManagement
};
