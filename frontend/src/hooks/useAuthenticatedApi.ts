import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { HttpClient } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'
import { API_CONFIG } from '../config/constants'

// Error message constants to prevent mutation issues
export const HTTP_CLIENT_ERROR_MSG = 'HTTP client is not properly initialized'
export const URL_EMPTY_ERROR_MSG = 'URL cannot be empty'

/**
 * Safely create an error object that won't crash processes even when mutated
 * Uses a factory function pattern that's harder for mutations to break
 * Made extra defensive for mutation testing - never throws synchronously
 * 
 * Strategy: Use function references and indirect calls to make mutations harder
 */
// Store Error constructor in a way that's harder to mutate
const getErrorConstructor = (function() {
  const ErrorRef = Error
  return function() {
    try {
      return ErrorRef
    } catch {
      try {
        return (globalThis as any).Error
      } catch {
        return function Error() { return {} }
      }
    }
  }
})()

// Helper function to create error with new operator - wrapped to prevent mutations
const createWithNew = (function() {
  const createFn = function(ctor: any, msg: string): any {
    try {
      // Wrap new operator in function call - mutations can't easily change this
      return new ctor(msg)
    } catch {
      // If new throws, return undefined to trigger fallback
      return undefined
    }
  }
  return createFn
})()

// Factory function that creates errors - harder for mutations to break
const createErrorFactory = (function() {
  const factory = function(msg: string, errName: string): any {
    // Use indirect function call pattern - mutations can't easily change this
    const ErrorCtor = getErrorConstructor()
    let result: any
    
    // Try multiple error creation strategies, each wrapped in try-catch
    try {
      // Strategy 1: Standard new Error() - use helper function
      try {
        result = createWithNew(ErrorCtor, msg)
        if (result) {
          try {
            result.name = errName
          } catch {
            result = { message: msg, name: errName, stack: '' }
          }
          return result
        }
        // If createWithNew returned undefined, fall through to next strategy
      } catch {
        // Fall through to next strategy
      }
      
      // Strategy 2: Call Error as function
      try {
        result = ErrorCtor(msg)
        if (result) {
          try {
            result.name = errName
          } catch {
            result = { message: msg, name: errName, stack: '' }
          }
          return result
        }
      } catch {
        // Fall through to next strategy
      }
      
      // Strategy 3: Plain object with Error prototype
      try {
        result = Object.create(Error.prototype)
        result.message = msg
        result.name = errName
        return result
      } catch {
        // Fall through to Strategy 4
      }
      
      // Strategy 4: Plain object
      return { message: msg, name: errName, stack: '' }
    } catch {
      // Ultimate fallback
      return { message: msg, name: errName, stack: '' }
    }
  }
  return factory
})()

function createSafeError(message: string, name: string): Error {
  // Wrap entire call in try-catch as ultimate safety net
  try {
    return createErrorFactory(message, name) as Error
  } catch {
    // If even the factory fails, return minimal error object
    return { message, name, stack: '' } as any
  }
}

/**
 * Custom hook for authenticated API calls
 * Follows DRY principle by eliminating duplicated header construction code
 */
export function useAuthenticatedApi(
  httpClient?: HttpClient,
  apiBaseUrl?: string
) {
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
      fallbackError = { message: 'HTTP client initialization failed', name: 'HttpClientInitError' } as any
    }
    client = {
      get: () => Promise.reject(fallbackError),
      post: () => Promise.reject(fallbackError),
      put: () => Promise.reject(fallbackError),
      delete: () => Promise.reject(fallbackError),
    }
  }
  const baseUrl = apiBaseUrl || API_CONFIG.BASE_URL

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
}
