import { renderHook, act } from '@testing-library/react'
import { useSelectionManager } from './useSelectionManager'

describe('useSelectionManager', () => {
  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => useSelectionManager())

    expect(result.current.selectedIds.size).toBe(0)
    expect(result.current.size).toBe(0)
  })

  it('should toggle selection', () => {
    const { result } = renderHook(() => useSelectionManager())

    act(() => {
      result.current.toggle('item-1')
    })

    expect(result.current.has('item-1')).toBe(true)
    expect(result.current.size).toBe(1)

    act(() => {
      result.current.toggle('item-1')
    })

    expect(result.current.has('item-1')).toBe(false)
    expect(result.current.size).toBe(0)
  })

  it('should add item to selection', () => {
    const { result } = renderHook(() => useSelectionManager())

    act(() => {
      result.current.add('item-1')
    })

    expect(result.current.has('item-1')).toBe(true)
    expect(result.current.size).toBe(1)

    // Adding same item again should not duplicate
    act(() => {
      result.current.add('item-1')
    })

    expect(result.current.size).toBe(1)
  })

  it('should remove item from selection', () => {
    const { result } = renderHook(() => useSelectionManager())

    act(() => {
      result.current.add('item-1')
      result.current.add('item-2')
    })

    expect(result.current.size).toBe(2)

    act(() => {
      result.current.remove('item-1')
    })

    expect(result.current.has('item-1')).toBe(false)
    expect(result.current.has('item-2')).toBe(true)
    expect(result.current.size).toBe(1)
  })

  it('should clear all selections', () => {
    const { result } = renderHook(() => useSelectionManager())

    act(() => {
      result.current.add('item-1')
      result.current.add('item-2')
      result.current.add('item-3')
    })

    expect(result.current.size).toBe(3)

    act(() => {
      result.current.clear()
    })

    expect(result.current.size).toBe(0)
    expect(result.current.has('item-1')).toBe(false)
    expect(result.current.has('item-2')).toBe(false)
    expect(result.current.has('item-3')).toBe(false)
  })

  it('should handle multiple items', () => {
    const { result } = renderHook(() => useSelectionManager())

    act(() => {
      result.current.add('item-1')
      result.current.add('item-2')
      result.current.toggle('item-3')
    })

    expect(result.current.size).toBe(3)
    expect(result.current.has('item-1')).toBe(true)
    expect(result.current.has('item-2')).toBe(true)
    expect(result.current.has('item-3')).toBe(true)

    act(() => {
      result.current.remove('item-2')
    })

    expect(result.current.size).toBe(2)
    expect(result.current.has('item-2')).toBe(false)
  })

  it('should work with custom string types', () => {
    type CustomId = 'id1' | 'id2' | 'id3'
    const { result } = renderHook(() => useSelectionManager<CustomId>())

    act(() => {
      result.current.add('id1')
      result.current.toggle('id2')
    })

    expect(result.current.has('id1')).toBe(true)
    expect(result.current.has('id2')).toBe(true)
    expect(result.current.size).toBe(2)
  })

  it('should expose setSelectedIds for direct manipulation', () => {
    const { result } = renderHook(() => useSelectionManager())

    act(() => {
      result.current.setSelectedIds(new Set(['item-1', 'item-2']))
    })

    expect(result.current.size).toBe(2)
    expect(result.current.has('item-1')).toBe(true)
    expect(result.current.has('item-2')).toBe(true)
  })

  it('should maintain referential stability of callbacks', () => {
    const { result, rerender } = renderHook(() => useSelectionManager())

    const firstToggle = result.current.toggle
    const firstAdd = result.current.add
    const firstRemove = result.current.remove
    const firstClear = result.current.clear

    rerender()

    // Callbacks should be stable (memoized with useCallback)
    expect(result.current.toggle).toBe(firstToggle)
    expect(result.current.add).toBe(firstAdd)
    expect(result.current.remove).toBe(firstRemove)
    expect(result.current.clear).toBe(firstClear)
  })

  it('should handle rapid toggles correctly', () => {
    const { result } = renderHook(() => useSelectionManager())

    act(() => {
      result.current.toggle('item-1')
      result.current.toggle('item-1')
      result.current.toggle('item-1')
    })

    // After 3 toggles, should be selected (toggle on, off, on)
    expect(result.current.has('item-1')).toBe(true)
  })
})
