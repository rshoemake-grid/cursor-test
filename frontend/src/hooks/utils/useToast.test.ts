/**
 * Tests for useToast Hook
 * Follows SOLID, DRY, and DIP principles
 */

import { renderHook, act } from '@testing-library/react'
import { useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with empty toasts array', () => {
    const { result } = renderHook(() => useToast())

    expect(result.current.toasts).toEqual([])
  })

  it('should add a toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast('Test message', 'info')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('Test message')
    expect(result.current.toasts[0].type).toBe('info')
  })

  it('should remove a toast', () => {
    const { result } = renderHook(() => useToast())

    let toastId: string
    act(() => {
      toastId = result.current.addToast('Test message', 'info')
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      result.current.removeToast(toastId!)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('should add success toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('Success message')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].type).toBe('success')
    expect(result.current.toasts[0].message).toBe('Success message')
  })

  it('should add error toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.error('Error message')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].type).toBe('error')
    expect(result.current.toasts[0].message).toBe('Error message')
  })

  it('should add warning toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.warning('Warning message')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].type).toBe('warning')
    expect(result.current.toasts[0].message).toBe('Warning message')
  })

  it('should add info toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.info('Info message')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].type).toBe('info')
    expect(result.current.toasts[0].message).toBe('Info message')
  })

  it('should generate unique toast IDs', () => {
    const { result } = renderHook(() => useToast())

    let id1: string, id2: string
    act(() => {
      id1 = result.current.addToast('Message 1', 'info')
      id2 = result.current.addToast('Message 2', 'info')
    })

    expect(id1!).not.toBe(id2!)
    expect(result.current.toasts).toHaveLength(2)
  })

  it('should accept custom duration', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast('Test', 'info', 10000)
    })

    expect(result.current.toasts[0].duration).toBe(10000)
  })

  it('should handle multiple toasts', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('Success 1')
      result.current.error('Error 1')
      result.current.warning('Warning 1')
    })

    expect(result.current.toasts).toHaveLength(3)
  })
})
