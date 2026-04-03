import { useTabCreation } from "./useTabCreation";
import { useTabClosing } from "./useTabClosing";
import { useTabWorkflowSync } from "./useTabWorkflowSync";
function useTabOperations({ tabs, activeTabId, setTabs, setActiveTabId }) {
  const { handleNewWorkflow } = useTabCreation({ setTabs, setActiveTabId });
  const { handleCloseTab, handleCloseWorkflow } = useTabClosing({
    tabs,
    activeTabId,
    setTabs,
    setActiveTabId,
  });
  const { handleLoadWorkflow, handleWorkflowSaved, handleWorkflowModified } =
    useTabWorkflowSync({
      setTabs,
    });
  return {
    handleNewWorkflow,
    handleCloseTab,
    handleCloseWorkflow,
    handleLoadWorkflow,
    handleWorkflowSaved,
    handleWorkflowModified,
  };
}
export { useTabOperations };
