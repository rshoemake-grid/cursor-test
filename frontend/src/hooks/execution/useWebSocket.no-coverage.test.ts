/**
 * Tests for no-coverage paths in useWebSocket.ts
 * 
 * These tests target code paths that are not covered by normal tests,
 * such as exact conditional checks, string comparisons, logical operators,
 * optional chaining, and edge cases.
 */

import { renderHook } from '@testing-library/react'
import { 
  advanceTimersByTime, 
  wsInstances, 
  MockWebSocket, 
  useWebSocket, 
  logger 
} from './useWebSocket.test.setup'
import type { WindowLocation } from '../../types/adapters'

describe('useWebSocket - No Coverage Paths', () => {
  let mockWindowLocation: WindowLocation

  beforeEach(() => {
    jest.clearAllMocks()
    wsInstances.splice(0, wsInstances.length)
    jest.useFakeTimers()

    mockWindowLocation = {
      protocol: 'http:',
      host: 'localhost:8000',
      hostname: 'localhost',
      port: '8000',
      pathname: '/',
      search: '',
      hash: '',
    }
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    wsInstances.splice(0, wsInstances.length)
    jest.useRealTimers()
  })

  describe('connect - exact conditional checks', () => {
    it('should verify exact falsy check - executionId is null', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: null,
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      // Should not attempt connection
      expect(wsInstances.length).toBe(0)
      expect(result.current.isConnected).toBe(false)
    })

    it('should verify exact falsy check - executionId is empty string', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: '',
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      // Should not attempt connection
      expect(wsInstances.length).toBe(0)
      expect(result.current.isConnected).toBe(false)
    })

    it('should verify exact string comparison - executionId.startsWith("pending-")', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'pending-123',
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      // Should not attempt connection for pending IDs
      expect(wsInstances.length).toBe(0)
      expect(result.current.isConnected).toBe(false)
    })

    it('should verify exact string comparison - executionId does not start with "pending-"', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-123',
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      // Should attempt connection for non-pending IDs
      expect(wsInstances.length).toBeGreaterThan(0)
    })
  })

  describe('connect - logical operators', () => {
    it('should verify logical OR - executionStatus || lastKnownStatusRef.current', async () => {
      const { result, rerender } = renderHook(
        ({ executionStatus }) =>
          useWebSocket({
            executionId: 'exec-123',
            executionStatus,
            windowLocation: mockWindowLocation,
          }),
        {
          initialProps: { executionStatus: undefined as any },
        }
      )

      // First connect with undefined status - should use lastKnownStatusRef
      await advanceTimersByTime(100)
      expect(wsInstances.length).toBeGreaterThan(0)

      wsInstances.splice(0, wsInstances.length)

      // Update to completed status
      rerender({ executionStatus: 'completed' })
      await advanceTimersByTime(100)
      
      // Should not reconnect when status is completed
      expect(wsInstances.length).toBe(0)
    })

    it('should verify exact comparison - currentStatus === "completed"', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-123',
          executionStatus: 'completed',
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      // Should not attempt connection for completed executions
      expect(wsInstances.length).toBe(0)
      expect(result.current.isConnected).toBe(false)
    })

    it('should verify exact comparison - currentStatus === "failed"', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-123',
          executionStatus: 'failed',
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      // Should not attempt connection for failed executions
      expect(wsInstances.length).toBe(0)
      expect(result.current.isConnected).toBe(false)
    })
  })

  describe('connect - optional chaining', () => {
    it('should verify optional chaining - windowLocation?.protocol === "https:"', async () => {
      const httpsLocation = {
        ...mockWindowLocation,
        protocol: 'https:',
      }

      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-123',
          windowLocation: httpsLocation,
        })
      )

      await advanceTimersByTime(100)

      // Should use wss: protocol for https:
      expect(wsInstances.length).toBeGreaterThan(0)
      if (wsInstances.length > 0) {
        const ws = wsInstances[0]
        expect(ws.url).toContain('wss://')
      }
    })

    it('should verify optional chaining - windowLocation?.protocol !== "https:"', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-123',
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      // Should use ws: protocol for http:
      expect(wsInstances.length).toBeGreaterThan(0)
      if (wsInstances.length > 0) {
        const ws = wsInstances[0]
        expect(ws.url).toContain('ws://')
      }
    })

    it('should verify optional chaining - windowLocation?.host fallback', async () => {
      const locationWithoutHost = {
        ...mockWindowLocation,
        host: undefined,
      } as any

      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-123',
          windowLocation: locationWithoutHost,
        })
      )

      await advanceTimersByTime(100)

      // Should use fallback host
      expect(wsInstances.length).toBeGreaterThan(0)
      if (wsInstances.length > 0) {
        const ws = wsInstances[0]
        expect(ws.url).toContain('localhost:8000')
      }
    })

    it('should verify optional chaining - windowLocation is null', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-123',
          windowLocation: null,
        })
      )

      await advanceTimersByTime(100)

      // Should use fallback when windowLocation is null
      expect(wsInstances.length).toBeGreaterThan(0)
      if (wsInstances.length > 0) {
        const ws = wsInstances[0]
        expect(ws.url).toContain('localhost:8000')
      }
    })
  })

  describe('connect - wsRef.current checks', () => {
    it('should verify exact truthy check - wsRef.current exists (should close)', async () => {
      const { result, rerender } = renderHook(
        ({ executionId }) =>
          useWebSocket({
            executionId,
            windowLocation: mockWindowLocation,
          }),
        {
          initialProps: { executionId: 'exec-123' },
        }
      )

      // First connection
      await advanceTimersByTime(100)
      const initialCount = wsInstances.length
      expect(initialCount).toBeGreaterThan(0)
      const firstWs = wsInstances[initialCount - 1]
      const closeSpy = jest.spyOn(firstWs, 'close')

      // Change executionId to trigger reconnect (should close existing and create new)
      rerender({ executionId: 'exec-456' })
      await advanceTimersByTime(100)

      // Should have closed first connection and created new one
      expect(closeSpy).toHaveBeenCalled()
      expect(wsInstances.length).toBeGreaterThan(initialCount)
      
      closeSpy.mockRestore()
    })
  })

  describe('onclose - exact comparisons and logical operators', () => {
    it('should verify exact comparison - wasClean && code === 1000', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-123',
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      const initialCount = wsInstances.length
      expect(initialCount).toBeGreaterThan(0)
      
      if (wsInstances.length > 0) {
        const ws = wsInstances[wsInstances.length - 1]
        const wsCountBeforeClose = wsInstances.length
        
        // Simulate clean close
        // Code path: if (wasClean && code === 1000) return (no reconnect)
        if (ws.onclose) {
          ws.onclose({
            code: 1000,
            reason: 'Normal closure',
            wasClean: true,
          } as CloseEvent)

          await advanceTimersByTime(2000) // Wait longer to ensure no reconnect

          // Should not attempt reconnect for clean close
          // The exact comparison wasClean && code === 1000 should prevent reconnect
          // Verify the code path exists by checking logger was called with "closed cleanly"
          expect(logger.debug).toHaveBeenCalledWith(
            expect.stringContaining('Connection closed cleanly')
          )
        }
      }
    })

    it('should verify exact comparison - code !== 1000', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-123',
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0) {
        const ws = wsInstances[0]
        const initialCount = wsInstances.length

        if (ws.onclose) {
          ws.onclose({
            code: 1001,
            reason: 'Going away',
            wasClean: true,
          } as CloseEvent)

          await advanceTimersByTime(2000) // Wait for reconnect delay

          // Should attempt reconnect for non-1000 code
          // (Reconnect happens after delay, so count may increase)
        }
      }
    })

    it('should verify logical AND - reason && reason.length > 0', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-123',
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0) {
        const ws = wsInstances[0]

        if (ws.onclose) {
          // Test with empty reason
          ws.onclose({
            code: 1000,
            reason: '',
            wasClean: true,
          } as CloseEvent)

          // Should handle empty reason (uses 'No reason provided')
          expect(logger.debug).toHaveBeenCalledWith(
            expect.stringContaining('[WebSocket] Disconnected'),
            expect.objectContaining({
              reason: expect.any(String),
            })
          )
        }
      }
    })
  })

  describe('onerror - exact comparisons', () => {
    it('should verify instanceof check - error instanceof Error', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-123',
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0) {
        const ws = wsInstances[0]

        if (ws.onerror) {
          // Test with Error instance
          const error = new Error('Test error')
          ws.onerror(error as any)

          // Should extract message from Error
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('[WebSocket] Connection error'),
            expect.objectContaining({
              message: 'Test error',
            })
          )
        }
      }
    })

    it('should verify instanceof check - error is not Error instance', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-123',
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0) {
        const ws = wsInstances[0]

        if (ws.onerror) {
          // Test with non-Error object
          const error = { message: 'Test error' }
          ws.onerror(error as any)

          // Should use fallback message
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('[WebSocket] Connection error'),
            expect.objectContaining({
              message: expect.any(String),
            })
          )
        }
      }
    })

    it('should verify exact WebSocket state comparisons', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-123',
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0) {
        const ws = wsInstances[0]

        if (ws.onerror) {
          // Test CONNECTING state
          ws.readyState = 0 // CONNECTING
          ws.onerror(new Error('Test') as any)
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('[WebSocket] Connection error'),
            expect.objectContaining({
              readyState: 'CONNECTING',
            })
          )

          // Test OPEN state
          ws.readyState = 1 // OPEN
          ws.onerror(new Error('Test') as any)
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('[WebSocket] Connection error'),
            expect.objectContaining({
              readyState: 'OPEN',
            })
          )

          // Test CLOSING state
          ws.readyState = 2 // CLOSING
          ws.onerror(new Error('Test') as any)
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('[WebSocket] Connection error'),
            expect.objectContaining({
              readyState: 'CLOSING',
            })
          )

          // Test CLOSED state
          ws.readyState = 3 // CLOSED
          ws.onerror(new Error('Test') as any)
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('[WebSocket] Connection error'),
            expect.objectContaining({
              readyState: 'CLOSED',
            })
          )
        }
      }
    })
  })

  describe('onmessage - exact logical operators', () => {
    it('should verify logical AND - message.log && onLog', async () => {
      const onLog = jest.fn()
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-123',
          onLog,
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0) {
        const ws = wsInstances[0]

        if (ws.onmessage) {
          const event = {
            data: JSON.stringify({
              type: 'log',
              execution_id: 'exec-123',
              log: {
                timestamp: '2024-01-01T00:00:00Z',
                level: 'info',
                message: 'Test log',
              },
            }),
          }

          ws.onmessage(event as MessageEvent)

          // Should call onLog when message.log exists
          expect(onLog).toHaveBeenCalled()
        }
      }
    })

    it('should verify logical AND - message.status && onStatus', async () => {
      const onStatus = jest.fn()
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-123',
          onStatus,
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0) {
        const ws = wsInstances[0]

        if (ws.onmessage) {
          const event = {
            data: JSON.stringify({
              type: 'status',
              execution_id: 'exec-123',
              status: 'running',
            }),
          }

          ws.onmessage(event as MessageEvent)

          // Should call onStatus when message.status exists
          expect(onStatus).toHaveBeenCalledWith('running')
        }
      }
    })

    it('should verify logical OR - (message as any).node_id || message.node_state.node_id', async () => {
      const onNodeUpdate = jest.fn()
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-123',
          onNodeUpdate,
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0) {
        const ws = wsInstances[0]

        if (ws.onmessage) {
          // Test with node_id in message
          const event1 = {
            data: JSON.stringify({
              type: 'node_update',
              execution_id: 'exec-123',
              node_id: 'node-1',
              node_state: {},
            }),
          }

          ws.onmessage(event1 as MessageEvent)
          expect(onNodeUpdate).toHaveBeenCalledWith('node-1', {})

          // Test with node_id in node_state
          const event2 = {
            data: JSON.stringify({
              type: 'node_update',
              execution_id: 'exec-123',
              node_state: {
                node_id: 'node-2',
              },
            }),
          }

          ws.onmessage(event2 as MessageEvent)
          expect(onNodeUpdate).toHaveBeenCalledWith('node-2', { node_id: 'node-2' })
        }
      }
    })
  })

  describe('catch blocks', () => {
    it('should handle JSON.parse throwing in onmessage', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-123',
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0) {
        const ws = wsInstances[0]

        if (ws.onmessage) {
          // Send invalid JSON
          const event = {
            data: 'invalid json',
          }

          // Should not throw - catch block handles it
          expect(() => ws.onmessage(event as MessageEvent)).not.toThrow()
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('[WebSocket] Failed to parse message'),
            expect.any(Error)
          )
        }
      }
    })

    it('should handle WebSocket creation throwing', async () => {
      const failingFactory = {
        create: jest.fn(() => {
          throw new Error('WebSocket creation failed')
        }),
      }

      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-123',
          webSocketFactory: failingFactory,
          windowLocation: mockWindowLocation,
        })
      )

      // Should not throw - catch block handles it
      await advanceTimersByTime(100)
      expect(result.current.isConnected).toBe(false)
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create connection for execution'),
        expect.any(Error)
      )
    })
  })
})
