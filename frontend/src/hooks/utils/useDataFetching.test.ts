/**
 * Tests for useDataFetching Hook
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useDataFetching } from './useDataFetching'
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

describe('useDataFetching', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with null data when no initialData provided', () => {
      const fetchFn = jest.fn()
      const { result } = renderHook(() => useDataFetching({ fetchFn }))

      expect(result.current.data).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should initialize with provided initialData', () => {
      const fetchFn = jest.fn()
      const initialData = { id: '1', name: 'Test' }
      const { result } = renderHook(() =>
        useDataFetching({ fetchFn, initialData })
      )

      expect(result.current.data).toEqual(initialData)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('refetch', () => {
    it('should fetch data successfully', async () => {
      const mockData = { id: '1', name: 'Test Data' }
      const fetchFn = jest.fn().mockResolvedValue(mockData)

      const { result } = renderHook(() => useDataFetching({ fetchFn }))

      await act(async () => {
        await result.current.refetch()
      })

      expect(fetchFn).toHaveBeenCalledTimes(1)
      expect(result.current.data).toEqual(mockData)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle loading state during fetch', async () => {
      const mockData = { id: '1', name: 'Test Data' }
      let resolvePromise: (value: any) => void
      const fetchFn = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve
          })
      )

      const { result } = renderHook(() => useDataFetching({ fetchFn }))

      act(() => {
        result.current.refetch()
      })

      expect(result.current.loading).toBe(true)

      await act(async () => {
        resolvePromise!(mockData)
        await Promise.resolve() // Allow state update to propagate
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.data).toEqual(mockData)
    })

    it('should handle errors', async () => {
      const error = new Error('Fetch failed')
      const fetchFn = jest.fn().mockRejectedValue(error)
      const onError = jest.fn()

      const { result } = renderHook(() =>
        useDataFetching({ fetchFn, onError })
      )

      await act(async () => {
        await result.current.refetch()
      })

      expect(fetchFn).toHaveBeenCalledTimes(1)
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('Fetch failed')
      expect(result.current.loading).toBe(false)
      expect(onError).toHaveBeenCalledWith(error)
      expect(mockLoggerError).toHaveBeenCalledWith('Data fetch failed:', expect.any(Error))
    })

    it('should handle non-Error rejections', async () => {
      const fetchFn = jest.fn().mockRejectedValue('String error')
      const { result } = renderHook(() => useDataFetching({ fetchFn }))

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('String error')
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should clear error on successful refetch after error', async () => {
      const error = new Error('Fetch failed')
      const mockData = { id: '1', name: 'Test Data' }
      const fetchFn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockData)

      const { result } = renderHook(() => useDataFetching({ fetchFn }))

      // First fetch fails
      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.error).toBeInstanceOf(Error)

      // Second fetch succeeds
      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.error).toBeNull()
      expect(result.current.data).toEqual(mockData)
    })

    it('should use custom logger when provided', async () => {
      const customLogger = {
        error: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        log: jest.fn(),
        warn: jest.fn(),
      }
      const error = new Error('Fetch failed')
      const fetchFn = jest.fn().mockRejectedValue(error)

      const { result } = renderHook(() =>
        useDataFetching({ fetchFn, logger: customLogger })
      )

      await act(async () => {
        await result.current.refetch()
      })

      expect(customLogger.error).toHaveBeenCalledWith('Data fetch failed:', expect.any(Error))
      expect(mockLoggerError).not.toHaveBeenCalled()
    })
  })
})
