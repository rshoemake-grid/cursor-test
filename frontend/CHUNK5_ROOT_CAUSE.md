# Chunk 5 Root Cause Analysis

**Date**: 2026-01-26  
**File**: `useMarketplaceData.test.ts`  
**Status**: ✅ ROOT CAUSE IDENTIFIED

---

## 🔍 Root Cause

**Infinite Loop in `afterEach` Cleanup** (Lines 4994-4996)

```typescript
afterEach(() => {
  // Clean up any pending timers to prevent memory leaks
  if (jest.isMockFunction(setTimeout)) {
    try {
      while (jest.getTimerCount() > 0) {  // ← INFINITE LOOP RISK
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

## 🐛 Problem

The `while` loop can hang indefinitely if:

1. **Timers keep getting added**: `jest.runOnlyPendingTimers()` may trigger code that creates new timers
2. **Timer count doesn't decrease**: Some timers may not be cleared by `runOnlyPendingTimers()`
3. **Race condition**: Timers created during cleanup aren't accounted for
4. **Recursive timers**: Timers that schedule other timers can create an infinite loop

---

## 💡 Solution

Replace the `while` loop with a safer approach that has a maximum iteration limit:

```typescript
afterEach(() => {
  // Clean up any pending timers to prevent memory leaks
  if (jest.isMockFunction(setTimeout)) {
    try {
      // Use a limit to prevent infinite loops
      let iterations = 0
      const maxIterations = 100 // Safety limit
      
      while (jest.getTimerCount() > 0 && iterations < maxIterations) {
        jest.runOnlyPendingTimers()
        iterations++
      }
      
      // If we hit the limit, force clear all timers
      if (iterations >= maxIterations) {
        jest.clearAllTimers()
      }
    } catch (e) {
      // Ignore errors - timers might already be cleared
      jest.clearAllTimers() // Force clear on error
    }
  }
  jest.useRealTimers()
})
```

---

## 🔧 Alternative Solutions

### Option 1: Use `clearAllTimers()` Directly
```typescript
afterEach(() => {
  if (jest.isMockFunction(setTimeout)) {
    jest.clearAllTimers() // Safer - clears everything
  }
  jest.useRealTimers()
})
```

### Option 2: Limit Iterations (Recommended)
```typescript
afterEach(() => {
  if (jest.isMockFunction(setTimeout)) {
    let iterations = 0
    const maxIterations = 50
    
    while (jest.getTimerCount() > 0 && iterations < maxIterations) {
      jest.runOnlyPendingTimers()
      iterations++
    }
    
    // Final cleanup
    if (jest.getTimerCount() > 0) {
      jest.clearAllTimers()
    }
  }
  jest.useRealTimers()
})
```

### Option 3: Remove Loop Entirely
```typescript
afterEach(() => {
  // Just clear all timers - simpler and safer
  jest.clearAllTimers()
  jest.useRealTimers()
})
```

---

## 📊 File Analysis

**File Size**: 5,003 lines  
**Number of Tests**: 166 tests  
**Timer Usage**: 
- `jest.useFakeTimers()` in `beforeEach` (line 64)
- `jest.useRealTimers()` in `afterEach` (line 5001)
- `while` loop with `jest.runOnlyPendingTimers()` (lines 4994-4996)

**Issue**: The `while` loop can run indefinitely if timers keep getting added.

---

## ✅ Recommended Fix

**Use Option 2** (Limit Iterations) - It's safer than the current approach but still attempts to run pending timers before clearing.

---

**Status**: Root cause identified, fix ready to apply
