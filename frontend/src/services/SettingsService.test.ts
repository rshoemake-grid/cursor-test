import { SettingsService, type LLMSettings } from './SettingsService'
import type { StorageAdapter, HttpClient } from '../types/adapters'
import type { LLMProvider } from '../hooks/useLLMProviders'
import { buildAuthHeaders } from '../hooks/utils/apiUtils'

jest.mock('../hooks/utils/apiUtils', () => ({
  buildAuthHeaders: jest.fn(),
}))

describe('SettingsService', () => {
  let mockHttpClient: jest.Mocked<HttpClient>
  let mockStorage: jest.Mocked<StorageAdapter>
  let service: SettingsService
  const apiBaseUrl = '/api'

  beforeEach(() => {
    jest.clearAllMocks()

    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    } as any

    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }

    ;(buildAuthHeaders as jest.Mock).mockReturnValue({
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json',
    })
  })

  describe('saveSettings', () => {
    const mockSettings: LLMSettings = {
      providers: [
        {
          id: 'provider-1',
          name: 'Test Provider',
          type: 'openai',
          enabled: true,
        },
      ],
      iteration_limit: 10,
      default_model: 'gpt-4',
    }

    it('should save to storage when storage is available', async () => {
      service = new SettingsService(mockHttpClient, mockStorage, apiBaseUrl)

      await service.saveSettings(mockSettings)

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'llm_settings',
        JSON.stringify(mockSettings)
      )
    })

    it('should not save to storage when storage is null', async () => {
      service = new SettingsService(mockHttpClient, null, apiBaseUrl)

      await service.saveSettings(mockSettings)

      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should save to backend when token is provided', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response)

      service = new SettingsService(mockHttpClient, mockStorage, apiBaseUrl)

      await service.saveSettings(mockSettings, 'test-token')

      expect(buildAuthHeaders).toHaveBeenCalledWith({ token: 'test-token' })
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/settings/llm',
        mockSettings,
        expect.objectContaining({
          'Authorization': 'Bearer test-token',
        })
      )
    })

    it('should not save to backend when token is not provided', async () => {
      service = new SettingsService(mockHttpClient, mockStorage, apiBaseUrl)

      await service.saveSettings(mockSettings)

      expect(mockHttpClient.post).not.toHaveBeenCalled()
    })

    it('should not save to backend when token is null', async () => {
      service = new SettingsService(mockHttpClient, mockStorage, apiBaseUrl)

      await service.saveSettings(mockSettings, null)

      expect(mockHttpClient.post).not.toHaveBeenCalled()
    })

    it('should throw error when backend save fails', async () => {
      const error = new Error('Network error')
      mockHttpClient.post.mockRejectedValue(error)
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      service = new SettingsService(mockHttpClient, mockStorage, apiBaseUrl)

      await expect(service.saveSettings(mockSettings, 'test-token')).rejects.toThrow('Network error')
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to sync settings to backend:', error)

      consoleErrorSpy.mockRestore()
    })

    it('should throw error when backend returns non-ok response', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)

      service = new SettingsService(mockHttpClient, mockStorage, apiBaseUrl)

      await expect(service.saveSettings(mockSettings, 'test-token')).rejects.toThrow(
        'Failed to save settings: 500 Internal Server Error'
      )
    })

    it('should save to both storage and backend when both are available', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response)

      service = new SettingsService(mockHttpClient, mockStorage, apiBaseUrl)

      await service.saveSettings(mockSettings, 'test-token')

      expect(mockStorage.setItem).toHaveBeenCalled()
      expect(mockHttpClient.post).toHaveBeenCalled()
    })
  })

  describe('testProvider', () => {
    const mockProvider: LLMProvider = {
      id: 'provider-1',
      name: 'Test Provider',
      type: 'openai',
      enabled: true,
      apiKey: 'test-api-key',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4',
    }

    it('should return success when provider test succeeds', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'success',
          message: 'Connection successful',
        }),
      } as Response)

      service = new SettingsService(mockHttpClient, mockStorage, apiBaseUrl)

      const result = await service.testProvider(mockProvider)

      expect(result.status).toBe('success')
      expect(result.message).toBe('Connection successful')
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/settings/llm/test',
        {
          type: 'openai',
          api_key: 'test-api-key',
          base_url: 'https://api.openai.com/v1',
          model: 'gpt-4',
        },
        { 'Content-Type': 'application/json' }
      )
    })

    it('should return error when provider test fails', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'error',
          message: 'Invalid API key',
        }),
      } as Response)

      service = new SettingsService(mockHttpClient, mockStorage, apiBaseUrl)

      const result = await service.testProvider(mockProvider)

      expect(result.status).toBe('error')
      expect(result.message).toBe('Invalid API key')
    })

    it('should return error with default message when status is error but no message', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'error',
        }),
      } as Response)

      service = new SettingsService(mockHttpClient, mockStorage, apiBaseUrl)

      const result = await service.testProvider(mockProvider)

      expect(result.status).toBe('error')
      expect(result.message).toBe('Connection failed')
    })

    it('should return error when network request fails', async () => {
      const error = new Error('Network error')
      mockHttpClient.post.mockRejectedValue(error)

      service = new SettingsService(mockHttpClient, mockStorage, apiBaseUrl)

      const result = await service.testProvider(mockProvider)

      expect(result.status).toBe('error')
      expect(result.message).toBe('Network error')
    })

    it('should return error with default message when error has no message', async () => {
      const error = { toString: () => 'Error' }
      mockHttpClient.post.mockRejectedValue(error)

      service = new SettingsService(mockHttpClient, mockStorage, apiBaseUrl)

      const result = await service.testProvider(mockProvider)

      expect(result.status).toBe('error')
      expect(result.message).toBe('Network error - check if backend is running')
    })

    it('should handle provider without optional fields', async () => {
      const providerWithoutOptional: LLMProvider = {
        id: 'provider-2',
        name: 'Minimal Provider',
        type: 'custom',
        enabled: true,
      }

      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'success',
          message: 'OK',
        }),
      } as Response)

      service = new SettingsService(mockHttpClient, mockStorage, apiBaseUrl)

      const result = await service.testProvider(providerWithoutOptional)

      expect(result.status).toBe('success')
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/settings/llm/test',
        {
          type: 'custom',
          api_key: undefined,
          base_url: undefined,
          model: undefined,
        },
        { 'Content-Type': 'application/json' }
      )
    })
  })
})
