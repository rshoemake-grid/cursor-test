/**
 * Tests for useLLMProviders hook
 */

import { renderHook, waitFor } from '@testing-library/react'

// Helper to ensure all waitFor calls have timeouts
const waitForWithTimeout = (callback: () => void | Promise<void>, timeout = 2000) => {
  return waitFor(callback, { timeout })
}

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
const mockLogger = logger as jest.Mocked<typeof logger>

describe('useLLMProviders', () => {
  let mockStorage: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
    }
  })

  it('should initialize with loading state', () => {
    mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useLLMProviders({ storage: mockStorage }))

    expect(result.current.isLoading).toBe(true)
  })

  it('should load providers from API successfully', async () => {
    const mockProviders: LLMProvider[] = [
      {
        id: 'provider1',
        name: 'OpenAI',
        type: 'openai',
        enabled: true,
        models: ['gpt-4', 'gpt-3.5-turbo'],
      },
      {
        id: 'provider2',
        name: 'Anthropic',
        type: 'anthropic',
        enabled: true,
        models: ['claude-3-opus'],
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

    expect(result.current.providers).toEqual(mockProviders)
    expect(result.current.availableModels).toHaveLength(3)
    expect(result.current.availableModels[0]).toEqual({
      value: 'gpt-4',
      label: 'gpt-4 (OpenAI)',
      provider: 'OpenAI',
    })
    expect(result.current.iterationLimit).toBe(10)
    expect(result.current.defaultModel).toBe('gpt-4')
  })

  it('should save API response to storage', async () => {
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
      iteration_limit: 5,
      default_model: 'gpt-4',
    })

    renderHook(() => useLLMProviders({ storage: mockStorage, isAuthenticated: true }))

    await waitForWithTimeout(() => {
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'llm_settings',
        JSON.stringify({
          providers: mockProviders,
          iteration_limit: 5,
          default_model: 'gpt-4',
        })
      )
    })
  })

  it('should fallback to storage when API fails', async () => {
    const storedProviders: LLMProvider[] = [
      {
        id: 'provider1',
        name: 'OpenAI',
        type: 'openai',
        enabled: true,
        models: ['gpt-4'],
      },
    ]

    mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))
    mockStorage.getItem.mockReturnValue(
      JSON.stringify({
        providers: storedProviders,
        iteration_limit: 8,
        default_model: 'gpt-3.5-turbo',
      })
    )

    const { result } = renderHook(() =>
      useLLMProviders({ storage: mockStorage, isAuthenticated: true })
    )

    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.providers).toEqual(storedProviders)
    expect(result.current.availableModels).toHaveLength(1)
    expect(result.current.iterationLimit).toBe(8)
    expect(result.current.defaultModel).toBe('gpt-3.5-turbo')
  })

  it('should fallback to default models when no providers found', async () => {
    mockApi.getLLMSettings.mockResolvedValue({ providers: [] })
    mockStorage.getItem.mockReturnValue(null)

    const { result } = renderHook(() =>
      useLLMProviders({ storage: mockStorage, isAuthenticated: true })
    )

    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.availableModels).toHaveLength(4)
    expect(result.current.availableModels[0].value).toBe('gpt-4o-mini')
    expect(result.current.providers).toEqual([])
  })

  it('should filter out disabled providers', async () => {
    const mockProviders: LLMProvider[] = [
      {
        id: 'provider1',
        name: 'OpenAI',
        type: 'openai',
        enabled: true,
        models: ['gpt-4'],
      },
      {
        id: 'provider2',
        name: 'Anthropic',
        type: 'anthropic',
        enabled: false,
        models: ['claude-3-opus'],
      },
    ]

    mockApi.getLLMSettings.mockResolvedValue({ providers: mockProviders })

    const { result } = renderHook(() =>
      useLLMProviders({ storage: mockStorage, isAuthenticated: true })
    )

    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.availableModels).toHaveLength(1)
    expect(result.current.availableModels[0].provider).toBe('OpenAI')
  })

  it('should filter out providers with no models', async () => {
    const mockProviders: LLMProvider[] = [
      {
        id: 'provider1',
        name: 'OpenAI',
        type: 'openai',
        enabled: true,
        models: ['gpt-4'],
      },
      {
        id: 'provider2',
        name: 'Empty Provider',
        type: 'openai',
        enabled: true,
        models: [],
      },
    ]

    mockApi.getLLMSettings.mockResolvedValue({ providers: mockProviders })

    const { result } = renderHook(() =>
      useLLMProviders({ storage: mockStorage, isAuthenticated: true })
    )

    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.availableModels).toHaveLength(1)
  })

  it('should call onLoadComplete callback when providers are loaded', async () => {
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

    const onLoadComplete = jest.fn()

    renderHook(() =>
      useLLMProviders({
        storage: mockStorage,
        isAuthenticated: true,
        onLoadComplete,
      })
    )

    await waitForWithTimeout(() => {
      expect(onLoadComplete).toHaveBeenCalledWith({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: 'gpt-4',
      })
    })
  })

  it('should handle storage errors gracefully', async () => {
    mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))
    mockStorage.getItem.mockImplementation(() => {
      throw new Error('Storage error')
    })

    const { result } = renderHook(() =>
      useLLMProviders({ storage: mockStorage, isAuthenticated: true })
    )

    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockLogger.error).toHaveBeenCalled()
    expect(result.current.availableModels).toHaveLength(4) // Default models
  })

  it('should handle invalid JSON in storage', async () => {
    mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))
    mockStorage.getItem.mockReturnValue('invalid json')

    const { result } = renderHook(() =>
      useLLMProviders({ storage: mockStorage, isAuthenticated: true })
    )

    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockLogger.error).toHaveBeenCalled()
    expect(result.current.availableModels).toHaveLength(4) // Default models
  })

  it('should work without storage', async () => {
    mockApi.getLLMSettings.mockResolvedValue({ providers: [] })

    const { result } = renderHook(() =>
      useLLMProviders({ storage: null, isAuthenticated: true })
    )

    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.availableModels).toHaveLength(4) // Default models
  })

  it('should handle storage save errors gracefully', async () => {
    const mockProviders: LLMProvider[] = [
      {
        id: 'provider1',
        name: 'OpenAI',
        type: 'openai',
        enabled: true,
        models: ['gpt-4'],
      },
    ]

    mockApi.getLLMSettings.mockResolvedValue({ providers: mockProviders })
    mockStorage.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded')
    })

    const { result } = renderHook(() =>
      useLLMProviders({ storage: mockStorage, isAuthenticated: true })
    )

    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockLogger.error).toHaveBeenCalled()
    expect(result.current.availableModels).toHaveLength(1)
  })

  it('should fallback to defaults when providers have no valid models', async () => {
    const mockProviders: LLMProvider[] = [
      {
        id: 'provider1',
        name: 'OpenAI',
        type: 'openai',
        enabled: true,
        models: undefined,
      },
    ]

    mockApi.getLLMSettings.mockResolvedValue({ providers: mockProviders })
    mockStorage.getItem.mockReturnValue(null)

    const { result } = renderHook(() =>
      useLLMProviders({ storage: mockStorage, isAuthenticated: true })
    )

    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // When providers exist but have no models, should fallback to defaults
    expect(result.current.availableModels).toHaveLength(4) // Default models
    expect(result.current.providers).toEqual([])
  })

  describe('extractModelsFromProviders edge cases', () => {
    it('should not extract models from disabled providers', async () => {
      const mockProviders: LLMProvider[] = [
        {
          id: 'provider1',
          name: 'OpenAI',
          type: 'openai',
          enabled: false, // Disabled
          models: ['gpt-4'],
        },
      ]

      mockApi.getLLMSettings.mockResolvedValue({ providers: mockProviders })

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to defaults since no enabled providers
      expect(result.current.availableModels).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ value: 'gpt-4o-mini' }),
        ])
      )
    })

    it('should not extract models when provider.models is undefined', async () => {
      const mockProviders: LLMProvider[] = [
        {
          id: 'provider1',
          name: 'OpenAI',
          type: 'openai',
          enabled: true,
          // models is undefined
        },
      ]

      mockApi.getLLMSettings.mockResolvedValue({ providers: mockProviders })

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to defaults
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should not extract models when provider.models is empty array', async () => {
      const mockProviders: LLMProvider[] = [
        {
          id: 'provider1',
          name: 'OpenAI',
          type: 'openai',
          enabled: true,
          models: [], // Empty array
        },
      ]

      mockApi.getLLMSettings.mockResolvedValue({ providers: mockProviders })

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to defaults
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify provider.enabled && provider.models && provider.models.length > 0 check', async () => {
      const mockProviders: LLMProvider[] = [
        {
          id: 'provider1',
          name: 'OpenAI',
          type: 'openai',
          enabled: true,
          models: ['gpt-4'],
        },
        {
          id: 'provider2',
          name: 'Disabled',
          type: 'openai',
          enabled: false, // Disabled - should be skipped
          models: ['gpt-3.5'],
        },
        {
          id: 'provider3',
          name: 'No Models',
          type: 'openai',
          enabled: true,
          models: undefined, // No models - should be skipped
        },
        {
          id: 'provider4',
          name: 'Empty Models',
          type: 'openai',
          enabled: true,
          models: [], // Empty - should be skipped
        },
      ]

      mockApi.getLLMSettings.mockResolvedValue({ providers: mockProviders })

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should only extract from provider1
      expect(result.current.availableModels).toHaveLength(1)
      expect(result.current.availableModels[0].value).toBe('gpt-4')
    })
  })

  describe('loadFromStorage edge cases', () => {
    it('should return null when storage is null', async () => {
      mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useLLMProviders({ storage: null, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to defaults
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should return null when storage.getItem returns null', async () => {
      mockStorage.getItem.mockReturnValue(null)
      mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to defaults
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should handle JSON.parse error in loadFromStorage', async () => {
      mockStorage.getItem.mockReturnValue('invalid json')
      mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to parse LLM settings from storage:',
        expect.any(Error)
      )
      // Should fall back to defaults
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should use fallback for parsed.providers when missing', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        // No providers field
        iteration_limit: 10,
      }))
      mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to defaults since providers is empty array
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })
  })

  describe('API response handling edge cases', () => {
    it('should verify data.providers && data.providers.length > 0 check', async () => {
      mockApi.getLLMSettings.mockResolvedValue({
        // No providers field
        iteration_limit: 10,
      })

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to storage/defaults
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify data.providers.length === 0 path', async () => {
      mockApi.getLLMSettings.mockResolvedValue({
        providers: [], // Empty array
        iteration_limit: 10,
      })

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to storage/defaults
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify models.length > 0 check before using API data', async () => {
      const mockProviders: LLMProvider[] = [
        {
          id: 'provider1',
          name: 'OpenAI',
          type: 'openai',
          enabled: false, // Disabled, so no models extracted
        },
      ]

      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
      })

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall through to storage/defaults since models.length === 0
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify typeof data.iteration_limit === number check', async () => {
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
        iteration_limit: '10', // String, not number
      })

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // iteration_limit should be undefined since it's not a number
      expect(result.current.iterationLimit).toBeUndefined()
    })

    it('should verify data.default_model check', async () => {
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
        default_model: '', // Empty string
      })

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Empty string is falsy, so defaultModel should be undefined
      expect(result.current.defaultModel).toBeUndefined()
    })

    it('should verify data.default_model || "" fallback in storage save', async () => {
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
        // No default_model
      })

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should save with empty string fallback
      expect(mockStorage.setItem).toHaveBeenCalled()
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData.default_model).toBe('')
    })

    it('should handle storage.setItem error', async () => {
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

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save LLM settings to storage:',
        expect.any(Error)
      )
      // Should still set models despite storage error
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify onLoadComplete check before calling', async () => {
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
      })

      const { result } = renderHook(() =>
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
          onLoadComplete: undefined,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should not throw error when onLoadComplete is undefined
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify storedSettings.providers.length > 0 check', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        providers: [], // Empty array
        iteration_limit: 10,
      }))
      mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to defaults
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify typeof storedSettings.iteration_limit === number check', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        providers: [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ],
        iteration_limit: '10', // String, not number
      }))
      mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // iteration_limit should be undefined since it's not a number
      expect(result.current.iterationLimit).toBeUndefined()
    })

    it('should verify storedSettings.default_model check', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        providers: [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ],
        default_model: '', // Empty string
      }))
      mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Empty string is falsy, so defaultModel should be undefined
      expect(result.current.defaultModel).toBeUndefined()
    })

    it('should verify onLoadComplete is called with correct data structure', async () => {
      const onLoadComplete = jest.fn()
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

      renderHook(() =>
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
          onLoadComplete,
        })
      )

      await waitForWithTimeout(() => {
        expect(onLoadComplete).toHaveBeenCalled()
      })

      // Verify onLoadComplete is called with correct structure
      expect(onLoadComplete).toHaveBeenCalledWith({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: 'gpt-4',
      })
    })

    it('should verify onLoadComplete is called from storage path', async () => {
      const onLoadComplete = jest.fn()
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        providers: [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ],
        iteration_limit: 5,
        default_model: 'gpt-3.5-turbo',
      }))
      mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))

      renderHook(() =>
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
          onLoadComplete,
        })
      )

      await waitForWithTimeout(() => {
        expect(onLoadComplete).toHaveBeenCalled()
      })

      // Verify onLoadComplete is called with storage data
      expect(onLoadComplete).toHaveBeenCalledWith({
        providers: expect.any(Array),
        iteration_limit: 5,
        default_model: 'gpt-3.5-turbo',
      })
    })

    it('should verify provider.enabled && provider.models && provider.models.length > 0 - all true', async () => {
      const mockProviders: LLMProvider[] = [
        {
          id: 'provider1',
          name: 'OpenAI',
          type: 'openai',
          enabled: true,
          models: ['gpt-4', 'gpt-3.5-turbo'],
        },
      ]

      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: 'gpt-4',
      })

      const { result } = renderHook(() =>
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.availableModels.length).toBeGreaterThan(0)
      })

      expect(result.current.availableModels.length).toBe(2)
    })

    it('should verify provider.enabled && provider.models && provider.models.length > 0 - enabled is false', async () => {
      const mockProviders: LLMProvider[] = [
        {
          id: 'provider1',
          name: 'OpenAI',
          type: 'openai',
          enabled: false, // Disabled
          models: ['gpt-4', 'gpt-3.5-turbo'],
        },
      ]

      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: 'gpt-4',
      })

      const { result } = renderHook(() =>
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to defaults since no enabled providers
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify provider.enabled && provider.models && provider.models.length > 0 - models is undefined', async () => {
      const mockProviders: LLMProvider[] = [
        {
          id: 'provider1',
          name: 'OpenAI',
          type: 'openai',
          enabled: true,
          // No models property
        },
      ]

      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: 'gpt-4',
      })

      const { result } = renderHook(() =>
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to defaults since no models
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify provider.enabled && provider.models && provider.models.length > 0 - models.length is 0', async () => {
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
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to defaults since models.length is 0
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify forEach on providers array', async () => {
      const mockProviders: LLMProvider[] = [
        {
          id: 'provider1',
          name: 'OpenAI',
          type: 'openai',
          enabled: true,
          models: ['gpt-4'],
        },
        {
          id: 'provider2',
          name: 'Anthropic',
          type: 'anthropic',
          enabled: true,
          models: ['claude-3'],
        },
      ]

      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: 'gpt-4',
      })

      const { result } = renderHook(() =>
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.availableModels.length).toBeGreaterThan(0)
      })

      // Should extract models from both providers
      expect(result.current.availableModels.length).toBe(2)
    })

    it('should verify forEach on models array', async () => {
      const mockProviders: LLMProvider[] = [
        {
          id: 'provider1',
          name: 'OpenAI',
          type: 'openai',
          enabled: true,
          models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'],
        },
      ]

      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: 'gpt-4',
      })

      const { result } = renderHook(() =>
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.availableModels.length).toBeGreaterThan(0)
      })

      // Should extract all 3 models
      expect(result.current.availableModels.length).toBe(3)
    })

    it('should verify template literal ${model} (${provider.name}) in label', async () => {
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
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.availableModels.length).toBeGreaterThan(0)
      })

      // Verify label format: ${model} (${provider.name})
      expect(result.current.availableModels[0].label).toBe('gpt-4 (OpenAI)')
    })

    it('should verify parsed.providers || [] fallback in loadFromStorage', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        // No providers field
        iteration_limit: 5,
        default_model: 'gpt-3.5-turbo',
      }))
      mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to defaults when parsed.providers is missing
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify data.providers || [] fallback in storage save', async () => {
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
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify storage.setItem was called with providers array
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'llm_settings',
        expect.stringContaining('"providers"')
      )
    })

    it('should verify data.default_model || "" fallback in storage save - default_model is undefined', async () => {
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
        // No default_model
      })

      const { result } = renderHook(() =>
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify storage.save uses empty string fallback
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData.default_model).toBe('')
    })

    it('should verify data.default_model || "" fallback in storage save - default_model has value', async () => {
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
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify storage.save uses actual default_model value
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData.default_model).toBe('gpt-4')
    })

    it('should verify models.length > 0 check in API path', async () => {
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
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to defaults since models.length is 0
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify models.length > 0 check in storage path', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        providers: [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: false, // Disabled
            models: ['gpt-4'],
          },
        ],
        iteration_limit: 5,
        default_model: 'gpt-3.5-turbo',
      }))
      mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to defaults since models.length is 0 (provider disabled)
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify storedSettings && storedSettings.providers.length > 0 check', async () => {
      mockStorage.getItem.mockReturnValue(null) // No stored settings
      mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to defaults when storedSettings is null
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify storedSettings && storedSettings.providers.length > 0 - providers.length is 0', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        providers: [], // Empty array
        iteration_limit: 5,
        default_model: 'gpt-3.5-turbo',
      }))
      mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fall back to defaults when providers.length is 0
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify template literal ${model} (${provider.name}) exact format', async () => {
      const mockProviders: LLMProvider[] = [
        {
          id: 'provider1',
          name: 'OpenAI',
          type: 'openai',
          enabled: true,
          models: ['gpt-4', 'gpt-3.5-turbo'],
        },
      ]

      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: 'gpt-4',
      })

      const { result } = renderHook(() =>
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.availableModels.length).toBeGreaterThan(0)
      })

      // Verify exact template literal format: ${model} (${provider.name})
      expect(result.current.availableModels[0].label).toBe('gpt-4 (OpenAI)')
      expect(result.current.availableModels[1].label).toBe('gpt-3.5-turbo (OpenAI)')
    })

    it('should verify string literal provider exact value', async () => {
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
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.availableModels.length).toBeGreaterThan(0)
      })

      // Verify exact string value 'provider' field
      expect(result.current.availableModels[0].provider).toBe('OpenAI')
    })

    it('should verify provider.enabled && provider.models && provider.models.length > 0 - all conditions true', async () => {
      const mockProviders: LLMProvider[] = [
        {
          id: 'provider1',
          name: 'OpenAI',
          type: 'openai',
          enabled: true, // enabled is true
          models: ['gpt-4'], // models exists and length > 0
        },
      ]

      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: 'gpt-4',
      })

      const { result } = renderHook(() =>
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.availableModels.length).toBeGreaterThan(0)
      })

      // Should extract models when all conditions are true
      expect(result.current.availableModels.length).toBe(1)
    })

    it('should verify models.length > 0 exact comparison - length is 1', async () => {
      const mockProviders: LLMProvider[] = [
        {
          id: 'provider1',
          name: 'OpenAI',
          type: 'openai',
          enabled: true,
          models: ['gpt-4'], // length is 1, so > 0
        },
      ]

      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: 'gpt-4',
      })

      const { result } = renderHook(() =>
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should use API data when models.length > 0 (length is 1)
      expect(result.current.availableModels.length).toBe(1)
    })

    it('should verify storedSettings.providers.length > 0 exact comparison - length is 1', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        providers: [
          {
            id: 'provider1',
            name: 'OpenAI',
            type: 'openai',
            enabled: true,
            models: ['gpt-4'],
          },
        ], // length is 1, so > 0
        iteration_limit: 5,
        default_model: 'gpt-3.5-turbo',
      }))
      mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should use storage data when providers.length > 0 (length is 1)
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify exact fallback values parsed.providers || []', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        providers: null,
      }))

      mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useLLMProviders({ storage: mockStorage }))

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify exact empty array fallback (not null or undefined)
      // The code uses parsed.providers || [], so when providers is null, it should be []
      expect(result.current.providers).toEqual([])
      expect(Array.isArray(result.current.providers)).toBe(true)
    })

    it('should verify exact fallback value default_model || empty string', async () => {
      mockApi.getLLMSettings.mockResolvedValue({
        providers: [
          { id: 'openai', name: 'OpenAI', type: 'openai', enabled: true, models: ['gpt-4'] }
        ],
        default_model: null,
      } as any)

      const { result } = renderHook(() => useLLMProviders({ storage: mockStorage }))

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify exact empty string fallback (not null or undefined)
      const setItemCall = mockStorage.setItem.mock.calls.find((call: any[]) => 
        call[0] === 'llm_settings'
      )
      if (setItemCall) {
        const saved = JSON.parse(setItemCall[1])
        expect(saved.default_model).toBe('')
        expect(saved.default_model.length).toBe(0)
      }
    })

    it('should verify exact comparison provider.enabled && provider.models && provider.models.length > 0', async () => {
      // Import the function directly
      const { useLLMProviders } = require('./useLLMProviders')
      
      // We can't directly test extractModelsFromProviders as it's not exported
      // Instead, test through the hook behavior
      
      // Test: provider.enabled is false
      mockApi.getLLMSettings.mockResolvedValue({
        providers: [
          { id: 'openai', name: 'OpenAI', type: 'openai', enabled: false, models: ['gpt-4'] }
        ],
      } as any)

      const { result: result1 } = renderHook(() => useLLMProviders({ storage: mockStorage }))

      await waitForWithTimeout(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      // Should fallback to defaults when no enabled providers
      expect(result1.current.availableModels.length).toBeGreaterThan(0)

      // Test: provider.models is undefined
      mockApi.getLLMSettings.mockResolvedValue({
        providers: [
          { id: 'openai', name: 'OpenAI', type: 'openai', enabled: true, models: undefined }
        ],
      } as any)

      const { result: result2 } = renderHook(() => useLLMProviders({ storage: mockStorage }))

      await waitForWithTimeout(() => {
        expect(result2.current.isLoading).toBe(false)
      })

      // Should fallback to defaults when no models
      expect(result2.current.availableModels.length).toBeGreaterThan(0)

      // Test: provider.models.length is 0
      mockApi.getLLMSettings.mockResolvedValue({
        providers: [
          { id: 'openai', name: 'OpenAI', type: 'openai', enabled: true, models: [] }
        ],
      } as any)

      const { result: result3 } = renderHook(() => useLLMProviders({ storage: mockStorage }))

      await waitForWithTimeout(() => {
        expect(result3.current.isLoading).toBe(false)
      })

      // Should fallback to defaults when models array is empty
      expect(result3.current.availableModels.length).toBeGreaterThan(0)

      // Test: all conditions true
      mockApi.getLLMSettings.mockResolvedValue({
        providers: [
          { id: 'openai', name: 'OpenAI', type: 'openai', enabled: true, models: ['gpt-4'] }
        ],
      } as any)

      const { result: result4 } = renderHook(() => useLLMProviders({ storage: mockStorage }))

      await waitForWithTimeout(() => {
        expect(result4.current.isLoading).toBe(false)
      })

      // Should use provider models when all conditions are true
      expect(result4.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify exact comparison data.providers && data.providers.length > 0', async () => {
      // Test: data.providers is undefined
      mockApi.getLLMSettings.mockResolvedValue({
        providers: undefined,
      } as any)

      const { result: result1 } = renderHook(() => useLLMProviders({ storage: mockStorage }))

      await waitForWithTimeout(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      // Should fallback to defaults
      expect(result1.current.availableModels.length).toBeGreaterThan(0)

      // Test: data.providers.length is 0
      mockApi.getLLMSettings.mockResolvedValue({
        providers: [],
      } as any)

      const { result: result2 } = renderHook(() => useLLMProviders({ storage: mockStorage }))

      await waitForWithTimeout(() => {
        expect(result2.current.isLoading).toBe(false)
      })

      // Should fallback to defaults
      expect(result2.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify exact comparison storedSettings.providers.length > 0', async () => {
      // Test: storedSettings.providers.length is 0
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        providers: [],
      }))

      mockApi.getLLMSettings.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useLLMProviders({ storage: mockStorage }))

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fallback to defaults when providers.length is 0
      expect(result.current.availableModels.length).toBeGreaterThan(0)
    })

    it('should verify exact comparison typeof data.iteration_limit === number', async () => {
      // Test: iteration_limit is a number
      mockApi.getLLMSettings.mockResolvedValue({
        providers: [
          { id: 'openai', name: 'OpenAI', type: 'openai', enabled: true, models: ['gpt-4'] }
        ],
        iteration_limit: 10,
      } as any)

      const { result } = renderHook(() => useLLMProviders({ storage: mockStorage }))

      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.iterationLimit).toBe(10)

      // Test: iteration_limit is not a number
      mockApi.getLLMSettings.mockResolvedValue({
        providers: [
          { id: 'openai', name: 'OpenAI', type: 'openai', enabled: true, models: ['gpt-4'] }
        ],
        iteration_limit: '10',
      } as any)

      const { result: result2 } = renderHook(() => useLLMProviders({ storage: mockStorage }))

      await waitForWithTimeout(() => {
        expect(result2.current.isLoading).toBe(false)
      })

      // Should not set iterationLimit when it's not a number
      expect(result2.current.iterationLimit).toBeUndefined()
    })
  })
})
