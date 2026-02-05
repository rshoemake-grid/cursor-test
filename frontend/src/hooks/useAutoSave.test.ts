import { renderHook, act } from '@testing-library/react'
import { useAutoSave } from './useAutoSave'

describe('useAutoSave', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should not save on first render', () => {
    const saveFn = jest.fn()
    renderHook(() => useAutoSave('initial', saveFn))

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(saveFn).not.toHaveBeenCalled()
  })

  it('should save after value changes and delay', () => {
    const saveFn = jest.fn()
    const { rerender } = renderHook(
      ({ value }) => useAutoSave(value, saveFn),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(saveFn).toHaveBeenCalledTimes(1)
    expect(saveFn).toHaveBeenCalledWith('updated')
  })

  it('should debounce multiple rapid changes', () => {
    const saveFn = jest.fn()
    const { rerender } = renderHook(
      ({ value }) => useAutoSave(value, saveFn),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'change1' })
    act(() => {
      jest.advanceTimersByTime(200)
    })

    rerender({ value: 'change2' })
    act(() => {
      jest.advanceTimersByTime(200)
    })

    rerender({ value: 'change3' })
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // Should only save once with the final value
    expect(saveFn).toHaveBeenCalledTimes(1)
    expect(saveFn).toHaveBeenCalledWith('change3')
  })

  it('should use custom delay', () => {
    const saveFn = jest.fn()
    const { rerender } = renderHook(
      ({ value }) => useAutoSave(value, saveFn, 1000),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(saveFn).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(saveFn).toHaveBeenCalledTimes(1)
  })

  it('should not save when enabled is false', () => {
    const saveFn = jest.fn()
    const { rerender } = renderHook(
      ({ value }) => useAutoSave(value, saveFn, 500, false),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(saveFn).not.toHaveBeenCalled()
  })

  it('should save when enabled changes to true', () => {
    const saveFn = jest.fn()
    const { rerender } = renderHook(
      ({ value, enabled }) => useAutoSave(value, saveFn, 500, enabled),
      { initialProps: { value: 'initial', enabled: false } }
    )

    // Change value while disabled - should not save
    rerender({ value: 'updated', enabled: false })

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(saveFn).not.toHaveBeenCalled()

    // Enable with same value - should not save (value hasn't changed)
    rerender({ value: 'updated', enabled: true })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(saveFn).not.toHaveBeenCalled()

    // Now change value while enabled - should save
    rerender({ value: 'final', enabled: true })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(saveFn).toHaveBeenCalledTimes(1)
    expect(saveFn).toHaveBeenCalledWith('final')
  })

  it('should not save when value has not changed', () => {
    const saveFn = jest.fn()
    const { rerender } = renderHook(
      ({ value }) => useAutoSave(value, saveFn),
      { initialProps: { value: 'same' } }
    )

    rerender({ value: 'same' })

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(saveFn).not.toHaveBeenCalled()
  })

  it('should handle object values with shallow comparison', () => {
    const saveFn = jest.fn()
    const initialValue = { key: 'value' }
    const { rerender } = renderHook(
      ({ value }) => useAutoSave(value, saveFn),
      { initialProps: { value: initialValue } }
    )

    const updatedValue = { key: 'newValue' }
    rerender({ value: updatedValue })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(saveFn).toHaveBeenCalledTimes(1)
    expect(saveFn).toHaveBeenCalledWith(updatedValue)
  })

  it('should handle array values with shallow comparison', () => {
    const saveFn = jest.fn()
    const { rerender } = renderHook(
      ({ value }) => useAutoSave(value, saveFn),
      { initialProps: { value: [1, 2, 3] } }
    )

    rerender({ value: [1, 2, 4] })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(saveFn).toHaveBeenCalledTimes(1)
    expect(saveFn).toHaveBeenCalledWith([1, 2, 4])
  })

  it('should handle async save function', async () => {
    const saveFn = jest.fn().mockResolvedValue(undefined)
    const { rerender } = renderHook(
      ({ value }) => useAutoSave(value, saveFn),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })

    await act(async () => {
      jest.advanceTimersByTime(500)
    })

    expect(saveFn).toHaveBeenCalledTimes(1)
  })

  it('should handle save function errors gracefully', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    const saveFn = jest.fn().mockImplementation(() => {
      throw new Error('Save failed')
    })

    const { rerender } = renderHook(
      ({ value }) => useAutoSave(value, saveFn),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(saveFn).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith('Auto-save failed:', expect.any(Error))

    consoleErrorSpy.mockRestore()
  })

  it('should cleanup timeout on unmount', () => {
    const saveFn = jest.fn()
    const { rerender, unmount } = renderHook(
      ({ value }) => useAutoSave(value, saveFn),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })

    unmount()

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(saveFn).not.toHaveBeenCalled()
  })

  it('should handle null values', () => {
    const saveFn = jest.fn()
    const { rerender } = renderHook(
      ({ value }) => useAutoSave(value, saveFn),
      { initialProps: { value: null } }
    )

    rerender({ value: 'not null' })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(saveFn).toHaveBeenCalledTimes(1)
    expect(saveFn).toHaveBeenCalledWith('not null')
  })
})
