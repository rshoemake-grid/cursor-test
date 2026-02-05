import { renderHook, act } from '@testing-library/react'
import { 
  advanceTimersByTime, 
  wsInstances, 
  MockWebSocket, 
  useWebSocket, 
  logger 
} from './useWebSocket.test.setup'

describe('useWebSocket - edges.comprehensive.3', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    wsInstances.splice(0, wsInstances.length)
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    wsInstances.splice(0, wsInstances.length)
    jest.useRealTimers()
  })

  describe('edge cases and error handling', () => {
    describe('windowLocation edge cases', () => {
      it('should handle windowLocation as null', async () => {
        const windowLocation = null
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1',
            windowLocation
          })
        )

        await advanceTimersByTime(100)

        expect(wsInstances.length).toBeGreaterThan(0)
        const ws = wsInstances[0]
        expect(ws.url).toContain('localhost:8000')
        expect(ws.url).toContain('ws://')
      })

      it('should handle windowLocation with null protocol', async () => {
        const windowLocation: WindowLocation = {
          protocol: null as any,
          host: 'example.com:8000'
        }
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1',
            windowLocation
          })
        )

        await advanceTimersByTime(100)

        expect(wsInstances.length).toBeGreaterThan(0)
        const ws = wsInstances[0]
        expect(ws.url).toContain('ws://')
      })

      it('should handle windowLocation with null host', async () => {
        const windowLocation: WindowLocation = {
          protocol: 'https:',
          host: null as any
        }
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1',
            windowLocation
          })
        )

        await advanceTimersByTime(100)

        expect(wsInstances.length).toBeGreaterThan(0)
        const ws = wsInstances[0]
        expect(ws.url).toContain('localhost:8000')
      })

      it('should handle windowLocation with empty host', async () => {
        const windowLocation: WindowLocation = {
          protocol: 'https:',
          host: ''
        }
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1',
            windowLocation
          })
        )

        await advanceTimersByTime(100)

        expect(wsInstances.length).toBeGreaterThan(0)
        const ws = wsInstances[0]
        expect(ws.url).toContain('localhost:8000')
      })

      it('should use wss: for https: protocol', async () => {
        const windowLocation: WindowLocation = {
          protocol: 'https:',
          host: 'example.com:8000'
        }
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1',
            windowLocation
          })
        )

        await advanceTimersByTime(100)

        expect(wsInstances.length).toBeGreaterThan(0)
        const ws = wsInstances[0]
        expect(ws.url).toContain('wss://')
      })
    })

    describe('message parsing edge cases', () => {
      it('should handle invalid JSON in message', async () => {
        const onError = jest.fn()
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1',
            onError
          })
        )

        await advanceTimersByTime(100)

        if (wsInstances.length > 0 && wsInstances[0].onmessage) {
          const event = {
            data: 'invalid json {'
          } as MessageEvent
          wsInstances[0].onmessage(event)

          expect(logger.error).toHaveBeenCalledWith(
            '[WebSocket] Failed to parse message:',
            expect.any(Error)
          )
        }
      })

      it('should handle message with null log', async () => {
        const onLog = jest.fn()
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1',
            onLog
          })
        )

        await advanceTimersByTime(100)

        if (wsInstances.length > 0 && wsInstances[0].onmessage) {
          wsInstances[0].simulateMessage({
            type: 'log',
            execution_id: 'exec-1',
            log: null
          })

          expect(onLog).not.toHaveBeenCalled()
        }
      })

      it('should handle message with null status', async () => {
        const onStatus = jest.fn()
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1',
            onStatus
          })
        )

        await advanceTimersByTime(100)

        if (wsInstances.length > 0 && wsInstances[0].onmessage) {
          // Clear any connection status calls
          onStatus.mockClear()
          
          wsInstances[0].simulateMessage({
            type: 'status',
            execution_id: 'exec-1',
            status: null
          })

          // Should not be called for message with null status
          // Filter out connection status calls
          const statusCalls = onStatus.mock.calls.filter((call) => call[0] !== 'connected')
          expect(statusCalls.length).toBe(0)
        }
      })

      it('should handle node_update with null node_state', async () => {
        const onNodeUpdate = jest.fn()
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1',
            onNodeUpdate
          })
        )

        await advanceTimersByTime(100)

        if (wsInstances.length > 0 && wsInstances[0].onmessage) {
          wsInstances[0].simulateMessage({
            type: 'node_update',
            execution_id: 'exec-1',
            node_state: null
          })

          expect(onNodeUpdate).not.toHaveBeenCalled()
        }
      })

      it('should handle node_update with node_id in top-level message', async () => {
        const onNodeUpdate = jest.fn()
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1',
            onNodeUpdate
          })
        )

        await advanceTimersByTime(100)

        if (wsInstances.length > 0 && wsInstances[0].onmessage) {
          wsInstances[0].simulateMessage({
            type: 'node_update',
            execution_id: 'exec-1',
            node_id: 'node-123',
            node_state: { status: 'running' }
          })

          expect(onNodeUpdate).toHaveBeenCalledWith('node-123', { status: 'running' })
        }
      })

      it('should handle node_update with node_id in node_state', async () => {
        const onNodeUpdate = jest.fn()
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1',
            onNodeUpdate
          })
        )

        await advanceTimersByTime(100)

        if (wsInstances.length > 0 && wsInstances[0].onmessage) {
          wsInstances[0].simulateMessage({
            type: 'node_update',
            execution_id: 'exec-1',
            node_state: { node_id: 'node-456', status: 'running' }
          })

          expect(onNodeUpdate).toHaveBeenCalledWith('node-456', { node_id: 'node-456', status: 'running' })
        }
      })

      it('should handle node_update with null node_id', async () => {
        const onNodeUpdate = jest.fn()
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1',
            onNodeUpdate
          })
        )

        await advanceTimersByTime(100)

        if (wsInstances.length > 0 && wsInstances[0].onmessage) {
          wsInstances[0].simulateMessage({
            type: 'node_update',
            execution_id: 'exec-1',
            node_id: null,
            node_state: { status: 'running' }
          })

          expect(onNodeUpdate).not.toHaveBeenCalled()
        }
      })

      it('should handle completion message with null result', async () => {
        const onCompletion = jest.fn()
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1',
            onCompletion
          })
        )

        await advanceTimersByTime(100)

        if (wsInstances.length > 0 && wsInstances[0].onmessage) {
          wsInstances[0].simulateMessage({
            type: 'completion',
            execution_id: 'exec-1',
            result: null
          })

          expect(onCompletion).toHaveBeenCalledWith(null)
        }
      })

      it('should handle error message with null error', async () => {
        const onError = jest.fn()
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1',
            onError
          })
        )

        await advanceTimersByTime(100)

        if (wsInstances.length > 0 && wsInstances[0].onmessage) {
          wsInstances[0].simulateMessage({
            type: 'error',
            execution_id: 'exec-1',
            error: null
          })

          expect(onError).not.toHaveBeenCalled()
        }
      })

      it('should handle unknown message type', async () => {
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1'
          })
        )

        await advanceTimersByTime(100)

        if (wsInstances.length > 0 && wsInstances[0].onmessage) {
          wsInstances[0].simulateMessage({
            type: 'unknown' as any,
            execution_id: 'exec-1'
          })

          // Should not throw, just ignore
          expect(logger.error).not.toHaveBeenCalled()
        }
      })
    })

    describe('error handling edge cases', () => {
      it('should handle error event without Error instance', async () => {
        const onError = jest.fn()
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1',
            onError
          })
        )

        await advanceTimersByTime(100)

        if (wsInstances.length > 0 && wsInstances[0].onerror) {
          const errorEvent = { toString: () => 'Unknown error' } as any
          wsInstances[0].onerror(errorEvent)

          expect(logger.error).toHaveBeenCalled()
        }
      })

      it('should handle close event with empty reason', async () => {
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1'
          })
        )

        await advanceTimersByTime(100)

        if (wsInstances.length > 0) {
          const ws = wsInstances[0]
          ws.simulateClose(1000, '', true)

          await advanceTimersByTime(50)

          expect(logger.debug).toHaveBeenCalledWith(
            expect.stringContaining('[WebSocket] Disconnected'),
            expect.objectContaining({
              reason: 'No reason provided'
            })
          )
        }
      })

      it('should handle close event with non-empty reason', async () => {
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1'
          })
        )

        await advanceTimersByTime(100)

        if (wsInstances.length > 0) {
          const ws = wsInstances[0]
          ws.simulateClose(1000, 'Normal closure', true)

          await advanceTimersByTime(50)

          expect(logger.debug).toHaveBeenCalledWith(
            expect.stringContaining('[WebSocket] Disconnected'),
            expect.objectContaining({
              reason: 'Normal closure'
            })
          )
        }
      })

      it('should handle WebSocket creation error', async () => {
        const onError = jest.fn()
        const webSocketFactory = {
          create: jest.fn(() => {
            throw new Error('Connection failed')
          })
        }

        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1',
            onError,
            webSocketFactory: webSocketFactory as any
          })
        )

        await advanceTimersByTime(100)

        expect(logger.error).toHaveBeenCalled()
        expect(onError).toHaveBeenCalled()
      })

      it('should handle WebSocket creation error without Error instance', async () => {
        const onError = jest.fn()
        const webSocketFactory = {
          create: jest.fn(() => {
            throw 'String error'
          })
        }

        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1',
            onError,
            webSocketFactory: webSocketFactory as any
          })
        )

        await advanceTimersByTime(100)

        expect(logger.error).toHaveBeenCalled()
        expect(onError).toHaveBeenCalledWith('Failed to create WebSocket connection')
      })
    })

    describe('reconnection edge cases', () => {
      it('should handle executionStatus changing to completed during connection', async () => {
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId: 'exec-1',
            executionStatus
          }),
          { initialProps: { executionStatus: 'running' as const } }
        )

        await advanceTimersByTime(100)

        rerender({ executionStatus: 'completed' as const })
        await advanceTimersByTime(100)

        if (wsInstances.length > 0) {
          const ws = wsInstances[0]
          expect(ws.readyState).toBe(MockWebSocket.CLOSED)
        }
      })

      it('should handle executionStatus changing to failed during connection', async () => {
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId: 'exec-1',
            executionStatus
          }),
          { initialProps: { executionStatus: 'running' as const } }
        )

        await advanceTimersByTime(100)

        rerender({ executionStatus: 'failed' as const })
        await advanceTimersByTime(100)

        if (wsInstances.length > 0) {
          const ws = wsInstances[0]
          expect(ws.readyState).toBe(MockWebSocket.CLOSED)
        }
      })

      it('should handle lastKnownStatusRef when executionStatus is undefined', async () => {
        renderHook(() =>
          useWebSocket({
            executionId: 'exec-1',
            executionStatus: undefined
          })
        )

        await advanceTimersByTime(100)

        // Should still connect since lastKnownStatusRef starts as undefined
        expect(wsInstances.length).toBeGreaterThan(0)
      })
    })
  })

})
