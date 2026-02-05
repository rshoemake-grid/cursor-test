/**
 * Tests for ownershipUtils
 * Comprehensive tests to kill all mutations and achieve 100% coverage
 */

import {
  isOwner,
  filterOwnedItems,
  separateOfficialItems,
  filterUserOwnedDeletableItems,
  type OwnableItem,
  type User,
} from './ownershipUtils'

describe('ownershipUtils', () => {
  describe('isOwner', () => {
    const mockUser: User = {
      id: 'user-123',
      username: 'testuser',
    }

    const mockItem: OwnableItem = {
      id: 'item-1',
      author_id: 'user-123',
      is_official: false,
    }

    it('should return false when user is null', () => {
      expect(isOwner(mockItem, null)).toBe(false)
    })

    it('should return false when user is undefined', () => {
      expect(isOwner(mockItem, undefined as any)).toBe(false)
    })

    it('should return false when item is null', () => {
      expect(isOwner(null, mockUser)).toBe(false)
    })

    it('should return false when item is undefined', () => {
      expect(isOwner(undefined as any, mockUser)).toBe(false)
    })

    it('should return false when item.author_id is null', () => {
      const itemWithoutAuthor: OwnableItem = {
        id: 'item-1',
        author_id: null,
      }
      expect(isOwner(itemWithoutAuthor, mockUser)).toBe(false)
    })

    it('should return false when item.author_id is undefined', () => {
      const itemWithoutAuthor: OwnableItem = {
        id: 'item-1',
      }
      expect(isOwner(itemWithoutAuthor, mockUser)).toBe(false)
    })

    it('should return false when user.id is null', () => {
      const userWithoutId: User = {
        id: null as any,
        username: 'testuser',
      }
      expect(isOwner(mockItem, userWithoutId)).toBe(false)
    })

    it('should return false when user.id is undefined', () => {
      const userWithoutId: User = {
        username: 'testuser',
      } as any
      expect(isOwner(mockItem, userWithoutId)).toBe(false)
    })

    it('should return true when user owns item (string IDs match)', () => {
      expect(isOwner(mockItem, mockUser)).toBe(true)
    })

    it('should return true when user owns item (numeric IDs match as strings)', () => {
      const numericUser: User = {
        id: '123',
      }
      const numericItem: OwnableItem = {
        id: 'item-1',
        author_id: '123',
      }
      expect(isOwner(numericItem, numericUser)).toBe(true)
    })

    it('should return false when user does not own item (different IDs)', () => {
      const otherUser: User = {
        id: 'user-456',
        username: 'otheruser',
      }
      expect(isOwner(mockItem, otherUser)).toBe(false)
    })

    it('should verify exact AND condition - all conditions true', () => {
      expect(mockUser !== null).toBe(true)
      expect(mockItem !== null).toBe(true)
      expect(mockItem.author_id !== null && mockItem.author_id !== undefined).toBe(true)
      expect(mockUser.id !== null && mockUser.id !== undefined).toBe(true)
      expect(isOwner(mockItem, mockUser)).toBe(true)
    })

    it('should verify exact string comparison - String(item.author_id) === String(user.id)', () => {
      const user: User = { id: '123' }
      const item: OwnableItem = { id: 'item-1', author_id: '123' }
      expect(String(item.author_id)).toBe('123')
      expect(String(user.id)).toBe('123')
      expect(String(item.author_id) === String(user.id)).toBe(true)
      expect(isOwner(item, user)).toBe(true)
    })

    it('should verify exact string comparison - String(item.author_id) !== String(user.id)', () => {
      const user: User = { id: '123' }
      const item: OwnableItem = { id: 'item-1', author_id: '456' }
      expect(String(item.author_id)).toBe('456')
      expect(String(user.id)).toBe('123')
      expect(String(item.author_id) === String(user.id)).toBe(false)
      expect(isOwner(item, user)).toBe(false)
    })

    it('should handle numeric author_id converted to string', () => {
      const user: User = { id: '123' }
      const item: OwnableItem = { id: 'item-1', author_id: 123 as any }
      expect(isOwner(item, user)).toBe(true)
    })
  })

  describe('filterOwnedItems', () => {
    const mockUser: User = {
      id: 'user-123',
      username: 'testuser',
    }

    const ownedItem: OwnableItem = {
      id: 'item-1',
      author_id: 'user-123',
      is_official: false,
    }

    const otherItem: OwnableItem = {
      id: 'item-2',
      author_id: 'user-456',
      is_official: false,
    }

    it('should return empty array when user is null', () => {
      const items = [ownedItem, otherItem]
      expect(filterOwnedItems(items, null)).toEqual([])
    })

    it('should return empty array when user is undefined', () => {
      const items = [ownedItem, otherItem]
      expect(filterOwnedItems(items, undefined as any)).toEqual([])
    })

    it('should return empty array when user.id is null', () => {
      const userWithoutId: User = {
        id: null as any,
        username: 'testuser',
      }
      const items = [ownedItem, otherItem]
      expect(filterOwnedItems(items, userWithoutId)).toEqual([])
    })

    it('should return empty array when user.id is undefined', () => {
      const userWithoutId: User = {
        username: 'testuser',
      } as any
      const items = [ownedItem, otherItem]
      expect(filterOwnedItems(items, userWithoutId)).toEqual([])
    })

    it('should return only owned items', () => {
      const items = [ownedItem, otherItem]
      const result = filterOwnedItems(items, mockUser)
      expect(result).toEqual([ownedItem])
      expect(result.length).toBe(1)
    })

    it('should return empty array when no items are owned', () => {
      const items = [otherItem]
      const result = filterOwnedItems(items, mockUser)
      expect(result).toEqual([])
    })

    it('should return all items when all are owned', () => {
      const anotherOwnedItem: OwnableItem = {
        id: 'item-3',
        author_id: 'user-123',
        is_official: false,
      }
      const items = [ownedItem, anotherOwnedItem]
      const result = filterOwnedItems(items, mockUser)
      expect(result).toEqual([ownedItem, anotherOwnedItem])
      expect(result.length).toBe(2)
    })

    it('should handle empty array', () => {
      expect(filterOwnedItems([], mockUser)).toEqual([])
    })

    it('should verify exact falsy check - user is null', () => {
      const items = [ownedItem]
      expect(filterOwnedItems(items, null)).toEqual([])
    })

    it('should verify exact falsy check - user.id is falsy', () => {
      const userWithoutId: User = {
        username: 'testuser',
      } as any
      const items = [ownedItem]
      expect(filterOwnedItems(items, userWithoutId)).toEqual([])
    })
  })

  describe('separateOfficialItems', () => {
    const officialItem: OwnableItem = {
      id: 'item-1',
      author_id: 'user-123',
      is_official: true,
    }

    const deletableItem: OwnableItem = {
      id: 'item-2',
      author_id: 'user-123',
      is_official: false,
    }

    const itemWithoutFlag: OwnableItem = {
      id: 'item-3',
      author_id: 'user-123',
    }

    it('should separate official and deletable items', () => {
      const items = [officialItem, deletableItem]
      const result = separateOfficialItems(items)
      expect(result.official).toEqual([officialItem])
      expect(result.deletable).toEqual([deletableItem])
    })

    it('should put items with is_official === true in official array', () => {
      const items = [officialItem]
      const result = separateOfficialItems(items)
      expect(result.official).toEqual([officialItem])
      expect(result.deletable).toEqual([])
    })

    it('should put items with is_official === false in deletable array', () => {
      const items = [deletableItem]
      const result = separateOfficialItems(items)
      expect(result.official).toEqual([])
      expect(result.deletable).toEqual([deletableItem])
    })

    it('should put items with undefined is_official in deletable array', () => {
      const items = [itemWithoutFlag]
      const result = separateOfficialItems(items)
      expect(result.official).toEqual([])
      expect(result.deletable).toEqual([itemWithoutFlag])
    })

    it('should handle empty array', () => {
      const result = separateOfficialItems([])
      expect(result.official).toEqual([])
      expect(result.deletable).toEqual([])
    })

    it('should handle mixed items', () => {
      const items = [officialItem, deletableItem, itemWithoutFlag]
      const result = separateOfficialItems(items)
      expect(result.official).toEqual([officialItem])
      expect(result.deletable).toEqual([deletableItem, itemWithoutFlag])
    })

    it('should verify exact conditional - item.is_official is true', () => {
      const items = [officialItem]
      const result = separateOfficialItems(items)
      expect(officialItem.is_official).toBe(true)
      expect(result.official).toContain(officialItem)
    })

    it('should verify exact conditional - item.is_official is false', () => {
      const items = [deletableItem]
      const result = separateOfficialItems(items)
      expect(deletableItem.is_official).toBe(false)
      expect(result.deletable).toContain(deletableItem)
    })

    it('should verify exact conditional - item.is_official is undefined (falsy)', () => {
      const items = [itemWithoutFlag]
      const result = separateOfficialItems(items)
      expect(itemWithoutFlag.is_official).toBeUndefined()
      expect(result.deletable).toContain(itemWithoutFlag)
    })

    it('should handle item with is_official === null', () => {
      const itemWithNull: OwnableItem = {
        id: 'item-4',
        author_id: 'user-123',
        is_official: null as any,
      }
      const items = [itemWithNull]
      const result = separateOfficialItems(items)
      expect(result.official).toEqual([])
      expect(result.deletable).toEqual([itemWithNull])
    })
  })

  describe('filterUserOwnedDeletableItems', () => {
    const mockUser: User = {
      id: 'user-123',
      username: 'testuser',
    }

    const officialItem: OwnableItem = {
      id: 'item-1',
      author_id: 'user-123',
      is_official: true,
    }

    const deletableOwnedItem: OwnableItem = {
      id: 'item-2',
      author_id: 'user-123',
      is_official: false,
    }

    const deletableOtherItem: OwnableItem = {
      id: 'item-3',
      author_id: 'user-456',
      is_official: false,
    }

    it('should return only user-owned deletable items', () => {
      const items = [officialItem, deletableOwnedItem, deletableOtherItem]
      const result = filterUserOwnedDeletableItems(items, mockUser)
      expect(result).toEqual([deletableOwnedItem])
    })

    it('should exclude official items even if owned', () => {
      const items = [officialItem, deletableOwnedItem]
      const result = filterUserOwnedDeletableItems(items, mockUser)
      expect(result).toEqual([deletableOwnedItem])
      expect(result).not.toContain(officialItem)
    })

    it('should exclude items owned by other users', () => {
      const items = [deletableOwnedItem, deletableOtherItem]
      const result = filterUserOwnedDeletableItems(items, mockUser)
      expect(result).toEqual([deletableOwnedItem])
      expect(result).not.toContain(deletableOtherItem)
    })

    it('should return empty array when user is null', () => {
      const items = [deletableOwnedItem]
      expect(filterUserOwnedDeletableItems(items, null)).toEqual([])
    })

    it('should return empty array when no matching items', () => {
      const items = [officialItem, deletableOtherItem]
      const result = filterUserOwnedDeletableItems(items, mockUser)
      expect(result).toEqual([])
    })

    it('should handle empty array', () => {
      expect(filterUserOwnedDeletableItems([], mockUser)).toEqual([])
    })

    it('should verify it calls separateOfficialItems then filterOwnedItems', () => {
      const items = [officialItem, deletableOwnedItem, deletableOtherItem]
      const result = filterUserOwnedDeletableItems(items, mockUser)
      // Should first separate official items, then filter by ownership
      expect(result.length).toBe(1)
      expect(result[0]).toEqual(deletableOwnedItem)
    })
  })
})
