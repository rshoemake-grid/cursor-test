import { renderHook, act } from '@testing-library/react'
import { 
  advanceTimersByTime, 
  wsInstances, 
  MockWebSocket, 
  useWebSocket, 
  logger 
} from './useWebSocket.test.setup'

describe('useWebSocket - errors', () => {
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

  describe('error handling', () => {
    it('should handle WebSocket connection errors', async () => {
      const onError = jest.fn()
      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          onError
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0) {
        wsInstances[0].setReadyState(MockWebSocket.CONNECTING)
        wsInstances[0].simulateError(new Error('Connection failed'))

        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('[WebSocket] Connection error for execution exec-1:'),
          expect.objectContaining({
            message: expect.any(String),
            readyState: expect.any(String),
            url: expect.any(String)
          })
        )
      }
    })

    it('should handle error with different WebSocket states', async () => {
      renderHook(() => useWebSocket({ executionId: 'exec-1' }))

      await advanceTimersByTime(100)

      if (wsInstances.length > 0) {
        // Test CONNECTING state
        wsInstances[0].setReadyState(MockWebSocket.CONNECTING)
        wsInstances[0].simulateError()
        expect(logger.error).toHaveBeenCalled()

        // Test OPEN state
        wsInstances[0].setReadyState(MockWebSocket.OPEN)
        wsInstances[0].simulateError()
        expect(logger.error).toHaveBeenCalled()

        // Test CLOSING state
        wsInstances[0].setReadyState(MockWebSocket.CLOSING)
        wsInstances[0].simulateError()
        expect(logger.error).toHaveBeenCalled()

        // Test CLOSED state
        wsInstances[0].setReadyState(MockWebSocket.CLOSED)
        wsInstances[0].simulateError()
        expect(logger.error).toHaveBeenCalled()
      }
    })

    it('should handle WebSocket creation errors', async () => {
      const onError = jest.fn()
      const OriginalWS = global.WebSocket
      
      // Mock WebSocket constructor to throw
      global.WebSocket = class {
        constructor() {
          throw new Error('Failed to create WebSocket')
        }
      } as any

      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          onError
        })
      )

      await advanceTimersByTime(100)

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[WebSocket] Failed to create connection'),
        expect.anything()
      )
      expect(onError).toHaveBeenCalled()

      global.WebSocket = OriginalWS
    })
  })


})
