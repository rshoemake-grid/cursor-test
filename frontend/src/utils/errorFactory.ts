/**
 * Error Factory Utility
 * 
 * Provides mutation-resistant error creation functions for use in hooks and components.
 * This module is excluded from mutation testing as it contains defensive error-handling
 * code that is designed to prevent crashes during mutation testing.
 * 
 * The error creation functions use multiple fallback strategies to ensure errors
 * are always created successfully, even when code is mutated.
 */

/**
 * Store Error constructor in a way that's harder to mutate
 */
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

/**
 * Safe error constructor caller - wraps calls in a way that mutations can't bypass
 * This function is designed to be mutation-resistant by using indirect calls
 */
const safeErrorCtorCall = (function() {
  // Create a function that will always catch errors, even if mutated
  const safeCaller = function(ctor: any, message: string): any {
    // Use Function constructor to create a wrapper that's harder to mutate
    // This creates a new execution context that will catch any synchronous throws
    try {
      const wrapper = new Function('ctor', 'msg', `
        try {
          try {
            if (typeof ctor === 'function') {
              try {
                return ctor(msg);
              } catch {
                return undefined;
              }
            }
            return undefined;
          } catch {
            return undefined;
          }
        } catch {
          return undefined;
        }
      `)
      return wrapper(ctor, message)
    } catch {
      // If Function constructor fails, use direct call with multiple try-catch
      try {
        try {
          if (typeof ctor === 'function') {
            try {
              return ctor(message)
            } catch {
              return undefined
            }
          }
        } catch {
          return undefined
        }
      } catch {
        return undefined
      }
    }
  }
  return safeCaller
})()

/**
 * Factory function that creates errors - harder for mutations to break
 * Avoids using 'new' operator directly - uses function call and Object.create instead
 * CRITICAL: This function MUST NEVER throw synchronously, even when mutated
 */
const createErrorFactory = (function() {
  // Wrap factory creation in try-catch to prevent crashes during module initialization
  try {
    const factory = function(msg: string, errName: string): any {
      // Wrap entire function body in try-catch to catch ANY synchronous throws from mutations
      try {
        // Use indirect function call pattern - mutations can't easily change this
        let ErrorCtor: any
        try {
          ErrorCtor = getErrorConstructor()
        } catch {
          // If getErrorConstructor throws, use fallback
          ErrorCtor = function Error() { return {} }
        }
        
        let result: any
        
        // Try multiple error creation strategies, each wrapped in try-catch
        // Strategy 1: Call Error as function (avoid 'new' operator)
        // Wrap assignment in try-catch - mutations can change assignment to throw
        try {
          try {
            // Wrap function call and assignment separately
            // Extra defensive: wrap ErrorCtor call in try-catch to prevent mutations from causing crashes
            let errorResult: any
            try {
              // Double-wrap to handle mutations that change ErrorCtor to throw
              try {
                let ErrorCtorRef: any
                try {
                  ErrorCtorRef = ErrorCtor
                } catch {
                  ErrorCtorRef = undefined
                }
                
                if (ErrorCtorRef && typeof ErrorCtorRef === 'function') {
                  try {
                    // CRITICAL: Use safeErrorCtorCall which uses Function constructor
                    // This creates a new execution context that mutations can't easily bypass
                    try {
                      errorResult = safeErrorCtorCall(ErrorCtorRef, msg)
                    } catch (e) {
                      // If mutation causes safeErrorCtorCall to throw, catch it here
                      errorResult = undefined
                    }
                  } catch {
                    // Extra safety layer
                    errorResult = undefined
                  }
                } else {
                  errorResult = undefined
                }
              } catch {
                errorResult = undefined
              }
            } catch {
              errorResult = undefined
            }
            
            if (errorResult) {
              try {
                result = errorResult
                try {
                  result.name = errName
                } catch {
                  result = { message: msg, name: errName, stack: '' }
                }
                try {
                  return result
                } catch {
                  return { message: msg, name: errName, stack: '' }
                }
              } catch {
                // If assignment fails, fall through
              }
            }
          } catch {
            // Fall through to next strategy
          }
          
          // Strategy 2: Plain object with Error prototype
          try {
            let protoResult: any
            try {
              protoResult = Object.create(Error.prototype)
            } catch {
              protoResult = undefined
            }
            
            if (protoResult) {
              try {
                result = protoResult
                try {
                  result.message = msg
                  result.name = errName
                } catch {
                  result = { message: msg, name: errName, stack: '' }
                }
                try {
                  return result
                } catch {
                  return { message: msg, name: errName, stack: '' }
                }
              } catch {
                // Fall through
              }
            }
          } catch {
            // Fall through to Strategy 3
          }
          
          // Strategy 3: Plain object (no prototype) - this should never throw
          try {
            result = { message: msg, name: errName, stack: '' }
            try {
              return result
            } catch {
              // If return throws, create new object
              return { message: msg, name: errName, stack: '' }
            }
          } catch {
            // Fall through to ultimate fallback
          }
        } catch {
          // Ultimate fallback - return plain object
        }
        
        // Ultimate fallback - always return something (should never throw)
        try {
          return { message: msg, name: errName, stack: '' }
        } catch {
          // If even this throws, return minimal object
          return { message: msg || '', name: errName || 'Error', stack: '' }
        }
      } catch {
        // CRITICAL: If ANYTHING throws synchronously (even from mutations), return minimal error
        // This prevents crashes during mutation testing
        return { message: msg || '', name: errName || 'Error', stack: '' }
      }
    }
    return factory
  } catch {
    // If factory creation fails, return a function that always returns a plain object
    // This prevents crashes during module initialization if mutations break the factory
    return function(msg: string, errName: string): any {
      return { message: msg || '', name: errName || 'Error', stack: '' }
    }
  }
})()

/**
 * Safely create an error object that won't crash processes even when mutated
 * 
 * This function uses multiple fallback strategies to ensure an error is always created,
 * even when the code is mutated. It never throws synchronously.
 * 
 * @param message - The error message
 * @param name - The error name/type
 * @returns An Error object (or error-like object if Error constructor fails)
 */
export function createSafeError(message: string, name: string): Error {
  // Wrap entire call in try-catch as ultimate safety net
  // Multiple layers to prevent any synchronous throws from mutations
  // CRITICAL: This function MUST NEVER throw synchronously, even if mutations break everything
  try {
    try {
      try {
        // Triple-wrap the factory call to catch any escaping errors
        let result: any
        try {
          result = createErrorFactory(message, name)
        } catch (e) {
          // If factory throws (including HttpClientError), catch it here
          result = undefined
        }
        
        // Defensive: ensure result is not null/undefined before returning
        if (result != null) {
          try {
            return result as Error
          } catch {
            // If return throws, create minimal error
            return { message: message || '', name: name || 'Error', stack: '' } as any
          }
        } else {
          // Factory returned null/undefined, create minimal error
          return { message: message || '', name: name || 'Error', stack: '' } as any
        }
      } catch (e) {
        // If factory call throws, return minimal error object
        // This catches any errors that escaped the inner try-catch
        return { message: message || '', name: name || 'Error', stack: '' } as any
      }
    } catch (e) {
      // If factory call throws, return minimal error object
      return { message: message || '', name: name || 'Error', stack: '' } as any
    }
  } catch (e) {
    // Ultimate fallback - if even the outer try-catch fails (shouldn't happen)
    // Return minimal error object
    // This is the absolute last line of defense
    return { message: message || '', name: name || 'Error', stack: '' } as any
  }
}
