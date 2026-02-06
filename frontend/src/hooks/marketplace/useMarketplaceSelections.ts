/**
 * Marketplace Selections Management Hook
 * Extracted from MarketplacePage to improve SRP compliance and DRY compliance
 * Single Responsibility: Only manages all selection states together
 * DRY: Consolidates three separate selection managers
 */

import { useSelectionManager } from '../nodes'

export interface UseMarketplaceSelectionsReturn {
  templateSelection: ReturnType<typeof useSelectionManager<string>>
  agentSelection: ReturnType<typeof useSelectionManager<string>>
  repositoryAgentSelection: ReturnType<typeof useSelectionManager<string>>
  clearAllSelections: () => void
  clearSelectionsForTab: (activeTab: string, repositorySubTab?: string) => void
}

/**
 * Hook for managing all marketplace selections
 * DRY: Single hook managing all three selections
 */
export function useMarketplaceSelections(): UseMarketplaceSelectionsReturn {
  const templateSelection = useSelectionManager<string>()
  const agentSelection = useSelectionManager<string>()
  const repositoryAgentSelection = useSelectionManager<string>()

  /**
   * Clear all selections
   * DRY: Single method to clear all
   */
  const clearAllSelections = () => {
    templateSelection.clear()
    agentSelection.clear()
    repositoryAgentSelection.clear()
  }

  /**
   * Clear selections based on active tab
   * DRY: Centralized clearing logic
   */
  const clearSelectionsForTab = (activeTab: string, repositorySubTab?: string) => {
    if (activeTab === 'agents') {
      agentSelection.clear()
    } else if (activeTab === 'repository' || activeTab === 'workflows-of-workflows') {
      if (activeTab === 'repository' && repositorySubTab === 'agents') {
        repositoryAgentSelection.clear()
      } else {
        templateSelection.clear()
      }
    }
  }

  return {
    templateSelection,
    agentSelection,
    repositoryAgentSelection,
    clearAllSelections,
    clearSelectionsForTab,
  }
}
