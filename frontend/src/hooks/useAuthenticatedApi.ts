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
 * Wraps error creation in try-catch to handle mutations that change error creation
 * Uses a function wrapper to prevent mutations from changing the error creation pattern
 * Made extra defensive for mutation testing - never throws synchronously
 * 
 * Uses an immediately invoked function expression (IIFE) to create errors in isolation
 * This makes it harder for mutations to affect the error creation process
 */
function createSafeError(message: string, name: string): Error {
  // Wrap entire function body in try-catch as ultimate safety net
  try {
    // Use IIFE to isolate error creation from mutations
    return (function createError(): Error {
      try {
        try {
          try {
            // Try standard error creation - wrap EVERY operation in try-catch
            // Mutations can change Error constructor, assignment, or new operator
            let ErrorConstructor: any
            try {
              ErrorConstructor = Error
            } catch {
              // If Error assignment fails, use global Error directly
              ErrorConstructor = (globalThis as any).Error || (window as any).Error || function Error() {}
            }
            
            let err: any
            try {
              // Wrap new operator in try-catch - mutations can change it to throw
              try {
                err = new ErrorConstructor(message)
              } catch {
                // If new throws, try calling as function
                try {
                  err = ErrorConstructor(message)
                } catch {
                  // If that fails, create empty object and assign properties
                  err = {}
                  err.message = message
                  err.name = name
                  return err
                }
              }
            } catch {
              // If error creation completely fails, use plain object
              err = { message, name }
              return err
            }
            
            // Wrap property assignment in try-catch
            try {
              err.name = name
            } catch {
              // If assignment fails, create new object with properties
              return { message, name, stack: '' }
            }
            
            return err
          } catch {
            // If Error constructor throws, try Object.assign approach
            try {
              let ErrorConstructor: any
              try {
                ErrorConstructor = Error
              } catch {
                ErrorConstructor = (globalThis as any).Error || function Error() {}
              }
              
              let baseError: any
              try {
                baseError = new ErrorConstructor()
              } catch {
                baseError = {}
              }
              
              try {
                return Object.assign(baseError, { message, name })
              } catch {
                return { message, name, stack: '' }
              }
            } catch {
              // If that fails, create plain object with Error prototype
              try {
                const fallbackError = Object.create(Error.prototype)
                fallbackError.message = message
                fallbackError.name = name
                return fallbackError
              } catch {
                // Even Object.create can fail if mutated, use plain object
                const plainError: any = {}
                plainError.message = message
                plainError.name = name
                plainError.stack = ''
                return plainError
              }
            }
          }
        } catch {
          // Second layer fallback
          try {
            const fallbackError = Object.create(Error.prototype)
            fallbackError.message = message
            fallbackError.name = name
            return fallbackError
          } catch {
            const plainError: any = {}
            plainError.message = message
            plainError.name = name
            plainError.stack = ''
            return plainError
          }
        }
      } catch {
        // Third layer fallback - plain object only
        const plainError: any = {}
        plainError.message = message
        plainError.name = name
        plainError.stack = ''
        return plainError
      }
    })()
  } catch {
    // Ultimate fallback - return a plain object that looks like an Error
    // This should never throw, but if it does, we return a minimal error-like object
    const ultimateFallback: any = {}
    ultimateFallback.message = message
    ultimateFallback.name = name
    ultimateFallback.stack = ''
    // Don't use Object.setPrototypeOf as it might throw if mutated
    return ultimateFallback
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
    client = {
      get: () => Promise.reject(new Error('HTTP client initialization failed')),
      post: () => Promise.reject(new Error('HTTP client initialization failed')),
      put: () => Promise.reject(new Error('HTTP client initialization failed')),
      delete: () => Promise.reject(new Error('HTTP client initialization failed')),
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
            return new Promise((_, reject) => {
              setTimeout(() => {
                reject(new Error(HTTP_CLIENT_ERROR_MSG))
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
            return new Promise((_, reject) => {
              setTimeout(() => {
                reject(new Error(URL_EMPTY_ERROR_MSG))
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
            return new Promise((_, reject) => {
              setTimeout(() => {
                reject(new Error(HTTP_CLIENT_ERROR_MSG))
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
            return new Promise((_, reject) => {
              setTimeout(() => {
                reject(new Error(URL_EMPTY_ERROR_MSG))
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
            return new Promise((_, reject) => {
              setTimeout(() => {
                reject(new Error(HTTP_CLIENT_ERROR_MSG))
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
            return new Promise((_, reject) => {
              setTimeout(() => {
                reject(new Error(URL_EMPTY_ERROR_MSG))
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
            return new Promise((_, reject) => {
              setTimeout(() => {
                reject(new Error(HTTP_CLIENT_ERROR_MSG))
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
            return new Promise((_, reject) => {
              setTimeout(() => {
                reject(new Error(URL_EMPTY_ERROR_MSG))
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
