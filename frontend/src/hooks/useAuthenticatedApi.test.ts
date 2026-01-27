import { renderHook } from '@testing-library/react'
import { useAuthenticatedApi } from './useAuthenticatedApi'
import { useAuth } from '../contexts/AuthContext'
import type { HttpClient } from '../types/adapters'
import { API_CONFIG } from '../config/constants'

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../types/adapters', () => ({
  defaultAdapters: {
    createHttpClient: jest.fn(),
  },
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('useAuthenticatedApi', () => {
  let mockHttpClient: HttpClient
  let mockPost: jest.Mock
  let mockGet: jest.Mock
  let mockPut: jest.Mock
  let mockDelete: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    mockPost = jest.fn()
    mockGet = jest.fn()
    mockPut = jest.fn()
    mockDelete = jest.fn()

    mockHttpClient = {
      get: mockGet,
      post: mockPost,
      put: mockPut,
      delete: mockDelete,
    } as unknown as HttpClient

    mockUseAuth.mockReturnValue({
      token: 'test-token',
      user: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: true,
    })
  })

  it('should include Authorization header when token is present', () => {
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient))

    result.current.authenticatedPost('/test', { data: 'test' })

    expect(mockPost).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      { data: 'test' },
      expect.objectContaining({
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      })
    )
  })

  it('should not include Authorization header when token is missing', () => {
    mockUseAuth.mockReturnValue({
      token: null,
      user: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: false,
    })

    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient))

    result.current.authenticatedPost('/test', { data: 'test' })

    expect(mockPost).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      { data: 'test' },
      expect.objectContaining({
        'Content-Type': 'application/json',
      })
    )
    expect(mockPost).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.not.objectContaining({
        Authorization: expect.any(String),
      })
    )
  })

  it('should use custom apiBaseUrl when provided', () => {
    const customUrl = 'https://custom-api.com/api'
    const { result } = renderHook(() =>
      useAuthenticatedApi(mockHttpClient, customUrl)
    )

    result.current.authenticatedGet('/test')

    expect(mockGet).toHaveBeenCalledWith(
      `${customUrl}/test`,
      expect.objectContaining({
        Authorization: 'Bearer test-token',
      })
    )
  })

  it('should merge additional headers', () => {
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient))

    result.current.authenticatedPost(
      '/test',
      { data: 'test' },
      { 'X-Custom-Header': 'value' }
    )

    expect(mockPost).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
        'X-Custom-Header': 'value',
      })
    )
  })

  it('should handle GET requests', () => {
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient))

    result.current.authenticatedGet('/test')

    expect(mockGet).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      expect.objectContaining({
        Authorization: 'Bearer test-token',
      })
    )
  })

  it('should handle PUT requests', () => {
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient))

    result.current.authenticatedPut('/test', { data: 'test' })

    expect(mockPut).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      { data: 'test' },
      expect.objectContaining({
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      })
    )
  })

  it('should handle DELETE requests', () => {
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient))

    result.current.authenticatedDelete('/test')

    expect(mockDelete).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      expect.objectContaining({
        Authorization: 'Bearer test-token',
      })
    )
  })

  it('should handle GET requests without token', () => {
    mockUseAuth.mockReturnValue({
      token: null,
      user: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: false,
    })

    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient))

    result.current.authenticatedGet('/test')

    expect(mockGet).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      expect.not.objectContaining({
        Authorization: expect.any(String),
      })
    )
  })

  it('should handle PUT requests without token', () => {
    mockUseAuth.mockReturnValue({
      token: null,
      user: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: false,
    })

    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient))

    result.current.authenticatedPut('/test', { data: 'test' })

    expect(mockPut).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      { data: 'test' },
      expect.objectContaining({
        'Content-Type': 'application/json',
      })
    )
    expect(mockPut).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.not.objectContaining({
        Authorization: expect.any(String),
      })
    )
  })

  it('should handle DELETE requests without token', () => {
    mockUseAuth.mockReturnValue({
      token: null,
      user: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: false,
    })

    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient))

    result.current.authenticatedDelete('/test')

    expect(mockDelete).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      expect.not.objectContaining({
        Authorization: expect.any(String),
      })
    )
  })

  it('should handle additional headers overriding Content-Type', () => {
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient))

    result.current.authenticatedPost(
      '/test',
      { data: 'test' },
      { 'Content-Type': 'application/xml' }
    )

    expect(mockPost).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        'Content-Type': 'application/xml', // Additional headers should override
        Authorization: 'Bearer test-token',
      })
    )
  })

  it('should handle additional headers with Authorization (token takes precedence)', () => {
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient))

    result.current.authenticatedGet('/test', {
      Authorization: 'Custom token',
    })

    // Token from useAuth takes precedence over additional headers
    expect(mockGet).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        Authorization: 'Bearer test-token', // Token from hook takes precedence
      })
    )
  })

  it('should update when token changes', () => {
    const { result, rerender } = renderHook(() => useAuthenticatedApi(mockHttpClient))

    // Initial call with token
    result.current.authenticatedGet('/test')
    expect(mockGet).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        Authorization: 'Bearer test-token',
      })
    )

    // Change token
    mockUseAuth.mockReturnValue({
      token: 'new-token',
      user: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: true,
    })

    rerender()

    // New call should use new token
    result.current.authenticatedGet('/test2')
    expect(mockGet).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        Authorization: 'Bearer new-token',
      })
    )
  })

  it('should use default httpClient when not provided', () => {
    // This test verifies the hook uses default adapters when httpClient is not provided
    // The actual implementation uses defaultAdapters.createHttpClient() internally
    const { result } = renderHook(() => useAuthenticatedApi())

    // Hook should return functions even without explicit httpClient
    expect(result.current.authenticatedGet).toBeDefined()
    expect(result.current.authenticatedPost).toBeDefined()
    expect(result.current.authenticatedPut).toBeDefined()
    expect(result.current.authenticatedDelete).toBeDefined()
  })

  it('should handle empty additional headers', () => {
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient))

    result.current.authenticatedGet('/test', {})

    expect(mockGet).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      expect.objectContaining({
        Authorization: 'Bearer test-token',
      })
    )
  })

  it('should handle undefined additional headers', () => {
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient))

    result.current.authenticatedGet('/test', undefined)

    expect(mockGet).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      expect.objectContaining({
        Authorization: 'Bearer test-token',
      })
    )
  })
})
