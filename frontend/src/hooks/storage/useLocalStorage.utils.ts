/**
 * LocalStorage Utility Functions
 * Extracted from useLocalStorage.ts to improve testability and reduce complexity
 */

import type { StorageAdapter } from '../../types/adapters'

// Type for logger to avoid circular reference
type Logger = {
  debug: (...args: any[]) => void
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
  log: (...args: any[]) => void
}

/**
 * Parse JSON with error handling
 * Returns parsed value or null if parsing fails
 */
export function parseJsonSafely<T>(jsonString: string | null, logger?: Logger): T | null {
  if (!jsonString) {
    return null
  }

  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    if (logger) {
      logger.error('Failed to parse JSON:', error)
    }
    return null
  }
}

/**
 * Check if string looks like JSON (starts with { or [)
 */
export function looksLikeJson(item: string): boolean {
  const trimmed = item.trim()
  return trimmed.startsWith('{') || trimmed.startsWith('[')
}

/**
 * Convert value to storage-safe string
 * Handles undefined by converting to null
 */
export function stringifyForStorage<T>(value: T): string {
  // JSON.stringify(undefined) returns undefined, which causes issues
  // Convert undefined to null for storage
  const valueToStore = value === undefined ? null : value
  return JSON.stringify(valueToStore)
}

/**
 * Read item from storage with error handling
 */
export function readStorageItem<T>(
  storage: StorageAdapter | null,
  key: string,
  defaultValue: T,
  logger?: Logger
): T {
  if (!storage) {
    return defaultValue
  }

  try {
    const item = storage.getItem(key)
    if (!item) {
      return defaultValue
    }

    // Try to parse as JSON first
    const parsed = parseJsonSafely<T>(item, logger)
    if (parsed !== null) {
      return parsed
    }

    // If JSON.parse fails, it might be a plain string stored directly
    // Check if it looks like it was meant to be JSON
    if (looksLikeJson(item)) {
      // Invalid JSON that was meant to be JSON - return default
      if (logger) {
        logger.warn(`localStorage key "${key}" contains invalid JSON. Returning default value.`, item)
      }
      return defaultValue
    }

    // Plain string that was stored directly (for backward compatibility)
    // Only return as-is if default is also a string type
    if (typeof defaultValue === 'string' || defaultValue === null) {
      return item as T
    }

    // For non-string types, return default
    if (logger) {
      logger.warn(`localStorage key "${key}" contains plain string but expected JSON. Returning default value.`, item)
    }
    return defaultValue
  } catch (error) {
    if (logger) {
      logger.error(`Error reading localStorage key "${key}":`, error)
    }
    return defaultValue
  }
}

/**
 * Write item to storage with error handling
 */
export function writeStorageItem<T>(
  storage: StorageAdapter | null,
  key: string,
  value: T,
  logger?: Logger
): boolean {
  if (!storage) {
    return false
  }

  try {
    const valueToStoreString = stringifyForStorage(value)
    storage.setItem(key, valueToStoreString)
    return true
  } catch (error) {
    if (logger) {
      logger.error(`Error setting localStorage key "${key}":`, error)
    }
    return false
  }
}

/**
 * Remove item from storage with error handling
 */
export function deleteStorageItem(
  storage: StorageAdapter | null,
  key: string,
  logger?: Logger
): boolean {
  if (!storage) {
    return false
  }

  try {
    storage.removeItem(key)
    return true
  } catch (error) {
    if (logger) {
      logger.error(`Error removing localStorage key "${key}":`, error)
    }
    return false
  }
}

/**
 * Check if storage event should be handled
 */
export function shouldHandleStorageEvent(eventKey: string | null, targetKey: string, newValue: string | null): boolean {
  return eventKey === targetKey && newValue !== null
}
