# Failing Tests Summary

**Date**: 2026-01-26  
**Status**: Analysis Complete

---

## Quick Reference

- **File**: `hooks/execution/useWebSocket.mutation.advanced.test.ts`
- **Total Tests**: 347
- **Failing Tests**: 3 (0.9%)
- **Passing Tests**: 344 (99.1%)
- **Analysis Document**: `FAILING_TESTS_ANALYSIS.md`

---

## The 3 Failing Tests

### 1. `should verify currentStatus = executionStatus || lastKnownStatusRef.current - lastKnownStatusRef path`
- **Line**: 551
- **Issue**: Test logic may need adjustment - needs to clear `executionStatus` before closing
- **Fix**: Clear `executionStatus` to `undefined` before closing connection

### 2. `should verify reconnectAttempts.current < maxReconnectAttempts && executionId - executionId is null`
- **Line**: 705
- **Issue**: Missing `rerender` destructuring - **CLEAR BUG**
- **Fix**: Add `const { rerender } = renderHook(...)`

### 3. `should verify executionStatus || lastKnownStatusRef.current - executionStatus is falsy`
- **Line**: 3319
- **Issue**: Test assertion too weak - needs more specific verification
- **Fix**: Add specific assertions to verify `lastKnownStatus` is being used

---

## Quick Fixes

### Fix 1: Test 2 (Missing rerender) - **HIGH PRIORITY**
```typescript
// Line 708 - Change from:
renderHook(
  ({ executionId }) => useWebSocket({...}),
  { initialProps: { executionId: 'exec-1' } }
)

// To:
const { rerender } = renderHook(
  ({ executionId }) => useWebSocket({...}),
  { initialProps: { executionId: 'exec-1' } }
)
```

### Fix 2: Test 1 (Test logic)
```typescript
// After line 573, add:
rerender({ executionStatus: undefined })
await advanceTimersByTime(50)
```

### Fix 3: Test 3 (Better assertions)
```typescript
// Replace final assertion with:
if (wsInstances.length > 0) {
  const ws = wsInstances[0]
  await act(async () => {
    ws.simulateOpen()
    await advanceTimersByTime(50)
  })
  await act(async () => {
    ws.simulateClose(1001, '', false)
    await advanceTimersByTime(50)
  })
  expect(logger.debug).toHaveBeenCalledWith(
    expect.stringContaining('Reconnecting in')
  )
}
```

---

## Implementation Notes

The code uses `logicalOr(executionStatus, lastKnownStatus)` to determine current status:
- If `executionStatus` is truthy → uses `executionStatus`
- If `executionStatus` is falsy → uses `lastKnownStatus`

This is correct behavior, but the tests need to account for this logic.

---

## Next Steps

1. ✅ **Analysis Complete** - See `FAILING_TESTS_ANALYSIS.md` for details
2. ⏳ **Apply Fixes** - Start with Test 2 (easiest fix)
3. ⏳ **Verify Tests** - Run tests individually after each fix
4. ⏳ **Run Full Suite** - Ensure no regressions

---

**See `FAILING_TESTS_ANALYSIS.md` for complete analysis, root causes, and detailed solutions.**
