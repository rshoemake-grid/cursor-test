/**
 * Tests for remaining branches in useLocalStorage.ts
 * 
 * These tests target branches that are not covered by existing tests,
 * focusing on null/undefined storage scenarios.
 */

import { renderHook, act } from '@testing-library/react'
import { useLocalStorage, getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } from './useLocalStorage'
import { defaultAdapters } from '../../types/adapters'

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

jest.mock('../../types/adapters', () => ({
  defaultAdapters: {
    createLocalStorageAdapter: jest.fn(),
  },
}))

describe('useLocalStorage - Remaining Branches', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: return null to test null branches
    ;(defaultAdapters.createLocalStorageAdapter as jest.Mock).mockReturnValue(null)
  })

  describe('useLocalStorage hook - storage null branches', () => {
    it('should return initialValue when storage is null in useState initializer', () => {
      // Mock adapter to return null
      (defaultAdapters.createLocalStorageAdapter as jest.Mock).mockReturnValue(null)
      
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value')
      )

      // Should return initialValue when storage is null (lines 23-24)
      expect(result.current[0]).toBe('initial-value')
    })

    it('should not call storage.getItem when storage is null', () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      // Mock adapter to return null
      ;(defaultAdapters.createLocalStorageAdapter as jest.Mock).mockReturnValue(null)

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value')
      )

      // Should not call getItem when storage is null
      expect(mockStorage.getItem).not.toHaveBeenCalled()
      expect(result.current[0]).toBe('initial-value')
    })

    it('should not set up storage listener when storage is null', () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      // Mock adapter to return null
      ;(defaultAdapters.createLocalStorageAdapter as jest.Mock).mockReturnValue(null)

      renderHook(() =>
        useLocalStorage('test-key', 'initial-value')
      )

      // Should not call addEventListener when storage is null (lines 75-76)
      expect(mockStorage.addEventListener).not.toHaveBeenCalled()
    })

    it('should not call storage.setItem when storage is null in setValue', () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      // Mock adapter to return null
      ;(defaultAdapters.createLocalStorageAdapter as jest.Mock).mockReturnValue(null)

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value')
      )

      act(() => {
        result.current[1]('new-value')
      })

      // Should update state but not call storage.setItem (line 48 check)
      expect(result.current[0]).toBe('new-value')
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should not call storage.removeItem when storage is null in removeValue', () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      // Mock adapter to return null
      ;(defaultAdapters.createLocalStorageAdapter as jest.Mock).mockReturnValue(null)

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value')
      )

      act(() => {
        result.current[2]()
      })

      // Should reset state but not call storage.removeItem (line 65 check)
      expect(result.current[0]).toBe('initial-value')
      expect(mockStorage.removeItem).not.toHaveBeenCalled()
    })
  })

  describe('getLocalStorageItem - storage null branches', () => {
    it('should return defaultValue when storage is null', () => {
      const result = getLocalStorageItem('test-key', 'default-value', { storage: null })

      // Should return defaultValue when storage is null (lines 111-112)
      expect(result).toBe('default-value')
    })

    it('should not call storage.getItem when storage is null', () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      }

      getLocalStorageItem('test-key', 'default-value', { storage: null })

      // Should not call getItem when storage is null
      expect(mockStorage.getItem).not.toHaveBeenCalled()
    })
  })

  describe('setLocalStorageItem - storage null branches', () => {
    it('should return false when storage is null', () => {
      // Mock adapter to return null
      (defaultAdapters.createLocalStorageAdapter as jest.Mock).mockReturnValue(null)
      
      const result = setLocalStorageItem('test-key', 'value')

      // Should return false when storage is null (lines 166-167)
      expect(result).toBe(false)
    })

    it('should not call storage.setItem when storage is null', () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      }

      // Mock adapter to return null
      ;(defaultAdapters.createLocalStorageAdapter as jest.Mock).mockReturnValue(null)

      setLocalStorageItem('test-key', 'value')

      // Should not call setItem when storage is null
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('removeLocalStorageItem - storage null branches', () => {
    it('should return false when storage is null', () => {
      // Mock adapter to return null
      (defaultAdapters.createLocalStorageAdapter as jest.Mock).mockReturnValue(null)
      
      const result = removeLocalStorageItem('test-key')

      // Should return false when storage is null (lines 195-196)
      expect(result).toBe(false)
    })

    it('should not call storage.removeItem when storage is null', () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      }

      // Mock adapter to return null
      ;(defaultAdapters.createLocalStorageAdapter as jest.Mock).mockReturnValue(null)

      removeLocalStorageItem('test-key')

      // Should not call removeItem when storage is null
      expect(mockStorage.removeItem).not.toHaveBeenCalled()
    })
  })

})
