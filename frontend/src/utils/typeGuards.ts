/**
 * Type Guard Utilities
 * 
 * Provides type-safe utilities for checking null/undefined values.
 * These utilities follow SOLID principles and DRY by eliminating repeated
 * null/undefined checks across the codebase.
 * 
 * Benefits:
 * - Type narrowing: TypeScript understands the type after these checks
 * - DRY: Eliminates repeated `value === null || value === undefined` patterns
 * - Readability: Clear intent with descriptive function names
 * - Mutation-resistant: Explicit checks kill mutation test survivors
 */

/**
 * Type guard to check if a value is null or undefined
 * 
 * @param value - The value to check
 * @returns True if value is null or undefined, false otherwise
 * 
 * @example
 * ```typescript
 * const value: string | null = getValue()
 * if (isNullOrUndefined(value)) {
 *   return defaultValue
 * }
 * // TypeScript now knows value is string
 * return value.toUpperCase()
 * ```
 */
export function isNullOrUndefined(value: any): value is null | undefined {
  return value === null || value === undefined
}

/**
 * Type guard to check if a value is defined (not null or undefined)
 * 
 * @param value - The value to check
 * @returns True if value is not null or undefined, false otherwise
 * 
 * @example
 * ```typescript
 * const value: string | null | undefined = getValue()
 * if (isDefined(value)) {
 *   // TypeScript now knows value is string
 *   return value.toUpperCase()
 * }
 * return defaultValue
 * ```
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}
