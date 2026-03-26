/**
 * Marketplace Tabs Management Hook
 * Extracted from MarketplacePage to improve SRP compliance and testability
 * Single Responsibility: Only manages tab state and switching logic
 */ import { useState } from 'react';
/**
 * Marketplace tab constants
 * DRY: Single source of truth for tab values
 */ export const MARKETPLACE_TABS = {
    AGENTS: 'agents',
    REPOSITORY: 'repository',
    WORKFLOWS_OF_WORKFLOWS: 'workflows-of-workflows',
    TOOLS: 'tools'
};
export const REPOSITORY_SUB_TABS = {
    WORKFLOWS: 'workflows',
    AGENTS: 'agents'
};
/**
 * Hook for managing marketplace tabs
 * DRY: Centralized tab management logic
 */ export function useMarketplaceTabs() {
    const [activeTab, setActiveTab] = useState(MARKETPLACE_TABS.AGENTS);
    const [repositorySubTab, setRepositorySubTab] = useState(REPOSITORY_SUB_TABS.WORKFLOWS);
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
