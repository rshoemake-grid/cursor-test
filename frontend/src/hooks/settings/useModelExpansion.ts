/**
 * Model Expansion Hook
 * Extracted from SettingsPage to improve SRP compliance
 * Single Responsibility: Only handles model expansion state
 */

import { useState, useCallback } from 'react'

export interface UseModelExpansionReturn {
  expandedModels: Record<string, Set<string>>
  expandedProviders: Record<string, boolean>
  toggleProviderModels: (providerId: string) => void
  toggleModel: (providerId: string, modelName: string) => void
  isModelExpanded: (providerId: string, modelName: string) => boolean
}

/**
 * Hook for managing model expansion state
 * DRY: Centralized expansion logic
 */
export function useModelExpansion(): UseModelExpansionReturn {
  const [expandedModels, setExpandedModels] = useState<Record<string, Set<string>>>({})
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({})

  const toggleProviderModels = useCallback((providerId: string) => {
    setExpandedProviders(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }))
  }, [])

  const toggleModel = useCallback((providerId: string, modelName: string) => {
    setExpandedModels(prev => {
      const providerModels = prev[providerId] || new Set()
      const newSet = new Set(providerModels)
      if (newSet.has(modelName)) {
        newSet.delete(modelName)
      } else {
        newSet.add(modelName)
      }
      return {
        ...prev,
        [providerId]: newSet
      }
    })
  }, [])

  const isModelExpanded = useCallback((providerId: string, modelName: string) => {
    const providerSet = expandedModels[providerId]
    if (!providerSet) {
      return false
    }
    return providerSet.has(modelName)
  }, [expandedModels])

  return {
    expandedModels,
    expandedProviders,
    toggleProviderModels,
    toggleModel,
    isModelExpanded,
  }
}
