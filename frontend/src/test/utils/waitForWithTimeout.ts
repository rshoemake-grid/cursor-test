/**
 * Shared test utility for waitFor with timeout support
 * 
 * Provides helpers for handling async operations in tests, with support for
 * both normal timers and fake timers (jest.useFakeTimers).
 * 
 * @module test/utils/waitForWithTimeout
 */

import { waitFor } from '@testing-library/react'

/**
 * Simple waitFor wrapper with timeout (for tests without fake timers)
 * 
 * Use this version when your test does NOT use jest.useFakeTimers()
 * 
 * @param callback - Function to wait for (should throw if condition not met)
 * @param timeout - Maximum time to wait in milliseconds (default: 2000)
 * @returns Promise that resolves when callback succeeds
 * 
 * @example
 * ```typescript
 * import { waitForWithTimeout } from '../test/utils/waitForWithTimeout'
 * 
 * await waitForWithTimeout(() => {
 *   expect(screen.getByText('Hello')).toBeInTheDocument()
 * })
 * ```
 */
export const waitForWithTimeout = (
  callback: () => void | Promise<void>,
  timeout = 2000
): Promise<void> => {
  return waitFor(callback, { timeout })
}

/**
 * waitFor wrapper that handles fake timers correctly
 * 
 * Use this version when your test DOES use jest.useFakeTimers()
 * 
 * This version:
 * - Detects if fake timers are active
 * - Temporarily switches to real timers for waitFor operations
 * - Restores fake timers after completion
 * - Advances timers before switching to ensure pending operations complete
 * 
 * @param callback - Function to wait for (should throw if condition not met)
 * @param timeout - Maximum time to wait in milliseconds (default: 2000)
 * @returns Promise that resolves when callback succeeds
 * 
 * @example
 * ```typescript
 * import { waitForWithTimeoutFakeTimers } from '../test/utils/waitForWithTimeout'
 * 
 * beforeEach(() => {
 *   jest.useFakeTimers()
 * })
 * 
 * it('should handle async operations', async () => {
 *   await waitForWithTimeoutFakeTimers(() => {
 *     expect(screen.getByText('Hello')).toBeInTheDocument()
 *   })
 * })
 * ```
 */
export const waitForWithTimeoutFakeTimers = async (
  callback: () => void | Promise<void>,
  timeout = 2000
): Promise<void> => {
  // Check if fake timers are currently active by checking if jest.getRealSystemTime exists
  // Note: This is a heuristic - if jest.getRealSystemTime exists, we're using fake timers
  const wasUsingFakeTimers = typeof jest.getRealSystemTime === 'function'
  
  if (wasUsingFakeTimers) {
    // Advance timers first to process any pending operations
    jest.advanceTimersByTime(0)
    jest.runOnlyPendingTimers()
    
    // Temporarily use real timers for waitFor, then restore fake timers
    jest.useRealTimers()
    try {
      // Use a small delay to ensure React has processed updates
      await new Promise(resolve => setTimeout(resolve, 10))
      return await waitFor(callback, { timeout })
    } finally {
      jest.useFakeTimers()
    }
  } else {
    // Not using fake timers, just use waitFor normally
    return await waitFor(callback, { timeout })
  }
}

/**
 * Auto-detecting waitFor wrapper
 * 
 * Automatically detects if fake timers are in use and applies the appropriate strategy.
 * This is a convenience function that combines both approaches.
 * 
 * @param callback - Function to wait for (should throw if condition not met)
 * @param timeout - Maximum time to wait in milliseconds (default: 2000)
 * @returns Promise that resolves when callback succeeds
 * 
 * @example
 * ```typescript
 * import { waitForWithTimeoutAuto } from '../test/utils/waitForWithTimeout'
 * 
 * // Works with or without fake timers
 * await waitForWithTimeoutAuto(() => {
 *   expect(screen.getByText('Hello')).toBeInTheDocument()
 * })
 * ```
 */
export const waitForWithTimeoutAuto = waitForWithTimeoutFakeTimers
