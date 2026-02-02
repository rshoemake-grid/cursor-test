# useTemplateOperations.ts - Coverage Analysis

## File Overview
- **Total Lines**: 294
- **No Coverage Mutants**: 47
- **Existing Tests**: 104 test cases

## Function Breakdown

### 1. `useTemplate` (lines 61-86)
**Purpose**: Use a template to create a workflow

**Code Paths**:
- ✅ `if (token)` - Add Authorization header (tested)
- ✅ `if (response.ok)` - Success path with navigation (tested)
- ✅ `else` - Error response path (tested)
- ✅ `catch` - Exception handling (tested)

**Potential Uncovered Paths**:
- ❓ `response.json()` might throw (needs verification)
- ❓ `response.text()` might throw (needs verification)
- ❓ `navigate()` might throw (unlikely but possible)

### 2. `deleteSelectedAgents` (lines 88-189)
**Purpose**: Delete selected agents from marketplace

**Complex Logic Flow**:
1. Early return if no selection (✅ tested)
2. Filter official vs deletable agents (✅ tested)
3. Check for official agents (✅ tested)
4. Early return if all official (✅ tested)
5. **User ownership check** (lines 118-131):
   - `!user` check (✅ tested)
   - `!a.author_id` check (✅ tested)
   - `!user.id` check (❓ might need more coverage)
   - String conversion logic (✅ tested)
6. **No owned agents path** (lines 135-152):
   - `agentsWithAuthorId.length === 0` (✅ tested)
   - `officialAgents.length > 0` in error message (✅ tested)
   - `officialAgents.length === 0` in error message (✅ tested)
   - `agentsWithAuthorId.length > 0` but no match (✅ tested)
7. **Partial vs full delete confirmation** (lines 154-166):
   - `userOwnedAgents.length < deletableAgents.length` (✅ tested)
   - `userOwnedAgents.length === deletableAgents.length` (✅ tested)
8. **Storage operations** (lines 168-188):
   - `!storage` check (✅ tested)
   - `publishedAgents` null check (✅ tested)
   - JSON.parse (✅ tested)
   - `catch` block (✅ tested)

**Potential Uncovered Paths**:
- ❓ `user.id` as empty string vs null vs undefined edge cases
- ❓ `author_id` type coercion edge cases (number vs string)
- ❓ `storage.getItem()` returning empty string vs null
- ❓ `storage.setItem()` might throw
- ❓ `setAgents` callback execution
- ❓ `setSelectedAgentIds` callback execution

### 3. `deleteSelectedWorkflows` (lines 195-252)
**Purpose**: Delete selected workflows/templates

**Complex Logic Flow**:
1. Early return if no selection (✅ tested)
2. **Active tab routing** (line 198):
   - `activeTab === 'workflows-of-workflows'` (✅ tested)
   - `activeTab === 'repository'` (❓ implicit, might need explicit test)
3. Filter official vs deletable (✅ tested)
4. Check for official templates (✅ tested)
5. Early return if all official (✅ tested)
6. **User ownership check** (line 212):
   - `user && t.author_id` check (✅ tested)
   - String conversion (✅ tested)
7. **No owned templates path** (lines 214-220):
   - `officialTemplates.length > 0` (✅ tested)
   - `officialTemplates.length === 0` (✅ tested)
8. **Partial vs full delete confirmation** (lines 223-235):
   - `userOwnedTemplates.length < deletableTemplates.length` (✅ tested)
   - `userOwnedTemplates.length === deletableTemplates.length` (✅ tested)
9. **API deletion** (lines 237-251):
   - `Promise.all()` with multiple templates (✅ tested)
   - `catch` block with error.response.data.detail (✅ tested)
   - `catch` block with error.message (✅ tested)
   - `catch` block with 'Unknown error' fallback (✅ tested)

**Potential Uncovered Paths**:
- ❓ `activeTab` other values (though type-safe, runtime could have issues)
- ❓ `Promise.all()` with partial failures (needs verification)
- ❓ `error.response` might be null/undefined
- ❓ `error.response.data` might be null/undefined
- ❓ `error.response.data.detail` might be null
- ❓ `setTemplates` callback execution
- ❓ `setWorkflowsOfWorkflows` callback execution
- ❓ `setSelectedTemplateIds` callback execution

### 4. `deleteSelectedRepositoryAgents` (lines 254-285)
**Purpose**: Delete agents from repository storage

**Logic Flow**:
1. Early return if no selection (✅ tested)
2. `!storage` check (✅ tested)
3. Confirmation dialog (✅ tested)
4. Early return if cancelled (✅ tested)
5. **Storage operations** (lines 268-284):
   - `repositoryAgents` null check (❓ might need explicit test)
   - `repositoryAgents` empty string check (❓ might need explicit test)
   - JSON.parse (✅ tested)
   - `setRepositoryAgents` callback (✅ tested)
   - `setSelectedRepositoryAgentIds` callback (✅ tested)
   - `onRefresh` callback (✅ tested)
   - `catch` block (✅ tested)

**Potential Uncovered Paths**:
- ❓ `storage.getItem()` returning null vs empty string
- ❓ `storage.getItem()` returning undefined
- ❓ `storage.setItem()` might throw
- ❓ `onRefresh` callback might throw

## Identified Gaps (47 no-coverage mutants likely in):

### High Priority:
1. **String conversion edge cases**:
   - `String(author_id)` when author_id is number vs string vs null
   - `String(user.id)` when user.id is number vs string vs empty string
   - Type coercion in comparisons

2. **Null/undefined/empty string distinctions**:
   - `storage.getItem()` returning null vs empty string vs undefined
   - `publishedAgents` null vs empty string
   - `repositoryAgents` null vs empty string

3. **Error object structure variations**:
   - `error.response` might not exist
   - `error.response.data` might not exist
   - `error.response.data.detail` might be null vs undefined vs missing

4. **Callback execution paths**:
   - State setters might not be called in all branches
   - `onRefresh` callback execution

5. **Logical operator edge cases**:
   - `user && t.author_id` - both false, one false, both true
   - `user && a.author_id && user.id` - various combinations

6. **Conditional branches**:
   - `activeTab === 'workflows-of-workflows'` vs other values
   - `officialAgents.length > 0` vs `=== 0` boundary conditions
   - `deletableAgents.length === 0` vs `> 0`

## Recommended Test Additions:

1. **String conversion tests**:
   - Test with numeric author_id vs string author_id
   - Test with numeric user.id vs string user.id
   - Test with empty string user.id

2. **Storage edge cases**:
   - Test storage.getItem() returning null
   - Test storage.getItem() returning empty string
   - Test storage.getItem() returning undefined
   - Test storage.setItem() throwing error

3. **Error object structure tests**:
   - Test error without response property
   - Test error.response without data property
   - Test error.response.data without detail property
   - Test error.response.data.detail as null

4. **Callback execution tests**:
   - Verify all state setters are called with correct predicates
   - Test onRefresh callback execution
   - Test onRefresh callback throwing error

5. **Boundary condition tests**:
   - Test exact boundary: `officialAgents.length === 0` vs `> 0`
   - Test exact boundary: `deletableAgents.length === 0` vs `> 0`
   - Test exact boundary: `userOwnedAgents.length === deletableAgents.length`

6. **Logical operator tests**:
   - Test `user && t.author_id` with all combinations
   - Test `user && a.author_id && user.id` with all combinations
