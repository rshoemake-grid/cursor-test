/**
 * Official Items Hook
 * Extracted from MarketplacePage to improve DRY compliance
 * Single Responsibility: Only checks if selected items are official
 */ import { useMemo } from 'react';
/**
 * Hook for checking if selected items are official
 * DRY: Centralized official item checking logic
 */ export function useOfficialItems(options) {
    const { templates, agents, templateSelection, agentSelection } = options;
    const hasOfficialWorkflows = useMemo(()=>{
        return templates?.filter((t)=>templateSelection.selectedIds.has(t.id)).some((t)=>t.is_official) ?? false;
    }, [
        templates,
        templateSelection.selectedIds
    ]);
    const hasOfficialAgents = useMemo(()=>{
        return agents.filter((a)=>agentSelection.selectedIds.has(a.id)).some((a)=>a.is_official);
    }, [
        agents,
        agentSelection.selectedIds
    ]);
    return {
        hasOfficialWorkflows,
        hasOfficialAgents
    };
}
