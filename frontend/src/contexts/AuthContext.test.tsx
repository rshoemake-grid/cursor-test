import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import type { StorageAdapter, HttpClient } from '../types/adapters'
import { logger } from '../utils/logger'

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  }
}))

describe('AuthProvider', () => {
  let mockLocalStorage: StorageAdapter
  let mockSessionStorage: StorageAdapter
  let mockHttpClient: HttpClient

  beforeEach(() => {
    jest.clearAllMocks()

    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }

    mockSessionStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }

    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    }
  })

  const wrapper = ({ children, options }: { children: React.ReactNode; options?: any }) => (
    <AuthProvider options={options}>{children}</AuthProvider>
  )

  describe('Initial state', () => {
    it('should have null user and token initially', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should load user and token from localStorage when rememberMe is true', () => {
      const savedUser = { id: '1', username: 'testuser', email: 'test@example.com', is_active: true, is_admin: false }
      mockLocalStorage.getItem = jest.fn((key: string) => {
        if (key === 'auth_remember_me') return 'true'
        if (key === 'auth_token') return 'token-123'
        if (key === 'auth_user') return JSON.stringify(savedUser)
        return null
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      expect(result.current.token).toBe('token-123')
      expect(result.current.user).toEqual(savedUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should load user and token from sessionStorage when rememberMe is false', () => {
      const savedUser = { id: '1', username: 'testuser', email: 'test@example.com', is_active: true, is_admin: false }
      mockLocalStorage.getItem = jest.fn((key: string) => {
        if (key === 'auth_remember_me') return 'false'
        return null
      })
      mockSessionStorage.getItem = jest.fn((key: string) => {
        if (key === 'auth_token') return 'session-token-456'
        if (key === 'auth_user') return JSON.stringify(savedUser)
        return null
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      expect(result.current.token).toBe('session-token-456')
      expect(result.current.user).toEqual(savedUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should not load auth data when storage adapters are null', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: null, sessionStorage: null, httpClient: mockHttpClient } }),
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('login', () => {
    it('should login successfully and store in localStorage when rememberMe is true', async () => {
      const user = { id: '1', username: 'testuser', email: 'test@example.com', is_active: true, is_admin: false }
      const response = {
        ok: true,
        json: async () => ({ access_token: 'token-123', user }),
      }
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(response)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      await act(async () => {
        await result.current.login('testuser', 'password', true)
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/login',
        { username: 'testuser', password: 'password', remember_me: true },
        { 'Content-Type': 'application/json' }
      )
      expect(result.current.token).toBe('token-123')
      expect(result.current.user).toEqual(user)
      expect(result.current.isAuthenticated).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', 'token-123')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(user))
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_remember_me', 'true')
    })

    it('should login successfully and store in sessionStorage when rememberMe is false', async () => {
      const user = { id: '1', username: 'testuser', email: 'test@example.com', is_active: true, is_admin: false }
      const response = {
        ok: true,
        json: async () => ({ access_token: 'token-456', user }),
      }
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(response)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      await act(async () => {
        await result.current.login('testuser', 'password', false)
      })

      expect(result.current.token).toBe('token-456')
      expect(result.current.user).toEqual(user)
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('auth_token', 'token-456')
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(user))
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_user')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_remember_me')
    })

    it('should throw error when login fails', async () => {
      const response = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'Invalid credentials' }),
      }
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(response)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      await expect(
        act(async () => {
          await result.current.login('testuser', 'wrongpassword')
        })
      ).rejects.toThrow('Invalid credentials')
    })

    it('should throw error when storage adapters are not available', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: null, sessionStorage: null, httpClient: mockHttpClient } }),
      })

      await expect(
        act(async () => {
          await result.current.login('testuser', 'password')
        })
      ).rejects.toThrow('Storage adapters not available')
    })

    it('should handle error response without detail', async () => {
      const response = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      }
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(response)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      await expect(
        act(async () => {
          await result.current.login('testuser', 'password')
        })
      ).rejects.toThrow('Server error')
    })

    it('should handle error response parse failure', async () => {
      const response = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => { throw new Error('Parse error') },
      }
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(response)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      await expect(
        act(async () => {
          await result.current.login('testuser', 'password')
        })
      ).rejects.toThrow('HTTP 500: Internal Server Error')
    })
  })

  describe('register', () => {
    it('should register successfully and auto-login', async () => {
      const user = { id: '1', username: 'newuser', email: 'new@example.com', is_active: true, is_admin: false }
      const registerResponse = {
        ok: true,
        json: async () => ({}),
      }
      const loginResponse = {
        ok: true,
        json: async () => ({ access_token: 'token-789', user }),
      }
      ;(mockHttpClient.post as jest.Mock)
        .mockResolvedValueOnce(registerResponse)
        .mockResolvedValueOnce(loginResponse)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      await act(async () => {
        await result.current.register('newuser', 'new@example.com', 'password', 'Full Name')
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/register',
        { username: 'newuser', email: 'new@example.com', password: 'password', full_name: 'Full Name' },
        { 'Content-Type': 'application/json' }
      )
      expect(result.current.token).toBe('token-789')
      expect(result.current.user).toEqual(user)
    })

    it('should register without fullName', async () => {
      const user = { id: '1', username: 'newuser', email: 'new@example.com', is_active: true, is_admin: false }
      const registerResponse = {
        ok: true,
        json: async () => ({}),
      }
      const loginResponse = {
        ok: true,
        json: async () => ({ access_token: 'token-789', user }),
      }
      ;(mockHttpClient.post as jest.Mock)
        .mockResolvedValueOnce(registerResponse)
        .mockResolvedValueOnce(loginResponse)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      await act(async () => {
        await result.current.register('newuser', 'new@example.com', 'password')
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/register',
        { username: 'newuser', email: 'new@example.com', password: 'password', full_name: undefined },
        { 'Content-Type': 'application/json' }
      )
    })

    it('should throw error when registration fails', async () => {
      const response = {
        ok: false,
        json: async () => ({ detail: 'Username already exists' }),
      }
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(response)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      await expect(
        act(async () => {
          await result.current.register('existinguser', 'existing@example.com', 'password')
        })
      ).rejects.toThrow('Username already exists')
    })
  })

  describe('logout', () => {
    it('should clear user, token, and storage', async () => {
      const user = { id: '1', username: 'testuser', email: 'test@example.com', is_active: true, is_admin: false }
      const response = {
        ok: true,
        json: async () => ({ access_token: 'token-123', user }),
      }
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(response as any)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      // Set initial state by logging in
      await act(async () => {
        await result.current.login('testuser', 'password', true)
      })

      act(() => {
        result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_user')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_remember_me')
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('auth_token')
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('auth_user')
    })
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('Custom options', () => {
    it('should use custom apiBaseUrl', async () => {
      const user = { id: '1', username: 'testuser', email: 'test@example.com', is_active: true, is_admin: false }
      const response = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ access_token: 'token-123', user }),
      }
      
      const customHttpClient: HttpClient = {
        get: jest.fn(),
        post: jest.fn().mockResolvedValue(response as any),
        put: jest.fn(),
        delete: jest.fn(),
      }

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: customHttpClient, apiBaseUrl: 'https://custom.api.com/api' } }),
      })

      await act(async () => {
        await result.current.login('testuser', 'password')
      })

      expect(customHttpClient.post).toHaveBeenCalledWith(
        'https://custom.api.com/api/auth/login',
        expect.any(Object),
        expect.any(Object)
      )
    })

    it('should handle invalid JSON in saved user', () => {
      // Test that invalid JSON in localStorage doesn't crash the component
      mockLocalStorage.getItem = jest.fn((key: string) => {
        if (key === 'auth_remember_me') return 'true'
        if (key === 'auth_token') return 'token-123'
        if (key === 'auth_user') return 'invalid-json-{broken'
        return null
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      // Component should handle invalid JSON gracefully
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should handle loading when only token exists', () => {
      mockLocalStorage.getItem = jest.fn((key: string) => {
        if (key === 'auth_remember_me') return 'true'
        if (key === 'auth_token') return 'token-123'
        return null
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      // Should not load if user is missing
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
    })

    it('should handle loading when only user exists', () => {
      const savedUser = { id: '1', username: 'testuser', email: 'test@example.com', is_active: true, is_admin: false }
      mockLocalStorage.getItem = jest.fn((key: string) => {
        if (key === 'auth_remember_me') return 'true'
        if (key === 'auth_user') return JSON.stringify(savedUser)
        return null
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      // Should not load if token is missing
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
    })

    it('should handle register error without detail', async () => {
      const response = {
        ok: false,
        json: async () => ({ message: 'Registration error' }),
      }
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(response)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      await expect(
        act(async () => {
          await result.current.register('testuser', 'test@example.com', 'password')
        })
      ).rejects.toThrow('Registration failed')
    })

    it('should handle register error when login fails after registration', async () => {
      const registerResponse = {
        ok: true,
        json: async () => ({ message: 'Registered' }),
      }
      const loginResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ detail: 'Login failed' }),
      }
      ;(mockHttpClient.post as jest.Mock)
        .mockResolvedValueOnce(registerResponse)
        .mockResolvedValueOnce(loginResponse)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      await expect(
        act(async () => {
          await result.current.register('testuser', 'test@example.com', 'password')
        })
      ).rejects.toThrow('Login failed')
    })

    it('should handle logout when storage adapters are null', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: null, sessionStorage: null, httpClient: mockHttpClient } }),
      })

      // Set user and token manually
      act(() => {
        // We can't directly set state, but logout should still work
        result.current.logout()
      })

      // Should not crash
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
    })

    it('should handle register with fullName', async () => {
      const user = { id: '1', username: 'testuser', email: 'test@example.com', is_active: true, is_admin: false }
      const registerResponse = {
        ok: true,
        json: async () => ({ message: 'Registered' }),
      }
      const loginResponse = {
        ok: true,
        json: async () => ({ access_token: 'token-123', user }),
      }
      ;(mockHttpClient.post as jest.Mock)
        .mockResolvedValueOnce(registerResponse)
        .mockResolvedValueOnce(loginResponse)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      await act(async () => {
        await result.current.register('testuser', 'test@example.com', 'password', 'Full Name')
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({ full_name: 'Full Name' }),
        expect.any(Object)
      )
    })

    it('should handle register error when response json fails', async () => {
      const response = {
        ok: false,
        json: async () => { throw new Error('JSON parse error') },
      }
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(response)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      await expect(
        act(async () => {
          await result.current.register('newuser', 'new@example.com', 'password')
        })
      ).rejects.toThrow()
    })

    it('should handle login with rememberMe false clears localStorage', async () => {
      const user = { id: '1', username: 'testuser', email: 'test@example.com', is_active: true, is_admin: false }
      const response = {
        ok: true,
        json: async () => ({ access_token: 'token-123', user }),
      }
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(response)

      // Set up localStorage with existing data
      mockLocalStorage.getItem = jest.fn((key: string) => {
        if (key === 'auth_token') return 'old-token'
        if (key === 'auth_user') return JSON.stringify(user)
        return null
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      await act(async () => {
        await result.current.login('testuser', 'password', false)
      })

      // Should clear localStorage items
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_user')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_remember_me')
      // Should store in sessionStorage
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('auth_token', 'token-123')
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(user))
    })

    it('should handle login error with message field', async () => {
      const response = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid credentials' }),
      }
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(response)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: mockHttpClient } }),
      })

      await expect(
        act(async () => {
          await result.current.login('testuser', 'wrongpassword')
        })
      ).rejects.toThrow('Invalid credentials')
    })

    it('should use custom logger', async () => {
      const customLogger = {
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        log: jest.fn(),
      }

      const response = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'Invalid credentials' }),
      }
      
      const customHttpClient: HttpClient = {
        get: jest.fn(),
        post: jest.fn().mockResolvedValue(response as any),
        put: jest.fn(),
        delete: jest.fn(),
      }

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, options: { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage, httpClient: customHttpClient, logger: customLogger as any } }),
      })

      await expect(
        act(async () => {
          await result.current.login('testuser', 'wrongpassword')
        })
      ).rejects.toThrow('Invalid credentials')

      // Logger should be called for error handling (called in the login function when response.ok is false)
      await waitFor(() => {
        expect(customLogger.error).toHaveBeenCalled()
      })
    })
  })
})
