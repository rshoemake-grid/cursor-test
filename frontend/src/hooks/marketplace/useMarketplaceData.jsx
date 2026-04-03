import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSyncState, useSyncStateWithDefault } from "../utils/useSyncState";
import { useTemplatesData } from "./useTemplatesData";
import { useAgentsData } from "./useAgentsData";
import { useRepositoryAgentsData } from "./useRepositoryAgentsData";
import { useToolsData } from "./useToolsData";
import { useWorkflowsOfWorkflowsData } from "./useWorkflowsOfWorkflowsData";
import { useDataFetching } from "../utils/useDataFetching";
import {
  shouldLoadTemplates,
  shouldLoadRepositoryAgents,
  shouldLoadWorkflowsOfWorkflows,
  shouldLoadAgents,
  shouldLoadTools,
  calculateLoadingState,
} from "../utils/marketplaceTabValidation";
import { nullishCoalesceToNull } from "../utils/nullishCoalescing";
import { logicalOrToEmptyArray } from "../utils/logicalOr";
function useMarketplaceData({
  storage,
  httpClient,
  apiBaseUrl,
  category,
  searchQuery,
  sortBy,
  user,
  activeTab,
  repositorySubTab,
}) {
  const { fetchTemplates: fetchTemplatesFn } = useTemplatesData({
    httpClient,
    apiBaseUrl,
    category,
    searchQuery,
    sortBy,
  });
  const { fetchWorkflowsOfWorkflows: fetchWorkflowsOfWorkflowsFn } =
    useWorkflowsOfWorkflowsData({
      httpClient,
      apiBaseUrl,
      category,
      searchQuery,
      sortBy,
    });
  const { fetchAgents: fetchAgentsFn } = useAgentsData({
    storage,
    httpClient,
    apiBaseUrl,
    category,
    searchQuery,
    sortBy,
    user,
  });
  const { fetchRepositoryAgents: fetchRepositoryAgentsFn } =
    useRepositoryAgentsData({
      storage,
      category,
      searchQuery,
      sortBy,
    });
  const { fetchTools: fetchToolsFn } = useToolsData({
    storage,
    category,
    searchQuery,
    sortBy,
  });
  const templatesFetching = useDataFetching({
    fetchFn: fetchTemplatesFn,
    initialData: [],
  });
  const workflowsOfWorkflowsFetching = useDataFetching({
    fetchFn: fetchWorkflowsOfWorkflowsFn,
    initialData: [],
  });
  const agentsFetching = useDataFetching({
    fetchFn: fetchAgentsFn,
    initialData: [],
  });
  const repositoryAgentsFetching = useDataFetching({
    fetchFn: fetchRepositoryAgentsFn,
    initialData: [],
  });
  const toolsFetching = useDataFetching({
    fetchFn: fetchToolsFn,
    initialData: [],
  });
  const [templates, setTemplates] = useState(
    nullishCoalesceToNull(templatesFetching.data),
  );
  const [workflowsOfWorkflows, setWorkflowsOfWorkflows] = useState(
    logicalOrToEmptyArray(workflowsOfWorkflowsFetching.data),
  );
  const [agents, setAgents] = useState(
    logicalOrToEmptyArray(agentsFetching.data),
  );
  const [repositoryAgents, setRepositoryAgents] = useState(
    logicalOrToEmptyArray(repositoryAgentsFetching.data),
  );
  const [tools, setTools] = useState(logicalOrToEmptyArray(toolsFetching.data));
  const truthyCondition = useMemo(
    () => (data) => data !== null && data !== void 0,
    [],
  );
  useSyncStateWithDefault(templatesFetching.data, setTemplates, null);
  useSyncState(
    workflowsOfWorkflowsFetching.data,
    setWorkflowsOfWorkflows,
    truthyCondition,
  );
  useSyncState(agentsFetching.data, setAgents, truthyCondition);
  useSyncState(
    repositoryAgentsFetching.data,
    setRepositoryAgents,
    truthyCondition,
  );
  useSyncState(toolsFetching.data, setTools, truthyCondition);
  const loading = calculateLoadingState(
    activeTab,
    repositorySubTab,
    templatesFetching.loading,
    repositoryAgentsFetching.loading,
    workflowsOfWorkflowsFetching.loading,
    agentsFetching.loading,
    toolsFetching.loading,
  );
  const templatesRefetchRef = useRef(templatesFetching.refetch);
  const workflowsOfWorkflowsRefetchRef = useRef(
    workflowsOfWorkflowsFetching.refetch,
  );
  const agentsRefetchRef = useRef(agentsFetching.refetch);
  const repositoryAgentsRefetchRef = useRef(repositoryAgentsFetching.refetch);
  const toolsRefetchRef = useRef(toolsFetching.refetch);
  templatesRefetchRef.current = templatesFetching.refetch;
  workflowsOfWorkflowsRefetchRef.current = workflowsOfWorkflowsFetching.refetch;
  agentsRefetchRef.current = agentsFetching.refetch;
  repositoryAgentsRefetchRef.current = repositoryAgentsFetching.refetch;
  toolsRefetchRef.current = toolsFetching.refetch;
  useEffect(() => {
    if (shouldLoadTemplates(activeTab, repositorySubTab)) {
      templatesRefetchRef.current?.();
    } else if (shouldLoadRepositoryAgents(activeTab, repositorySubTab)) {
      repositoryAgentsRefetchRef.current?.();
    } else if (shouldLoadWorkflowsOfWorkflows(activeTab)) {
      workflowsOfWorkflowsRefetchRef.current?.();
    } else if (shouldLoadTools(activeTab)) {
      toolsRefetchRef.current?.();
    } else if (shouldLoadAgents(activeTab)) {
      agentsRefetchRef.current?.();
    }
  }, [activeTab, repositorySubTab]);
  const fetchTemplates = useCallback(async () => {
    await templatesFetching.refetch();
  }, [templatesFetching.refetch]);
  const fetchWorkflowsOfWorkflows = useCallback(async () => {
    await workflowsOfWorkflowsFetching.refetch();
  }, [workflowsOfWorkflowsFetching.refetch]);
  const fetchAgents = useCallback(async () => {
    await agentsFetching.refetch();
  }, [agentsFetching.refetch]);
  const fetchRepositoryAgents = useCallback(async () => {
    await repositoryAgentsFetching.refetch();
  }, [repositoryAgentsFetching.refetch]);
  const fetchTools = useCallback(async () => {
    await toolsFetching.refetch();
  }, [toolsFetching.refetch]);
  return {
    templates,
    workflowsOfWorkflows,
    agents,
    repositoryAgents,
    tools,
    loading,
    setTemplates,
    setWorkflowsOfWorkflows,
    setAgents,
    setRepositoryAgents,
    setTools,
    fetchTemplates,
    fetchWorkflowsOfWorkflows,
    fetchAgents,
    fetchRepositoryAgents,
    fetchTools,
  };
}
export { useMarketplaceData };
