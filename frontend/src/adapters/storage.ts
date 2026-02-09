/**
 * Storage Adapter Factory
 * Follows Single Responsibility Principle - only handles storage adapter creation
 * Separated from other adapters to improve maintainability and testability
 */

import type { StorageAdapter } from '../types/adapters'
import { isBrowserEnvironment } from '../utils/environment'

/**
 * Storage Adapter Factory
 * Provides factory methods for creating storage adapters
 */
export const StorageAdapterFactory = {
  /**
   * Create storage adapter from Storage object
   * Handles SSR and null/undefined cases
   */
  createStorageAdapter(storage: Storage | null): StorageAdapter | null {
    // Use truthy check to handle falsy values (false, 0, '', etc.) as per original behavior
    // This is intentional defensive programming for edge cases
    if (!storage) {
      return null
    }
    return {
      getItem: (key: string) => storage.getItem(key),
      setItem: (key: string, value: string) => storage.setItem(key, value),
      removeItem: (key: string) => storage.removeItem(key),
      addEventListener: (type: string, listener: EventListener) =>
        window.addEventListener(type, listener),
      removeEventListener: (type: string, listener: EventListener) =>
        window.removeEventListener(type, listener),
    }
  },

  /**
   * Create default localStorage adapter
   */
  createLocalStorageAdapter(): StorageAdapter | null {
    if (!isBrowserEnvironment()) {
      return null
    }
    return this.createStorageAdapter(window.localStorage)
  },

  /**
   * Create default sessionStorage adapter
   */
  createSessionStorageAdapter(): StorageAdapter | null {
    if (!isBrowserEnvironment()) {
      return null
    }
    return this.createStorageAdapter(window.sessionStorage)
  },
}
