/**
 * Official Items Hook
 * Extracted from MarketplacePage to improve DRY compliance
 * Single Responsibility: Only checks if selected items are official
 */

import { useMemo } from 'react'

export interface UseOfficialItemsOptions {
  templates?: Array<{ id: string; is_official?: boolean }> | null
  agents: Array<{ id: string; is_official?: boolean }>
  templateSelection: {
    selectedIds: Set<string>
  }
  agentSelection: {
    selectedIds: Set<string>
  }
}

export interface UseOfficialItemsReturn {
  hasOfficialWorkflows: boolean
  hasOfficialAgents: boolean
}

/**
 * Hook for checking if selected items are official
 * DRY: Centralized official item checking logic
 */
export function useOfficialItems(options: UseOfficialItemsOptions): UseOfficialItemsReturn {
  const { templates, agents, templateSelection, agentSelection } = options

  const hasOfficialWorkflows = useMemo(() => {
    return (
      templates
        ?.filter(t => templateSelection.selectedIds.has(t.id))
        .some(t => t.is_official) ?? false
    )
  }, [templates, templateSelection.selectedIds])

  const hasOfficialAgents = useMemo(() => {
    return agents
      .filter(a => agentSelection.selectedIds.has(a.id))
      .some(a => a.is_official)
  }, [agents, agentSelection.selectedIds])

  return {
    hasOfficialWorkflows,
    hasOfficialAgents,
  }
}
