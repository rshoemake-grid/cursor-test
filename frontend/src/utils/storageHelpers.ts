import type { StorageAdapter } from '../types/adapters'
import { handleStorageError } from './errorHandler'

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
  // Explicit null/undefined check to prevent mutation survivors
  if (storage === null || storage === undefined) {
    return defaultValue
  }

  try {
    const item = storage.getItem(key)
    if (item === null || item === undefined) {
      return defaultValue
    }
    return JSON.parse(item) as T
  } catch (error) {
    handleStorageError(error, 'getItem', key, {
      context,
      logError: true,
      showNotification: false,
    })
    return defaultValue
  }
}

/**
 * Safe storage set operation with error handling
 */
export function safeStorageSet(
  storage: StorageAdapter | null,
  key: string,
  value: any,
  context?: string
): boolean {
  // Explicit null/undefined check to prevent mutation survivors
  if (storage === null || storage === undefined) {
    return false
  }

  try {
    // Handle undefined values by converting to null
    const valueToStore = value === undefined ? null : value
    storage.setItem(key, JSON.stringify(valueToStore))
    return true
  } catch (error) {
    handleStorageError(error, 'setItem', key, {
      context,
      logError: true,
      showNotification: false,
    })
    return false
  }
}

/**
 * Safe storage remove operation with error handling
 */
export function safeStorageRemove(
  storage: StorageAdapter | null,
  key: string,
  context?: string
): boolean {
  // Explicit null/undefined check to prevent mutation survivors
  if (storage === null || storage === undefined) {
    return false
  }

  try {
    storage.removeItem(key)
    return true
  } catch (error) {
    handleStorageError(error, 'removeItem', key, {
      context,
      logError: true,
      showNotification: false,
    })
    return false
  }
}

/**
 * Check if a storage key exists
 */
export function safeStorageHas(
  storage: StorageAdapter | null,
  key: string,
  context?: string
): boolean {
  // Explicit null/undefined check to prevent mutation survivors
  if (storage === null || storage === undefined) {
    return false
  }

  try {
    const item = storage.getItem(key)
    return item !== null && item !== undefined
  } catch (error) {
    handleStorageError(error, 'getItem', key, {
      context,
      logError: true,
      showNotification: false,
    })
    return false
  }
}

/**
 * Clear all storage (use with caution)
 */
export function safeStorageClear(
  storage: StorageAdapter | null,
  context?: string
): boolean {
  // Explicit checks to prevent mutation survivors
  if (storage === null || storage === undefined) {
    return false
  }
  if (typeof (storage as any).clear !== 'function') {
    return false
  }

  try {
    (storage as any).clear()
    return true
  } catch (error) {
    handleStorageError(error, 'clear', 'all', {
      context,
      logError: true,
      showNotification: false,
    })
    return false
  }
}
