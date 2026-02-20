/**
 * Utility for waiting for React state updates to complete
 * 
 * Provides helpers for waiting for specific state values to be set,
 * which is useful when testing async operations that update state.
 * 
 * @module test/utils/waitForStateUpdate
 */

import { waitFor } from '@testing-library/react'
import { isRunningUnderStryker } from './detectStryker'

/**
 * Wait for a state value to match expected value
 * 
 * Useful for waiting for async operations to update state before assertions.
 * Under Stryker, uses longer timeout due to instrumentation overhead.
 * 
 * @param getValue - Function that returns current state value
 * @param expectedValue - Expected value to wait for
 * @param timeout - Maximum time to wait in milliseconds (default: auto-adjusted for Stryker)
 * @returns Promise that resolves when state matches expected value
 * 
 * @example
 * ```typescript
 * import { waitForStateValue } from '../test/utils/waitForStateUpdate'
 * 
 * await waitForStateValue(
 *   () => result.current.loading,
 *   false,
 *   60000
 * )
 * ```
 */
export async function waitForStateValue<T>(
  getValue: () => T,
  expectedValue: T,
  timeout?: number
): Promise<void> {
  const defaultTimeout = isRunningUnderStryker() ? 60000 : 30000
  const actualTimeout = timeout ?? defaultTimeout
  
  await waitFor(() => {
    const currentValue = getValue()
    expect(currentValue).toBe(expectedValue)
  }, { timeout: actualTimeout })
}

/**
 * Wait for array length to be greater than a threshold
 * 
 * Useful for waiting for data arrays to populate.
 * 
 * @param getArray - Function that returns the array
 * @param minLength - Minimum length to wait for (default: 1)
 * @param timeout - Maximum time to wait in milliseconds
 * @returns Promise that resolves when array has sufficient length
 * 
 * @example
 * ```typescript
 * import { waitForArrayLength } from '../test/utils/waitForStateUpdate'
 * 
 * await waitForArrayLength(
 *   () => result.current.workflowsOfWorkflows,
 *   1,
 *   60000
 * )
 * ```
 */
export async function waitForArrayLength<T>(
  getArray: () => T[] | null | undefined,
  minLength: number = 1,
  timeout?: number
): Promise<void> {
  const defaultTimeout = isRunningUnderStryker() ? 60000 : 30000
  const actualTimeout = timeout ?? defaultTimeout
  
  await waitFor(() => {
    const array = getArray()
    expect(array).toBeDefined()
    expect(Array.isArray(array)).toBe(true)
    expect((array as T[]).length).toBeGreaterThanOrEqual(minLength)
  }, { timeout: actualTimeout })
}

/**
 * Wait for a condition function to return true
 * 
 * Generic utility for waiting for any condition to be met.
 * 
 * @param condition - Function that returns boolean indicating if condition is met
 * @param timeout - Maximum time to wait in milliseconds
 * @returns Promise that resolves when condition is true
 * 
 * @example
 * ```typescript
 * import { waitForCondition } from '../test/utils/waitForStateUpdate'
 * 
 * await waitForCondition(
 *   () => result.current.loading === false && result.current.data !== null,
 *   60000
 * )
 * ```
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout?: number
): Promise<void> {
  const defaultTimeout = isRunningUnderStryker() ? 60000 : 30000
  const actualTimeout = timeout ?? defaultTimeout
  
  await waitFor(() => {
    expect(condition()).toBe(true)
  }, { timeout: actualTimeout })
}
