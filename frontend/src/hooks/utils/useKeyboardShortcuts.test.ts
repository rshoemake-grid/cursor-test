/**
 * Tests for useKeyboardShortcuts Hook
 * Follows SOLID, DRY, and DIP principles
 */

import { renderHook } from '@testing-library/react'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  let mockHandler: jest.Mock

  beforeEach(() => {
    mockHandler = jest.fn()
    jest.clearAllMocks()
  })

  it('should register keyboard shortcuts', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener')

    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [
          {
            key: 'a',
            handler: mockHandler,
          },
        ],
      })
    )

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    addEventListenerSpy.mockRestore()
  })

  it('should call handler when shortcut is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [
          {
            key: 'a',
            handler: mockHandler,
          },
        ],
      })
    )

    const event = new KeyboardEvent('keydown', { key: 'a' })
    window.dispatchEvent(event)

    expect(mockHandler).toHaveBeenCalledWith(event)
  })

  it('should handle Ctrl+key shortcuts', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [
          {
            key: 's',
            ctrlKey: true,
            handler: mockHandler,
          },
        ],
      })
    )

    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
    window.dispatchEvent(event)

    expect(mockHandler).toHaveBeenCalled()
  })

  it('should not call handler when modifier keys mismatch', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [
          {
            key: 's',
            ctrlKey: true,
            handler: mockHandler,
          },
        ],
      })
    )

    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: false })
    window.dispatchEvent(event)

    expect(mockHandler).not.toHaveBeenCalled()
  })

  it('should not trigger when typing in input', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [
          {
            key: 'a',
            handler: mockHandler,
          },
        ],
      })
    )

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true })
    input.dispatchEvent(event)

    expect(mockHandler).not.toHaveBeenCalled()

    document.body.removeChild(input)
  })

  it('should not register shortcuts when enabled is false', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener')

    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [
          {
            key: 'a',
            handler: mockHandler,
          },
        ],
        enabled: false,
      })
    )

    expect(addEventListenerSpy).not.toHaveBeenCalled()
    addEventListenerSpy.mockRestore()
  })

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [
          {
            key: 'a',
            handler: mockHandler,
          },
        ],
      })
    )

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })

  it('should handle multiple shortcuts', () => {
    const handler1 = jest.fn()
    const handler2 = jest.fn()

    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [
          { key: 'a', handler: handler1 },
          { key: 'b', handler: handler2 },
        ],
      })
    )

    const event1 = new KeyboardEvent('keydown', { key: 'a' })
    window.dispatchEvent(event1)

    const event2 = new KeyboardEvent('keydown', { key: 'b' })
    window.dispatchEvent(event2)

    expect(handler1).toHaveBeenCalledWith(event1)
    expect(handler2).toHaveBeenCalledWith(event2)
  })

  it('should prevent default when shortcut matches', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [
          {
            key: 'a',
            handler: mockHandler,
          },
        ],
      })
    )

    const event = new KeyboardEvent('keydown', { key: 'a', cancelable: true })
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })
})
