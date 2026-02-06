/**
 * Settings State Sync Hook Tests
 * Tests for settings state synchronization hook
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useSettingsStateSync } from './useSettingsStateSync'
import type { LLMProvider } from '../providers'

describe('useSettingsStateSync', () => {
  const mockSetProviders = jest.fn()
  const mockSetIterationLimit = jest.fn()
  const mockSetDefaultModel = jest.fn()
  const mockSetSettingsLoaded = jest.fn()
  const mockOnLoadComplete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should sync providers when loaded and local state is empty', () => {
    const loadedProviders: LLMProvider[] = [
      {
        id: 'provider-1',
        name: 'Test Provider',
        type: 'openai',
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
        defaultModel: 'gpt-4',
        models: ['gpt-4'],
        enabled: true,
      },
    ]

    renderHook(() =>
      useSettingsStateSync({
        loadedProviders,
        loadedIterationLimit: undefined,
        loadedDefaultModel: undefined,
        providers: [],
        iterationLimit: 10,
        defaultModel: '',
        setProviders: mockSetProviders,
        setIterationLimit: mockSetIterationLimit,
        setDefaultModel: mockSetDefaultModel,
        setSettingsLoaded: mockSetSettingsLoaded,
        onLoadComplete: mockOnLoadComplete,
      })
    )

    expect(mockSetProviders).toHaveBeenCalledWith(loadedProviders)
  })

  it('should not sync providers when local state already has providers', () => {
    const loadedProviders: LLMProvider[] = [
      {
        id: 'provider-1',
        name: 'Test Provider',
        type: 'openai',
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
        defaultModel: 'gpt-4',
        models: ['gpt-4'],
        enabled: true,
      },
    ]

    const existingProviders: LLMProvider[] = [
      {
        id: 'provider-2',
        name: 'Existing Provider',
        type: 'openai',
        apiKey: 'existing-key',
        baseUrl: 'https://api.existing.com',
        defaultModel: 'gpt-3.5',
        models: ['gpt-3.5'],
        enabled: true,
      },
    ]

    renderHook(() =>
      useSettingsStateSync({
        loadedProviders,
        loadedIterationLimit: undefined,
        loadedDefaultModel: undefined,
        providers: existingProviders,
        iterationLimit: 10,
        defaultModel: '',
        setProviders: mockSetProviders,
        setIterationLimit: mockSetIterationLimit,
        setDefaultModel: mockSetDefaultModel,
        setSettingsLoaded: mockSetSettingsLoaded,
        onLoadComplete: mockOnLoadComplete,
      })
    )

    expect(mockSetProviders).not.toHaveBeenCalled()
  })

  it('should sync iteration limit when loaded and default value', () => {
    renderHook(() =>
      useSettingsStateSync({
        loadedProviders: [],
        loadedIterationLimit: 20,
        loadedDefaultModel: undefined,
        providers: [],
        iterationLimit: 10,
        defaultModel: '',
        setProviders: mockSetProviders,
        setIterationLimit: mockSetIterationLimit,
        setDefaultModel: mockSetDefaultModel,
        setSettingsLoaded: mockSetSettingsLoaded,
        onLoadComplete: mockOnLoadComplete,
      })
    )

    expect(mockSetIterationLimit).toHaveBeenCalledWith(20)
  })

  it('should not sync iteration limit when already set', () => {
    renderHook(() =>
      useSettingsStateSync({
        loadedProviders: [],
        loadedIterationLimit: 20,
        loadedDefaultModel: undefined,
        providers: [],
        iterationLimit: 15,
        defaultModel: '',
        setProviders: mockSetProviders,
        setIterationLimit: mockSetIterationLimit,
        setDefaultModel: mockSetDefaultModel,
        setSettingsLoaded: mockSetSettingsLoaded,
        onLoadComplete: mockOnLoadComplete,
      })
    )

    expect(mockSetIterationLimit).not.toHaveBeenCalled()
  })

  it('should sync default model when loaded and empty', () => {
    renderHook(() =>
      useSettingsStateSync({
        loadedProviders: [],
        loadedIterationLimit: undefined,
        loadedDefaultModel: 'gpt-4',
        providers: [],
        iterationLimit: 10,
        defaultModel: '',
        setProviders: mockSetProviders,
        setIterationLimit: mockSetIterationLimit,
        setDefaultModel: mockSetDefaultModel,
        setSettingsLoaded: mockSetSettingsLoaded,
        onLoadComplete: mockOnLoadComplete,
      })
    )

    expect(mockSetDefaultModel).toHaveBeenCalledWith('gpt-4')
  })

  it('should not sync default model when already set', () => {
    renderHook(() =>
      useSettingsStateSync({
        loadedProviders: [],
        loadedIterationLimit: undefined,
        loadedDefaultModel: 'gpt-4',
        providers: [],
        iterationLimit: 10,
        defaultModel: 'gpt-3.5',
        setProviders: mockSetProviders,
        setIterationLimit: mockSetIterationLimit,
        setDefaultModel: mockSetDefaultModel,
        setSettingsLoaded: mockSetSettingsLoaded,
        onLoadComplete: mockOnLoadComplete,
      })
    )

    expect(mockSetDefaultModel).not.toHaveBeenCalled()
  })

  it('should call onLoadComplete when providers are loaded', async () => {
    const loadedProviders: LLMProvider[] = [
      {
        id: 'provider-1',
        name: 'Test Provider',
        type: 'openai',
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
        defaultModel: 'gpt-4',
        models: ['gpt-4'],
        enabled: true,
      },
    ]

    renderHook(() =>
      useSettingsStateSync({
        loadedProviders,
        loadedIterationLimit: 20,
        loadedDefaultModel: 'gpt-4',
        providers: [],
        iterationLimit: 10,
        defaultModel: '',
        setProviders: mockSetProviders,
        setIterationLimit: mockSetIterationLimit,
        setDefaultModel: mockSetDefaultModel,
        setSettingsLoaded: mockSetSettingsLoaded,
        onLoadComplete: mockOnLoadComplete,
      })
    )

    await waitFor(() => {
      expect(mockOnLoadComplete).toHaveBeenCalledWith({
        providers: loadedProviders,
        iteration_limit: 20,
        default_model: 'gpt-4',
      })
      expect(mockSetSettingsLoaded).toHaveBeenCalledWith(true)
    })
  })

  it('should not call onLoadComplete when no providers loaded', () => {
    renderHook(() =>
      useSettingsStateSync({
        loadedProviders: [],
        loadedIterationLimit: undefined,
        loadedDefaultModel: undefined,
        providers: [],
        iterationLimit: 10,
        defaultModel: '',
        setProviders: mockSetProviders,
        setIterationLimit: mockSetIterationLimit,
        setDefaultModel: mockSetDefaultModel,
        setSettingsLoaded: mockSetSettingsLoaded,
        onLoadComplete: mockOnLoadComplete,
      })
    )

    expect(mockOnLoadComplete).not.toHaveBeenCalled()
    expect(mockSetSettingsLoaded).not.toHaveBeenCalled()
  })
})
