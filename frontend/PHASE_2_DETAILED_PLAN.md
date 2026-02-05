# Phase 2: Timeout Mutations - Detailed Execution Plan

## Overview
**Target:** Eliminate 55 timeout mutations  
**Expected Impact:** +0.8% to +1.0% mutation score  
**Time Estimate:** 1-2 days

---

## Root Cause Analysis

### Timeout Mutation Causes
1. **Infinite Loops** - Mutated while/for loops without termination
2. **Unbounded Intervals** - setInterval without max iterations
3. **Invalid Delays** - setTimeout with 0 or negative delays
4. **Recursive Calls** - Functions calling themselves without guards
5. **Promise Chains** - Promises that never resolve/reject

---

## Files to Fix

### 1. `useExecutionPolling.ts` ✅ PARTIALLY FIXED

#### Current Status
- ✅ Added `safePollInterval` guard
- ✅ Added execution limit (max 50)
- ✅ Enhanced null checks

#### Remaining Work
- [ ] Add max iteration counter to prevent infinite polling
- [ ] Add test for max iteration limit
- [ ] Add test for invalid poll interval handling

#### Code Changes Needed
```typescript
// Add max iterations guard
let iterationCount = 0
const MAX_ITERATIONS = 1000

const interval = setInterval(async () => {
  iterationCount++
  if (iterationCount > MAX_ITERATIONS) {
    injectedLogger.warn('[WorkflowTabs] Max polling iterations reached, stopping')
    clearInterval(interval)
    return
  }
  // ... existing code
}, safePollInterval)
```

#### Tests to Add
```typescript
describe('Timeout guards', () => {
  it('should stop polling after max iterations', () => {
    // Test max iteration limit
  })
  
  it('should handle invalid poll interval', () => {
    // Test interval clamping
  })
})
```

---

### 2. `WebSocketConnectionManager.ts` ✅ PARTIALLY FIXED

#### Current Status
- ✅ Added early return before incrementing reconnectAttempts
- ✅ Added `safeDelay` guard
- ✅ Added timeout clearing

#### Remaining Work
- [ ] Verify reconnection logic is fully guarded
- [ ] Add test for max reconnection attempts
- [ ] Add test for invalid delay handling

#### Tests to Add
```typescript
describe('Reconnection timeout guards', () => {
  it('should stop reconnecting after max attempts', () => {
    // Test max attempts limit
  })
  
  it('should handle invalid delay values', () => {
    // Test delay clamping
  })
  
  it('should clear timeout before setting new one', () => {
    // Test timeout clearing
  })
})
```

---

### 3. `useAsyncOperation.ts` (If exists)

#### Check For
- Promise chains without timeout
- Retry logic without max attempts
- Async operations without guards

#### Action Items
- [ ] Review file for timeout risks
- [ ] Add timeout guards if needed
- [ ] Add max retry limits if needed

---

### 4. `useDataFetching.ts` (If exists)

#### Check For
- Infinite retry loops
- Fetch operations without timeout
- Polling without limits

#### Action Items
- [ ] Review file for timeout risks
- [ ] Add retry limits if needed
- [ ] Add timeout guards if needed

---

### 5. Search for Other Timeout Risks

#### Files to Search
```bash
# Find all setInterval usage
grep -r "setInterval" src/

# Find all setTimeout usage
grep -r "setTimeout" src/

# Find all while loops
grep -r "while (" src/

# Find all for loops with no condition
grep -r "for (.*;;" src/
```

#### Action Items
- [ ] Review each file found
- [ ] Add guards where needed
- [ ] Add tests for guards

---

## Execution Steps

### Step 1: Complete Existing Fixes
1. Add max iteration counter to `useExecutionPolling.ts`
2. Add tests for timeout guards
3. Verify all guards work correctly

### Step 2: Search and Fix Other Files
1. Search for timeout risk patterns
2. Review each file
3. Add guards where needed
4. Add tests

### Step 3: Verify All Fixes
1. Run unit tests
2. Check for any remaining timeout risks
3. Document fixes

---

## Test Strategy

### Test Patterns
1. **Max Iterations Test**
   - Verify polling stops after max iterations
   - Verify reconnection stops after max attempts

2. **Invalid Value Tests**
   - Test negative intervals
   - Test zero intervals
   - Test very large intervals

3. **Timeout Clearing Tests**
   - Verify timeouts are cleared before setting new ones
   - Verify cleanup on unmount

---

## Success Criteria

- [ ] All setInterval calls have max iteration guards
- [ ] All setTimeout calls have valid delay guards
- [ ] All while loops have termination conditions
- [ ] All recursive calls have depth limits
- [ ] All tests pass
- [ ] No timeout mutations remain

---

## Expected Results

- **Before:** 55 timeout mutations
- **After:** 0 timeout mutations
- **Score Improvement:** +0.8% to +1.0%
