import { useState, useEffect, useCallback } from 'react'
import { logger } from '../utils/logger'

/**
 * Custom hook for localStorage with consistent error handling
 * Follows Dependency Inversion Principle by abstracting storage access
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      logger.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value
        
        // Save state
        setStoredValue(valueToStore)
        
        // Save to local storage
        if (typeof window !== 'undefined') {
          // JSON.stringify(undefined) returns undefined, which causes issues
          // Convert undefined to null for storage
          const valueToStoreString = valueToStore === undefined ? JSON.stringify(null) : JSON.stringify(valueToStore)
          window.localStorage.setItem(key, valueToStoreString)
        }
      } catch (error) {
        logger.error(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      logger.error(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  // Listen for changes to this key in other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          logger.error(`Error parsing storage event for key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setValue, removeValue]
}

/**
 * Simple localStorage getter with error handling
 * Handles both JSON strings and plain strings (for backward compatibility)
 */
export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue
  }
  
  try {
    const item = window.localStorage.getItem(key)
    if (!item) {
      return defaultValue
    }
    
    // Try to parse as JSON first
    try {
      return JSON.parse(item)
    } catch {
      // If JSON.parse fails, it might be a plain string stored directly
      // This can happen if code previously stored values without JSON.stringify
      // Check if it looks like it was meant to be JSON (starts with { or [)
      const looksLikeJson = item.trim().startsWith('{') || item.trim().startsWith('[')
      
      if (looksLikeJson) {
        // Invalid JSON that was meant to be JSON - return default
        logger.warn(`localStorage key "${key}" contains invalid JSON. Returning default value.`, item)
        return defaultValue
      }
      
      // Plain string that was stored directly (for backward compatibility)
      // Only return as-is if default is also a string type
      if (typeof defaultValue === 'string' || defaultValue === null) {
        return item as T
      }
      
      // For non-string types, return default
      logger.warn(`localStorage key "${key}" contains plain string but expected JSON. Returning default value.`, item)
      return defaultValue
    }
  } catch (error) {
    logger.error(`Error reading localStorage key "${key}":`, error)
    return defaultValue
  }
}

/**
 * Simple localStorage setter with error handling
 */
export function setLocalStorageItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  
  try {
    // JSON.stringify(undefined) returns undefined, which causes issues with localStorage.setItem
    // Convert undefined to null for storage
    const valueToStore = value === undefined ? null : value
    window.localStorage.setItem(key, JSON.stringify(valueToStore))
    return true
  } catch (error) {
    logger.error(`Error setting localStorage key "${key}":`, error)
    return false
  }
}

/**
 * Simple localStorage remover with error handling
 */
export function removeLocalStorageItem(key: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  
  try {
    window.localStorage.removeItem(key)
    return true
  } catch (error) {
    logger.error(`Error removing localStorage key "${key}":`, error)
    return false
  }
}

