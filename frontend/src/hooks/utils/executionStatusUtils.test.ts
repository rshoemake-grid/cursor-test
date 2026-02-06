/**
 * Execution Status Utilities Tests
 * Tests for execution status checking logic
 */

import {
  ExecutionStatusChecker,
  isExecutionTerminated,
  shouldSkipConnection,
  shouldReconnect,
  type ExecutionStatus,
} from './executionStatusUtils'
import { EXECUTION_STATUS } from './websocketConstants'

// Mock executionIdValidation
jest.mock('./executionIdValidation', () => ({
  isTemporaryExecutionId: jest.fn((id: string | null) => id?.startsWith('temp-') ?? false),
}))

describe('ExecutionStatusChecker', () => {
  describe('isTerminated', () => {
    it('should return true for completed status', () => {
      expect(ExecutionStatusChecker.isTerminated(EXECUTION_STATUS.COMPLETED)).toBe(true)
    })

    it('should return true for failed status', () => {
      expect(ExecutionStatusChecker.isTerminated(EXECUTION_STATUS.FAILED)).toBe(true)
    })

    it('should return false for running status', () => {
      expect(ExecutionStatusChecker.isTerminated(EXECUTION_STATUS.RUNNING)).toBe(false)
    })

    it('should return false for pending status', () => {
      expect(ExecutionStatusChecker.isTerminated('pending' as ExecutionStatus)).toBe(false)
    })

    it('should return false for paused status', () => {
      expect(ExecutionStatusChecker.isTerminated('paused' as ExecutionStatus)).toBe(false)
    })

    it('should use lastKnownStatus when status is undefined', () => {
      expect(ExecutionStatusChecker.isTerminated(undefined, EXECUTION_STATUS.COMPLETED)).toBe(true)
      expect(ExecutionStatusChecker.isTerminated(undefined, EXECUTION_STATUS.FAILED)).toBe(true)
      expect(ExecutionStatusChecker.isTerminated(undefined, EXECUTION_STATUS.RUNNING)).toBe(false)
    })

    it('should prioritize status over lastKnownStatus', () => {
      expect(ExecutionStatusChecker.isTerminated(EXECUTION_STATUS.RUNNING, EXECUTION_STATUS.COMPLETED)).toBe(false)
      expect(ExecutionStatusChecker.isTerminated(EXECUTION_STATUS.COMPLETED, EXECUTION_STATUS.RUNNING)).toBe(true)
    })

    it('should return false when both status and lastKnownStatus are undefined', () => {
      expect(ExecutionStatusChecker.isTerminated(undefined, undefined)).toBe(false)
    })
  })

  describe('shouldSkip', () => {
    it('should return true when executionId is null', () => {
      expect(ExecutionStatusChecker.shouldSkip(null, EXECUTION_STATUS.RUNNING)).toBe(true)
    })

    it('should return true when executionId is empty string', () => {
      expect(ExecutionStatusChecker.shouldSkip('', EXECUTION_STATUS.RUNNING)).toBe(true)
    })

    it('should return true for temporary execution IDs', () => {
      expect(ExecutionStatusChecker.shouldSkip('temp-123', EXECUTION_STATUS.RUNNING)).toBe(true)
    })

    it('should return true when execution is terminated', () => {
      expect(ExecutionStatusChecker.shouldSkip('exec-123', EXECUTION_STATUS.COMPLETED)).toBe(true)
      expect(ExecutionStatusChecker.shouldSkip('exec-123', EXECUTION_STATUS.FAILED)).toBe(true)
    })

    it('should return false for valid running execution', () => {
      expect(ExecutionStatusChecker.shouldSkip('exec-123', EXECUTION_STATUS.RUNNING)).toBe(false)
    })

    it('should return false for valid pending execution', () => {
      expect(ExecutionStatusChecker.shouldSkip('exec-123', 'pending' as ExecutionStatus)).toBe(false)
    })

    it('should check lastKnownStatus when status is undefined', () => {
      expect(ExecutionStatusChecker.shouldSkip('exec-123', undefined, EXECUTION_STATUS.COMPLETED)).toBe(true)
      expect(ExecutionStatusChecker.shouldSkip('exec-123', undefined, EXECUTION_STATUS.RUNNING)).toBe(false)
    })
  })

  describe('shouldReconnect', () => {
    it('should return false for temporary execution IDs', () => {
      expect(ExecutionStatusChecker.shouldReconnect(
        false,
        1006,
        1,
        3,
        'temp-123',
        EXECUTION_STATUS.RUNNING
      )).toBe(false)
    })

    it('should return false when execution is terminated', () => {
      expect(ExecutionStatusChecker.shouldReconnect(
        false,
        1006,
        1,
        3,
        'exec-123',
        EXECUTION_STATUS.COMPLETED
      )).toBe(false)

      expect(ExecutionStatusChecker.shouldReconnect(
        false,
        1006,
        1,
        3,
        'exec-123',
        EXECUTION_STATUS.FAILED
      )).toBe(false)
    })

    it('should return false when connection was closed cleanly', () => {
      expect(ExecutionStatusChecker.shouldReconnect(
        true,
        1000,
        1,
        3,
        'exec-123',
        EXECUTION_STATUS.RUNNING
      )).toBe(false)
    })

    it('should return false when max attempts reached', () => {
      expect(ExecutionStatusChecker.shouldReconnect(
        false,
        1006,
        3,
        3,
        'exec-123',
        EXECUTION_STATUS.RUNNING
      )).toBe(false)

      expect(ExecutionStatusChecker.shouldReconnect(
        false,
        1006,
        4,
        3,
        'exec-123',
        EXECUTION_STATUS.RUNNING
      )).toBe(false)
    })

    it('should return false when executionId is null', () => {
      expect(ExecutionStatusChecker.shouldReconnect(
        false,
        1006,
        1,
        3,
        null,
        EXECUTION_STATUS.RUNNING
      )).toBe(false)
    })

    it('should return true for unclean closure with running execution', () => {
      expect(ExecutionStatusChecker.shouldReconnect(
        false,
        1006,
        1,
        3,
        'exec-123',
        EXECUTION_STATUS.RUNNING
      )).toBe(true)
    })

    it('should return true for unclean closure with pending execution', () => {
      expect(ExecutionStatusChecker.shouldReconnect(
        false,
        1006,
        1,
        3,
        'exec-123',
        'pending' as ExecutionStatus
      )).toBe(true)
    })

    it('should return true when clean closure but code is not 1000', () => {
      expect(ExecutionStatusChecker.shouldReconnect(
        true,
        1001,
        1,
        3,
        'exec-123',
        EXECUTION_STATUS.RUNNING
      )).toBe(true)
    })

    it('should check lastKnownStatus when status is undefined', () => {
      expect(ExecutionStatusChecker.shouldReconnect(
        false,
        1006,
        1,
        3,
        'exec-123',
        undefined,
        EXECUTION_STATUS.COMPLETED
      )).toBe(false)

      expect(ExecutionStatusChecker.shouldReconnect(
        false,
        1006,
        1,
        3,
        'exec-123',
        undefined,
        EXECUTION_STATUS.RUNNING
      )).toBe(true)
    })
  })
})

describe('Legacy function exports', () => {
  describe('isExecutionTerminated', () => {
    it('should delegate to ExecutionStatusChecker.isTerminated', () => {
      expect(isExecutionTerminated(EXECUTION_STATUS.COMPLETED)).toBe(true)
      expect(isExecutionTerminated(EXECUTION_STATUS.FAILED)).toBe(true)
      expect(isExecutionTerminated(EXECUTION_STATUS.RUNNING)).toBe(false)
      expect(isExecutionTerminated(undefined, EXECUTION_STATUS.COMPLETED)).toBe(true)
    })
  })

  describe('shouldSkipConnection', () => {
    it('should delegate to ExecutionStatusChecker.shouldSkip', () => {
      expect(shouldSkipConnection(null, EXECUTION_STATUS.RUNNING)).toBe(true)
      expect(shouldSkipConnection('temp-123', EXECUTION_STATUS.RUNNING)).toBe(true)
      expect(shouldSkipConnection('exec-123', EXECUTION_STATUS.COMPLETED)).toBe(true)
      expect(shouldSkipConnection('exec-123', EXECUTION_STATUS.RUNNING)).toBe(false)
    })
  })

  describe('shouldReconnect', () => {
    it('should delegate to ExecutionStatusChecker.shouldReconnect', () => {
      expect(shouldReconnect(
        false,
        1006,
        1,
        3,
        'exec-123',
        EXECUTION_STATUS.RUNNING
      )).toBe(true)

      expect(shouldReconnect(
        true,
        1000,
        1,
        3,
        'exec-123',
        EXECUTION_STATUS.RUNNING
      )).toBe(false)

      expect(shouldReconnect(
        false,
        1006,
        1,
        3,
        'temp-123',
        EXECUTION_STATUS.RUNNING
      )).toBe(false)
    })
  })
})
