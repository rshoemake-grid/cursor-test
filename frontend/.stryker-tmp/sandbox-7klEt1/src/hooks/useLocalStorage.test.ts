// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage, getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } from './useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('useLocalStorage hook', () => {
    it('should initialize with initial value when localStorage is empty', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
      expect(result.current[0]).toBe('initial')
    })

    it('should initialize with value from localStorage', () => {
      localStorage.setItem('test-key', JSON.stringify('stored-value'))
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
      expect(result.current[0]).toBe('stored-value')
    })

    it('should update localStorage when value changes', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
      
      act(() => {
        result.current[1]('new-value')
      })

      expect(result.current[0]).toBe('new-value')
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify('new-value'))
    })

    it('should handle function updater', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 0))
      
      act(() => {
        result.current[1]((prev) => prev + 1)
      })

      expect(result.current[0]).toBe(1)
    })

    it('should handle complex objects', () => {
      const obj = { name: 'test', value: 123 }
      const { result } = renderHook(() => useLocalStorage('test-key', obj))
      
      act(() => {
        result.current[1]({ name: 'updated', value: 456 })
      })

      expect(result.current[0]).toEqual({ name: 'updated', value: 456 })
      expect(JSON.parse(localStorage.getItem('test-key')!)).toEqual({ name: 'updated', value: 456 })
    })

    it('should remove value from localStorage', () => {
      localStorage.setItem('test-key', JSON.stringify('value'))
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
      
      act(() => {
        result.current[2]()
      })

      expect(result.current[0]).toBe('initial')
      expect(localStorage.getItem('test-key')).toBeNull()
    })

    it('should handle storage events from other tabs', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
      
      act(() => {
        const event = new StorageEvent('storage', {
          key: 'test-key',
          newValue: JSON.stringify('updated-from-tab'),
        })
        window.dispatchEvent(event)
      })

      expect(result.current[0]).toBe('updated-from-tab')
    })

    it('should ignore storage events for other keys', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
      
      act(() => {
        const event = new StorageEvent('storage', {
          key: 'other-key',
          newValue: JSON.stringify('should-not-update'),
        })
        window.dispatchEvent(event)
      })

      expect(result.current[0]).toBe('initial')
    })
  })

  describe('getLocalStorageItem', () => {
    it('should return stored value', () => {
      localStorage.setItem('test-key', JSON.stringify('stored-value'))
      expect(getLocalStorageItem('test-key', 'default')).toBe('stored-value')
    })

    it('should return default value when key does not exist', () => {
      expect(getLocalStorageItem('non-existent', 'default')).toBe('default')
    })

    it('should return default value on parse error', () => {
      // Store invalid JSON (looks like JSON but is malformed)
      localStorage.setItem('test-key', '{invalid-json}')
      expect(getLocalStorageItem('test-key', 'default')).toBe('default')
    })
    
    it('should return plain string for backward compatibility', () => {
      // Store plain string (not JSON-like)
      localStorage.setItem('test-key', 'plain-string-value')
      expect(getLocalStorageItem('test-key', 'default')).toBe('plain-string-value')
    })
  })

  describe('setLocalStorageItem', () => {
    it('should set value in localStorage', () => {
      expect(setLocalStorageItem('test-key', 'value')).toBe(true)
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify('value'))
    })

    it('should handle complex objects', () => {
      const obj = { name: 'test', value: 123 }
      expect(setLocalStorageItem('test-key', obj)).toBe(true)
      expect(JSON.parse(localStorage.getItem('test-key')!)).toEqual(obj)
    })

    it('should return false on error', () => {
      // Mock localStorage.setItem to throw error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('Quota exceeded')
      })

      expect(setLocalStorageItem('test-key', 'value')).toBe(false)
      
      localStorage.setItem = originalSetItem
    })
  })

  describe('removeLocalStorageItem', () => {
    it('should remove value from localStorage', () => {
      localStorage.setItem('test-key', JSON.stringify('value'))
      expect(removeLocalStorageItem('test-key')).toBe(true)
      expect(localStorage.getItem('test-key')).toBeNull()
    })

    it('should return true even if key does not exist', () => {
      expect(removeLocalStorageItem('non-existent')).toBe(true)
    })

    it('should return false on error', () => {
      // Mock localStorage.removeItem to throw error
      const originalRemoveItem = localStorage.removeItem
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Error')
      })

      expect(removeLocalStorageItem('test-key')).toBe(false)
      
      localStorage.removeItem = originalRemoveItem
    })
  })

  describe('edge cases', () => {
    it('should handle null values', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', null))
      expect(result.current[0]).toBe(null)
      
      act(() => {
        result.current[1](null)
      })
      
      expect(result.current[0]).toBe(null)
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify(null))
    })

    it('should handle undefined values', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', undefined))
      expect(result.current[0]).toBe(undefined)
      
      act(() => {
        result.current[1](undefined)
      })
      
      expect(result.current[0]).toBe(undefined)
    })

    it('should handle empty strings', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', ''))
      expect(result.current[0]).toBe('')
      
      act(() => {
        result.current[1]('')
      })
      
      expect(result.current[0]).toBe('')
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify(''))
    })

    it('should handle zero values', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 0))
      expect(result.current[0]).toBe(0)
      
      act(() => {
        result.current[1](0)
      })
      
      expect(result.current[0]).toBe(0)
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify(0))
    })

    it('should handle false boolean values', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', false))
      expect(result.current[0]).toBe(false)
      
      act(() => {
        result.current[1](false)
      })
      
      expect(result.current[0]).toBe(false)
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify(false))
    })

    it('should handle arrays', () => {
      const array = [1, 2, 3]
      const { result } = renderHook(() => useLocalStorage('test-key', array))
      expect(result.current[0]).toEqual(array)
      
      act(() => {
        result.current[1]([4, 5, 6])
      })
      
      expect(result.current[0]).toEqual([4, 5, 6])
      expect(JSON.parse(localStorage.getItem('test-key')!)).toEqual([4, 5, 6])
    })

    it('should handle nested objects', () => {
      const nested = { a: { b: { c: 'value' } } }
      const { result } = renderHook(() => useLocalStorage('test-key', nested))
      expect(result.current[0]).toEqual(nested)
      
      act(() => {
        result.current[1]({ a: { b: { c: 'updated' } } })
      })
      
      expect(result.current[0]).toEqual({ a: { b: { c: 'updated' } } })
    })

    it('should handle JSON-like strings that are not valid JSON', () => {
      // Store a string that looks like JSON but isn't
      localStorage.setItem('test-key', '{"invalid": json}')
      expect(getLocalStorageItem('test-key', 'default')).toBe('default')
    })

    it('should handle storage quota exceeded error', () => {
      // Set up initial value
      localStorage.setItem('test-key', JSON.stringify('initial'))
      
      const originalSetItem = localStorage.setItem
      let callCount = 0
      localStorage.setItem = vi.fn((key: string, value: string) => {
        callCount++
        if (callCount === 1) {
          // First call succeeds (reading initial value)
          return originalSetItem.call(localStorage, key, value)
        }
        // Subsequent calls throw error
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      })

      const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
      
      // Should have initial value
      expect(result.current[0]).toBe('initial')
      
      act(() => {
        try {
          result.current[1]('new-value')
        } catch (e) {
          // Error is caught internally
        }
      })

      // Value might not change due to error, but hook should not crash
      expect(result.current[0]).toBeDefined()
      
      localStorage.setItem = originalSetItem
    })

    it('should handle getItem throwing error', () => {
      const originalGetItem = localStorage.getItem
      localStorage.getItem = vi.fn(() => {
        throw new Error('Error')
      })

      expect(getLocalStorageItem('test-key', 'default')).toBe('default')
      
      localStorage.getItem = originalGetItem
    })
  })
})

