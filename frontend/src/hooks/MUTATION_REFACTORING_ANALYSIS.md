# Mutation Testing Refactoring Analysis - Hooks Directory

## Executive Summary

Based on mutation testing results (82.51% overall score), this document identifies the worst-performing hooks subfolders and provides detailed refactoring opportunities to improve mutation test coverage.

**Key Findings:**
- **Total Surviving Mutants:** 1,045 across all hooks
- **Worst Subfolders:** `utils` (168 survived), `marketplace` (116 survived), `nodes` (62 survived), `storage` (50 survived)
- **Primary Issues:** Complex conditionals, missing edge case tests, logical operator mutations, and insufficient boundary value testing
- **SOLID Violations:** Multiple SRP violations, OCP violations in extensibility, DIP violations in dependencies
- **DRY Violations:** Repeated null checks, duplicate useEffect patterns, duplicate error handling, duplicate wrapper functions

---

## 1. hooks/utils - 168 Surviving Mutants (85.79% Score)

### Overview
- **Total Mutants:** 1,158 killed, 168 survived, 13 timeout, 26 no coverage, 38 errors
- **Mutation Score:** 85.79% (87.45% covered)
- **Status:** ⚠️ **HIGHEST PRIORITY** - Most surviving mutants

### Problem Areas

#### 1.1 `authenticatedRequestHandler.ts` (24 survived, 7 no coverage, 8 errors)
**Issues:**
- Complex conditional logic in `buildRequestHeaders` with multiple branches
- Header merging logic has multiple code paths not fully tested
- Error handling branches not covered
- Type checking mutations survive

**SOLID Violations:**
- **SRP Violation:** `buildRequestHeaders` handles both header merging AND header building (two responsibilities)
  - Merges additional headers (Headers, Array, Object types)
  - Adds Content-Type conditionally
  - Adds Authorization header
  - Should be split: `mergeHeaders()` + `buildHeaders()`
- **OCP Violation:** Header type handling uses if/else chain - hard to extend for new header types without modification
  - Should use strategy pattern or factory pattern for header type handling

**DRY Violations:**
- Header type checking logic could be extracted to reusable utility
- Content-Type logic duplicated in multiple request handlers

**Refactoring Opportunities:**
```typescript
// Current: Complex header merging
if (additionalHeaders) {
  if (additionalHeaders instanceof Headers) { ... }
  else if (Array.isArray(additionalHeaders)) { ... }
  else { Object.assign(headers, additionalHeaders) }
}

// Refactor: Extract to separate function with explicit tests
function mergeHeaders(base: Record<string, string>, additional: HeadersInit): Record<string, string> {
  // Test each branch independently
}
```

**Action Items:**
1. Extract header merging logic to separate function
2. Add tests for each header type (Headers, Array, Object)
3. Add tests for Content-Type override scenarios
4. Add tests for Authorization header override scenarios
5. Add error handling tests for invalid header formats

#### 1.2 `nullishCoalescing.ts` (21 survived)
**Issues:**
- Multiple utility functions with similar patterns
- Edge cases not fully tested (null vs undefined vs empty string)
- Return type mutations survive

**Refactoring Opportunities:**
- Consolidate similar functions
- Add explicit tests for all falsy value combinations
- Test return type mutations explicitly

#### 1.3 `executionStateManager.ts` (15 survived)
**Issues:**
- Complex state update logic with multiple conditional branches
- Date comparison mutations survive
- Status transition mutations survive

**Refactoring Opportunities:**
- Extract status transition logic to separate function
- Add explicit tests for each status transition
- Test date comparison edge cases (null, undefined, invalid dates)

#### 1.4 Other Files with High Surviving Mutants
- `errorHandling.ts` - 34 survived (error message extraction)
- `storageValidation.ts` - Need to check individual file results
- `userValidation.ts` - Need to check individual file results

---

## 2. hooks/marketplace - 116 Surviving Mutants (84.33% Score)

### Overview
- **Total Mutants:** 630 killed, 116 survived, 5 timeout, 2 no coverage
- **Mutation Score:** 84.33% (84.55% covered)
- **Status:** ⚠️ **HIGH PRIORITY**

### Problem Areas

#### 2.1 `useMarketplaceData.ts` - Multiple Responsibilities
**Issues:**
- **SRP Violation:** Still manages multiple responsibilities despite refactoring:
  1. Coordinates 4 different data fetching hooks
  2. Syncs data fetching results to local state (4 separate useEffect blocks)
  3. Determines loading state
  4. Auto-fetches based on active tab
  5. Provides wrapper functions for backward compatibility
- **DRY Violation:** 4 nearly identical useEffect blocks (lines 149-169):
  ```typescript
  useEffect(() => { setTemplates(...) }, [templatesFetching.data])
  useEffect(() => { setWorkflowsOfWorkflows(...) }, [workflowsOfWorkflowsFetching.data])
  useEffect(() => { setAgents(...) }, [agentsFetching.data])
  useEffect(() => { setRepositoryAgents(...) }, [repositoryAgentsFetching.data])
  ```
  - Should use single generic sync function
- **DRY Violation:** 4 wrapper functions (lines 197-211) that just call refetch
  - Should use single generic wrapper or eliminate wrappers

#### 2.2 `useMarketplaceData.utils.ts` (Sorting/Filtering Logic)
**Issues:**
- Complex sorting logic with multiple comparison functions
- Filter logic with multiple conditions
- Ternary operators in comparisons survive mutations

**SOLID Violations:**
- **OCP Violation:** Sort strategies hard-coded in if/else chain
  - Should use strategy pattern for extensibility

**Refactoring Opportunities:**
```typescript
// Current: Complex sorting with ternary
sorted.sort((a, b) => {
  if (prioritizeOfficial) {
    const officialDiff = compareOfficialStatus(a, b)
    if (officialDiff !== 0) return officialDiff
  }
  if (sortBy === 'popular' || sortBy === 'recent') {
    return compareByDate(a, b)
  }
  return compareByName(a, b)
})

// Refactor: Extract strategy pattern
const sortStrategies = {
  popular: compareByDate,
  recent: compareByDate,
  alphabetical: compareByName,
  default: compareByName
}
```

**Action Items:**
1. Extract sorting strategy to separate function
2. Add tests for each sort type independently
3. Test official status prioritization separately
4. Add tests for edge cases (null names, missing dates)

#### 2.3 `useAgentDeletion.ts` (26 survived)
**Issues:**
- Complex deletion logic with multiple validation steps
- Error handling mutations survive
- Conditional logic mutations survive

**SOLID Violations:**
- **SRP Violation:** Single function handles:
  1. Selection validation
  2. Official agent filtering
  3. Ownership validation
  4. Confirmation dialogs
  5. Storage operations
  6. State updates
  7. Error handling
  - Should extract: `validateDeletion`, `confirmDeletion`, `executeDeletion`
- **DRY Violation:** Similar deletion logic duplicated in `useRepositoryAgentDeletion`
  - Both functions have nearly identical storage deletion patterns
  - Error message extraction duplicated

**Refactoring Opportunities:**
- Extract validation logic to separate function
- Extract confirmation logic to separate function
- Extract storage deletion to shared utility
- Add explicit tests for each validation step
- Test error handling paths independently

#### 2.4 `useMarketplaceIntegration.ts` (30 survived)
**Issues:**
- Complex node positioning logic
- Multiple conditional branches
- Storage operation mutations survive

**SOLID Violations:**
- **SRP Violation:** Hook handles:
  1. Event listening (CustomEvent)
  2. Node creation
  3. Node positioning
  4. Draft storage updates
  5. State synchronization
  - Should extract: `useNodeCreation`, `useDraftSync`
- **DRY Violation:** setTimeout pattern duplicated (lines 82, 98)
  - Should use single debounce/throttle utility

**Refactoring Opportunities:**
- Extract node positioning to separate utility
- Extract draft sync to separate hook
- Replace setTimeout with proper debounce utility
- Add tests for each positioning scenario
- Test storage error handling

---

## 3. hooks/nodes - 62 Surviving Mutants (76.60% Score)

### Overview
- **Total Mutants:** 203 killed, 62 survived
- **Mutation Score:** 76.60%
- **Status:** ⚠️ **MEDIUM PRIORITY** - Lowest score among subfolders

### Problem Areas

#### 3.1 `useSelectedNode.ts` (33 survived) - **CRITICAL**
**Issues:**
- **43.10% mutation score** - Worst individual file
- Complex caching logic with multiple conditional branches
- Null/undefined checks mutations survive
- Reference equality mutations survive

**SOLID Violations:**
- **SRP Violation:** Hook handles multiple responsibilities:
  1. Node selection logic
  2. Caching logic (preventing flicker)
  3. Node finding/validation logic
  4. Cache invalidation logic
  5. Nodes array management
  - Should be split into: `useNodeSelection`, `useNodeCache`, `useNodeFinder`
- **DIP Violation:** Directly depends on `useReactFlow()` concrete implementation
  - Should depend on abstraction (node finder interface)

**DRY Violations:**
- Null/undefined/empty string checks repeated multiple times (lines 46, 54, 60, 73)
- Node existence checking logic duplicated
- Cache update pattern repeated

**Current Code Issues:**
```typescript
// Line 46: Multiple conditions in single if
if (selectedNodeId === null || selectedNodeId === undefined || selectedNodeId === '') {
  // Mutations survive: changing || to &&, removing conditions
}

// Line 54: Complex nested conditions
if (selectedNodeIdRef.current === selectedNodeId && 
    selectedNodeRef.current !== null && 
    selectedNodeRef.current !== undefined) {
  // Mutations survive: changing && to ||, removing checks
}

// Line 62: Object.assign mutation survives
Object.assign(selectedNodeRef.current, updated)
```

**Refactoring Opportunities:**
1. **Extract validation functions:**
```typescript
function isValidNodeId(id: string | null | undefined): id is string {
  return id !== null && id !== undefined && id !== ''
}

function hasCachedNode(
  cachedId: string | null, 
  currentId: string,
  cachedNode: any | null
): boolean {
  return cachedId === currentId && cachedNode !== null && cachedNode !== undefined
}
```

2. **Simplify caching logic:**
```typescript
// Extract cache update to separate function
function updateNodeCache(
  ref: React.MutableRefObject<any>,
  idRef: React.MutableRefObject<string | null>,
  node: any | null,
  nodeId: string | null
): void {
  if (node !== null && node !== undefined) {
    ref.current = { ...node }
    idRef.current = nodeId
  } else {
    ref.current = null
    idRef.current = null
  }
}
```

3. **Add comprehensive tests:**
   - Test each conditional branch independently
   - Test null/undefined/empty string combinations
   - Test cache hit/miss scenarios
   - Test node existence verification
   - Test reference stability

**Action Items:**
1. Extract validation functions with explicit tests
2. Simplify conditional logic
3. Add mutation-resistant utility functions
4. Add tests for all edge cases (null, undefined, empty string, missing node)
5. Test cache invalidation scenarios

#### 3.2 `useNodeForm.ts` (8 survived)
**Issues:**
- Form value synchronization logic
- Focus detection mutations survive
- Type checking mutations survive

**Refactoring Opportunities:**
- Extract focus detection to separate function
- Add explicit tests for focus scenarios
- Test synchronization edge cases

#### 3.3 `useNodeOperations.ts` (9 survived)
**Issues:**
- Node update logic mutations survive
- Config update mutations survive

**Refactoring Opportunities:**
- Extract update logic to separate functions
- Add tests for each update type

---

## 4. hooks/storage - 50 Surviving Mutants (77.92% Score)

### Overview
- **Total Mutants:** 178 killed, 50 survived, 2 timeout, 1 no coverage
- **Mutation Score:** 77.92% (78.26% covered)
- **Status:** ⚠️ **MEDIUM PRIORITY**

### Problem Areas

#### 4.1 `useAutoSave.ts` (19 survived)
**Issues:**
- **60.42% mutation score** - Low score
- Debounce logic mutations survive
- Value comparison mutations survive
- Enabled flag mutations survive

**SOLID Violations:**
- **SRP Violation:** Hook handles multiple concerns:
  1. Debounce timing logic
  2. Value comparison (primitive vs object)
  3. Enabled state management
  4. First render detection
  5. Cleanup logic
  - Should extract: `useDebounce`, `useValueComparison`, `useFirstRender`
- **OCP Violation:** Value comparison hard-coded (JSON.stringify for objects) - not extensible
  - Should accept comparison strategy function

**DRY Violations:**
- Value comparison logic could be reused across hooks
- Debounce pattern duplicated in other hooks
- First render detection pattern duplicated

**Refactoring Opportunities:**
- Extract debounce logic to separate function
- Add explicit tests for debounce timing
- Test value comparison edge cases
- Test enabled/disabled scenarios

#### 4.2 `useLocalStorage.utils.ts` (20 survived)
**Issues:**
- JSON parsing/stringifying mutations survive
- Error handling mutations survive
- Type checking mutations survive

**Refactoring Opportunities:**
- Extract JSON operations to separate functions
- Add tests for invalid JSON scenarios
- Test error handling paths

#### 4.3 `useDraftManagement.ts` (8 survived)
**Issues:**
- Draft save/load logic mutations survive
- Storage error handling mutations survive

**Refactoring Opportunities:**
- Extract draft operations to separate functions
- Add tests for storage failures

---

## SOLID Principle Violations Summary

### Single Responsibility Principle (SRP) Violations

#### Critical Violations:
1. **`useSelectedNode.ts`** - 5 responsibilities (selection, caching, finding, validation, array management)
2. **`useAutoSave.ts`** - 5 concerns (debounce, comparison, enabled state, first render, cleanup)
3. **`useAgentDeletion.ts`** - 7 responsibilities (validation, filtering, confirmation, deletion, storage, state, errors)
4. **`useMarketplaceIntegration.ts`** - 5 responsibilities (events, creation, positioning, storage, sync)

#### High Priority Violations:
5. **`useMarketplaceData.ts`** - Still coordinates too many concerns despite refactoring
6. **`authenticatedRequestHandler.ts`** - Header merging + building in single function

### Open/Closed Principle (OCP) Violations

1. **`buildRequestHeaders`** - Hard-coded header type handling (if/else chain)
   - Cannot extend for new header types without modification
   - Should use strategy pattern or factory

2. **`sortItems` in `useMarketplaceData.utils.ts`** - Hard-coded sort strategies
   - Cannot add new sort types without modification
   - Should use strategy pattern

3. **`useAutoSave` value comparison** - Hard-coded JSON.stringify for objects
   - Cannot customize comparison strategy
   - Should accept comparison function parameter

### Dependency Inversion Principle (DIP) Violations

1. **`useSelectedNode.ts`** - Directly depends on `useReactFlow()` concrete implementation
   - Should depend on node finder abstraction

2. **Multiple hooks** - Direct dependencies on concrete storage/HTTP client implementations
   - Should use adapter interfaces

---

## DRY Principle Violations Summary

### Critical Duplications:

1. **Null/Undefined Checks** - Repeated across 15+ files:
   ```typescript
   // Pattern repeated everywhere:
   if (value === null || value === undefined || value === '') { ... }
   if (value !== null && value !== undefined) { ... }
   ```
   - **Solution:** Use mutation-resistant utility functions (already created but not used everywhere)

2. **useEffect Sync Patterns** - `useMarketplaceData.ts` has 4 identical patterns:
   ```typescript
   useEffect(() => { setData(fetching.data) }, [fetching.data])
   ```
   - **Solution:** Create generic `useSyncState` hook

3. **Wrapper Functions** - `useMarketplaceData.ts` has 4 identical wrappers:
   ```typescript
   const fetchX = async () => { await xFetching.refetch() }
   ```
   - **Solution:** Eliminate wrappers or use generic wrapper

4. **Deletion Logic** - `useAgentDeletion.ts` and `useRepositoryAgentDeletion.ts`:
   - Similar storage deletion patterns
   - Similar error handling
   - Similar confirmation logic
   - **Solution:** Extract shared deletion service

5. **Error Message Extraction** - Duplicated in multiple files:
   ```typescript
   const errorMsg = error?.message || 'Unknown error'
   ```
   - **Solution:** Use `extractApiErrorMessage` utility (already exists but not used everywhere)

6. **Storage Validation** - Repeated checks:
   ```typescript
   if (storage === null || storage === undefined) return
   if (!storage) return
   ```
   - **Solution:** Use `isStorageAvailable` utility consistently

7. **setTimeout Patterns** - `useMarketplaceIntegration.ts` uses setTimeout twice:
   - Should use debounce/throttle utility

8. **Value Comparison** - Object comparison logic duplicated:
   ```typescript
   JSON.stringify(value) !== JSON.stringify(previousValue)
   ```
   - **Solution:** Extract to `useValueComparison` hook

### Medium Priority Duplications:

9. **First Render Detection** - Pattern repeated:
   ```typescript
   const isFirstRender = useRef(true)
   if (isFirstRender.current) { ... }
   ```
   - **Solution:** Create `useFirstRender` hook

10. **Confirmation Dialogs** - Similar patterns in deletion hooks
    - **Solution:** Extract to shared confirmation service

---

## Refactoring Strategy

### Phase 1: Critical Files (Immediate)
1. **`useSelectedNode.ts`** - 33 survived mutants, 43.10% score
   - **SOLID:** Split into `useNodeSelection`, `useNodeCache`, `useNodeFinder` (SRP)
   - **DRY:** Extract null check utilities, eliminate duplicate checks
   - Extract validation functions
   - Simplify conditional logic
   - Add comprehensive edge case tests

2. **`authenticatedRequestHandler.ts`** - 24 survived, 7 no coverage
   - **SOLID:** Split `buildRequestHeaders` into `mergeHeaders` + `buildHeaders` (SRP)
   - **SOLID:** Use strategy pattern for header type handling (OCP)
   - Extract header merging logic
   - Add tests for all header types
   - Add error handling tests

### Phase 2: High Impact Files
3. **`useMarketplaceData.ts`** - DRY violations
   - **DRY:** Create `useSyncState` hook to eliminate 4 duplicate useEffect blocks
   - **DRY:** Eliminate wrapper functions or create generic wrapper
   - **SOLID:** Further separate concerns (SRP)

4. **`useMarketplaceData.utils.ts`** - Sorting/filtering logic
   - **SOLID:** Extract strategy pattern for sorting (OCP)
   - Extract strategy pattern for sorting
   - Add tests for each sort type
   - Test edge cases

5. **`useAutoSave.ts`** - 19 survived, 60.42% score
   - **SOLID:** Split into `useDebounce`, `useValueComparison`, `useFirstRender` (SRP)
   - **SOLID:** Accept comparison strategy function (OCP)
   - **DRY:** Extract reusable debounce and comparison utilities
   - Extract debounce logic
   - Add timing tests
   - Test enabled/disabled scenarios

6. **`useAgentDeletion.ts`** - 26 survived
   - **SOLID:** Split into validation, confirmation, execution functions (SRP)
   - **DRY:** Extract shared deletion service with `useRepositoryAgentDeletion`
   - Extract validation logic
   - Extract confirmation logic
   - Create shared deletion utility

### Phase 3: Systematic Improvements
7. **`useMarketplaceIntegration.ts`** - 30 survived
   - **SOLID:** Extract node creation and draft sync hooks (SRP)
   - **DRY:** Replace setTimeout with debounce utility
   - Extract node creation logic
   - Extract draft sync logic

8. **All utils files** - Consolidate similar patterns
   - **DRY:** Create shared utilities for common patterns
   - Extract common validation patterns
   - Create mutation-resistant utility functions
   - Add comprehensive edge case tests

9. **Cross-cutting DRY improvements:**
   - Create `useSyncState` hook for useEffect sync patterns
   - Create `useFirstRender` hook
   - Create `useDebounce` hook
   - Create `useValueComparison` hook
   - Ensure all hooks use `isStorageAvailable` consistently
   - Ensure all hooks use `extractApiErrorMessage` consistently

---

## SOLID and DRY Refactoring Patterns

### SOLID Refactoring Patterns

#### 1. Single Responsibility Principle (SRP)
**Pattern:** Extract responsibilities to separate hooks/functions
```typescript
// Bad: Multiple responsibilities
function useSelectedNode() {
  // Selection logic
  // Caching logic
  // Finding logic
  // Validation logic
}

// Good: Single responsibility per hook
function useNodeSelection() { /* selection only */ }
function useNodeCache() { /* caching only */ }
function useNodeFinder() { /* finding only */ }
```

#### 2. Open/Closed Principle (OCP)
**Pattern:** Use strategy pattern for extensibility
```typescript
// Bad: Hard-coded if/else
if (header instanceof Headers) { ... }
else if (Array.isArray(header)) { ... }
else { ... }

// Good: Strategy pattern
const headerStrategies = {
  Headers: (h) => {...},
  Array: (h) => {...},
  Object: (h) => {...}
}
```

#### 3. Dependency Inversion Principle (DIP)
**Pattern:** Depend on abstractions, not concretions
```typescript
// Bad: Direct dependency
const { getNodes } = useReactFlow()

// Good: Abstract interface
interface NodeFinder {
  findNode(id: string): Node | null
}
```

### DRY Refactoring Patterns

#### 1. Extract Common Patterns to Hooks
```typescript
// Bad: Duplicated useEffect pattern
useEffect(() => { setTemplates(data) }, [data])
useEffect(() => { setAgents(data) }, [data])
useEffect(() => { setWorkflows(data) }, [data])

// Good: Generic hook
function useSyncState<T>(source: T, setter: (v: T) => void) {
  useEffect(() => { setter(source) }, [source, setter])
}
```

#### 2. Extract Validation Utilities
```typescript
// Bad: Repeated null checks
if (value === null || value === undefined || value === '') { ... }

// Good: Utility function
function isEmpty(value: any): boolean {
  return value === null || value === undefined || value === ''
}
```

#### 3. Extract Shared Services
```typescript
// Bad: Duplicated deletion logic
// In useAgentDeletion.ts
// In useRepositoryAgentDeletion.ts

// Good: Shared service
class DeletionService {
  deleteItems(items: Item[], storage: StorageAdapter) { ... }
}
```

---

## Common Patterns to Address

### 1. Complex Conditionals
**Problem:** Multiple conditions in single if statements allow mutations to survive
```typescript
// Bad: Mutations survive
if (a === null || a === undefined || a === '') { ... }

// Good: Extract to function with explicit tests
function isEmpty(value: any): boolean {
  return value === null || value === undefined || value === ''
}
```

### 2. Logical Operator Mutations
**Problem:** `&&` and `||` mutations survive
**Solution:** Use mutation-resistant utilities or extract to functions

### 3. Missing Edge Case Tests
**Problem:** Null, undefined, empty string, empty array not tested
**Solution:** Add explicit tests for all falsy values

### 4. Return Value Mutations
**Problem:** Return value mutations survive
**Solution:** Test exact return values, not just truthiness

### 5. Method Call Mutations
**Problem:** Method call mutations survive
**Solution:** Verify exact method calls in tests

---

## Testing Strategy

### For Each Refactored File:
1. **Extract complex logic** to separate functions
2. **Add unit tests** for each extracted function
3. **Test all conditional branches** independently
4. **Test edge cases:** null, undefined, empty string, empty array, invalid values
5. **Test error handling** paths
6. **Verify exact return values** and types
7. **Test mutation-resistant patterns** explicitly

### Test Coverage Goals:
- **100% branch coverage** for extracted functions
- **All edge cases** tested explicitly
- **Error paths** tested
- **Return value mutations** killed

---

## Expected Impact

### After Phase 1 (Critical Files):
- **`useSelectedNode.ts`:** 33 → ~5 survived mutants (85% improvement)
- **`authenticatedRequestHandler.ts`:** 24 → ~5 survived mutants (79% improvement)
- **Total reduction:** ~47 surviving mutants

### After Phase 2 (High Impact):
- **Marketplace utils:** ~20 → ~5 survived mutants
- **AutoSave:** 19 → ~5 survived mutants
- **Total reduction:** ~29 surviving mutants

### Overall Expected Improvement:
- **Current:** 1,045 surviving mutants
- **After refactoring:** ~900 surviving mutants
- **Improvement:** ~145 mutants killed (14% reduction)
- **New mutation score:** ~84.5% (from 82.51%)

### Additional Benefits from SOLID/DRY Refactoring:
- **Code maintainability:** Significantly improved (smaller, focused functions)
- **Testability:** Improved (easier to test single responsibilities)
- **Reusability:** Improved (extracted utilities can be reused)
- **Extensibility:** Improved (strategy patterns allow extension without modification)
- **Code duplication:** Reduced by ~30-40% (estimated)

---

## Implementation Priority

1. **🔴 Critical:** `useSelectedNode.ts` (43.10% score, 33 survived)
2. **🟠 High:** `authenticatedRequestHandler.ts` (24 survived, 7 no coverage)
3. **🟠 High:** `useAutoSave.ts` (60.42% score, 19 survived)
4. **🟡 Medium:** `useMarketplaceData.utils.ts` (sorting/filtering)
5. **🟡 Medium:** `useAgentDeletion.ts` (26 survived)
6. **🟢 Low:** Other files with <10 surviving mutants

---

## Next Steps

1. **Review this analysis** with team
2. **Prioritize refactoring** based on business impact and SOLID/DRY violations
3. **Create tickets** for each refactoring task (include SOLID/DRY improvements)
4. **Implement refactoring** following SOLID principles:
   - Extract single responsibilities
   - Use strategy patterns for extensibility
   - Depend on abstractions
5. **Eliminate DRY violations:**
   - Create shared utility hooks (`useSyncState`, `useDebounce`, `useFirstRender`)
   - Extract common validation patterns
   - Create shared services for duplicated logic
6. **Add comprehensive tests** for each refactored component
7. **Re-run mutation testing** to verify improvements
8. **Document patterns** for future development
9. **Establish code review checklist** to prevent future SOLID/DRY violations

---

## Appendix: Detailed Mutation Results

### hooks/utils Breakdown:
- `authenticatedRequestHandler.ts`: 24 survived, 7 no coverage, 8 errors
- `nullishCoalescing.ts`: 21 survived
- `executionStateManager.ts`: 15 survived
- `errorHandling.ts`: 34 survived (from utils directory)
- Other files: Various smaller counts

### hooks/marketplace Breakdown:
- `useAgentDeletion.ts`: 26 survived
- `useMarketplaceIntegration.ts`: 30 survived
- `useMarketplaceData.utils.ts`: Sorting/filtering logic
- Other files: Various smaller counts

### hooks/nodes Breakdown:
- `useSelectedNode.ts`: **33 survived** (43.10% score) ⚠️ WORST
- `useNodeForm.ts`: 8 survived
- `useNodeOperations.ts`: 9 survived
- Other files: Various smaller counts

### hooks/storage Breakdown:
- `useAutoSave.ts`: 19 survived (60.42% score)
- `useLocalStorage.utils.ts`: 20 survived
- `useDraftManagement.ts`: 8 survived
- Other files: Various smaller counts

---

**Document Generated:** 2026-02-06  
**Mutation Test Score:** 82.51%  
**Analysis Based On:** Stryker mutation testing results
