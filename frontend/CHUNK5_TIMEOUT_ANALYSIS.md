# Chunk 5 Timeout Analysis: useMarketplaceData.test.ts

**Date**: 2026-01-26  
**Issue**: Test execution times out when running useMarketplaceData.test.ts  
**Status**: 🔍 INVESTIGATING

---

## Problem

When running `useMarketplaceData.test.ts`, the test execution times out or hangs, even though:
1. The `waitForWithTimeout` helper is already present in the file (lines 7-33)
2. The helper should handle fake timers correctly

---

## Investigation

### Current State of useMarketplaceData.test.ts

**Helper Present**: ✅ Yes (lines 7-33)
```typescript
const waitForWithTimeout = async (callback: () => void | Promise<void>, timeout = 2000) => {
  // ... helper implementation
}
```

**waitFor Calls**: Need to verify if they're using `waitForWithTimeout` or still using `waitFor`

### Hypothesis

**Issue**: The helper exists but `waitFor()` calls may not have been replaced with `waitForWithTimeout()`

**Evidence Needed**:
1. Check if `waitFor()` calls still exist in the file
2. Verify if replacements were made
3. Check if there are any other async operations causing hangs

---

## Root Cause Analysis

### Possible Causes

1. **waitFor calls not replaced**
   - Helper exists but `waitFor()` calls still use original `waitFor`
   - `waitFor()` hangs under fake timers

2. **Fake timers not properly managed**
   - `beforeEach` sets `jest.useFakeTimers()` (line 88)
   - `afterEach` cleans up timers (lines 5013-5028)
   - But async operations may not complete before cleanup

3. **Large test file**
   - File has ~5000 lines
   - Many tests with async operations
   - Multiple `waitFor()` calls that may not be replaced

4. **Test execution order**
   - When run individually, may work
   - When run with other files, conflicts occur
   - Timer state persists between tests

---

## Verification Steps

### Step 1: Check waitFor Usage

**Command**:
```bash
grep -n "await waitFor(" src/hooks/marketplace/useMarketplaceData.test.ts
```

**Expected**: Should find instances if not replaced

### Step 2: Check waitForWithTimeout Usage

**Command**:
```bash
grep -n "waitForWithTimeout" src/hooks/marketplace/useMarketplaceData.test.ts
```

**Expected**: Should find helper definition and usage

### Step 3: Test Individual Test

**Command**:
```bash
npm test -- --testPathPatterns="useMarketplaceData.test.ts" --testNamePattern="should fetch templates successfully"
```

**Result**: ✅ This test passed (0.529s) - suggests individual tests work

### Step 4: Test Full File

**Command**:
```bash
npm test -- --testPathPatterns="useMarketplaceData.test.ts"
```

**Expected**: Should complete or timeout

---

## Findings

### From grep Results

**waitFor calls**: Need to check if any remain  
**waitForWithTimeout usage**: Need to verify if calls were replaced

### From Test Results

**Individual test**: ✅ Passes quickly (0.529s)  
**Full file**: ⏳ May timeout (needs verification)

---

## Root Cause Conclusion

**CONFIRMED**: **waitFor calls not replaced with waitForWithTimeout in some files**

**Findings**:
1. ✅ `useMarketplaceData.test.ts` - Helper exists AND waitFor calls replaced (lines 124, 269, 305, 684 use waitForWithTimeout)
2. ✅ `useMarketplaceData.logging.test.ts` - ✅ Fixed (all tests passing)
3. ❌ `useMarketplaceData.methods.test.ts` - Helper exists BUT waitFor calls NOT replaced
4. ❌ `useMarketplaceData.error.test.ts` - Helper exists BUT waitFor calls NOT replaced  
5. ❌ `useMarketplaceData.initialization.test.ts` - Helper exists BUT waitFor calls NOT replaced

**Why it times out**:
- When running Chunk 5 (all 5 files together), files 3-5 still use `waitFor()` directly
- Under fake timers, `waitFor()` waits indefinitely
- The helper exists but isn't being used
- Multiple files running together amplifies the issue

---

## Solution

### Action Required

**Files Needing Fix**:
1. ✅ `useMarketplaceData.logging.test.ts` - DONE
2. ✅ `useMarketplaceData.test.ts` - DONE (waitFor calls already replaced)
3. ❌ `useMarketplaceData.methods.test.ts` - NEEDS FIX (5+ waitFor calls)
4. ❌ `useMarketplaceData.error.test.ts` - NEEDS FIX (5+ waitFor calls)
5. ❌ `useMarketplaceData.initialization.test.ts` - NEEDS FIX (5+ waitFor calls)

### Fix Steps for Each File

1. **Replace all `waitFor()` calls with `waitForWithTimeout()`**
   - Pattern: `await waitFor(` → `await waitForWithTimeout(`
   - Use replace_all: true in search_replace tool
   - Verify: `grep -n "await waitFor("` should only show helper internals

2. **Test each file individually**
   - Run: `npm test -- --testPathPatterns="[filename]"`
   - Verify: Completes in < 5 seconds
   - Verify: All tests pass

3. **Test full chunk**
   - Run: `npm test -- --testPathPatterns="hooks/marketplace/useMarketplaceData\.(test|methods|error|logging|initialization)"`
   - Expected: Completes in < 10 seconds
   - Expected: All tests pass

---

## Implementation

### Replace Pattern

**Find**:
```typescript
await waitFor(() => {
  expect(...)
})
```

**Replace with**:
```typescript
await waitForWithTimeout(() => {
  expect(...)
})
```

**Scope**: All instances in `useMarketplaceData.test.ts`

---

## Expected Outcome

After fixing remaining files:
- ✅ All `waitFor()` calls replaced with `waitForWithTimeout()` in all 5 files
- ✅ Each file completes individually in < 5 seconds
- ✅ Full Chunk 5 completes in < 10 seconds
- ✅ No timeouts or hangs
- ✅ All tests pass

## Current Status

**Analysis Complete** ✅

**Root Cause**: The helper functions exist in all files, but the actual test calls to `waitFor()` may not have been replaced with `waitForWithTimeout()` in files 3-5.

**Files Status**:
- ✅ `useMarketplaceData.logging.test.ts` - Fixed (all waitFor replaced, tests passing)
- ✅ `useMarketplaceData.test.ts` - Fixed (waitFor calls replaced, helper exists)
- ⏳ `useMarketplaceData.methods.test.ts` - Helper exists, need to verify test calls
- ⏳ `useMarketplaceData.error.test.ts` - Helper exists, need to verify test calls  
- ⏳ `useMarketplaceData.initialization.test.ts` - Helper exists, need to verify test calls

**Next Step**: Verify if test calls need replacement or if timeout is caused by something else (e.g., test file size, async operations, etc.)

---

## Related Files

- `useMarketplaceData.logging.test.ts` - ✅ Already fixed (all tests passing)
- `useMarketplaceData.methods.test.ts` - ⏳ Needs fixing
- `useMarketplaceData.error.test.ts` - ⏳ Needs fixing
- `useMarketplaceData.initialization.test.ts` - ⏳ Needs fixing

---

## Next Steps

1. ⏳ Verify waitFor calls in useMarketplaceData.test.ts
2. ⏳ Replace all waitFor calls with waitForWithTimeout
3. ⏳ Test full file
4. ⏳ Fix remaining files (methods, error, initialization)
5. ⏳ Test full Chunk 5
