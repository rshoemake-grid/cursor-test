import { useCallback } from "react";
import {
  findTab,
  removeTab,
  handleActiveTabAfterClose,
  createNewTab,
} from "../utils/tabUtils";
import { confirmUnsavedChanges } from "../utils/confirmations";
function useTabClosing({ tabs, activeTabId, setTabs, setActiveTabId }) {
  const handleCloseTab = useCallback(
    async (tabId, e) => {
      e.stopPropagation();
      const tabToClose = findTab(tabs, tabId);
      if (tabToClose?.isUnsaved) {
        await confirmUnsavedChanges(() => {
          setTabs((prev) => {
            const filtered = removeTab(prev, tabId);
            handleActiveTabAfterClose(
              tabId,
              activeTabId,
              filtered,
              setActiveTabId,
            );
            return filtered;
          });
        });
        return;
      }
      setTabs((prev) => {
        const filtered = removeTab(prev, tabId);
        handleActiveTabAfterClose(tabId, activeTabId, filtered, setActiveTabId);
        return filtered;
      });
    },
    [tabs, activeTabId, setTabs, setActiveTabId],
  );
  const handleCloseWorkflow = useCallback(
    async (workflowId) => {
      const tabToClose = tabs.find((t) => t.workflowId === workflowId);
      if (!tabToClose) return;
      if (tabToClose.isUnsaved) {
        await confirmUnsavedChanges(() => {
          setTabs((prev) => {
            const filtered = removeTab(prev, tabToClose.id);
            handleActiveTabAfterClose(
              tabToClose.id,
              activeTabId,
              filtered,
              setActiveTabId,
            );
            return filtered;
          });
        });
        return;
      }
      setTabs((prev) => {
        const filtered = removeTab(prev, tabToClose.id);
        handleActiveTabAfterClose(
          tabToClose.id,
          activeTabId,
          filtered,
          setActiveTabId,
        );
        if (filtered.length === 0) {
          const newTab = createNewTab();
          setActiveTabId(newTab.id);
          return [newTab];
        }
        return filtered;
      });
    },
    [tabs, activeTabId, setTabs, setActiveTabId],
  );
  return {
    handleCloseTab,
    handleCloseWorkflow,
  };
}
export { useTabClosing };
