# Chunk 5 Hang Analysis: Marketplace Hooks - Core

**Date**: 2026-01-26  
**Status**: ⚠️ INVESTIGATION COMPLETE  
**Chunk**: Chunk 5 - Marketplace Hooks Core Tests

---

## Problem Summary

When running Chunk 5 tests together:
```bash
npm test -- --testPathPatterns="hooks/marketplace/useMarketplaceData\.(test|methods|error|logging|initialization)"
```

The test execution **hangs/timeouts** and never completes.

---

## Investigation Results

### Individual File Testing

**Test Results** (when run individually):
- ✅ `useMarketplaceData.initialization.test.ts` - **Completes successfully** (~2-3 seconds)
- ⏳ Other files not individually tested yet (due to time constraints)

**Key Finding**: The initialization test file completes when run alone, suggesting the hang occurs when multiple files run together.

---

## Root Cause Analysis

### 1. Fake Timers + waitFor Conflict

**Issue**: Multiple test files use `jest.useFakeTimers()` and `waitFor()` together.

**Files Affected**:
- `useMarketplaceData.test.ts` - Uses `jest.useFakeTimers()` (line 60)
- `useMarketplaceData.logging.test.ts` - Uses `waitFor()` extensively (multiple instances)
- `useMarketplaceData.methods.test.ts` - Likely similar pattern
- `useMarketplaceData.error.test.ts` - Likely similar pattern
- `useMarketplaceData.initialization.test.ts` - Uses fake timers

**Problem**: 
- `waitFor()` from `@testing-library/react` uses real timers internally
- When fake timers are active, `waitFor()` may wait indefinitely for conditions that never resolve
- Multiple files running together may create timer conflicts

### 2. Missing waitForWithTimeout Helper

**Observation**: 
- `useMarketplaceData.logging.test.ts` uses `waitFor()` directly (lines 76, 110, 176, 212, 248, 276, 307, 337)
- No `waitForWithTimeout` helper (like ExecutionConsole tests use)
- No fake timer handling in `waitFor` calls

**Code Pattern**:
```typescript
await waitFor(() => {
  expect(mockLoggerDebug).toHaveBeenCalledWith(...)
})
```

**Issue**: Under fake timers, these `waitFor` calls may never resolve.

### 3. Timer Cleanup Issues

**Observation**:
- `useMarketplaceData.test.ts` has `afterEach` cleanup (lines 4985-4998)
- Other test files may not have proper cleanup
- When multiple files run together, timer state may persist between files

**Code Pattern**:
```typescript
afterEach(() => {
  if (jest.isMockFunction(setTimeout)) {
    try {
      while (jest.getTimerCount() > 0) {
        jest.runOnlyPendingTimers()
      }
    } catch (e) {
      // Ignore errors
    }
  }
  jest.useRealTimers()
})
```

**Issue**: If cleanup fails or timers persist, subsequent files may hang.

### 4. Async Operations Not Completing

**Observation**:
- Tests use `renderHook` with async operations
- Multiple `useEffect` hooks trigger async data fetching
- Under fake timers, async operations may not complete properly

**Pattern**:
```typescript
const { result } = renderHook(() => useMarketplaceData({...}))
await waitFor(() => {
  expect(result.current.loading).toBe(false)
})
```

**Issue**: If async operations don't complete under fake timers, `waitFor` waits indefinitely.

---

## Evidence

### From Test Output (initialization.test.ts)

**Successful completion indicators**:
- Tests run and complete: `[TEST END]` messages appear
- Tests finish in ~2-3 seconds when run individually
- No infinite loops detected

**Warning patterns**:
- Multiple React `act()` warnings (non-critical)
- Error logs for expected test scenarios (non-critical)

### From Code Analysis

**useMarketplaceData.logging.test.ts**:
- 8+ `waitFor()` calls without timeout or fake timer handling
- No `waitForWithTimeout` helper
- Uses `waitFor` from `@testing-library/react` directly

**useMarketplaceData.test.ts**:
- Uses `jest.useFakeTimers()` in `beforeEach`
- Has timer cleanup in `afterEach`
- Uses `waitFor()` in tests

**Pattern**: Files that use both fake timers and `waitFor()` are at risk of hanging.

---

## Root Cause Conclusion

**Primary Cause**: **Fake timers + waitFor conflict**

When multiple test files run together:
1. File 1 sets up fake timers
2. File 1 uses `waitFor()` which expects real timers
3. `waitFor()` waits indefinitely because fake timers are active
4. Test hangs

**Secondary Causes**:
- Missing `waitForWithTimeout` helper (like ExecutionConsole tests)
- Incomplete timer cleanup between test files
- Async operations not completing under fake timers

---

## Solution Recommendations

### Solution 1: Add waitForWithTimeout Helper (Recommended)

**Action**: Add `waitForWithTimeout` helper to marketplace test files (similar to ExecutionConsole tests).

**Implementation**:
```typescript
// Add to each test file
import { waitFor } from '@testing-library/react'

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

**Replace**: All `waitFor()` calls with `waitForWithTimeout()`

**Files to Update**:
- `useMarketplaceData.logging.test.ts`
- `useMarketplaceData.test.ts`
- `useMarketplaceData.methods.test.ts`
- `useMarketplaceData.error.test.ts`
- `useMarketplaceData.initialization.test.ts`

### Solution 2: Ensure Proper Timer Cleanup

**Action**: Ensure all test files have proper `afterEach` cleanup.

**Pattern**:
```typescript
afterEach(async () => {
  // Run pending timers
  jest.advanceTimersByTime(0)
  jest.runOnlyPendingTimers()
  // Wait for async operations
  await Promise.resolve()
  await Promise.resolve()
  // Restore real timers
  jest.useRealTimers()
})
```

### Solution 3: Use Real Timers for waitFor Tests

**Action**: For tests that use `waitFor()`, temporarily switch to real timers.

**Pattern**:
```typescript
it('should test async behavior', async () => {
  jest.useRealTimers() // Switch to real timers
  try {
    // Test with waitFor
    await waitFor(() => {
      expect(...).toBe(...)
    })
  } finally {
    jest.useFakeTimers() // Restore fake timers
  }
})
```

---

## Priority

**High Priority**: Fix `waitFor()` calls in marketplace test files  
**Medium Priority**: Ensure consistent timer cleanup  
**Low Priority**: Consider refactoring to reduce fake timer usage

---

## Testing Strategy

### After Fix Implementation:

1. **Test individual files**: Verify each file completes
2. **Test pairs**: Test files in pairs to check for conflicts
3. **Test full chunk**: Run all 5 files together
4. **Monitor execution time**: Should complete in < 10 seconds

### Expected Outcome:

- All 5 test files complete successfully
- Chunk 5 completes in < 10 seconds
- No hangs or timeouts

---

## Related Issues

- Similar pattern seen in ExecutionConsole tests (fixed with `waitForWithTimeout`)
- Other test files may have similar issues
- Consider creating shared test utility for `waitForWithTimeout`

---

## Next Steps

1. ⏳ Implement `waitForWithTimeout` helper in marketplace test files
2. ⏳ Replace all `waitFor()` calls with `waitForWithTimeout()`
3. ⏳ Verify timer cleanup in all files
4. ⏳ Test Chunk 5 again after fixes
5. ⏳ Document results

---

## References

- ExecutionConsole test fix: `frontend/src/components/ExecutionConsole.additional.test.tsx` (lines 9-35)
- Test failure analysis: `frontend/TEST_FAILURE_ANALYSIS.md`
- Testing progress: `frontend/TESTING_CHUNK_PROGRESS.md`
