/**
 * Tests for useSyncState Hook
 * Tests state synchronization functionality
 */

import { renderHook, act } from '@testing-library/react'
import { useSyncState, useSyncStateWithDefault } from './useSyncState'

describe('useSyncState', () => {
  it('should sync value when source is truthy (default behavior)', () => {
    const setter = jest.fn()
    const { rerender } = renderHook(
      ({ source }) => useSyncState(source, setter),
      { initialProps: { source: null as string | null } }
    )

    expect(setter).not.toHaveBeenCalled()

    act(() => {
      rerender({ source: 'test-value' })
    })

    expect(setter).toHaveBeenCalledWith('test-value')
  })

  it('should not sync when source is null (default behavior)', () => {
    const setter = jest.fn()
    renderHook(() => useSyncState(null, setter))

    expect(setter).not.toHaveBeenCalled()
  })

  it('should not sync when source is undefined (default behavior)', () => {
    const setter = jest.fn()
    renderHook(() => useSyncState(undefined, setter))

    expect(setter).not.toHaveBeenCalled()
  })

  it('should not sync when source is empty string (default behavior)', () => {
    const setter = jest.fn()
    renderHook(() => useSyncState('', setter))

    expect(setter).not.toHaveBeenCalled()
  })

  it('should not sync when source is 0 (falsy)', () => {
    const setter = jest.fn()
    const { rerender } = renderHook(
      ({ source }) => useSyncState(source, setter),
      { initialProps: { source: null as number | null } }
    )

    act(() => {
      rerender({ source: 0 })
    })

    // 0 is falsy, so default behavior won't sync it
    expect(setter).not.toHaveBeenCalled()
  })

  it('should use condition function when provided', () => {
    const setter = jest.fn()
    const condition = jest.fn((value: string | null | undefined) => value !== null && value !== undefined)
    
    const { rerender } = renderHook(
      ({ source }) => useSyncState(source, setter, condition),
      { initialProps: { source: null as string | null } }
    )

    expect(condition).toHaveBeenCalledWith(null)
    expect(setter).not.toHaveBeenCalled()

    act(() => {
      rerender({ source: 'test' })
    })

    expect(condition).toHaveBeenCalledWith('test')
    expect(setter).toHaveBeenCalledWith('test')
  })

  it('should not sync when condition returns false', () => {
    const setter = jest.fn()
    const condition = jest.fn(() => false)
    
    const { rerender } = renderHook(
      ({ source }) => useSyncState(source, setter, condition),
      { initialProps: { source: 'test' as string | null } }
    )

    expect(setter).not.toHaveBeenCalled()

    act(() => {
      rerender({ source: 'test2' })
    })

    expect(condition).toHaveBeenCalled()
    expect(setter).not.toHaveBeenCalled()
  })

  it('should sync arrays when truthy', () => {
    const setter = jest.fn()
    const { rerender } = renderHook(
      ({ source }) => useSyncState(source, setter),
      { initialProps: { source: null as string[] | null } }
    )

    act(() => {
      rerender({ source: ['item1', 'item2'] })
    })

    expect(setter).toHaveBeenCalledWith(['item1', 'item2'])
  })

  it('should sync empty arrays (truthy)', () => {
    const setter = jest.fn()
    const { rerender } = renderHook(
      ({ source }) => useSyncState(source, setter),
      { initialProps: { source: null as string[] | null } }
    )

    act(() => {
      rerender({ source: [] })
    })

    expect(setter).toHaveBeenCalledWith([])
  })

  it('should update when source changes', () => {
    const setter = jest.fn()
    const { rerender } = renderHook(
      ({ source }) => useSyncState(source, setter),
      { initialProps: { source: 'value1' as string | null } }
    )

    expect(setter).toHaveBeenCalledWith('value1')
    setter.mockClear()

    act(() => {
      rerender({ source: 'value2' })
    })

    expect(setter).toHaveBeenCalledWith('value2')
  })
})

describe('useSyncStateWithDefault', () => {
  it('should sync source value when not null/undefined', () => {
    const setter = jest.fn()
    const { rerender } = renderHook(
      ({ source }) => useSyncStateWithDefault(source, setter, null),
      { initialProps: { source: null as string | null } }
    )

    expect(setter).toHaveBeenCalledWith(null)

    act(() => {
      rerender({ source: 'test-value' })
    })

    expect(setter).toHaveBeenCalledWith('test-value')
  })

  it('should use default value when source is null', () => {
    const setter = jest.fn()
    renderHook(() => useSyncStateWithDefault(null, setter, 'default'))

    expect(setter).toHaveBeenCalledWith('default')
  })

  it('should use default value when source is undefined', () => {
    const setter = jest.fn()
    renderHook(() => useSyncStateWithDefault(undefined, setter, 'default'))

    expect(setter).toHaveBeenCalledWith('default')
  })

  it('should use custom default value', () => {
    const setter = jest.fn()
    renderHook(() => useSyncStateWithDefault(null, setter, 'custom-default'))

    expect(setter).toHaveBeenCalledWith('custom-default')
  })

  it('should sync 0 as valid value (not use default)', () => {
    const setter = jest.fn()
    const { rerender } = renderHook(
      ({ source }) => useSyncStateWithDefault(source, setter, null),
      { initialProps: { source: null as number | null } }
    )

    expect(setter).toHaveBeenCalledWith(null)
    setter.mockClear()

    act(() => {
      rerender({ source: 0 })
    })

    expect(setter).toHaveBeenCalledWith(0)
    expect(setter).not.toHaveBeenCalledWith(null)
  })

  it('should sync empty string as valid value', () => {
    const setter = jest.fn()
    const { rerender } = renderHook(
      ({ source }) => useSyncStateWithDefault(source, setter, 'default'),
      { initialProps: { source: null as string | null } }
    )

    act(() => {
      rerender({ source: '' })
    })

    expect(setter).toHaveBeenCalledWith('')
  })

  it('should sync false as valid value', () => {
    const setter = jest.fn()
    const { rerender } = renderHook(
      ({ source }) => useSyncStateWithDefault(source, setter, true),
      { initialProps: { source: null as boolean | null } }
    )

    act(() => {
      rerender({ source: false })
    })

    expect(setter).toHaveBeenCalledWith(false)
  })

  it('should update when source changes from null to value', () => {
    const setter = jest.fn()
    const { rerender } = renderHook(
      ({ source }) => useSyncStateWithDefault(source, setter, null),
      { initialProps: { source: null as string | null } }
    )

    expect(setter).toHaveBeenCalledWith(null)
    setter.mockClear()

    act(() => {
      rerender({ source: 'new-value' })
    })

    expect(setter).toHaveBeenCalledWith('new-value')
  })

  it('should update when source changes from value to null', () => {
    const setter = jest.fn()
    const { rerender } = renderHook(
      ({ source }) => useSyncStateWithDefault(source, setter, 'default'),
      { initialProps: { source: 'value' as string | null } }
    )

    expect(setter).toHaveBeenCalledWith('value')
    setter.mockClear()

    act(() => {
      rerender({ source: null })
    })

    expect(setter).toHaveBeenCalledWith('default')
  })
})
