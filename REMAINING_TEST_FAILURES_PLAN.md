# Remaining Test Failures Analysis and Fix Plan

**Date:** 2026-01-26  
**Status:** 8 test failures remaining (down from 64)  
**Test Suites:** 3 failed, 280 passed  
**Tests:** 8 failed, 7373 passed

---

## Summary

After fixing the exponential backoff delay expectations, we've reduced failures from 64 to 8. The remaining failures fall into two categories:

1. **InputConfiguration.test.tsx** (4 failures) - Test isolation/query specificity issues
2. **useWebSocket.mutation.kill-remaining.test.ts** (4 failures) - Architecture mismatch after refactoring

---

## Issue 1: InputConfiguration.test.tsx - Multiple "Add Input" Elements

### Problem Analysis

**Root Cause:** The text "Add Input" appears in multiple places in the component:
- As a button label to open the modal (line 44 in InputConfiguration.tsx)
- As text/label within the modal dialog itself

**Failing Tests:**
1. `should call onAddInput with form values when add button is clicked` (line 310)
2. `should use default values when fields are empty` (line 331)
3. `should clear form after adding input` (line 348)
4. `should render add input modal when showAddInput is true` (line 283) - This one already uses `getAllByText` but may have other issues

**Error:** `TestingLibraryElementError: Found multiple elements with the text: Add Input`

### Solution Strategy

**Option A: Use More Specific Queries (Recommended)**
- Use `getByRole('button', { name: 'Add Input' })` for the button that opens the modal
- Use `within(modal)` to scope queries to the modal dialog
- Use `getByRole('button', { type: 'submit' })` within the modal for the submit button

**Option B: Use getAllByText and Select Correct Index**
- Use `getAllByText('Add Input')[0]` for the button
- Use `getAllByText('Add Input')[1]` for modal content (if needed)

**Option C: Add Test IDs**
- Add `data-testid` attributes to distinguish elements
- Less preferred as it adds test-specific code to components

### Implementation Plan

1. **Fix test at line 310** (`should call onAddInput with form values when add button is clicked`)
   - Already uses `modal.querySelector('button[type="submit"]')` which is good
   - May need to ensure modal is properly scoped
   - **Action:** Verify modal is found correctly, add error handling

2. **Fix test at line 331** (`should use default values when fields are empty`)
   - Same pattern as above
   - **Action:** Same fix as test 1

3. **Fix test at line 348** (`should clear form after adding input`)
   - Same pattern as above
   - **Action:** Same fix as test 1

4. **Fix test at line 283** (`should render add input modal when showAddInput is true`)
   - Already uses `getAllByText('Add Input')` correctly
   - **Action:** Verify this test actually fails or if it's a false positive

### Code Changes Required

```typescript
// Instead of:
const addButton = screen.getByText('Add Input') // ❌ Fails with multiple matches

// Use:
const addButton = screen.getByRole('button', { name: 'Add Input' }) // ✅ Specific
// OR
const modal = screen.getByRole('dialog')
const submitButton = within(modal).getByRole('button', { type: 'submit' }) // ✅ Scoped
```

**Estimated Time:** 30-45 minutes  
**Risk:** Low - Simple query changes

---

## Issue 2: useWebSocket.mutation.kill-remaining.test.ts - Architecture Mismatch

### Problem Analysis

**Root Cause:** After refactoring `useWebSocket` to use `WebSocketConnectionManager`, the internal state (`reconnectAttempts`) is now encapsulated within the manager class and not directly accessible from tests. The mutation-killing tests were written to verify exact comparisons like:
- `reconnectAttempts.current < maxReconnectAttempts`
- `reconnectAttempts.current >= maxReconnectAttempts`
- `reconnectAttempts.current = 0`

These tests can no longer directly access `reconnectAttempts.current` because it's now a private property of `WebSocketConnectionManager`.

**Failing Tests:**
1. `should verify exact reconnectAttempts.current < maxReconnectAttempts - less than` (line ~1950)
2. `should verify exact reconnectAttempts.current >= maxReconnectAttempts - equal to max` (line ~1962)
3. `should verify exact reconnectAttempts.current >= maxReconnectAttempts - greater than max` (line ~1999)
4. `should verify exact reconnectAttempts.current = 0 on connection open` (line ~2422)

**Error Pattern:** Tests fail because they can't access internal state, or they're checking for behavior that's now encapsulated.

### Solution Strategy

**Option A: Test Behavior Instead of Implementation (Recommended)**
- Verify reconnection happens when attempts < max (indirectly via `wsInstances.length`)
- Verify max attempts warning is logged when attempts >= max
- Verify reconnection resets on successful connection (via logger messages)
- This aligns with testing best practices (test behavior, not implementation)

**Option B: Expose Test Helpers**
- Add a test-only method to `WebSocketConnectionManager` to expose `reconnectAttempts`
- Less preferred as it adds test-specific code to production code

**Option C: Use Logger Messages**
- Parse logger.debug messages to infer reconnectAttempts value
- Check for patterns like "attempt 1/5", "attempt 2/5", etc.
- Already partially used in some tests

### Implementation Plan

1. **Fix test: `reconnectAttempts.current < maxReconnectAttempts - less than`**
   - **Current:** Tries to verify exact comparison
   - **New:** Verify reconnection happens when attempts should be < max
   - **Action:** 
     - Close connection
     - Wait for reconnection delay
     - Verify new connection is created (`wsInstances.length` increases)
     - Verify logger shows "attempt 1/5" or similar

2. **Fix test: `reconnectAttempts.current >= maxReconnectAttempts - equal to max`**
   - **Current:** Tries to verify exact comparison when attempts = max
   - **New:** Trigger 5 reconnection attempts, verify max attempts warning
   - **Action:**
     - Simulate 5 failed reconnection attempts
     - Verify `onError` is called with max attempts message
     - Verify logger shows "Max reconnect attempts reached"

3. **Fix test: `reconnectAttempts.current >= maxReconnectAttempts - greater than max`**
   - **Current:** Tries to verify exact comparison when attempts > max
   - **New:** Similar to above, verify max attempts guard triggers
   - **Action:** Same as test 2

4. **Fix test: `reconnectAttempts.current = 0 on connection open`**
   - **Current:** Tries to verify exact assignment
   - **New:** Verify reconnection resets after successful connection
   - **Action:**
     - Open connection (should reset attempts to 0)
     - Close and trigger reconnection
     - Verify next reconnect shows "attempt 1/5" (not "attempt 2/5")
     - This proves reset worked

### Code Changes Required

```typescript
// Instead of:
expect(reconnectAttempts.current).toBeLessThan(maxReconnectAttempts) // ❌ Can't access

// Use:
// Trigger reconnection
ws.simulateClose(1006, '', false)
await advanceTimersByTime(10100)

// Verify reconnection happened (indirect proof)
expect(wsInstances.length).toBeGreaterThan(1)

// Verify attempt number via logger
const reconnectCalls = (logger.debug as jest.Mock).mock.calls.filter(
  call => call[0]?.includes('Reconnecting in') && call[0]?.includes('attempt 1/5')
)
expect(reconnectCalls.length).toBeGreaterThan(0) // ✅ Behavior-based
```

**Estimated Time:** 1-2 hours  
**Risk:** Medium - Requires understanding of new architecture and behavior verification

---

## Implementation Priority

### Phase 1: Quick Wins (InputConfiguration tests)
- **Time:** 30-45 minutes
- **Risk:** Low
- **Impact:** Fixes 4 test failures
- **Start:** Immediately

### Phase 2: Architecture Alignment (useWebSocket tests)
- **Time:** 1-2 hours
- **Risk:** Medium
- **Impact:** Fixes 4 test failures, improves test quality
- **Start:** After Phase 1

---

## Testing Strategy

After implementing fixes:

1. **Run individual test files:**
   ```bash
   npm test -- InputConfiguration.test.tsx
   npm test -- useWebSocket.mutation.kill-remaining.test.ts
   ```

2. **Run full test suite:**
   ```bash
   npm test
   ```

3. **Verify no regressions:**
   - Ensure previously passing tests still pass
   - Check that test coverage hasn't decreased

---

## Success Criteria

- ✅ All 8 tests pass individually
- ✅ All 8 tests pass when run together
- ✅ No regressions in other tests
- ✅ Test coverage maintained or improved
- ✅ Tests follow best practices (test behavior, not implementation)

---

## Notes

- The refactoring to `WebSocketConnectionManager` was a good architectural improvement
- The mutation-killing tests were written for the old architecture
- Updating them to test behavior rather than implementation will make them more maintainable
- InputConfiguration tests just need better query specificity - no architectural changes needed

---

## Related Files

- `frontend/src/components/PropertyPanel/InputConfiguration.test.tsx`
- `frontend/src/components/PropertyPanel/InputConfiguration.tsx`
- `frontend/src/hooks/execution/useWebSocket.mutation.kill-remaining.test.ts`
- `frontend/src/hooks/utils/WebSocketConnectionManager.ts`
- `frontend/src/hooks/execution/useWebSocket.ts`
