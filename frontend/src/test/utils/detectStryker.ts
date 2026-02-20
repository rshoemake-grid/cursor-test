/**
 * Utility to detect if code is running under Stryker mutation testing instrumentation
 * 
 * Stryker adds overhead that can cause timing issues in tests, so we need to
 * adjust our test strategies when running under Stryker.
 * 
 * @module test/utils/detectStryker
 */

/**
 * Detects if code is currently running under Stryker mutation testing
 * 
 * Checks multiple indicators:
 * - Environment variable STRYKER_MUTATOR
 * - Stryker-specific global variables
 * - Process arguments
 * 
 * @returns true if running under Stryker, false otherwise
 * 
 * @example
 * ```typescript
 * import { isRunningUnderStryker } from '../test/utils/detectStryker'
 * 
 * if (isRunningUnderStryker()) {
 *   // Use Stryker-optimized test strategy
 *   jest.useRealTimers()
 * } else {
 *   // Use normal test strategy
 *   jest.useFakeTimers()
 * }
 * ```
 */
export function isRunningUnderStryker(): boolean {
  // Check environment variable (most reliable)
  if (process.env.STRYKER_MUTATOR === 'true' || process.env.STRYKER_MUTATOR === '1') {
    return true
  }

  // Check for Stryker-specific global variables
  if (typeof global !== 'undefined') {
    // Stryker may set global variables
    if ((global as any).__STRYKER__ || (global as any).stryker) {
      return true
    }
  }

  // Check process arguments for Stryker-related flags
  if (process.argv) {
    const args = process.argv.join(' ')
    if (args.includes('stryker') || args.includes('STRYKER')) {
      return true
    }
  }

  // Check if we're in a Stryker sandbox directory
  if (typeof __dirname !== 'undefined') {
    if (__dirname.includes('.stryker-tmp') || __dirname.includes('sandbox-')) {
      return true
    }
  }

  // Check if we're in a Stryker sandbox directory (process.cwd)
  try {
    const cwd = process.cwd()
    if (cwd.includes('.stryker-tmp') || cwd.includes('sandbox-')) {
      return true
    }
  } catch (e) {
    // Ignore errors accessing cwd
  }

  return false
}

/**
 * Gets the Stryker sandbox ID if running under Stryker
 * 
 * @returns Sandbox ID or null if not running under Stryker
 */
export function getStrykerSandboxId(): string | null {
  if (!isRunningUnderStryker()) {
    return null
  }

  try {
    const cwd = process.cwd()
    const match = cwd.match(/sandbox-([A-Za-z0-9]+)/)
    if (match && match[1]) {
      return match[1]
    }
  } catch (e) {
    // Ignore errors
  }

  return null
}
