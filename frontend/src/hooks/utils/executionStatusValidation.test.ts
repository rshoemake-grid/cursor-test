/**
 * Tests for execution status validation utilities
 * These tests ensure mutation-resistant validation functions work correctly
 */

import {
  isRunningStatus,
  isCompletedStatus,
  isFailedStatus,
  isPausedStatus,
  isTerminatedStatus,
  hasStatusChanged,
  normalizeExecutionStatus,
  type ExecutionStatus,
} from './executionStatusValidation'

describe('executionStatusValidation', () => {
  describe('isRunningStatus', () => {
    it('should return true for running status', () => {
      expect(isRunningStatus('running')).toBe(true)
    })

    it('should return false for completed status', () => {
      expect(isRunningStatus('completed')).toBe(false)
    })

    it('should return false for failed status', () => {
      expect(isRunningStatus('failed')).toBe(false)
    })

    it('should return false for paused status', () => {
      expect(isRunningStatus('paused')).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isRunningStatus(undefined)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isRunningStatus(null as any)).toBe(false)
    })

    it('should return false for invalid status', () => {
      expect(isRunningStatus('invalid' as any)).toBe(false)
    })
  })

  describe('isCompletedStatus', () => {
    it('should return true for completed status', () => {
      expect(isCompletedStatus('completed')).toBe(true)
    })

    it('should return false for running status', () => {
      expect(isCompletedStatus('running')).toBe(false)
    })

    it('should return false for failed status', () => {
      expect(isCompletedStatus('failed')).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isCompletedStatus(undefined)).toBe(false)
    })
  })

  describe('isFailedStatus', () => {
    it('should return true for failed status', () => {
      expect(isFailedStatus('failed')).toBe(true)
    })

    it('should return false for completed status', () => {
      expect(isFailedStatus('completed')).toBe(false)
    })

    it('should return false for running status', () => {
      expect(isFailedStatus('running')).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isFailedStatus(undefined)).toBe(false)
    })
  })

  describe('isPausedStatus', () => {
    it('should return true for paused status', () => {
      expect(isPausedStatus('paused')).toBe(true)
    })

    it('should return false for running status', () => {
      expect(isPausedStatus('running')).toBe(false)
    })

    it('should return false for completed status', () => {
      expect(isPausedStatus('completed')).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isPausedStatus(undefined)).toBe(false)
    })
  })

  describe('isTerminatedStatus', () => {
    it('should return true for completed status', () => {
      expect(isTerminatedStatus('completed')).toBe(true)
    })

    it('should return true for failed status', () => {
      expect(isTerminatedStatus('failed')).toBe(true)
    })

    it('should return false for running status', () => {
      expect(isTerminatedStatus('running')).toBe(false)
    })

    it('should return false for paused status', () => {
      expect(isTerminatedStatus('paused')).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isTerminatedStatus(undefined)).toBe(false)
    })

    it('should return false for invalid status', () => {
      expect(isTerminatedStatus('invalid' as any)).toBe(false)
    })
  })

  describe('hasStatusChanged', () => {
    it('should return true when statuses are different', () => {
      expect(hasStatusChanged('running', 'completed')).toBe(true)
    })

    it('should return false when statuses are the same', () => {
      expect(hasStatusChanged('running', 'running')).toBe(false)
    })

    it('should return true when old status is undefined', () => {
      expect(hasStatusChanged(undefined, 'running')).toBe(true)
    })

    it('should return true when new status is undefined', () => {
      expect(hasStatusChanged('running', undefined)).toBe(true)
    })

    it('should return false when both are undefined', () => {
      expect(hasStatusChanged(undefined, undefined)).toBe(false)
    })

    it('should handle different status types', () => {
      expect(hasStatusChanged('completed', 'failed')).toBe(true)
      expect(hasStatusChanged('paused', 'running')).toBe(true)
    })
  })

  describe('normalizeExecutionStatus', () => {
    it('should return completed for completed status', () => {
      expect(normalizeExecutionStatus('completed')).toBe('completed')
    })

    it('should return failed for failed status', () => {
      expect(normalizeExecutionStatus('failed')).toBe('failed')
    })

    it('should return running for paused status', () => {
      expect(normalizeExecutionStatus('paused')).toBe('running')
    })

    it('should return running for running status', () => {
      expect(normalizeExecutionStatus('running')).toBe('running')
    })

    it('should return running for undefined status', () => {
      expect(normalizeExecutionStatus(undefined)).toBe('running')
    })

    it('should return running for invalid status', () => {
      expect(normalizeExecutionStatus('invalid' as any)).toBe('running')
    })

    it('should return running for null status', () => {
      expect(normalizeExecutionStatus(null as any)).toBe('running')
    })

    it('should handle all valid status types', () => {
      expect(normalizeExecutionStatus('pending' as ExecutionStatus)).toBe('running')
    })
  })
})
