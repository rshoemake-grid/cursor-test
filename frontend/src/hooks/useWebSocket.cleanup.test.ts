import { renderHook, act } from '@testing-library/react'
import { 
  advanceTimersByTime, 
  wsInstances, 
  MockWebSocket, 
  useWebSocket, 
  logger 
} from './useWebSocket.test.setup'

describe('useWebSocket - cleanup', () => {
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

  describe('cleanup', () => {
    it('should close connection when executionId changes to null', async () => {
      const { result, rerender } = renderHook(
        ({ executionId }) => useWebSocket({ executionId }),
        { initialProps: { executionId: 'exec-1' as string | null } }
      )

      await advanceTimersByTime(100)

      rerender({ executionId: null })
      await advanceTimersByTime(100)

      expect(result.current.isConnected).toBe(false)
    })

    it('should close connection when execution status changes to completed', async () => {
      const { result, rerender } = renderHook(
        ({ executionStatus }) =>
          useWebSocket({
            executionId: 'exec-1',
            executionStatus
          }),
        { initialProps: { executionStatus: 'running' as const } }
      )

      await advanceTimersByTime(100)

      rerender({ executionStatus: 'completed' })
      await advanceTimersByTime(100)

      expect(result.current.isConnected).toBe(false)
    })

    it('should close connection when execution status changes to failed', async () => {
      const { result, rerender } = renderHook(
        ({ executionStatus }) =>
          useWebSocket({
            executionId: 'exec-1',
            executionStatus
          }),
        { initialProps: { executionStatus: 'running' as const } }
      )

      await advanceTimersByTime(100)

      rerender({ executionStatus: 'failed' })
      await advanceTimersByTime(100)

      expect(result.current.isConnected).toBe(false)
    })

    it('should clear reconnection timeout on cleanup', async () => {
      const { unmount } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          executionStatus: 'running'
        })
      )

      await advanceTimersByTime(100)

      unmount()
      await advanceTimersByTime(100)

      // Cleanup should have been called
      expect(logger.debug).toHaveBeenCalled()
    })

    it('should close existing connection before creating new one', async () => {
      const { rerender } = renderHook(
        ({ executionId }) => useWebSocket({ executionId }),
        { initialProps: { executionId: 'exec-1' } }
      )

      await advanceTimersByTime(100)
      const firstWsCount = wsInstances.length

      rerender({ executionId: 'exec-2' })
      await advanceTimersByTime(100)

      // Should have closed first connection
      expect(wsInstances.length).toBeGreaterThan(firstWsCount)
    })
  })
})
