/**
 * Marketplace Selections Management Hook
 * Extracted from MarketplacePage to improve SRP compliance and DRY compliance
 * Single Responsibility: Only manages all selection states together
 * DRY: Consolidates three separate selection managers
 */ import { useSelectionManager } from '../nodes';
/**
 * Hook for managing all marketplace selections
 * DRY: Single hook managing all three selections
 */ export function useMarketplaceSelections() {
    const templateSelection = useSelectionManager();
    const agentSelection = useSelectionManager();
    const repositoryAgentSelection = useSelectionManager();
    const toolSelection = useSelectionManager();
    /**
   * Clear all selections
   * DRY: Single method to clear all
   */ const clearAllSelections = ()=>{
        templateSelection.clear();
        agentSelection.clear();
        repositoryAgentSelection.clear();
        toolSelection.clear();
    };
    /**
   * Clear selections based on active tab
   * DRY: Centralized clearing logic
   */ const clearSelectionsForTab = (activeTab, repositorySubTab)=>{
        if (activeTab === 'agents') {
            agentSelection.clear();
        } else if (activeTab === 'tools') {
            toolSelection.clear();
        } else if (activeTab === 'repository' || activeTab === 'workflows-of-workflows') {
            if (activeTab === 'repository' && repositorySubTab === 'agents') {
                repositoryAgentSelection.clear();
            } else {
                templateSelection.clear();
            }
        }
    };
    return {
        templateSelection,
        agentSelection,
        repositoryAgentSelection,
        toolSelection,
        clearAllSelections,
        clearSelectionsForTab
    };
}
