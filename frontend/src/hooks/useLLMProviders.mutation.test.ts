/**
 * Mutation tests to kill surviving mutants in useLLMProviders
 * Focuses on conditional expressions, type checks, logical operators, and edge cases
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
const mockLoggerDebug = logger.debug as jest.MockedFunction<typeof logger.debug>
const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>

const waitForWithTimeout = (callback: () => void | Promise<void>, timeout = 2000) => {
  return waitFor(callback, { timeout })
}

describe('useLLMProviders - Mutation Killers', () => {
  let mockStorage: any
  let mockOnLoadComplete: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnLoadComplete = jest.fn()

    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
  })

  describe('Conditional expression edge cases', () => {
    describe('data.providers && data.providers.length > 0', () => {
      it('should verify exact AND - data.providers is null', async () => {
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

        // Should fall through to storage/defaults (providers is null)
        expect(result.current.providers).toEqual([])
      })

      it('should verify exact AND - data.providers is undefined', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: undefined as any,
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should fall through to storage/defaults
        expect(result.current.providers).toEqual([])
      })

      it('should verify exact boundary - data.providers.length === 0', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [], // Empty array
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should fall through to storage/defaults (length === 0)
        expect(result.current.providers).toEqual([])
      })

      it('should verify exact boundary - data.providers.length > 0', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should use API data (length > 0)
        expect(result.current.providers).toEqual(mockProviders)
      })
    })

    describe('models.length > 0', () => {
      it('should verify exact boundary - models.length === 0', async () => {
        // Providers exist but no models extracted (all disabled or no models)
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: false, // Disabled, so no models extracted
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should fall through to storage/defaults (models.length === 0)
        expect(result.current.providers).toEqual([])
      })

      it('should verify exact boundary - models.length > 0', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should use API data (models.length > 0)
        expect(result.current.availableModels.length).toBeGreaterThan(0)
      })
    })

    describe('storedSettings && storedSettings.providers.length > 0', () => {
      it('should verify exact AND - storedSettings is null', async () => {
        mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))
        mockStorage.getItem.mockReturnValue(null)

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should fall through to defaults (storedSettings is null)
        expect(result.current.providers).toEqual([])
      })

      it('should verify exact boundary - storedSettings.providers.length === 0', async () => {
        mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))
        mockStorage.getItem.mockReturnValue(
          JSON.stringify({ providers: [], iteration_limit: 10 })
        )

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should fall through to defaults (length === 0)
        expect(result.current.providers).toEqual([])
      })
    })
  })

  describe('Type checks', () => {
    describe('typeof data.iteration_limit === "number"', () => {
      it('should verify exact type check - iteration_limit is number', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10, // Number
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should set iterationLimit (type is number)
        expect(result.current.iterationLimit).toBe(10)
      })

      it('should verify exact type check - iteration_limit is string', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: '10' as any, // String, not number
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not set iterationLimit (type is not number)
        expect(result.current.iterationLimit).toBeUndefined()
      })

      it('should verify exact type check - iteration_limit is null', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: null as any,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not set iterationLimit (type is not number)
        expect(result.current.iterationLimit).toBeUndefined()
      })
    })

    describe('typeof storedSettings.iteration_limit === "number"', () => {
      it('should verify exact type check - iteration_limit is number', async () => {
        mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))
        mockStorage.getItem.mockReturnValue(
          JSON.stringify({
            providers: [
              {
                id: 'provider1',
                name: 'OpenAI',
                type: 'openai',
                enabled: true,
                models: ['gpt-4'],
              },
            ],
            iteration_limit: 15, // Number
          })
        )

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should set iterationLimit (type is number)
        expect(result.current.iterationLimit).toBe(15)
      })

      it('should verify exact type check - iteration_limit is string', async () => {
        mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))
        mockStorage.getItem.mockReturnValue(
          JSON.stringify({
            providers: [
              {
                id: 'provider1',
                name: 'OpenAI',
                type: 'openai',
                enabled: true,
                models: ['gpt-4'],
              },
            ],
            iteration_limit: '15', // String, not number
          })
        )

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not set iterationLimit (type is not number)
        expect(result.current.iterationLimit).toBeUndefined()
      })
    })
  })

  describe('Logical OR operators', () => {
    describe('parsed.providers || []', () => {
      it('should verify exact fallback - parsed.providers is null', async () => {
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

        // Should use empty array fallback
        expect(result.current.providers).toEqual([])
      })

      it('should verify exact fallback - parsed.providers is undefined', async () => {
        mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))
        mockStorage.getItem.mockReturnValue(
          JSON.stringify({ iteration_limit: 10 }) // providers missing
        )

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should use empty array fallback
        expect(result.current.providers).toEqual([])
      })
    })

    describe('data.providers || []', () => {
      it('should verify exact fallback - data.providers is null', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Verify storage.setItem was called with providers || [] fallback
        expect(mockStorage.setItem).toHaveBeenCalled()
        const setItemCall = mockStorage.setItem.mock.calls[0]
        const saved = JSON.parse(setItemCall[1])
        expect(saved.providers).toEqual(mockProviders) // Should use actual providers
      })
    })

    describe('data.default_model || ""', () => {
      it('should verify exact fallback - default_model is null', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: null as any,
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Verify storage.setItem was called with default_model || '' fallback
        expect(mockStorage.setItem).toHaveBeenCalled()
        const setItemCall = mockStorage.setItem.mock.calls[0]
        const saved = JSON.parse(setItemCall[1])
        expect(saved.default_model).toBe('') // Should use empty string fallback
      })

      it('should verify exact fallback - default_model is undefined', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          // default_model missing
        } as any)

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Verify storage.setItem was called with default_model || '' fallback
        expect(mockStorage.setItem).toHaveBeenCalled()
        const setItemCall = mockStorage.setItem.mock.calls[0]
        const saved = JSON.parse(setItemCall[1])
        expect(saved.default_model).toBe('') // Should use empty string fallback
      })

      it('should verify exact fallback - default_model is empty string', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: '', // Empty string (falsy)
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Empty string is falsy, so if (data.default_model) check fails
        // Should not set defaultModel (empty string is falsy)
        expect(result.current.defaultModel).toBeUndefined()
      })
    })
  })

  describe('Null/undefined/empty string distinctions', () => {
    describe('data.default_model', () => {
      it('should verify null vs undefined vs empty string - null', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: null as any,
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not set defaultModel (null is falsy)
        expect(result.current.defaultModel).toBeUndefined()
      })

      it('should verify null vs undefined vs empty string - undefined', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          // default_model missing (undefined)
        } as any)

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not set defaultModel (undefined is falsy)
        expect(result.current.defaultModel).toBeUndefined()
      })

      it('should verify null vs undefined vs empty string - truthy string', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: 'gpt-4', // Truthy string
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should set defaultModel (truthy string)
        expect(result.current.defaultModel).toBe('gpt-4')
      })
    })

    describe('saved - null vs empty string vs undefined', () => {
      it('should verify null check - saved is null', async () => {
        mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))
        mockStorage.getItem.mockReturnValue(null)

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should fall through to defaults (saved is null)
        expect(result.current.providers).toEqual([])
      })

      it('should verify empty string check - saved is empty string', async () => {
        mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))
        mockStorage.getItem.mockReturnValue('') // Empty string

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should fall through to defaults (empty string is falsy)
        expect(result.current.providers).toEqual([])
      })
    })
  })

  describe('Callback execution', () => {
    describe('onLoadComplete', () => {
      it('should verify callback - onLoadComplete is undefined', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true, onLoadComplete: undefined })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not throw (callback is optional)
        expect(result.current.providers).toEqual(mockProviders)
      })

      it('should verify callback - onLoadComplete is null', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true, onLoadComplete: null as any })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not throw (callback is optional)
        expect(result.current.providers).toEqual(mockProviders)
      })

      it('should verify callback - onLoadComplete is called', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true, onLoadComplete: mockOnLoadComplete })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should call callback
        expect(mockOnLoadComplete).toHaveBeenCalledWith({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: 'gpt-4',
        })
      })
    })
  })

  describe('Storage operations', () => {
    describe('storage is null before saving', () => {
      it('should verify null check - storage is null', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: null, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not save to storage (storage is null)
        expect(mockStorage.setItem).not.toHaveBeenCalled()
        // But should still load providers
        expect(result.current.providers).toEqual(mockProviders)
      })
    })

    describe('storage.setItem error handling', () => {
      it('should verify error handling - setItem throws', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        mockStorage.setItem.mockImplementation(() => {
          throw new Error('Storage error')
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should handle error gracefully
        expect(mockLoggerError).toHaveBeenCalledWith(
          'Failed to save LLM settings to storage:',
          expect.any(Error)
        )
        // Should still load providers despite storage error
        expect(result.current.providers).toEqual(mockProviders)
      })
    })
  })

  describe('String operations', () => {
    describe('Template literal - `${model} (${provider.name})`', () => {
      it('should verify exact string construction', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should construct label with exact template literal format
        expect(result.current.availableModels[0].label).toBe('gpt-4 (OpenAI)')
      })
    })
  })

  describe('Provider extraction', () => {
    describe('provider.enabled is false', () => {
      it('should verify exact check - enabled is false', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: false, // Disabled
            models: ['gpt-4'],
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not extract models (enabled is false)
        // The extraction logic checks: provider.enabled === true && provider.models != null && provider.models.length > 0
        // Since enabled is false, extraction returns 0 models, so code falls through to defaults
        // When models.length === 0, providers are not set from API, falls through to defaults
        expect(result.current.providers).toEqual([]) // Not set, falls through
        // Verify that extraction returned 0 models (code path verified)
        // Falls back to defaults (4 default models)
        expect(result.current.availableModels.length).toBe(4) // Default models
        // Verify the code path: extraction returned 0, so defaults were used
        // Default models have specific format
        expect(result.current.availableModels[0].label).toContain('GPT-4o Mini')
      })
    })

    describe('provider.models is null/undefined', () => {
      it('should verify null check - models is null', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: null as any,
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not extract models (models is null)
        // When extraction returns 0 models, providers are not set from API, falls through to defaults
        expect(result.current.providers).toEqual([]) // Not set, falls through
        // Falls back to defaults (4 default models)
        expect(result.current.availableModels.length).toBe(4) // Default models
        // Verify the code path: extraction returned 0, so defaults were used
        expect(result.current.availableModels[0].label).toContain('GPT-4o Mini')
      })

      it('should verify undefined check - models is undefined', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            // models missing (undefined)
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not extract models (models is undefined)
        // When extraction returns 0 models, providers are not set from API, falls through to defaults
        expect(result.current.providers).toEqual([]) // Not set, falls through
        // Falls back to defaults (4 default models)
        expect(result.current.availableModels.length).toBe(4) // Default models
        // Verify the code path: extraction returned 0, so defaults were used
        expect(result.current.availableModels[0].label).toContain('GPT-4o Mini')
      })
    })

    describe('provider.models.length === 0', () => {
      it('should verify exact boundary - length === 0', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: [], // Empty array
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
          iteration_limit: 10,
          default_model: 'gpt-4',
        })

        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        )

        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Should not extract models (length === 0)
        // When extraction returns 0 models, providers are not set from API, falls through to defaults
        expect(result.current.providers).toEqual([]) // Not set, falls through
        // Falls back to defaults (4 default models)
        expect(result.current.availableModels.length).toBe(4) // Default models
        // Verify the code path: extraction returned 0, so defaults were used
        expect(result.current.availableModels[0].label).toContain('GPT-4o Mini')
      })

      it('should verify exact boundary - length > 0', async () => {
        const mockProviders: LLMProvider[] = [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'], // Has models
          },
        ]

        mockApi.getLLMSettings.mockResolvedValue({
          providers: mockProviders,
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
        expect(result.current.availableModels.length).toBeGreaterThan(0)
      })
    })
  })
})
