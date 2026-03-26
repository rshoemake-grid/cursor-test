/**
 * Template Operations Hook
 * Composes template-related operations from focused hooks
 * 
 * This hook follows the composition pattern, combining:
 * - useTemplateUsage - Template usage/navigation
 * - useAgentDeletion - Agent deletion logic
 * - useWorkflowDeletion - Workflow deletion logic
 * - useRepositoryAgentDeletion - Repository agent deletion
 */ import { useTemplateUsage } from './useTemplateUsage';
import { useAgentDeletion, useRepositoryAgentDeletion } from './useAgentDeletion';
import { useWorkflowDeletion } from '../workflow';
/**
 * Hook for managing template operations
 * Composes focused hooks for template-related operations
 * 
 * @param options Configuration options
 * @returns Template operation handlers
 */ export function useTemplateOperations({ token, user, httpClient, apiBaseUrl, storage, agents, templates, workflowsOfWorkflows, activeTab, setAgents, setTemplates, setWorkflowsOfWorkflows, setRepositoryAgents, setSelectedAgentIds, setSelectedTemplateIds, setSelectedRepositoryAgentIds }) {
    // Compose focused hooks
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
