/**
 * Auto-Save Hook
 * Single Responsibility: Only handles auto-save logic with debouncing
 * DRY: Reusable auto-save functionality
 */

import { useEffect, useRef } from 'react'

/**
 * Auto-save hook with debouncing
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousValueRef = useRef<T>(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Skip on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousValueRef.current = value;
      return;
    }

    // For objects/arrays, do shallow comparison
    const hasChanged = typeof value === 'object' && value !== null
      ? JSON.stringify(value) !== JSON.stringify(previousValueRef.current)
      : value !== previousValueRef.current;

    if (!hasChanged) {
      return;
    }

    previousValueRef.current = value;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      try {
        saveFn(value);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, saveFn, delay, enabled]);
}
