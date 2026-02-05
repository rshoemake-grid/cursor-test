/**
 * Tests for storage validation utilities
 * These tests ensure mutation-resistant validation functions work correctly
 */

import {
  isStorageAvailable,
  canSaveToStorage,
  getStorageItem,
  setStorageItem,
} from './storageValidation'
import type { StorageAdapter } from '../../types/adapters'

describe('storageValidation', () => {
  let mockStorage: StorageAdapter

  beforeEach(() => {
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
  })

  describe('isStorageAvailable', () => {
    it('should return true for valid storage', () => {
      expect(isStorageAvailable(mockStorage)).toBe(true)
    })

    it('should return false for null storage', () => {
      expect(isStorageAvailable(null)).toBe(false)
    })

    it('should return false for undefined storage', () => {
      expect(isStorageAvailable(undefined)).toBe(false)
    })
  })

  describe('canSaveToStorage', () => {
    it('should return true when storage available and updated is true', () => {
      expect(canSaveToStorage(mockStorage, true)).toBe(true)
    })

    it('should return false when storage is null', () => {
      expect(canSaveToStorage(null, true)).toBe(false)
    })

    it('should return false when updated is false', () => {
      expect(canSaveToStorage(mockStorage, false)).toBe(false)
    })

    it('should return false when both conditions false', () => {
      expect(canSaveToStorage(null, false)).toBe(false)
    })
  })

  describe('getStorageItem', () => {
    it('should return item when storage available and item exists', () => {
      mockStorage.getItem = jest.fn().mockReturnValue('{"key": "value"}')
      const result = getStorageItem(mockStorage, 'test-key', {})
      expect(result).toEqual({ key: 'value' })
    })

    it('should return default when storage is null', () => {
      const defaultValue = { default: true }
      const result = getStorageItem(null, 'test-key', defaultValue)
      expect(result).toBe(defaultValue)
    })

    it('should return default when item does not exist', () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      const defaultValue = { default: true }
      const result = getStorageItem(mockStorage, 'test-key', defaultValue)
      expect(result).toBe(defaultValue)
    })

    it('should return default when JSON parse fails', () => {
      mockStorage.getItem = jest.fn().mockReturnValue('invalid json')
      const defaultValue = { default: true }
      const result = getStorageItem(mockStorage, 'test-key', defaultValue)
      expect(result).toBe(defaultValue)
    })
  })

  describe('setStorageItem', () => {
    it('should set item when storage available', () => {
      const result = setStorageItem(mockStorage, 'test-key', { key: 'value' })
      expect(result).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalledWith('test-key', '{"key":"value"}')
    })

    it('should return false when storage is null', () => {
      const result = setStorageItem(null, 'test-key', { key: 'value' })
      expect(result).toBe(false)
    })

    it('should return false when setItem throws error', () => {
      mockStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage error')
      })
      const result = setStorageItem(mockStorage, 'test-key', { key: 'value' })
      expect(result).toBe(false)
    })
  })
})
