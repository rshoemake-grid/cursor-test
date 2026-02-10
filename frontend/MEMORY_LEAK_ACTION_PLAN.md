# Memory Leak Investigation & Fix Action Plan

## Current Status
- ✅ OOM detection added to monitoring script
- ✅ Unhandled promise rejection detection added
- ⚠️ 12 out-of-memory errors detected so far
- ⚠️ 12 unhandled promise rejections detected (some with null reason - expected during mutation testing)
- ⚠️ Memory leaks causing ~30-60 second delays per restart
- 📊 Mutation testing at ~52% (3973/7510 tested)

---

## Phase 1: Investigation & Identification

### Step 1.0: Handle Unhandled Promise Rejections (COMPLETED)
**Goal**: Prevent unhandled promise rejections from crashing test processes

#### Substeps:
1.0.1. ✅ Enhanced `setup-jest.ts` to handle null/undefined rejections
   - Added handling for `null`, `undefined`, and empty string rejections
   - These are common during mutation testing when mutants cause unexpected rejections

1.0.2. ✅ Updated monitoring script to categorize rejections
   - Distinguishes between null rejections (expected) and non-null (may indicate issues)
   - Alerts if rejection count exceeds 10

1.0.3. ✅ Added graceful handling to prevent process crashes
   - Rejections are now handled gracefully without crashing child processes

**Status**: ✅ **COMPLETED** - Unhandled rejections are now handled gracefully

---

### Step 1.1: Identify Which Tests Are Running During OOM
**Goal**: Find which test files/mutants trigger memory leaks

#### Substeps:
1.1.1. Extract OOM timestamps from log
   ```bash
   grep -n "ran out of memory" mutation-test-output.log > oom-timestamps.txt
   ```

1.1.2. Extract test context before each OOM (last 50 lines before each OOM)
   ```bash
   # For each OOM, get context
   awk '/ran out of memory/ {for(i=NR-50; i<NR; i++) print i":" $0}' mutation-test-output.log > oom-context.txt
   ```

1.1.3. Identify patterns:
   - Which test files are mentioned before OOM?
   - Are there specific mutants that consistently cause OOM?
   - Is there a pattern (e.g., always after X tests)?

1.1.4. Create summary report of suspected test files

---

### Step 1.2: Analyze Test File Patterns
**Goal**: Identify common memory leak patterns in test files

#### Substeps:
1.2.1. Check for uncleaned timers
   ```bash
   # Find tests using timers without cleanup
   grep -r "setTimeout\|setInterval" src --include="*.test.ts" --include="*.test.tsx" | \
     grep -v "clearTimeout\|clearInterval\|jest.useFakeTimers\|jest.runOnlyPendingTimers\|afterEach" > timer-leaks.txt
   ```

1.2.2. Check for event listeners not removed
   ```bash
   # Find addEventListener without removeEventListener
   grep -r "addEventListener" src --include="*.test.ts" --include="*.test.tsx" | \
     grep -v "removeEventListener\|afterEach" > listener-leaks.txt
   ```

1.2.3. Check for WebSocket connections not closed
   ```bash
   # Find WebSocket usage
   grep -r "new WebSocket\|WebSocket\|wsInstances" src --include="*.test.ts" | \
     grep -v "\.close()\|afterEach\|wsInstances\.splice" > websocket-leaks.txt
   ```

1.2.4. Check for missing afterEach cleanup
   ```bash
   # Find test files without afterEach
   find src -name "*.test.ts" -o -name "*.test.tsx" | \
     xargs grep -L "afterEach" > missing-cleanup.txt
   ```

1.2.5. Review large test files (potential accumulation)
   ```bash
   # Find largest test files
   find src -name "*.test.ts" -o -name "*.test.tsx" | \
     xargs wc -l | sort -rn | head -10 > largest-tests.txt
   ```

---

### Step 1.3: Review Global Test Setup
**Goal**: Ensure global cleanup is working correctly

#### Substeps:
1.3.1. Review `src/test/setup-jest.ts`
   - Verify timer cleanup logic is correct
   - Check if it handles all edge cases
   - Ensure it runs for all tests

1.3.2. Test global cleanup effectiveness
   - Add logging to verify cleanup runs
   - Check if cleanup is being called for all test files

1.3.3. Identify gaps in global cleanup
   - What cleanup is missing?
   - What should be added?

---

## Phase 2: Fix Memory Leaks

### Step 2.1: Fix Timer Leaks
**Goal**: Ensure all timers are properly cleaned up

#### Substeps:
2.1.1. For each test file with timer leaks (from 1.2.1):
   - Add `jest.useFakeTimers()` in `beforeEach`
   - Add `jest.runOnlyPendingTimers()` in `afterEach`
   - Add `jest.useRealTimers()` in `afterEach`
   - Verify all timers are cleared

2.1.2. Review timer adapter tests
   - Check `types/adapters.test.ts`
   - Ensure cleanup is working

2.1.3. Test fixes
   - Run affected test files individually
   - Verify no memory leaks

---

### Step 2.2: Fix Event Listener Leaks
**Goal**: Ensure all event listeners are removed

#### Substeps:
2.2.1. For each test file with listener leaks (from 1.2.2):
   - Track listeners added in tests
   - Add `removeEventListener` calls in `afterEach`
   - Verify cleanup

2.2.2. Review component tests with listeners:
   - `NodePanel.test.tsx` - Verify cleanup
   - `WorkflowBuilder.test.tsx` - Verify cleanup
   - `MarketplaceDialog.test.tsx` - Verify cleanup

2.2.3. Test fixes
   - Run affected test files
   - Verify listeners are removed

---

### Step 2.3: Fix WebSocket Leaks
**Goal**: Ensure all WebSocket connections are closed

#### Substeps:
2.3.1. Review WebSocket test setup (`useWebSocket.test.setup.ts`)
   - Verify `wsInstances` cleanup is working
   - Check if all instances are being tracked

2.3.2. Review WebSocket test files:
   - `useWebSocket.cleanup.test.ts` - Verify cleanup logic
   - `useWebSocket.reconnection.test.ts` - Verify cleanup
   - `useWebSocket.mutation.*.test.ts` - Check large files
   - `useWebSocket.edges.*.test.ts` - Check comprehensive tests

2.3.3. Fix each WebSocket test file:
   - Ensure `wsInstances.splice(0, wsInstances.length)` in `afterEach`
   - Ensure `ws.close()` is called for all instances
   - Verify `jest.useRealTimers()` is called

2.3.4. Test fixes
   - Run WebSocket tests individually
   - Monitor memory usage

---

### Step 2.4: Fix Missing Cleanup Hooks
**Goal**: Add `afterEach` cleanup to all test files that need it

#### Substeps:
2.4.1. For each test file without `afterEach` (from 1.2.4):
   - Review what cleanup is needed
   - Add appropriate `afterEach` hook
   - Include:
     - Timer cleanup (if using timers)
     - Mock cleanup (if needed)
     - Component unmounting
     - State reset

2.4.2. Review large test files (from 1.2.5):
   - Check for accumulation patterns
   - Add cleanup for:
     - Mock instances
     - Component instances
     - State objects
     - Event listeners

2.4.3. Test fixes
   - Run each fixed test file
   - Verify cleanup works

---

### Step 2.5: Enhance Global Cleanup
**Goal**: Improve global test setup cleanup

#### Substeps:
2.5.1. Enhance `src/test/setup-jest.ts`:
   - Add WebSocket instance cleanup (if possible globally)
   - Add event listener cleanup tracking
   - Add mock instance cleanup
   - Improve timer cleanup robustness

2.5.2. Add global cleanup utilities:
   - Create helper functions for common cleanup tasks
   - Document usage in test files

2.5.3. Test global cleanup:
   - Run full test suite
   - Monitor memory usage
   - Verify improvements

---

## Phase 3: Verification & Optimization

### Step 3.1: Test Memory Leak Fixes
**Goal**: Verify fixes work and don't break tests

#### Substeps:
3.1.1. Run individual test files that were fixed
   - Verify tests still pass
   - Check for any regressions

3.1.2. Run full test suite
   - Ensure all tests pass
   - Monitor for new issues

3.1.3. Run mutation testing on fixed files
   - Verify no OOM errors for fixed files
   - Check performance improvement

---

### Step 3.2: Monitor Memory Usage
**Goal**: Track memory usage during testing

#### Substeps:
3.2.1. Add memory monitoring to test runs
   ```bash
   # Run tests with memory profiling
   NODE_OPTIONS="--max-old-space-size=2048 --expose-gc" npm test
   ```

3.2.2. Compare memory usage:
   - Before fixes
   - After fixes
   - Track improvement

3.2.3. Identify remaining issues
   - If OOM still occurs, investigate further
   - Check if fixes are effective

---

### Step 3.3: Optimize Test Performance
**Goal**: Improve overall test performance

#### Substeps:
3.3.1. Review test execution time
   - Identify slow tests
   - Optimize where possible

3.3.2. Consider increasing memory limit temporarily
   ```bash
   # If leaks can't be fully fixed immediately
   NODE_OPTIONS="--max-old-space-size=4096" npm run test:mutation
   ```

3.3.3. Document best practices
   - Create test cleanup guidelines
   - Add to test template

---

## Phase 4: Long-term Prevention

### Step 4.1: Add Memory Leak Detection to CI
**Goal**: Prevent future memory leaks

#### Substeps:
4.1.1. Add memory monitoring to CI pipeline
   - Set memory limits
   - Fail if exceeded

4.1.2. Add linting rules
   - Check for common leak patterns
   - Warn on missing cleanup

4.1.3. Add test review checklist
   - Include cleanup verification
   - Review in PR process

---

### Step 4.2: Create Test Cleanup Template
**Goal**: Standardize test cleanup

#### Substeps:
4.2.1. Create test file template with cleanup
   - Include standard `beforeEach`/`afterEach`
   - Document cleanup patterns

4.2.2. Update existing tests to use template
   - Gradually migrate tests
   - Ensure consistency

---

## Priority Order

### High Priority (Do First)
1. **Step 1.1**: Identify which tests trigger OOM
2. **Step 1.2.3**: Check WebSocket cleanup (12 OOM errors suggest this is likely)
3. **Step 2.3**: Fix WebSocket leaks (most likely culprit)
4. **Step 3.1**: Verify fixes work

### Medium Priority (Do Next)
1. **Step 1.2.1**: Check timer leaks
2. **Step 2.1**: Fix timer leaks
3. **Step 1.2.2**: Check event listener leaks
4. **Step 2.2**: Fix event listener leaks

### Low Priority (Do Later)
1. **Step 2.4**: Fix missing cleanup hooks
2. **Step 2.5**: Enhance global cleanup
3. **Step 4.1**: Add CI prevention
4. **Step 4.2**: Create templates

---

## Quick Wins (Start Here)

### Immediate Actions:
1. ✅ **DONE**: Enhanced monitoring script detects OOM
2. **TODO**: Check WebSocket test cleanup (most likely issue)
3. **TODO**: Review large mutation test files
4. **TODO**: Verify `wsInstances` cleanup in all WebSocket tests

### Expected Impact:
- Fixing WebSocket leaks: **High** (likely causing most OOM errors)
- Fixing timer leaks: **Medium** (common issue)
- Fixing event listeners: **Low-Medium** (less common)
- Adding missing cleanup: **Low** (preventive)

---

## Success Metrics

- ✅ Zero OOM errors during mutation testing
- ✅ Mutation testing completes without restarts
- ✅ Test execution time improves (less restart overhead)
- ✅ Memory usage stays stable during test runs

---

## Notes

- Current mutation testing is at 52% - prioritize fixes that won't require restarting
- 12 OOM errors detected - likely pattern-based (same type of leak)
- Focus on WebSocket tests first (most complex, most likely to leak)
- Monitor `mutation-crash-detection.log` for ongoing OOM detection
