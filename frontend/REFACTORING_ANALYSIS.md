# Refactoring Analysis: Top 5 Files with Most Surviving Mutants

**Date:** February 6, 2026  
**Analysis Scope:** Files with highest mutation test survivors  
**Focus:** SOLID principles, DRY violations, and refactoring opportunities

---

## Executive Summary

Analysis of the top 5 files with the most surviving mutants reveals:
- **57 surviving mutants** across 5 files
- **Common patterns:** Complex conditional logic, repeated null checks, type coercion
- **Primary issues:** DRY violations, Single Responsibility violations, excessive complexity
- **Impact:** Lower mutation scores (67-75%) indicate gaps in test coverage

---

## 1. workflowFormat.ts - 57 Surviving Mutants

**Location:** `src/utils/workflowFormat.ts`  
**Mutation Score:** 68.72%  
**Survived:** 57 mutants

### SOLID Violations

#### ❌ Single Responsibility Principle (SRP) Violations

**Issue:** `formatEdgesForReactFlow()` does too many things:
1. Handles camelCase/snake_case conversion
2. Converts boolean to string
3. Generates edge IDs
4. Filters properties
5. Type coercion

**Lines 93-152:** Function is 60 lines with multiple responsibilities.

**Recommendation:**
```typescript
// Split into focused functions
function extractHandle(edge: any, handleType: 'source' | 'target'): string | null {
  const camelKey = `${handleType}Handle`
  const snakeKey = `${handleType}_handle`
  
  if (edge[camelKey] !== null && edge[camelKey] !== undefined && edge[camelKey] !== false) {
    return normalizeHandle(edge[camelKey])
  }
  if (edge[snakeKey] !== null && edge[snakeKey] !== undefined && edge[snakeKey] !== false) {
    return normalizeHandle(edge[snakeKey])
  }
  return null
}

function normalizeHandle(handle: any): string | null {
  if (handle === true) return "true"
  if (typeof handle === 'string' && handle !== '') return handle
  return null
}

function generateEdgeId(edge: any, sourceHandle: string | null): string {
  if (edge.id && edge.id !== '') return edge.id
  if (sourceHandle) return `${edge.source}-${sourceHandle}-${edge.target}`
  return `${edge.source}-${edge.target}`
}
```

#### ❌ Open/Closed Principle Violation

**Issue:** `workflowNodeToReactFlowNode()` has hardcoded config merging logic that must be modified for each new config type.

**Lines 224-227:** Repeated pattern for each config type:
```typescript
agent_config: coalesceObjectChain({}, data.agent_config, wfNode.agent_config),
condition_config: coalesceObjectChain({}, data.condition_config, wfNode.condition_config),
loop_config: coalesceObjectChain({}, data.loop_config, wfNode.loop_config),
input_config: coalesceObjectChain({}, data.input_config, wfNode.input_config),
```

**Recommendation:**
```typescript
const CONFIG_TYPES = ['agent_config', 'condition_config', 'loop_config', 'input_config'] as const

function mergeConfigs(data: any, wfNode: any): Record<string, any> {
  const configs: Record<string, any> = {}
  for (const configType of CONFIG_TYPES) {
    configs[configType] = coalesceObjectChain(
      {},
      safeGetProperty(data, configType, undefined),
      safeGetProperty(wfNode, configType, undefined)
    )
  }
  return configs
}
```

### DRY Violations

#### ❌ Repeated Handle Extraction Logic

**Lines 98-112:** Identical logic for `sourceHandle` and `targetHandle`:
```typescript
let sourceHandle: string | null = null
if (edge.sourceHandle !== null && edge.sourceHandle !== undefined && edge.sourceHandle !== false) {
  sourceHandle = edge.sourceHandle
} else if (edge.source_handle !== null && edge.source_handle !== undefined && edge.source_handle !== false) {
  sourceHandle = edge.source_handle
}

let targetHandle: string | null = null
if (edge.targetHandle !== null && edge.targetHandle !== undefined && edge.targetHandle !== false) {
  targetHandle = edge.targetHandle
} else if (edge.target_handle !== null && edge.target_handle !== undefined && edge.target_handle !== false) {
  targetHandle = edge.target_handle
}
```

**Recommendation:** Extract to `extractHandle()` function (see above).

#### ❌ Repeated Config Normalization

**Lines 81-85, 164-183:** Same pattern repeated for each config type:
```typescript
agent_config: coalesceObject(node.data.agent_config, {}),
condition_config: coalesceObject(node.data.condition_config, {}),
loop_config: coalesceObject(node.data.loop_config, {}),
input_config: coalesceObject(node.data.input_config, {}),
```

**Recommendation:** Use loop-based approach (see above).

### Refactoring Opportunities

1. **Extract Handle Normalization:** Create `normalizeHandle()` utility
2. **Extract Config Merging:** Create `mergeConfigs()` utility
3. **Extract Edge ID Generation:** Create `generateEdgeId()` utility
4. **Simplify Conditional Chains:** Use early returns and guard clauses
5. **Type Safety:** Replace `as any` with proper type guards

### Complexity Issues

- **Cyclomatic Complexity:** `formatEdgesForReactFlow()` has complexity ~15
- **Nested Conditionals:** Multiple levels of null checks
- **Type Coercion:** Excessive `as any` casts

---

## 2. formUtils.ts - 55 Surviving Mutants

**Location:** `src/utils/formUtils.ts`  
**Mutation Score:** 67.44%  
**Survived:** 55 mutants

### SOLID Violations

#### ✅ Single Responsibility Principle - COMPLIANT

**Good:** Each function has a single, clear responsibility:
- `traversePath()` - Only traverses paths
- `getNestedValue()` - Only gets values
- `setNestedValue()` - Only sets values
- `hasNestedValue()` - Only checks existence

#### ⚠️ Open/Closed Principle - PARTIAL VIOLATION

**Issue:** `setNestedValue()` has hardcoded logic for handling different value types (object, array, primitive).

**Lines 109-121:** Must modify function to handle new types:
```typescript
if (current[key] === null || current[key] === undefined) {
  current[key] = {}
} else if (Array.isArray(current[key])) {
  current[key] = [...current[key]]
} else if (typeof current[key] === 'object') {
  current[key] = { ...current[key] }
} else {
  return obj
}
```

**Recommendation:**
```typescript
interface ValueCloner {
  clone(value: any): any
  canHandle(value: any): boolean
}

const cloners: ValueCloner[] = [
  { canHandle: (v) => Array.isArray(v), clone: (v) => [...v] },
  { canHandle: (v) => typeof v === 'object' && v !== null, clone: (v) => ({ ...v }) },
  { canHandle: () => true, clone: (v) => v },
]

function cloneValue(value: any): any {
  const cloner = cloners.find(c => c.canHandle(value))
  return cloner ? cloner.clone(value) : value
}
```

### DRY Violations

#### ❌ Repeated Null/Undefined Checks

**Lines 19, 24, 52, 61, 64, 71, 95, 110, 140, 147, 150:** Same pattern repeated:
```typescript
if (obj === null || obj === undefined || ...) return ...
```

**Recommendation:**
```typescript
function isNullOrUndefined(value: any): boolean {
  return value === null || value === undefined
}

// Usage
if (isNullOrUndefined(obj) || keys.length === 0) return null
```

#### ❌ Repeated Path Validation

**Lines 95, 140:** Same validation logic:
```typescript
if (obj === null || obj === undefined || path === null || path === undefined || path === '' || validatePath(path) === false) {
  return ...
}
```

**Recommendation:**
```typescript
function validateInputs(obj: any, path: string | string[]): boolean {
  return !isNullOrUndefined(obj) && 
         !isNullOrUndefined(path) && 
         path !== '' && 
         validatePath(path) !== false
}
```

### Refactoring Opportunities

1. **Extract Null Checks:** Create `isNullOrUndefined()` utility
2. **Extract Input Validation:** Create `validateInputs()` utility
3. **Extract Value Cloning:** Use strategy pattern for cloning
4. **Simplify Traverse Logic:** Use early returns more effectively
5. **Add Type Guards:** Replace `any` with proper types

### Complexity Issues

- **Nested Conditionals:** Multiple levels of null checks create mutation survivors
- **Path Traversal:** Complex logic for handling intermediate nulls
- **Edge Cases:** Distinguishing between "key doesn't exist" vs "value is undefined"

---

## 3. storageHelpers.ts - 33 Surviving Mutants

**Location:** `src/utils/storageHelpers.ts`  
**Mutation Score:** 70.27%  
**Survived:** 33 mutants

### SOLID Violations

#### ❌ Single Responsibility Principle Violation

**Issue:** Each function handles:
1. Null/undefined checks
2. Error handling
3. Storage operations
4. Error reporting

**Recommendation:** Extract error handling to decorator/wrapper:
```typescript
function withStorageErrorHandling<T>(
  operation: (storage: StorageAdapter) => T,
  operationName: string,
  key: string,
  defaultValue: T,
  context?: string
): T {
  return (storage: StorageAdapter | null) => {
    if (isNullOrUndefined(storage)) return defaultValue
    try {
      return operation(storage)
    } catch (error) {
      handleStorageError(error, operationName, key, {
        context,
        logError: true,
        showNotification: false,
      })
      return defaultValue
    }
  }
}

export const safeStorageGet = <T>(key: string, defaultValue: T, context?: string) =>
  withStorageErrorHandling(
    (storage) => {
      const item = storage.getItem(key)
      return isNullOrUndefined(item) ? defaultValue : JSON.parse(item) as T
    },
    'getItem',
    key,
    defaultValue,
    context
  )
```

### DRY Violations

#### ❌ Repeated Null Check Pattern

**Lines 15, 45, 73, 99, 124:** Identical pattern:
```typescript
if (storage === null || storage === undefined) {
  return defaultValue // or false
}
```

**Recommendation:** Extract to utility (see above).

#### ❌ Repeated Error Handling Pattern

**Lines 26-31, 55-60, 81-86, 107-112, 135-140:** Identical try-catch pattern:
```typescript
try {
  // operation
} catch (error) {
  handleStorageError(error, 'operationName', key, {
    context,
    logError: true,
    showNotification: false,
  })
  return defaultValue
}
```

**Recommendation:** Use wrapper function (see above).

#### ❌ Repeated Error Handling Options

**Lines 26-30, 55-59, 81-85, 107-111, 135-139:** Same options object:
```typescript
{
  context,
  logError: true,
  showNotification: false,
}
```

**Recommendation:** Extract to constant:
```typescript
const DEFAULT_ERROR_OPTIONS = {
  logError: true,
  showNotification: false,
} as const
```

### Refactoring Opportunities

1. **Extract Error Handling Wrapper:** Create `withStorageErrorHandling()` decorator
2. **Extract Null Checks:** Create `validateStorage()` utility
3. **Extract Default Options:** Create constants for repeated options
4. **Simplify Functions:** Use higher-order functions
5. **Add Type Safety:** Better typing for storage operations

### Complexity Issues

- **Repetitive Code:** 5 functions with nearly identical structure
- **Error Handling:** Duplicated across all functions
- **Type Coercion:** JSON.parse without proper error handling

---

## 4. safeAccess.ts - 25 Surviving Mutants

**Location:** `src/utils/safeAccess.ts`  
**Mutation Score:** 72.63%  
**Survived:** 25 mutants

### SOLID Violations

#### ✅ Single Responsibility Principle - COMPLIANT

**Good:** Each function has a single, clear purpose:
- `safeGet()` - Nested property access
- `safeGetProperty()` - Single property access
- `safeCall()` - Method invocation
- `safeGetArrayElement()` - Array access

#### ⚠️ Open/Closed Principle - PARTIAL VIOLATION

**Issue:** Each function has hardcoded null check logic. Adding new access patterns requires new functions.

**Recommendation:** Use strategy pattern:
```typescript
interface SafeAccessStrategy<T> {
  access(obj: any, ...args: any[]): T
  canHandle(obj: any, ...args: any[]): boolean
}

class SafePropertyAccess implements SafeAccessStrategy<any> {
  canHandle(obj: any, path: string[]): boolean {
    return Array.isArray(path)
  }
  access(obj: any, path: string[], defaultValue: any): any {
    // Implementation
  }
}
```

### DRY Violations

#### ❌ Repeated Null Check Pattern

**Lines 25, 31, 37, 55, 60, 80, 112, 125:** Same pattern:
```typescript
if (obj === null || obj === undefined) {
  return defaultValue
}
```

**Recommendation:** Extract to utility (see formUtils.ts).

#### ❌ Repeated Ternary Pattern

**Lines 37, 60, 91, 125:** Same pattern:
```typescript
return (value !== null && value !== undefined) ? value : defaultValue
```

**Recommendation:**
```typescript
function coalesce<T>(value: T | null | undefined, defaultValue: T): T {
  return (value !== null && value !== undefined) ? value : defaultValue
}
```

### Refactoring Opportunities

1. **Extract Null Checks:** Create `isNullOrUndefined()` utility
2. **Extract Coalesce:** Create `coalesce()` utility
3. **Use Strategy Pattern:** For extensibility
4. **Simplify Conditionals:** Use early returns
5. **Add Type Guards:** Better type safety

### Complexity Issues

- **Repetitive Patterns:** Same null checks across all functions
- **Type Coercion:** Multiple `as T` casts
- **Edge Cases:** Distinguishing null vs undefined

---

## 5. adapters.ts - 23 Surviving Mutants

**Location:** `src/types/adapters.ts`  
**Mutation Score:** 74.68%  
**Survived:** 23 mutants

### SOLID Violations

#### ❌ Single Responsibility Principle Violation

**Issue:** `defaultAdapters` object contains:
1. Storage adapter creation
2. HTTP client creation
3. Document adapter creation
4. Timer adapter creation
5. WebSocket factory creation
6. Location adapter creation
7. Console adapter creation
8. Environment adapter creation

**Recommendation:** Split into separate factory modules:
```typescript
// adapters/storage.ts
export const StorageAdapterFactory = {
  createStorageAdapter(storage: Storage | null): StorageAdapter | null { ... },
  createLocalStorageAdapter(): StorageAdapter | null { ... },
  createSessionStorageAdapter(): StorageAdapter | null { ... },
}

// adapters/http.ts
export const HttpClientFactory = {
  createHttpClient(): HttpClient { ... },
}

// adapters/document.ts
export const DocumentAdapterFactory = {
  createDocumentAdapter(): DocumentAdapter | null { ... },
}
```

#### ❌ Interface Segregation Principle Violation

**Issue:** `StorageAdapter` interface includes event listener methods that may not be needed by all implementations.

**Lines 13-14:** Event listeners may not be relevant for all storage types:
```typescript
addEventListener(type: string, listener: EventListener): void
removeEventListener(type: string, listener: EventListener): void
```

**Recommendation:**
```typescript
interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

interface EventEmitter {
  addEventListener(type: string, listener: EventListener): void
  removeEventListener(type: string, listener: EventListener): void
}

interface StorageAdapterWithEvents extends StorageAdapter, EventEmitter {}
```

### DRY Violations

#### ❌ Repeated Null Checks

**Lines 96, 114, 124, 196, 237:** Same pattern:
```typescript
if (typeof window === 'undefined') {
  return null
}
```

**Recommendation:**
```typescript
function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined'
}
```

#### ❌ Repeated Try-Catch in HTTP Client

**Lines 142-147, 150-157, 161-168, 172-177:** Same pattern:
```typescript
try {
  return fetchFn(url, { ... })
} catch (error) {
  return Promise.reject(error)
}
```

**Recommendation:**
```typescript
function safeFetch(fetchFn: typeof fetch, url: string, options: RequestInit): Promise<Response> {
  try {
    return fetchFn(url, options)
  } catch (error) {
    return Promise.reject(error)
  }
}
```

#### ❌ Repeated Fallback Values in Location Adapter

**Lines 243-249, 254-260:** Same fallback values:
```typescript
protocol: window.location?.protocol || 'http:',
host: window.location?.host || 'localhost:8000',
// ... repeated in catch block
```

**Recommendation:**
```typescript
const DEFAULT_LOCATION: WindowLocation = {
  protocol: 'http:',
  host: 'localhost:8000',
  hostname: 'localhost',
  port: '8000',
  pathname: '/',
  search: '',
  hash: '',
}
```

### Refactoring Opportunities

1. **Split Factory Object:** Separate into focused factory modules
2. **Extract Environment Checks:** Create `isBrowserEnvironment()` utility
3. **Extract Safe Fetch:** Create `safeFetch()` wrapper
4. **Extract Default Values:** Create constants for defaults
5. **Split Interfaces:** Use Interface Segregation Principle

### Complexity Issues

- **Large Object:** `defaultAdapters` has 8+ methods
- **Mixed Concerns:** Adapter creation mixed with default implementations
- **Error Handling:** Inconsistent error handling patterns

---

## Cross-File Patterns

### Common Issues Across All Files

1. **Repeated Null Checks:** All files have `obj === null || obj === undefined` patterns
2. **Repeated Error Handling:** Similar try-catch patterns
3. **Type Coercion:** Excessive use of `as any` and type assertions
4. **Complex Conditionals:** Multiple levels of nested conditionals
5. **Lack of Type Guards:** Missing proper type checking utilities

### Recommended Shared Utilities

```typescript
// utils/typeGuards.ts
export function isNullOrUndefined(value: any): value is null | undefined {
  return value === null || value === undefined
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

// utils/coalesce.ts
export function coalesce<T>(value: T | null | undefined, defaultValue: T): T {
  return isDefined(value) ? value : defaultValue
}

// utils/environment.ts
export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined'
}

export function isServerEnvironment(): boolean {
  return typeof window === 'undefined'
}
```

---

## Priority Recommendations

### High Priority (Immediate Impact)

1. **Extract Common Utilities:**
   - `isNullOrUndefined()` - Used in all 5 files
   - `coalesce()` - Used in 4 files
   - `isBrowserEnvironment()` - Used in adapters.ts

2. **Refactor workflowFormat.ts:**
   - Split `formatEdgesForReactFlow()` into smaller functions
   - Extract handle normalization logic
   - Extract config merging logic

3. **Refactor storageHelpers.ts:**
   - Create error handling wrapper
   - Extract null check utility
   - Use higher-order functions

### Medium Priority (Significant Impact)

4. **Refactor formUtils.ts:**
   - Extract input validation utility
   - Use strategy pattern for value cloning
   - Simplify traverse logic

5. **Refactor adapters.ts:**
   - Split into separate factory modules
   - Extract environment checks
   - Split interfaces using ISP

### Low Priority (Quality Improvements)

6. **Improve Type Safety:**
   - Replace `as any` with proper type guards
   - Add generic constraints
   - Use discriminated unions

7. **Add Documentation:**
   - Document complex algorithms
   - Add JSDoc for all public functions
   - Document edge cases

---

## Expected Impact

### Mutation Score Improvements

- **workflowFormat.ts:** 68.72% → ~85% (extract functions, reduce complexity)
- **formUtils.ts:** 67.44% → ~80% (extract utilities, simplify logic)
- **storageHelpers.ts:** 70.27% → ~85% (DRY refactoring, wrapper pattern)
- **safeAccess.ts:** 72.63% → ~85% (extract utilities, simplify)
- **adapters.ts:** 74.68% → ~85% (split modules, extract utilities)

### Code Quality Improvements

- **Reduced Duplication:** ~200+ lines of duplicated code eliminated
- **Improved Maintainability:** Smaller, focused functions
- **Better Testability:** Isolated functions easier to test
- **Enhanced Readability:** Clearer intent, less nesting

---

## Implementation Plan

### Phase 1: Extract Common Utilities (Week 1)
1. Create `utils/typeGuards.ts`
2. Create `utils/coalesce.ts`
3. Create `utils/environment.ts`
4. Update all 5 files to use new utilities

### Phase 2: Refactor workflowFormat.ts (Week 2)
1. Extract handle normalization
2. Extract config merging
3. Split `formatEdgesForReactFlow()`
4. Add comprehensive tests

### Phase 3: Refactor storageHelpers.ts (Week 2)
1. Create error handling wrapper
2. Refactor all storage functions
3. Add tests for edge cases

### Phase 4: Refactor Remaining Files (Week 3)
1. Refactor formUtils.ts
2. Refactor safeAccess.ts
3. Refactor adapters.ts

### Phase 5: Validation (Week 4)
1. Run mutation tests
2. Verify mutation score improvements
3. Update documentation
4. Code review

---

## Conclusion

The analysis reveals significant opportunities for improvement across all 5 files. The primary issues are:

1. **DRY Violations:** Repeated patterns that should be extracted to utilities
2. **SRP Violations:** Functions doing too many things
3. **Complex Conditionals:** Nested logic that creates mutation survivors
4. **Type Safety:** Excessive use of `as any`

Implementing these refactorings should:
- **Improve mutation scores** by 10-15% across all files
- **Reduce code duplication** by ~200+ lines
- **Improve maintainability** through smaller, focused functions
- **Enhance testability** through better isolation

The refactoring effort is estimated at **3-4 weeks** with **high impact** on code quality and mutation test scores.
