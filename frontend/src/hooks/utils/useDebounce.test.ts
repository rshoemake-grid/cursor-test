/**
 * Tests for useDebounce Hook
 * Tests debouncing functionality
 */

import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should call callback after delay', () => {
    const callback = jest.fn()
    renderHook(() => useDebounce('test', 100, callback))

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(callback).toHaveBeenCalledWith('test')
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should not call callback before delay', () => {
    const callback = jest.fn()
    renderHook(() => useDebounce('test', 100, callback))

    act(() => {
      jest.advanceTimersByTime(99)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('should cancel previous timeout when value changes', () => {
    const callback = jest.fn()
    const { rerender } = renderHook(
      ({ value }) => useDebounce(value, 100, callback),
      { initialProps: { value: 'value1' } }
    )

    act(() => {
      jest.advanceTimersByTime(50)
    })

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      rerender({ value: 'value2' })
    })

    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('value2')
    expect(callback).not.toHaveBeenCalledWith('value1')
  })

  it('should handle multiple rapid changes', () => {
    const callback = jest.fn()
    const { rerender } = renderHook(
      ({ value }) => useDebounce(value, 100, callback),
      { initialProps: { value: 'value1' } }
    )

    // Advance past initial timeout to clear it
    act(() => {
      jest.advanceTimersByTime(100)
    })
    callback.mockClear()

    // Make rapid changes
    act(() => {
      rerender({ value: 'value2' })
    })
    act(() => {
      jest.advanceTimersByTime(50)
    })
    act(() => {
      rerender({ value: 'value3' })
    })
    act(() => {
      jest.advanceTimersByTime(50)
    })
    act(() => {
      rerender({ value: 'value4' })
    })

    // Should not have been called yet (only 100ms passed since value2, but value4 was set at that point)
    expect(callback).not.toHaveBeenCalled()

    // Now advance the full delay from value4
    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('value4')
  })

  it('should clear timeout on unmount', () => {
    const callback = jest.fn()
    const { unmount } = renderHook(() => useDebounce('test', 100, callback))

    act(() => {
      jest.advanceTimersByTime(50)
    })

    unmount()

    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('should handle delay change', () => {
    const callback = jest.fn()
    const { rerender } = renderHook(
      ({ delay }) => useDebounce('test', delay, callback),
      { initialProps: { delay: 100 } }
    )

    act(() => {
      jest.advanceTimersByTime(50)
    })

    act(() => {
      rerender({ delay: 200 })
    })

    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should handle callback change', () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()
    const { rerender } = renderHook(
      ({ callback }) => useDebounce('test', 100, callback),
      { initialProps: { callback: callback1 } }
    )

    act(() => {
      jest.advanceTimersByTime(50)
    })

    act(() => {
      rerender({ callback: callback2 })
    })

    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).toHaveBeenCalledWith('test')
  })

  it('should handle null value', () => {
    const callback = jest.fn()
    renderHook(() => useDebounce(null, 100, callback))

    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(callback).toHaveBeenCalledWith(null)
  })

  it('should handle object value', () => {
    const callback = jest.fn()
    const obj = { key: 'value' }
    renderHook(() => useDebounce(obj, 100, callback))

    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(callback).toHaveBeenCalledWith(obj)
  })

  it('should handle array value', () => {
    const callback = jest.fn()
    const arr = [1, 2, 3]
    renderHook(() => useDebounce(arr, 100, callback))

    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(callback).toHaveBeenCalledWith(arr)
  })

  it('should handle zero delay', () => {
    const callback = jest.fn()
    renderHook(() => useDebounce('test', 0, callback))

    act(() => {
      jest.advanceTimersByTime(0)
    })

    expect(callback).toHaveBeenCalledWith('test')
  })
})
