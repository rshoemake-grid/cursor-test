import { useState, useEffect, useCallback } from 'react'
import { logger } from '../../utils/logger'
import type { StorageAdapter } from '../../types/adapters'
import { defaultAdapters } from '../../types/adapters'
import {
  readStorageItem,
  writeStorageItem,
  deleteStorageItem,
  parseJsonSafely,
  shouldHandleStorageEvent
} from './useLocalStorage.utils'
import { nullishCoalesce } from '../utils/nullishCoalescing'

/**
 * Custom hook for localStorage with consistent error handling
 * Follows Dependency Inversion Principle by abstracting storage access
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    storage?: StorageAdapter | null
    logger?: typeof logger
  }
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const storage = nullishCoalesce(options?.storage, defaultAdapters.createLocalStorageAdapter())
  const injectedLogger = nullishCoalesce(options?.logger, logger)

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    return readStorageItem(storage, key, initialValue, injectedLogger)
  })

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Save state
      setStoredValue(valueToStore)
      
      // Save to local storage (handles errors internally)
      writeStorageItem(storage, key, valueToStore, injectedLogger)
    },
    [key, storedValue, storage, injectedLogger]
  )

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    setStoredValue(initialValue)
    // Remove from storage (handles errors internally)
    deleteStorageItem(storage, key, injectedLogger)
  }, [key, initialValue, storage, injectedLogger])

  // Listen for changes to this key in other tabs/windows
  useEffect(() => {
    if (!storage) {
      return
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (shouldHandleStorageEvent(e.key, key, e.newValue)) {
        const parsed = parseJsonSafely<T>(e.newValue, injectedLogger)
        if (parsed !== null) {
          setStoredValue(parsed)
        }
      }
    }

    storage.addEventListener('storage', handleStorageChange as any)
    return () => storage.removeEventListener('storage', handleStorageChange as any)
  }, [key, storage, injectedLogger])

  return [storedValue, setValue, removeValue]
}

/**
 * Simple localStorage getter with error handling
 * Handles both JSON strings and plain strings (for backward compatibility)
 */
export function getLocalStorageItem<T>(
  key: string,
  defaultValue: T,
  options?: {
    storage?: StorageAdapter | null
    logger?: typeof logger
  }
): T {
  const storage = nullishCoalesce(options?.storage, defaultAdapters.createLocalStorageAdapter())
  const injectedLogger = nullishCoalesce(options?.logger, logger)
  return readStorageItem(storage, key, defaultValue, injectedLogger)
}

/**
 * Simple localStorage setter with error handling
 */
export function setLocalStorageItem<T>(
  key: string,
  value: T,
  options?: {
    storage?: StorageAdapter | null
    logger?: typeof logger
  }
): boolean {
  const storage = nullishCoalesce(options?.storage, defaultAdapters.createLocalStorageAdapter())
  const injectedLogger = nullishCoalesce(options?.logger, logger)
  return writeStorageItem(storage, key, value, injectedLogger)
}

/**
 * Simple localStorage remover with error handling
 */
export function removeLocalStorageItem(
  key: string,
  options?: {
    storage?: StorageAdapter | null
    logger?: typeof logger
  }
): boolean {
  const storage = nullishCoalesce(options?.storage, defaultAdapters.createLocalStorageAdapter())
  const injectedLogger = nullishCoalesce(options?.logger, logger)
  return deleteStorageItem(storage, key, injectedLogger)
}

