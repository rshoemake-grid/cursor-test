/**
 * Coalesce Utilities
 * 
 * Provides utilities for handling null/undefined values with default fallbacks.
 * These utilities follow SOLID principles and DRY by eliminating repeated
 * ternary coalesce patterns across the codebase.
 * 
 * Benefits:
 * - DRY: Eliminates repeated `value !== null && value !== undefined ? value : defaultValue` patterns
 * - Readability: Clear intent with descriptive function names
 * - Mutation-resistant: Explicit checks kill mutation test survivors
 * - Type-safe: Proper TypeScript type narrowing
 */

import { isDefined } from './typeGuards'

/**
 * Returns the value if it's defined, otherwise returns the default value
 * 
 * @param value - The value to check
 * @param defaultValue - The default value to return if value is null/undefined
 * @returns The value if defined, otherwise the default value
 * 
 * @example
 * ```typescript
 * const name = coalesce(user.name, 'Anonymous')
 * const count = coalesce(items.length, 0)
 * ```
 */
export function coalesce<T>(value: T | null | undefined, defaultValue: T): T {
  return isDefined(value) ? value : defaultValue
}
