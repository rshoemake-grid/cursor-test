/**
 * Pending Agents Storage Tests
 * Tests for pending agents storage utilities to ensure mutation resistance
 */

import { clearPendingAgents } from './pendingAgentsStorage'
import { PENDING_AGENTS_STORAGE_KEY } from './marketplaceConstants'

describe('pendingAgentsStorage', () => {
  describe('clearPendingAgents', () => {
    it('should remove item from storage when storage exists', () => {
      const removeItem = jest.fn()
      const storage = {
        removeItem
      } as any

      clearPendingAgents(storage)

      expect(removeItem).toHaveBeenCalledWith(PENDING_AGENTS_STORAGE_KEY)
      expect(removeItem).toHaveBeenCalledTimes(1)
    })

    it('should not throw when storage is null', () => {
      expect(() => {
        clearPendingAgents(null)
      }).not.toThrow()
    })

    it('should not throw when storage is undefined', () => {
      expect(() => {
        clearPendingAgents(undefined as any)
      }).not.toThrow()
    })

    it('should use correct storage key from constants', () => {
      const removeItem = jest.fn()
      const storage = {
        removeItem
      } as any

      clearPendingAgents(storage)

      expect(removeItem).toHaveBeenCalledWith(PENDING_AGENTS_STORAGE_KEY)
    })

    it('should handle storage with other methods', () => {
      const removeItem = jest.fn()
      const getItem = jest.fn()
      const setItem = jest.fn()
      const storage = {
        removeItem,
        getItem,
        setItem
      } as any

      clearPendingAgents(storage)

      expect(removeItem).toHaveBeenCalledWith(PENDING_AGENTS_STORAGE_KEY)
      expect(getItem).not.toHaveBeenCalled()
      expect(setItem).not.toHaveBeenCalled()
    })
  })
})
