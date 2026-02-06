/**
 * WebSocket Validation Utilities Tests
 * Tests for validation functions to ensure mutation resistance
 */

import {
  isValidWebSocket,
  hasPendingReconnection,
  sanitizeReconnectionDelay,
  isCleanClosure,
  getCloseReason
} from './websocketValidation'
import { WS_CLOSE_CODES } from './websocketConstants'

describe('websocketValidation', () => {
  describe('isValidWebSocket', () => {
    it('should return false for null', () => {
      expect(isValidWebSocket(null)).toBe(false)
    })

    it('should return false for undefined (cast as null)', () => {
      expect(isValidWebSocket(undefined as any)).toBe(false)
    })

    it('should return true for WebSocket with OPEN state', () => {
      const mockWs = {
        readyState: 1 // WebSocket.OPEN
      } as WebSocket
      expect(isValidWebSocket(mockWs)).toBe(true)
    })

    it('should return false for WebSocket with CONNECTING state', () => {
      const mockWs = {
        readyState: 0 // WebSocket.CONNECTING
      } as WebSocket
      expect(isValidWebSocket(mockWs)).toBe(false)
    })

    it('should return false for WebSocket with CLOSING state', () => {
      const mockWs = {
        readyState: 2 // WebSocket.CLOSING
      } as WebSocket
      expect(isValidWebSocket(mockWs)).toBe(false)
    })

    it('should return false for WebSocket with CLOSED state', () => {
      const mockWs = {
        readyState: 3 // WebSocket.CLOSED
      } as WebSocket
      expect(isValidWebSocket(mockWs)).toBe(false)
    })
  })

  describe('hasPendingReconnection', () => {
    it('should return false for null', () => {
      expect(hasPendingReconnection(null)).toBe(false)
    })

    it('should return false for undefined (cast as null)', () => {
      expect(hasPendingReconnection(undefined as any)).toBe(false)
    })

    it('should return true for valid timeout', () => {
      const timeout = setTimeout(() => {}, 1000)
      expect(hasPendingReconnection(timeout)).toBe(true)
      clearTimeout(timeout)
    })
  })

  describe('sanitizeReconnectionDelay', () => {
    it('should return delay within valid range', () => {
      expect(sanitizeReconnectionDelay(1000)).toBe(1000)
      expect(sanitizeReconnectionDelay(5000)).toBe(5000)
      expect(sanitizeReconnectionDelay(30000)).toBe(30000)
    })

    it('should return MIN_DELAY for delay < 1', () => {
      expect(sanitizeReconnectionDelay(0)).toBe(1)
      expect(sanitizeReconnectionDelay(-1)).toBe(1)
      expect(sanitizeReconnectionDelay(-100)).toBe(1)
    })

    it('should return MAX_DELAY for delay > 60000', () => {
      expect(sanitizeReconnectionDelay(60001)).toBe(60000)
      expect(sanitizeReconnectionDelay(100000)).toBe(60000)
    })

    it('should verify exact boundary - delay === 1', () => {
      expect(sanitizeReconnectionDelay(1)).toBe(1)
    })

    it('should verify exact boundary - delay === 60000', () => {
      expect(sanitizeReconnectionDelay(60000)).toBe(60000)
    })

    it('should verify exact boundary - delay === 0', () => {
      expect(sanitizeReconnectionDelay(0)).toBe(1)
    })

    it('should verify exact boundary - delay === 60001', () => {
      expect(sanitizeReconnectionDelay(60001)).toBe(60000)
    })
  })

  describe('isCleanClosure', () => {
    it('should return true for clean closure with code 1000', () => {
      const event = {
        wasClean: true,
        code: WS_CLOSE_CODES.NORMAL_CLOSURE
      } as CloseEvent
      expect(isCleanClosure(event)).toBe(true)
    })

    it('should return false for clean closure with code !== 1000', () => {
      const event = {
        wasClean: true,
        code: 1001
      } as CloseEvent
      expect(isCleanClosure(event)).toBe(false)
    })

    it('should return false for unclean closure with code 1000', () => {
      const event = {
        wasClean: false,
        code: WS_CLOSE_CODES.NORMAL_CLOSURE
      } as CloseEvent
      expect(isCleanClosure(event)).toBe(false)
    })

    it('should return false for unclean closure with code !== 1000', () => {
      const event = {
        wasClean: false,
        code: 1006
      } as CloseEvent
      expect(isCleanClosure(event)).toBe(false)
    })

    it('should verify exact comparison - wasClean === true && code === 1000', () => {
      const event = {
        wasClean: true,
        code: WS_CLOSE_CODES.NORMAL_CLOSURE
      } as CloseEvent
      expect(isCleanClosure(event)).toBe(true)
    })
  })

  describe('getCloseReason', () => {
    it('should return reason when present and non-empty', () => {
      const event = {
        reason: 'Connection closed normally'
      } as CloseEvent
      expect(getCloseReason(event)).toBe('Connection closed normally')
    })

    it('should return default when reason is null', () => {
      const event = {
        reason: null
      } as CloseEvent
      expect(getCloseReason(event)).toBe('No reason provided')
    })

    it('should return default when reason is undefined', () => {
      const event = {
        reason: undefined
      } as CloseEvent
      expect(getCloseReason(event)).toBe('No reason provided')
    })

    it('should return default when reason is empty string', () => {
      const event = {
        reason: ''
      } as CloseEvent
      expect(getCloseReason(event)).toBe('No reason provided')
    })

    it('should verify exact check - reason.length > 0', () => {
      const event = {
        reason: 'a' // length === 1 > 0
      } as CloseEvent
      expect(getCloseReason(event)).toBe('a')
    })

    it('should verify exact check - reason.length === 0', () => {
      const event = {
        reason: ''
      } as CloseEvent
      expect(getCloseReason(event)).toBe('No reason provided')
    })
  })
})
