# Memory Leak Status Report

## Current Situation

**OOM Occurrences**: 12 detected so far  
**Status**: ⚠️ Memory leaks detected - impacting performance  
**Impact**: Each restart adds ~30-60 seconds overhead (estimated ~9 minutes lost so far)

## Analysis Results

### Key Findings

1. **186 test files** use timers (setTimeout/setInterval) - need cleanup verification
2. **153 instances** of addEventListener without removeEventListener
3. **26 WebSocket test files** - high risk for leaks
4. **239 test files** without afterEach cleanup hooks
5. **Large test files** (potential leak sources):
   - `useWorkflowExecution.test.ts` (7,181 lines)
   - `useWebSocket.mutation.advanced.test.ts` (5,421 lines)
   - `useMarketplaceData.test.ts` (4,983 lines)

### OOM Pattern

OOM errors are occurring frequently (3 times in 9 seconds at one point), suggesting:
- Accumulating memory leaks across many test runs
- Possible issues with WebSocket connection cleanup
- Timer cleanup issues in mutation tests

## Immediate Actions

### 1. Priority: WebSocket Tests (High Risk)

Review these files first (they use WebSocket and are large):
- `src/hooks/execution/useWebSocket.mutation.advanced.test.ts` (5,421 lines)
- `src/hooks/execution/useWebSocket.edges.comprehensive.2.test.ts` (3,638 lines)
- `src/hooks/execution/useWebSocket.cleanup.test.ts`
- `src/hooks/execution/useWebSocket.reconnection.test.ts`

**Check for**:
- WebSocket instances not closed in afterEach
- wsInstances array not cleared
- Timers not cleaned up after WebSocket tests

### 2. Priority: Large Test Files

Review the largest test files for proper cleanup:
- `useWorkflowExecution.test.ts` (7,181 lines)
- `useMarketplaceData.test.ts` (4,983 lines)
- `InputNodeEditor.test.tsx` (4,947 lines)

### 3. Quick Wins

Files with obvious issues:
- `src/types/adapters.test.ts` - Uses setTimeout/setInterval, verify cleanup
- `src/utils/confirm.mutation.enhanced.test.ts` - Uses setTimeout without cleanup

## Monitoring

The enhanced monitoring script now:
- ✅ Tracks OOM count
- ✅ Estimates time lost to restarts
- ✅ Alerts when OOM count > 5
- ✅ Shows context around OOM occurrences
- ✅ Logs to `mutation-crash-detection.log`

## Next Steps

1. **Run analysis**: `./analyze-memory-leaks.sh` (already done)
2. **Review WebSocket tests** - Start with the largest ones
3. **Add cleanup** - Ensure all WebSocket tests close connections
4. **Verify timer cleanup** - Check all timer-using tests
5. **Monitor progress** - Watch `mutation-crash-detection.log` for improvements

## Temporary Workaround

If leaks can't be fixed immediately, increase Node memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run test:mutation
```

This buys time but doesn't fix the root cause.

## Files to Review

### High Priority (WebSocket + Large)
1. `src/hooks/execution/useWebSocket.mutation.advanced.test.ts`
2. `src/hooks/execution/useWebSocket.edges.comprehensive.2.test.ts`
3. `src/hooks/execution/useWorkflowExecution.test.ts`

### Medium Priority (Large Files)
4. `src/hooks/marketplace/useMarketplaceData.test.ts`
5. `src/components/editors/InputNodeEditor.test.tsx`
6. `src/hooks/marketplace/useMarketplaceIntegration.test.ts`

### Quick Fixes (Small Issues)
7. `src/types/adapters.test.ts`
8. `src/utils/confirm.mutation.enhanced.test.ts`

## Investigation Commands

```bash
# Check OOM occurrences
grep -c "ran out of memory" mutation-test-output.log

# See OOM context
grep -B 15 "ran out of memory" mutation-test-output.log | tail -20

# Check WebSocket cleanup
grep -A 5 "afterEach" src/hooks/execution/useWebSocket.*.test.ts | grep -E "close|wsInstances|cleanup"

# Check timer cleanup
grep -B 2 -A 5 "setTimeout\|setInterval" src/hooks/execution/useWebSocket.*.test.ts | grep -E "afterEach|jest.useRealTimers|clearTimeout|clearInterval"
```
