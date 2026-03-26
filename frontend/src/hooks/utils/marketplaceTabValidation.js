/**
 * Marketplace Tab Validation Utilities
 * Extracted from useMarketplaceData for better testability and mutation resistance
 * Single Responsibility: Only validates tab and loading state logic
 */ /**
 * Check if active tab is repository
 * Mutation-resistant: explicit equality check
 */ export function isRepositoryTab(activeTab) {
    return activeTab === 'repository';
}
/**
 * Check if active tab is workflows-of-workflows
 * Mutation-resistant: explicit equality check
 */ export function isWorkflowsOfWorkflowsTab(activeTab) {
    return activeTab === 'workflows-of-workflows';
}
/**
 * Check if active tab is agents
 * Mutation-resistant: explicit equality check
 */ export function isAgentsTab(activeTab) {
    return activeTab === 'agents';
}
/**
 * Check if repository sub-tab is workflows
 * Mutation-resistant: explicit equality check
 */ export function isWorkflowsSubTab(repositorySubTab) {
    return repositorySubTab === 'workflows';
}
/**
 * Check if repository sub-tab is agents
 * Mutation-resistant: explicit equality check
 */ export function isAgentsSubTab(repositorySubTab) {
    return repositorySubTab === 'agents';
}
/**
 * Determine if templates should be loaded based on tab state
 */ export function shouldLoadTemplates(activeTab, repositorySubTab) {
    return isRepositoryTab(activeTab) && isWorkflowsSubTab(repositorySubTab);
}
/**
 * Determine if repository agents should be loaded based on tab state
 * Defensive: Falls back to repository agents if repository tab but invalid sub-tab
 * (SOLID: Defensive Programming, DRY: Single validation point)
 */ export function shouldLoadRepositoryAgents(activeTab, repositorySubTab) {
    if (!isRepositoryTab(activeTab)) {
        return false;
    }
    // If it's the agents sub-tab, load repository agents
    if (isAgentsSubTab(repositorySubTab)) {
        return true;
    }
    // Defensive: If repository tab but NOT workflows sub-tab (invalid value), fallback to agents
    // This handles edge cases like 'workflow' (singular) or other invalid values
    return !isWorkflowsSubTab(repositorySubTab);
}
/**
 * Determine if workflows-of-workflows should be loaded based on tab state
 */ export function shouldLoadWorkflowsOfWorkflows(activeTab) {
    return isWorkflowsOfWorkflowsTab(activeTab);
}
/**
 * Determine if agents should be loaded based on tab state
 * Defensive: Falls back to agents if no valid tab matches (SOLID: Defensive Programming)
 */ export function shouldLoadAgents(activeTab) {
    return isAgentsTab(activeTab);
}
/**
 * Determine if tools should be loaded based on tab state
 */ export function shouldLoadTools(activeTab) {
    return activeTab === 'tools';
}
/**
 * Calculate loading state based on active tab and sub-tab
 * Mutation-resistant: explicit function calls instead of inline conditionals
 */ export function calculateLoadingState(activeTab, repositorySubTab, templatesLoading, repositoryAgentsLoading, workflowsOfWorkflowsLoading, agentsLoading, toolsLoading) {
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
