import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { showError, showSuccess } from "../../utils/notifications";
import { STORAGE_KEYS } from "../../config/constants";
import {
  PENDING_AGENTS_STORAGE_KEY,
  PENDING_TOOLS_STORAGE_KEY,
} from "../utils/marketplaceConstants";
import { MARKETPLACE_EVENTS } from "../utils/marketplaceEventConstants";
import { MARKETPLACE_TABS, REPOSITORY_SUB_TABS } from "./useMarketplaceTabs";
function useMarketplaceActions(options) {
  const {
    activeTab,
    repositorySubTab,
    templateSelection,
    agentSelection,
    repositoryAgentSelection,
    toolSelection,
    agents,
    repositoryAgents,
    tools,
    storage,
    useTemplate: loadTemplate,
    // Rename to avoid false positive from ESLint hook detection
    deleteSelectedAgents,
    deleteSelectedWorkflows,
    deleteSelectedRepositoryAgents,
    fetchRepositoryAgents,
  } = options;
  const navigate = useNavigate();
  const handleLoadWorkflows = useCallback(async () => {
    const templateIds = Array.from(templateSelection.selectedIds);
    for (const templateId of templateIds) {
      await loadTemplate(templateId);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    templateSelection.clear();
  }, [templateSelection, loadTemplate]);
  const handleUseAgents = useCallback(() => {
    const isRepositoryAgentsTab =
      activeTab === MARKETPLACE_TABS.REPOSITORY &&
      repositorySubTab === REPOSITORY_SUB_TABS.AGENTS;
    const selectedAgents = isRepositoryAgentsTab
      ? repositoryAgents.filter((a) =>
          repositoryAgentSelection.selectedIds.has(a.id),
        )
      : agents.filter((a) => agentSelection.selectedIds.has(a.id));
    if (!storage) {
      showError("Storage not available");
      return;
    }
    const activeTabId = storage.getItem(STORAGE_KEYS.ACTIVE_TAB);
    if (!activeTabId) {
      showError("No active workflow found. Please open a workflow first.");
      return;
    }
    const pendingAgents = {
      tabId: activeTabId,
      agents: selectedAgents,
      timestamp: Date.now(),
    };
    storage.setItem(PENDING_AGENTS_STORAGE_KEY, JSON.stringify(pendingAgents));
    const event = new CustomEvent(MARKETPLACE_EVENTS.ADD_AGENTS_TO_WORKFLOW, {
      detail: {
        agents: selectedAgents,
        tabId: activeTabId,
      },
    });
    window.dispatchEvent(event);
    const count = isRepositoryAgentsTab
      ? repositoryAgentSelection.size
      : agentSelection.size;
    showSuccess(`${count} agent(s) added to workflow`);
    if (isRepositoryAgentsTab) {
      repositoryAgentSelection.clear();
    } else {
      agentSelection.clear();
    }
    setTimeout(() => {
      navigate("/");
    }, 100);
  }, [
    activeTab,
    repositorySubTab,
    repositoryAgents,
    agents,
    repositoryAgentSelection,
    agentSelection,
    storage,
    navigate,
  ]);
  const handleUseTools = useCallback(() => {
    const selectedTools = tools.filter((t) =>
      toolSelection.selectedIds.has(t.id),
    );
    if (!storage) {
      showError("Storage not available");
      return;
    }
    const activeTabId = storage.getItem(STORAGE_KEYS.ACTIVE_TAB);
    if (!activeTabId) {
      showError("No active workflow found. Please open a workflow first.");
      return;
    }
    const pendingTools = {
      tabId: activeTabId,
      tools: selectedTools,
      timestamp: Date.now(),
    };
    storage.setItem(PENDING_TOOLS_STORAGE_KEY, JSON.stringify(pendingTools));
    const event = new CustomEvent(MARKETPLACE_EVENTS.ADD_TOOLS_TO_WORKFLOW, {
      detail: { tools: selectedTools, tabId: activeTabId },
    });
    window.dispatchEvent(event);
    showSuccess(`${toolSelection.size} tool(s) added to workflow`);
    toolSelection.clear();
    setTimeout(() => navigate("/"), 100);
  }, [tools, toolSelection, storage, navigate]);
  const handleDeleteAgents = useCallback(async () => {
    await deleteSelectedAgents(agentSelection.selectedIds);
  }, [deleteSelectedAgents, agentSelection.selectedIds]);
  const handleDeleteWorkflows = useCallback(async () => {
    await deleteSelectedWorkflows(templateSelection.selectedIds);
  }, [deleteSelectedWorkflows, templateSelection.selectedIds]);
  const handleDeleteRepositoryAgents = useCallback(async () => {
    await deleteSelectedRepositoryAgents(
      repositoryAgentSelection.selectedIds,
      fetchRepositoryAgents,
    );
  }, [
    deleteSelectedRepositoryAgents,
    repositoryAgentSelection.selectedIds,
    fetchRepositoryAgents,
  ]);
  return {
    handleLoadWorkflows,
    handleUseAgents,
    handleUseTools,
    handleDeleteAgents,
    handleDeleteWorkflows,
    handleDeleteRepositoryAgents,
  };
}
export { useMarketplaceActions };
