import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
// Persist runs in useEffect (not useLayoutEffect) so it sees nodes/edges after
// the hydrate layout effect's setState has committed — otherwise the first
// persist can save an empty graph and wipe the draft (blank canvas on remount).
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

/**
 * Apply draft nodes/edges only when the tab is unsaved or we don't have a server id yet.
 * For saved tabs (server workflow id + isUnsaved false), {@code useWorkflowLoader} is the
 * source of truth — stale or empty drafts were blanking some tabs while still "logged in".
 */
function shouldApplyDraftCanvas(draft, workflowId, tabIsUnsaved) {
  if (!shouldHydrateDraftFromStorage(draft, workflowId)) {
    return false;
  }
  const noServerWorkflowYet = workflowId == null || workflowId === "";
  return tabIsUnsaved === true || noServerWorkflowYet;
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
  /** Latest graph snapshot for synchronous flush (nav / tab hide can skip useEffect). */
  const persistSliceRef = useRef({});
  persistSliceRef.current = {
    tabId,
    nodes,
    edges,
    localWorkflowId,
    localWorkflowName,
    localWorkflowDescription,
    tabIsUnsaved,
    normalizeNodeForStorage,
  };

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
    if (shouldApplyDraftCanvas(draft, workflowId, tabIsUnsaved)) {
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
  }, [tabId, workflowId, tabIsUnsaved]);

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

  const flushDraftToStorageRef = useRef(() => {});
  flushDraftToStorageRef.current = () => {
    if (!hydratedRef.current) {
      return;
    }
    const p = persistSliceRef.current;
    const so = storageOptionsRef.current;
    // Read-merge-write: each WorkflowBuilder keeps its own draftsRef snapshot. Saving the whole
    // object without merging would overwrite other tabs' drafts with stale copies (multi-tab UI).
    const latest = { ...loadDraftsFromStorage(so) };
    latest[p.tabId] = {
      nodes: p.nodes.map(p.normalizeNodeForStorage),
      edges: p.edges,
      workflowId: p.localWorkflowId,
      workflowName: p.localWorkflowName,
      workflowDescription: p.localWorkflowDescription,
      isUnsaved: p.tabIsUnsaved,
    };
    draftsRef.current = latest;
    saveDraftsToStorage(latest, so);
  };

  useEffect(() => {
    const flush = () => flushDraftToStorageRef.current();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("pagehide", flush);
    }
    return () => {
      flush();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("pagehide", flush);
      }
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }
    flushDraftToStorageRef.current();
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
export {
  loadDraftsFromStorage,
  saveDraftsToStorage,
  useDraftManagement,
  shouldApplyDraftCanvas,
};
