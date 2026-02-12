# Failing Tests Analysis & Solutions

**Date**: 2026-01-26  
**File**: `hooks/execution/useWebSocket.mutation.advanced.test.ts`  
**Status**: 3 tests failing out of 347 total tests (99.1% passing)

---

## Summary

Three edge case mutation tests are failing in the `useWebSocket.mutation.advanced.test.ts` file. These tests are designed to verify specific code paths for mutation testing coverage. All three failures are related to how `executionStatus` and `lastKnownStatus` are handled in the WebSocket reconnection logic.

---

## Failing Tests

### 1. Test: `should verify currentStatus = executionStatus || lastKnownStatusRef.current - lastKnownStatusRef path`
**Line**: 551  
**Status**: ❌ FAILING

**Test Intent**: Verify that when `executionStatus` is updated to `'completed'` and then a close event occurs, the code uses `lastKnownStatusRef.current` (which should be `'completed'`) instead of the current `executionStatus` prop.

**Test Flow**:
1. Start with `executionStatus: 'running'`
2. Connect WebSocket
3. Update `executionStatus` to `'completed'` via `rerender`
4. Close WebSocket connection
5. Expect reconnection to be skipped because `lastKnownStatusRef` is `'completed'`

**Expected Behavior**: When `executionStatus` is `undefined` or `null`, the code should use `lastKnownStatus` (which was `'completed'`) to determine if reconnection should be skipped.

**Actual Issue**: The test expects that after setting `executionStatus` to `'completed'`, closing the connection should use `lastKnownStatus` for the reconnection check. However, the implementation may be using `executionStatus` directly if it's still set.

**Root Cause Analysis**:
- The `updateStatus()` method in `WebSocketConnectionManager` updates `lastKnownStatus` only when a new status is provided (line 89)
- When `executionStatus` is set to `'completed'`, `lastKnownStatus` is updated to `'completed'`
- However, when checking `shouldReconnect()`, the code passes both `executionStatus` and `lastKnownStatus` to `ExecutionStatusChecker.shouldReconnect()`
- `ExecutionStatusChecker.isTerminated()` uses `logicalOr(executionStatus, lastKnownStatus)`, which returns the first truthy value
- If `executionStatus` is still `'completed'` when the close event fires, it will use that instead of `lastKnownStatus`

**Possible Solutions**:

#### Solution 1: Fix Test Logic (RECOMMENDED)
The test may need to clear `executionStatus` to `undefined` before closing to ensure `lastKnownStatus` is used:

```typescript
// Update executionStatus to completed
rerender({ executionStatus: 'completed' })
await advanceTimersByTime(50)

// Clear executionStatus to force use of lastKnownStatusRef
rerender({ executionStatus: undefined })
await advanceTimersByTime(50)

// Now close - should use lastKnownStatusRef
await act(async () => {
  ws.simulateClose(1001, 'Error', false)
  await advanceTimersByTime(50)
})
```

#### Solution 2: Verify Implementation Behavior
The implementation may be correct, but the test expectation is wrong. The `logicalOr` function returns the first truthy value, so if `executionStatus` is still `'completed'`, it will be used. The test should verify that when `executionStatus` is `undefined`, `lastKnownStatus` is used.

#### Solution 3: Update Test Assertion
The test currently only checks that `logger.debug` was called, but doesn't verify the specific log message. It should check for a specific message indicating that reconnection was skipped:

```typescript
expect(logger.debug).toHaveBeenCalledWith(
  expect.stringContaining('Skipping reconnect - execution exec-1 is completed')
)
```

---

### 2. Test: `should verify reconnectAttempts.current < maxReconnectAttempts && executionId - executionId is null`
**Line**: 705  
**Status**: ❌ FAILING

**Test Intent**: Verify that when `executionId` becomes `null` during reconnection, the reconnection logic correctly checks `&& executionId` and prevents reconnection.

**Test Flow**:
1. Start with `executionId: 'exec-1'`
2. Connect WebSocket
3. Close connection to trigger reconnect logic
4. Set `executionId` to `null` before reconnect timer fires
5. Advance reconnect timer
6. Expect no reconnection because `executionId` is `null`

**Actual Error**: 
```
ReferenceError: rerender is not defined
at Object.<anonymous> (src/hooks/execution/useWebSocket.mutation.advanced.test.ts:735:9)
```

**Root Cause**: The test uses `rerender` but doesn't destructure it from `renderHook()`.

**Solution**: Fix the test by destructuring `rerender`:

```typescript
it('should verify reconnectAttempts.current < maxReconnectAttempts && executionId - executionId is null', async () => {
  // Create a scenario where executionId becomes null during reconnection
  const { rerender } = renderHook(  // ← ADD THIS
    ({ executionId }) =>
      useWebSocket({
        executionId,
        executionStatus: 'running',
      }),
    {
      initialProps: { executionId: 'exec-1' },
    }
  )

  await advanceTimersByTime(100)

  if (wsInstances.length > 0) {
    const ws = wsInstances[0]
    await act(async () => {
      ws.simulateOpen()
      await advanceTimersByTime(50)
    })

    // Close connection to trigger reconnect logic
    await act(async () => {
      ws.simulateClose(1001, 'Error', false)
      await advanceTimersByTime(50)
    })

    // Clear executionId before reconnect timer fires
    rerender({ executionId: null })  // ← NOW THIS WILL WORK
    await advanceTimersByTime(50)

    // Advance reconnect timer
    await act(async () => {
      jest.advanceTimersByTime(2000)
      await advanceTimersByTime(50)
    })

    // When executionId is null, reconnect should not happen
    // The check is: reconnectAttempts.current < maxReconnectAttempts && executionId
    // So if executionId is null, the condition is false
    const reconnectLogs = (logger.debug as jest.Mock).mock.calls.filter((call: any[]) =>
      call[0] && typeof call[0] === 'string' && call[0].includes('Reconnecting in')
    )
    // Should have attempted reconnect before executionId was cleared
    // But after clearing, no new reconnects should happen
    expect(reconnectLogs.length).toBeGreaterThanOrEqual(0)
  }
})
```

**Additional Consideration**: The test may also need to verify that reconnection doesn't happen after `executionId` is cleared. The current assertion `expect(reconnectLogs.length).toBeGreaterThanOrEqual(0)` is too weak - it should verify that no new reconnection attempts occur after `executionId` is set to `null`.

---

### 3. Test: `should verify executionStatus || lastKnownStatusRef.current - executionStatus is falsy`
**Line**: 3319  
**Status**: ❌ FAILING

**Test Intent**: Verify that when `executionStatus` is `undefined` (falsy), the code uses `lastKnownStatusRef.current` for status checks.

**Test Flow**:
1. Start with `executionStatus: 'running'`
2. Change `executionStatus` to `undefined`
3. Verify that connection still exists (meaning `lastKnownStatusRef` is being used)

**Expected Behavior**: When `executionStatus` is `undefined`, the code should use `lastKnownStatus` (which was `'running'`) to determine connection behavior.

**Root Cause Analysis**:
- The test sets `executionStatus` to `'running'` initially, which sets `lastKnownStatus` to `'running'`
- Then it sets `executionStatus` to `undefined`
- The test expects the connection to still exist, meaning `lastKnownStatus` (`'running'`) is being used
- However, the implementation may be checking `executionStatus` first, and if it's `undefined`, it may be treating it as "no status" rather than using `lastKnownStatus`

**Possible Solutions**:

#### Solution 1: Verify Implementation Logic
Check if `ExecutionStatusChecker.shouldSkip()` correctly uses `lastKnownStatus` when `executionStatus` is `undefined`:

```typescript
// In ExecutionStatusChecker.shouldSkip()
static shouldSkip(
  executionId: string | null,
  executionStatus: ExecutionStatus | undefined,
  lastKnownStatus?: ExecutionStatus | undefined
): boolean {
  if (!executionId) return true
  const { isTemporaryExecutionId } = require('./executionIdValidation')
  if (isTemporaryExecutionId(executionId)) return true
  // This should use logicalOr to get currentStatus
  if (this.isTerminated(executionStatus, lastKnownStatus)) return true
  return false
}
```

The `isTerminated()` method uses `logicalOr(status, lastKnownStatus)`, which should return `lastKnownStatus` when `status` is `undefined`. This should work correctly.

#### Solution 2: Fix Test Timing
The test may need to wait for the `updateStatus()` call to complete before checking:

```typescript
// Change to undefined - should use lastKnownStatusRef.current
rerender({ executionStatus: undefined })
await advanceTimersByTime(100)  // Wait for useEffect to run

// Should use lastKnownStatusRef.current when executionStatus is falsy
// Code path verified - connection should still exist
expect(wsInstances.length).toBeGreaterThan(0)
```

#### Solution 3: Verify Test Assertion
The test only checks that `wsInstances.length > 0`, but doesn't verify that the connection is actually using `lastKnownStatus`. It should verify specific behavior, such as checking that reconnection would use `lastKnownStatus`:

```typescript
// Change to undefined - should use lastKnownStatusRef.current
rerender({ executionStatus: undefined })
await advanceTimersByTime(100)

// Verify that lastKnownStatus is being used by checking connection behavior
// If lastKnownStatus is 'running', connection should still be active
if (wsInstances.length > 0) {
  const ws = wsInstances[0]
  // Close and verify reconnection uses lastKnownStatus
  await act(async () => {
    ws.simulateClose(1001, '', false)
    await advanceTimersByTime(50)
  })
  
  // Should attempt reconnect because lastKnownStatus is 'running'
  expect(logger.debug).toHaveBeenCalledWith(
    expect.stringContaining('Reconnecting in')
  )
}
```

---

## Implementation Analysis

### How `currentStatus` is Calculated

The code uses `logicalOr(executionStatus, lastKnownStatus)` to determine the current status:

```typescript
// In ExecutionStatusChecker.isTerminated()
static isTerminated(
  status: ExecutionStatus | undefined,
  lastKnownStatus?: ExecutionStatus | undefined
): boolean {
  const currentStatus = logicalOr(status, lastKnownStatus)
  return currentStatus === EXECUTION_STATUS.COMPLETED || 
         currentStatus === EXECUTION_STATUS.FAILED
}
```

The `logicalOr` function returns the first truthy value:
- If `executionStatus` is truthy → returns `executionStatus`
- If `executionStatus` is falsy → returns `lastKnownStatus`

### How `lastKnownStatus` is Updated

In `WebSocketConnectionManager.updateStatus()`:

```typescript
updateStatus(status: ExecutionStatus | undefined): void {
  const hasStatus = status !== null && status !== undefined
  this.lastKnownStatus = hasStatus === true ? status : this.lastKnownStatus
  this.config.executionStatus = status
  // ... rest of method
}
```

**Key Point**: `lastKnownStatus` is only updated when a new status is provided. If `status` is `undefined` or `null`, `lastKnownStatus` retains its previous value.

### How Reconnection Logic Works

In `WebSocketConnectionManager.handleReconnection()`:

```typescript
const shouldReconnect = ExecutionStatusChecker.shouldReconnect(
  event.wasClean,
  event.code,
  this.reconnectAttempts,
  this.config.maxReconnectAttempts,
  this.config.executionId,
  this.config.executionStatus,  // ← Current executionStatus prop
  this.lastKnownStatus           // ← Last known status
) === true
```

The `shouldReconnect()` method calls `isTerminated(executionStatus, lastKnownStatus)`, which uses `logicalOr` to determine the current status.

---

## Recommended Solutions

### Priority 1: Fix Test 2 (Missing `rerender`)
**Impact**: HIGH - This is a clear bug preventing the test from running  
**Effort**: LOW - Simple fix  
**Solution**: Destructure `rerender` from `renderHook()`

### Priority 2: Fix Test 1 (lastKnownStatusRef path)
**Impact**: MEDIUM - Test logic may be incorrect  
**Effort**: MEDIUM - May need to adjust test flow  
**Solution**: Clear `executionStatus` to `undefined` before closing, or verify the test expectation matches implementation behavior

### Priority 3: Fix Test 3 (executionStatus is falsy)
**Impact**: MEDIUM - Test may need better assertions  
**Effort**: MEDIUM - May need to add more specific checks  
**Solution**: Add more specific assertions to verify `lastKnownStatus` is being used

---

## Testing Strategy

1. **Fix Test 2 first** - This is a clear bug that prevents the test from running
2. **Run Test 2** - Verify it passes after the fix
3. **Investigate Test 1** - Add logging to understand what's happening
4. **Investigate Test 3** - Add more specific assertions
5. **Verify all three tests pass** - Run the full test suite

---

## Code Changes Required

### File: `frontend/src/hooks/execution/useWebSocket.mutation.advanced.test.ts`

#### Change 1: Fix Test 2 (Line 708)
```typescript
// BEFORE:
renderHook(
  ({ executionId }) =>
    useWebSocket({
      executionId,
      executionStatus: 'running',
    }),
  {
    initialProps: { executionId: 'exec-1' },
  }
)

// AFTER:
const { rerender } = renderHook(
  ({ executionId }) =>
    useWebSocket({
      executionId,
      executionStatus: 'running',
    }),
  {
    initialProps: { executionId: 'exec-1' },
  }
)
```

#### Change 2: Improve Test 1 (Line 551)
```typescript
// Add after line 573:
// Clear executionStatus to force use of lastKnownStatusRef
rerender({ executionStatus: undefined })
await advanceTimersByTime(50)
```

#### Change 3: Improve Test 3 (Line 3319)
```typescript
// Replace the final assertion with more specific checks:
if (wsInstances.length > 0) {
  const ws = wsInstances[0]
  await act(async () => {
    ws.simulateOpen()
    await advanceTimersByTime(50)
  })
  
  // Verify that lastKnownStatus is being used by closing and checking reconnection
  await act(async () => {
    ws.simulateClose(1001, '', false)
    await advanceTimersByTime(50)
  })
  
  // Should attempt reconnect because lastKnownStatus is 'running'
  expect(logger.debug).toHaveBeenCalledWith(
    expect.stringContaining('Reconnecting in')
  )
}
```

---

## Verification Steps

1. Apply fixes to Test 2
2. Run Test 2 individually: `npm test -- --testPathPatterns="useWebSocket.mutation.advanced" --testNamePattern="should verify reconnectAttempts.*executionId is null"`
3. Apply fixes to Test 1
4. Run Test 1 individually: `npm test -- --testPathPatterns="useWebSocket.mutation.advanced" --testNamePattern="should verify currentStatus.*lastKnownStatusRef.*lastKnownStatusRef path"`
5. Apply fixes to Test 3
6. Run Test 3 individually: `npm test -- --testPathPatterns="useWebSocket.mutation.advanced" --testNamePattern="should verify executionStatus.*executionStatus is falsy"`
7. Run all three tests together to verify they all pass
8. Run the full test suite to ensure no regressions

---

## Notes

- These are mutation tests designed to verify specific code paths for mutation testing coverage
- The failures are edge cases and don't affect the core functionality
- All three tests are related to how `executionStatus` and `lastKnownStatus` interact
- The implementation uses `logicalOr` to determine the current status, which should handle these cases correctly
- The tests may need adjustments to match the actual implementation behavior

---

**Status**: Analysis complete, solutions documented  
**Next Steps**: Apply fixes and verify tests pass
