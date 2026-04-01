import { useState } from "react";
const MARKETPLACE_TABS = {
  AGENTS: "agents",
  REPOSITORY: "repository",
  WORKFLOWS_OF_WORKFLOWS: "workflows-of-workflows",
  TOOLS: "tools"
};
const REPOSITORY_SUB_TABS = {
  WORKFLOWS: "workflows",
  AGENTS: "agents"
};
function useMarketplaceTabs() {
  const [activeTab, setActiveTab] = useState(MARKETPLACE_TABS.AGENTS);
  const [repositorySubTab, setRepositorySubTab] = useState(
    REPOSITORY_SUB_TABS.WORKFLOWS
  );
  const isAgentsTab = activeTab === MARKETPLACE_TABS.AGENTS;
  const isRepositoryTab = activeTab === MARKETPLACE_TABS.REPOSITORY;
  const isWorkflowsOfWorkflowsTab = activeTab === MARKETPLACE_TABS.WORKFLOWS_OF_WORKFLOWS;
  const isToolsTab = activeTab === MARKETPLACE_TABS.TOOLS;
  const isRepositoryWorkflowsSubTab = isRepositoryTab && repositorySubTab === REPOSITORY_SUB_TABS.WORKFLOWS;
  const isRepositoryAgentsSubTab = isRepositoryTab && repositorySubTab === REPOSITORY_SUB_TABS.AGENTS;
  return {
    activeTab,
    repositorySubTab,
    setActiveTab,
    setRepositorySubTab,
    isAgentsTab,
    isRepositoryTab,
    isWorkflowsOfWorkflowsTab,
    isToolsTab,
    isRepositoryWorkflowsSubTab,
    isRepositoryAgentsSubTab
  };
}
export {
  MARKETPLACE_TABS,
  REPOSITORY_SUB_TABS,
  useMarketplaceTabs
};
