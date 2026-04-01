import { useTemplateUsage } from "./useTemplateUsage";
import { useAgentDeletion, useRepositoryAgentDeletion } from "./useAgentDeletion";
import { useWorkflowDeletion } from "../workflow";
function useTemplateOperations({
  token,
  user,
  httpClient,
  apiBaseUrl,
  storage,
  agents,
  templates,
  workflowsOfWorkflows,
  activeTab,
  setAgents,
  setTemplates,
  setWorkflowsOfWorkflows,
  setRepositoryAgents,
  setSelectedAgentIds,
  setSelectedTemplateIds,
  setSelectedRepositoryAgentIds
}) {
  const { useTemplate } = useTemplateUsage({
    token,
    httpClient,
    apiBaseUrl
  });
  const { deleteSelectedAgents } = useAgentDeletion({
    user,
    storage,
    agents,
    setAgents,
    setSelectedAgentIds
  });
  const { deleteSelectedWorkflows } = useWorkflowDeletion({
    user,
    templates,
    workflowsOfWorkflows,
    activeTab,
    setTemplates,
    setWorkflowsOfWorkflows,
    setSelectedTemplateIds
  });
  const { deleteSelectedRepositoryAgents } = useRepositoryAgentDeletion({
    storage,
    setRepositoryAgents,
    setSelectedRepositoryAgentIds
  });
  return {
    useTemplate,
    deleteSelectedAgents,
    deleteSelectedWorkflows,
    deleteSelectedRepositoryAgents
  };
}
export {
  useTemplateOperations
};
