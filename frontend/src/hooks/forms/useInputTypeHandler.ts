/**
 * Input Type Handler Hook
 * Extracted from FormField to eliminate DRY violations
 * Single Responsibility: Only handles input type-specific onChange logic
 */

import { useCallback } from 'react'

export type FormFieldType = 'text' | 'textarea' | 'select' | 'number' | 'checkbox' | 'email' | 'password'

/**
 * Hook for handling input type-specific onChange events
 * DRY: Centralizes type-specific value conversion logic
 */
export function useInputTypeHandler<T>(
  type: FormFieldType,
  onChange: (value: T) => void
) {
  return useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    switch (type) {
      case 'checkbox':
        onChange((e.target as HTMLInputElement).checked as T)
        break
      case 'number':
        onChange(Number(e.target.value) as T)
        break
      default:
        onChange(e.target.value as T)
        break
    }
  }, [type, onChange])
}
