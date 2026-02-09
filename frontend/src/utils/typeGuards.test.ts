/**
 * Tests for type guard utilities
 * 
 * Verifies that type guards correctly identify null/undefined values
 * and provide proper type narrowing for TypeScript.
 */

import { isNullOrUndefined, isDefined } from './typeGuards'

describe('typeGuards utilities', () => {
  describe('isNullOrUndefined', () => {
    it('should return true for null', () => {
      expect(isNullOrUndefined(null)).toBe(true)
    })

    it('should return true for undefined', () => {
      expect(isNullOrUndefined(undefined)).toBe(true)
    })

    it('should return false for defined values', () => {
      expect(isNullOrUndefined(0)).toBe(false)
      expect(isNullOrUndefined(false)).toBe(false)
      expect(isNullOrUndefined('')).toBe(false)
      expect(isNullOrUndefined([])).toBe(false)
      expect(isNullOrUndefined({})).toBe(false)
      expect(isNullOrUndefined('string')).toBe(false)
      expect(isNullOrUndefined(123)).toBe(false)
      expect(isNullOrUndefined(true)).toBe(false)
    })

    it('should work with type narrowing', () => {
      const value: string | null = 'test'
      if (isNullOrUndefined(value)) {
        // TypeScript should know value is null | undefined here
        expect(value).toBeNull()
      } else {
        // TypeScript should know value is string here
        expect(typeof value).toBe('string')
        expect(value.toUpperCase()).toBe('TEST')
      }
    })

    it('should handle all falsy values correctly', () => {
      // Only null and undefined should return true
      expect(isNullOrUndefined(null)).toBe(true)
      expect(isNullOrUndefined(undefined)).toBe(true)
      expect(isNullOrUndefined(0)).toBe(false)
      expect(isNullOrUndefined(false)).toBe(false)
      expect(isNullOrUndefined('')).toBe(false)
      expect(isNullOrUndefined(NaN)).toBe(false)
    })
  })

  describe('isDefined', () => {
    it('should return false for null', () => {
      expect(isDefined(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isDefined(undefined)).toBe(false)
    })

    it('should return true for defined values', () => {
      expect(isDefined(0)).toBe(true)
      expect(isDefined(false)).toBe(true)
      expect(isDefined('')).toBe(true)
      expect(isDefined([])).toBe(true)
      expect(isDefined({})).toBe(true)
      expect(isDefined('string')).toBe(true)
      expect(isDefined(123)).toBe(true)
      expect(isDefined(true)).toBe(true)
    })

    it('should work with type narrowing', () => {
      const value: string | null | undefined = 'test'
      if (isDefined(value)) {
        // TypeScript should know value is string here
        expect(typeof value).toBe('string')
        expect(value.toUpperCase()).toBe('TEST')
      } else {
        // TypeScript should know value is null | undefined here
        expect(value === null || value === undefined).toBe(true)
      }
    })

    it('should handle all falsy values correctly', () => {
      // Only null and undefined should return false
      expect(isDefined(null)).toBe(false)
      expect(isDefined(undefined)).toBe(false)
      expect(isDefined(0)).toBe(true)
      expect(isDefined(false)).toBe(true)
      expect(isDefined('')).toBe(true)
      expect(isDefined(NaN)).toBe(true)
    })

    it('should work with generic types', () => {
      interface TestInterface {
        prop: string
      }

      const value: TestInterface | null = { prop: 'test' }
      if (isDefined(value)) {
        // TypeScript should know value is TestInterface here
        expect(value.prop).toBe('test')
      }
    })

    it('should work with arrays', () => {
      const value: string[] | null = ['test']
      if (isDefined(value)) {
        // TypeScript should know value is string[] here
        expect(value.length).toBe(1)
        expect(value[0]).toBe('test')
      }
    })

    it('should work with objects', () => {
      const value: { key: string } | undefined = { key: 'value' }
      if (isDefined(value)) {
        // TypeScript should know value is { key: string } here
        expect(value.key).toBe('value')
      }
    })
  })

  describe('complementary behavior', () => {
    it('should be complementary - isDefined is opposite of isNullOrUndefined', () => {
      const testValues = [null, undefined, 0, false, '', [], {}, 'string', 123, true, NaN]

      testValues.forEach(value => {
        expect(isDefined(value)).toBe(!isNullOrUndefined(value))
      })
    })
  })
})
