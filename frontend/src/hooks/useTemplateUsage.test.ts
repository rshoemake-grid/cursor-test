import { renderHook, act } from '@testing-library/react'
import { useTemplateUsage } from './useTemplateUsage'
import { logger } from '../utils/logger'

jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

const mockLoggerDebug = logger.debug as jest.MockedFunction<typeof logger.debug>
const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>

describe('useTemplateUsage', () => {
  const mockHttpClient = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockNavigate.mockClear()
  })

  describe('useTemplate', () => {
    it('should use template successfully with token', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'workflow-123' }),
      })

      const { result } = renderHook(() =>
        useTemplateUsage({
          token: 'token-123',
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-1')
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'http://api.test/templates/template-1/use',
        {},
        expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        })
      )
    })

    it('should use template successfully without token', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'workflow-123' }),
      })

      const { result } = renderHook(() =>
        useTemplateUsage({
          token: null,
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-1')
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'http://api.test/templates/template-1/use',
        {},
        expect.objectContaining({
          'Content-Type': 'application/json',
        })
      )
      expect(mockHttpClient.post.mock.calls[0][2]).not.toHaveProperty('Authorization')
    })

    it('should handle use template error response', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: false,
        text: async () => 'Error message',
      })

      const { result } = renderHook(() =>
        useTemplateUsage({
          token: 'token-123',
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-1')
      })

      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle use template exception', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useTemplateUsage({
          token: 'token-123',
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-1')
      })

      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle workflow with null id', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ id: null }),
      })

      const { result } = renderHook(() =>
        useTemplateUsage({
          token: 'token-123',
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-1')
      })

      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('workflow=null'))
    })

    it('should handle workflow with undefined id', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ id: undefined }),
      })

      const { result } = renderHook(() =>
        useTemplateUsage({
          token: 'token-123',
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-1')
      })

      expect(mockNavigate).toHaveBeenCalled()
    })

    it('should handle response.json() throwing error', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Parse error') },
      })

      const { result } = renderHook(() =>
        useTemplateUsage({
          token: 'token-123',
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-1')
      })

      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle response.text() throwing error', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: false,
        text: async () => { throw new Error('Text error') },
      })

      const { result } = renderHook(() =>
        useTemplateUsage({
          token: 'token-123',
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-1')
      })

      expect(mockLoggerError).toHaveBeenCalled()
    })
  })

  describe('mutation killers for useTemplate', () => {
    it('should verify response.ok check by testing false path explicitly', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: false,
        text: async () => 'Error message',
      })

      const { result } = renderHook(() =>
        useTemplateUsage({
          token: 'token-123',
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-1')
      })

      // Verify navigate was NOT called when response.ok is false
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should verify exact logger.debug message content', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'workflow-123' }),
      })

      const { result } = renderHook(() =>
        useTemplateUsage({
          token: 'token-123',
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-1')
      })

      // Verify exact log message to kill StringLiteral mutant
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        'Created workflow from template:',
        { id: 'workflow-123' }
      )
    })

    it('should verify exact logger.error message content', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: false,
        text: async () => 'Error message',
      })

      const { result } = renderHook(() =>
        useTemplateUsage({
          token: 'token-123',
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-1')
      })

      // Verify exact error message to kill StringLiteral mutant
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Failed to use template:',
        'Error message'
      )
    })
  })


  describe('no-coverage paths for useTemplate', () => {
  describe('useTemplate - catch block', () => {
    it('should handle httpClient.post throwing error', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useTemplateUsage({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-123')
      })

      // Should handle error in catch block (line 83)
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to use template:',
        expect.any(Error)
      )
    })

    it('should handle response.json() throwing in useTemplate', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        text: jest.fn(),
      }
      mockHttpClient.post.mockResolvedValue(mockResponse)

      const { result } = renderHook(() =>
        useTemplateUsage({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-123')
      })

      // Should handle error in catch block (line 83)
      expect(logger.error).toHaveBeenCalled()
    })
  })

  })

  describe('branch coverage for useTemplate', () => {
  describe('useTemplate - response.ok branches', () => {
    it('should navigate when response.ok is true', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'workflow-123' }),
      }
      mockHttpClient.post.mockResolvedValue(mockResponse)

      const { result } = renderHook(() =>
        useTemplateUsage({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-123')
      })

      // Should navigate (lines 76-79)
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('workflow=workflow-123'))
      expect(logger.debug).toHaveBeenCalledWith('Created workflow from template:', { id: 'workflow-123' })
    })

    it('should handle response.ok false branch', async () => {
      const mockResponse = {
        ok: false,
        text: jest.fn().mockResolvedValue('Error message'),
      }
      mockHttpClient.post.mockResolvedValue(mockResponse)

      const { result } = renderHook(() =>
        useTemplateUsage({
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-123')
      })

      // Should log error (lines 81-82)
      expect(logger.error).toHaveBeenCalledWith('Failed to use template:', 'Error message')
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  })
})