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
  })
})
