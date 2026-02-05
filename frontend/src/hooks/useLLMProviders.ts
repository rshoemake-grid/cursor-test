/**
 * LLM Providers Hook
 * Centralized logic for loading LLM providers and models from API or storage
 */

import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { logger } from '../utils/logger'
import type { StorageAdapter } from '../types/adapters'
import {
  isValidProvidersArray,
  canExtractModelsFromProvider,
  isValidData,
  hasProviders,
} from './utils/providerValidation'

export interface LLMProvider {
  id: string
  name: string
  type: string
  enabled: boolean
  apiKey?: string
  baseUrl?: string
  models?: string[]
  defaultModel?: string
}

export interface LLMModel {
  value: string
  label: string
  provider: string
}

interface LLMSettings {
  providers: LLMProvider[]
  iteration_limit?: number
  default_model?: string
}

const DEFAULT_MODELS: LLMModel[] = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)', provider: 'OpenAI' },
  { value: 'gpt-4o', label: 'GPT-4o (OpenAI)', provider: 'OpenAI' },
  { value: 'gpt-4', label: 'GPT-4 (OpenAI)', provider: 'OpenAI' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (OpenAI)', provider: 'OpenAI' }
]

/**
 * Extract models from providers array
 * Uses extracted validation functions for better testability
 */
function extractModelsFromProviders(providers: LLMProvider[]): LLMModel[] {
  const models: LLMModel[] = []
  // Defensive: check providers is valid array before iterating
  if (!isValidProvidersArray(providers)) {
    return models
  }
  providers.forEach((provider) => {
    // Use extracted validation function - mutation-resistant
    if (canExtractModelsFromProvider(provider)) {
      provider!.models!.forEach((model) => {
        models.push({
          value: model,
          label: `${model} (${provider!.name})`,
          provider: provider!.name
        })
      })
    }
  })
  return models
}

/**
 * Load LLM settings from storage
 */
function loadFromStorage(storage: StorageAdapter | null): LLMSettings | null {
  if (!storage) {
    return null
  }

  try {
    const saved = storage.getItem('llm_settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        providers: parsed.providers || [],
        iteration_limit: parsed.iteration_limit,
        default_model: parsed.default_model
      }
    }
  } catch (e) {
    logger.error('Failed to parse LLM settings from storage:', e)
  }

  return null
}

interface UseLLMProvidersOptions {
  storage?: StorageAdapter | null
  isAuthenticated?: boolean
  onLoadComplete?: (settings: LLMSettings) => void
}

/**
 * Hook for loading LLM providers and models
 * 
 * @param options Configuration options
 * @returns Available models, providers, and loading state
 */
export function useLLMProviders({
  storage = null,
  isAuthenticated = false,
  onLoadComplete
}: UseLLMProvidersOptions = {}) {
  const [availableModels, setAvailableModels] = useState<LLMModel[]>([])
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [iterationLimit, setIterationLimit] = useState<number | undefined>(undefined)
  const [defaultModel, setDefaultModel] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProviders = async () => {
      setIsLoading(true)

      try {
        // Try to load from backend first using authenticated API client
        const data = await api.getLLMSettings()
        
        // Use extracted validation functions - mutation-resistant
        if (isValidData(data) && 
            isValidData(data.providers) && 
            isValidProvidersArray(data.providers) &&
            hasProviders(data.providers)) {
          const models = extractModelsFromProviders(data.providers)
          
          // Only use API data if we have valid models, otherwise fall through to storage/defaults
          if (models.length > 0) {
            setAvailableModels(models)
            setProviders(data.providers)
            
            if (typeof data.iteration_limit === 'number') {
              setIterationLimit(data.iteration_limit)
            }
            if (data.default_model) {
              setDefaultModel(data.default_model)
            }

            // Save to storage for offline access
            if (storage) {
              try {
                storage.setItem('llm_settings', JSON.stringify({
                  providers: data.providers || [],
                  iteration_limit: data.iteration_limit,
                  default_model: data.default_model || ''
                }))
              } catch (e) {
                logger.error('Failed to save LLM settings to storage:', e)
              }
            }

            if (onLoadComplete) {
              onLoadComplete({
                providers: data.providers,
                iteration_limit: data.iteration_limit,
                default_model: data.default_model
              })
            }

            setIsLoading(false)
            return
          }
          // If providers exist but no models extracted, fall through to storage/defaults
        }
      } catch (e) {
        logger.debug('Could not load from backend, trying storage', e)
      }

      // Fallback to storage
      const storedSettings = loadFromStorage(storage)
      // Use extracted validation functions - mutation-resistant
      if (isValidData(storedSettings) && 
          isValidData(storedSettings.providers) && 
          isValidProvidersArray(storedSettings.providers) &&
          hasProviders(storedSettings.providers)) {
        const models = extractModelsFromProviders(storedSettings.providers)
        if (models.length > 0) {
          setAvailableModels(models)
          setProviders(storedSettings.providers)
          
          if (typeof storedSettings.iteration_limit === 'number') {
            setIterationLimit(storedSettings.iteration_limit)
          }
          if (storedSettings.default_model) {
            setDefaultModel(storedSettings.default_model)
          }

          if (onLoadComplete) {
            onLoadComplete(storedSettings)
          }

          setIsLoading(false)
          return
        }
      }

      // Fallback to default GPT models if no providers found
      setAvailableModels(DEFAULT_MODELS)
      setProviders([])
      setIsLoading(false)
    }

    loadProviders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]) // storage and onLoadComplete accessed via closure

  return {
    availableModels,
    providers,
    iterationLimit,
    defaultModel,
    isLoading
  }
}
