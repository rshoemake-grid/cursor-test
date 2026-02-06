# Test Failure Fix Plan

## Analysis Summary

**Current Status:** 8 test failures remaining (down from 64)
- 4 failures in `InputConfiguration.test.tsx`
- 4 failures in `useWebSocket.mutation.kill-remaining.test.ts`

---

## Issue 1: InputConfiguration.test.tsx (4 failures)

### Problem
Tests fail with "Found multiple elements with the text: Add Input" when run together, but pass individually. This indicates a test isolation problem.

### Root Cause
- The component renders "Add Input" in two places:
  1. The button that opens the modal (line 44)
  2. The modal title "Add Input" (line 109)
- When tests run together, previous test renders may not be fully cleaned up
- Tests use `screen.getByRole('dialog')` to scope queries, but `getByText('Add Input')` is called before scoping
- The modal uses a `<div role="dialog">` which may conflict with other dialogs

### Solution Strategy
1. **Use more specific selectors**: Instead of `getByText('Add Input')`, use:
   - `getByLabelText('Add input to node')` for the button
   - `getByRole('heading', { name: 'Add Input' })` for the modal title
   - Or use `within(modal)` to scope all queries

2. **Improve test isolation**: 
   - Ensure `beforeEach` properly cleans up
   - Use `cleanup()` if needed
   - Consider using `getAllByText` and selecting the correct one

3. **Fix the failing tests**:
   - Lines 321, 333, 346: These tests already use `getByRole('dialog')` and `querySelector`, but the error suggests multiple dialogs exist
   - Need to ensure only one dialog exists or use more specific queries

### Implementation Plan
1. Update tests to use `within(modal)` for all queries inside the modal
2. Use `getByRole('heading')` for the modal title instead of `getByText`
3. Use `getByLabelText` for the button instead of `getByText`
4. Add explicit cleanup if needed

---

## Issue 2: useWebSocket.mutation.kill-remaining.test.ts (4 failures)

### Problem
Tests expect reconnection to happen after 2000ms, but the actual delay is now 10000ms (DEFAULT_MAX_DELAY).

### Root Cause
- Tests were written for the old delay calculation: `Math.min(1000 * Math.pow(2, attempt), 10000)`
- New implementation uses: `DEFAULT_MAX_DELAY * Math.pow(2, attempt-1)` where `DEFAULT_MAX_DELAY = 10000`
- For attempt 1: old = 2000ms, new = 10000ms
- Tests only advance timers by 2000ms, so reconnection timeout never fires

### Solution Strategy
1. **Update timer advances**: Change `advanceTimersByTime(2000)` to `advanceTimersByTime(10000)` or more
2. **Update comments**: Fix comments that reference old delay calculation
3. **Verify test logic**: Ensure tests still verify the correct behavior

### Affected Tests
- Line 1953: `await advanceTimersByTime(2000)` → should be 10000+
- Line 1990: `await advanceTimersByTime(2000)` → should be 10000+
- Line 2027: `await advanceTimersByTime(2000)` → should be 10000+
- Line ~2044: Check if there are more instances

### Implementation Plan
1. Update all `advanceTimersByTime(2000)` calls to `advanceTimersByTime(10100)` (10000ms delay + 100ms buffer)
2. Update comments to reflect new delay calculation
3. Verify tests still correctly verify reconnection behavior

---

## Implementation Order

1. ✅ Fix useWebSocket.mutation.kill-remaining.test.ts (simpler fix)
2. ✅ Fix InputConfiguration.test.tsx (requires more careful selector updates)

---

## Expected Outcome

After fixes:
- All 8 tests should pass
- Test suite: 0 failures, 7412+ passing tests
- No regressions in existing passing tests
