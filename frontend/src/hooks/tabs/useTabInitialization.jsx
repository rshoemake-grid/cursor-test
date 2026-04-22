import { useEffect } from "react";
import {
  createNewTab,
  createTabWithWorkflow,
  tabExists,
} from "../utils/tabUtils";
function useTabInitialization({
  tabs,
  activeTabId,
  setTabs,
  setActiveTabId,
  tabsRef,
  initialWorkflowId,
  workflowLoadKey,
  processedKeys,
  isAuthenticated = true,
}) {
  useEffect(() => {
    if (activeTabId && !tabExists(tabs, activeTabId)) {
      if (tabs.length > 0) {
        setActiveTabId(tabs[0].id);
      } else {
        const newTab = createNewTab();
        setTabs([newTab]);
        setActiveTabId(newTab.id);
      }
    }
  }, [tabs, activeTabId, setTabs, setActiveTabId]);
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (!initialWorkflowId || workflowLoadKey === void 0) {
      return;
    }
    // Always open a new tab from the workflow list, even if this workflow is already
    // open — same as opening the same file twice in an editor.
    const uniqueKey = `${initialWorkflowId}-${workflowLoadKey}`;
    if (processedKeys.current.has(uniqueKey)) {
      return;
    }
    processedKeys.current.add(uniqueKey);
    const newTab = createTabWithWorkflow(initialWorkflowId, "Loading...");
    setTabs((prev) => {
      const existingTab = prev.find((t) => t.id === newTab.id);
      if (existingTab) {
        return prev;
      }
      const newTabs = [...prev, newTab];
      tabsRef.current = newTabs;
      return newTabs;
    });
    setActiveTabId(newTab.id);
  }, [
    initialWorkflowId,
    workflowLoadKey,
    setTabs,
    setActiveTabId,
    tabsRef,
    processedKeys,
    isAuthenticated,
  ]);
}
export { useTabInitialization };
