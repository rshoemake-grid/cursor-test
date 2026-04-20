import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
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
function shouldHydrateDraftFromStorage(draft, workflowId) {
  if (!draft) {
    return false;
  }
  const propWorkflowIdMissing = workflowId == null || workflowId === "";
  const draftWorkflowId = draft.workflowId;
  const idsMatch =
    (propWorkflowIdMissing && (draftWorkflowId == null || draftWorkflowId === "")) ||
    (workflowId != null &&
      workflowId !== "" &&
      draftWorkflowId === workflowId);
  const restoreSavedWhilePropIdMissing =
    propWorkflowIdMissing &&
    draftWorkflowId != null &&
    draftWorkflowId !== "";
  return idsMatch || restoreSavedWhilePropIdMissing;
}
function useDraftManagement({
  tabDraftsRef: externalDraftsRef,
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
}) {
  const storageOptions = useMemo(
    () => ({ storage, logger }),
    [storage, logger],
  );
  const internalDraftsRef = useRef(null);
  if (!externalDraftsRef && internalDraftsRef.current === null) {
    internalDraftsRef.current = loadDraftsFromStorage(storageOptions);
  }
  const draftsRef = externalDraftsRef ?? internalDraftsRef;

  const storageOptionsRef = useRef(storageOptions);
  storageOptionsRef.current = storageOptions;

  const hydrateDraftRef = useRef({});
  hydrateDraftRef.current = {
    normalizeNodeForStorage,
    setNodes,
    setEdges,
    setLocalWorkflowId,
    setLocalWorkflowName,
    setLocalWorkflowDescription,
    isAddingAgentsRef,
    draftsRef,
    logger,
  };

  const hydratedRef = useRef(false);
  useLayoutEffect(() => {
    hydratedRef.current = false;
    const so = storageOptionsRef.current;
    const {
      normalizeNodeForStorage: norm,
      setNodes: setN,
      setEdges: setE,
      setLocalWorkflowId: setLWId,
      setLocalWorkflowName: setLWName,
      setLocalWorkflowDescription: setLWDesc,
      isAddingAgentsRef: addingRef,
      draftsRef: dRef,
      logger: log,
    } = hydrateDraftRef.current;

    if (addingRef?.current) {
      log.debug(
        "[useDraftManagement] Skipping draft load - adding agents in progress",
      );
      hydratedRef.current = true;
      return;
    }
    dRef.current = loadDraftsFromStorage(so);
    const draft = dRef.current[tabId];
    if (shouldHydrateDraftFromStorage(draft, workflowId)) {
      const nodeList = draft.nodes ?? [];
      log.debug("[useDraftManagement] Loading draft nodes:", nodeList.length);
      setN(nodeList.map(norm));
      setE(draft.edges ?? []);
      setLWId(draft.workflowId);
      setLWName(draft.workflowName);
      setLWDesc(draft.workflowDescription);
    } else if (!workflowId) {
      setN([]);
      setE([]);
      setLWId(null);
      setLWName("Untitled Workflow");
      setLWDesc("");
    }
    hydratedRef.current = true;
  }, [tabId, workflowId]);

  useEffect(() => {
    const tid = tabId;
    return () => {
      const entry = draftsRef.current[tid];
      if (!entry) {
        return;
      }
      const so = storageOptionsRef.current;
      const merged = loadDraftsFromStorage(so);
      merged[tid] = entry;
      saveDraftsToStorage(merged, so);
      draftsRef.current = merged;
    };
  }, [tabId, draftsRef]);

  useLayoutEffect(() => {
    if (!hydratedRef.current) {
      return;
    }
    const so = storageOptionsRef.current;
    draftsRef.current[tabId] = {
      nodes: nodes.map(normalizeNodeForStorage),
      edges,
      workflowId: localWorkflowId,
      workflowName: localWorkflowName,
      workflowDescription: localWorkflowDescription,
      isUnsaved: tabIsUnsaved,
    };
    saveDraftsToStorage(draftsRef.current, so);
  }, [
    tabId,
    nodes,
    edges,
    localWorkflowId,
    localWorkflowName,
    localWorkflowDescription,
    tabIsUnsaved,
    normalizeNodeForStorage,
    draftsRef,
  ]);
  return {
    tabDraftsRef: draftsRef,
    saveDraftsToStorage,
  };
}
export { loadDraftsFromStorage, saveDraftsToStorage, useDraftManagement };
