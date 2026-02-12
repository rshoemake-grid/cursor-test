# Chunk 5 Hang - Root Cause Analysis

**Date**: 2026-01-26  
**File**: `useMarketplaceData.test.ts`  
**Status**: 🔍 ROOT CAUSE IDENTIFIED

---

## 🎯 Root Cause

**Infinite Loop in `afterEach` Cleanup**

The file has a `while` loop in the `afterEach` hook (lines 4994-4996) that can hang indefinitely:

```typescript
afterEach(() => {
  // Clean up any pending timers to prevent memory leaks
  if (jest.isMockFunction(setTimeout)) {
    try {
      while (jest.getTimerCount() > 0) {
        jest.runOnlyPendingTimers()
      }
    } catch (e) {
      // Ignore errors - timers might already be cleared
    }
  }
  jest.useRealTimers()
})
```

---

## 🔍 Problem Analysis

### Why It Hangs

1. **Infinite Loop Risk**: The `while (jest.getTimerCount() > 0)` loop can run indefinitely if:
   - `jest.runOnlyPendingTimers()` creates new timers
   - Timers are created faster than they're cleared
   - Some timers never complete

2. **Timer Creation During Cleanup**: When `waitForWithTimeoutFakeTimers` is called, it:
   - Switches to real timers temporarily
   - Uses `setTimeout(resolve, 10)` (line 84 in waitForWithTimeout.ts)
   - Switches back to fake timers
   - This creates timers that might not be cleared properly

3. **Large File Complexity**: With 166 tests and 5003 lines:
   - Many async operations
   - Multiple `waitForWithTimeout` calls
   - Complex timer interactions
   - Accumulated timer state

---

## 💡 Solution Options

### Solution 1: Add Maximum Iterations (RECOMMENDED)
**Risk**: Low  
**Effort**: Low  
**Effectiveness**: High

Add a maximum iteration limit to prevent infinite loops:

```typescript
afterEach(() => {
  if (jest.isMockFunction(setTimeout)) {
    try {
      let iterations = 0
      const maxIterations = 100 // Prevent infinite loop
      while (jest.getTimerCount() > 0 && iterations < maxIterations) {
        jest.runOnlyPendingTimers()
        iterations++
      }
      if (iterations >= maxIterations) {
        console.warn('Timer cleanup reached max iterations - some timers may remain')
      }
    } catch (e) {
      // Ignore errors
    }
  }
  jest.useRealTimers()
})
```

### Solution 2: Use `jest.clearAllTimers()`
**Risk**: Medium  
**Effort**: Low  
**Effectiveness**: Medium

Replace the while loop with `jest.clearAllTimers()`:

```typescript
afterEach(() => {
  if (jest.isMockFunction(setTimeout)) {
    try {
      jest.clearAllTimers()
    } catch (e) {
      // Ignore errors
    }
  }
  jest.useRealTimers()
})
```

**Note**: This is more aggressive and might skip some timer callbacks.

### Solution 3: Remove Timer Cleanup (If Not Needed)
**Risk**: Low  
**Effort**: Low  
**Effectiveness**: Depends

If timer cleanup isn't critical, remove the while loop:

```typescript
afterEach(() => {
  jest.useRealTimers()
})
```

**Note**: May leave some timers pending, but won't hang.

### Solution 4: Split File into Smaller Files
**Risk**: Low  
**Effort**: High  
**Effectiveness**: High

Split the 5003-line file into smaller, manageable files:
- `useMarketplaceData.basic.test.ts`
- `useMarketplaceData.advanced.test.ts`
- `useMarketplaceData.edge.test.ts`
- etc.

**Benefits**:
- Easier to debug
- Faster test execution
- Better isolation
- Prevents timer accumulation

---

## 🎯 Recommended Approach

**Combination of Solution 1 + Solution 4**:

1. **Immediate Fix**: Add maximum iterations to prevent hang
2. **Long-term**: Split file into smaller files

---

## 📊 File Statistics

- **Total Lines**: 5,003
- **Number of Tests**: 166
- **Test Suites**: Multiple nested `describe` blocks
- **Timer Usage**: `jest.useFakeTimers()` in `beforeEach`
- **Cleanup**: Complex `afterEach` with while loop

---

## 🔧 Implementation Plan

### Step 1: Apply Immediate Fix
1. Add maximum iterations to while loop
2. Test file individually
3. Verify no hanging

### Step 2: Verify Fix
1. Run file: `npm test -- --testPathPatterns="useMarketplaceData.test.ts"`
2. Check execution time
3. Verify all tests pass

### Step 3: Long-term (Optional)
1. Plan file split strategy
2. Identify logical groupings
3. Split file gradually
4. Test each new file

---

**Status**: Root cause identified, solution ready to implement
