/**
 * Tests for useAsyncOperation Hook
 */

import { renderHook, act } from '@testing-library/react'
import { useAsyncOperation } from './useAsyncOperation'
import { logger } from '../../utils/logger'

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  },
}))

const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>

describe('useAsyncOperation', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('initial state', () => {
    it('should initialize with default state', () => {
      const operation = jest.fn()
      const { result } = renderHook(() => useAsyncOperation({ operation }))

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('execute', () => {
    it('should execute operation successfully', async () => {
      const mockResult = { id: '1', name: 'Result' }
      const operation = jest.fn().mockResolvedValue(mockResult)
      const onSuccess = jest.fn()

      const { result } = renderHook(() =>
        useAsyncOperation({ operation, onSuccess })
      )

      let executeResult: any
      await act(async () => {
        executeResult = await result.current.execute()
      })

      expect(operation).toHaveBeenCalledTimes(1)
      expect(executeResult).toEqual(mockResult)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(onSuccess).toHaveBeenCalledWith(mockResult)
    })

    it('should handle operation with arguments', async () => {
      const operation = jest.fn().mockResolvedValue('result')
      const { result } = renderHook(() => useAsyncOperation({ operation }))

      await act(async () => {
        await result.current.execute('arg1', 'arg2', 123)
      })

      expect(operation).toHaveBeenCalledWith('arg1', 'arg2', 123)
    })

    it('should handle loading state during execution', async () => {
      const operation = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve('result'), 100)
          })
      )

      const { result } = renderHook(() => useAsyncOperation({ operation }))

      act(() => {
        result.current.execute()
      })

      expect(result.current.loading).toBe(true)

      await act(async () => {
        jest.advanceTimersByTime(150)
      })

      expect(result.current.loading).toBe(false)
    })

    it('should handle errors', async () => {
      const error = new Error('Operation failed')
      const operation = jest.fn().mockRejectedValue(error)
      const onError = jest.fn()

      const { result } = renderHook(() =>
        useAsyncOperation({ operation, onError })
      )

      await act(async () => {
        await result.current.execute()
      })

      expect(operation).toHaveBeenCalledTimes(1)
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('Operation failed')
      expect(result.current.loading).toBe(false)
      expect(onError).toHaveBeenCalledWith(error)
      expect(mockLoggerError).toHaveBeenCalledWith('Async operation failed:', expect.any(Error))
    })

    it('should return null on error', async () => {
      const error = new Error('Operation failed')
      const operation = jest.fn().mockRejectedValue(error)

      const { result } = renderHook(() => useAsyncOperation({ operation }))

      let executeResult: any
      await act(async () => {
        executeResult = await result.current.execute()
      })

      expect(executeResult).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeInstanceOf(Error)
    })

    it('should always reset loading state in finally block even if error occurs', async () => {
      const error = new Error('Operation failed')
      const operation = jest.fn().mockRejectedValue(error)

      const { result } = renderHook(() => useAsyncOperation({ operation }))

      await act(async () => {
        await result.current.execute()
      })

      // Loading should be false after error
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeInstanceOf(Error)
    })

    it('should handle non-Error rejections', async () => {
      const operation = jest.fn().mockRejectedValue('String error')
      const { result } = renderHook(() => useAsyncOperation({ operation }))

      await act(async () => {
        await result.current.execute()
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('String error')
    })

    it('should use custom logger when provided', async () => {
      const customLogger = {
        error: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        log: jest.fn(),
        warn: jest.fn(),
      }
      const error = new Error('Operation failed')
      const operation = jest.fn().mockRejectedValue(error)

      const { result } = renderHook(() =>
        useAsyncOperation({ operation, logger: customLogger })
      )

      await act(async () => {
        await result.current.execute()
      })

      expect(customLogger.error).toHaveBeenCalledWith('Async operation failed:', expect.any(Error))
      expect(mockLoggerError).not.toHaveBeenCalled()
    })
  })

  describe('reset', () => {
    it('should reset error and loading state', async () => {
      const error = new Error('Operation failed')
      const operation = jest.fn().mockRejectedValue(error)

      const { result } = renderHook(() => useAsyncOperation({ operation }))

      // Cause an error
      await act(async () => {
        await result.current.execute()
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.loading).toBe(false)

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
    })
  })
})
