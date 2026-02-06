/**
 * Tests for Safe Access Utilities
 * These tests kill mutations by verifying exact behavior
 */

import {
  safeGet,
  safeGetProperty,
  safeCall,
  safeGetArrayElement,
} from './safeAccess'

describe('safeAccess utilities', () => {
  describe('safeGet', () => {
    it('should return default when obj is null', () => {
      expect(safeGet(null, ['prop'], 'default')).toBe('default')
    })

    it('should return default when obj is undefined', () => {
      expect(safeGet(undefined, ['prop'], 'default')).toBe('default')
    })

    it('should return value when path exists', () => {
      expect(safeGet({ prop: 'value' }, ['prop'], 'default')).toBe('value')
    })

    it('should return default when path does not exist', () => {
      expect(safeGet({}, ['prop'], 'default')).toBe('default')
    })

    it('should handle nested paths', () => {
      expect(safeGet({ a: { b: { c: 'value' } } }, ['a', 'b', 'c'], 'default')).toBe('value')
    })

    it('should return default when nested path breaks', () => {
      expect(safeGet({ a: null }, ['a', 'b', 'c'], 'default')).toBe('default')
    })

    it('should return default when intermediate value is null', () => {
      expect(safeGet({ a: { b: null } }, ['a', 'b', 'c'], 'default')).toBe('default')
    })
  })

  describe('safeGetProperty', () => {
    it('should return default when obj is null', () => {
      expect(safeGetProperty(null, 'prop', 'default')).toBe('default')
    })

    it('should return default when obj is undefined', () => {
      expect(safeGetProperty(undefined, 'prop', 'default')).toBe('default')
    })

    it('should return value when property exists', () => {
      expect(safeGetProperty({ prop: 'value' }, 'prop', 'default')).toBe('value')
    })

    it('should return default when property does not exist', () => {
      expect(safeGetProperty({}, 'prop', 'default')).toBe('default')
    })

    it('should return default when property is null', () => {
      expect(safeGetProperty({ prop: null }, 'prop', 'default')).toBe('default')
    })

    it('should return default when property is undefined', () => {
      expect(safeGetProperty({ prop: undefined }, 'prop', 'default')).toBe('default')
    })
  })

  describe('safeCall', () => {
    it('should return default when obj is null', () => {
      expect(safeCall(null, 'method', [], 'default')).toBe('default')
    })

    it('should return default when method does not exist', () => {
      expect(safeCall({}, 'method', [], 'default')).toBe('default')
    })

    it('should call method when it exists', () => {
      const obj = {
        method: () => 'result'
      }
      expect(safeCall(obj, 'method', [], 'default')).toBe('result')
    })

    it('should pass arguments to method', () => {
      const obj = {
        method: (a: number, b: number) => a + b
      }
      expect(safeCall(obj, 'method', [1, 2], 0)).toBe(3)
    })

    it('should return default when method returns null', () => {
      const obj = {
        method: () => null
      }
      expect(safeCall(obj, 'method', [], 'default')).toBe('default')
    })

    it('should return default when method throws', () => {
      const obj = {
        method: () => { throw new Error() }
      }
      expect(safeCall(obj, 'method', [], 'default')).toBe('default')
    })
  })

  describe('safeGetArrayElement', () => {
    it('should return default when arr is null', () => {
      expect(safeGetArrayElement(null, 0, 'default')).toBe('default')
    })

    it('should return default when arr is undefined', () => {
      expect(safeGetArrayElement(undefined, 0, 'default')).toBe('default')
    })

    it('should return default when not an array', () => {
      expect(safeGetArrayElement({} as any, 0, 'default')).toBe('default')
    })

    it('should return value when index exists', () => {
      expect(safeGetArrayElement(['a', 'b', 'c'], 1, 'default')).toBe('b')
    })

    it('should return default when index is out of bounds', () => {
      expect(safeGetArrayElement(['a'], 5, 'default')).toBe('default')
    })

    it('should return default when index is negative', () => {
      expect(safeGetArrayElement(['a'], -1, 'default')).toBe('default')
    })

    it('should return default when element is null', () => {
      expect(safeGetArrayElement([null], 0, 'default')).toBe('default')
    })

    it('should return default when element is undefined', () => {
      expect(safeGetArrayElement([undefined], 0, 'default')).toBe('default')
    })
  })
})
