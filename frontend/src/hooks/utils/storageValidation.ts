/**
 * Storage Validation Utilities
 * Extracted from multiple hooks for better testability and mutation resistance
 * Single Responsibility: Only validates storage availability and operations
 */

import type { StorageAdapter } from '../../types/adapters'

/**
 * Check if storage is available (not null/undefined)
 * Mutation-resistant: explicit null/undefined checks
 */
export function isStorageAvailable(storage: StorageAdapter | null | undefined): storage is StorageAdapter {
  return storage != null
}

/**
 * Check if storage can be used for saving (storage available and data updated)
 * Mutation-resistant: explicit checks for each condition
 */
export function canSaveToStorage(
  storage: StorageAdapter | null | undefined,
  updated: boolean
): boolean {
  return isStorageAvailable(storage) && updated === true
}

/**
 * Safely get item from storage
 * Mutation-resistant: explicit storage check before access
 */
export function getStorageItem<T>(
  storage: StorageAdapter | null | undefined,
  key: string,
  defaultValue: T
): T {
  if (!isStorageAvailable(storage)) {
    return defaultValue
  }
  
  try {
    const item = storage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    return defaultValue
  }
}

/**
 * Safely set item in storage
 * Mutation-resistant: explicit storage check before access
 */
export function setStorageItem(
  storage: StorageAdapter | null | undefined,
  key: string,
  value: any
): boolean {
  if (!isStorageAvailable(storage)) {
    return false
  }
  
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    return false
  }
}
