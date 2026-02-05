/**
 * Tests for deletion validation utilities
 * These tests ensure mutation-resistant validation functions work correctly
 */

import {
  hasOfficialItems,
  hasUserOwnedItems,
  hasNoUserOwnedItems,
  ownsAllItems,
  ownsPartialItems,
  hasItemsWithAuthorId,
  getItemsWithAuthorIdCount,
} from './deletionValidation'

describe('deletionValidation', () => {
  describe('hasOfficialItems', () => {
    it('should return true when items have official items', () => {
      const items = [
        { id: '1', is_official: true },
        { id: '2', is_official: false },
      ]
      expect(hasOfficialItems(items)).toBe(true)
    })

    it('should return false when no official items', () => {
      const items = [
        { id: '1', is_official: false },
        { id: '2', is_official: false },
      ]
      expect(hasOfficialItems(items)).toBe(false)
    })

    it('should return false when empty array', () => {
      expect(hasOfficialItems([])).toBe(false)
    })

    it('should return false when is_official is undefined', () => {
      const items = [{ id: '1' }]
      expect(hasOfficialItems(items)).toBe(false)
    })
  })

  describe('hasUserOwnedItems', () => {
    it('should return true when array has items', () => {
      expect(hasUserOwnedItems([{ id: '1' }])).toBe(true)
    })

    it('should return false when empty array', () => {
      expect(hasUserOwnedItems([])).toBe(false)
    })
  })

  describe('hasNoUserOwnedItems', () => {
    it('should return true when empty array', () => {
      expect(hasNoUserOwnedItems([])).toBe(true)
    })

    it('should return false when array has items', () => {
      expect(hasNoUserOwnedItems([{ id: '1' }])).toBe(false)
    })
  })

  describe('ownsAllItems', () => {
    it('should return true when counts are equal and > 0', () => {
      expect(ownsAllItems(5, 5)).toBe(true)
    })

    it('should return false when counts are equal but 0', () => {
      expect(ownsAllItems(0, 0)).toBe(false)
    })

    it('should return false when counts are different', () => {
      expect(ownsAllItems(3, 5)).toBe(false)
    })
  })

  describe('ownsPartialItems', () => {
    it('should return true when user owns some but not all', () => {
      expect(ownsPartialItems(3, 5)).toBe(true)
    })

    it('should return false when user owns all', () => {
      expect(ownsPartialItems(5, 5)).toBe(false)
    })

    it('should return false when user owns none', () => {
      expect(ownsPartialItems(0, 5)).toBe(false)
    })
  })

  describe('hasItemsWithAuthorId', () => {
    it('should return true when items have author_id', () => {
      const items = [
        { id: '1', author_id: 'user-1' },
        { id: '2', author_id: null },
      ]
      expect(hasItemsWithAuthorId(items)).toBe(true)
    })

    it('should return false when no items have author_id', () => {
      const items = [
        { id: '1', author_id: null },
        { id: '2', author_id: null },
      ]
      expect(hasItemsWithAuthorId(items)).toBe(false)
    })

    it('should return false when author_id is empty string', () => {
      const items = [
        { id: '1', author_id: '' },
      ]
      expect(hasItemsWithAuthorId(items)).toBe(false)
    })

    it('should return false when empty array', () => {
      expect(hasItemsWithAuthorId([])).toBe(false)
    })
  })

  describe('getItemsWithAuthorIdCount', () => {
    it('should return correct count', () => {
      const items = [
        { id: '1', author_id: 'user-1' },
        { id: '2', author_id: 'user-2' },
        { id: '3', author_id: null },
      ]
      expect(getItemsWithAuthorIdCount(items)).toBe(2)
    })

    it('should return 0 when no items have author_id', () => {
      const items = [
        { id: '1', author_id: null },
      ]
      expect(getItemsWithAuthorIdCount(items)).toBe(0)
    })
  })
})
