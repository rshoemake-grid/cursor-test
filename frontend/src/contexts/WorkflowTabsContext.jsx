import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { getLocalStorageItem } from "../hooks/storage";
import { showSuccess } from "../utils/notifications";
import { STORAGE_KEYS } from "../config/constants";
const emptyTabState = {
  id: "workflow-1",
  name: "Untitled Workflow",
  workflowId: null,
  isUnsaved: true,
  executions: [],
  activeExecutionId: null,
};
const WorkflowTabsContext = createContext(null);
function WorkflowTabsProvider({
  children,
  storage,
  initialTabs,
  initialActiveTabId,
}) {
  const [tabs, setTabsState] = useState(() => {
    if (initialTabs) {
      return initialTabs;
    }
    const stored = getLocalStorageItem(STORAGE_KEYS.WORKFLOW_TABS, []);
    return Array.isArray(stored) && stored.length > 0
      ? stored
      : [emptyTabState];
  });
  const [activeTabId, setActiveTabIdState] = useState(() => {
    if (initialActiveTabId !== void 0) {
      return initialActiveTabId || tabs[0]?.id || "workflow-1";
    }
    const saved = getLocalStorageItem(STORAGE_KEYS.ACTIVE_TAB, null);
    return saved && tabs.some((tab) => tab.id === saved)
      ? saved
      : tabs[0]?.id || "workflow-1";
  });
  const processedKeys = useRef(new Set());
  useEffect(() => {
    if (storage) {
      try {
        storage.setItem(STORAGE_KEYS.WORKFLOW_TABS, JSON.stringify(tabs));
      } catch {}
    } else if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          STORAGE_KEYS.WORKFLOW_TABS,
          JSON.stringify(tabs),
        );
      } catch {}
    }
  }, [tabs, storage]);
  useEffect(() => {
    if (activeTabId) {
      const activeTabSerialized = JSON.stringify(activeTabId);
      if (storage) {
        try {
          storage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTabSerialized);
        } catch {}
      } else if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            STORAGE_KEYS.ACTIVE_TAB,
            activeTabSerialized,
          );
        } catch {}
      }
    } else {
      if (storage) {
        try {
          storage.removeItem(STORAGE_KEYS.ACTIVE_TAB);
        } catch {}
      } else if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB);
        } catch {}
      }
    }
  }, [activeTabId, storage]);
  const [storageToastShown, setStorageToastShown] = useState(false);
  const isInitialStoragePresent = useMemo(() => {
    if (initialTabs) return false;
    const stored = getLocalStorageItem(STORAGE_KEYS.WORKFLOW_TABS, []);
    return Array.isArray(stored) && stored.length > 0;
  }, [initialTabs]);
  useEffect(() => {
    if (isInitialStoragePresent && !storageToastShown) {
      showSuccess("Restored open workflow tabs from your previous session.");
      setStorageToastShown(true);
    }
  }, [isInitialStoragePresent, storageToastShown]);
  const setTabs = useCallback((updater) => {
    if (typeof updater === "function") {
      setTabsState(updater);
    } else {
      setTabsState(updater);
    }
  }, []);
  const setActiveTabId = useCallback((id) => {
    setActiveTabIdState(id);
  }, []);
  const value = {
    tabs,
    setTabs,
    activeTabId,
    setActiveTabId,
    processedKeys,
  };
  return (
    <WorkflowTabsContext.Provider value={value}>
      {children}
    </WorkflowTabsContext.Provider>
  );
}
function useWorkflowTabs() {
  const context = useContext(WorkflowTabsContext);
  if (!context) {
    throw new Error("useWorkflowTabs must be used within WorkflowTabsProvider");
  }
  return context;
}
function resetWorkflowTabsContext() {}
export { WorkflowTabsProvider, resetWorkflowTabsContext, useWorkflowTabs };
