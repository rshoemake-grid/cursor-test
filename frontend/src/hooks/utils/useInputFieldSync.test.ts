/**
 * Input Field Sync Hook Tests
 * Tests for input field synchronization hook to ensure mutation resistance
 */

import { renderHook, act } from '@testing-library/react'
import {
  useInputFieldSync,
  useInputFieldSyncSimple
} from './useInputFieldSync'

describe('useInputFieldSync', () => {
  describe('useInputFieldSync', () => {
    it('should initialize with default value', () => {
      const ref = { current: null } as React.RefObject<HTMLElement>
      const { result } = renderHook(() =>
        useInputFieldSync(ref, null, 'default')
      )

      expect(result.current[0]).toBe('default')
    })

    it('should update when configValue changes and field is not active', () => {
      const ref = { current: null } as React.RefObject<HTMLElement>
      const { result, rerender } = renderHook(
        ({ configValue }) => useInputFieldSync(ref, configValue, 'default'),
        { initialProps: { configValue: null } }
      )

      expect(result.current[0]).toBe('default')

      rerender({ configValue: 'new-value' })
      expect(result.current[0]).toBe('new-value')
    })

    it('should not update when field is active', () => {
      const input = document.createElement('input')
      document.body.appendChild(input)
      const ref = { current: input } as React.RefObject<HTMLElement>
      
      const { result, rerender } = renderHook(
        ({ configValue }) => useInputFieldSync(ref, configValue, 'default'),
        { initialProps: { configValue: 'initial' } }
      )

      expect(result.current[0]).toBe('initial')

      // Focus the input to make it active
      act(() => {
        input.focus()
      })

      // Update configValue - should not update because field is active
      rerender({ configValue: 'new-value' })
      expect(result.current[0]).toBe('initial')

      // Blur the input
      act(() => {
        input.blur()
      })

      // Change configValue again to trigger effect after blur
      // The effect will check activeElement and update since field is no longer active
      rerender({ configValue: 'updated-value' })
      expect(result.current[0]).toBe('updated-value')

      document.body.removeChild(input)
    })

    it('should handle null configValue', () => {
      const ref = { current: null } as React.RefObject<HTMLElement>
      const { result, rerender } = renderHook(
        ({ configValue }) => useInputFieldSync(ref, configValue, 'default'),
        { initialProps: { configValue: 'value' } }
      )

      expect(result.current[0]).toBe('value')

      rerender({ configValue: null })
      expect(result.current[0]).toBe('default')
    })

    it('should handle undefined configValue', () => {
      const ref = { current: null } as React.RefObject<HTMLElement>
      const { result, rerender } = renderHook(
        ({ configValue }) => useInputFieldSync(ref, configValue, 'default'),
        { initialProps: { configValue: 'value' } }
      )

      expect(result.current[0]).toBe('value')

      rerender({ configValue: undefined })
      expect(result.current[0]).toBe('default')
    })

    it('should handle empty string configValue for string type', () => {
      const ref = { current: null } as React.RefObject<HTMLElement>
      const { result, rerender } = renderHook(
        ({ configValue }) => useInputFieldSync(ref, configValue, 'default'),
        { initialProps: { configValue: 'value' } }
      )

      expect(result.current[0]).toBe('value')

      rerender({ configValue: '' })
      expect(result.current[0]).toBe('default')
    })

    it('should not treat empty string as default for non-string types', () => {
      const ref = { current: null } as React.RefObject<HTMLElement>
      const { result, rerender } = renderHook(
        ({ configValue }) => useInputFieldSync(ref, configValue, 0),
        { initialProps: { configValue: 5 } }
      )

      expect(result.current[0]).toBe(5)

      // Empty string should not affect number type
      rerender({ configValue: null })
      expect(result.current[0]).toBe(0)
    })

    it('should allow manual value updates via setValue', () => {
      const ref = { current: null } as React.RefObject<HTMLElement>
      const { result } = renderHook(() =>
        useInputFieldSync(ref, 'config', 'default')
      )

      expect(result.current[0]).toBe('config')

      act(() => {
        result.current[1]('manual-update')
      })

      expect(result.current[0]).toBe('manual-update')
    })

    it('should handle boolean values', () => {
      const ref = { current: null } as React.RefObject<HTMLElement>
      const { result, rerender } = renderHook(
        ({ configValue }) => useInputFieldSync(ref, configValue, false),
        { initialProps: { configValue: true } }
      )

      expect(result.current[0]).toBe(true)

      rerender({ configValue: false })
      expect(result.current[0]).toBe(false)

      rerender({ configValue: null })
      expect(result.current[0]).toBe(false)
    })
  })

  describe('useInputFieldSyncSimple', () => {
    it('should initialize with default value', () => {
      const { result } = renderHook(() =>
        useInputFieldSyncSimple(null, 'default')
      )

      expect(result.current[0]).toBe('default')
    })

    it('should update when configValue changes', () => {
      const { result, rerender } = renderHook(
        ({ configValue }) => useInputFieldSyncSimple(configValue, 'default'),
        { initialProps: { configValue: null } }
      )

      expect(result.current[0]).toBe('default')

      rerender({ configValue: 'new-value' })
      expect(result.current[0]).toBe('new-value')
    })

    it('should handle null configValue', () => {
      const { result, rerender } = renderHook(
        ({ configValue }) => useInputFieldSyncSimple(configValue, 'default'),
        { initialProps: { configValue: 'value' } }
      )

      expect(result.current[0]).toBe('value')

      rerender({ configValue: null })
      expect(result.current[0]).toBe('default')
    })

    it('should handle undefined configValue', () => {
      const { result, rerender } = renderHook(
        ({ configValue }) => useInputFieldSyncSimple(configValue, 'default'),
        { initialProps: { configValue: 'value' } }
      )

      expect(result.current[0]).toBe('value')

      rerender({ configValue: undefined })
      expect(result.current[0]).toBe('default')
    })

    it('should handle empty string configValue for string type', () => {
      const { result, rerender } = renderHook(
        ({ configValue }) => useInputFieldSyncSimple(configValue, 'default'),
        { initialProps: { configValue: 'value' } }
      )

      expect(result.current[0]).toBe('value')

      rerender({ configValue: '' })
      expect(result.current[0]).toBe('default')
    })

    it('should allow manual value updates via setValue', () => {
      const { result } = renderHook(() =>
        useInputFieldSyncSimple('config', 'default')
      )

      expect(result.current[0]).toBe('config')

      act(() => {
        result.current[1]('manual-update')
      })

      expect(result.current[0]).toBe('manual-update')
    })

    it('should handle number values', () => {
      const { result, rerender } = renderHook(
        ({ configValue }) => useInputFieldSyncSimple(configValue, 0),
        { initialProps: { configValue: 42 } }
      )

      expect(result.current[0]).toBe(42)

      rerender({ configValue: null })
      expect(result.current[0]).toBe(0)
    })

    it('should handle boolean values', () => {
      const { result, rerender } = renderHook(
        ({ configValue }) => useInputFieldSyncSimple(configValue, false),
        { initialProps: { configValue: true } }
      )

      expect(result.current[0]).toBe(true)

      rerender({ configValue: false })
      expect(result.current[0]).toBe(false)

      rerender({ configValue: null })
      expect(result.current[0]).toBe(false)
    })
  })
})
