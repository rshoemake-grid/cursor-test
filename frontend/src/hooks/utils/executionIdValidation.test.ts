/**
 * Tests for execution ID validation utilities
 * These tests ensure mutation-resistant validation functions work correctly
 */

import {
  isPendingExecutionId,
  isRealExecutionId,
  isValidExecutionId,
  executionIdStartsWith,
  shouldLogExecutionError,
  isTemporaryExecutionId,
} from './executionIdValidation'

describe('executionIdValidation', () => {
  describe('isPendingExecutionId', () => {
    it('should return true for pending execution ID', () => {
      expect(isPendingExecutionId('pending-123-test')).toBe(true)
    })

    it('should return false for real execution ID', () => {
      expect(isPendingExecutionId('exec-123')).toBe(false)
    })

    it('should return false for null', () => {
      expect(isPendingExecutionId(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isPendingExecutionId(undefined)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isPendingExecutionId('')).toBe(false)
    })

    it('should return true for different pending IDs', () => {
      expect(isPendingExecutionId('pending-456-other')).toBe(true)
      expect(isPendingExecutionId('pending-abc-def')).toBe(true)
    })
  })

  describe('isRealExecutionId', () => {
    it('should return true for real execution ID', () => {
      expect(isRealExecutionId('exec-123')).toBe(true)
    })

    it('should return false for pending execution ID', () => {
      expect(isRealExecutionId('pending-123-test')).toBe(false)
    })

    it('should return false for null', () => {
      expect(isRealExecutionId(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isRealExecutionId(undefined)).toBe(false)
    })
  })

  describe('isValidExecutionId', () => {
    it('should return true for valid execution ID', () => {
      expect(isValidExecutionId('exec-123')).toBe(true)
      expect(isValidExecutionId('pending-123')).toBe(true)
    })

    it('should return false for null', () => {
      expect(isValidExecutionId(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isValidExecutionId(undefined)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isValidExecutionId('')).toBe(false)
    })
  })

  describe('executionIdStartsWith', () => {
    it('should return true when ID starts with prefix', () => {
      expect(executionIdStartsWith('pending-123', 'pending-')).toBe(true)
    })

    it('should return false when ID does not start with prefix', () => {
      expect(executionIdStartsWith('exec-123', 'pending-')).toBe(false)
    })

    it('should return false for null', () => {
      expect(executionIdStartsWith(null, 'pending-')).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(executionIdStartsWith(undefined, 'pending-')).toBe(false)
    })

    it('should return false when startsWith method missing', () => {
      const mockId = { toString: () => 'pending-123' } as any
      expect(executionIdStartsWith(mockId, 'pending-')).toBe(false)
    })
  })

  describe('shouldLogExecutionError', () => {
    it('should return true for real execution ID', () => {
      const exec = { id: 'exec-123' }
      expect(shouldLogExecutionError(exec)).toBe(true)
    })

    it('should return false for pending execution ID', () => {
      const exec = { id: 'pending-123' }
      expect(shouldLogExecutionError(exec)).toBe(false)
    })

    it('should return false for null exec', () => {
      expect(shouldLogExecutionError(null)).toBe(false)
    })

    it('should return false for undefined exec', () => {
      expect(shouldLogExecutionError(undefined)).toBe(false)
    })

    it('should return false for exec without id', () => {
      const exec = {}
      expect(shouldLogExecutionError(exec)).toBe(false)
    })

    it('should return false for exec with null id', () => {
      const exec = { id: null }
      expect(shouldLogExecutionError(exec)).toBe(false)
    })
  })

  describe('isTemporaryExecutionId', () => {
    it('should be an alias for isPendingExecutionId', () => {
      expect(isTemporaryExecutionId('pending-123')).toBe(true)
      expect(isTemporaryExecutionId('exec-123')).toBe(false)
      expect(isTemporaryExecutionId(null)).toBe(false)
      expect(isTemporaryExecutionId(undefined)).toBe(false)
    })
  })
})
