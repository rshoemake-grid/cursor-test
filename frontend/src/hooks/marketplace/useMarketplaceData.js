/**
 * Marketplace Data Hook
 * Composes individual data fetching hooks for marketplace templates and agents
 * Follows Single Responsibility Principle by delegating to focused hooks
 */ import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSyncState, useSyncStateWithDefault } from '../utils/useSyncState';
import { useTemplatesData } from './useTemplatesData';
import { useAgentsData } from './useAgentsData';
import { useRepositoryAgentsData } from './useRepositoryAgentsData';
import { useToolsData } from './useToolsData';
import { useWorkflowsOfWorkflowsData } from './useWorkflowsOfWorkflowsData';
import { useDataFetching } from '../utils/useDataFetching';
import { shouldLoadTemplates, shouldLoadRepositoryAgents, shouldLoadWorkflowsOfWorkflows, shouldLoadAgents, shouldLoadTools, calculateLoadingState } from '../utils/marketplaceTabValidation';
import { nullishCoalesceToNull } from '../utils/nullishCoalescing';
import { logicalOrToEmptyArray } from '../utils/logicalOr';
/**
 * Hook for managing marketplace data fetching, filtering, and sorting
 * Composes individual data fetching hooks for better organization
 * 
 * @param options Configuration options
 * @returns Data state and fetch functions
 */ export function useMarketplaceData({ storage, httpClient, apiBaseUrl, category, searchQuery, sortBy, user, activeTab, repositorySubTab }) {
    // Compose individual data fetching hooks
    const { fetchTemplates: fetchTemplatesFn } = useTemplatesData({
        httpClient,
        apiBaseUrl,
        category,
        searchQuery,
        sortBy
    });
    const { fetchWorkflowsOfWorkflows: fetchWorkflowsOfWorkflowsFn } = useWorkflowsOfWorkflowsData({
        httpClient,
        apiBaseUrl,
        category,
        searchQuery,
        sortBy
    });
    const { fetchAgents: fetchAgentsFn } = useAgentsData({
        storage,
        httpClient,
        apiBaseUrl,
        category,
        searchQuery,
        sortBy,
        user
    });
    const { fetchRepositoryAgents: fetchRepositoryAgentsFn } = useRepositoryAgentsData({
        storage,
        category,
        searchQuery,
        sortBy
    });
    const { fetchTools: fetchToolsFn } = useToolsData({
        storage,
        category,
        searchQuery,
        sortBy
    });
    // Use generic data fetching hook for templates
    const templatesFetching = useDataFetching({
        fetchFn: fetchTemplatesFn,
        initialData: []
    });
    // Use generic data fetching hook for workflows of workflows
    const workflowsOfWorkflowsFetching = useDataFetching({
        fetchFn: fetchWorkflowsOfWorkflowsFn,
        initialData: []
    });
    // Use generic data fetching hook for agents
    const agentsFetching = useDataFetching({
        fetchFn: fetchAgentsFn,
        initialData: []
    });
    // Use generic data fetching hook for repository agents
    const repositoryAgentsFetching = useDataFetching({
        fetchFn: fetchRepositoryAgentsFn,
        initialData: []
    });
    // Use generic data fetching hook for tools
    const toolsFetching = useDataFetching({
        fetchFn: fetchToolsFn,
        initialData: []
    });
    // Local state for setters (for backward compatibility)
    const [templates, setTemplates] = useState(nullishCoalesceToNull(templatesFetching.data));
    const [workflowsOfWorkflows, setWorkflowsOfWorkflows] = useState(logicalOrToEmptyArray(workflowsOfWorkflowsFetching.data));
    const [agents, setAgents] = useState(logicalOrToEmptyArray(agentsFetching.data));
    const [repositoryAgents, setRepositoryAgents] = useState(logicalOrToEmptyArray(repositoryAgentsFetching.data));
    const [tools, setTools] = useState(logicalOrToEmptyArray(toolsFetching.data));
    // Sync data fetching results to local state
    // DRY: Use generic useSyncState hook instead of 4 duplicate useEffect blocks
    // Matches original behavior: only sync when data exists (truthy check)
    // Use stable condition functions to prevent unnecessary re-runs
    const truthyCondition = useMemo(()=>(data)=>data !== null && data !== undefined, []);
    useSyncStateWithDefault(templatesFetching.data, setTemplates, null);
    useSyncState(workflowsOfWorkflowsFetching.data, setWorkflowsOfWorkflows, truthyCondition);
    useSyncState(agentsFetching.data, setAgents, truthyCondition);
    useSyncState(repositoryAgentsFetching.data, setRepositoryAgents, truthyCondition);
    useSyncState(toolsFetching.data, setTools, truthyCondition);
    // Determine loading state based on active tab
    // Use extracted validation functions - mutation-resistant
    const loading = calculateLoadingState(activeTab, repositorySubTab, templatesFetching.loading, repositoryAgentsFetching.loading, workflowsOfWorkflowsFetching.loading, agentsFetching.loading, toolsFetching.loading);
    // Auto-fetch based on active tab
    // Use extracted validation functions - mutation-resistant
    // Use refs to store stable refetch functions to prevent infinite loops
    const templatesRefetchRef = useRef(templatesFetching.refetch);
    const workflowsOfWorkflowsRefetchRef = useRef(workflowsOfWorkflowsFetching.refetch);
    const agentsRefetchRef = useRef(agentsFetching.refetch);
    const repositoryAgentsRefetchRef = useRef(repositoryAgentsFetching.refetch);
    const toolsRefetchRef = useRef(toolsFetching.refetch);
    // Update refs when refetch functions change (safe to do during render)
    templatesRefetchRef.current = templatesFetching.refetch;
    workflowsOfWorkflowsRefetchRef.current = workflowsOfWorkflowsFetching.refetch;
    agentsRefetchRef.current = agentsFetching.refetch;
    repositoryAgentsRefetchRef.current = repositoryAgentsFetching.refetch;
    toolsRefetchRef.current = toolsFetching.refetch;
    useEffect(()=>{
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
    }, [
        activeTab,
        repositorySubTab
    ]);
    // Wrapper functions to match original API
    // DRY: Could be eliminated or use generic wrapper, but kept for backward compatibility
    const fetchTemplates = useCallback(async ()=>{
        await templatesFetching.refetch();
    }, [
        templatesFetching.refetch
    ]);
    const fetchWorkflowsOfWorkflows = useCallback(async ()=>{
        await workflowsOfWorkflowsFetching.refetch();
    }, [
        workflowsOfWorkflowsFetching.refetch
    ]);
    const fetchAgents = useCallback(async ()=>{
        await agentsFetching.refetch();
    }, [
        agentsFetching.refetch
    ]);
    const fetchRepositoryAgents = useCallback(async ()=>{
        await repositoryAgentsFetching.refetch();
    }, [
        repositoryAgentsFetching.refetch
    ]);
    const fetchTools = useCallback(async ()=>{
        await toolsFetching.refetch();
    }, [
        toolsFetching.refetch
    ]);
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
        fetchTools
    };
}
