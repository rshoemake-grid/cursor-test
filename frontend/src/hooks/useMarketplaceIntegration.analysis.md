# useMarketplaceIntegration.ts - Coverage Analysis

## File Overview
- **Total Lines**: 196
- **No Coverage Mutants**: 37
- **Existing Tests**: 71 test cases

## Function Breakdown

### 1. `addAgentsToCanvas` (lines 38-107)
**Purpose**: Add agents from marketplace to workflow canvas as nodes

**Code Paths**:
- ✅ Basic agent addition (tested)
- ✅ Node positioning logic (tested)
- ✅ Functional update to setNodes (tested)
- ✅ Draft storage update (tested)

**Potential Uncovered Paths**:
- ❓ `currentNodes.length > 0` vs `=== 0` boundary
- ❓ `Math.max(...currentNodes.map(n => n.position.x))` when nodes array is empty
- ❓ `agent.name || agent.label || 'Agent Node'` - all combinations
- ❓ `agent.description || ''` - description is null/undefined
- ❓ `agent.agent_config || {}` - agent_config is null/undefined
- ❓ `currentDraft?.edges || []` - currentDraft is null/undefined
- ❓ `setTimeout` callbacks execution
- ❓ `isAddingAgentsRef.current` flag reset timing

### 2. `useEffect` - Event Handler & Storage Check (lines 109-190)
**Purpose**: Listen for events and check storage for pending agents

**Complex Logic Flow**:
1. **Event Handler** (lines 110-126):
   - ✅ `handleAddAgentsToWorkflow` event listener (tested)
   - ✅ `targetTabId !== tabId` check (tested)
   - ✅ Event processing (tested)

2. **Storage Check Function** (lines 129-163):
   - ✅ `!storage` early return (tested)
   - ✅ `storage.getItem('pendingAgentsToAdd')` (tested)
   - ✅ `pendingData` null check (tested)
   - ✅ `JSON.parse(pendingData)` (tested)
   - ✅ `pending.tabId === tabId` check (tested)
   - ✅ `Date.now() - pending.timestamp < 10000` check (tested)
   - ✅ `pending.tabId !== tabId` branch (tested)
   - ✅ `Date.now() - pending.timestamp >= 10000` branch (tested)
   - ✅ `catch` block error handling (tested)
   - ✅ `storage.removeItem` calls (tested)

3. **Window Event Listener** (lines 169-171):
   - ✅ `typeof window !== 'undefined'` check (tested)
   - ✅ `addEventListener` (tested)
   - ✅ `removeEventListener` in cleanup (tested)

4. **Interval Check** (lines 174-182):
   - ✅ `setInterval` setup (tested)
   - ✅ `checkCount >= maxChecks` condition (tested)
   - ✅ `clearInterval` in cleanup (tested)

**Potential Uncovered Paths**:
- ❓ `pending.tabId === tabId && Date.now() - pending.timestamp < 10000` - both conditions true
- ❓ `pending.tabId === tabId && Date.now() - pending.timestamp < 10000` - first true, second false
- ❓ `pending.tabId === tabId && Date.now() - pending.timestamp < 10000` - first false
- ❓ `pending.tabId !== tabId` - exact comparison
- ❓ `Date.now() - pending.timestamp >= 10000` - exact boundary (10000)
- ❓ `Date.now() - pending.timestamp >= 10000` - less than 10000
- ❓ `checkCount >= maxChecks` - exact boundary (10)
- ❓ `checkCount >= maxChecks` - less than 10
- ❓ `typeof window !== 'undefined'` - window is undefined
- ❓ `storage.removeItem` in catch when storage is null
- ❓ `JSON.parse` throwing different error types
- ❓ `pending` object structure variations (missing tabId, missing timestamp, missing agents)

## Identified Gaps (37 no-coverage mutants likely in):

### High Priority:
1. **Conditional expression edge cases**:
   - `currentNodes.length > 0` vs `=== 0` exact boundary
   - `pending.tabId === tabId && Date.now() - pending.timestamp < 10000` - all combinations
   - `checkCount >= maxChecks` - exact boundary

2. **Logical OR operators**:
   - `agent.name || agent.label || 'Agent Node'` - all combinations
   - `agent.description || ''` - description is null vs undefined vs empty string
   - `agent.agent_config || {}` - agent_config is null vs undefined vs empty object
   - `currentDraft?.edges || []` - currentDraft is null vs undefined

3. **Optional chaining**:
   - `currentDraft?.edges` - currentDraft is null vs undefined

4. **Mathematical operations**:
   - `Math.max(...currentNodes.map(n => n.position.x))` - empty array edge case
   - `Date.now() - pending.timestamp` - timestamp edge cases

5. **Comparison operators**:
   - `pending.tabId !== tabId` - exact comparison
   - `Date.now() - pending.timestamp >= 10000` - exact boundary (10000)
   - `Date.now() - pending.timestamp < 10000` - exact boundary (10000)

6. **Type checks**:
   - `typeof window !== 'undefined'` - window is undefined vs null vs object

7. **Error handling**:
   - `JSON.parse` throwing SyntaxError vs other errors
   - `storage.removeItem` when storage is null in catch block

8. **Object property access**:
   - `pending.tabId` - property missing vs null vs undefined
   - `pending.timestamp` - property missing vs null vs undefined
   - `pending.agents` - property missing vs null vs undefined

## Recommended Test Additions:

1. **Boundary condition tests**:
   - Test `currentNodes.length === 0` vs `> 0` exact boundary
   - Test `Date.now() - pending.timestamp === 10000` (exact boundary)
   - Test `Date.now() - pending.timestamp === 9999` (just under boundary)
   - Test `checkCount === maxChecks` (exact boundary)

2. **Logical OR operator tests**:
   - Test `agent.name || agent.label || 'Agent Node'` with all combinations:
     - name exists, label exists
     - name exists, label null
     - name null, label exists
     - name null, label null
     - name undefined, label undefined
   - Test `agent.description || ''` with null, undefined, empty string
   - Test `agent.agent_config || {}` with null, undefined, empty object

3. **Optional chaining tests**:
   - Test `currentDraft?.edges` when currentDraft is null
   - Test `currentDraft?.edges` when currentDraft is undefined
   - Test `currentDraft?.edges` when currentDraft exists but edges is missing

4. **Mathematical operation tests**:
   - Test `Math.max(...[])` with empty array (should throw or return -Infinity)
   - Test `Date.now() - pending.timestamp` with various timestamp values

5. **Comparison operator tests**:
   - Test `pending.tabId !== tabId` with exact match vs different values
   - Test `Date.now() - pending.timestamp >= 10000` with exact 10000
   - Test `Date.now() - pending.timestamp < 10000` with exact 9999

6. **Type check tests**:
   - Test `typeof window !== 'undefined'` when window is undefined (SSR scenario)

7. **Error handling tests**:
   - Test `JSON.parse` with invalid JSON (SyntaxError)
   - Test `JSON.parse` with other error types
   - Test `storage.removeItem` when storage is null in catch block

8. **Object property access tests**:
   - Test `pending.tabId` when property is missing
   - Test `pending.timestamp` when property is missing
   - Test `pending.agents` when property is missing
   - Test `pending` object with null/undefined values

9. **setTimeout callback tests**:
   - Verify setTimeout callbacks execute
   - Verify isAddingAgentsRef.current reset timing

10. **Interval tests**:
    - Verify interval executes correct number of times
    - Verify interval clears at maxChecks boundary
