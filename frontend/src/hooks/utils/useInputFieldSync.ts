/**
 * Input Field Sync Hook
 * Generic hook for syncing input field values with node data
 * Prevents overwriting user input while typing
 * DRY: Reusable pattern for all input field synchronization
 */

import { useState, useEffect } from 'react'
// useRef intentionally not imported - not needed for this implementation

/**
 * Sync input field value with config value
 * Prevents overwriting user input while typing
 * Mutation-resistant: explicit null/undefined checks
 * 
 * @template T - Type of value being synced
 * @param ref - Ref to the input element
 * @param configValue - Value from node config
 * @param defaultValue - Default value if configValue is null/undefined/empty
 * @returns Tuple of [currentValue, setValue] for controlled input
 */
export function useInputFieldSync<T>(
  ref: React.RefObject<HTMLElement>,
  configValue: T | null | undefined,
  defaultValue: T
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue)

  useEffect(() => {
    // Only update if user is not currently typing in this field
    // Explicit check to prevent mutation survivors
    if (document.activeElement !== ref.current) {
      // Explicit null/undefined checks
      // For string types, also check empty string
      if (configValue !== null && configValue !== undefined) {
        // Type-safe empty check for strings
        if (typeof configValue === 'string' && configValue === '') {
          setValue(defaultValue)
        } else {
          setValue(configValue)
        }
      } else {
        setValue(defaultValue)
      }
    }
  }, [configValue, defaultValue, ref])

  return [value, setValue]
}

/**
 * Sync input field value without active element check
 * Use when field doesn't need active element tracking
 */
export function useInputFieldSyncSimple<T>(
  configValue: T | null | undefined,
  defaultValue: T
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue)

  useEffect(() => {
    // Explicit null/undefined checks
    // For string types, also check empty string
    if (configValue !== null && configValue !== undefined) {
      // Type-safe empty check for strings
      if (typeof configValue === 'string' && configValue === '') {
        setValue(defaultValue)
      } else {
        setValue(configValue)
      }
    } else {
      setValue(defaultValue)
    }
  }, [configValue, defaultValue])

  return [value, setValue]
}
