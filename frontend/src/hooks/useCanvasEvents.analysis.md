# useCanvasEvents.ts - Coverage Analysis

## File Overview
- **Total Lines**: 208
- **No Coverage Mutants**: 30
- **Existing Tests**: 52 test cases

## Component Breakdown

### 1. onConnect (lines 35-40)
**Purpose**: Add edge when connection is made

**Code Paths**:
- ✅ Connection handling (tested)
- ✅ setEdges callback (tested)

### 2. onDragOver (lines 42-45)
**Purpose**: Prevent default and set dropEffect

**Code Paths**:
- ✅ preventDefault() (tested)
- ✅ dropEffect = 'move' (tested)

**Potential Uncovered Paths**:
- ❓ `event.preventDefault()` - exact method call
- ❓ `event.dataTransfer.dropEffect = 'move'` - exact string literal 'move'

### 3. onDrop (lines 47-108)
**Purpose**: Handle node drop on canvas

**Complex Logic Flow**:
- ✅ Basic drop handling (tested)
- ✅ Custom agent data (tested)
- ✅ Fallback position calculation (tested)
- ✅ Invalid JSON handling (tested)

**Potential Uncovered Paths**:
- ❓ `event.dataTransfer.getData('application/reactflow')` - exact string literal
- ❓ `if (!type) return` - exact falsy check
- ❓ `reactFlowInstanceRef.current?.screenToFlowPosition` - optional chaining
- ❓ `event.currentTarget.closest('.react-flow')` - exact string literal '.react-flow'
- ❓ `if (!reactFlowWrapper) return` - exact null check
- ❓ `event.dataTransfer.getData('application/custom-agent')` - exact string literal
- ❓ `if (customAgentData)` - exact truthy check
- ❓ `customData ? {...} : {...}` - ternary operator exact comparison
- ❓ `customData.label || ...` - logical OR operator
- ❓ `customData.description || ''` - logical OR operator
- ❓ `customData.agent_config || {}` - logical OR operator
- ❓ `${type.charAt(0).toUpperCase() + type.slice(1)} Node` - string manipulation
- ❓ `event.clientX` - exact property access
- ❓ `event.clientY` - exact property access
- ❓ `reactFlowBounds.left` - exact property access
- ❓ `reactFlowBounds.top` - exact property access

### 4. onNodeClick (lines 110-144)
**Purpose**: Handle node click for selection

**Code Paths**:
- ✅ Single select (tested)
- ✅ Multi-select (tested)
- ✅ Drag prevention (tested)

**Potential Uncovered Paths**:
- ❓ `isDraggingRef.current` - exact property access
- ❓ `if (isDraggingRef.current) return` - exact truthy check
- ❓ `event.stopPropagation()` - exact method call
- ❓ `event.shiftKey || event.metaKey || event.ctrlKey` - logical OR operators
- ❓ `if (isMultiSelect)` - exact truthy check
- ❓ `n.id === node.id ? !n.selected : n.selected` - ternary operator
- ❓ `n.id === node.id` - exact comparison (multiple instances)
- ❓ `setSelectedNodeId(node.id)` - exact property access

### 5. onPaneClick (lines 146-153)
**Purpose**: Handle pane click for deselection and paste

**Code Paths**:
- ✅ Clear selection (tested)
- ✅ Paste with Ctrl/Cmd+V (tested)

**Potential Uncovered Paths**:
- ❓ `event.ctrlKey || event.metaKey` - logical OR operator
- ❓ `event.button === 0` - exact comparison
- ❓ `clipboard?.clipboardNode` - optional chaining
- ❓ `clipboard.paste(event.clientX, event.clientY)` - exact property access

### 6. handleAddToAgentNodes (lines 155-197)
**Purpose**: Add agent node to storage palette

**Code Paths**:
- ✅ Add node (tested)
- ✅ Duplicate check (tested)
- ✅ Non-agent node (tested)
- ✅ Missing storage (tested)
- ✅ Error handling (tested)
- ✅ Fallback values (tested)

**Potential Uncovered Paths**:
- ❓ `node.type !== 'agent'` - exact comparison
- ❓ `if (!storage)` - exact falsy check
- ❓ `storage.getItem('customAgentNodes')` - exact string literal
- ❓ `savedAgentNodes ? JSON.parse(savedAgentNodes) : []` - ternary operator
- ❓ `node.data.label || node.data.name || 'Custom Agent'` - logical OR operators
- ❓ `node.data.description || ''` - logical OR operator
- ❓ `node.data.agent_config || {}` - logical OR operator
- ❓ `n.label === agentTemplate.label && JSON.stringify(n.agent_config) === JSON.stringify(agentTemplate.agent_config)` - exact comparisons
- ❓ `if (!exists)` - exact falsy check
- ❓ `STORAGE_KEYS.CUSTOM_AGENT_NODES` - exact constant access
- ❓ `typeof window !== 'undefined'` - exact comparison
- ❓ `new Event('customAgentNodesUpdated')` - exact string literal
- ❓ `Date.now()` - exact method call (multiple instances)

## Identified Gaps (30 no-coverage mutants likely in):

### High Priority:
1. **String literal comparisons**:
   - `'application/reactflow'` - exact string literal
   - `'application/custom-agent'` - exact string literal
   - `'.react-flow'` - exact string literal
   - `'customAgentNodes'` - exact string literal
   - `'Custom Agent'` - exact string literal
   - `'Agent node added to palette'` - exact string literal
   - `'This agent node already exists in the palette'` - exact string literal
   - `'Storage not available'` - exact string literal
   - `'Failed to add agent node to palette'` - exact string literal
   - `'customAgentNodesUpdated'` - exact string literal
   - `'move'` - exact string literal

2. **Conditional expressions**:
   - `node.type !== 'agent'` - exact comparison
   - `if (!type) return` - exact falsy check
   - `if (!reactFlowWrapper) return` - exact null check
   - `if (customAgentData)` - exact truthy check
   - `if (isMultiSelect)` - exact truthy check
   - `if (!exists)` - exact falsy check
   - `if (!storage)` - exact falsy check
   - `event.button === 0` - exact comparison
   - `n.id === node.id` - exact comparison

3. **Logical OR operators**:
   - `event.shiftKey || event.metaKey || event.ctrlKey` - logical OR chain
   - `event.ctrlKey || event.metaKey` - logical OR operator
   - `customData.label || ...` - logical OR operator
   - `customData.description || ''` - logical OR operator
   - `customData.agent_config || {}` - logical OR operator
   - `node.data.label || node.data.name || 'Custom Agent'` - logical OR chain
   - `node.data.description || ''` - logical OR operator
   - `node.data.agent_config || {}` - logical OR operator

4. **Ternary operators**:
   - `customData ? {...} : {...}` - ternary operator
   - `savedAgentNodes ? JSON.parse(savedAgentNodes) : []` - ternary operator
   - `n.id === node.id ? !n.selected : n.selected` - ternary operator

5. **Optional chaining**:
   - `reactFlowInstanceRef.current?.screenToFlowPosition` - optional chaining
   - `clipboard?.clipboardNode` - optional chaining

6. **Property access**:
   - `event.clientX` - exact property access
   - `event.clientY` - exact property access
   - `reactFlowBounds.left` - exact property access
   - `reactFlowBounds.top` - exact property access
   - `isDraggingRef.current` - exact property access
   - `node.id` - exact property access

7. **Method calls**:
   - `event.preventDefault()` - exact method call
   - `event.stopPropagation()` - exact method call
   - `Date.now()` - exact method call

8. **Type checks**:
   - `typeof window !== 'undefined'` - exact comparison

## Recommended Test Additions:

1. **String literal tests**:
   - Verify exact string literals are used (not mutated)
   - Test all string literal comparisons

2. **Conditional expression tests**:
   - Test exact falsy checks (`!type`, `!reactFlowWrapper`, `!exists`, `!storage`)
   - Test exact truthy checks (`customAgentData`, `isMultiSelect`)
   - Test exact comparisons (`node.type !== 'agent'`, `event.button === 0`, `n.id === node.id`)

3. **Logical OR operator tests**:
   - Test each OR operator independently
   - Test OR chains with different combinations

4. **Ternary operator tests**:
   - Test ternary operators with all branches

5. **Optional chaining tests**:
   - Test when optional chaining returns undefined

6. **Property access tests**:
   - Test exact property access paths

7. **Method call tests**:
   - Test exact method calls

8. **Type check tests**:
   - Test `typeof window !== 'undefined'` comparison
