import { useSelectionManager } from "../nodes";
function useMarketplaceSelections() {
  const templateSelection = useSelectionManager();
  const agentSelection = useSelectionManager();
  const repositoryAgentSelection = useSelectionManager();
  const toolSelection = useSelectionManager();
  const clearAllSelections = () => {
    templateSelection.clear();
    agentSelection.clear();
    repositoryAgentSelection.clear();
    toolSelection.clear();
  };
  const clearSelectionsForTab = (activeTab, repositorySubTab) => {
    if (activeTab === "agents") {
      agentSelection.clear();
    } else if (activeTab === "tools") {
      toolSelection.clear();
    } else if (activeTab === "repository" || activeTab === "workflows-of-workflows") {
      if (activeTab === "repository" && repositorySubTab === "agents") {
        repositoryAgentSelection.clear();
      } else {
        templateSelection.clear();
      }
    }
  };
  return {
    templateSelection,
    agentSelection,
    repositoryAgentSelection,
    toolSelection,
    clearAllSelections,
    clearSelectionsForTab
  };
}
export {
  useMarketplaceSelections
};
