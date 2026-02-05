/**
 * Mutation tests for storageHelpers utility functions
 * Targets exact conditionals, logical operators, and edge cases
 */

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

describe('storageHelpers - Mutation Killers', () => {
  let mockStorage: StorageAdapter

  beforeEach(() => {
    jest.clearAllMocks()
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      clear: jest.fn(),
    } as any
  })

  describe('safeStorageGet - exact conditionals', () => {
    it('should verify exact falsy check - storage is null', () => {
      const result = safeStorageGet(null, 'key', 'default')
      expect(result).toBe('default')
    })

    it('should verify exact falsy check - storage is undefined', () => {
      const result = safeStorageGet(undefined as any, 'key', 'default')
      expect(result).toBe('default')
    })

    it('should verify exact falsy check - storage exists (should not return default)', () => {
      (mockStorage.getItem as jest.Mock).mockReturnValue('{"value": "test"}')
      const result = safeStorageGet(mockStorage, 'key', 'default')
      expect(result).toEqual({ value: 'test' })
    })

    it('should verify exact OR - item === null', () => {
      (mockStorage.getItem as jest.Mock).mockReturnValue(null)
      const result = safeStorageGet(mockStorage, 'key', 'default')
      expect(result).toBe('default')
    })

    it('should verify exact OR - item === undefined', () => {
      (mockStorage.getItem as jest.Mock).mockReturnValue(undefined)
      const result = safeStorageGet(mockStorage, 'key', 'default')
      expect(result).toBe('default')
    })

    it('should verify exact OR - item exists (should not return default)', () => {
      (mockStorage.getItem as jest.Mock).mockReturnValue('{"value": "test"}')
      const result = safeStorageGet(mockStorage, 'key', 'default')
      expect(result).toEqual({ value: 'test' })
    })
  })

  describe('safeStorageSet - exact conditionals and ternary', () => {
    it('should verify exact falsy check - storage is null', () => {
      const result = safeStorageSet(null, 'key', 'value')
      expect(result).toBe(false)
    })

    it('should verify exact falsy check - storage is undefined', () => {
      const result = safeStorageSet(undefined as any, 'key', 'value')
      expect(result).toBe(false)
    })

    it('should verify exact falsy check - storage exists (should set)', () => {
      const result = safeStorageSet(mockStorage, 'key', 'value')
      expect(result).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should verify exact ternary - value === undefined (should convert to null)', () => {
      safeStorageSet(mockStorage, 'key', undefined)
      expect(mockStorage.setItem).toHaveBeenCalledWith('key', JSON.stringify(null))
    })

    it('should verify exact ternary - value !== undefined (should use value)', () => {
      safeStorageSet(mockStorage, 'key', 'test')
      expect(mockStorage.setItem).toHaveBeenCalledWith('key', JSON.stringify('test'))
    })

    it('should verify exact ternary - value is null (should use null)', () => {
      safeStorageSet(mockStorage, 'key', null)
      expect(mockStorage.setItem).toHaveBeenCalledWith('key', JSON.stringify(null))
    })
  })

  describe('safeStorageRemove - exact falsy check', () => {
    it('should verify exact falsy check - storage is null', () => {
      const result = safeStorageRemove(null, 'key')
      expect(result).toBe(false)
    })

    it('should verify exact falsy check - storage is undefined', () => {
      const result = safeStorageRemove(undefined as any, 'key')
      expect(result).toBe(false)
    })

    it('should verify exact falsy check - storage exists (should remove)', () => {
      const result = safeStorageRemove(mockStorage, 'key')
      expect(result).toBe(true)
      expect(mockStorage.removeItem).toHaveBeenCalledWith('key')
    })
  })

  describe('safeStorageHas - exact falsy check and logical AND', () => {
    it('should verify exact falsy check - storage is null', () => {
      const result = safeStorageHas(null, 'key')
      expect(result).toBe(false)
    })

    it('should verify exact falsy check - storage is undefined', () => {
      const result = safeStorageHas(undefined as any, 'key')
      expect(result).toBe(false)
    })

    it('should verify exact falsy check - storage exists (should check)', () => {
      (mockStorage.getItem as jest.Mock).mockReturnValue('value')
      const result = safeStorageHas(mockStorage, 'key')
      expect(result).toBe(true)
    })

    it('should verify exact AND - item !== null && item !== undefined (both true)', () => {
      (mockStorage.getItem as jest.Mock).mockReturnValue('value')
      const result = safeStorageHas(mockStorage, 'key')
      expect(result).toBe(true)
    })

    it('should verify exact AND - item === null (first false)', () => {
      (mockStorage.getItem as jest.Mock).mockReturnValue(null)
      const result = safeStorageHas(mockStorage, 'key')
      expect(result).toBe(false)
    })

    it('should verify exact AND - item === undefined (second false)', () => {
      (mockStorage.getItem as jest.Mock).mockReturnValue(undefined)
      const result = safeStorageHas(mockStorage, 'key')
      expect(result).toBe(false)
    })

    it('should verify exact AND - item is empty string (should be true - not null/undefined)', () => {
      (mockStorage.getItem as jest.Mock).mockReturnValue('')
      const result = safeStorageHas(mockStorage, 'key')
      expect(result).toBe(true)
    })
  })

  describe('safeStorageClear - exact falsy check and logical OR', () => {
    it('should verify exact falsy check - storage is null', () => {
      const result = safeStorageClear(null)
      expect(result).toBe(false)
    })

    it('should verify exact falsy check - storage is undefined', () => {
      const result = safeStorageClear(undefined as any)
      expect(result).toBe(false)
    })

    it('should verify exact OR - storage exists and has clear method (should clear)', () => {
      const result = safeStorageClear(mockStorage)
      expect(result).toBe(true)
      expect(mockStorage.clear).toHaveBeenCalled()
    })

    it('should verify exact OR - storage exists but no clear method (should return false)', () => {
      const storageWithoutClear = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      } as any
      const result = safeStorageClear(storageWithoutClear)
      expect(result).toBe(false)
    })

    it('should verify exact typeof check - clear is not a function', () => {
      const storageWithNonFunctionClear = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: 'not a function',
      } as any
      const result = safeStorageClear(storageWithNonFunctionClear)
      expect(result).toBe(false)
    })

    it('should verify exact typeof check - clear is a function (should call)', () => {
      const result = safeStorageClear(mockStorage)
      expect(result).toBe(true)
      expect(mockStorage.clear).toHaveBeenCalled()
    })
  })

  describe('Error handling - exact method calls', () => {
    it('should verify exact method call - JSON.parse in safeStorageGet', () => {
      (mockStorage.getItem as jest.Mock).mockReturnValue('{"value": "test"}')
      safeStorageGet(mockStorage, 'key', 'default')
      // Should parse successfully
      expect(handleStorageError).not.toHaveBeenCalled()
    })

    it('should verify exact method call - JSON.parse throws (should handle error)', () => {
      (mockStorage.getItem as jest.Mock).mockReturnValue('invalid json')
      const result = safeStorageGet(mockStorage, 'key', 'default')
      expect(result).toBe('default')
      expect(handleStorageError).toHaveBeenCalled()
    })

    it('should verify exact method call - JSON.stringify in safeStorageSet', () => {
      safeStorageSet(mockStorage, 'key', { value: 'test' })
      expect(mockStorage.setItem).toHaveBeenCalledWith('key', JSON.stringify({ value: 'test' }))
    })

    it('should verify exact method call - storage.setItem throws (should handle error)', () => {
      (mockStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Quota exceeded')
      })
      const result = safeStorageSet(mockStorage, 'key', 'value')
      expect(result).toBe(false)
      expect(handleStorageError).toHaveBeenCalled()
    })

    it('should verify exact method call - storage.removeItem in safeStorageRemove', () => {
      safeStorageRemove(mockStorage, 'key')
      expect(mockStorage.removeItem).toHaveBeenCalledWith('key')
    })

    it('should verify exact method call - storage.removeItem throws (should handle error)', () => {
      (mockStorage.removeItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error')
      })
      const result = safeStorageRemove(mockStorage, 'key')
      expect(result).toBe(false)
      expect(handleStorageError).toHaveBeenCalled()
    })

    it('should verify exact method call - storage.getItem in safeStorageHas', () => {
      (mockStorage.getItem as jest.Mock).mockReturnValue('value')
      safeStorageHas(mockStorage, 'key')
      expect(mockStorage.getItem).toHaveBeenCalledWith('key')
    })

    it('should verify exact method call - storage.getItem throws (should handle error)', () => {
      (mockStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error')
      })
      const result = safeStorageHas(mockStorage, 'key')
      expect(result).toBe(false)
      expect(handleStorageError).toHaveBeenCalled()
    })

    it('should verify exact method call - storage.clear in safeStorageClear', () => {
      safeStorageClear(mockStorage)
      expect(mockStorage.clear).toHaveBeenCalled()
    })

    it('should verify exact method call - storage.clear throws (should handle error)', () => {
      (mockStorage.clear as jest.Mock).mockImplementation(() => {
        throw new Error('Clear error')
      })
      const result = safeStorageClear(mockStorage)
      expect(result).toBe(false)
      expect(handleStorageError).toHaveBeenCalled()
    })
  })

  describe('Context parameter - exact property access', () => {
    it('should verify context is passed to error handler in safeStorageGet', () => {
      (mockStorage.getItem as jest.Mock).mockReturnValue('invalid json')
      safeStorageGet(mockStorage, 'key', 'default', 'TestContext')
      expect(handleStorageError).toHaveBeenCalledWith(
        expect.any(Error),
        'getItem',
        'key',
        expect.objectContaining({ context: 'TestContext' })
      )
      // Verify exact context property access - mutation would change context to undefined
      const callArgs = (handleStorageError as jest.Mock).mock.calls[0]
      expect(callArgs[3]).toBeDefined()
      expect(callArgs[3].context).toBe('TestContext')
      expect(callArgs[3].context).not.toBeUndefined()
      expect(callArgs[3].context).not.toBeNull()
      // Kill mutation: context !== 'TestContext' should fail
      expect(callArgs[3].context === 'TestContext').toBe(true)
    })

    it('should verify context is undefined when not provided in safeStorageGet', () => {
      (mockStorage.getItem as jest.Mock).mockReturnValue('invalid json')
      safeStorageGet(mockStorage, 'key', 'default')
      const callArgs = (handleStorageError as jest.Mock).mock.calls[0]
      expect(callArgs[3].context).toBeUndefined()
    })

    it('should verify context is passed to error handler in safeStorageSet', () => {
      (mockStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Error')
      })
      safeStorageSet(mockStorage, 'key', 'value', 'TestContext')
      expect(handleStorageError).toHaveBeenCalledWith(
        expect.any(Error),
        'setItem',
        'key',
        expect.objectContaining({ context: 'TestContext' })
      )
      // Verify exact context property access
      const callArgs = (handleStorageError as jest.Mock).mock.calls[0]
      expect(callArgs[3]).toBeDefined()
      expect(callArgs[3].context).toBe('TestContext')
      expect(callArgs[3].context).not.toBeUndefined()
      expect(callArgs[3].context).not.toBeNull()
      // Kill mutation: context !== 'TestContext' should fail
      expect(callArgs[3].context === 'TestContext').toBe(true)
    })

    it('should verify context is undefined when not provided in safeStorageSet', () => {
      (mockStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Error')
      })
      safeStorageSet(mockStorage, 'key', 'value')
      const callArgs = (handleStorageError as jest.Mock).mock.calls[0]
      expect(callArgs[3].context).toBeUndefined()
    })

    it('should verify context is passed to error handler in safeStorageRemove', () => {
      (mockStorage.removeItem as jest.Mock).mockImplementation(() => {
        throw new Error('Error')
      })
      safeStorageRemove(mockStorage, 'key', 'TestContext')
      expect(handleStorageError).toHaveBeenCalledWith(
        expect.any(Error),
        'removeItem',
        'key',
        expect.objectContaining({ context: 'TestContext' })
      )
      // Verify exact context property access
      const callArgs = (handleStorageError as jest.Mock).mock.calls[0]
      expect(callArgs[3]).toBeDefined()
      expect(callArgs[3].context).toBe('TestContext')
      expect(callArgs[3].context).not.toBeUndefined()
      expect(callArgs[3].context).not.toBeNull()
      // Kill mutation: context !== 'TestContext' should fail
      expect(callArgs[3].context === 'TestContext').toBe(true)
    })

    it('should verify context is undefined when not provided in safeStorageRemove', () => {
      (mockStorage.removeItem as jest.Mock).mockImplementation(() => {
        throw new Error('Error')
      })
      safeStorageRemove(mockStorage, 'key')
      const callArgs = (handleStorageError as jest.Mock).mock.calls[0]
      expect(callArgs[3].context).toBeUndefined()
    })

    it('should verify context is passed to error handler in safeStorageHas', () => {
      (mockStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Error')
      })
      safeStorageHas(mockStorage, 'key', 'TestContext')
      expect(handleStorageError).toHaveBeenCalledWith(
        expect.any(Error),
        'getItem',
        'key',
        expect.objectContaining({ context: 'TestContext' })
      )
      // Verify exact context property access
      const callArgs = (handleStorageError as jest.Mock).mock.calls[0]
      expect(callArgs[3]).toBeDefined()
      expect(callArgs[3].context).toBe('TestContext')
      expect(callArgs[3].context).not.toBeUndefined()
      expect(callArgs[3].context).not.toBeNull()
      // Kill mutation: context !== 'TestContext' should fail
      expect(callArgs[3].context === 'TestContext').toBe(true)
      expect(callArgs[3].context).not.toBeUndefined()
    })

    it('should verify context is undefined when not provided in safeStorageHas', () => {
      (mockStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Error')
      })
      safeStorageHas(mockStorage, 'key')
      const callArgs = (handleStorageError as jest.Mock).mock.calls[0]
      expect(callArgs[3].context).toBeUndefined()
    })

    it('should verify context is passed to error handler in safeStorageClear', () => {
      (mockStorage.clear as jest.Mock).mockImplementation(() => {
        throw new Error('Error')
      })
      safeStorageClear(mockStorage, 'TestContext')
      expect(handleStorageError).toHaveBeenCalledWith(
        expect.any(Error),
        'clear',
        'all',
        expect.objectContaining({ context: 'TestContext' })
      )
      // Verify exact context property access
      const callArgs = (handleStorageError as jest.Mock).mock.calls[0]
      expect(callArgs[3]).toBeDefined()
      expect(callArgs[3].context).toBe('TestContext')
      expect(callArgs[3].context).not.toBeUndefined()
      expect(callArgs[3].context).not.toBeNull()
      // Kill mutation: context !== 'TestContext' should fail
      expect(callArgs[3].context === 'TestContext').toBe(true)
      expect(callArgs[3].context).not.toBeUndefined()
    })

    it('should verify context is undefined when not provided in safeStorageClear', () => {
      (mockStorage.clear as jest.Mock).mockImplementation(() => {
        throw new Error('Error')
      })
      safeStorageClear(mockStorage)
      const callArgs = (handleStorageError as jest.Mock).mock.calls[0]
      expect(callArgs[3].context).toBeUndefined()
    })
  })
})
