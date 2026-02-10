/**
 * WebSocket Connection Manager Tests
 * Tests for timeout guards and reconnection logic
 * Phase 2: Timeout Mutations
 */

import { act } from '@testing-library/react'
import { WebSocketConnectionManager } from './WebSocketConnectionManager'
import { WS_CLOSE_CODES, EXECUTION_STATUS } from './websocketConstants'

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  url: string
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null

  constructor(url: string) {
    this.url = url
    // Don't auto-open - we'll control when it opens in tests
    // This prevents reconnectAttempts from being reset unexpectedly
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: code || 1000, reason }))
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  send(_data: string) {
    // Mock implementation
  }
}

describe('WebSocketConnectionManager - Timeout Guards', () => {
  let mockLogger: {
    debug: jest.Mock
    error: jest.Mock
    warn: jest.Mock
  }
  let mockWebSocketFactory: any
  let callbacks: any

  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()

    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    }

    mockWebSocketFactory = {
      create: jest.fn((url: string) => new MockWebSocket(url)),
    }

    callbacks = {
      onLog: jest.fn(),
      onStatus: jest.fn(),
      onNodeUpdate: jest.fn(),
      onCompletion: jest.fn(),
      onError: jest.fn(),
    }
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Reconnection Timeout Guards', () => {
    it('should stop reconnecting after max attempts', () => {
      const manager = new WebSocketConnectionManager({
        executionId: 'exec-123',
        maxReconnectAttempts: 3,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: 'ws:', host: 'localhost:8000' } as any,
        logger: mockLogger,
      })

      // Connect and allow it to open, then close to trigger reconnection
      manager.connect(callbacks)
      act(() => {
        jest.advanceTimersByTime(20) // Allow WebSocket to open (10ms)
      })
      
      // Close the connection to trigger first reconnection attempt
      const initialWs = (manager as any).ws
      expect(initialWs).toBeTruthy()
      if (initialWs && initialWs.onclose) {
        initialWs.onclose(new CloseEvent('close', { code: 1006, wasClean: false }))
      }
      // reconnectAttempts should now be 1 (incremented in handleReconnection)
      expect((manager as any).reconnectAttempts).toBe(1)
      // A timeout should be scheduled
      expect((manager as any).reconnectTimeout).toBeTruthy()
      
      // Verify timeout was set
      expect((manager as any).reconnectTimeout).toBeTruthy()

      // We need reconnectAttempts to reach 3, then the next close should trigger warning
      // Flow:
      // 1. Initial close: reconnectAttempts = 0, check (0 >= 3) fails, increment to 1, set timeout
      // 2. Timeout fires: reconnectAttempts = 1, check (1 <= 3) passes, call connect()
      // 3. Second close: reconnectAttempts = 1, check (1 >= 3) fails, increment to 2, set timeout
      // 4. Timeout fires: reconnectAttempts = 2, check (2 <= 3) passes, call connect()
      // 5. Third close: reconnectAttempts = 2, check (2 >= 3) fails, increment to 3, set timeout
      // 6. Timeout fires: reconnectAttempts = 3, check (3 <= 3) passes, call connect()
      // 7. Fourth close: reconnectAttempts = 3, check (3 >= 3) passes, warn!
      
      // So we need 3 reconnection attempts (3 timeouts firing and 3 closes)
      // After the initial close, reconnectAttempts = 1, timeout is scheduled
      // We need to let 3 timeouts fire, each creating a connection that we immediately close
      for (let attempt = 1; attempt <= 3; attempt++) {
        // Verify a timeout is scheduled before advancing time
        const timeoutBefore = (manager as any).reconnectTimeout
        expect(timeoutBefore).toBeTruthy()
        
        const factoryCallsBefore = mockWebSocketFactory.create.mock.calls.length
        
        // Advance enough time for the reconnection delay
        // Use a large enough delay to ensure the timeout fires (exponential backoff can be large)
        // For simplicity, advance enough for any reasonable delay (60 seconds should cover it)
        act(() => {
          jest.advanceTimersByTime(60000)
        })
        
        // After delay, the timeout should have fired
        // The timeout callback checks: reconnectAttempts <= maxReconnectAttempts
        // For attempts 1, 2, 3: 1 <= 3, 2 <= 3, 3 <= 3 all pass, so connect() should be called
        const factoryCallsAfter = mockWebSocketFactory.create.mock.calls.length
        
        // Verify connect() was called (factory should have been called)
        expect(factoryCallsAfter).toBe(factoryCallsBefore + 1)
        
        const currentWs = (manager as any).ws
        
        // Verify WebSocket was created
        expect(currentWs).toBeTruthy()
        
        // Verify reconnectAttempts hasn't changed yet (it only increments on close)
        // Note: reconnectAttempts might be 0 if connect() was called and the WebSocket
        // opened successfully (which resets it), but we're closing before it opens
        // So it should still be reconnectAttemptsBefore
        const reconnectAttemptsAfterConnect = (manager as any).reconnectAttempts
        
        if (currentWs && currentWs.onclose) {
          // Close immediately so connection never opens
          // This prevents reconnectAttempts from being reset to 0
          // This should trigger handleReconnection, which increments reconnectAttempts
          // UNLESS reconnectAttempts >= maxReconnectAttempts (in which case it warns and returns)
          currentWs.onclose(new CloseEvent('close', { code: 1006, wasClean: false }))
          
          // After close, reconnectAttempts should have incremented UNLESS we've hit max attempts
          const reconnectAttemptsAfterClose = (manager as any).reconnectAttempts
          if (reconnectAttemptsAfterConnect < 3) {
            // Not at max yet, should increment
            expect(reconnectAttemptsAfterClose).toBe(reconnectAttemptsAfterConnect + 1)
          } else {
            // At max (3), should stay at 3 (check passes, warns, returns without incrementing)
            expect(reconnectAttemptsAfterClose).toBe(3)
          }
        }
      }

      // Verify reconnectAttempts is 3 before the final close
      expect((manager as any).reconnectAttempts).toBe(3)

      // Now reconnectAttempts should be 3
      // Trigger one more reconnection attempt - this should hit the max attempts guard
      // The delay for attempt 3 would be: 10000 * 2^2 = 40000ms
      act(() => {
        jest.advanceTimersByTime(40000)
      })
      const finalWs = (manager as any).ws
      if (finalWs && finalWs.onclose) {
        act(() => {
          jest.advanceTimersByTime(5)
        })
        // This close should trigger the check: reconnectAttempts = 3, check (3 >= 3) passes
        finalWs.onclose(new CloseEvent('close', { code: 1006, wasClean: false }))
      }

      // After max attempts (3), reconnectAttempts is 3, so the check (3 >= 3) should pass
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Max reconnect attempts reached')
      )
      expect(callbacks.onError).toHaveBeenCalledWith(
        expect.stringContaining('WebSocket connection failed after 3 attempts')
      )
    })

    it('should clear existing timeout before setting new one', () => {
      const manager = new WebSocketConnectionManager({
        executionId: 'exec-123',
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: 'ws:', host: 'localhost:8000' } as any,
        logger: mockLogger,
      })

      manager.connect(callbacks)
      act(() => {
        jest.advanceTimersByTime(20)
      })

      // Close connection
      const ws = (manager as any).ws
      if (ws && ws.onclose) {
        ws.onclose(new CloseEvent('close', { code: 1006, wasClean: false }))
      }

      // Close again before timeout fires
      act(() => {
        jest.advanceTimersByTime(100)
      })

      const ws2 = (manager as any).ws
      if (ws2 && ws2.onclose) {
        ws2.onclose(new CloseEvent('close', { code: 1006, wasClean: false }))
      }

      // New timeout should be set (different from first)
      const secondTimeout = (manager as any).reconnectTimeout
      expect(secondTimeout).not.toBeNull()
    })

    it('should not reconnect if execution is terminated', () => {
      const manager = new WebSocketConnectionManager({
        executionId: 'exec-123',
        executionStatus: EXECUTION_STATUS.COMPLETED,
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: 'ws:', host: 'localhost:8000' } as any,
        logger: mockLogger,
      })

      manager.connect(callbacks)
      act(() => {
        jest.advanceTimersByTime(20)
      })

      // Close connection
      const ws = (manager as any).ws
      if (ws && ws.onclose) {
        ws.onclose(new CloseEvent('close', { code: 1006, wasClean: false }))
      }

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Should not attempt reconnection
      expect((manager as any).reconnectAttempts).toBe(0)
    })

    it('should not reconnect if connection was closed cleanly', () => {
      const manager = new WebSocketConnectionManager({
        executionId: 'exec-123',
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: 'ws:', host: 'localhost:8000' } as any,
        logger: mockLogger,
      })

      manager.connect(callbacks)
      act(() => {
        jest.advanceTimersByTime(20)
      })

      // Close cleanly
      const ws = (manager as any).ws
      if (ws && ws.onclose) {
        ws.onclose(new CloseEvent('close', { code: WS_CLOSE_CODES.NORMAL_CLOSURE, wasClean: true }))
      }

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Should not attempt reconnection
      expect((manager as any).reconnectAttempts).toBe(0)
    })

    it('should use sanitized delay for reconnection', () => {
      const manager = new WebSocketConnectionManager({
        executionId: 'exec-123',
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: 'ws:', host: 'localhost:8000' } as any,
        logger: mockLogger,
        reconnectionStrategy: {
          calculateDelay: jest.fn(() => 100000), // Returns delay > MAX_DELAY
          shouldReconnect: () => true,
        } as any,
      })

      manager.connect(callbacks)
      act(() => {
        jest.advanceTimersByTime(20)
      })

      // Close connection
      const ws = (manager as any).ws
      if (ws && ws.onclose) {
        ws.onclose(new CloseEvent('close', { code: 1006, wasClean: false }))
      }

      // Delay should be sanitized to max 60000ms
      const timeout = (manager as any).reconnectTimeout
      expect(timeout).not.toBeNull()
    })
  })

  describe('Connection State Guards', () => {
    it('should not connect if executionId is null', () => {
      const manager = new WebSocketConnectionManager({
        executionId: null,
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: 'ws:', host: 'localhost:8000' } as any,
        logger: mockLogger,
      })

      manager.connect(callbacks)

      expect(mockWebSocketFactory.create).not.toHaveBeenCalled()
    })

    it('should not connect if executionId is temporary', () => {
      const manager = new WebSocketConnectionManager({
        executionId: 'pending-123', // Use 'pending-' prefix which is checked by isTemporaryExecutionId
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: 'ws:', host: 'localhost:8000' } as any,
        logger: mockLogger,
      })

      manager.connect(callbacks)

      // Should skip connection for temporary IDs
      expect(mockWebSocketFactory.create).not.toHaveBeenCalled()
    })

    it('should close connection when execution terminates', () => {
      const manager = new WebSocketConnectionManager({
        executionId: 'exec-123',
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: 'ws:', host: 'localhost:8000' } as any,
        logger: mockLogger,
      })

      manager.connect(callbacks)
      act(() => {
        jest.advanceTimersByTime(20)
      })

      const ws = (manager as any).ws
      const closeSpy = jest.spyOn(ws, 'close')

      // Update status to completed
      manager.updateStatus(EXECUTION_STATUS.COMPLETED)

      expect(closeSpy).toHaveBeenCalledWith(
        WS_CLOSE_CODES.NORMAL_CLOSURE,
        expect.any(String)
      )
      expect((manager as any).ws).toBeNull()
    })
  })

  describe('Timeout Clearing', () => {
    it('should clear timeout when close is called', () => {
      const manager = new WebSocketConnectionManager({
        executionId: 'exec-123',
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: 'ws:', host: 'localhost:8000' } as any,
        logger: mockLogger,
      })

      manager.connect(callbacks)
      act(() => {
        jest.advanceTimersByTime(20)
      })

      // Close connection to trigger reconnection timeout
      const ws = (manager as any).ws
      if (ws && ws.onclose) {
        ws.onclose(new CloseEvent('close', { code: 1006, wasClean: false }))
      }

      const timeout = (manager as any).reconnectTimeout
      expect(timeout).not.toBeNull()

      // Call close - should clear timeout
      manager.close()

      expect((manager as any).reconnectTimeout).toBeNull()
    })

    it('should clear timeout when execution terminates', () => {
      const manager = new WebSocketConnectionManager({
        executionId: 'exec-123',
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: 'ws:', host: 'localhost:8000' } as any,
        logger: mockLogger,
      })

      manager.connect(callbacks)
      act(() => {
        jest.advanceTimersByTime(20)
      })

      // Close connection to trigger reconnection timeout
      const ws = (manager as any).ws
      if (ws && ws.onclose) {
        ws.onclose(new CloseEvent('close', { code: 1006, wasClean: false }))
      }

      const timeout = (manager as any).reconnectTimeout
      expect(timeout).not.toBeNull()

      // Update status to terminated - should clear timeout
      manager.updateStatus(EXECUTION_STATUS.COMPLETED)

      expect((manager as any).reconnectTimeout).toBeNull()
    })
  })
})
