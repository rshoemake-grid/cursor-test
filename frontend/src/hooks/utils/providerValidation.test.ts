/**
 * Tests for provider validation utilities
 * These tests ensure mutation-resistant validation functions work correctly
 */

import {
  isProviderValid,
  isProviderEnabled,
  hasProviderModels,
  canExtractModelsFromProvider,
  isValidProvidersArray,
  isValidData,
  hasProviders,
} from './providerValidation'
import type { LLMProvider } from '../useLLMProviders'

describe('providerValidation', () => {
  describe('isProviderValid', () => {
    it('should return true for valid provider', () => {
      const provider: LLMProvider = {
        id: '1',
        name: 'OpenAI',
        type: 'openai',
        enabled: true,
      }
      expect(isProviderValid(provider)).toBe(true)
    })

    it('should return false for null', () => {
      expect(isProviderValid(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isProviderValid(undefined)).toBe(false)
    })
  })

  describe('isProviderEnabled', () => {
    it('should return true when enabled is true', () => {
      const provider: LLMProvider = {
        id: '1',
        name: 'OpenAI',
        type: 'openai',
        enabled: true,
      }
      expect(isProviderEnabled(provider)).toBe(true)
    })

    it('should return false when enabled is false', () => {
      const provider: LLMProvider = {
        id: '1',
        name: 'OpenAI',
        type: 'openai',
        enabled: false,
      }
      expect(isProviderEnabled(provider)).toBe(false)
    })

    it('should return false for null provider', () => {
      expect(isProviderEnabled(null)).toBe(false)
    })

    it('should return false for undefined provider', () => {
      expect(isProviderEnabled(undefined)).toBe(false)
    })
  })

  describe('hasProviderModels', () => {
    it('should return true when models array has items', () => {
      const provider: LLMProvider = {
        id: '1',
        name: 'OpenAI',
        type: 'openai',
        enabled: true,
        models: ['gpt-4'],
      }
      expect(hasProviderModels(provider)).toBe(true)
    })

    it('should return false when models is null', () => {
      const provider: LLMProvider = {
        id: '1',
        name: 'OpenAI',
        type: 'openai',
        enabled: true,
        models: null as any,
      }
      expect(hasProviderModels(provider)).toBe(false)
    })

    it('should return false when models is undefined', () => {
      const provider: LLMProvider = {
        id: '1',
        name: 'OpenAI',
        type: 'openai',
        enabled: true,
      }
      expect(hasProviderModels(provider)).toBe(false)
    })

    it('should return false when models is empty array', () => {
      const provider: LLMProvider = {
        id: '1',
        name: 'OpenAI',
        type: 'openai',
        enabled: true,
        models: [],
      }
      expect(hasProviderModels(provider)).toBe(false)
    })

    it('should return false when models is not an array', () => {
      const provider: LLMProvider = {
        id: '1',
        name: 'OpenAI',
        type: 'openai',
        enabled: true,
        models: 'gpt-4' as any,
      }
      expect(hasProviderModels(provider)).toBe(false)
    })

    it('should return false for null provider', () => {
      expect(hasProviderModels(null)).toBe(false)
    })
  })

  describe('canExtractModelsFromProvider', () => {
    it('should return true when all conditions are met', () => {
      const provider: LLMProvider = {
        id: '1',
        name: 'OpenAI',
        type: 'openai',
        enabled: true,
        models: ['gpt-4'],
      }
      expect(canExtractModelsFromProvider(provider)).toBe(true)
    })

    it('should return false when provider is null', () => {
      expect(canExtractModelsFromProvider(null)).toBe(false)
    })

    it('should return false when enabled is false', () => {
      const provider: LLMProvider = {
        id: '1',
        name: 'OpenAI',
        type: 'openai',
        enabled: false,
        models: ['gpt-4'],
      }
      expect(canExtractModelsFromProvider(provider)).toBe(false)
    })

    it('should return false when models is null', () => {
      const provider: LLMProvider = {
        id: '1',
        name: 'OpenAI',
        type: 'openai',
        enabled: true,
        models: null as any,
      }
      expect(canExtractModelsFromProvider(provider)).toBe(false)
    })

    it('should return false when models is empty', () => {
      const provider: LLMProvider = {
        id: '1',
        name: 'OpenAI',
        type: 'openai',
        enabled: true,
        models: [],
      }
      expect(canExtractModelsFromProvider(provider)).toBe(false)
    })
  })

  describe('isValidProvidersArray', () => {
    it('should return true for array', () => {
      expect(isValidProvidersArray([])).toBe(true)
      expect(isValidProvidersArray([{ id: '1', name: 'Test', type: 'test', enabled: true }])).toBe(true)
    })

    it('should return false for null', () => {
      expect(isValidProvidersArray(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isValidProvidersArray(undefined)).toBe(false)
    })

    it('should return false for string', () => {
      expect(isValidProvidersArray('not array' as any)).toBe(false)
    })

    it('should return false for object', () => {
      expect(isValidProvidersArray({} as any)).toBe(false)
    })
  })

  describe('isValidData', () => {
    it('should return true for valid data', () => {
      expect(isValidData({})).toBe(true)
      expect(isValidData([])).toBe(true)
      expect(isValidData('string')).toBe(true)
      expect(isValidData(0)).toBe(true)
      expect(isValidData(false)).toBe(true)
    })

    it('should return false for null', () => {
      expect(isValidData(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isValidData(undefined)).toBe(false)
    })
  })

  describe('hasProviders', () => {
    it('should return true when array has items', () => {
      const providers: LLMProvider[] = [{
        id: '1',
        name: 'OpenAI',
        type: 'openai',
        enabled: true,
      }]
      expect(hasProviders(providers)).toBe(true)
    })

    it('should return false when array is empty', () => {
      expect(hasProviders([])).toBe(false)
    })

    it('should return false when null', () => {
      expect(hasProviders(null)).toBe(false)
    })

    it('should return false when undefined', () => {
      expect(hasProviders(undefined)).toBe(false)
    })

    it('should return false when not an array', () => {
      expect(hasProviders('not array' as any)).toBe(false)
    })
  })
})
