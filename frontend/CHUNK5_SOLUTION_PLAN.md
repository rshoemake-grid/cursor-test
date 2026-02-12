# Chunk 5 Solution Plan

**Date**: 2026-01-26  
**File**: `useMarketplaceData.test.ts`  
**Status**: 🔧 SOLUTION APPLIED

---

## 🎯 Problem

File hangs during test execution (not just cleanup). With 166 tests and 5003 lines, timer accumulation and async complexity cause hangs.

---

## ✅ Solution Applied

### Improved Timer Cleanup
**Change**: More aggressive cleanup in `afterEach`

**Before**:
- Max 50 iterations
- Only clears if limit reached

**After**:
- Max 10 iterations (reduced)
- Always calls `jest.clearAllTimers()` at end
- More aggressive cleanup

**Code**:
```typescript
afterEach(() => {
  if (jest.isMockFunction(setTimeout)) {
    try {
      let iterations = 0
      const maxIterations = 10 // Reduced limit
      while (jest.getTimerCount() > 0 && iterations < maxIterations) {
        jest.runOnlyPendingTimers()
        iterations++
      }
      // Always clear all timers at the end
      jest.clearAllTimers()
    } catch (e) {
      jest.clearAllTimers()
    }
  }
  jest.useRealTimers()
})
```

---

## 🔧 Additional Recommendations

### Short-term (If Still Hanging)
1. **Reduce maxIterations further** (to 5)
2. **Add test timeout**: `--testTimeout=60000`
3. **Run tests in smaller batches**

### Long-term (Best Solution)
**Split File**: Break 5003-line file into smaller files:
- `useMarketplaceData.basic.test.ts` (~1000 lines)
- `useMarketplaceData.advanced.test.ts` (~1000 lines)
- `useMarketplaceData.edge.test.ts` (~1000 lines)
- `useMarketplaceData.integration.test.ts` (~2000 lines)

**Benefits**:
- Faster execution
- Easier debugging
- Better isolation
- Prevents timer accumulation

---

## 📊 Testing Strategy

### Test Individual Sections
1. Comment out large sections
2. Test remaining sections
3. Identify which section hangs
4. Fix that section
5. Repeat

### Alternative: Skip Problematic Tests
If file still hangs:
- Use `.skip` for problematic tests temporarily
- Document which tests are skipped
- Fix incrementally

---

## 🎯 Next Steps

1. ✅ **Applied**: Improved timer cleanup
2. ⏳ **Test**: Run file to verify fix
3. ⏳ **If Still Hanging**: Consider splitting file
4. ⏳ **Long-term**: Split into smaller files

---

**Status**: Solution applied, ready for testing
