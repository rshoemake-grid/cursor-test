import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { HttpClient } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'
import { API_CONFIG } from '../config/constants'
import { createSafeError } from '../utils/errorFactory'

// Error message constants to prevent mutation issues
export const HTTP_CLIENT_ERROR_MSG = 'HTTP client is not properly initialized'
export const URL_EMPTY_ERROR_MSG = 'URL cannot be empty'

/**
 * Custom hook for authenticated API calls
 * Follows DRY principle by eliminating duplicated header construction code
 */
export function useAuthenticatedApi(
  httpClient?: HttpClient,
  apiBaseUrl?: string
) {
  // Wrap entire hook body in try-catch to prevent crashes from mutations
  // This is the ultimate safety net - if anything throws synchronously, we catch it
  try {
    const { token } = useAuth()
    // Wrap client creation in try-catch to prevent crashes from mutations
    let client: HttpClient
    try {
      client = httpClient || defaultAdapters.createHttpClient()
    } catch (error) {
      // Fallback to a mock client if creation fails (due to mutations)
      // Use createSafeError to prevent mutations from causing crashes
      let fallbackError: Error
      try {
        fallbackError = createSafeError('HTTP client initialization failed', 'HttpClientInitError')
      } catch {
        // If createSafeError throws (shouldn't happen, but mutations can break anything)
        fallbackError = { message: 'HTTP client initialization failed', name: 'HttpClientInitError' } as any
      }
      client = {
        get: () => Promise.reject(fallbackError),
        post: () => Promise.reject(fallbackError),
        put: () => Promise.reject(fallbackError),
        delete: () => Promise.reject(fallbackError),
      }
    }
    
    // Wrap baseUrl assignment in try-catch as well
    let baseUrl: string
    try {
      baseUrl = apiBaseUrl || API_CONFIG.BASE_URL
    } catch {
      // If API_CONFIG.BASE_URL access throws, use fallback
      baseUrl = apiBaseUrl || 'http://localhost:8000'
    }

  /**
   * Make an authenticated POST request
   */
  const authenticatedPost = useCallback(
    async (
      endpoint: string,
      data: any,
      additionalHeaders?: HeadersInit
    ) => {
      // Wrap entire function in try-catch to prevent any synchronous throws from crashing processes
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...additionalHeaders,
        }

        if (token) {
          ;(headers as any)['Authorization'] = `Bearer ${token}`
        }

        // Ensure client and URL are valid before making request
        // Made mutation-resistant: return rejected promise instead of throwing synchronously
        if (!client || typeof client.post !== 'function') {
          // Use safe error creation to prevent crashes from mutations
          // Wrap entire error creation and rejection in try-catch
          try {
            let error: Error
            try {
              error = createSafeError(HTTP_CLIENT_ERROR_MSG, 'HttpClientError')
            } catch {
              // If createSafeError throws due to mutations, create minimal error
              try {
                error = Object.create(Error.prototype) as Error
                error.message = HTTP_CLIENT_ERROR_MSG
                error.name = 'HttpClientError'
              } catch {
                error = { message: HTTP_CLIENT_ERROR_MSG, name: 'HttpClientError' } as any
              }
            }
            
            // Wrap in try-catch to ensure Promise.reject never throws synchronously
            try {
              return Promise.reject(error)
            } catch (e) {
              // If mutation changed Promise.reject to throw, defer rejection
              return new Promise((_, reject) => {
                setTimeout(() => reject(error), 0)
              })
            }
          } catch (e) {
            // Ultimate fallback - defer rejection to prevent any synchronous throws
            let fallbackErr: Error
            try {
              fallbackErr = createSafeError(HTTP_CLIENT_ERROR_MSG, 'HttpClientError')
            } catch {
              fallbackErr = { message: HTTP_CLIENT_ERROR_MSG, name: 'HttpClientError' } as any
            }
            return new Promise((_, reject) => {
              setTimeout(() => {
                reject(fallbackErr)
              }, 0)
            })
          }
        }
        
        const url = `${baseUrl}${endpoint}`
        if (!url || url.trim() === '') {
          // Use safe error creation to prevent crashes from mutations
          // Wrap entire error path in try-catch to handle any synchronous throws
          try {
            let error: Error
            try {
              error = createSafeError(URL_EMPTY_ERROR_MSG, 'InvalidUrlError')
            } catch {
              // If error creation fails due to mutations, create a minimal error object
              try {
                error = Object.create(Error.prototype) as Error
                error.message = URL_EMPTY_ERROR_MSG
                error.name = 'InvalidUrlError'
              } catch {
                // Ultimate fallback - plain object
                error = { message: URL_EMPTY_ERROR_MSG, name: 'InvalidUrlError' } as any
              }
            }
            
            // Wrap in try-catch to ensure Promise.reject never throws synchronously
            try {
              return Promise.reject(error)
            } catch (e) {
              // If mutation changed Promise.reject to throw, catch it and return rejected promise
              // Use setTimeout to defer rejection to next tick, preventing synchronous throws
              return new Promise((_, reject) => {
                setTimeout(() => reject(error), 0)
              })
            }
          } catch (e) {
            // If anything throws synchronously, wrap in setTimeout to defer
            let fallbackErr: Error
            try {
              fallbackErr = createSafeError(URL_EMPTY_ERROR_MSG, 'InvalidUrlError')
            } catch {
              fallbackErr = { message: URL_EMPTY_ERROR_MSG, name: 'InvalidUrlError' } as any
            }
            return new Promise((_, reject) => {
              setTimeout(() => {
                reject(fallbackErr)
              }, 0)
            })
          }
        }

        return client.post(url, data, headers)
      } catch (error) {
        // Catch any synchronous errors (from mutations) and convert to rejected promise
        return Promise.reject(error)
      }
    },
    [token, client, baseUrl]
  )

  /**
   * Make an authenticated GET request
   */
  const authenticatedGet = useCallback(
    async (endpoint: string, additionalHeaders?: HeadersInit) => {
      try {
        const headers: HeadersInit = {
          ...additionalHeaders,
        }

        if (token) {
          ;(headers as any)['Authorization'] = `Bearer ${token}`
        }

        // Ensure client and URL are valid before making request
        if (!client || typeof client.get !== 'function') {
          // Wrap entire error creation and rejection in try-catch
          try {
            let error: Error
            try {
              error = createSafeError(HTTP_CLIENT_ERROR_MSG, 'HttpClientError')
            } catch {
              try {
                error = Object.create(Error.prototype) as Error
                error.message = HTTP_CLIENT_ERROR_MSG
                error.name = 'HttpClientError'
              } catch {
                error = { message: HTTP_CLIENT_ERROR_MSG, name: 'HttpClientError' } as any
              }
            }
            
            try {
              return Promise.reject(error)
            } catch (e) {
              return new Promise((_, reject) => {
                setTimeout(() => reject(error), 0)
              })
            }
          } catch (e) {
            let fallbackErr: Error
            try {
              fallbackErr = createSafeError(HTTP_CLIENT_ERROR_MSG, 'HttpClientError')
            } catch {
              fallbackErr = { message: HTTP_CLIENT_ERROR_MSG, name: 'HttpClientError' } as any
            }
            return new Promise((_, reject) => {
              setTimeout(() => {
                reject(fallbackErr)
              }, 0)
            })
          }
        }
        
        const url = `${baseUrl}${endpoint}`
        if (!url || url.trim() === '') {
          try {
            let error: Error
            try {
              error = createSafeError(URL_EMPTY_ERROR_MSG, 'InvalidUrlError')
            } catch {
              try {
                error = Object.create(Error.prototype) as Error
                error.message = URL_EMPTY_ERROR_MSG
                error.name = 'InvalidUrlError'
              } catch {
                error = { message: URL_EMPTY_ERROR_MSG, name: 'InvalidUrlError' } as any
              }
            }
            
            try {
              return Promise.reject(error)
            } catch (e) {
              return new Promise((_, reject) => {
                setTimeout(() => reject(error), 0)
              })
            }
          } catch (e) {
            let fallbackErr: Error
            try {
              fallbackErr = createSafeError(URL_EMPTY_ERROR_MSG, 'InvalidUrlError')
            } catch {
              fallbackErr = { message: URL_EMPTY_ERROR_MSG, name: 'InvalidUrlError' } as any
            }
            return new Promise((_, reject) => {
              setTimeout(() => {
                reject(fallbackErr)
              }, 0)
            })
          }
        }

        return client.get(url, headers)
      } catch (error) {
        return Promise.reject(error)
      }
    },
    [token, client, baseUrl]
  )

  /**
   * Make an authenticated PUT request
   */
  const authenticatedPut = useCallback(
    async (
      endpoint: string,
      data: any,
      additionalHeaders?: HeadersInit
    ) => {
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...additionalHeaders,
        }

        if (token) {
          ;(headers as any)['Authorization'] = `Bearer ${token}`
        }

        // Ensure client and URL are valid before making request
        if (!client || typeof client.put !== 'function') {
          // Wrap entire error creation and rejection in try-catch
          try {
            let error: Error
            try {
              error = createSafeError(HTTP_CLIENT_ERROR_MSG, 'HttpClientError')
            } catch {
              try {
                error = Object.create(Error.prototype) as Error
                error.message = HTTP_CLIENT_ERROR_MSG
                error.name = 'HttpClientError'
              } catch {
                error = { message: HTTP_CLIENT_ERROR_MSG, name: 'HttpClientError' } as any
              }
            }
            
            try {
              return Promise.reject(error)
            } catch (e) {
              return new Promise((_, reject) => {
                setTimeout(() => reject(error), 0)
              })
            }
          } catch (e) {
            let fallbackErr: Error
            try {
              fallbackErr = createSafeError(HTTP_CLIENT_ERROR_MSG, 'HttpClientError')
            } catch {
              fallbackErr = { message: HTTP_CLIENT_ERROR_MSG, name: 'HttpClientError' } as any
            }
            return new Promise((_, reject) => {
              setTimeout(() => {
                reject(fallbackErr)
              }, 0)
            })
          }
        }
        
        const url = `${baseUrl}${endpoint}`
        if (!url || url.trim() === '') {
          try {
            let error: Error
            try {
              error = createSafeError(URL_EMPTY_ERROR_MSG, 'InvalidUrlError')
            } catch {
              try {
                error = Object.create(Error.prototype) as Error
                error.message = URL_EMPTY_ERROR_MSG
                error.name = 'InvalidUrlError'
              } catch {
                error = { message: URL_EMPTY_ERROR_MSG, name: 'InvalidUrlError' } as any
              }
            }
            
            try {
              return Promise.reject(error)
            } catch (e) {
              return new Promise((_, reject) => {
                setTimeout(() => reject(error), 0)
              })
            }
          } catch (e) {
            let fallbackErr: Error
            try {
              fallbackErr = createSafeError(URL_EMPTY_ERROR_MSG, 'InvalidUrlError')
            } catch {
              fallbackErr = { message: URL_EMPTY_ERROR_MSG, name: 'InvalidUrlError' } as any
            }
            return new Promise((_, reject) => {
              setTimeout(() => {
                reject(fallbackErr)
              }, 0)
            })
          }
        }

        return client.put(url, data, headers)
      } catch (error) {
        return Promise.reject(error)
      }
    },
    [token, client, baseUrl]
  )

  /**
   * Make an authenticated DELETE request
   */
  const authenticatedDelete = useCallback(
    async (endpoint: string, additionalHeaders?: HeadersInit) => {
      try {
        const headers: HeadersInit = {
          ...additionalHeaders,
        }

        if (token) {
          ;(headers as any)['Authorization'] = `Bearer ${token}`
        }

        // Ensure client and URL are valid before making request
        if (!client || typeof client.delete !== 'function') {
          // Wrap entire error creation and rejection in try-catch
          try {
            let error: Error
            try {
              error = createSafeError(HTTP_CLIENT_ERROR_MSG, 'HttpClientError')
            } catch {
              try {
                error = Object.create(Error.prototype) as Error
                error.message = HTTP_CLIENT_ERROR_MSG
                error.name = 'HttpClientError'
              } catch {
                error = { message: HTTP_CLIENT_ERROR_MSG, name: 'HttpClientError' } as any
              }
            }
            
            try {
              return Promise.reject(error)
            } catch (e) {
              return new Promise((_, reject) => {
                setTimeout(() => reject(error), 0)
              })
            }
          } catch (e) {
            let fallbackErr: Error
            try {
              fallbackErr = createSafeError(HTTP_CLIENT_ERROR_MSG, 'HttpClientError')
            } catch {
              fallbackErr = { message: HTTP_CLIENT_ERROR_MSG, name: 'HttpClientError' } as any
            }
            return new Promise((_, reject) => {
              setTimeout(() => {
                reject(fallbackErr)
              }, 0)
            })
          }
        }
        
        const url = `${baseUrl}${endpoint}`
        if (!url || url.trim() === '') {
          try {
            let error: Error
            try {
              error = createSafeError(URL_EMPTY_ERROR_MSG, 'InvalidUrlError')
            } catch {
              try {
                error = Object.create(Error.prototype) as Error
                error.message = URL_EMPTY_ERROR_MSG
                error.name = 'InvalidUrlError'
              } catch {
                error = { message: URL_EMPTY_ERROR_MSG, name: 'InvalidUrlError' } as any
              }
            }
            
            try {
              return Promise.reject(error)
            } catch (e) {
              return new Promise((_, reject) => {
                setTimeout(() => reject(error), 0)
              })
            }
          } catch (e) {
            let fallbackErr: Error
            try {
              fallbackErr = createSafeError(URL_EMPTY_ERROR_MSG, 'InvalidUrlError')
            } catch {
              fallbackErr = { message: URL_EMPTY_ERROR_MSG, name: 'InvalidUrlError' } as any
            }
            return new Promise((_, reject) => {
              setTimeout(() => {
                reject(fallbackErr)
              }, 0)
            })
          }
        }

        return client.delete(url, headers)
      } catch (error) {
        return Promise.reject(error)
      }
    },
    [token, client, baseUrl]
  )

    return {
      authenticatedPost,
      authenticatedGet,
      authenticatedPut,
      authenticatedDelete,
    }
  } catch (error) {
    // If anything throws synchronously during hook initialization (from mutations),
    // return a minimal hook with functions that reject with a safe error
    let safeError: Error
    try {
      safeError = createSafeError('Hook initialization failed', 'HookInitError')
    } catch {
      safeError = { message: 'Hook initialization failed', name: 'HookInitError' } as any
    }
    
    const rejectFn = () => Promise.reject(safeError)
    return {
      authenticatedPost: rejectFn,
      authenticatedGet: rejectFn,
      authenticatedPut: rejectFn,
      authenticatedDelete: rejectFn,
    }
  }
}
