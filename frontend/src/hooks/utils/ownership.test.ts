/**
 * Tests for Ownership Utilities (Hooks)
 */

import { canUserDelete } from './ownership'
import { isOwner } from '../../utils/ownershipUtils'
import type { OwnableItem, User } from '../../utils/ownershipUtils'

jest.mock('../../utils/ownershipUtils', () => ({
  isOwner: jest.fn(),
  filterOwnedItems: jest.fn(),
  separateOfficialItems: jest.fn(),
  filterUserOwnedDeletableItems: jest.fn(),
}))

const mockIsOwner = isOwner as jest.MockedFunction<typeof isOwner>

describe('ownership', () => {
  const mockUser: User = {
    id: 'user-123',
    username: 'testuser',
  }

  const mockItem: OwnableItem = {
    id: 'item-1',
    author_id: 'user-123',
    is_official: false,
  }

  beforeEach(() => {
    // Don't use jest.clearAllMocks() as it may interfere with mocks in other test files
    // Only clear the specific mock used in this test file
    mockIsOwner.mockClear()
    // Default mock return value
    mockIsOwner.mockReturnValue(false)
  })

  describe('canUserDelete', () => {
    it('should return false when item is null', () => {
      const result = canUserDelete(null, mockUser)
      expect(result).toBe(false)
      expect(mockIsOwner).not.toHaveBeenCalled()
    })

    it('should return false when item is undefined', () => {
      const result = canUserDelete(undefined, mockUser)
      expect(result).toBe(false)
      expect(mockIsOwner).not.toHaveBeenCalled()
    })

    it('should return false when item is official', () => {
      const officialItem: OwnableItem = {
        ...mockItem,
        is_official: true,
      }
      const result = canUserDelete(officialItem, mockUser)
      expect(result).toBe(false)
      expect(mockIsOwner).not.toHaveBeenCalled()
    })

    it('should return false when user is null', () => {
      mockIsOwner.mockReturnValue(false)
      const result = canUserDelete(mockItem, null)
      expect(result).toBe(false)
      expect(mockIsOwner).toHaveBeenCalledWith(mockItem, null)
    })

    it('should return false when user is undefined', () => {
      mockIsOwner.mockReturnValue(false)
      const result = canUserDelete(mockItem, undefined)
      expect(result).toBe(false)
      // Function normalizes undefined to null (defensive programming)
      expect(mockIsOwner).toHaveBeenCalledWith(mockItem, null)
    })

    it('should return true when item is not official and user owns it', () => {
      mockIsOwner.mockReturnValue(true)
      const result = canUserDelete(mockItem, mockUser)
      expect(result).toBe(true)
      expect(mockIsOwner).toHaveBeenCalledWith(mockItem, mockUser)
    })

    it('should return false when item is not official but user does not own it', () => {
      mockIsOwner.mockReturnValue(false)
      const result = canUserDelete(mockItem, mockUser)
      expect(result).toBe(false)
      expect(mockIsOwner).toHaveBeenCalledWith(mockItem, mockUser)
    })

    it('should handle item with undefined is_official as deletable', () => {
      mockIsOwner.mockReturnValue(true)
      const itemWithoutOfficial: OwnableItem = {
        id: 'item-1',
        author_id: 'user-123',
      }
      const result = canUserDelete(itemWithoutOfficial, mockUser)
      expect(result).toBe(true)
      expect(mockIsOwner).toHaveBeenCalledWith(itemWithoutOfficial, mockUser)
    })

    it('should handle item with null is_official as deletable', () => {
      mockIsOwner.mockReturnValue(true)
      const itemWithNullOfficial: OwnableItem = {
        id: 'item-1',
        author_id: 'user-123',
        is_official: null as any,
      }
      const result = canUserDelete(itemWithNullOfficial, mockUser)
      expect(result).toBe(true)
      expect(mockIsOwner).toHaveBeenCalledWith(itemWithNullOfficial, mockUser)
    })

    it('should check ownership even when is_official is false', () => {
      mockIsOwner.mockReturnValue(false)
      const nonOfficialItem: OwnableItem = {
        ...mockItem,
        is_official: false,
      }
      const result = canUserDelete(nonOfficialItem, mockUser)
      expect(result).toBe(false)
      expect(mockIsOwner).toHaveBeenCalledWith(nonOfficialItem, mockUser)
    })

    it('should prioritize official check over ownership check', () => {
      const officialItem: OwnableItem = {
        ...mockItem,
        is_official: true,
      }
      mockIsOwner.mockReturnValue(true) // Even if user owns it
      const result = canUserDelete(officialItem, mockUser)
      expect(result).toBe(false)
      expect(mockIsOwner).not.toHaveBeenCalled()
    })
  })
})
