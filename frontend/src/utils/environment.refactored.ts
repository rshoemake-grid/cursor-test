/**
 * Environment Utilities (REFACTORED VERSION)
 * 
 * Provides utilities for detecting the runtime environment (browser vs server).
 * These utilities follow SOLID principles and DRY by eliminating repeated
 * environment checks across the codebase.
 * 
 * Refactored improvements:
 * - Extracted shared helper function for window type checking (DRY)
 * - Single source of truth for typeof window check
 * - Improved testability with extractable helper
 * - Better maintainability
 * 
 * Benefits:
 * - DRY: Single source of truth for window type checking
 * - Readability: Clear intent with descriptive function names
 * - Mutation-resistant: Explicit checks kill mutation test survivors
 * - SSR-safe: Properly handles server-side rendering scenarios
 */

/**
 * Gets the type of the window object
 * 
 * This is a shared helper function that provides a single source of truth
 * for checking the window object type. Both isBrowserEnvironment and
 * isServerEnvironment use this function to eliminate duplication.
 * 
 * @returns The typeof window ('object' in browser, 'undefined' on server)
 * 
 * @internal
 * 
 * @example
 * ```typescript
 * getWindowType() // 'object' in browser, 'undefined' on server
 * ```
 */
function getWindowType(): string {
  return typeof window
}

/**
 * Checks if code is running in a browser environment
 * 
 * Uses the shared getWindowType helper to check if window is defined.
 * This eliminates duplication and provides a single source of truth.
 * 
 * @returns True if running in browser (window is defined), false otherwise
 * 
 * @example
 * ```typescript
 * if (isBrowserEnvironment()) {
 *   // Safe to use window, document, etc.
 *   const storage = window.localStorage
 * }
 * ```
 */
export function isBrowserEnvironment(): boolean {
  const windowType = getWindowType()
  return windowType !== 'undefined'
}

/**
 * Checks if code is running in a server environment
 * 
 * Uses the shared getWindowType helper to check if window is undefined.
 * This eliminates duplication and provides a single source of truth.
 * 
 * @returns True if running on server (window is undefined), false otherwise
 * 
 * @example
 * ```typescript
 * if (isServerEnvironment()) {
 *   // Server-side code
 *   return null
 * }
 * ```
 */
export function isServerEnvironment(): boolean {
  const windowType = getWindowType()
  return windowType === 'undefined'
}
