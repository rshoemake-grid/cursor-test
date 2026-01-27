import {
  safeStorageGet,
  safeStorageSet,
  safeStorageRemove,
  safeStorageHas,
  safeStorageClear,
} from './storageHelpers'
import type { StorageAdapter } from '../types/adapters'
import { handleStorageError } from './errorHandler'

jest.mock('./errorHandler', () => ({
  handleStorageError: jest.fn(),
}))

describe('storageHelpers', () => {
  let mockStorage: StorageAdapter

  beforeEach(() => {
    jest.clearAllMocks()
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    }
  })

  describe('safeStorageGet', () => {
    it('should return default value when storage is null', () => {
      const result = safeStorageGet(null, 'key', 'default')
      expect(result).toBe('default')
    })

    it('should return parsed value when item exists', () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue('{"value": "test"}')
      const result = safeStorageGet(mockStorage, 'key', 'default')
      expect(result).toEqual({ value: 'test' })
    })

    it('should return default value when item is null', () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)
      const result = safeStorageGet(mockStorage, 'key', 'default')
      expect(result).toBe('default')
    })

    it('should return default value on parse error', () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue('invalid json')
      const result = safeStorageGet(mockStorage, 'key', 'default')
      expect(result).toBe('default')
      expect(handleStorageError).toHaveBeenCalled()
    })

    it('should include context in error handling', () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue('invalid json')
      safeStorageGet(mockStorage, 'key', 'default', 'TestContext')
      expect(handleStorageError).toHaveBeenCalledWith(
        expect.any(Error),
        'getItem',
        'key',
        expect.objectContaining({ context: 'TestContext' })
      )
    })
  })

  describe('safeStorageSet', () => {
    it('should return false when storage is null', () => {
      const result = safeStorageSet(null, 'key', 'value')
      expect(result).toBe(false)
    })

    it('should set item successfully', () => {
      const result = safeStorageSet(mockStorage, 'key', { value: 'test' })
      expect(result).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalledWith('key', '{"value":"test"}')
    })

    it('should convert undefined to null', () => {
      safeStorageSet(mockStorage, 'key', undefined)
      expect(mockStorage.setItem).toHaveBeenCalledWith('key', 'null')
    })

    it('should handle setItem errors', () => {
      ;(mockStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Quota exceeded')
      })
      const result = safeStorageSet(mockStorage, 'key', 'value')
      expect(result).toBe(false)
      expect(handleStorageError).toHaveBeenCalled()
    })

    it('should include context in error handling', () => {
      ;(mockStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Quota exceeded')
      })
      safeStorageSet(mockStorage, 'key', 'value', 'TestContext')
      expect(handleStorageError).toHaveBeenCalledWith(
        expect.any(Error),
        'setItem',
        'key',
        expect.objectContaining({ context: 'TestContext' })
      )
    })
  })

  describe('safeStorageRemove', () => {
    it('should return false when storage is null', () => {
      const result = safeStorageRemove(null, 'key')
      expect(result).toBe(false)
    })

    it('should remove item successfully', () => {
      const result = safeStorageRemove(mockStorage, 'key')
      expect(result).toBe(true)
      expect(mockStorage.removeItem).toHaveBeenCalledWith('key')
    })

    it('should handle removeItem errors', () => {
      ;(mockStorage.removeItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error')
      })
      const result = safeStorageRemove(mockStorage, 'key')
      expect(result).toBe(false)
      expect(handleStorageError).toHaveBeenCalled()
    })

    it('should include context in error handling', () => {
      ;(mockStorage.removeItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error')
      })
      safeStorageRemove(mockStorage, 'key', 'TestContext')
      expect(handleStorageError).toHaveBeenCalledWith(
        expect.any(Error),
        'removeItem',
        'key',
        expect.objectContaining({ context: 'TestContext' })
      )
    })
  })

  describe('safeStorageHas', () => {
    it('should return false when storage is null', () => {
      const result = safeStorageHas(null, 'key')
      expect(result).toBe(false)
    })

    it('should return true when item exists', () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue('value')
      const result = safeStorageHas(mockStorage, 'key')
      expect(result).toBe(true)
    })

    it('should return false when item does not exist', () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)
      const result = safeStorageHas(mockStorage, 'key')
      expect(result).toBe(false)
    })

    it('should handle getItem errors', () => {
      ;(mockStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error')
      })
      const result = safeStorageHas(mockStorage, 'key')
      expect(result).toBe(false)
      expect(handleStorageError).toHaveBeenCalled()
    })

    it('should return false when item is undefined', () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(undefined)
      const result = safeStorageHas(mockStorage, 'key')
      expect(result).toBe(false)
    })

    it('should include context in error handling', () => {
      ;(mockStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error')
      })
      safeStorageHas(mockStorage, 'key', 'TestContext')
      expect(handleStorageError).toHaveBeenCalledWith(
        expect.any(Error),
        'getItem',
        'key',
        expect.objectContaining({ context: 'TestContext' })
      )
    })
  })

  describe('safeStorageClear', () => {
    it('should return false when storage is null', () => {
      const result = safeStorageClear(null)
      expect(result).toBe(false)
    })

    it('should return false when clear is not available', () => {
      const storageWithoutClear = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      }
      const result = safeStorageClear(storageWithoutClear as StorageAdapter)
      expect(result).toBe(false)
    })

    it('should clear storage successfully', () => {
      const result = safeStorageClear(mockStorage)
      expect(result).toBe(true)
      expect(mockStorage.clear).toHaveBeenCalled()
    })

    it('should handle clear errors', () => {
      ;(mockStorage.clear as jest.Mock).mockImplementation(() => {
        throw new Error('Clear error')
      })
      const result = safeStorageClear(mockStorage)
      expect(result).toBe(false)
      expect(handleStorageError).toHaveBeenCalled()
    })

    it('should include context in error handling', () => {
      ;(mockStorage.clear as jest.Mock).mockImplementation(() => {
        throw new Error('Clear error')
      })
      safeStorageClear(mockStorage, 'TestContext')
      expect(handleStorageError).toHaveBeenCalledWith(
        expect.any(Error),
        'clear',
        'all',
        expect.objectContaining({ context: 'TestContext' })
      )
    })
  })

  describe('edge cases', () => {
    it('should handle safeStorageGet with undefined item', () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(undefined)
      const result = safeStorageGet(mockStorage, 'key', 'default')
      expect(result).toBe('default')
    })

    it('should handle safeStorageGet with empty string item', () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue('')
      const result = safeStorageGet(mockStorage, 'key', 'default')
      // Empty string is falsy, should return default
      expect(result).toBe('default')
    })

    it('should handle safeStorageGet with valid JSON string "null"', () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue('null')
      const result = safeStorageGet(mockStorage, 'key', 'default')
      expect(result).toBe(null)
    })

    it('should handle safeStorageGet with valid JSON string "false"', () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue('false')
      const result = safeStorageGet(mockStorage, 'key', 'default')
      expect(result).toBe(false)
    })

    it('should handle safeStorageGet with valid JSON string "0"', () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue('0')
      const result = safeStorageGet(mockStorage, 'key', 'default')
      expect(result).toBe(0)
    })

    it('should handle safeStorageGet with valid JSON string empty array', () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue('[]')
      const result = safeStorageGet(mockStorage, 'key', 'default')
      expect(result).toEqual([])
    })

    it('should handle safeStorageGet with valid JSON string empty object', () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue('{}')
      const result = safeStorageGet(mockStorage, 'key', 'default')
      expect(result).toEqual({})
    })

    it('should handle safeStorageSet with null value', () => {
      const result = safeStorageSet(mockStorage, 'key', null)
      expect(result).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalledWith('key', 'null')
    })

    it('should handle safeStorageSet with false value', () => {
      const result = safeStorageSet(mockStorage, 'key', false)
      expect(result).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalledWith('key', 'false')
    })

    it('should handle safeStorageSet with 0 value', () => {
      const result = safeStorageSet(mockStorage, 'key', 0)
      expect(result).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalledWith('key', '0')
    })

    it('should handle safeStorageSet with empty string value', () => {
      const result = safeStorageSet(mockStorage, 'key', '')
      expect(result).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalledWith('key', '""')
    })

    it('should handle safeStorageSet with empty array value', () => {
      const result = safeStorageSet(mockStorage, 'key', [])
      expect(result).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalledWith('key', '[]')
    })

    it('should handle safeStorageSet with empty object value', () => {
      const result = safeStorageSet(mockStorage, 'key', {})
      expect(result).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalledWith('key', '{}')
    })

    it('should handle safeStorageHas with empty string', () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue('')
      const result = safeStorageHas(mockStorage, 'key')
      // Empty string is truthy, so should return true
      expect(result).toBe(true)
    })

    it('should handle safeStorageClear when clear is not a function', () => {
      const storageWithoutClear = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: 'not-a-function',
      }
      const result = safeStorageClear(storageWithoutClear as any)
      expect(result).toBe(false)
    })

    it('should handle safeStorageClear when clear is undefined', () => {
      const storageWithoutClear = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      }
      const result = safeStorageClear(storageWithoutClear as StorageAdapter)
      expect(result).toBe(false)
    })
  })
})
