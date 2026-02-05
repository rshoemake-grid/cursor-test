/**
 * Enhanced mutation tests for useDataFetching
 * Focuses on killing remaining 2 surviving mutants through:
 * 1. Testing instanceof Error mutations
 * 2. Testing optional chaining for onError callback
 * 3. Testing error handling edge cases
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useDataFetching } from './useDataFetching'
import { logger } from '../../utils/logger'

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}))

const mockLogger = logger as jest.Mocked<typeof logger>

const waitForWithTimeout = (callback: () => void | Promise<void>, timeout = 2000) => {
  return waitFor(callback, { timeout })
}

describe('useDataFetching - Enhanced Mutation Killers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Error Handling - instanceof Error', () => {
    describe('err instanceof Error condition', () => {
      it('should verify exact instanceof check - Error instance', async () => {
        const mockFetchFn = jest.fn().mockRejectedValue(new Error('Test error'))

        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
          })
        )

        await act(async () => {
          await result.current.refetch()
        })

        // Should handle Error instance correctly
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error?.message).toBe('Test error')
        expect(mockLogger.error).toHaveBeenCalled()
      })

      it('should verify exact instanceof check - non-Error object', async () => {
        const mockFetchFn = jest.fn().mockRejectedValue({ message: 'Test error' })

        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
          })
        )

        await act(async () => {
          await result.current.refetch()
        })

        // Should convert non-Error to Error
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error?.message).toBe('[object Object]')
        expect(mockLogger.error).toHaveBeenCalled()
      })

      it('should verify exact instanceof check - string error', async () => {
        const mockFetchFn = jest.fn().mockRejectedValue('String error')

        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
          })
        )

        await act(async () => {
          await result.current.refetch()
        })

        // Should convert string to Error
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error?.message).toBe('String error')
        expect(mockLogger.error).toHaveBeenCalled()
      })

      it('should verify exact instanceof check - number error', async () => {
        const mockFetchFn = jest.fn().mockRejectedValue(404)

        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
          })
        )

        await act(async () => {
          await result.current.refetch()
        })

        // Should convert number to Error
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error?.message).toBe('404')
        expect(mockLogger.error).toHaveBeenCalled()
      })

      it('should verify exact instanceof check - null error', async () => {
        const mockFetchFn = jest.fn().mockRejectedValue(null)

        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
          })
        )

        await act(async () => {
          await result.current.refetch()
        })

        // Should convert null to Error
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error?.message).toBe('null')
        expect(mockLogger.error).toHaveBeenCalled()
      })

      it('should verify exact instanceof check - undefined error', async () => {
        const mockFetchFn = jest.fn().mockRejectedValue(undefined)

        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
          })
        )

        await act(async () => {
          await result.current.refetch()
        })

        // Should convert undefined to Error
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error?.message).toBe('undefined')
        expect(mockLogger.error).toHaveBeenCalled()
      })
    })
  })

  describe('onError Optional Chaining', () => {
    describe('onError?.(error) optional chaining', () => {
      it('should verify optional chaining - onError provided', async () => {
        const mockOnError = jest.fn()
        const mockFetchFn = jest.fn().mockRejectedValue(new Error('Test error'))

        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
            onError: mockOnError, // Provided
          })
        )

        await act(async () => {
          await result.current.refetch()
        })

        // Should call onError (callback provided)
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error))
        expect(mockOnError).toHaveBeenCalledTimes(1)
      })

      it('should verify optional chaining - onError undefined', async () => {
        const mockFetchFn = jest.fn().mockRejectedValue(new Error('Test error'))

        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
            // onError missing (undefined)
          })
        )

        await act(async () => {
          await result.current.refetch()
        })

        // Should not crash (callback not provided)
        expect(result.current.error).toBeInstanceOf(Error)
        expect(mockLogger.error).toHaveBeenCalled()
      })

      it('should verify optional chaining - onError null', async () => {
        const mockFetchFn = jest.fn().mockRejectedValue(new Error('Test error'))

        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
            onError: null as any, // Explicitly null
          })
        )

        await act(async () => {
          await result.current.refetch()
        })

        // Should not crash (callback is null)
        expect(result.current.error).toBeInstanceOf(Error)
        expect(mockLogger.error).toHaveBeenCalled()
      })

      it('should verify onError called with correct error', async () => {
        const mockOnError = jest.fn()
        const testError = new Error('Specific error message')
        const mockFetchFn = jest.fn().mockRejectedValue(testError)

        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
            onError: mockOnError,
          })
        )

        await act(async () => {
          await result.current.refetch()
        })

        // Should call onError with Error instance
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error))
        expect(mockOnError.mock.calls[0][0].message).toBe('Specific error message')
      })
    })
  })

  describe('Success Path', () => {
    it('should set data on successful fetch', async () => {
      const mockData = { key: 'value' }
      const mockFetchFn = jest.fn().mockResolvedValue(mockData)

      const { result } = renderHook(() =>
        useDataFetching({
          fetchFn: mockFetchFn,
          initialData: null,
        })
      )

      await act(async () => {
        await result.current.refetch()
      })

      // Should set data
      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    it('should clear error on successful refetch', async () => {
      const mockFetchFn = jest.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({ success: true })

      const { result } = renderHook(() =>
        useDataFetching({
          fetchFn: mockFetchFn,
          initialData: null,
        })
      )

      // First call - error
      await act(async () => {
        await result.current.refetch()
      })
      expect(result.current.error).toBeInstanceOf(Error)

      // Second call - success
      await act(async () => {
        await result.current.refetch()
      })

      // Should clear error
      expect(result.current.error).toBeNull()
      expect(result.current.data).toEqual({ success: true })
    })
  })

  describe('Loading State', () => {
    it('should set loading to true during fetch', async () => {
      let resolvePromise: (value: any) => void
      const mockFetchFn = jest.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          resolvePromise = resolve
        })
      })

      const { result } = renderHook(() =>
        useDataFetching({
          fetchFn: mockFetchFn,
          initialData: null,
        })
      )

      // Start fetch - refetch sets loading synchronously before async work
      act(() => {
        result.current.refetch()
      })

      // Should be loading immediately (setLoading(true) is synchronous)
      expect(result.current.loading).toBe(true)

      // Complete fetch
      await act(async () => {
        resolvePromise!({ success: true })
        await new Promise(resolve => setTimeout(resolve, 0)) // Allow promise to resolve
      })

      // Should not be loading after completion
      expect(result.current.loading).toBe(false)
    })

    it('should set loading to false after error', async () => {
      const mockFetchFn = jest.fn().mockRejectedValue(new Error('Test error'))

      const { result } = renderHook(() =>
        useDataFetching({
          fetchFn: mockFetchFn,
          initialData: null,
        })
      )

      await act(async () => {
        await result.current.refetch()
      })

      // Should not be loading after error
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeInstanceOf(Error)
    })
  })

  describe('Initial Data', () => {
    it('should use initial data when provided', () => {
      const initialData = { initial: 'data' }

      const { result } = renderHook(() =>
        useDataFetching({
          fetchFn: jest.fn(),
          initialData,
        })
      )

      // Should start with initial data
      expect(result.current.data).toEqual(initialData)
    })

    it('should use null when initial data not provided', () => {
      const { result } = renderHook(() =>
        useDataFetching({
          fetchFn: jest.fn(),
          // initialData not provided
        })
      )

      // Should start with null
      expect(result.current.data).toBeNull()
    })
  })

  describe('Custom Logger', () => {
    it('should use custom logger when provided', async () => {
      const customLogger = {
        debug: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
      }
      const mockFetchFn = jest.fn().mockRejectedValue(new Error('Test error'))

      const { result } = renderHook(() =>
        useDataFetching({
          fetchFn: mockFetchFn,
          initialData: null,
          logger: customLogger,
        })
      )

      await act(async () => {
        await result.current.refetch()
      })

      // Should use custom logger
      expect(customLogger.error).toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })
})
