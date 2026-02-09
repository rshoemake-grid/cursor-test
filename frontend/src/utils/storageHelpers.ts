import type { StorageAdapter } from '../types/adapters'
import { handleStorageError, type ErrorHandlerOptions } from './errorHandler'
import { isNullOrUndefined, isDefined } from './typeGuards'

/**
 * Default error handling options for storage operations
 * Follows DRY principle by eliminating duplicated error option objects
 */
const DEFAULT_STORAGE_ERROR_OPTIONS: ErrorHandlerOptions = {
  logError: true,
  showNotification: false,
} as const

/**
 * Error handling wrapper for storage operations
 * Follows DRY principle by eliminating duplicated error handling code
 * Follows SRP by separating error handling from business logic
 * 
 * @param storage - The storage adapter (may be null)
 * @param operation - Function that performs the storage operation
 * @param operationName - Name of the operation for error reporting
 * @param key - Storage key for error reporting
 * @param defaultValue - Value to return on error or null storage
 * @param context - Optional context for error logging
 * @returns Result of operation or defaultValue
 */
function withStorageErrorHandling<T>(
  storage: StorageAdapter | null,
  operation: (storage: StorageAdapter) => T,
  operationName: string,
  key: string,
  defaultValue: T,
  context?: string
): T {
  // Explicit null/undefined check to prevent mutation survivors
  if (isNullOrUndefined(storage) === true) {
    return defaultValue
  }

  try {
    return operation(storage)
  } catch (error) {
    handleStorageError(error, operationName, key, {
      ...DEFAULT_STORAGE_ERROR_OPTIONS,
      context,
    })
    return defaultValue
  }
}

/**
 * Safe storage get operation with error handling
 * Follows DRY principle by eliminating duplicated storage access code
 */
export function safeStorageGet<T>(
  storage: StorageAdapter | null,
  key: string,
  defaultValue: T,
  context?: string
): T {
  return withStorageErrorHandling(
    storage,
    (storage) => {
      const item = storage.getItem(key)
      // Explicit null/undefined check to prevent mutation survivors
      if (isNullOrUndefined(item) === true) {
        return defaultValue
      }
      // Explicit JSON.parse error handling to prevent mutation survivors
      try {
        return JSON.parse(item) as T
      } catch (parseError) {
        // Explicitly handle JSON.parse errors before outer wrapper
        handleStorageError(parseError, 'getItem', key, {
          ...DEFAULT_STORAGE_ERROR_OPTIONS,
          context,
        })
        return defaultValue
      }
    },
    'getItem',
    key,
    defaultValue,
    context
  )
}

/**
 * Safe storage set operation with error handling
 * Follows DRY principle by using error handling wrapper
 * 
 * @template T - The type of value being stored
 */
export function safeStorageSet<T>(
  storage: StorageAdapter | null,
  key: string,
  value: T,
  context?: string
): boolean {
  return withStorageErrorHandling(
    storage,
    (storage) => {
      // Handle undefined/null values by converting to null
      // Explicit boolean check to prevent mutation survivors
      const isNullOrUndef = isNullOrUndefined(value) === true
      const valueToStore = isNullOrUndef === true ? null : value
      storage.setItem(key, JSON.stringify(valueToStore))
      return true
    },
    'setItem',
    key,
    false, // defaultValue
    context
  )
}

/**
 * Safe storage remove operation with error handling
 * Follows DRY principle by using error handling wrapper
 */
export function safeStorageRemove(
  storage: StorageAdapter | null,
  key: string,
  context?: string
): boolean {
  return withStorageErrorHandling(
    storage,
    (storage) => {
      storage.removeItem(key)
      return true
    },
    'removeItem',
    key,
    false, // defaultValue
    context
  )
}

/**
 * Check if a storage key exists
 * Follows DRY principle by using error handling wrapper
 */
export function safeStorageHas(
  storage: StorageAdapter | null,
  key: string,
  context?: string
): boolean {
  return withStorageErrorHandling(
    storage,
    (storage) => {
      const item = storage.getItem(key)
      return isDefined(item) === true
    },
    'getItem',
    key,
    false, // defaultValue
    context
  )
}

/**
 * Interface for storage adapter with clear method
 * Used for type-safe access to clear functionality
 */
interface StorageWithClear extends StorageAdapter {
  clear(): void
}

/**
 * Type guard to check if storage has clear method
 * 
 * @param storage - The storage adapter to check
 * @returns True if storage has clear method
 */
function hasClearMethod(storage: StorageAdapter): storage is StorageWithClear {
  return typeof (storage as StorageWithClear).clear === 'function'
}

/**
 * Clear all storage (use with caution)
 * Follows DRY principle by using error handling wrapper
 */
export function safeStorageClear(
  storage: StorageAdapter | null,
  context?: string
): boolean {
  return withStorageErrorHandling(
    storage,
    (storage) => {
      // Check if clear function exists before calling
      // Use type guard for explicit check
      const hasClear = hasClearMethod(storage)
      if (hasClear === false) {
        return false
      }
      storage.clear()
      return true
    },
    'clear',
    'all',
    false, // defaultValue
    context
  )
}
