/**
 * Input Type Handler Hook Tests
 * Tests for input type-specific onChange handling
 */

import { renderHook, act } from '@testing-library/react'
import { useInputTypeHandler } from './useInputTypeHandler'

describe('useInputTypeHandler', () => {
  it('should handle text input changes', () => {
    const onChange = jest.fn()
    const { result } = renderHook(() => useInputTypeHandler('text', onChange))

    act(() => {
      result.current({
        target: { value: 'test value' },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    expect(onChange).toHaveBeenCalledWith('test value')
  })

  it('should handle number input changes', () => {
    const onChange = jest.fn()
    const { result } = renderHook(() => useInputTypeHandler('number', onChange))

    act(() => {
      result.current({
        target: { value: '123' },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    expect(onChange).toHaveBeenCalledWith(123)
  })

  it('should handle checkbox input changes', () => {
    const onChange = jest.fn()
    const { result } = renderHook(() => useInputTypeHandler('checkbox', onChange))

    act(() => {
      result.current({
        target: { checked: true },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('should handle textarea changes', () => {
    const onChange = jest.fn()
    const { result } = renderHook(() => useInputTypeHandler('textarea', onChange))

    act(() => {
      result.current({
        target: { value: 'textarea value' },
      } as React.ChangeEvent<HTMLTextAreaElement>)
    })

    expect(onChange).toHaveBeenCalledWith('textarea value')
  })

  it('should handle select changes', () => {
    const onChange = jest.fn()
    const { result } = renderHook(() => useInputTypeHandler('select', onChange))

    act(() => {
      result.current({
        target: { value: 'option1' },
      } as React.ChangeEvent<HTMLSelectElement>)
    })

    expect(onChange).toHaveBeenCalledWith('option1')
  })

  it('should handle email input changes', () => {
    const onChange = jest.fn()
    const { result } = renderHook(() => useInputTypeHandler('email', onChange))

    act(() => {
      result.current({
        target: { value: 'test@example.com' },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    expect(onChange).toHaveBeenCalledWith('test@example.com')
  })

  it('should handle password input changes', () => {
    const onChange = jest.fn()
    const { result } = renderHook(() => useInputTypeHandler('password', onChange))

    act(() => {
      result.current({
        target: { value: 'password123' },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    expect(onChange).toHaveBeenCalledWith('password123')
  })

  it('should update handler when type changes', () => {
    const onChange = jest.fn()
    const { result, rerender } = renderHook(
      ({ type }) => useInputTypeHandler(type, onChange),
      { initialProps: { type: 'text' as const } }
    )

    act(() => {
      result.current({
        target: { value: 'test' },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    expect(onChange).toHaveBeenCalledWith('test')

    rerender({ type: 'number' })

    act(() => {
      result.current({
        target: { value: '456' },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    expect(onChange).toHaveBeenCalledWith(456)
  })

  it('should update handler when onChange changes', () => {
    const onChange1 = jest.fn()
    const onChange2 = jest.fn()
    const { result, rerender } = renderHook(
      ({ onChange }) => useInputTypeHandler('text', onChange),
      { initialProps: { onChange: onChange1 } }
    )

    act(() => {
      result.current({
        target: { value: 'test' },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    expect(onChange1).toHaveBeenCalledWith('test')
    expect(onChange2).not.toHaveBeenCalled()

    rerender({ onChange: onChange2 })

    act(() => {
      result.current({
        target: { value: 'new value' },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    expect(onChange2).toHaveBeenCalledWith('new value')
  })
})
