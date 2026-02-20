/**
 * Helper utility for waiting for workflowsOfWorkflows array to populate in tests
 * 
 * This utility encapsulates the pattern needed to properly wait for async state
 * synchronization when testing workflowsOfWorkflows data fetching. It handles:
 * - Explicit fetch call
 * - HTTP call completion waits
 * - Timer advancement for fake/real timers
 * - Loading state waits
 * - State synchronization waits
 * - Data verification
 * 
 * @module test/utils/waitForWorkflowsOfWorkflows
 */

import { act } from '@testing-library/react'
import { waitForWithTimeoutFakeTimers } from './waitForWithTimeout'
import { isRunningUnderStryker } from './detectStryker'

/**
 * Type for expected length parameter
 */
export type ExpectedLength = number | 'greaterThanZero' | 'zero'

/**
 * Type for render hook result
 */
export type RenderResult<T> = {
  current: T
}

/**
 * Waits for workflowsOfWorkflows array to populate with proper async handling
 * 
 * This function encapsulates the complete pattern needed to wait for workflowsOfWorkflows
 * to populate, including explicit fetch calls, HTTP waits, timer advancement, loading waits,
 * state sync waits, and data verification.
 * 
 * @param result - Render result from renderHook containing useMarketplaceData hook
 * @param expectedLengthOrMockHttpClient - Expected array length OR mock HTTP client (flexible parameter order)
 * @param expectedLengthOrTimeout - Expected array length OR timeout (if mockHttpClient was second param)
 * @param timeoutOrMockHttpClient - Optional timeout OR mock HTTP client (depending on parameter order)
 * 
 * @example
 * ```typescript
 * import { waitForWorkflowsOfWorkflowsToPopulate } from '../../test/utils/waitForWorkflowsOfWorkflows'
 * 
 * const { result } = renderHook(() => useMarketplaceData({ ... }))
 * 
 * // Wait for array to have length > 0 (no HTTP verification)
 * await waitForWorkflowsOfWorkflowsToPopulate(result, 'greaterThanZero')
 * 
 * // Wait with HTTP verification (test usage pattern)
 * await waitForWorkflowsOfWorkflowsToPopulate(result, mockHttpClient, 'greaterThanZero')
 * 
 * // Wait for specific length
 * await waitForWorkflowsOfWorkflowsToPopulate(result, 3)
 * 
 * // Wait for empty array
 * await waitForWorkflowsOfWorkflowsToPopulate(result, 'zero')
 * ```
 */
export async function waitForWorkflowsOfWorkflowsToPopulate<T extends { 
  fetchWorkflowsOfWorkflows: () => Promise<void>
  loading: boolean
  workflowsOfWorkflows: any[]
}>(
  result: RenderResult<T>,
  expectedLengthOrMockHttpClient?: ExpectedLength | { get: jest.Mock; post: jest.Mock },
  expectedLengthOrTimeout?: ExpectedLength | number,
  timeoutOrMockHttpClient?: number | { get: jest.Mock; post: jest.Mock }
): Promise<void> {
  // Determine parameters based on types
  let expectedLength: ExpectedLength = 'greaterThanZero'
  let timeout: number | undefined
  let mockHttpClient: { get: jest.Mock; post: jest.Mock } | undefined
  
  // Parse parameters - handle flexible order
  if (typeof expectedLengthOrMockHttpClient === 'object' && expectedLengthOrMockHttpClient !== null && 'get' in expectedLengthOrMockHttpClient) {
    // Second param is mockHttpClient
    mockHttpClient = expectedLengthOrMockHttpClient
    if (typeof expectedLengthOrTimeout === 'string' || typeof expectedLengthOrTimeout === 'number') {
      expectedLength = expectedLengthOrTimeout as ExpectedLength
    }
    if (typeof timeoutOrMockHttpClient === 'number') {
      timeout = timeoutOrMockHttpClient
    }
  } else {
    // Second param is expectedLength
    if (typeof expectedLengthOrMockHttpClient === 'string' || typeof expectedLengthOrMockHttpClient === 'number') {
      expectedLength = expectedLengthOrMockHttpClient as ExpectedLength
    }
    if (typeof expectedLengthOrTimeout === 'number') {
      timeout = expectedLengthOrTimeout
    } else if (typeof expectedLengthOrTimeout === 'object' && expectedLengthOrTimeout !== null && 'get' in expectedLengthOrTimeout) {
      mockHttpClient = expectedLengthOrTimeout
    }
    if (typeof timeoutOrMockHttpClient === 'object' && timeoutOrMockHttpClient !== null && 'get' in timeoutOrMockHttpClient) {
      mockHttpClient = timeoutOrMockHttpClient
    } else if (typeof timeoutOrMockHttpClient === 'number') {
      timeout = timeoutOrMockHttpClient
    }
  }
  // Determine timeout - use Stryker-aware default if not provided
  const actualTimeout = timeout ?? (isRunningUnderStryker() ? 120000 : 90000)
  
  // Step 1: Explicit fetch call
  await act(async () => {
    await result.current.fetchWorkflowsOfWorkflows()
  })
  
  // Step 2: Wait for HTTP calls (if mockHttpClient provided)
  if (mockHttpClient) {
    await waitForWithTimeoutFakeTimers(() => {
      expect(mockHttpClient.get).toHaveBeenCalled()
      expect(mockHttpClient.post).toHaveBeenCalled()
    }, actualTimeout)
  }
  
  // Step 3: Advance timers if using fake timers to allow async processing to complete
  if (!isRunningUnderStryker()) {
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000)
        jest.runOnlyPendingTimers()
      })
      await Promise.resolve()
    }
  } else {
    // Under Stryker with real timers, give async operations time to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
    })
  }
  
  // Step 4: Wait for loading to complete (ensures refetch finished)
  await waitForWithTimeoutFakeTimers(() => {
    expect(result.current.loading).toBe(false)
  }, actualTimeout)
  
  // Step 5: Advance timers if using fake timers to allow state sync through useSyncState
  // useSyncState uses useEffect which needs time to run after data changes
  if (!isRunningUnderStryker()) {
    for (let i = 0; i < 15; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000)
        jest.runOnlyPendingTimers()
      })
      await Promise.resolve()
    }
  } else {
    // Under Stryker with real timers, give state sync time to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
    })
  }
  
  // Step 6: Verify data populated according to expectedLength
  await waitForWithTimeoutFakeTimers(() => {
    expect(result.current.workflowsOfWorkflows).toBeDefined()
    expect(Array.isArray(result.current.workflowsOfWorkflows)).toBe(true)
    
    if (expectedLength === 'greaterThanZero') {
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    } else if (expectedLength === 'zero') {
      expect(result.current.workflowsOfWorkflows.length).toBe(0)
    } else {
      expect(result.current.workflowsOfWorkflows.length).toBe(expectedLength)
    }
  }, actualTimeout)
}
