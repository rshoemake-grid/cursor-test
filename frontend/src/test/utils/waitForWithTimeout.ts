/**
 * Shared test utility for waitFor with timeout support
 * 
 * Provides helpers for handling async operations in tests, with support for
 * both normal timers and fake timers (jest.useFakeTimers).
 * 
 * @module test/utils/waitForWithTimeout
 */

import { waitFor, act } from '@testing-library/react'
import { isRunningUnderStryker } from './detectStryker'

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
  timeoutOrOptions: number | { timeout?: number } = 2000
): Promise<void> => {
  // Extract timeout value - handle both number and object formats
  const timeout = typeof timeoutOrOptions === 'number' 
    ? timeoutOrOptions 
    : (timeoutOrOptions?.timeout ?? 2000)
  
  // Check if running under Stryker - if so, use optimized strategy
  const isStryker = isRunningUnderStryker()
  
  // Check if fake timers are currently active by checking if jest.getRealSystemTime exists
  // Note: This is a heuristic - if jest.getRealSystemTime exists, we're using fake timers
  const wasUsingFakeTimers = typeof jest.getRealSystemTime === 'function'
  
  if (wasUsingFakeTimers) {
    // Under Stryker, use more aggressive timer advancement
    const maxTimerIterations = isStryker ? 30 : 5
    const timerAdvanceDelay = isStryker ? 50 : 10
    
    // Wrap timer operations in act() to ensure React updates are flushed
    await act(async () => {
      // Advance timers first to process any pending operations
      jest.advanceTimersByTime(0)
      jest.runOnlyPendingTimers()
    })
    
    // Use polling approach with fake timers (avoiding timer switching which waitFor doesn't like)
    // Run all pending timers first to ensure async operations complete
    // Under Stryker, be more aggressive with timer exhaustion
    let timerIterations = 0
    while (jest.getTimerCount() > 0 && timerIterations < maxTimerIterations) {
      await act(async () => {
        jest.runAllTimers()
        
        // Under Stryker, add exponential backoff for timer advancement
        if (isStryker && timerIterations < maxTimerIterations - 1) {
          const advanceAmount = Math.min(10 * Math.pow(2, timerIterations), 500)
          jest.advanceTimersByTime(advanceAmount)
        }
      })
      
      // Allow promises to resolve between timer advances
      await Promise.resolve()
      timerIterations++
    }
    
    // Switch to real timers for waitFor - this is necessary for waitFor to work
    // The warning about switching timers is acceptable - waitFor needs real timers
    // We've already exhausted fake timers above, so switching is safe
    jest.useRealTimers()
    try {
      // Under Stryker, use longer delay to ensure React has processed updates
      // Stryker instrumentation adds overhead, so state updates take longer
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, timerAdvanceDelay))
      })
      // Use waitFor with real timers - wrap in act() to ensure React updates are flushed
      return await act(async () => {
        return await waitFor(callback, { timeout })
      })
    } finally {
      // Restore fake timers after waitFor completes
      jest.useFakeTimers()
    }
  } else {
    // Not using fake timers, just use waitFor normally
    // Under Stryker, still use longer timeout if needed
    const adjustedTimeout = isStryker ? Math.max(timeout, 5000) : timeout
    // Wrap in act() under Stryker to ensure React updates are flushed
    if (isStryker) {
      return await act(async () => {
        return await waitFor(callback, { timeout: adjustedTimeout })
      })
    }
    return await waitFor(callback, { timeout: adjustedTimeout })
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
