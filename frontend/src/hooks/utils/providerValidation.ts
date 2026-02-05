/**
 * Provider Validation Utilities
 * Extracted from useLLMProviders for better testability and mutation resistance
 * Single Responsibility: Only validates provider data
 */

import type { LLMProvider } from '../useLLMProviders'

/**
 * Check if provider is valid (not null/undefined)
 * Mutation-resistant: explicit null check
 */
export function isProviderValid(provider: LLMProvider | null | undefined): boolean {
  return provider != null
}

/**
 * Check if provider is enabled
 * Mutation-resistant: explicit equality check
 */
export function isProviderEnabled(provider: LLMProvider | null | undefined): boolean {
  if (!isProviderValid(provider)) {
    return false
  }
  return provider!.enabled === true
}

/**
 * Check if provider has models
 * Mutation-resistant: explicit null check and array validation
 */
export function hasProviderModels(provider: LLMProvider | null | undefined): boolean {
  if (!isProviderValid(provider)) {
    return false
  }
  const models = provider!.models
  return models != null && Array.isArray(models) && models.length > 0
}

/**
 * Check if provider can be used for model extraction
 * Combines all validation checks
 * Mutation-resistant: each condition tested independently
 */
export function canExtractModelsFromProvider(provider: LLMProvider | null | undefined): boolean {
  return (
    isProviderValid(provider) &&
    isProviderEnabled(provider) &&
    hasProviderModels(provider)
  )
}

/**
 * Check if providers array is valid
 * Mutation-resistant: explicit array check
 */
export function isValidProvidersArray(providers: any): providers is LLMProvider[] {
  return Array.isArray(providers)
}

/**
 * Check if data object is valid (not null/undefined)
 * Mutation-resistant: explicit null check
 */
export function isValidData<T>(data: T | null | undefined): data is T {
  return data != null
}

/**
 * Check if providers array has items
 * Mutation-resistant: explicit length check
 */
export function hasProviders(providers: LLMProvider[] | null | undefined): boolean {
  if (!isValidProvidersArray(providers)) {
    return false
  }
  return providers.length > 0
}
