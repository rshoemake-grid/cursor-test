/**
 * Tests for user validation utilities
 * These tests ensure mutation-resistant validation functions work correctly
 */

import {
  isValidUser,
  canUserOperate,
  canMigrateUserData,
  doesUserOwnItem,
  canUserDeleteItem,
  getUserId,
  getUserDisplayName,
} from './userValidation'

describe('userValidation', () => {
  describe('isValidUser', () => {
    it('should return true for valid user with id', () => {
      const user = { id: 'user-1', username: 'testuser' }
      expect(isValidUser(user)).toBe(true)
    })

    it('should return false for null user', () => {
      expect(isValidUser(null)).toBe(false)
    })

    it('should return false for undefined user', () => {
      expect(isValidUser(undefined)).toBe(false)
    })

    it('should return false for user without id', () => {
      const user = { username: 'testuser' } as any
      expect(isValidUser(user)).toBe(false)
    })

    it('should return false for user with empty id', () => {
      const user = { id: '', username: 'testuser' }
      expect(isValidUser(user)).toBe(false)
    })

    it('should return false for user with null id', () => {
      const user = { id: null as any, username: 'testuser' }
      expect(isValidUser(user)).toBe(false)
    })
  })

  describe('canUserOperate', () => {
    it('should return true for valid user', () => {
      const user = { id: 'user-1' }
      expect(canUserOperate(user)).toBe(true)
    })

    it('should return false for null user', () => {
      expect(canUserOperate(null)).toBe(false)
    })
  })

  describe('canMigrateUserData', () => {
    it('should return true when user valid and data array has items', () => {
      const user = { id: 'user-1' }
      const data = [{ id: 'item-1' }]
      expect(canMigrateUserData(user, data)).toBe(true)
    })

    it('should return false when user is null', () => {
      const data = [{ id: 'item-1' }]
      expect(canMigrateUserData(null, data)).toBe(false)
    })

    it('should return false when user has no id', () => {
      const user = { username: 'test' } as any
      const data = [{ id: 'item-1' }]
      expect(canMigrateUserData(user, data)).toBe(false)
    })

    it('should return false when data is null', () => {
      const user = { id: 'user-1' }
      expect(canMigrateUserData(user, null)).toBe(false)
    })

    it('should return false when data is undefined', () => {
      const user = { id: 'user-1' }
      expect(canMigrateUserData(user, undefined)).toBe(false)
    })

    it('should return false when data is empty array', () => {
      const user = { id: 'user-1' }
      expect(canMigrateUserData(user, [])).toBe(false)
    })

    it('should return false when data is not an array', () => {
      const user = { id: 'user-1' }
      expect(canMigrateUserData(user, 'not array' as any)).toBe(false)
    })
  })

  describe('doesUserOwnItem', () => {
    it('should return true when user owns item', () => {
      const user = { id: 'user-1' }
      expect(doesUserOwnItem(user, 'user-1')).toBe(true)
    })

    it('should return false when user is null', () => {
      expect(doesUserOwnItem(null, 'user-1')).toBe(false)
    })

    it('should return false when itemAuthorId is null', () => {
      const user = { id: 'user-1' }
      expect(doesUserOwnItem(user, null)).toBe(false)
    })

    it('should return false when itemAuthorId is empty string', () => {
      const user = { id: 'user-1' }
      expect(doesUserOwnItem(user, '')).toBe(false)
    })

    it('should return false when user does not own item', () => {
      const user = { id: 'user-1' }
      expect(doesUserOwnItem(user, 'user-2')).toBe(false)
    })
  })

  describe('canUserDeleteItem', () => {
    it('should return true when user can delete', () => {
      const user = { id: 'user-1' }
      expect(canUserDeleteItem(user, 'user-1')).toBe(true)
    })

    it('should return false when user cannot delete', () => {
      const user = { id: 'user-1' }
      expect(canUserDeleteItem(user, 'user-2')).toBe(false)
    })
  })

  describe('getUserId', () => {
    it('should return user id for valid user', () => {
      const user = { id: 'user-1' }
      expect(getUserId(user)).toBe('user-1')
    })

    it('should return null for null user', () => {
      expect(getUserId(null)).toBe(null)
    })

    it('should return null for user without id', () => {
      const user = { username: 'test' } as any
      expect(getUserId(user)).toBe(null)
    })
  })

  describe('getUserDisplayName', () => {
    it('should return username when available', () => {
      const user = { id: 'user-1', username: 'testuser' }
      expect(getUserDisplayName(user)).toBe('testuser')
    })

    it('should return email when username not available', () => {
      const user = { id: 'user-1', email: 'test@example.com' }
      expect(getUserDisplayName(user)).toBe('test@example.com')
    })

    it('should return null when neither username nor email', () => {
      const user = { id: 'user-1' }
      expect(getUserDisplayName(user)).toBe(null)
    })

    it('should return null for null user', () => {
      expect(getUserDisplayName(null)).toBe(null)
    })
  })
})
