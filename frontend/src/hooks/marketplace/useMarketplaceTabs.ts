/**
 * Marketplace Tabs Management Hook
 * Extracted from MarketplacePage to improve SRP compliance and testability
 * Single Responsibility: Only manages tab state and switching logic
 */

import { useState } from 'react'
// useCallback intentionally not imported - not needed for this implementation

export type TabType = 'agents' | 'repository' | 'workflows-of-workflows'
export type RepositorySubTabType = 'workflows' | 'agents'

/**
 * Marketplace tab constants
 * DRY: Single source of truth for tab values
 */
export const MARKETPLACE_TABS = {
  AGENTS: 'agents' as const,
  REPOSITORY: 'repository' as const,
  WORKFLOWS_OF_WORKFLOWS: 'workflows-of-workflows' as const,
} as const

export const REPOSITORY_SUB_TABS = {
  WORKFLOWS: 'workflows' as const,
  AGENTS: 'agents' as const,
} as const

export interface UseMarketplaceTabsReturn {
  activeTab: TabType
  repositorySubTab: RepositorySubTabType
  setActiveTab: (tab: TabType) => void
  setRepositorySubTab: (subTab: RepositorySubTabType) => void
  isAgentsTab: boolean
  isRepositoryTab: boolean
  isWorkflowsOfWorkflowsTab: boolean
  isRepositoryWorkflowsSubTab: boolean
  isRepositoryAgentsSubTab: boolean
}

/**
 * Hook for managing marketplace tabs
 * DRY: Centralized tab management logic
 */
export function useMarketplaceTabs(): UseMarketplaceTabsReturn {
  const [activeTab, setActiveTab] = useState<TabType>(MARKETPLACE_TABS.AGENTS)
  const [repositorySubTab, setRepositorySubTab] = useState<RepositorySubTabType>(
    REPOSITORY_SUB_TABS.WORKFLOWS
  )

  const isAgentsTab = activeTab === MARKETPLACE_TABS.AGENTS
  const isRepositoryTab = activeTab === MARKETPLACE_TABS.REPOSITORY
  const isWorkflowsOfWorkflowsTab = activeTab === MARKETPLACE_TABS.WORKFLOWS_OF_WORKFLOWS
  const isRepositoryWorkflowsSubTab = isRepositoryTab && repositorySubTab === REPOSITORY_SUB_TABS.WORKFLOWS
  const isRepositoryAgentsSubTab = isRepositoryTab && repositorySubTab === REPOSITORY_SUB_TABS.AGENTS

  return {
    activeTab,
    repositorySubTab,
    setActiveTab,
    setRepositorySubTab,
    isAgentsTab,
    isRepositoryTab,
    isWorkflowsOfWorkflowsTab,
    isRepositoryWorkflowsSubTab,
    isRepositoryAgentsSubTab,
  }
}
