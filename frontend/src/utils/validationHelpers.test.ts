/**
 * Tests for Validation Helper Utilities
 * These tests kill mutations by verifying exact behavior
 */

import {
  isTruthy,
  isFalsy,
  allTruthy,
  anyTruthy,
  canUserOperate,
  hasArrayItems,
  isValidObject,
  isNonEmptyString,
  isValidNumber,
} from './validationHelpers'

describe('validationHelpers utilities', () => {
  describe('isTruthy', () => {
    it('should return false for null', () => {
      expect(isTruthy(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isTruthy(undefined)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isTruthy('')).toBe(false)
    })

    it('should return false for zero', () => {
      expect(isTruthy(0)).toBe(false)
    })

    it('should return false for false', () => {
      expect(isTruthy(false)).toBe(false)
    })

    it('should return true for non-empty string', () => {
      expect(isTruthy('test')).toBe(true)
    })

    it('should return true for non-zero number', () => {
      expect(isTruthy(1)).toBe(true)
      expect(isTruthy(-1)).toBe(true)
    })

    it('should return true for true', () => {
      expect(isTruthy(true)).toBe(true)
    })

    it('should return true for object', () => {
      expect(isTruthy({})).toBe(true)
    })

    it('should return true for array', () => {
      expect(isTruthy([])).toBe(true)
    })
  })

  describe('isFalsy', () => {
    it('should return true for null', () => {
      expect(isFalsy(null)).toBe(true)
    })

    it('should return true for undefined', () => {
      expect(isFalsy(undefined)).toBe(true)
    })

    it('should return false for truthy values', () => {
      expect(isFalsy('test')).toBe(false)
      expect(isFalsy(1)).toBe(false)
      expect(isFalsy(true)).toBe(false)
    })
  })

  describe('allTruthy', () => {
    it('should return true when all values are truthy', () => {
      expect(allTruthy('a', 1, true, {})).toBe(true)
    })

    it('should return false when any value is falsy', () => {
      expect(allTruthy('a', null, true)).toBe(false)
      expect(allTruthy('a', '', true)).toBe(false)
      expect(allTruthy('a', 0, true)).toBe(false)
    })

    it('should return true for empty array', () => {
      expect(allTruthy()).toBe(true)
    })
  })

  describe('anyTruthy', () => {
    it('should return true when any value is truthy', () => {
      expect(anyTruthy(null, undefined, 'test')).toBe(true)
    })

    it('should return false when all values are falsy', () => {
      expect(anyTruthy(null, undefined, '', 0, false)).toBe(false)
    })

    it('should return false for empty array', () => {
      expect(anyTruthy()).toBe(false)
    })
  })

  describe('canUserOperate', () => {
    it('should return false for null user', () => {
      expect(canUserOperate(null)).toBe(false)
    })

    it('should return false for undefined user', () => {
      expect(canUserOperate(undefined)).toBe(false)
    })

    it('should return false for user without id', () => {
      expect(canUserOperate({})).toBe(false)
      expect(canUserOperate({ id: null })).toBe(false)
      expect(canUserOperate({ id: undefined })).toBe(false)
    })

    it('should return true for user with id', () => {
      expect(canUserOperate({ id: '123' })).toBe(true)
      expect(canUserOperate({ id: 123 })).toBe(true)
    })
  })

  describe('hasArrayItems', () => {
    it('should return false for null', () => {
      expect(hasArrayItems(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(hasArrayItems(undefined)).toBe(false)
    })

    it('should return false for empty array', () => {
      expect(hasArrayItems([])).toBe(false)
    })

    it('should return false for non-array', () => {
      expect(hasArrayItems({} as any)).toBe(false)
      expect(hasArrayItems('string' as any)).toBe(false)
    })

    it('should return true for array with items', () => {
      expect(hasArrayItems([1])).toBe(true)
      expect(hasArrayItems([1, 2, 3])).toBe(true)
    })
  })

  describe('isValidObject', () => {
    it('should return false for null', () => {
      expect(isValidObject(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isValidObject(undefined)).toBe(false)
    })

    it('should return false for array', () => {
      expect(isValidObject([])).toBe(false)
    })

    it('should return false for non-object', () => {
      expect(isValidObject('string')).toBe(false)
      expect(isValidObject(123)).toBe(false)
    })

    it('should return true for object', () => {
      expect(isValidObject({})).toBe(true)
      expect(isValidObject({ key: 'value' })).toBe(true)
    })
  })

  describe('isNonEmptyString', () => {
    it('should return false for null', () => {
      expect(isNonEmptyString(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isNonEmptyString(undefined)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isNonEmptyString('')).toBe(false)
    })

    it('should return false for non-string', () => {
      expect(isNonEmptyString(123 as any)).toBe(false)
    })

    it('should return true for non-empty string', () => {
      expect(isNonEmptyString('test')).toBe(true)
    })
  })

  describe('isValidNumber', () => {
    it('should return false for null', () => {
      expect(isValidNumber(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isValidNumber(undefined)).toBe(false)
    })

    it('should return false for NaN', () => {
      expect(isValidNumber(NaN)).toBe(false)
    })

    it('should return false for Infinity', () => {
      expect(isValidNumber(Infinity)).toBe(false)
      expect(isValidNumber(-Infinity)).toBe(false)
    })

    it('should return false for non-number', () => {
      expect(isValidNumber('123' as any)).toBe(false)
    })

    it('should return true for valid number', () => {
      expect(isValidNumber(0)).toBe(true)
      expect(isValidNumber(123)).toBe(true)
      expect(isValidNumber(-123)).toBe(true)
      expect(isValidNumber(1.5)).toBe(true)
    })
  })
})
