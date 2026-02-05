/**
 * Enhanced mutation tests for useLLMProviders
 * Focuses on killing remaining 14 surviving mutants through:
 * 1. Testing each condition in complex conditionals independently
 * 2. Testing edge cases for extractModelsFromProviders
 * 3. Testing all branches of conditional logic
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useLLMProviders, type LLMProvider } from './useLLMProviders'
import { api } from '../api/client'
import { logger } from '../utils/logger'

jest.mock('../api/client', () => ({
  api: {
    getLLMSettings: jest.fn(),
  },
}))

jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

const mockApi = api as jest.Mocked<typeof api>
const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>

const waitForWithTimeout = (callback: () => void | Promise<void>, timeout = 2000) => {
  return waitFor(callback, { timeout })
}

describe('useLLMProviders - Enhanced Mutation Killers', () => {
  let mockStorage: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
  })

  describe('extractModelsFromProviders - Independent Condition Testing', () => {
    /**
     * The extractModelsFromProviders function has a complex conditional:
     * if (provider != null &&
     *     provider.enabled === true && 
     *     provider.models != null && 
     *     Array.isArray(provider.models) &&
     *     provider.models.length > 0)
     * 
     * We need to test each condition independently to kill mutations
     */

    describe('provider != null condition', () => {
      it('should handle null provider in array', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [null as any, {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should skip null provider and extract from valid provider
        expect(result.current.availableModels.length).toBeGreaterThan(0)
        expect(result.current.availableModels[0].value).toBe('gpt-4')
      })

      it('should handle undefined provider in array', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [undefined as any, {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should skip undefined provider and extract from valid provider
        expect(result.current.availableModels.length).toBeGreaterThan(0)
      })
    })

    describe('provider.enabled === true condition', () => {
      it('should verify exact equality check - enabled is true', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true, // Exact true
            models: ['gpt-4'],
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should extract models (enabled === true)
        expect(result.current.availableModels.length).toBeGreaterThan(0)
      })

      it('should verify exact equality check - enabled is false', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: false, // Not true
            models: ['gpt-4'],
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not extract models (enabled !== true)
        // Falls back to defaults
        expect(result.current.providers).toEqual([])
        expect(result.current.availableModels.length).toBe(4) // Default models
      })

      it('should verify exact equality check - enabled is undefined', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            // enabled missing (undefined)
            models: ['gpt-4'],
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not extract models (enabled !== true, undefined !== true)
        expect(result.current.providers).toEqual([])
        expect(result.current.availableModels.length).toBe(4) // Default models
      })
    })

    describe('provider.models != null condition', () => {
      it('should verify exact null check - models is null', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: null as any, // Null
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not extract models (models == null)
        expect(result.current.providers).toEqual([])
        expect(result.current.availableModels.length).toBe(4) // Default models
      })

      it('should verify exact null check - models is undefined', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            // models missing (undefined)
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not extract models (models == null, undefined == null in != check)
        expect(result.current.providers).toEqual([])
        expect(result.current.availableModels.length).toBe(4) // Default models
      })

      it('should verify exact null check - models is not null', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'], // Not null
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should extract models (models != null)
        expect(result.current.availableModels.length).toBeGreaterThan(0)
      })
    })

    describe('Array.isArray(provider.models) condition', () => {
      it('should verify exact array check - models is array', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'], // Array
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should extract models (Array.isArray returns true)
        expect(result.current.availableModels.length).toBeGreaterThan(0)
      })

      it('should verify exact array check - models is string (not array)', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: 'gpt-4' as any, // String, not array
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not extract models (Array.isArray returns false)
        expect(result.current.providers).toEqual([])
        expect(result.current.availableModels.length).toBe(4) // Default models
      })

      it('should verify exact array check - models is object (not array)', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: { gpt4: 'gpt-4' } as any, // Object, not array
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not extract models (Array.isArray returns false)
        expect(result.current.providers).toEqual([])
        expect(result.current.availableModels.length).toBe(4) // Default models
      })
    })

    describe('provider.models.length > 0 condition', () => {
      it('should verify exact length check - length is 0', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: [], // Empty array, length === 0
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not extract models (length === 0, not > 0)
        expect(result.current.providers).toEqual([])
        expect(result.current.availableModels.length).toBe(4) // Default models
      })

      it('should verify exact length check - length is 1', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'], // Length === 1, which is > 0
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should extract models (length > 0)
        expect(result.current.availableModels.length).toBe(1)
        expect(result.current.availableModels[0].value).toBe('gpt-4')
      })

      it('should verify exact length check - length is greater than 1', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4', 'gpt-3.5-turbo'], // Length === 2, which is > 0
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should extract models (length > 0)
        expect(result.current.availableModels.length).toBe(2)
      })
    })

    describe('Combined condition testing - all conditions must be true', () => {
      it('should extract models when all conditions are true', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true, // Condition 1: true
            models: ['gpt-4'], // Condition 2: != null, Condition 3: is array, Condition 4: length > 0
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // All conditions true, should extract
        expect(result.current.availableModels.length).toBe(1)
        expect(result.current.providers.length).toBe(1)
      })

      it('should not extract when provider is null (first condition false)', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [null as any], // Condition 1: false (null)
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // First condition false, should not extract
        expect(result.current.providers).toEqual([])
        expect(result.current.availableModels.length).toBe(4) // Default models
      })

      it('should not extract when enabled is false (second condition false)', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: false, // Condition 2: false
            models: ['gpt-4'],
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Second condition false, should not extract
        expect(result.current.providers).toEqual([])
        expect(result.current.availableModels.length).toBe(4) // Default models
      })

      it('should not extract when models is null (third condition false)', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: null as any, // Condition 3: false (null)
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Third condition false, should not extract
        expect(result.current.providers).toEqual([])
        expect(result.current.availableModels.length).toBe(4) // Default models
      })

      it('should not extract when models is not array (fourth condition false)', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: 'gpt-4' as any, // Condition 4: false (not array)
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Fourth condition false, should not extract
        expect(result.current.providers).toEqual([])
        expect(result.current.availableModels.length).toBe(4) // Default models
      })

      it('should not extract when models.length is 0 (fifth condition false)', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: [], // Condition 5: false (length === 0)
          }],
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Fifth condition false, should not extract
        expect(result.current.providers).toEqual([])
        expect(result.current.availableModels.length).toBe(4) // Default models
      })
    })
  })

  describe('Array.isArray(providers) check in extractModelsFromProviders', () => {
    it('should handle non-array providers input', async () => {
      // This tests the !Array.isArray(providers) check
      // We can't directly call extractModelsFromProviders, but we can test
      // through the hook by providing invalid data that would cause this check to fail
      
      // Note: The API would normally return an array, but if it doesn't,
      // the extractModelsFromProviders function should handle it
      mockApi.getLLMSettings.mockResolvedValue({
        providers: null as any, // This will be checked before extractModelsFromProviders
        iteration_limit: 10,
        default_model: 'gpt-4',
      })

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to storage/defaults
      expect(result.current.providers).toEqual([])
    })
  })

  describe('data != null check in main hook', () => {
    it('should handle null data from API', async () => {
      mockApi.getLLMSettings.mockResolvedValue(null as any)

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to storage/defaults
      expect(result.current.providers).toEqual([])
    })

    it('should handle undefined data from API', async () => {
      mockApi.getLLMSettings.mockResolvedValue(undefined as any)

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to storage/defaults
      expect(result.current.providers).toEqual([])
    })
  })

  describe('data.providers != null check', () => {
    it('should verify exact null check - data.providers is null', async () => {
      mockApi.getLLMSettings.mockResolvedValue({
        providers: null as any,
        iteration_limit: 10,
        default_model: 'gpt-4',
      })

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back (providers == null)
      expect(result.current.providers).toEqual([])
    })

    it('should verify exact null check - data.providers is undefined', async () => {
      mockApi.getLLMSettings.mockResolvedValue({
        // providers missing (undefined)
        iteration_limit: 10,
        default_model: 'gpt-4',
      } as any)

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back (providers == null, undefined == null in != check)
      expect(result.current.providers).toEqual([])
    })
  })

  describe('storedSettings != null check', () => {
    it('should verify exact null check - storedSettings is null', async () => {
      mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))
      mockStorage.getItem.mockReturnValue(null) // Returns null, so storedSettings is null

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to defaults (storedSettings == null)
      expect(result.current.providers).toEqual([])
      expect(result.current.availableModels.length).toBe(4) // Default models
    })

    it('should verify exact null check - storedSettings.providers is null', async () => {
      mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))
      mockStorage.getItem.mockReturnValue(
        JSON.stringify({ providers: null, iteration_limit: 10 })
      )

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to defaults (providers == null)
      expect(result.current.providers).toEqual([])
      expect(result.current.availableModels.length).toBe(4) // Default models
    })
  })
})
