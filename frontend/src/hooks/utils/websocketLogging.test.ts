/**
 * WebSocket Logging Tests
 * Tests for WebSocket logging utilities to ensure mutation resistance
 */

import {
  logSkipConnectionReason,
  logSkipReconnectReason
} from './websocketLogging'
import { EXECUTION_STATUS } from './websocketConstants'
import { isTemporaryExecutionId } from './executionIdValidation'

// Mock the executionIdValidation module
jest.mock('./executionIdValidation', () => ({
  isTemporaryExecutionId: jest.fn()
}))

describe('websocketLogging', () => {
  const mockLogger = {
    debug: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(isTemporaryExecutionId as jest.Mock).mockReturnValue(false)
  })

  describe('logSkipConnectionReason', () => {
    it('should log skip reason for temporary execution ID', () => {
      (isTemporaryExecutionId as jest.Mock).mockReturnValue(true)
      const executionId = 'pending-123'

      logSkipConnectionReason(
        executionId,
        undefined,
        undefined,
        mockLogger
      )

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `[WebSocket] Skipping connection to temporary execution ID: ${executionId}`
      )
    })

    it('should log skip reason when execution is completed', () => {
      const executionId = 'exec-123'
      const executionStatus = EXECUTION_STATUS.COMPLETED

      logSkipConnectionReason(
        executionId,
        executionStatus,
        undefined,
        mockLogger
      )

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `[WebSocket] Skipping connection - execution ${executionId} is ${executionStatus}`
      )
    })

    it('should log skip reason when execution is failed', () => {
      const executionId = 'exec-123'
      const executionStatus = EXECUTION_STATUS.FAILED

      logSkipConnectionReason(
        executionId,
        executionStatus,
        undefined,
        mockLogger
      )

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `[WebSocket] Skipping connection - execution ${executionId} is ${executionStatus}`
      )
    })

    it('should use lastKnownStatus when executionStatus is undefined', () => {
      const executionId = 'exec-123'
      const lastKnownStatus = EXECUTION_STATUS.COMPLETED

      logSkipConnectionReason(
        executionId,
        undefined,
        lastKnownStatus,
        mockLogger
      )

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `[WebSocket] Skipping connection - execution ${executionId} is ${lastKnownStatus}`
      )
    })

    it('should prioritize executionStatus over lastKnownStatus', () => {
      const executionId = 'exec-123'
      const executionStatus = EXECUTION_STATUS.FAILED
      const lastKnownStatus = EXECUTION_STATUS.COMPLETED

      logSkipConnectionReason(
        executionId,
        executionStatus,
        lastKnownStatus,
        mockLogger
      )

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `[WebSocket] Skipping connection - execution ${executionId} is ${executionStatus}`
      )
    })

    it('should not log when status is not completed or failed', () => {
      const executionId = 'exec-123'
      const executionStatus = EXECUTION_STATUS.RUNNING

      logSkipConnectionReason(
        executionId,
        executionStatus,
        undefined,
        mockLogger
      )

      expect(mockLogger.debug).not.toHaveBeenCalled()
    })

    it('should not log when execution ID is null and not temporary', () => {
      logSkipConnectionReason(
        null,
        undefined,
        undefined,
        mockLogger
      )

      expect(mockLogger.debug).not.toHaveBeenCalled()
    })
  })

  describe('logSkipReconnectReason', () => {
    const mockIsCleanClosure = jest.fn()

    beforeEach(() => {
      mockIsCleanClosure.mockReturnValue(false)
    })

    it('should log skip reason for temporary execution ID', () => {
      (isTemporaryExecutionId as jest.Mock).mockReturnValue(true)
      const executionId = 'pending-123'
      const event = new CloseEvent('close')

      logSkipReconnectReason(
        executionId,
        undefined,
        undefined,
        event,
        mockIsCleanClosure,
        mockLogger
      )

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `[WebSocket] Skipping reconnect for temporary execution ID: ${executionId}`
      )
    })

    it('should log skip reason when execution is completed', () => {
      const executionId = 'exec-123'
      const executionStatus = EXECUTION_STATUS.COMPLETED
      const event = new CloseEvent('close')

      logSkipReconnectReason(
        executionId,
        executionStatus,
        undefined,
        event,
        mockIsCleanClosure,
        mockLogger
      )

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `[WebSocket] Skipping reconnect - execution ${executionId} is ${executionStatus}`
      )
    })

    it('should log skip reason when execution is failed', () => {
      const executionId = 'exec-123'
      const executionStatus = EXECUTION_STATUS.FAILED
      const event = new CloseEvent('close')

      logSkipReconnectReason(
        executionId,
        executionStatus,
        undefined,
        event,
        mockIsCleanClosure,
        mockLogger
      )

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `[WebSocket] Skipping reconnect - execution ${executionId} is ${executionStatus}`
      )
    })

    it('should log skip reason when connection closed cleanly', () => {
      const executionId = 'exec-123'
      const executionStatus = EXECUTION_STATUS.RUNNING
      const event = new CloseEvent('close')
      mockIsCleanClosure.mockReturnValue(true)

      logSkipReconnectReason(
        executionId,
        executionStatus,
        undefined,
        event,
        mockIsCleanClosure,
        mockLogger
      )

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `[WebSocket] Connection closed cleanly, not reconnecting`
      )
    })

    it('should use lastKnownStatus when executionStatus is undefined', () => {
      const executionId = 'exec-123'
      const lastKnownStatus = EXECUTION_STATUS.COMPLETED
      const event = new CloseEvent('close')

      logSkipReconnectReason(
        executionId,
        undefined,
        lastKnownStatus,
        event,
        mockIsCleanClosure,
        mockLogger
      )

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `[WebSocket] Skipping reconnect - execution ${executionId} is ${lastKnownStatus}`
      )
    })

    it('should prioritize executionStatus over lastKnownStatus', () => {
      const executionId = 'exec-123'
      const executionStatus = EXECUTION_STATUS.FAILED
      const lastKnownStatus = EXECUTION_STATUS.COMPLETED
      const event = new CloseEvent('close')

      logSkipReconnectReason(
        executionId,
        executionStatus,
        lastKnownStatus,
        event,
        mockIsCleanClosure,
        mockLogger
      )

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `[WebSocket] Skipping reconnect - execution ${executionId} is ${executionStatus}`
      )
    })

    it('should not log when status is running and not clean closure', () => {
      const executionId = 'exec-123'
      const executionStatus = EXECUTION_STATUS.RUNNING
      const event = new CloseEvent('close')

      logSkipReconnectReason(
        executionId,
        executionStatus,
        undefined,
        event,
        mockIsCleanClosure,
        mockLogger
      )

      expect(mockLogger.debug).not.toHaveBeenCalled()
    })

    it('should check clean closure only when status is not completed/failed', () => {
      const executionId = 'exec-123'
      const executionStatus = EXECUTION_STATUS.RUNNING
      const event = new CloseEvent('close')

      logSkipReconnectReason(
        executionId,
        executionStatus,
        undefined,
        event,
        mockIsCleanClosure,
        mockLogger
      )

      expect(mockIsCleanClosure).toHaveBeenCalledWith(event)
    })

    it('should not check clean closure when status is completed', () => {
      const executionId = 'exec-123'
      const executionStatus = EXECUTION_STATUS.COMPLETED
      const event = new CloseEvent('close')

      logSkipReconnectReason(
        executionId,
        executionStatus,
        undefined,
        event,
        mockIsCleanClosure,
        mockLogger
      )

      // Should not check clean closure when status is completed/failed
      expect(mockIsCleanClosure).not.toHaveBeenCalled()
    })
  })
})
