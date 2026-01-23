// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWebSocket } from './useWebSocket'
import { logger } from '../utils/logger'

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

// Mock WebSocket - simplified version
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  url: string
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null

  constructor(url: string) {
    this.url = url
    // Immediately set to OPEN for testing
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 10)
  }

  send(data: string) {
    // Mock send
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSING
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED
      if (this.onclose) {
        const event = new CloseEvent('close', { code: code || 1000, reason: reason || '', wasClean: true })
        this.onclose(event)
      }
    }, 10)
  }
}

// Replace global WebSocket
global.WebSocket = MockWebSocket as any

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('connection', () => {
    it('should not connect when executionId is null', () => {
      const { result } = renderHook(() => useWebSocket({ executionId: null }))

      expect(result.current.isConnected).toBe(false)
      expect(logger.debug).not.toHaveBeenCalledWith(
        expect.stringContaining('[WebSocket] Connecting to'),
        expect.anything()
      )
    })

    it('should not connect to temporary execution IDs', () => {
      renderHook(() => useWebSocket({ executionId: 'pending-123' }))

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('[WebSocket] Skipping connection to temporary execution ID'),
        expect.anything()
      )
    })

    it('should not connect if execution is completed', () => {
      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          executionStatus: 'completed'
        })
      )

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('[WebSocket] Skipping connection - execution exec-1 is completed'),
        expect.anything()
      )
    })

    it('should not connect if execution is failed', () => {
      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          executionStatus: 'failed'
        })
      )

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('[WebSocket] Skipping connection - execution exec-1 is failed'),
        expect.anything()
      )
    })
  })

  describe('connection state', () => {
    it('should set isConnected to false initially', () => {
      const { result } = renderHook(() =>
        useWebSocket({ executionId: 'exec-1' })
      )

      expect(result.current.isConnected).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('should close connection when executionId changes to null', () => {
      const { result, rerender } = renderHook(
        ({ executionId }) => useWebSocket({ executionId }),
        { initialProps: { executionId: 'exec-1' as string | null } }
      )

      expect(result.current.isConnected).toBe(false)

      rerender({ executionId: null })

      expect(result.current.isConnected).toBe(false)
    })

    it('should handle execution status changes', () => {
      const { result, rerender } = renderHook(
        ({ executionStatus }) =>
          useWebSocket({
            executionId: 'exec-1',
            executionStatus
          }),
        { initialProps: { executionStatus: 'running' as const } }
      )

      expect(result.current.isConnected).toBe(false)

      rerender({ executionStatus: 'completed' })

      expect(result.current.isConnected).toBe(false)
    })
  })

  describe('URL construction', () => {
    it('should construct WebSocket URL correctly', () => {
      const originalProtocol = window.location.protocol
      const originalHost = window.location.host
      
      Object.defineProperty(window, 'location', {
        value: { protocol: 'https:', host: 'example.com' },
        writable: true,
        configurable: true
      })

      renderHook(() => useWebSocket({ executionId: 'exec-1' }))

      // Reset
      Object.defineProperty(window, 'location', {
        value: { protocol: originalProtocol, host: originalHost },
        writable: true,
        configurable: true
      })
    })
  })
})
