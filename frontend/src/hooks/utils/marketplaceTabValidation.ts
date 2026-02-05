/**
 * Marketplace Tab Validation Utilities
 * Extracted from useMarketplaceData for better testability and mutation resistance
 * Single Responsibility: Only validates tab and loading state logic
 */

export type ActiveTab = 'agents' | 'repository' | 'workflows-of-workflows'
export type RepositorySubTab = 'workflows' | 'agents'

/**
 * Check if active tab is repository
 * Mutation-resistant: explicit equality check
 */
export function isRepositoryTab(activeTab: ActiveTab): boolean {
  return activeTab === 'repository'
}

/**
 * Check if active tab is workflows-of-workflows
 * Mutation-resistant: explicit equality check
 */
export function isWorkflowsOfWorkflowsTab(activeTab: ActiveTab): boolean {
  return activeTab === 'workflows-of-workflows'
}

/**
 * Check if active tab is agents
 * Mutation-resistant: explicit equality check
 */
export function isAgentsTab(activeTab: ActiveTab): boolean {
  return activeTab === 'agents'
}

/**
 * Check if repository sub-tab is workflows
 * Mutation-resistant: explicit equality check
 */
export function isWorkflowsSubTab(repositorySubTab: RepositorySubTab): boolean {
  return repositorySubTab === 'workflows'
}

/**
 * Check if repository sub-tab is agents
 * Mutation-resistant: explicit equality check
 */
export function isAgentsSubTab(repositorySubTab: RepositorySubTab): boolean {
  return repositorySubTab === 'agents'
}

/**
 * Determine if templates should be loaded based on tab state
 */
export function shouldLoadTemplates(
  activeTab: ActiveTab,
  repositorySubTab: RepositorySubTab
): boolean {
  return isRepositoryTab(activeTab) && isWorkflowsSubTab(repositorySubTab)
}

/**
 * Determine if repository agents should be loaded based on tab state
 * Defensive: Falls back to repository agents if repository tab but invalid sub-tab
 * (SOLID: Defensive Programming, DRY: Single validation point)
 */
export function shouldLoadRepositoryAgents(
  activeTab: ActiveTab,
  repositorySubTab: RepositorySubTab
): boolean {
  if (!isRepositoryTab(activeTab)) {
    return false
  }
  // If it's the agents sub-tab, load repository agents
  if (isAgentsSubTab(repositorySubTab)) {
    return true
  }
  // Defensive: If repository tab but NOT workflows sub-tab (invalid value), fallback to agents
  // This handles edge cases like 'workflow' (singular) or other invalid values
  return !isWorkflowsSubTab(repositorySubTab)
}

/**
 * Determine if workflows-of-workflows should be loaded based on tab state
 */
export function shouldLoadWorkflowsOfWorkflows(activeTab: ActiveTab): boolean {
  return isWorkflowsOfWorkflowsTab(activeTab)
}

/**
 * Determine if agents should be loaded based on tab state
 * Defensive: Falls back to agents if no valid tab matches (SOLID: Defensive Programming)
 */
export function shouldLoadAgents(activeTab: ActiveTab): boolean {
  // Exact match for agents tab
  if (isAgentsTab(activeTab)) {
    return true
  }
  // Defensive fallback: If activeTab doesn't match any valid tab, load agents as default
  // This handles edge cases like 'Repository' (capital R) or other invalid values
  return !isRepositoryTab(activeTab) && !isWorkflowsOfWorkflowsTab(activeTab)
}

/**
 * Calculate loading state based on active tab and sub-tab
 * Mutation-resistant: explicit function calls instead of inline conditionals
 */
export function calculateLoadingState(
  activeTab: ActiveTab,
  repositorySubTab: RepositorySubTab,
  templatesLoading: boolean,
  repositoryAgentsLoading: boolean,
  workflowsOfWorkflowsLoading: boolean,
  agentsLoading: boolean
): boolean {
  if (shouldLoadTemplates(activeTab, repositorySubTab)) {
    return templatesLoading
  }
  if (shouldLoadRepositoryAgents(activeTab, repositorySubTab)) {
    return repositoryAgentsLoading
  }
  if (shouldLoadWorkflowsOfWorkflows(activeTab)) {
    return workflowsOfWorkflowsLoading
  }
  if (shouldLoadAgents(activeTab)) {
    return agentsLoading
  }
  return false
}
