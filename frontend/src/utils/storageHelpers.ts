import type { StorageAdapter } from '../types/adapters'
import { logger } from './logger'
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
  if (!storage) {
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
  if (!storage) {
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
  if (!storage) {
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
  if (!storage) {
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
  if (!storage || typeof storage.clear !== 'function') {
    return false
  }

  try {
    storage.clear()
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
