/**
 * Provider Management Hook
 * Single Responsibility: Only manages LLM provider state and operations
 * DRY: Reusable provider management logic
 */

import { useState, useCallback } from 'react'
import type { LLMProvider } from './useLLMProviders'
import { SettingsService, type LLMSettings } from '../services/SettingsService'

interface UseProviderManagementOptions {
  service: SettingsService
  providers: LLMProvider[]
  setProviders: (providers: LLMProvider[]) => void
  iterationLimit: number
  defaultModel: string
  token?: string | null
}

export function useProviderManagement({
  service,
  providers,
  setProviders,
  iterationLimit,
  defaultModel,
  token,
}: UseProviderManagementOptions) {
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { status: 'success' | 'error'; message: string }>>({})

  const saveProviders = useCallback(async (newProviders: LLMProvider[]) => {
    const settings: LLMSettings = {
      providers: newProviders,
      iteration_limit: iterationLimit,
      default_model: defaultModel,
    }
    
    setProviders(newProviders)
    try {
      await service.saveSettings(settings, token)
    } catch (error) {
      // Error already logged in service
      throw error
    }
  }, [service, token, iterationLimit, defaultModel, setProviders])

  const updateProvider = useCallback((id: string, updates: Partial<LLMProvider>) => {
    saveProviders(providers.map(p => p.id === id ? { ...p, ...updates } : p))
  }, [providers, saveProviders])

  const testProvider = useCallback(async (provider: LLMProvider) => {
    setTestingProvider(provider.id)
    setTestResults(prev => ({ ...prev, [provider.id]: undefined as any }))

    try {
      const result = await service.testProvider(provider)
      setTestResults(prev => ({ ...prev, [provider.id]: result }))
    } finally {
      setTestingProvider(null)
    }
  }, [service])

  const addCustomModel = useCallback((providerId: string, modelName: string) => {
    const provider = providers.find(p => p.id === providerId)
    if (provider && modelName) {
      updateProvider(providerId, {
        models: [...(provider.models || []), modelName]
      })
    }
  }, [providers, updateProvider])

  return {
    saveProviders,
    updateProvider,
    testProvider,
    addCustomModel,
    testingProvider,
    testResults,
  }
}
