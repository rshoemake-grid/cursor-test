import { useCallback } from "react";
import { createNewTab } from "../utils/tabUtils";
function useTabCreation({
  setTabs,
  setActiveTabId
}) {
  const handleNewWorkflow = useCallback(() => {
    const newTab = createNewTab();
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [setTabs, setActiveTabId]);
  return {
    handleNewWorkflow
  };
}
export {
  useTabCreation
};
