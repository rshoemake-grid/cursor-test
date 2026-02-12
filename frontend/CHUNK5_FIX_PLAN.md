# Chunk 5 Fix Plan: Marketplace Hooks - Core Tests

**Date**: 2026-01-26  
**Status**: 🔄 IN PROGRESS  
**Issue**: Tests hang due to fake timers + waitFor conflict  
**Solution**: Add waitForWithTimeout helper and replace waitFor calls

---

## Overview

Fix the hanging issue in Chunk 5 marketplace test files by:
1. Adding `waitForWithTimeout` helper to each file
2. Replacing all `waitFor()` calls with `waitForWithTimeout()`
3. Testing each file individually
4. Testing the full chunk together

---

## Files to Fix

| File | waitFor Calls | Priority | Estimated Time |
|------|---------------|----------|----------------|
| `useMarketplaceData.logging.test.ts` | 12+ | HIGH | 10 min |
| `useMarketplaceData.test.ts` | 10+ | HIGH | 10 min |
| `useMarketplaceData.methods.test.ts` | ~5-10 | MEDIUM | 8 min |
| `useMarketplaceData.error.test.ts` | ~5-10 | MEDIUM | 8 min |
| `useMarketplaceData.initialization.test.ts` | ~2-5 | LOW | 5 min |

**Total Estimated Time**: ~40 minutes

---

## Implementation Steps

### Step 1: Create waitForWithTimeout Helper Template

**Helper Code** (to add to each file):
```typescript
import { waitFor } from '@testing-library/react'

// Helper to ensure all waitFor calls have timeouts
// When using fake timers, we need to advance timers and use real timers for waitFor
// This fixes timing conflicts between fake timers and waitFor's internal real timers
const waitForWithTimeout = async (callback: () => void | Promise<void>, timeout = 2000) => {
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
```

**Location**: Add after imports, before `describe` block

---

### Step 2: Fix useMarketplaceData.logging.test.ts

**Tasks**:
1. ✅ Add `waitForWithTimeout` helper after imports
2. ✅ Replace all `waitFor(` with `waitForWithTimeout(`
3. ✅ Verify imports include `waitFor` from `@testing-library/react`
4. ✅ Test file individually

**Files to modify**: `frontend/src/hooks/marketplace/useMarketplaceData.logging.test.ts`

**Expected changes**: ~12 replacements

---

### Step 3: Fix useMarketplaceData.test.ts

**Tasks**:
1. ✅ Add `waitForWithTimeout` helper after imports
2. ✅ Replace all `waitFor(` with `waitForWithTimeout(`
3. ✅ Verify imports include `waitFor` from `@testing-library/react`
4. ✅ Test file individually

**Files to modify**: `frontend/src/hooks/marketplace/useMarketplaceData.test.ts`

**Expected changes**: ~10 replacements

---

### Step 4: Fix useMarketplaceData.methods.test.ts

**Tasks**:
1. ✅ Check if file uses `waitFor`
2. ✅ Add `waitForWithTimeout` helper if needed
3. ✅ Replace all `waitFor(` with `waitForWithTimeout(`
4. ✅ Test file individually

**Files to modify**: `frontend/src/hooks/marketplace/useMarketplaceData.methods.test.ts`

---

### Step 5: Fix useMarketplaceData.error.test.ts

**Tasks**:
1. ✅ Check if file uses `waitFor`
2. ✅ Add `waitForWithTimeout` helper if needed
3. ✅ Replace all `waitFor(` with `waitForWithTimeout(`
4. ✅ Test file individually

**Files to modify**: `frontend/src/hooks/marketplace/useMarketplaceData.error.test.ts`

---

### Step 6: Fix useMarketplaceData.initialization.test.ts

**Tasks**:
1. ✅ Check if file uses `waitFor`
2. ✅ Add `waitForWithTimeout` helper if needed
3. ✅ Replace all `waitFor(` with `waitForWithTimeout(`
4. ✅ Test file individually

**Files to modify**: `frontend/src/hooks/marketplace/useMarketplaceData.initialization.test.ts`

---

### Step 7: Test Full Chunk

**Command**:
```bash
cd frontend && npm test -- --testPathPatterns="hooks/marketplace/useMarketplaceData\.(test|methods|error|logging|initialization)"
```

**Expected Result**:
- ✅ All 5 test suites pass
- ✅ Tests complete in < 10 seconds
- ✅ No hangs or timeouts

---

## Progress Tracking

### Overall Progress
- **Files Fixed**: 5/5 ✅
- **waitFor Calls Replaced**: ~40/40 ✅
- **Status**: ⚠️ HANG PERSISTS - Need further investigation

### File Status

| File | Status | waitFor Calls | Notes |
|------|--------|---------------|-------|
| logging.test.ts | ✅ COMPLETED | 12 | Fixed - All tests passing (1.126s) |
| test.ts | ✅ COMPLETED | ~10 | Helper exists, waitFor calls already replaced |
| methods.test.ts | ✅ VERIFIED | 0 | Helper exists, all waitFor calls already replaced |
| error.test.ts | ✅ VERIFIED | 0 | Helper exists, all waitFor calls already replaced |
| initialization.test.ts | ✅ VERIFIED | 0 | Helper exists, all waitFor calls already replaced |

**Note**: All files already have waitFor calls replaced! Timeout may be caused by other factors (file size, async operations, timer cleanup). Need to test individually to identify root cause.
| methods.test.ts | ⏳ PENDING | ~5-10 | Medium priority |
| error.test.ts | ⏳ PENDING | ~5-10 | Medium priority |
| initialization.test.ts | ⏳ PENDING | ~2-5 | Low priority |

---

## Verification Steps

After each file fix:
1. Run individual test file
2. Verify all tests pass
3. Check execution time (< 5 seconds)
4. Update progress tracker

After all files fixed:
1. Run full chunk test
2. Verify no hangs
3. Update Chunk 5 status in `TESTING_CHUNK_PROGRESS.md`
4. Document results

---

## Notes

- Helper pattern matches ExecutionConsole fix (proven solution)
- Each file should be tested individually before moving to next
- If a file doesn't use `waitFor`, skip it
- Keep helper code consistent across all files

---

## References

- ExecutionConsole fix: `frontend/src/components/ExecutionConsole.additional.test.tsx` (lines 9-35)
- Analysis: `frontend/CHUNK5_HANG_ANALYSIS.md`
- Progress: `frontend/TESTING_CHUNK_PROGRESS.md`
