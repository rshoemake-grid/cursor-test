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
})
