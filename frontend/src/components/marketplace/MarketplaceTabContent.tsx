/**
 * Marketplace Tab Content Component
 * Extracted from MarketplacePage to improve DRY compliance and SRP
 * Single Responsibility: Only handles content rendering based on tab state
 */

import { TemplateGrid } from '../TemplateGrid'
import type { Template } from '../../hooks/marketplace'

export interface MarketplaceTabContentProps {
  loading: boolean
  activeTab: string
  isAgentsTab: boolean
  isRepositoryWorkflowsSubTab: boolean
  isRepositoryAgentsSubTab: boolean
  agents: any[]
  templates: Template[] | null
  repositoryAgents: any[]
  workflowsOfWorkflows: Template[]
  agentSelection: {
    selectedIds: Set<string>
    toggle: (id: string) => void
  }
  templateSelection: {
    selectedIds: Set<string>
    toggle: (id: string) => void
  }
  repositoryAgentSelection: {
    selectedIds: Set<string>
    toggle: (id: string) => void
  }
  handleAgentCardClick: (e: React.MouseEvent) => void
  handleCardClick: (e: React.MouseEvent) => void
  handleRepositoryAgentCardClick: (e: React.MouseEvent) => void
  getDifficultyColor: (difficulty: string) => string
}

/**
 * Marketplace Tab Content Component
 * DRY: Centralized content rendering logic
 */
export function MarketplaceTabContent({
  loading,
  activeTab,
  isAgentsTab,
  isRepositoryWorkflowsSubTab,
  isRepositoryAgentsSubTab,
  agents,
  templates,
  repositoryAgents,
  workflowsOfWorkflows,
  agentSelection,
  templateSelection,
  repositoryAgentSelection,
  handleAgentCardClick,
  handleCardClick,
  handleRepositoryAgentCardClick,
  getDifficultyColor,
}: MarketplaceTabContentProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Loading {activeTab}...</p>
      </div>
    )
  }

  if (isAgentsTab) {
    return (
      <TemplateGrid
        items={agents}
        selectedIds={agentSelection.selectedIds}
        type="agent"
        onToggleSelect={agentSelection.toggle}
        onCardClick={handleAgentCardClick}
        getDifficultyColor={getDifficultyColor}
        emptyMessage="No agents found. Try adjusting your filters."
        footerText={'Selected - Click "Use Agent(s)" above to use'}
      />
    )
  }

  if (isRepositoryWorkflowsSubTab) {
    return (
      <TemplateGrid
        items={templates ?? []}
        selectedIds={templateSelection.selectedIds}
        type="template"
        onToggleSelect={templateSelection.toggle}
        onCardClick={handleCardClick}
        getDifficultyColor={getDifficultyColor}
        emptyMessage="No workflows found. Try adjusting your filters."
        footerText={'Selected - Click "Load Workflow(s)" above to use'}
      />
    )
  }

  if (isRepositoryAgentsSubTab) {
    return (
      <TemplateGrid
        items={repositoryAgents}
        selectedIds={repositoryAgentSelection.selectedIds}
        type="agent"
        onToggleSelect={repositoryAgentSelection.toggle}
        onCardClick={handleRepositoryAgentCardClick}
        getDifficultyColor={getDifficultyColor}
        emptyMessage="No repository agents found. Try adjusting your filters."
        footerText={'Selected - Click "Use Agent(s)" above to use'}
      />
    )
  }

  // Workflows of Workflows tab
  return (
    <TemplateGrid
      items={workflowsOfWorkflows}
      selectedIds={templateSelection.selectedIds}
      type="template"
      onToggleSelect={templateSelection.toggle}
      onCardClick={handleCardClick}
      getDifficultyColor={getDifficultyColor}
      emptyMessage="No workflows found. Try adjusting your filters."
      footerText={'Selected - Click "Load Workflow(s)" above to use'}
    />
  )
}
