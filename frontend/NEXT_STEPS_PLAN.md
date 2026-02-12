# Next Steps Plan

## Current Status

✅ **COMPLETED**: Fixed test "should call onExecutionStatusUpdate when status received" in `ExecutionConsole.additional.test.tsx`
- Test is now passing
- Solution uses resilient pattern with `waitForWithTimeout` helper

✅ **COMPLETED**: Fixed missing `waitForWithTimeout` helper in `ExecutionConsole.test.tsx`
- All 5 previously failing tests are now passing
- Test suite: 15 passed, 8 skipped, 23 total

## Completed Issues

### ✅ Issue 1: Missing `waitForWithTimeout` Helper in `ExecutionConsole.test.tsx` - FIXED

**Problem**: `ExecutionConsole.test.tsx` used `waitForWithTimeout` but it wasn't defined in that file.

**Previously Failing Tests** (now all passing):
- ✅ should expand when toggle button is clicked
- ✅ should switch to chat tab
- ✅ should switch to execution tab
- ✅ should display execution logs
- ✅ should display empty state when no logs

**Solution Applied**: Added the `waitForWithTimeout` helper function to `ExecutionConsole.test.tsx`

**Steps Completed**:
1. ✅ Checked if `ExecutionConsole.test.tsx` uses fake timers - It doesn't
2. ✅ Added simple `waitForWithTimeout` helper (just wraps `waitFor` with timeout)
3. ✅ Added `waitFor` import from `@testing-library/react`
4. ✅ Ran tests - All 5 previously failing tests now pass
5. ✅ Documented the fix

## Completed Tasks

### ✅ Task 1: Fix Missing Helper in ExecutionConsole.test.tsx - COMPLETED

**Priority**: High  
**Time Taken**: ~5 minutes

**Steps Completed**:
1. ✅ Checked if `ExecutionConsole.test.tsx` uses fake timers - It doesn't
2. ✅ Added `waitFor` import to existing imports
3. ✅ Added simple `waitForWithTimeout` helper function (lines 4-6)
4. ✅ Verified all tests pass (15 passed, 8 skipped, 23 total)
5. ✅ Documented the fix

**Files Modified**:
- ✅ `frontend/src/components/ExecutionConsole.test.tsx` - Added helper function and `waitFor` import

**Actual Outcome**:
- ✅ All 5 previously failing tests in `ExecutionConsole.test.tsx` now pass
- ✅ Test suite is fully green (15 passed, 8 skipped, 23 total)
- ✅ All tests complete in 0.485s

## Implementation Notes

### Helper Function Options

**Option A: Simple Helper** (if no fake timers):
```typescript
const waitForWithTimeout = (callback: () => void | Promise<void>, timeout = 2000) => {
  return waitFor(callback, { timeout })
}
```

**Option B: Full Helper** (if fake timers are used):
```typescript
const waitForWithTimeout = async (callback: () => void | Promise<void>, timeout = 2000) => {
  const wasUsingFakeTimers = typeof jest.getRealSystemTime === 'function'
  
  if (wasUsingFakeTimers) {
    jest.advanceTimersByTime(0)
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    try {
      await new Promise(resolve => setTimeout(resolve, 10))
      return await waitFor(callback, { timeout })
    } finally {
      jest.useFakeTimers()
    }
  } else {
    return await waitFor(callback, { timeout })
  }
}
```

## Verification - COMPLETED

✅ Verified with:
```bash
cd frontend && npm test -- --testPathPatterns="ExecutionConsole.test"
```

✅ Actual result:
- ✅ All tests pass (no failures)
- ✅ Test count: 15 passed, 8 skipped, 23 total
- ✅ Execution time: 0.485s

## Future Considerations

1. **Shared Test Utilities**: Consider creating a shared test utilities file for `waitForWithTimeout` to avoid duplication
2. **Test Consistency**: Ensure all test files use consistent patterns for async operations
3. **Documentation**: Update test documentation with patterns for handling fake timers

## Related Files

- ✅ `frontend/src/components/ExecutionConsole.test.tsx` - Fixed (added helper)
- `frontend/src/components/ExecutionConsole.additional.test.tsx` - Reference implementation
- `frontend/CURRENT_STATUS.md` - Current status (to update)
- `frontend/TEST_FIX_SUMMARY.md` - Previous fix summary
- `frontend/NEXT_STEPS_PLAN.md` - This file (next steps plan)

## Changes Made

### File: `frontend/src/components/ExecutionConsole.test.tsx`

**Added** (lines 2-6):
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Helper to ensure all waitFor calls have timeouts
const waitForWithTimeout = (callback: () => void | Promise<void>, timeout = 2000) => {
  return waitFor(callback, { timeout })
}
```

**Result**: All 5 previously failing tests now pass.
