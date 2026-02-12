# Chunk 5 Persistent Hang Analysis

**Date**: 2026-01-26  
**Status**: 🔍 INVESTIGATING  
**Issue**: Chunk 5 still hangs even after adding waitForWithTimeout helpers

---

## Current State

### ✅ Files Fixed
All 5 files have been updated:
1. ✅ `useMarketplaceData.logging.test.ts` - Helper added, all waitFor replaced
2. ✅ `useMarketplaceData.test.ts` - Helper exists, waitFor calls use waitForWithTimeout
3. ✅ `useMarketplaceData.methods.test.ts` - Helper added, all waitFor replaced
4. ✅ `useMarketplaceData.error.test.ts` - Helper added, all waitFor replaced
5. ✅ `useMarketplaceData.initialization.test.ts` - Helper added, all waitFor replaced

### ✅ Individual File Testing
- `useMarketplaceData.logging.test.ts` - ✅ Passes (1.126s)
- `useMarketplaceData.methods.test.ts` - ✅ Passes (0.619s, 1 test failure unrelated)
- Other files - Not individually tested yet

### ❌ Full Chunk Testing
- **Status**: Still hangs after 15+ seconds
- **Command**: `npm test -- --testPathPatterns="hooks/marketplace/useMarketplaceData\.(test|methods|error|logging|initialization)"`
- **Result**: Test process still running, needs to be killed

---

## Analysis

### Why It Still Hangs

Even though all files have `waitForWithTimeout` helpers, the hang persists. Possible causes:

#### 1. Helper Implementation Issue
**Problem**: The helper switches to real timers, but when multiple files run together:
- File 1 sets fake timers in `beforeEach`
- File 1's helper switches to real timers temporarily
- File 1's helper restores fake timers
- File 2 starts, but timer state may be inconsistent
- Multiple timer switches may conflict

**Evidence**: Individual files work, but together they hang

#### 2. Timer Cleanup Between Files
**Problem**: 
- Each file has `beforeEach` that calls `jest.useFakeTimers()`
- Each file may have `afterEach` cleanup
- When files run sequentially, timer state may not reset properly
- Jest may have lingering timer state between test files

**Evidence**: Timer state persists between test suites

#### 3. useMarketplaceData.test.ts Specific Issue
**Problem**: 
- This file is very large (~5000 lines)
- Has complex `afterEach` cleanup (lines 5013-5028)
- May have timer cleanup that conflicts with other files
- When run first or last, may affect other files

**Evidence**: This file has the most complex timer management

#### 4. Multiple Helper Instances
**Problem**: 
- Each file defines its own `waitForWithTimeout` helper
- Each helper independently manages timer state
- When multiple helpers run concurrently, they may conflict
- Timer switches may interfere with each other

**Evidence**: 5 different helper instances all managing timers

---

## Root Cause Hypothesis

**Most Likely**: **Timer state conflicts between test files**

When Jest runs multiple test files:
1. File 1: Sets fake timers → Helper switches to real → Helper restores fake
2. File 2: Sets fake timers (but state may be inconsistent) → Helper switches → Conflicts occur
3. Result: Timer state becomes inconsistent, causing hangs

**Secondary Cause**: **useMarketplaceData.test.ts cleanup conflicts**

The large test file has complex cleanup that may interfere with other files' timer setup.

---

## Solutions

### Solution 1: Shared Helper (Recommended)

**Action**: Create a shared `waitForWithTimeout` utility that all files import.

**Benefits**:
- Single source of truth
- Consistent timer management
- No duplicate code
- Easier to debug

**Implementation**:
```typescript
// frontend/src/test/utils/waitForWithTimeout.ts
export const waitForWithTimeoutFakeTimers = async (
  callback: () => void | Promise<void>, 
  timeout = 2000
) => {
  // ... helper implementation
}
```

**Update files**: Import from shared location instead of defining locally

### Solution 2: Improve Timer Cleanup

**Action**: Ensure consistent timer cleanup between files.

**Pattern**:
```typescript
afterEach(async () => {
  // Run all pending timers
  jest.advanceTimersByTime(0)
  jest.runOnlyPendingTimers()
  // Wait for async operations
  await Promise.resolve()
  // Always restore real timers
  jest.useRealTimers()
})
```

**Update**: Ensure all files have consistent cleanup

### Solution 3: Run Files Separately

**Action**: Test files individually, document which work.

**Command**: Run each file separately and verify
**Benefit**: Identify which specific file(s) cause the hang

### Solution 4: Use Real Timers for waitFor Tests

**Action**: For tests using `waitFor`, temporarily use real timers.

**Pattern**:
```typescript
it('test with waitFor', async () => {
  jest.useRealTimers() // Switch before waitFor
  try {
    await waitFor(() => {...})
  } finally {
    jest.useFakeTimers() // Restore after
  }
})
```

---

## Recommended Approach

### Immediate: Test Files Individually

1. ✅ Test `useMarketplaceData.logging.test.ts` - Already passes
2. ⏳ Test `useMarketplaceData.methods.test.ts` - Already passes (with 1 unrelated failure)
3. ⏳ Test `useMarketplaceData.error.test.ts` - Need to test
4. ⏳ Test `useMarketplaceData.initialization.test.ts` - Need to test
5. ⏳ Test `useMarketplaceData.test.ts` - Need to test full file

**Goal**: Identify which file(s) cause the hang when run together

### Short-term: Create Shared Helper

1. Create `frontend/src/test/utils/waitForWithTimeout.ts`
2. Update all 5 files to import from shared location
3. Test full chunk again

### Long-term: Improve Timer Management

1. Standardize timer cleanup across all files
2. Consider using real timers for waitFor tests
3. Document timer management patterns

---

## Next Steps

1. ⏳ Test remaining files individually
2. ⏳ Identify which file combination causes hang
3. ⏳ Create shared waitForWithTimeout utility
4. ⏳ Update all files to use shared utility
5. ⏳ Test full chunk again

---

## Notes

- Individual files work, suggesting the fix is correct
- The issue is likely in how files interact when run together
- Timer state management between Jest test suites is complex
- May need Jest configuration changes or test isolation improvements
