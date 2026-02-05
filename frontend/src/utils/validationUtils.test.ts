/**
 * Tests for validationUtils
 * Covers all code paths to eliminate no-coverage mutations
 */

import { isEmptySelection, isStorageAvailable } from './validationUtils'

describe('validationUtils', () => {
  describe('isEmptySelection', () => {
    it('should return true when set is empty', () => {
      const ids = new Set<string>()
      expect(isEmptySelection(ids)).toBe(true)
    })

    it('should return false when set has one item', () => {
      const ids = new Set<string>(['id1'])
      expect(isEmptySelection(ids)).toBe(false)
    })

    it('should return false when set has multiple items', () => {
      const ids = new Set<string>(['id1', 'id2', 'id3'])
      expect(isEmptySelection(ids)).toBe(false)
    })

    it('should verify exact size comparison - size === 0', () => {
      const emptySet = new Set<string>()
      expect(emptySet.size).toBe(0)
      expect(isEmptySelection(emptySet)).toBe(true)
    })

    it('should verify exact size comparison - size !== 0', () => {
      const nonEmptySet = new Set<string>(['id1'])
      expect(nonEmptySet.size).toBe(1)
      expect(isEmptySelection(nonEmptySet)).toBe(false)
    })
  })

  describe('isStorageAvailable', () => {
    it('should return false when storage is null', () => {
      expect(isStorageAvailable(null)).toBe(false)
    })

    it('should return false when storage is undefined', () => {
      expect(isStorageAvailable(undefined)).toBe(false)
    })

    it('should return true when storage is an object', () => {
      const storage = { getItem: jest.fn() }
      expect(isStorageAvailable(storage)).toBe(true)
    })

    it('should return true when storage is an empty object', () => {
      expect(isStorageAvailable({})).toBe(true)
    })

    it('should verify exact AND condition - storage !== null && storage !== undefined (both true)', () => {
      const storage = { getItem: jest.fn() }
      expect(storage !== null).toBe(true)
      expect(storage !== undefined).toBe(true)
      expect(isStorageAvailable(storage)).toBe(true)
    })

    it('should verify exact AND condition - storage === null (first false)', () => {
      const storage = null
      expect(storage !== null).toBe(false)
      expect(isStorageAvailable(storage)).toBe(false)
    })

    it('should verify exact AND condition - storage === undefined (second false)', () => {
      const storage = undefined
      expect(storage !== undefined).toBe(false)
      expect(isStorageAvailable(storage)).toBe(false)
    })

    it('should return true for truthy values like empty string', () => {
      // Note: empty string is truthy but !== null and !== undefined
      expect(isStorageAvailable('')).toBe(true)
    })

    it('should return true for number 0', () => {
      // Note: 0 is falsy but !== null and !== undefined
      expect(isStorageAvailable(0)).toBe(true)
    })

    it('should return true for boolean false', () => {
      // Note: false is falsy but !== null and !== undefined
      expect(isStorageAvailable(false)).toBe(true)
    })
  })
})
