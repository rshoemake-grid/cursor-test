# workflowFormat.ts - Coverage Analysis

## File Overview
- **Total Lines**: 175
- **No Coverage Mutants**: 29
- **Existing Tests**: 45 test cases

## Component Breakdown

### 1. convertEdgesToWorkflowFormat (lines 12-19)
**Purpose**: Convert React Flow edges to WorkflowEdge format

**Code Paths**:
- ✅ Basic conversion (tested)
- ✅ String label handling (tested)
- ✅ Non-string label handling (tested)

**Potential Uncovered Paths**:
- ❓ `typeof edge.label === 'string'` - exact type comparison
- ❓ `edge.label : undefined` - ternary operator

### 2. convertNodesToWorkflowFormat (lines 24-43)
**Purpose**: Convert React Flow nodes to WorkflowNode format

**Complex Logic Flow**:
- ✅ Basic conversion (tested)
- ✅ Name fallback chain (tested)
- ✅ Description handling (tested)
- ✅ Config handling (tested)
- ✅ Inputs handling (tested)

**Potential Uncovered Paths**:
- ❓ `typeof node.data.name === 'string' ? node.data.name : ''` - exact type check and ternary
- ❓ `typeof node.data.label === 'string' ? node.data.label : ''` - exact type check and ternary
- ❓ `node.data.name || node.data.label || node.id` - logical OR chain
- ❓ `typeof node.data.description === 'string' ? node.data.description : undefined` - exact type check and ternary
- ❓ `Array.isArray(node.data.inputs) ? node.data.inputs : []` - exact array check and ternary

### 3. createWorkflowDefinition (lines 48-62)
**Purpose**: Create workflow definition from component state

**Code Paths**:
- ✅ Basic creation (tested)
- ✅ Empty arrays (tested)

**Potential Uncovered Paths**:
- ❓ Property access: `params.name`, `params.description`, `params.nodes`, `params.edges`, `params.variables`

### 4. initializeReactFlowNodes (lines 67-82)
**Purpose**: Initialize React Flow nodes with default configs

**Code Paths**:
- ✅ Default configs (tested)
- ✅ Preserve existing configs (tested)
- ✅ Null/undefined handling (tested)

**Potential Uncovered Paths**:
- ❓ `node.data.agent_config || {}` - logical OR operator
- ❓ `node.data.condition_config || {}` - logical OR operator
- ❓ `node.data.loop_config || {}` - logical OR operator
- ❓ `node.data.input_config || {}` - logical OR operator
- ❓ `node.data.inputs || []` - logical OR operator

### 5. formatEdgesForReactFlow (lines 87-128)
**Purpose**: Format edges for React Flow, handling sourceHandle/targetHandle conversion

**Complex Logic Flow**:
- ✅ Basic formatting (tested)
- ✅ Snake_case handling (tested)
- ✅ Boolean conversion (tested)
- ✅ ID generation (tested)
- ✅ Property preservation (tested)

**Potential Uncovered Paths**:
- ❓ `edge.sourceHandle || edge.source_handle || null` - logical OR chain
- ❓ `edge.targetHandle || edge.target_handle || null` - logical OR chain
- ❓ `sourceHandle === true` - exact comparison
- ❓ `sourceHandle === false` - exact comparison
- ❓ `targetHandle === true` - exact comparison
- ❓ `targetHandle === false` - exact comparison
- ❓ `sourceHandle = "true"` - exact string literal
- ❓ `sourceHandle = "false"` - exact string literal
- ❓ `targetHandle = "true"` - exact string literal
- ❓ `targetHandle = "false"` - exact string literal
- ❓ `edge.id || (sourceHandle ? ... : ...)` - logical OR and ternary
- ❓ `sourceHandle ? ... : ...` - ternary operator
- ❓ `if (sourceHandle)` - exact truthy check
- ❓ `if (targetHandle)` - exact truthy check
- ❓ `String(sourceHandle)` - exact method call
- ❓ `String(targetHandle)` - exact method call
- ❓ `key !== 'sourceHandle' && key !== 'source_handle' && key !== 'targetHandle' && key !== 'target_handle'` - exact string comparisons

### 6. normalizeNodeForStorage (lines 133-144)
**Purpose**: Normalize node for storage (ensures all configs are objects)

**Code Paths**:
- ✅ Basic normalization (tested)
- ✅ Preserve existing configs (tested)
- ✅ Top-level configs (tested)

**Potential Uncovered Paths**:
- ❓ `(node.data as any)?.agent_config ?? (node as any).agent_config ?? {}` - optional chaining and nullish coalescing chain
- ❓ `(node.data as any)?.condition_config ?? (node as any).condition_config ?? {}` - optional chaining and nullish coalescing chain
- ❓ `(node.data as any)?.loop_config ?? (node as any).loop_config ?? {}` - optional chaining and nullish coalescing chain
- ❓ `(node.data as any)?.input_config ?? (node as any).input_config ?? {}` - optional chaining and nullish coalescing chain

### 7. workflowNodeToReactFlowNode (lines 149-175)
**Purpose**: Convert WorkflowNode to React Flow Node format

**Complex Logic Flow**:
- ✅ Basic conversion (tested)
- ✅ Nested data object (tested)
- ✅ Execution state (tested)
- ✅ Missing position (tested)
- ✅ Fallback values (tested)

**Potential Uncovered Paths**:
- ❓ `wfNode.data || {}` - logical OR operator
- ❓ `nodeExecutionStates?.[wfNode.id]` - optional chaining
- ❓ `wfNode.position || { x: 0, y: 0 }` - logical OR operator
- ❓ `data.label || data.name || wfNode.name || wfNode.type` - logical OR chain
- ❓ `data.name || wfNode.name || wfNode.type` - logical OR chain
- ❓ `data.description ?? wfNode.description ?? ''` - nullish coalescing chain
- ❓ `data.agent_config || wfNode.agent_config || {}` - logical OR chain
- ❓ `data.condition_config || wfNode.condition_config || {}` - logical OR chain
- ❓ `data.loop_config || wfNode.loop_config || {}` - logical OR chain
- ❓ `data.input_config || wfNode.input_config || {}` - logical OR chain
- ❓ `data.inputs || wfNode.inputs || []` - logical OR chain
- ❓ `nodeExecutionState?.status` - optional chaining
- ❓ `nodeExecutionState?.error` - optional chaining

## Identified Gaps (29 no-coverage mutants likely in):

### High Priority:
1. **Type checks**:
   - `typeof edge.label === 'string'` - exact comparison
   - `typeof node.data.name === 'string'` - exact comparison
   - `typeof node.data.label === 'string'` - exact comparison
   - `typeof node.data.description === 'string'` - exact comparison
   - `Array.isArray(node.data.inputs)` - exact array check

2. **Ternary operators**:
   - `typeof edge.label === 'string' ? edge.label : undefined`
   - `typeof node.data.name === 'string' ? node.data.name : ''`
   - `typeof node.data.label === 'string' ? node.data.label : ''`
   - `typeof node.data.description === 'string' ? node.data.description : undefined`
   - `Array.isArray(node.data.inputs) ? node.data.inputs : []`
   - `edge.id || (sourceHandle ? ... : ...)`
   - `sourceHandle ? ... : ...`

3. **Logical OR operators**:
   - `node.data.name || node.data.label || node.id`
   - `edge.sourceHandle || edge.source_handle || null`
   - `edge.targetHandle || edge.target_handle || null`
   - `wfNode.data || {}`
   - `wfNode.position || { x: 0, y: 0 }`
   - `data.label || data.name || wfNode.name || wfNode.type`
   - `data.name || wfNode.name || wfNode.type`
   - `data.agent_config || wfNode.agent_config || {}`
   - `data.condition_config || wfNode.condition_config || {}`
   - `data.loop_config || wfNode.loop_config || {}`
   - `data.input_config || wfNode.input_config || {}`
   - `data.inputs || wfNode.inputs || []`
   - `node.data.agent_config || {}`
   - `node.data.condition_config || {}`
   - `node.data.loop_config || {}`
   - `node.data.input_config || {}`
   - `node.data.inputs || []`

4. **Nullish coalescing operators**:
   - `data.description ?? wfNode.description ?? ''`
   - `(node.data as any)?.agent_config ?? (node as any).agent_config ?? {}`
   - `(node.data as any)?.condition_config ?? (node as any).condition_config ?? {}`
   - `(node.data as any)?.loop_config ?? (node as any).loop_config ?? {}`
   - `(node.data as any)?.input_config ?? (node as any).input_config ?? {}`

5. **Optional chaining**:
   - `nodeExecutionStates?.[wfNode.id]`
   - `nodeExecutionState?.status`
   - `nodeExecutionState?.error`
   - `(node.data as any)?.agent_config`
   - `(node.data as any)?.condition_config`
   - `(node.data as any)?.loop_config`
   - `(node.data as any)?.input_config`

6. **Exact comparisons**:
   - `sourceHandle === true` - exact comparison
   - `sourceHandle === false` - exact comparison
   - `targetHandle === true` - exact comparison
   - `targetHandle === false` - exact comparison
   - `if (sourceHandle)` - exact truthy check
   - `if (targetHandle)` - exact truthy check
   - `key !== 'sourceHandle'` - exact string comparison
   - `key !== 'source_handle'` - exact string comparison
   - `key !== 'targetHandle'` - exact string comparison
   - `key !== 'target_handle'` - exact string comparison

7. **String literals**:
   - `"true"` - exact string literal
   - `"false"` - exact string literal
   - `{ x: 0, y: 0 }` - exact object literal

8. **Method calls**:
   - `String(sourceHandle)` - exact method call
   - `String(targetHandle)` - exact method call

## Recommended Test Additions:

1. **Type check tests**:
   - Test exact `typeof` comparisons with different types
   - Test `Array.isArray` with different types

2. **Ternary operator tests**:
   - Test all ternary operators with both branches

3. **Logical OR operator tests**:
   - Test each OR operator independently
   - Test OR chains with different combinations

4. **Nullish coalescing tests**:
   - Test nullish coalescing with null, undefined, and falsy values

5. **Optional chaining tests**:
   - Test optional chaining when properties are undefined

6. **Exact comparison tests**:
   - Test exact boolean comparisons
   - Test exact string comparisons
   - Test exact truthy checks

7. **String literal tests**:
   - Verify exact string literals are used

8. **Method call tests**:
   - Test exact method calls
