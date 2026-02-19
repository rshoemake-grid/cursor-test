/**
 * Environment Utilities
 * 
 * Provides utilities for detecting the runtime environment (browser vs server).
 * These utilities follow SOLID principles and DRY by eliminating repeated
 * environment checks across the codebase.
 * 
 * Benefits:
 * - DRY: Eliminates repeated `typeof window === 'undefined'` checks
 * - Readability: Clear intent with descriptive function names
 * - Mutation-resistant: Explicit checks kill mutation test survivors
 * - SSR-safe: Properly handles server-side rendering scenarios
 */

/**
 * Gets the type of the window object
 * 
 * This helper function eliminates DRY violation by centralizing the typeof window check.
 * Both isBrowserEnvironment and isServerEnvironment use this to avoid duplication.
 * 
 * @returns The typeof window result ('undefined' | 'object')
 * 
 * @private
 */
function getWindowType(): 'undefined' | 'object' {
  const windowType = typeof window
  // TypeScript knows typeof window can only be 'undefined' or 'object' in practice
  return windowType === 'undefined' ? 'undefined' : 'object'
}

/**
 * Checks if code is running in a browser environment
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
  return getWindowType() !== 'undefined'
}

/**
 * Checks if code is running in a server environment
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
  return getWindowType() === 'undefined'
}
