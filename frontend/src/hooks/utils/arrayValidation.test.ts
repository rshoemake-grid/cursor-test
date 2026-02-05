/**
 * Tests for array validation utilities
 * These tests ensure mutation-resistant validation functions work correctly
 */

import {
  isValidArray,
  hasArrayItems,
  isArrayEmpty,
  getArrayLength,
  canProcessArray,
} from './arrayValidation'

describe('arrayValidation', () => {
  describe('isValidArray', () => {
    it('should return true for array', () => {
      expect(isValidArray([])).toBe(true)
      expect(isValidArray([1, 2, 3])).toBe(true)
    })

    it('should return false for null', () => {
      expect(isValidArray(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isValidArray(undefined)).toBe(false)
    })

    it('should return false for string', () => {
      expect(isValidArray('not array')).toBe(false)
    })

    it('should return false for object', () => {
      expect(isValidArray({})).toBe(false)
    })
  })

  describe('hasArrayItems', () => {
    it('should return true when array has items', () => {
      expect(hasArrayItems([1, 2, 3])).toBe(true)
      expect(hasArrayItems(['item'])).toBe(true)
    })

    it('should return false when array is empty', () => {
      expect(hasArrayItems([])).toBe(false)
    })

    it('should return false when null', () => {
      expect(hasArrayItems(null)).toBe(false)
    })

    it('should return false when undefined', () => {
      expect(hasArrayItems(undefined)).toBe(false)
    })

    it('should return false when not an array', () => {
      expect(hasArrayItems('not array' as any)).toBe(false)
    })
  })

  describe('isArrayEmpty', () => {
    it('should return true when array is empty', () => {
      expect(isArrayEmpty([])).toBe(true)
    })

    it('should return false when array has items', () => {
      expect(isArrayEmpty([1, 2, 3])).toBe(false)
    })

    it('should return true when null', () => {
      expect(isArrayEmpty(null)).toBe(true)
    })

    it('should return true when undefined', () => {
      expect(isArrayEmpty(undefined)).toBe(true)
    })

    it('should return true when not an array', () => {
      expect(isArrayEmpty('not array' as any)).toBe(true)
    })
  })

  describe('getArrayLength', () => {
    it('should return length when array has items', () => {
      expect(getArrayLength([1, 2, 3])).toBe(3)
    })

    it('should return 0 when array is empty', () => {
      expect(getArrayLength([])).toBe(0)
    })

    it('should return 0 when null', () => {
      expect(getArrayLength(null)).toBe(0)
    })

    it('should return 0 when undefined', () => {
      expect(getArrayLength(undefined)).toBe(0)
    })

    it('should return 0 when not an array', () => {
      expect(getArrayLength('not array' as any)).toBe(0)
    })
  })

  describe('canProcessArray', () => {
    it('should return true when array has items', () => {
      expect(canProcessArray([1, 2, 3])).toBe(true)
    })

    it('should return false when array is empty', () => {
      expect(canProcessArray([])).toBe(false)
    })

    it('should return false when null', () => {
      expect(canProcessArray(null)).toBe(false)
    })
  })
})
