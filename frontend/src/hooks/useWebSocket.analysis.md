# useWebSocket.ts - Coverage Analysis

## File Overview
- **Total Lines**: 285
- **No Coverage Mutants**: 58
- **Existing Tests**: 637 test cases across 13 test files

## Component Breakdown

### 1. connect function (lines 55-208)
**Purpose**: Establish WebSocket connection

**Complex Logic Flow**:
- ✅ Basic connection (tested)
- ✅ Temporary ID handling (tested)
- ✅ Status checks (tested)
- ✅ URL construction (tested)
- ✅ Message handling (tested)
- ✅ Error handling (tested)
- ✅ Reconnection logic (tested)

**Potential Uncovered Paths**:
- ❓ `if (!executionId)` - exact falsy check
- ❓ `executionId.startsWith('pending-')` - exact string method call
- ❓ `executionStatus || lastKnownStatusRef.current` - logical OR operator
- ❓ `currentStatus === 'completed' || currentStatus === 'failed'` - exact comparisons and logical OR
- ❓ `if (wsRef.current)` - exact truthy check
- ❓ `wsRef.current.close()` - exact method call
- ❓ `wsRef.current = null` - exact assignment
- ❓ `windowLocation?.protocol === 'https:'` - optional chaining and exact comparison
- ❓ `protocol = ... ? 'wss:' : 'ws:'` - ternary operator
- ❓ `windowLocation?.host || 'localhost:8000'` - optional chaining and logical OR
- ❓ `ws.onopen = () => {...}` - exact assignment
- ❓ `reconnectAttempts.current = 0` - exact assignment
- ❓ `JSON.parse(event.data)` - exact method call
- ❓ `switch (message.type)` - exact switch statement
- ❓ `case 'log':` - exact case comparison
- ❓ `case 'status':` - exact case comparison
- ❓ `case 'node_update':` - exact case comparison
- ❓ `case 'completion':` - exact case comparison
- ❓ `case 'error':` - exact case comparison
- ❓ `message.log && onLog` - exact logical AND
- ❓ `message.status && onStatus` - exact logical AND
- ❓ `message.node_state && onNodeUpdate` - exact logical AND
- ❓ `(message as any).node_id || message.node_state.node_id` - logical OR
- ❓ `if (nodeId)` - exact truthy check
- ❓ `if (onCompletion)` - exact truthy check
- ❓ `message.error && onError` - exact logical AND
- ❓ `error instanceof Error` - exact instanceof check
- ❓ `wsState === WebSocket.CONNECTING` - exact comparison
- ❓ `wsState === WebSocket.OPEN` - exact comparison
- ❓ `wsState === WebSocket.CLOSING` - exact comparison
- ❓ `wsState === WebSocket.CLOSED` - exact comparison
- ❓ `wsState === ... ? 'CONNECTING' : ...` - ternary chain
- ❓ `event.code` - exact property access
- ❓ `event.reason` - exact property access
- ❓ `event.wasClean` - exact property access
- ❓ `reason && reason.length > 0 ? reason : 'No reason provided'` - logical AND, ternary
- ❓ `executionId && executionId.startsWith('pending-')` - logical AND
- ❓ `currentStatus === 'completed' || currentStatus === 'failed'` - exact comparisons
- ❓ `wasClean && code === 1000` - logical AND and exact comparison
- ❓ `reconnectAttempts.current < maxReconnectAttempts` - exact comparison
- ❓ `reconnectAttempts.current++` - exact increment
- ❓ `Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)` - exact calculations
- ❓ `reconnectAttempts.current >= maxReconnectAttempts` - exact comparison
- ❓ `error instanceof Error ? error.message : 'Failed to create WebSocket connection'` - instanceof check and ternary

### 2. useEffect for status updates (lines 211-230)
**Purpose**: Update connection based on execution status

**Code Paths**:
- ✅ Status updates (tested)
- ✅ Connection closing (tested)

**Potential Uncovered Paths**:
- ❓ `if (executionStatus)` - exact truthy check
- ❓ `executionStatus === 'completed' || executionStatus === 'failed'` - exact comparisons
- ❓ `if (wsRef.current)` - exact truthy check
- ❓ `wsRef.current.close(1000, 'Execution completed')` - exact method call with arguments
- ❓ `if (reconnectTimeoutRef.current)` - exact truthy check
- ❓ `clearTimeout(reconnectTimeoutRef.current)` - exact method call

### 3. useEffect for execution ID changes (lines 232-282)
**Purpose**: Handle execution ID changes and cleanup

**Code Paths**:
- ✅ Execution ID changes (tested)
- ✅ Cleanup (tested)

**Potential Uncovered Paths**:
- ❓ `if (reconnectTimeoutRef.current)` - exact truthy check
- ❓ `clearTimeout(reconnectTimeoutRef.current)` - exact method call
- ❓ `reconnectAttempts.current = 0` - exact assignment
- ❓ `if (executionId)` - exact truthy check
- ❓ `executionId.startsWith('pending-')` - exact string method call
- ❓ `if (wsRef.current)` - exact truthy check
- ❓ `executionStatus || lastKnownStatusRef.current` - logical OR
- ❓ `currentStatus === 'completed' || currentStatus === 'failed'` - exact comparisons
- ❓ `if (wsRef.current)` - exact truthy check (in else branch)
- ❓ `if (reconnectTimeoutRef.current)` - exact truthy check (in cleanup)
- ❓ `if (wsRef.current)` - exact truthy check (in cleanup)

## Identified Gaps (58 no-coverage mutants likely in):

### High Priority:
1. **Exact conditional expressions**:
   - `if (!executionId)` - exact falsy check
   - `if (wsRef.current)` - multiple instances
   - `if (executionStatus)` - exact truthy check
   - `if (nodeId)` - exact truthy check
   - `if (onCompletion)` - exact truthy check
   - `if (reconnectTimeoutRef.current)` - multiple instances

2. **Exact string comparisons**:
   - `executionId.startsWith('pending-')` - exact string literal 'pending-'
   - `windowLocation?.protocol === 'https:'` - exact string literal 'https:'
   - `case 'log':` - exact string literal
   - `case 'status':` - exact string literal
   - `case 'node_update':` - exact string literal
   - `case 'completion':` - exact string literal
   - `case 'error':` - exact string literal
   - `currentStatus === 'completed'` - exact string literal
   - `currentStatus === 'failed'` - exact string literal
   - `executionStatus === 'completed'` - exact string literal
   - `executionStatus === 'failed'` - exact string literal
   - `'Execution completed'` - exact string literal
   - `'No reason provided'` - exact string literal
   - `'Failed to create WebSocket connection'` - exact string literal
   - `'Unknown WebSocket error'` - exact string literal

3. **Exact numeric comparisons**:
   - `code === 1000` - exact numeric comparison
   - `reconnectAttempts.current < maxReconnectAttempts` - exact comparison
   - `reconnectAttempts.current >= maxReconnectAttempts` - exact comparison
   - `maxReconnectAttempts = 5` - exact numeric literal

4. **Exact WebSocket state comparisons**:
   - `wsState === WebSocket.CONNECTING` - exact comparison
   - `wsState === WebSocket.OPEN` - exact comparison
   - `wsState === WebSocket.CLOSING` - exact comparison
   - `wsState === WebSocket.CLOSED` - exact comparison

5. **Logical operators**:
   - `executionStatus || lastKnownStatusRef.current` - logical OR
   - `currentStatus === 'completed' || currentStatus === 'failed'` - logical OR
   - `message.log && onLog` - logical AND
   - `message.status && onStatus` - logical AND
   - `message.node_state && onNodeUpdate` - logical AND
   - `message.error && onError` - logical AND
   - `(message as any).node_id || message.node_state.node_id` - logical OR
   - `windowLocation?.host || 'localhost:8000'` - logical OR
   - `reason && reason.length > 0` - logical AND
   - `executionId && executionId.startsWith('pending-')` - logical AND
   - `wasClean && code === 1000` - logical AND

6. **Ternary operators**:
   - `windowLocation?.protocol === 'https:' ? 'wss:' : 'ws:'` - ternary operator
   - `reason && reason.length > 0 ? reason : 'No reason provided'` - ternary operator
   - `wsState === WebSocket.CONNECTING ? 'CONNECTING' : ...` - ternary chain
   - `error instanceof Error ? error.message : 'Failed to create WebSocket connection'` - ternary operator

7. **Optional chaining**:
   - `windowLocation?.protocol` - optional chaining
   - `windowLocation?.host` - optional chaining

8. **Type checks**:
   - `error instanceof Error` - exact instanceof check

9. **Method calls**:
   - `executionId.startsWith('pending-')` - exact method call
   - `wsRef.current.close()` - exact method call
   - `wsRef.current.close(1000, 'Execution completed')` - exact method call with arguments
   - `JSON.parse(event.data)` - exact method call
   - `clearTimeout(reconnectTimeoutRef.current)` - exact method call
   - `Math.min(...)` - exact method call
   - `Math.pow(...)` - exact method call

10. **Property access**:
    - `event.code` - exact property access
    - `event.reason` - exact property access
    - `event.wasClean` - exact property access
    - `event.data` - exact property access
    - `ws.readyState` - exact property access
    - `reconnectAttempts.current` - exact property access
    - `lastKnownStatusRef.current` - exact property access

11. **Assignments**:
    - `wsRef.current = null` - exact assignment
    - `reconnectAttempts.current = 0` - exact assignment
    - `reconnectAttempts.current++` - exact increment
    - `reconnectTimeoutRef.current = setTimeout(...)` - exact assignment

## Recommended Test Additions:

1. **Exact conditional expression tests**:
   - Test all `if` conditions with exact falsy/truthy values
   - Test all conditional checks independently

2. **Exact string comparison tests**:
   - Test all string literal comparisons
   - Test `startsWith` with exact string literal
   - Test all `case` statements

3. **Exact numeric comparison tests**:
   - Test `code === 1000` with different codes
   - Test reconnect attempts comparisons

4. **Exact WebSocket state tests**:
   - Test all WebSocket state comparisons

5. **Logical operator tests**:
   - Test each logical operator independently
   - Test OR chains with different combinations
   - Test AND chains with different combinations

6. **Ternary operator tests**:
   - Test all ternary operators with both branches

7. **Optional chaining tests**:
   - Test when optional chaining returns undefined

8. **Type check tests**:
   - Test `instanceof Error` with different error types

9. **Method call tests**:
   - Test exact method calls with different arguments

10. **Property access tests**:
    - Test exact property access paths

11. **Assignment tests**:
    - Test exact assignments and increments
