/**
 * Model Expansion Hook Tests
 * Tests for model expansion state management hook
 */

import { renderHook, act } from '@testing-library/react'
import { useModelExpansion } from './useModelExpansion'

describe('useModelExpansion', () => {
  it('should initialize with empty expansion states', () => {
    const { result } = renderHook(() => useModelExpansion())

    expect(result.current.expandedModels).toEqual({})
    expect(result.current.expandedProviders).toEqual({})
  })

  it('should toggle provider expansion', () => {
    const { result } = renderHook(() => useModelExpansion())

    act(() => {
      result.current.toggleProviderModels('provider-1')
    })

    expect(result.current.expandedProviders['provider-1']).toBe(true)

    act(() => {
      result.current.toggleProviderModels('provider-1')
    })

    expect(result.current.expandedProviders['provider-1']).toBe(false)
  })

  it('should toggle model expansion', () => {
    const { result } = renderHook(() => useModelExpansion())

    act(() => {
      result.current.toggleModel('provider-1', 'model-1')
    })

    expect(result.current.isModelExpanded('provider-1', 'model-1')).toBe(true)

    act(() => {
      result.current.toggleModel('provider-1', 'model-1')
    })

    expect(result.current.isModelExpanded('provider-1', 'model-1')).toBe(false)
  })

  it('should handle multiple providers independently', () => {
    const { result } = renderHook(() => useModelExpansion())

    act(() => {
      result.current.toggleProviderModels('provider-1')
      result.current.toggleProviderModels('provider-2')
    })

    expect(result.current.expandedProviders['provider-1']).toBe(true)
    expect(result.current.expandedProviders['provider-2']).toBe(true)

    act(() => {
      result.current.toggleProviderModels('provider-1')
    })

    expect(result.current.expandedProviders['provider-1']).toBe(false)
    expect(result.current.expandedProviders['provider-2']).toBe(true)
  })

  it('should handle multiple models per provider', () => {
    const { result } = renderHook(() => useModelExpansion())

    act(() => {
      result.current.toggleModel('provider-1', 'model-1')
      result.current.toggleModel('provider-1', 'model-2')
    })

    expect(result.current.isModelExpanded('provider-1', 'model-1')).toBe(true)
    expect(result.current.isModelExpanded('provider-1', 'model-2')).toBe(true)

    act(() => {
      result.current.toggleModel('provider-1', 'model-1')
    })

    expect(result.current.isModelExpanded('provider-1', 'model-1')).toBe(false)
    expect(result.current.isModelExpanded('provider-1', 'model-2')).toBe(true)
  })

  it('should return false for non-existent provider', () => {
    const { result } = renderHook(() => useModelExpansion())

    expect(result.current.isModelExpanded('non-existent', 'model-1')).toBe(false)
  })

  it('should return false for non-existent model', () => {
    const { result } = renderHook(() => useModelExpansion())

    act(() => {
      result.current.toggleModel('provider-1', 'model-1')
    })

    expect(result.current.isModelExpanded('provider-1', 'non-existent')).toBe(false)
  })
})
