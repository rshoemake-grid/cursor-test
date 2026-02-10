# Memory Leak Investigation Guide

## Detected Issue

Test runner processes are running out of memory during mutation testing. Stryker will restart the process, but this significantly decreases performance.

## Common Causes of Memory Leaks in Tests

### 1. Uncleaned Timers
- **Problem**: `setTimeout` or `setInterval` not cleared in `afterEach`
- **Solution**: Always use `jest.useFakeTimers()` and `jest.runOnlyPendingTimers()` in cleanup
- **Check**: Look for tests that use timers without proper cleanup

### 2. Event Listeners Not Removed
- **Problem**: `addEventListener` without corresponding `removeEventListener`
- **Solution**: Track listeners and remove them in `afterEach` or component cleanup
- **Check**: Look for `addEventListener` calls in tests or components

### 3. WebSocket Connections Not Closed
- **Problem**: WebSocket instances not properly closed after tests
- **Solution**: Ensure `ws.close()` is called in cleanup
- **Check**: Review `useWebSocket` tests and ensure cleanup is working

### 4. Mock Instances Accumulating
- **Problem**: Mock objects/instances accumulating across tests
- **Solution**: Clear mock instances in `beforeEach`/`afterEach`
- **Check**: Review test setup files for proper mock cleanup

### 5. React Component Memory Leaks
- **Problem**: Components not unmounted properly
- **Solution**: Always unmount components in `afterEach`
- **Check**: Ensure `unmount()` is called for all rendered components

## Investigation Steps

### Step 1: Identify Which Tests Are Running When OOM Occurs

Check the mutation test log around the time of OOM:
```bash
grep -B 20 "ran out of memory" frontend/mutation-test-output.log
```

### Step 2: Check for Common Patterns

#### Check for uncleaned timers:
```bash
grep -r "setTimeout\|setInterval" frontend/src --include="*.test.ts" --include="*.test.tsx" | grep -v "clearTimeout\|clearInterval\|jest.useFakeTimers\|jest.runOnlyPendingTimers"
```

#### Check for event listeners:
```bash
grep -r "addEventListener" frontend/src --include="*.test.ts" --include="*.test.tsx" | grep -v "removeEventListener"
```

#### Check for WebSocket instances:
```bash
grep -r "new WebSocket\|WebSocket\|wsInstances" frontend/src --include="*.test.ts" | head -20
```

### Step 3: Review Test Cleanup

Check that all test files have proper cleanup:

```bash
# Find test files without afterEach cleanup
find frontend/src -name "*.test.ts" -o -name "*.test.tsx" | xargs grep -L "afterEach"
```

### Step 4: Check Global Test Setup

Review `frontend/src/test/setup-jest.ts` - it already has timer cleanup, but verify it's working correctly.

## Files to Review

Based on codebase analysis, these files use timers/events/WebSockets and should be checked:

1. **useWebSocket tests** - Multiple test files with WebSocket connections
   - `useWebSocket.cleanup.test.ts` - Has cleanup, verify it's working
   - `useWebSocket.reconnection.test.ts` - Uses timers, verify cleanup
   - `useWebSocket.mutation.*.test.ts` - Large mutation test files
   - `useWebSocket.edges.*.test.ts` - Comprehensive edge case tests

2. **Timer adapter tests** - `types/adapters.test.ts`
   - Uses fake timers, verify cleanup

3. **Component tests with event listeners**
   - `NodePanel.test.tsx` - Uses `addEventListener`/`removeEventListener`
   - `WorkflowBuilder.test.tsx` - Uses event listeners

## Quick Fixes

### Fix 1: Ensure All Timer Tests Clean Up

**Current pattern (may not be sufficient):**
```typescript
afterEach(() => {
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
})
```

**Enhanced pattern (handles recursive timers):**
```typescript
afterEach(() => {
  // Run all pending timers multiple times to catch recursive timers
  let timerCount = jest.getTimerCount()
  let iterations = 0
  while (timerCount > 0 && iterations < 10) {
    jest.runOnlyPendingTimers()
    const newCount = jest.getTimerCount()
    if (newCount === timerCount) break // No progress
    timerCount = newCount
    iterations++
  }
  jest.useRealTimers()
})
```

### Fix 2: Ensure WebSocket Tests Clean Up

**Current pattern:**
```typescript
afterEach(() => {
  jest.runOnlyPendingTimers()
  wsInstances.splice(0, wsInstances.length)
  jest.useRealTimers()
})
```

**Enhanced pattern (explicitly close WebSockets):**
```typescript
afterEach(() => {
  // Close all WebSocket instances
  wsInstances.forEach(ws => {
    if (ws.readyState !== MockWebSocket.CLOSED) {
      ws.close()
    }
  })
  wsInstances.splice(0, wsInstances.length)
  
  // Clean up timers
  let timerCount = jest.getTimerCount()
  let iterations = 0
  while (timerCount > 0 && iterations < 10) {
    jest.runOnlyPendingTimers()
    const newCount = jest.getTimerCount()
    if (newCount === timerCount) break
    timerCount = newCount
    iterations++
  }
  jest.useRealTimers()
})
```

### Fix 3: Increase Node Memory Limit (Temporary)

If leaks can't be fixed immediately, increase memory for mutation testing:
```bash
# In package.json mutation test script:
NODE_OPTIONS="--max-old-space-size=4096" npm run test:mutation
```

## Monitoring

The enhanced monitoring script will now:
- ✅ Detect "ran out of memory" messages
- ✅ Count how many times it happens
- ✅ Alert if it happens more than 5 times
- ✅ Log the errors for investigation

Check `frontend/mutation-crash-detection.log` for memory leak alerts.
