import { useCallback } from "react";
import { updateTab } from "../utils/tabUtils";
function useTabWorkflowSync({ setTabs }) {
  const handleLoadWorkflow = useCallback(
    (tabId, workflowId, name) => {
      setTabs((prev) =>
        updateTab(prev, tabId, { workflowId, name, isUnsaved: false }),
      );
    },
    [setTabs],
  );
  const handleWorkflowSaved = useCallback(
    (tabId, workflowId, name) => {
      setTabs((prev) =>
        updateTab(prev, tabId, { workflowId, name, isUnsaved: false }),
      );
    },
    [setTabs],
  );
  const handleWorkflowModified = useCallback(
    (tabId) => {
      setTabs((prev) => updateTab(prev, tabId, { isUnsaved: true }));
    },
    [setTabs],
  );
  return {
    handleLoadWorkflow,
    handleWorkflowSaved,
    handleWorkflowModified,
  };
}
export { useTabWorkflowSync };
