/**
 * Tests for no-coverage paths in useLocalStorage.utils.ts
 * 
 * These tests target code paths that are not covered by normal tests,
 * such as catch blocks, error handling, and edge cases.
 */

import {
  parseJsonSafely,
  looksLikeJson,
  stringifyForStorage,
  readStorageItem,
  writeStorageItem,
  deleteStorageItem,
  shouldHandleStorageEvent,
} from './useLocalStorage.utils'
import type { StorageAdapter } from '../../types/adapters'

// Mock logger type
type Logger = {
  debug: (...args: any[]) => void
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
  log: (...args: any[]) => void
}

describe('useLocalStorage.utils - No Coverage Paths', () => {
  let mockLogger: Logger
  let mockStorage: StorageAdapter

  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
    }
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
  })

  describe('parseJsonSafely', () => {
    it('should return null when jsonString is null', () => {
      const result = parseJsonSafely<string>(null)
      expect(result).toBeNull()
    })

    it('should return null when jsonString is empty string', () => {
      const result = parseJsonSafely<string>('')
      expect(result).toBeNull()
    })

    it('should parse valid JSON string', () => {
      const result = parseJsonSafely<{ key: string }>('{"key":"value"}')
      expect(result).toEqual({ key: 'value' })
    })

    it('should return null and log error when JSON parsing fails', () => {
      const invalidJson = '{invalid json}'
      const result = parseJsonSafely<string>(invalidJson, mockLogger)
      
      expect(result).toBeNull()
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to parse JSON:', expect.any(Error))
    })

    it('should return null without logging when logger is not provided', () => {
      const invalidJson = '{invalid json}'
      const result = parseJsonSafely<string>(invalidJson)
      
      expect(result).toBeNull()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  describe('looksLikeJson', () => {
    it('should return true for string starting with {', () => {
      expect(looksLikeJson('{"key":"value"}')).toBe(true)
    })

    it('should return true for string starting with [', () => {
      expect(looksLikeJson('[1,2,3]')).toBe(true)
    })

    it('should return true for string with whitespace before {', () => {
      expect(looksLikeJson('  {"key":"value"}')).toBe(true)
    })

    it('should return true for string with whitespace before [', () => {
      expect(looksLikeJson('  [1,2,3]')).toBe(true)
    })

    it('should return false for plain string', () => {
      expect(looksLikeJson('plain string')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(looksLikeJson('')).toBe(false)
    })

    it('should return false for string with only whitespace', () => {
      expect(looksLikeJson('   ')).toBe(false)
    })
  })

  describe('stringifyForStorage', () => {
    it('should stringify regular value', () => {
      const result = stringifyForStorage({ key: 'value' })
      expect(result).toBe('{"key":"value"}')
    })

    it('should convert undefined to null and stringify', () => {
      const result = stringifyForStorage(undefined)
      expect(result).toBe('null')
    })

    it('should stringify null', () => {
      const result = stringifyForStorage(null)
      expect(result).toBe('null')
    })

    it('should stringify string value', () => {
      const result = stringifyForStorage('test')
      expect(result).toBe('"test"')
    })

    it('should stringify number value', () => {
      const result = stringifyForStorage(42)
      expect(result).toBe('42')
    })

    it('should stringify boolean value', () => {
      const result = stringifyForStorage(true)
      expect(result).toBe('true')
    })
  })

  describe('readStorageItem', () => {
    it('should return defaultValue when storage is null', () => {
      const result = readStorageItem(null, 'key', 'default')
      expect(result).toBe('default')
    })

    it('should return defaultValue when item is null', () => {
      mockStorage.getItem.mockReturnValue(null)
      const result = readStorageItem(mockStorage, 'key', 'default')
      expect(result).toBe('default')
    })

    it('should return defaultValue when item is empty string', () => {
      mockStorage.getItem.mockReturnValue('')
      const result = readStorageItem(mockStorage, 'key', 'default')
      expect(result).toBe('default')
    })

    it('should parse and return valid JSON', () => {
      mockStorage.getItem.mockReturnValue('{"key":"value"}')
      const result = readStorageItem(mockStorage, 'key', 'default')
      expect(result).toEqual({ key: 'value' })
    })

    it('should return defaultValue and log warning for invalid JSON that looks like JSON', () => {
      mockStorage.getItem.mockReturnValue('{invalid json}')
      const result = readStorageItem(mockStorage, 'key', 'default', mockLogger)
      
      expect(result).toBe('default')
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'localStorage key "key" contains invalid JSON. Returning default value.',
        '{invalid json}'
      )
    })

    it('should return plain string when default is string', () => {
      mockStorage.getItem.mockReturnValue('plain string')
      const result = readStorageItem(mockStorage, 'key', 'default')
      expect(result).toBe('plain string')
    })

    it('should return plain string when default is null', () => {
      mockStorage.getItem.mockReturnValue('plain string')
      const result = readStorageItem(mockStorage, 'key', null)
      expect(result).toBe('plain string')
    })

    it('should return defaultValue and log warning for plain string when default is not string', () => {
      mockStorage.getItem.mockReturnValue('plain string')
      const result = readStorageItem(mockStorage, 'key', 42, mockLogger)
      
      expect(result).toBe(42)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'localStorage key "key" contains plain string but expected JSON. Returning default value.',
        'plain string'
      )
    })

    it('should return defaultValue and log error when storage.getItem throws', () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied')
      })
      const result = readStorageItem(mockStorage, 'key', 'default', mockLogger)
      
      expect(result).toBe('default')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error reading localStorage key "key":',
        expect.any(Error)
      )
    })

    it('should return defaultValue without logging when storage.getItem throws and logger is not provided', () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied')
      })
      const result = readStorageItem(mockStorage, 'key', 'default')
      
      expect(result).toBe('default')
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  describe('writeStorageItem', () => {
    it('should return false when storage is null', () => {
      const result = writeStorageItem(null, 'key', 'value')
      expect(result).toBe(false)
    })

    it('should write value to storage successfully', () => {
      const result = writeStorageItem(mockStorage, 'key', 'value')
      
      expect(result).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalledWith('key', '"value"')
    })

    it('should handle undefined value by converting to null', () => {
      const result = writeStorageItem(mockStorage, 'key', undefined)
      
      expect(result).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalledWith('key', 'null')
    })

    it('should return false and log error when storage.setItem throws', () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })
      const result = writeStorageItem(mockStorage, 'key', 'value', mockLogger)
      
      expect(result).toBe(false)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error setting localStorage key "key":',
        expect.any(Error)
      )
    })

    it('should return false without logging when storage.setItem throws and logger is not provided', () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })
      const result = writeStorageItem(mockStorage, 'key', 'value')
      
      expect(result).toBe(false)
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  describe('deleteStorageItem', () => {
    it('should return false when storage is null', () => {
      const result = deleteStorageItem(null, 'key')
      expect(result).toBe(false)
    })

    it('should remove item from storage successfully', () => {
      const result = deleteStorageItem(mockStorage, 'key')
      
      expect(result).toBe(true)
      expect(mockStorage.removeItem).toHaveBeenCalledWith('key')
    })

    it('should return false and log error when storage.removeItem throws', () => {
      mockStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage access denied')
      })
      const result = deleteStorageItem(mockStorage, 'key', mockLogger)
      
      expect(result).toBe(false)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error removing localStorage key "key":',
        expect.any(Error)
      )
    })

    it('should return false without logging when storage.removeItem throws and logger is not provided', () => {
      mockStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage access denied')
      })
      const result = deleteStorageItem(mockStorage, 'key')
      
      expect(result).toBe(false)
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  describe('shouldHandleStorageEvent', () => {
    it('should return true when eventKey matches targetKey and newValue is not null', () => {
      expect(shouldHandleStorageEvent('key', 'key', 'value')).toBe(true)
    })

    it('should return false when eventKey does not match targetKey', () => {
      expect(shouldHandleStorageEvent('other-key', 'key', 'value')).toBe(false)
    })

    it('should return false when newValue is null', () => {
      expect(shouldHandleStorageEvent('key', 'key', null)).toBe(false)
    })

    it('should return false when eventKey is null', () => {
      expect(shouldHandleStorageEvent(null, 'key', 'value')).toBe(false)
    })

    it('should return false when eventKey matches but newValue is null', () => {
      expect(shouldHandleStorageEvent('key', 'key', null)).toBe(false)
    })
  })
})
