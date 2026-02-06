/**
 * Tests for Null Coalescing Utilities
 * These tests kill mutations by verifying exact behavior
 */

import {
  coalesce,
  coalesceObject,
  coalesceArray,
  coalesceString,
  coalesceChain,
  coalesceChainWithDefault,
  coalesceObjectChain,
  coalesceArrayChain,
  coalesceStringChain,
} from './nullCoalescing'

describe('nullCoalescing utilities', () => {
  describe('coalesce', () => {
    it('should return value when not null or undefined', () => {
      expect(coalesce('test', 'default')).toBe('test')
      expect(coalesce(0, 1)).toBe(0)
      expect(coalesce(false, true)).toBe(false)
      expect(coalesce({}, {})).toEqual({})
    })

    it('should return default when value is null', () => {
      expect(coalesce(null, 'default')).toBe('default')
    })

    it('should return default when value is undefined', () => {
      expect(coalesce(undefined, 'default')).toBe('default')
    })

    it('should handle empty string as valid value', () => {
      expect(coalesce('', 'default')).toBe('')
    })

    it('should handle zero as valid value', () => {
      expect(coalesce(0, 1)).toBe(0)
    })
  })

  describe('coalesceObject', () => {
    it('should return object when valid', () => {
      const obj = { key: 'value' }
      expect(coalesceObject(obj, {})).toBe(obj)
    })

    it('should return default when value is null', () => {
      expect(coalesceObject(null, {})).toEqual({})
    })

    it('should return default when value is undefined', () => {
      expect(coalesceObject(undefined, {})).toEqual({})
    })

    it('should return default when value is array', () => {
      expect(coalesceObject([], {})).toEqual({})
    })

    it('should return default when value is string', () => {
      expect(coalesceObject('not an object' as any, {})).toEqual({})
    })

    it('should handle empty object as valid', () => {
      expect(coalesceObject({}, { default: true })).toEqual({})
    })
  })

  describe('coalesceArray', () => {
    it('should return array when valid', () => {
      const arr = [1, 2, 3]
      expect(coalesceArray(arr, [])).toBe(arr)
    })

    it('should return default when value is null', () => {
      expect(coalesceArray(null, [])).toEqual([])
    })

    it('should return default when value is undefined', () => {
      expect(coalesceArray(undefined, [])).toEqual([])
    })

    it('should return default when value is object', () => {
      expect(coalesceArray({} as any, [])).toEqual([])
    })

    it('should handle empty array as valid', () => {
      expect(coalesceArray([], [1, 2, 3])).toEqual([])
    })
  })

  describe('coalesceString', () => {
    it('should return string when non-empty', () => {
      expect(coalesceString('test', 'default')).toBe('test')
    })

    it('should return default when value is null', () => {
      expect(coalesceString(null, 'default')).toBe('default')
    })

    it('should return default when value is undefined', () => {
      expect(coalesceString(undefined, 'default')).toBe('default')
    })

    it('should return default when value is empty string', () => {
      expect(coalesceString('', 'default')).toBe('default')
    })

    it('should return default when value is not a string', () => {
      expect(coalesceString(123 as any, 'default')).toBe('default')
    })
  })

  describe('coalesceChain', () => {
    it('should return first non-null value', () => {
      expect(coalesceChain(null, undefined, 'test', 'other')).toBe('test')
    })

    it('should return null when all values are null/undefined', () => {
      expect(coalesceChain(null, undefined, null)).toBeNull()
    })

    it('should handle zero as valid value', () => {
      expect(coalesceChain(null, 0, 1)).toBe(0)
    })

    it('should handle false as valid value', () => {
      expect(coalesceChain(null, false, true)).toBe(false)
    })
  })

  describe('coalesceChainWithDefault', () => {
    it('should return first non-null value', () => {
      expect(coalesceChainWithDefault('default', null, undefined, 'test')).toBe('test')
    })

    it('should return default when all values are null/undefined', () => {
      expect(coalesceChainWithDefault('default', null, undefined)).toBe('default')
    })
  })

  describe('coalesceObjectChain', () => {
    it('should return first valid object', () => {
      const obj1 = { a: 1 }
      const obj2 = { b: 2 }
      expect(coalesceObjectChain({}, null, undefined, obj1, obj2)).toBe(obj1)
    })

    it('should return default when all values are invalid', () => {
      expect(coalesceObjectChain({}, null, undefined, [], 'string' as any)).toEqual({})
    })
  })

  describe('coalesceArrayChain', () => {
    it('should return first valid array', () => {
      const arr1 = [1, 2]
      const arr2 = [3, 4]
      expect(coalesceArrayChain([], null, undefined, arr1, arr2)).toBe(arr1)
    })

    it('should return default when all values are invalid', () => {
      expect(coalesceArrayChain([], null, undefined, {}, 'string' as any)).toEqual([])
    })
  })

  describe('coalesceStringChain', () => {
    it('should return first non-empty string', () => {
      expect(coalesceStringChain('default', null, undefined, '', 'test')).toBe('test')
    })

    it('should return default when all values are empty/null/undefined', () => {
      expect(coalesceStringChain('default', null, undefined, '')).toBe('default')
    })
  })
})
