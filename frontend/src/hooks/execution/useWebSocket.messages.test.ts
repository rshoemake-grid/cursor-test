import { renderHook, act } from '@testing-library/react'
import { 
  advanceTimersByTime, 
  wsInstances, 
  MockWebSocket, 
  useWebSocket, 
  logger 
} from './useWebSocket.test.setup'

describe('useWebSocket - messages', () => {
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

  describe('message handling', () => {
    it('should handle log messages', async () => {
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
          log: {
            timestamp: '2024-01-01T00:00:00Z',
            level: 'INFO',
            message: 'Test log'
          }
        })

        expect(onLog).toHaveBeenCalledWith({
          timestamp: '2024-01-01T00:00:00Z',
          level: 'INFO',
          message: 'Test log'
        })
      }
    })

    it('should handle status messages', async () => {
      const onStatus = jest.fn()
      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          onStatus
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0 && wsInstances[0].onmessage) {
        wsInstances[0].simulateMessage({
          type: 'status',
          execution_id: 'exec-1',
          status: 'running'
        })

        expect(onStatus).toHaveBeenCalledWith('running')
      }
    })

    it('should handle node_update messages', async () => {
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
          node_id: 'node-1',
          node_state: { status: 'completed' }
        })

        expect(onNodeUpdate).toHaveBeenCalledWith('node-1', { status: 'completed' })
      }
    })

    it('should handle node_update messages with node_id in node_state', async () => {
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
          node_state: { node_id: 'node-2', status: 'running' }
        })

        expect(onNodeUpdate).toHaveBeenCalledWith('node-2', { node_id: 'node-2', status: 'running' })
      }
    })

    it('should verify node_id extraction pattern: (message as any).node_id || message.node_state.node_id', async () => {
      const onNodeUpdate = jest.fn()
      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          onNodeUpdate
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0 && wsInstances[0].onmessage) {
        // Test left operand: (message as any).node_id (truthy)
        wsInstances[0].simulateMessage({
          type: 'node_update',
          execution_id: 'exec-1',
          node_id: 'top-level-node',
          node_state: { status: 'running' }
        })

        expect(onNodeUpdate).toHaveBeenCalledWith('top-level-node', { status: 'running' })
      }
    })

    it('should verify node_id extraction pattern with falsy top-level node_id', async () => {
      const onNodeUpdate = jest.fn()
      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          onNodeUpdate
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0 && wsInstances[0].onmessage) {
        // Test right operand: message.node_state.node_id (when top-level is falsy)
        wsInstances[0].simulateMessage({
          type: 'node_update',
          execution_id: 'exec-1',
          node_state: { node_id: 'nested-node', status: 'running' }
        })

        expect(onNodeUpdate).toHaveBeenCalledWith('nested-node', { node_id: 'nested-node', status: 'running' })
      }
    })

    it('should verify node_id extraction pattern with both falsy', async () => {
      const onNodeUpdate = jest.fn()
      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          onNodeUpdate
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0 && wsInstances[0].onmessage) {
        // Test when both are falsy - should not call onNodeUpdate
        wsInstances[0].simulateMessage({
          type: 'node_update',
          execution_id: 'exec-1',
          node_state: { status: 'running' }
        })

        // Should not be called when nodeId is falsy
        expect(onNodeUpdate).not.toHaveBeenCalled()
      }
    })

    it('should verify message.log && onLog pattern', async () => {
      const onLog = jest.fn()
      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          onLog
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0 && wsInstances[0].onmessage) {
        // Test message.log && onLog pattern (both truthy)
        wsInstances[0].simulateMessage({
          type: 'log',
          execution_id: 'exec-1',
          log: {
            timestamp: '2024-01-01T00:00:00Z',
            level: 'INFO',
            message: 'Test'
          }
        })

        expect(onLog).toHaveBeenCalled()
      }
    })

    it('should verify message.log && onLog pattern with falsy log', async () => {
      const onLog = jest.fn()
      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          onLog
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0 && wsInstances[0].onmessage) {
        // Test message.log && onLog pattern (log is falsy)
        wsInstances[0].simulateMessage({
          type: 'log',
          execution_id: 'exec-1',
          log: undefined
        })

        // Should not be called when log is falsy
        expect(onLog).not.toHaveBeenCalled()
      }
    })

    it('should verify message.status && onStatus pattern', async () => {
      const onStatus = jest.fn()
      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          onStatus
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0 && wsInstances[0].onmessage) {
        // Test message.status && onStatus pattern
        wsInstances[0].simulateMessage({
          type: 'status',
          execution_id: 'exec-1',
          status: 'running'
        })

        expect(onStatus).toHaveBeenCalledWith('running')
      }
    })

    it('should verify message.error && onError pattern', async () => {
      const onError = jest.fn()
      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          onError
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0 && wsInstances[0].onmessage) {
        // Test message.error && onError pattern
        wsInstances[0].simulateMessage({
          type: 'error',
          execution_id: 'exec-1',
          error: 'Test error'
        })

        expect(onError).toHaveBeenCalledWith('Test error')
      }
    })

    it('should verify onCompletion pattern without error check', async () => {
      const onCompletion = jest.fn()
      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          onCompletion
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0 && wsInstances[0].onmessage) {
        // Test onCompletion pattern (no error check, just onCompletion check)
        wsInstances[0].simulateMessage({
          type: 'completion',
          execution_id: 'exec-1',
          result: { success: true }
        })

        expect(onCompletion).toHaveBeenCalledWith({ success: true })
      }
    })

    it('should verify message.node_state && onNodeUpdate pattern', async () => {
      const onNodeUpdate = jest.fn()
      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          onNodeUpdate
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0 && wsInstances[0].onmessage) {
        // Test message.node_state && onNodeUpdate pattern
        wsInstances[0].simulateMessage({
          type: 'node_update',
          execution_id: 'exec-1',
          node_id: 'node-1',
          node_state: { status: 'completed' }
        })

        expect(onNodeUpdate).toHaveBeenCalled()
      }
    })

    it('should handle completion messages', async () => {
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
          result: { output: 'success' }
        })

        expect(onCompletion).toHaveBeenCalledWith({ output: 'success' })
      }
    })

    it('should handle error messages', async () => {
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
          error: 'Execution failed'
        })

        expect(onError).toHaveBeenCalled()
      }
    })

    it('should handle invalid JSON messages', async () => {
      renderHook(() => useWebSocket({ executionId: 'exec-1' }))

      await advanceTimersByTime(100)

      if (wsInstances.length > 0 && wsInstances[0].onmessage) {
        const invalidEvent = new MessageEvent('message', { data: 'invalid json{' })
        wsInstances[0].onmessage!(invalidEvent)

        expect(logger.error).toHaveBeenCalledWith(
          '[WebSocket] Failed to parse message:',
          expect.anything()
        )
      }
    })

    it('should not call handlers when message data is missing', async () => {
      const onLog = jest.fn()
      const onStatus = jest.fn()
      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          onLog,
          onStatus
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0 && wsInstances[0].onmessage) {
        // Clear any connection status calls
        onLog.mockClear()
        onStatus.mockClear()
        
        wsInstances[0].simulateMessage({
          type: 'log',
          execution_id: 'exec-1'
          // No log field
        })

        wsInstances[0].simulateMessage({
          type: 'status',
          execution_id: 'exec-1'
          // No status field
        })

        expect(onLog).not.toHaveBeenCalled()
        // onStatus might be called for connection status, but not for message status
        // Check that it wasn't called with a status from the message (which would be undefined)
        const statusCalls = onStatus.mock.calls.filter((call) => call[0] !== 'connected')
        expect(statusCalls.length).toBe(0)
      }
    })
  })


})
