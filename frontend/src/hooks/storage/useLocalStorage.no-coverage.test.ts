/**
 * Tests for no-coverage paths in useLocalStorage.ts
 * 
 * These tests target code paths that are not covered by normal tests,
 * such as catch blocks, optional chaining, and error handling.
 */

import { renderHook, act } from '@testing-library/react'
import { useLocalStorage, getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } from './useLocalStorage'
import { logger } from '../../utils/logger'

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

describe('useLocalStorage - No Coverage Paths', () => {
  let mockStorage: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
  })

  describe('useLocalStorage - catch blocks', () => {
    it('should handle storage.getItem throwing in useState initializer', () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied')
      })

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'default', { storage: mockStorage })
      )

      // Should handle error in catch block (line 30) and return initialValue
      expect(result.current[0]).toBe('default')
      expect(logger.error).toHaveBeenCalledWith(
        'Error reading localStorage key "test-key":',
        expect.any(Error)
      )
    })

    it('should handle JSON.parse throwing in useState initializer', () => {
      // Use a string that looks like JSON but is invalid to trigger JSON.parse error
      mockStorage.getItem.mockReturnValue('{invalid json')

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'default', { storage: mockStorage })
      )

      // Should handle JSON.parse error and return default when it looks like JSON
      expect(result.current[0]).toBe('default')
      expect(logger.error).toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('contains invalid JSON'),
        '{invalid json'
      )
    })

    it('should handle storage.setItem throwing in setValue', () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'default', { storage: mockStorage })
      )

      act(() => {
        result.current[1]('new-value')
      })

      // Should handle error in catch block (line 54)
      expect(logger.error).toHaveBeenCalledWith(
        'Error setting localStorage key "test-key":',
        expect.any(Error)
      )
      // State should still update even if storage fails
      expect(result.current[0]).toBe('new-value')
    })

    it('should handle storage.removeItem throwing in removeValue', () => {
      mockStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage access denied')
      })

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial', { storage: mockStorage })
      )

      act(() => {
        result.current[2]() // removeValue
      })

      // Should handle error in catch block (line 68)
      expect(logger.error).toHaveBeenCalledWith(
        'Error removing localStorage key "test-key":',
        expect.any(Error)
      )
      // State should reset to initialValue even if storage fails
      expect(result.current[0]).toBe('initial')
    })

    it('should handle JSON.parse throwing in useEffect storage event handler', () => {
      renderHook(() =>
        useLocalStorage('test-key', 'default', { storage: mockStorage })
      )

      // Simulate storage event with invalid JSON
      const handleStorageChange = mockStorage.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'storage'
      )?.[1]

      if (handleStorageChange) {
        const event = {
          key: 'test-key',
          newValue: 'invalid json',
        }

        act(() => {
          handleStorageChange(event)
        })

        // Should handle JSON.parse error - error message format changed in utility function
        expect(logger.error).toHaveBeenCalledWith(
          'Failed to parse JSON:',
          expect.any(Error)
        )
      }
    })
  })

  describe('useLocalStorage - optional chaining', () => {
    it('should verify optional chaining - options?.storage', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'default', { storage: null })
      )

      // Should use fallback when storage is null
      expect(result.current[0]).toBe('default')
    })

    it('should verify optional chaining - options?.logger', () => {
      const customLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      }

      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Error')
      })

      renderHook(() =>
        useLocalStorage('test-key', 'default', {
          storage: mockStorage,
          logger: customLogger,
        })
      )

      // Should use custom logger when provided
      expect(customLogger.error).toHaveBeenCalled()
    })
  })

  describe('getLocalStorageItem - catch blocks and logical operators', () => {
    it('should handle storage.getItem throwing', () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied')
      })

      const result = getLocalStorageItem('test-key', 'default', {
        storage: mockStorage,
      })

      // Should handle error in catch block (line 146)
      expect(result).toBe('default')
      expect(logger.error).toHaveBeenCalled()
    })

    it('should handle JSON.parse throwing - invalid JSON that looks like JSON', () => {
      mockStorage.getItem.mockReturnValue('{invalid json')

      const result = getLocalStorageItem('test-key', 'default', {
        storage: mockStorage,
      })

      // Should handle JSON.parse error and return default when it looks like JSON (line 124-133)
      expect(result).toBe('default')
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('contains invalid JSON'),
        '{invalid json'
      )
    })

    it('should verify logical OR - item.trim().startsWith("{") || item.trim().startsWith("[")', () => {
      // Test with item starting with {
      mockStorage.getItem.mockReturnValue('{invalid json')
      const result1 = getLocalStorageItem('test-key', 'default', {
        storage: mockStorage,
      })
      expect(result1).toBe('default')
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('contains invalid JSON'),
        '{invalid json'
      )

      // Test with item starting with [
      mockStorage.getItem.mockReturnValue('[invalid json')
      const result2 = getLocalStorageItem('test-key', 'default', {
        storage: mockStorage,
      })
      expect(result2).toBe('default')
    })

    it('should handle plain string (backward compatibility)', () => {
      mockStorage.getItem.mockReturnValue('plain string')

      const result = getLocalStorageItem('test-key', 'default', {
        storage: mockStorage,
      })

      // Should return plain string if default is string type
      expect(result).toBe('plain string')
    })

    it('should verify typeof check - typeof defaultValue === "string"', () => {
      mockStorage.getItem.mockReturnValue('plain string')

      // Test with string default
      const result1 = getLocalStorageItem('test-key', 'default-string', {
        storage: mockStorage,
      })
      expect(result1).toBe('plain string')

      // Test with non-string default
      const result2 = getLocalStorageItem('test-key', 123, {
        storage: mockStorage,
      })
      expect(result2).toBe(123) // Should return default for non-string
    })
  })

  describe('setLocalStorageItem - catch block', () => {
    it('should handle storage.setItem throwing', () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const result = setLocalStorageItem('test-key', 'value', {
        storage: mockStorage,
      })

      // Should handle error in catch block (line 176)
      expect(result).toBe(false)
      expect(logger.error).toHaveBeenCalledWith(
        'Error setting localStorage key "test-key":',
        expect.any(Error)
      )
    })

    it('should handle undefined value conversion', () => {
      const result = setLocalStorageItem('test-key', undefined, {
        storage: mockStorage,
      })

      // Should convert undefined to null: value === undefined ? null : value
      expect(result).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(null)
      )
    })
  })

  describe('removeLocalStorageItem - catch block', () => {
    it('should handle storage.removeItem throwing', () => {
      mockStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage access denied')
      })

      const result = removeLocalStorageItem('test-key', {
        storage: mockStorage,
      })

      // Should handle error in catch block (line 202)
      expect(result).toBe(false)
      expect(logger.error).toHaveBeenCalledWith(
        'Error removing localStorage key "test-key":',
        expect.any(Error)
      )
    })
  })

  describe('useLocalStorage - storage event listener', () => {
    it('should return early when storage is null (lines 60-61)', () => {
      // Test the early return path when storage is null from the start
      // This tests the useEffect early return: if (!storage) return
      const { result, rerender } = renderHook(
        ({ storage }) => useLocalStorage('test-key', 'default', { storage }),
        {
          initialProps: { storage: null },
        }
      )

      // Hook should work with null storage (uses default value)
      expect(result.current[0]).toBe('default')

      // Verify no event listener was added (early return path taken)
      // When storage is null, the useEffect returns early at line 60-61
      expect(mockStorage.addEventListener).not.toHaveBeenCalled()

      // Rerender with valid storage - should now set up listener
      rerender({ storage: mockStorage })
      expect(mockStorage.addEventListener).toHaveBeenCalledWith('storage', expect.any(Function))

      // Rerender back to null - should trigger early return again
      jest.clearAllMocks()
      rerender({ storage: null })
      
      // Verify no new event listener was added (early return path taken)
      const addEventListenerCalls = mockStorage.addEventListener.mock.calls.filter(
        (call) => call[0] === 'storage'
      )
      expect(addEventListenerCalls.length).toBe(0)
    })

    it('should update storedValue when parsed value is not null (lines 67-68)', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'default', { storage: mockStorage })
      )

      // Simulate storage event with valid JSON value
      const storageEvent = new StorageEvent('storage', {
        key: 'test-key',
        newValue: JSON.stringify({ data: 'updated' }),
      })

      act(() => {
        // Trigger the storage event handler
        const handler = mockStorage.addEventListener.mock.calls.find(
          (call) => call[0] === 'storage'
        )?.[1]
        if (handler) {
          handler(storageEvent)
        }
      })

      // Should update storedValue when parsed value is not null
      expect(result.current[0]).toEqual({ data: 'updated' })
    })

    it('should not update storedValue when parsed value is null', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'default', { storage: mockStorage })
      )

      const initialValue = result.current[0]

      // Simulate storage event with invalid JSON (parsed as null)
      const storageEvent = new StorageEvent('storage', {
        key: 'test-key',
        newValue: 'invalid-json',
      })

      act(() => {
        const handler = mockStorage.addEventListener.mock.calls.find(
          (call) => call[0] === 'storage'
        )?.[1]
        if (handler) {
          handler(storageEvent)
        }
      })

      // Should not update when parsed value is null
      expect(result.current[0]).toBe(initialValue)
    })
  })
})
