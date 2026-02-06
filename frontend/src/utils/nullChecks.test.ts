/**
 * Null Check Utilities Tests
 * Tests for centralized null/undefined checking utilities
 */

import {
  isNotNullOrUndefined,
  hasSize,
  hasMultipleSelected,
  isExplicitlyFalse,
  safeArray,
  isNonEmptyArray,
  isNotEmpty,
  hasItems,
  getOrDefault,
} from './nullChecks'

describe('nullChecks utilities', () => {
  describe('isNotNullOrUndefined', () => {
    it('should return true for non-null values', () => {
      expect(isNotNullOrUndefined('test')).toBe(true)
      expect(isNotNullOrUndefined(0)).toBe(true)
      expect(isNotNullOrUndefined(false)).toBe(true)
      expect(isNotNullOrUndefined([])).toBe(true)
      expect(isNotNullOrUndefined({})).toBe(true)
    })

    it('should return false for null', () => {
      expect(isNotNullOrUndefined(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isNotNullOrUndefined(undefined)).toBe(false)
    })

    it('should act as type guard', () => {
      const value: string | null = 'test'
      if (isNotNullOrUndefined(value)) {
        // TypeScript should know value is string here
        expect(value.toUpperCase()).toBe('TEST')
      }
    })
  })

  describe('hasSize', () => {
    it('should return true when set has size greater than threshold', () => {
      const set = new Set(['a', 'b', 'c'])
      expect(hasSize(set, 1)).toBe(true)
      expect(hasSize(set, 2)).toBe(true)
    })

    it('should return false when set size equals threshold', () => {
      const set = new Set(['a'])
      expect(hasSize(set, 1)).toBe(false)
    })

    it('should return false for null set', () => {
      expect(hasSize(null, 1)).toBe(false)
    })

    it('should return false for undefined set', () => {
      expect(hasSize(undefined, 1)).toBe(false)
    })

    it('should use default threshold of 1', () => {
      const set = new Set(['a', 'b'])
      expect(hasSize(set)).toBe(true)
      expect(hasSize(new Set(['a']))).toBe(false)
    })
  })

  describe('hasMultipleSelected', () => {
    it('should return true when multiple items selected', () => {
      const set = new Set(['a', 'b'])
      expect(hasMultipleSelected(set)).toBe(true)
    })

    it('should return false when one or zero items selected', () => {
      expect(hasMultipleSelected(new Set(['a']))).toBe(false)
      expect(hasMultipleSelected(new Set())).toBe(false)
    })

    it('should return false for null', () => {
      expect(hasMultipleSelected(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(hasMultipleSelected(undefined)).toBe(false)
    })
  })

  describe('isExplicitlyFalse', () => {
    it('should return true for false', () => {
      expect(isExplicitlyFalse(false)).toBe(true)
    })

    it('should return false for true', () => {
      expect(isExplicitlyFalse(true)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isExplicitlyFalse(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isExplicitlyFalse(undefined)).toBe(false)
    })
  })

  describe('safeArray', () => {
    it('should return array when array is provided', () => {
      const arr = [1, 2, 3]
      expect(safeArray(arr)).toBe(arr)
    })

    it('should return empty array for null', () => {
      expect(safeArray(null)).toEqual([])
    })

    it('should return empty array for undefined', () => {
      expect(safeArray(undefined)).toEqual([])
    })

    it('should return empty array for non-array values', () => {
      expect(safeArray('not an array' as any)).toEqual([])
      expect(safeArray(123 as any)).toEqual([])
    })
  })

  describe('isNonEmptyArray', () => {
    it('should return true for non-empty array', () => {
      expect(isNonEmptyArray([1, 2, 3])).toBe(true)
      expect(isNonEmptyArray(['a'])).toBe(true)
    })

    it('should return false for empty array', () => {
      expect(isNonEmptyArray([])).toBe(false)
    })

    it('should return false for null', () => {
      expect(isNonEmptyArray(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isNonEmptyArray(undefined)).toBe(false)
    })

    it('should act as type guard', () => {
      const value: number[] | null = [1, 2, 3]
      if (isNonEmptyArray(value)) {
        // TypeScript should know value is number[] here
        expect(value.length).toBe(3)
      }
    })
  })

  describe('isNotEmpty', () => {
    it('should return true for non-empty strings', () => {
      expect(isNotEmpty('test')).toBe(true)
      expect(isNotEmpty(' ')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isNotEmpty('')).toBe(false)
    })

    it('should return false for null', () => {
      expect(isNotEmpty(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isNotEmpty(undefined)).toBe(false)
    })
  })

  describe('hasItems', () => {
    it('should return true for array with items', () => {
      expect(hasItems([1, 2, 3])).toBe(true)
      expect(hasItems(['a'])).toBe(true)
    })

    it('should return false for empty array', () => {
      expect(hasItems([])).toBe(false)
    })

    it('should return false for null', () => {
      expect(hasItems(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(hasItems(undefined)).toBe(false)
    })
  })

  describe('getOrDefault', () => {
    it('should return value when not null/undefined', () => {
      expect(getOrDefault('test', 'default')).toBe('test')
      expect(getOrDefault(0, 10)).toBe(0)
      expect(getOrDefault(false, true)).toBe(false)
    })

    it('should return default for null', () => {
      expect(getOrDefault(null, 'default')).toBe('default')
    })

    it('should return default for undefined', () => {
      expect(getOrDefault(undefined, 'default')).toBe('default')
    })
  })
})
