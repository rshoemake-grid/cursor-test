# Test Failures Analysis

**Date:** January 26, 2026  
**Status:** 8 test failures remaining (down from 64)  
**Test Suite Status:** 280 passed, 3 failed, 1 skipped  
**Overall Test Status:** 7373 passed, 8 failed, 31 skipped

---

## Summary

After fixing WebSocket reconnection logic and updating delay expectations, test failures have been reduced from **64 to 8** (87.5% reduction). The remaining failures fall into two categories:

1. **InputConfiguration Component Tests (4 failures)** - Test isolation/selector issues
2. **useWebSocket Mutation Tests (4 failures)** - Architecture mismatch with refactored code

---

## Category 1: InputConfiguration Component Tests

### File: `frontend/src/components/PropertyPanel/InputConfiguration.test.tsx`

**Failures:** 4 tests  
**Root Cause:** Multiple elements with "Add Input" text causing `getByText()` to fail

### Affected Tests:

1. `should call onAddInput with form values when add button is clicked`
2. `should use default values when fields are empty`
3. `should clear form after adding input`
4. `should render add input modal when showAddInput is true` (when run with other tests)

### Analysis:

**Problem:**
- The component renders "Add Input" text in two places:
  1. Button that opens the modal (line 44 in InputConfiguration.tsx)
  2. Modal title/heading (line 109 in InputConfiguration.tsx)
- When `showAddInput={true}`, both elements are visible simultaneously
- `screen.getByText('Add Input')` throws `TestingLibraryElementError: Found multiple elements`

**Current Test Approach:**
- Some tests already use `getAllByText()` (line 290)
- Tests attempt to scope queries using `screen.getByRole('dialog')` and `querySelector()`
- However, the scoping may not be working correctly in all cases

**Code Structure:**
```tsx
// Button (always visible)
<button onClick={() => onShowAddInput(true)}>
  Add Input  {/* First instance */}
</button>

// Modal (visible when showAddInput={true})
{showAddInput && (
  <div role="dialog">
    <h4>Add Input</h4>  {/* Second instance */}
    <form>
      <button type="submit">Add</button>
    </form>
  </div>
)}
```

### Recommended Solutions:

1. **Use more specific selectors** (Recommended)
   - Use `getByRole('button', { name: /Add Input/i })` for the button
   - Use `getByRole('heading', { name: /Add Input/i })` for the modal title
   - Use `getByRole('button', { type: 'submit' })` within the modal

2. **Use data-testid attributes**
   - Add `data-testid="add-input-button"` to the button
   - Add `data-testid="add-input-modal-title"` to the modal heading
   - Query using `getByTestId()`

3. **Improve test isolation**
   - Ensure each test cleans up properly
   - Use `afterEach` to reset component state
   - Consider using `renderHook` pattern if state persists

### Impact:
- **Severity:** Low - Tests pass individually, indicating test isolation issue
- **User Impact:** None - Component works correctly in application
- **Priority:** Medium - Should be fixed for CI/CD reliability

---

## Category 2: useWebSocket Mutation Tests

### File: `frontend/src/hooks/execution/useWebSocket.mutation.kill-remaining.test.ts`

**Failures:** 4 tests  
**Root Cause:** Tests verify internal implementation details that changed with refactoring

### Affected Tests:

1. `should verify exact reconnectAttempts.current < maxReconnectAttempts - less than`
2. `should verify exact reconnectAttempts.current >= maxReconnectAttempts - equal to max`
3. `should verify exact reconnectAttempts.current >= maxReconnectAttempts - greater than max`
4. `should verify exact reconnectAttempts.current < maxReconnectAttempts && executionId - executionId is null`

### Analysis:

**Problem:**
- These tests were written to verify **mutation-killing** coverage of specific code patterns
- They test internal implementation details like `reconnectAttempts.current`
- The code was refactored from inline `useWebSocket` hook to `WebSocketConnectionManager` class
- The new architecture encapsulates `reconnectAttempts` as a private property, not accessible via `.current`

**Architecture Change:**

**Old Implementation (useWebSocket.ts - removed):**
```typescript
const reconnectAttempts = useRef(0)
// Direct access: reconnectAttempts.current
```

**New Implementation (WebSocketConnectionManager.ts):**
```typescript
export class WebSocketConnectionManager {
  private reconnectAttempts = 0  // Private property, not accessible
  // Access only through internal methods
}
```

**Test Expectations:**
- Tests expect to verify exact comparison operators (`<`, `>=`, `&&`)
- Tests expect to verify exact assignment operations (`reconnectAttempts.current = 0`)
- These are **mutation testing** tests designed to kill specific mutation patterns

**Current Test Behavior:**
- Tests attempt to verify reconnection behavior indirectly
- Tests check `wsInstances.length` to infer reconnection attempts
- Tests cannot directly access `reconnectAttempts` due to encapsulation

### Recommended Solutions:

1. **Update tests to verify behavior, not implementation** (Recommended)
   - Remove direct access to `reconnectAttempts.current`
   - Verify reconnection behavior through observable effects:
     - WebSocket instances created
     - Logger calls with expected messages
     - Error callbacks triggered at max attempts
   - Example:
     ```typescript
     // Instead of: expect(reconnectAttempts.current).toBe(1)
     // Use: expect(wsInstances.length).toBeGreaterThan(initialCount)
     ```

2. **Add public getter method** (If mutation coverage is critical)
   - Add `getReconnectAttempts(): number` to `WebSocketConnectionManager`
   - Use only for testing purposes
   - Document as test-only API

3. **Refactor tests to use WebSocketConnectionManager directly**
   - Test `WebSocketConnectionManager` class directly (already done in `WebSocketConnectionManager.test.ts`)
   - Remove redundant mutation tests from `useWebSocket.mutation.kill-remaining.test.ts`
   - Keep only integration tests in `useWebSocket` test files

4. **Mark tests as skipped with explanation**
   - If mutation coverage is not critical, skip these tests
   - Add comment explaining architecture change
   - Document that coverage is maintained in `WebSocketConnectionManager.test.ts`

### Impact:
- **Severity:** Low - Tests verify implementation details, not user-facing behavior
- **User Impact:** None - Functionality works correctly
- **Priority:** Low - Mutation coverage maintained in dedicated test file
- **Note:** The refactored code has comprehensive tests in `WebSocketConnectionManager.test.ts` that cover the same mutation patterns

---

## Test Execution Context

### When Tests Pass:
- **InputConfiguration tests:** Pass when run individually (`npm test -- InputConfiguration.test.tsx`)
- **useWebSocket mutation tests:** Some pass, some fail depending on execution order

### When Tests Fail:
- **InputConfiguration tests:** Fail when run with full test suite (test isolation issue)
- **useWebSocket mutation tests:** Fail due to architecture mismatch

### Test Isolation Issues:
- Tests may be sharing state between runs
- Mock cleanup may not be sufficient
- Component state may persist between tests

---

## Recommendations

### Immediate Actions:

1. **Fix InputConfiguration tests** (Priority: Medium)
   - Update selectors to use `getByRole()` with specific roles
   - Add `data-testid` attributes for critical elements
   - Improve test cleanup in `afterEach`

2. **Update useWebSocket mutation tests** (Priority: Low)
   - Refactor to test behavior instead of implementation
   - Remove direct access to private properties
   - Consider removing redundant tests if coverage exists elsewhere

### Long-term Improvements:

1. **Improve test isolation**
   - Review all test files for shared state
   - Ensure proper cleanup in `beforeEach`/`afterEach`
   - Consider using test isolation utilities

2. **Document test architecture**
   - Document which tests verify implementation vs behavior
   - Create guidelines for mutation testing approach
   - Document test file organization

3. **CI/CD considerations**
   - Consider running tests in random order to catch isolation issues
   - Add test retry logic for flaky tests
   - Monitor test execution time

---

## Related Files

### Test Files:
- `frontend/src/components/PropertyPanel/InputConfiguration.test.tsx`
- `frontend/src/hooks/execution/useWebSocket.mutation.kill-remaining.test.ts`
- `frontend/src/hooks/utils/WebSocketConnectionManager.test.ts` (✅ All passing)

### Implementation Files:
- `frontend/src/components/PropertyPanel/InputConfiguration.tsx`
- `frontend/src/hooks/utils/WebSocketConnectionManager.ts`
- `frontend/src/hooks/execution/useWebSocket.ts`

---

## Progress Tracking

| Date | Failures | Status |
|------|----------|--------|
| Initial | 64 | Before fixes |
| After delay fixes | 8 | Current |
| Target | 0 | Goal |

**Next Steps:**
1. Fix InputConfiguration test selectors
2. Refactor useWebSocket mutation tests
3. Verify all tests pass in CI/CD environment
