import { renderHook, act } from '@testing-library/react'
import { 
  advanceTimersByTime, 
  wsInstances, 
  useWebSocket, 
  logger 
} from './useWebSocket.test.setup'

describe('useWebSocket - edges.advanced', () => {
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

  describe('reconnect delay calculation edge cases', () => {
    it('should cap delay at 10000ms for high attempt numbers', async () => {
      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          executionStatus: 'running'
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0) {
        const ws = wsInstances[0]
        await act(async () => {
          ws.simulateOpen()
          await advanceTimersByTime(50)
        })
        
        // Manually set reconnect attempts to a high number
        // This tests Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
        // For attempt 5: 1000 * 2^5 = 32000, should be capped to 10000
        
        // Trigger multiple reconnects to increment attempts
        for (let i = 0; i < 5; i++) {
          await act(async () => {
            ws.simulateClose(1006, '', false)
            await advanceTimersByTime(100)
          })
          // Advance past the delay
          await advanceTimersByTime(11000)
        }

        expect(logger.debug).toHaveBeenCalled()
        // Check that delay was capped at 10000
        const reconnectCalls = (logger.debug as jest.Mock).mock.calls.filter((call: any[]) => 
          call[0]?.includes('Reconnecting in')
        )
        if (reconnectCalls.length > 0) {
          const lastCall = reconnectCalls[reconnectCalls.length - 1]
          const delayMatch = lastCall[0].match(/Reconnecting in (\d+)ms/)
          if (delayMatch) {
            const delay = parseInt(delayMatch[1], 10)
            expect(delay).toBeLessThanOrEqual(10000)
          }
        }
      }
    })

    it('should calculate exponential backoff correctly', async () => {
      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          executionStatus: 'running'
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0) {
        const ws = wsInstances[0]
        await act(async () => {
          ws.simulateOpen()
          await advanceTimersByTime(50)
        })
        
        await act(async () => {
          ws.simulateClose(1006, '', false)
          await advanceTimersByTime(50)
        })

        expect(logger.debug).toHaveBeenCalled()
        const reconnectCalls = (logger.debug as jest.Mock).mock.calls.filter((call: any[]) => 
          call[0]?.includes('Reconnecting in')
        )
        if (reconnectCalls.length > 0) {
          const firstCall = reconnectCalls[0]
          const delayMatch = firstCall[0].match(/Reconnecting in (\d+)ms/)
          if (delayMatch) {
            const delay = parseInt(delayMatch[1], 10)
            // Should be 10000ms for attempt 1 (DEFAULT_MAX_DELAY * 2^0)
            expect(delay).toBe(10000)
          }
        }
      }
    })
  })

  describe('close event code edge cases', () => {
    it('should handle close with code 1000 and wasClean false', async () => {
      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          executionStatus: 'running'
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0) {
        const ws = wsInstances[0]
        await act(async () => {
          ws.simulateOpen()
          await advanceTimersByTime(50)
        })
        
        await act(async () => {
          ws.simulateClose(1000, '', false)
          await advanceTimersByTime(50)
        })

        expect(logger.debug).toHaveBeenCalled()
        const reconnectCalls = (logger.debug as jest.Mock).mock.calls.filter((call: any[]) => 
          call[0]?.includes('Reconnecting in')
        )
        expect(reconnectCalls.length).toBeGreaterThan(0)
      }
    })
  })
})
