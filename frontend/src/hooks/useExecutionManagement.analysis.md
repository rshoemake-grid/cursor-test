# useExecutionManagement.ts - Coverage Analysis

## File Overview
- **Total Lines**: 264
- **No Coverage Mutants**: 37
- **Existing Tests**: 69 test cases

## Function Breakdown

### 1. `handleExecutionStart` (lines 33-97)
**Purpose**: Add execution to active tab's executions list

**Complex Logic Flow**:
1. ✅ Find active tab (tested)
2. ✅ Early return if no active tab (tested)
3. ✅ Map over tabs (tested)
4. ✅ Skip non-active tabs (tested)
5. **Real execution ID handling** (lines 42-65):
   - ✅ `!executionId.startsWith('pending-')` check (tested)
   - ✅ Find pending executions (tested)
   - ✅ `pendingExecutions.length > 0` check (tested)
   - ✅ Replace oldest pending execution (tested)
   - ❓ `pendingExecutions.length === 0` path (might need explicit test)
6. **Existing execution check** (lines 68-75):
   - ✅ `existingExecution` check (tested)
   - ✅ Update activeExecutionId only (tested)
7. **New execution creation** (lines 77-90):
   - ✅ Create new execution object (tested)
   - ✅ Prepend to executions array (tested)
8. **Callback execution** (lines 94-96):
   - ✅ `onExecutionStart` callback (tested)

**Potential Uncovered Paths**:
- ❓ `pendingExecutions.length === 0` when executionId doesn't start with 'pending-'
- ❓ `executionId.startsWith('pending-')` - exact string comparison
- ❓ `tab.executions.find(exec => exec.id === executionId)` - exact comparison
- ❓ `onExecutionStart` is undefined/null

### 2. `handleClearExecutions` (lines 100-111)
**Purpose**: Clear all executions for a workflow

**Logic Flow**:
- ✅ Map over tabs (tested)
- ✅ `tab.workflowId === workflowId` check (tested)
- ✅ Clear executions and activeExecutionId (tested)

**Potential Uncovered Paths**:
- ❓ `tab.workflowId === workflowId` - exact comparison
- ❓ Multiple tabs with same workflowId

### 3. `handleRemoveExecution` (lines 114-130)
**Purpose**: Remove a single execution from a workflow

**Logic Flow**:
- ✅ Map over tabs (tested)
- ✅ `tab.workflowId !== workflowId` early return (tested)
- ✅ Filter executions (tested)
- ✅ `tab.activeExecutionId === executionId` check (tested)
- ✅ `updatedExecutions.length > 0` check (tested)
- ✅ Set new activeExecutionId (tested)

**Potential Uncovered Paths**:
- ❓ `tab.activeExecutionId === executionId` - exact comparison
- ❓ `updatedExecutions.length === 0` vs `> 0` boundary
- ❓ `updatedExecutions[0].id` access when length > 0

### 4. `handleExecutionLogUpdate` (lines 133-149)
**Purpose**: Add log entry to execution

**Logic Flow**:
- ✅ Map over tabs (tested)
- ✅ `tab.workflowId === workflowId` check (tested)
- ✅ Map over executions (tested)
- ✅ `exec.id === executionId` check (tested)
- ✅ Append log to logs array (tested)

**Potential Uncovered Paths**:
- ❓ `tab.workflowId === workflowId` - exact comparison
- ❓ `exec.id === executionId` - exact comparison
- ❓ `[...exec.logs, log]` spread operator

### 5. `handleExecutionStatusUpdate` (lines 152-169)
**Purpose**: Update execution status

**Logic Flow**:
- ✅ Map over tabs (tested)
- ✅ `tab.workflowId === workflowId` check (tested)
- ✅ Map over executions (tested)
- ✅ `exec.id === executionId` check (tested)
- ✅ Update status (tested)
- ✅ `status === 'completed' || status === 'failed'` check (tested)
- ✅ Set completedAt (tested)

**Potential Uncovered Paths**:
- ❓ `status === 'completed' || status === 'failed'` - all combinations
- ❓ `status === 'completed'` - exact comparison
- ❓ `status === 'failed'` - exact comparison
- ❓ `status === 'running'` - doesn't set completedAt
- ❓ `exec.completedAt` preservation when status is 'running'

### 6. `handleExecutionNodeUpdate` (lines 172-191)
**Purpose**: Update node state in execution

**Logic Flow**:
- ✅ Map over tabs (tested)
- ✅ `tab.workflowId === workflowId` check (tested)
- ✅ Map over executions (tested)
- ✅ `exec.id === executionId` check (tested)
- ✅ Update nodes object (tested)

**Potential Uncovered Paths**:
- ❓ `tab.workflowId === workflowId` - exact comparison
- ❓ `exec.id === executionId` - exact comparison
- ❓ `{ ...exec.nodes, [nodeId]: nodeState }` spread operator

### 7. `useEffect` - Polling (lines 195-254)
**Purpose**: Poll for execution updates as fallback

**Complex Logic Flow**:
1. ✅ `setInterval` setup (tested)
2. ✅ Get current tabs from ref (tested)
3. ✅ Filter running executions (tested)
4. ✅ `runningExecutions.length === 0` early return (tested)
5. ✅ `Promise.all` with API calls (tested)
6. ✅ Status mapping logic (tested):
   - ✅ `execution.status === 'completed'` (tested)
   - ✅ `execution.status === 'failed'` (tested)
   - ✅ `execution.status === 'paused'` (tested)
   - ✅ Default 'running' (tested)
7. ✅ `exec.status !== newStatus` check (tested)
8. ✅ Error handling (tested)
9. ✅ `!exec.id.startsWith('pending-')` check (tested)
10. ✅ Apply updates to tabs (tested)
11. ✅ Cleanup interval (tested)

**Potential Uncovered Paths**:
- ❓ `e.status === 'running'` - exact comparison
- ❓ `!e.id.startsWith('pending-')` - exact check
- ❓ `execution.status === 'completed'` - exact comparison
- ❓ `execution.status === 'failed'` - exact comparison
- ❓ `execution.status === 'paused'` - exact comparison
- ❓ `exec.status !== newStatus` - exact comparison
- ❓ `exec.id.startsWith('pending-')` in error handling
- ❓ `execution.completed_at` - null vs undefined vs missing
- ❓ `execution.node_states` - null vs undefined vs missing
- ❓ `execution.logs` - null vs undefined vs missing
- ❓ `updates.find(u => u && u.id === exec.id)` - null check
- ❓ `update || exec` fallback

## Identified Gaps (37 no-coverage mutants likely in):

### High Priority:
1. **Conditional expression edge cases**:
   - `pendingExecutions.length === 0` when executionId doesn't start with 'pending-'
   - `updatedExecutions.length === 0` vs `> 0` boundary
   - `status === 'completed' || status === 'failed'` - all combinations
   - `exec.status !== newStatus` - exact comparison

2. **String comparison operators**:
   - `executionId.startsWith('pending-')` - exact string comparison
   - `tab.workflowId === workflowId` - exact comparison
   - `exec.id === executionId` - exact comparison
   - `tab.id === activeTabId` - exact comparison
   - `tab.activeExecutionId === executionId` - exact comparison

3. **Logical operators**:
   - `status === 'completed' || status === 'failed'` - both true, one true, both false
   - `u && u.id === exec.id` - u is null vs truthy

4. **Optional/nullish handling**:
   - `execution.completed_at ? new Date(...) : undefined` - completed_at is null vs undefined vs missing
   - `execution.node_states || {}` - node_states is null vs undefined vs missing
   - `execution.logs || []` - logs is null vs undefined vs missing
   - `update || exec` - update is null vs undefined

5. **Array operations**:
   - `updatedExecutions[0].id` - accessing first element
   - `pendingExecutions[pendingExecutions.length - 1]` - accessing last element
   - `[...exec.logs, log]` - spread operator
   - `{ ...exec.nodes, [nodeId]: nodeState }` - spread operator

6. **Callback execution**:
   - `onExecutionStart` is undefined/null

7. **Error handling**:
   - `!exec.id.startsWith('pending-')` in catch block
   - `updates.find` returning null

## Recommended Test Additions:

1. **Boundary condition tests**:
   - Test `pendingExecutions.length === 0` when executionId doesn't start with 'pending-'
   - Test `updatedExecutions.length === 0` vs `> 0` exact boundary
   - Test `runningExecutions.length === 0` exact boundary

2. **String comparison tests**:
   - Test `executionId.startsWith('pending-')` with exact 'pending-' prefix
   - Test `tab.workflowId === workflowId` with exact match vs different values
   - Test `exec.id === executionId` with exact match vs different values

3. **Status comparison tests**:
   - Test `status === 'completed' || status === 'failed'` with all combinations:
     - status === 'completed'
     - status === 'failed'
     - status === 'running' (neither)
   - Test `exec.status !== newStatus` with exact match vs different

4. **Optional/nullish handling tests**:
   - Test `execution.completed_at` when null vs undefined vs missing
   - Test `execution.node_states` when null vs undefined vs missing
   - Test `execution.logs` when null vs undefined vs missing
   - Test `update || exec` when update is null vs undefined

5. **Array access tests**:
   - Test `updatedExecutions[0].id` when length > 0
   - Test `pendingExecutions[pendingExecutions.length - 1]` when length > 0

6. **Callback tests**:
   - Test `onExecutionStart` when undefined/null

7. **Error handling tests**:
   - Test `!exec.id.startsWith('pending-')` in catch block
   - Test `updates.find` returning null
