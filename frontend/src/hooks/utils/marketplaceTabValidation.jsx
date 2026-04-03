function isRepositoryTab(activeTab) {
  return activeTab === "repository";
}
function isWorkflowsOfWorkflowsTab(activeTab) {
  return activeTab === "workflows-of-workflows";
}
function isAgentsTab(activeTab) {
  return activeTab === "agents";
}
function isWorkflowsSubTab(repositorySubTab) {
  return repositorySubTab === "workflows";
}
function isAgentsSubTab(repositorySubTab) {
  return repositorySubTab === "agents";
}
function shouldLoadTemplates(activeTab, repositorySubTab) {
  return isRepositoryTab(activeTab) && isWorkflowsSubTab(repositorySubTab);
}
function shouldLoadRepositoryAgents(activeTab, repositorySubTab) {
  if (!isRepositoryTab(activeTab)) {
    return false;
  }
  if (isAgentsSubTab(repositorySubTab)) {
    return true;
  }
  return !isWorkflowsSubTab(repositorySubTab);
}
function shouldLoadWorkflowsOfWorkflows(activeTab) {
  return isWorkflowsOfWorkflowsTab(activeTab);
}
function shouldLoadAgents(activeTab) {
  return isAgentsTab(activeTab);
}
function shouldLoadTools(activeTab) {
  return activeTab === "tools";
}
function calculateLoadingState(
  activeTab,
  repositorySubTab,
  templatesLoading,
  repositoryAgentsLoading,
  workflowsOfWorkflowsLoading,
  agentsLoading,
  toolsLoading,
) {
  if (shouldLoadTemplates(activeTab, repositorySubTab)) {
    return templatesLoading;
  }
  if (shouldLoadRepositoryAgents(activeTab, repositorySubTab)) {
    return repositoryAgentsLoading;
  }
  if (shouldLoadWorkflowsOfWorkflows(activeTab)) {
    return workflowsOfWorkflowsLoading;
  }
  if (shouldLoadTools(activeTab)) {
    return toolsLoading ?? false;
  }
  if (shouldLoadAgents(activeTab)) {
    return agentsLoading;
  }
  return false;
}
export {
  calculateLoadingState,
  isAgentsSubTab,
  isAgentsTab,
  isRepositoryTab,
  isWorkflowsOfWorkflowsTab,
  isWorkflowsSubTab,
  shouldLoadAgents,
  shouldLoadRepositoryAgents,
  shouldLoadTemplates,
  shouldLoadTools,
  shouldLoadWorkflowsOfWorkflows,
};
