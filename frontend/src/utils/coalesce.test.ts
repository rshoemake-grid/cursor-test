/**
 * Tests for coalesce utilities
 * 
 * Verifies that coalesce correctly handles null/undefined values
 * and returns appropriate defaults.
 */

import { coalesce } from './coalesce'

describe('coalesce utilities', () => {
  describe('coalesce', () => {
    it('should return default value for null', () => {
      expect(coalesce(null, 'default')).toBe('default')
      expect(coalesce(null, 0)).toBe(0)
      expect(coalesce(null, false)).toBe(false)
      expect(coalesce(null, [])).toEqual([])
      expect(coalesce(null, {})).toEqual({})
    })

    it('should return default value for undefined', () => {
      expect(coalesce(undefined, 'default')).toBe('default')
      expect(coalesce(undefined, 0)).toBe(0)
      expect(coalesce(undefined, false)).toBe(false)
      expect(coalesce(undefined, [])).toEqual([])
      expect(coalesce(undefined, {})).toEqual({})
    })

    it('should return value for defined values', () => {
      expect(coalesce('test', 'default')).toBe('test')
      expect(coalesce(123, 0)).toBe(123)
      expect(coalesce(true, false)).toBe(true)
      expect(coalesce([1, 2], [])).toEqual([1, 2])
      expect(coalesce({ key: 'value' }, {})).toEqual({ key: 'value' })
    })

    it('should handle falsy but defined values', () => {
      // Falsy but defined values should be returned, not replaced with default
      expect(coalesce(0, 10)).toBe(0)
      expect(coalesce(false, true)).toBe(false)
      expect(coalesce('', 'default')).toBe('')
      expect(coalesce(NaN, 0)).toBe(NaN)
    })

    it('should work with different types', () => {
      // String
      expect(coalesce('hello', 'world')).toBe('hello')
      expect(coalesce(null as string | null, 'world')).toBe('world')

      // Number
      expect(coalesce(42, 0)).toBe(42)
      expect(coalesce(null as number | null, 0)).toBe(0)

      // Boolean
      expect(coalesce(true, false)).toBe(true)
      expect(coalesce(null as boolean | null, false)).toBe(false)

      // Array
      expect(coalesce([1, 2, 3], [])).toEqual([1, 2, 3])
      expect(coalesce(null as number[] | null, [])).toEqual([])

      // Object
      expect(coalesce({ a: 1 }, {})).toEqual({ a: 1 })
      expect(coalesce(null as { a: number } | null, {})).toEqual({})
    })

    it('should preserve type information', () => {
      const value: string | null = 'test'
      const result = coalesce(value, 'default')
      // TypeScript should know result is string
      expect(typeof result).toBe('string')
      expect(result.toUpperCase()).toBe('TEST')
    })

    it('should work with complex objects', () => {
      interface Complex {
        id: number
        name: string
      }

      const value: Complex | null = { id: 1, name: 'test' }
      const defaultValue: Complex = { id: 0, name: 'default' }

      expect(coalesce(value, defaultValue)).toEqual({ id: 1, name: 'test' })
      expect(coalesce(null, defaultValue)).toEqual(defaultValue)
    })

    it('should handle edge cases', () => {
      // Empty string is defined, so should be returned
      expect(coalesce('', 'default')).toBe('')

      // Zero is defined, so should be returned
      expect(coalesce(0, 10)).toBe(0)

      // False is defined, so should be returned
      expect(coalesce(false, true)).toBe(false)

      // Empty array is defined, so should be returned
      expect(coalesce([], [1, 2, 3])).toEqual([])

      // Empty object is defined, so should be returned
      expect(coalesce({}, { key: 'value' })).toEqual({})
    })
  })
})
