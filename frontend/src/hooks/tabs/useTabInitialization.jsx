import { useEffect } from "react";
import {
  createNewTab,
  createTabWithWorkflow,
  tabExists
} from "../utils/tabUtils";
function useTabInitialization({
  tabs,
  activeTabId,
  setTabs,
  setActiveTabId,
  tabsRef,
  initialWorkflowId,
  workflowLoadKey,
  processedKeys
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
    if (initialWorkflowId && workflowLoadKey !== void 0) {
      const uniqueKey = `${initialWorkflowId}-${workflowLoadKey}`;
      if (!processedKeys.current.has(uniqueKey)) {
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
      }
    }
  }, [initialWorkflowId, workflowLoadKey, setTabs, setActiveTabId, tabsRef, processedKeys]);
}
export {
  useTabInitialization
};
