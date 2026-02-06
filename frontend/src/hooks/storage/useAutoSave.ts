/**
 * Auto-Save Hook
 * Single Responsibility: Only handles auto-save logic with debouncing
 * DRY: Reusable auto-save functionality
 * Refactored to follow SOLID principles: Uses extracted utilities for SRP compliance
 * 
 * SRP: Delegates to:
 * - useFirstRender: First render detection
 * - useDebounce: Debouncing logic
 * - useValueComparison: Value comparison logic
 */

import { useEffect, useRef, useMemo } from 'react'
import { hasValueChanged } from '../utils/useValueComparison'
import { useFirstRender } from '../utils/useFirstRender'
import { useDebounce } from '../utils/useDebounce'

/**
 * Auto-save hook with debouncing
 * Refactored to follow SOLID principles:
 * - SRP: Uses extracted utilities (useFirstRender, useDebounce, useValueComparison)
 * - DRY: Eliminates duplicate patterns across hooks
 * 
 * @template T - Type of value being saved
 * @param value - Value to save
 * @param saveFn - Function to save the value
 * @param delay - Debounce delay in milliseconds (default: 500)
 * @param enabled - Whether auto-save is enabled (default: true)
 */
export function useAutoSave<T>(
  value: T,
  saveFn: (value: T) => Promise<void> | void,
  delay: number = 500,
  enabled: boolean = true
): void {
  const previousValueRef = useRef<T>(value)
  const { isFirstRender, markAsRendered } = useFirstRender()

  // Memoize save function wrapper to prevent unnecessary re-renders
  const debouncedSaveFn = useMemo(() => {
    return (val: T) => {
      try {
        saveFn(val)
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }
  }, [saveFn])

  // Track value changes and prepare for debouncing
  const valueToDebounceRef = useRef<T | null>(null)
  const shouldSaveRef = useRef(false)

  useEffect(() => {
    // Explicit check to prevent mutation survivors
    if (enabled !== true) {
      valueToDebounceRef.current = null
      shouldSaveRef.current = false
      return
    }

    // Handle first render
    if (isFirstRender) {
      previousValueRef.current = value
      markAsRendered()
      valueToDebounceRef.current = null
      shouldSaveRef.current = false
      return
    }

    // Use extracted comparison utility - mutation-resistant and DRY
    const hasChanged = hasValueChanged(value, previousValueRef.current)

    if (hasChanged) {
      previousValueRef.current = value
      valueToDebounceRef.current = value
      shouldSaveRef.current = true
    } else {
      valueToDebounceRef.current = null
      shouldSaveRef.current = false
    }
  }, [value, enabled, isFirstRender, markAsRendered])

  // Debounce the save operation only when value actually changed
  // Use the value itself as trigger, but only save if shouldSaveRef indicates a change
  useDebounce(value, delay, (val) => {
    // Only call if we should save (value changed) and it's enabled and not first render
    if (shouldSaveRef.current && enabled && !isFirstRender && valueToDebounceRef.current !== null) {
      debouncedSaveFn(valueToDebounceRef.current) // Use ref value to ensure we have latest
      shouldSaveRef.current = false
      valueToDebounceRef.current = null
    }
  })
}
