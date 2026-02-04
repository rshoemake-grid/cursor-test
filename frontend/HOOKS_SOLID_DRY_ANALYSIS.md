# Hooks Folder: SOLID & DRY Compliance Analysis

## Executive Summary

After analyzing all hooks in the `frontend/src/hooks` folder, several code organization improvements were identified. While many hooks follow good practices (especially those recently reorganized), there are **DRY violations** and **SOLID principle violations** that should be addressed.

**Overall Assessment:**
- ✅ **Good:** Dependency Inversion Principle (DIP) - Many hooks use dependency injection
- ✅ **Good:** Interface Segregation - Most hooks have focused interfaces
- ⚠️ **Needs Improvement:** DRY - Code duplication in tab operations
- ⚠️ **Needs Improvement:** Single Responsibility Principle - Some hooks do too much
- ⚠️ **Needs Improvement:** Open/Closed Principle - Hard to extend without modification

---

## DRY Violations Found

### 1. Tab Creation Logic (CRITICAL) 🔴

**Location:** Duplicated in 2+ files

**Files Affected:**
- `useTabOperations.ts` (lines 31-39, 115-123)
- `useTabInitialization.ts` (lines 43-51, 71-79)

**Duplicated Code:**
```typescript
const newId = `workflow-${Date.now()}`
const newTab: WorkflowTabData = {
  id: newId,
  name: 'Untitled Workflow',
  workflowId: null,
  isUnsaved: true,
  executions: [],
  activeExecutionId: null
}
```

**Impact:** High - Changes to tab structure require updates in multiple places

**Recommendation:** Extract to `useTabOperations.utils.ts`:
```typescript
export function createNewTab(): WorkflowTabData {
  return {
    id: `workflow-${Date.now()}`,
    name: 'Untitled Workflow',
    workflowId: null,
    isUnsaved: true,
    executions: [],
    activeExecutionId: null
  }
}
```

---

### 2. Tab Update Pattern (MEDIUM) 🟡

**Location:** Repeated `setTabs(prev => prev.map(tab => ...))` pattern

**Files Affected:**
- `useTabOperations.ts` - 5+ occurrences
- `useExecutionManagement.ts` - 6+ occurrences  
- `useTabInitialization.ts` - 1 occurrence

**Duplicated Pattern:**
```typescript
setTabs(prev => prev.map(tab => 
  tab.id === tabId 
    ? { ...tab, /* updates */ }
    : tab
))
```

**Impact:** Medium - Verbose and error-prone

**Recommendation:** Create utility functions:
```typescript
// useTabOperations.utils.ts
export function updateTab(
  tabs: WorkflowTabData[],
  tabId: string,
  updates: Partial<WorkflowTabData>
): WorkflowTabData[] {
  return tabs.map(tab => 
    tab.id === tabId ? { ...tab, ...updates } : tab
  )
}

export function updateTabByWorkflowId(
  tabs: WorkflowTabData[],
  workflowId: string,
  updates: Partial<WorkflowTabData>
): WorkflowTabData[] {
  return tabs.map(tab => 
    tab.workflowId === workflowId ? { ...tab, ...updates } : tab
  )
}
```

---

### 3. Active Tab Switching Logic (MEDIUM) 🟡

**Location:** `useTabOperations.ts` (lines 58-63, 73-75, 96-101, 111-113)

**Duplicated Code:**
```typescript
// If closing active tab, switch to the last tab
if (tabId === activeTabId && filtered.length > 0) {
  setActiveTabId(filtered[filtered.length - 1].id)
} else if (tabId === activeTabId && filtered.length === 0) {
  setActiveTabId('')
}
```

**Impact:** Medium - Logic repeated 4 times with slight variations

**Recommendation:** Extract to utility:
```typescript
export function handleActiveTabAfterClose(
  closedTabId: string,
  activeTabId: string | null,
  remainingTabs: WorkflowTabData[],
  setActiveTabId: (id: string) => void
): void {
  if (closedTabId !== activeTabId) return
  
  if (remainingTabs.length > 0) {
    setActiveTabId(remainingTabs[remainingTabs.length - 1].id)
  } else {
    setActiveTabId('')
  }
}
```

---

### 4. Confirmation Dialog Pattern (LOW) 🟢

**Location:** Multiple hooks use similar confirmation patterns

**Files Affected:**
- `useTabOperations.ts` - lines 50-52, 88-90
- `useNodeOperations.ts` - lines 75-78
- `useTemplateOperations.ts` - likely similar

**Duplicated Pattern:**
```typescript
showConfirm(
  'This workflow has unsaved changes. Close anyway?',
  { title: 'Unsaved Changes', confirmText: 'Close', cancelText: 'Cancel', type: 'warning' }
).then((confirmed) => {
  if (!confirmed) return
  // ... action
})
```

**Impact:** Low - Acceptable duplication, but could be abstracted

**Recommendation:** Create reusable confirmation wrapper:
```typescript
// hooks/utils/confirmations.ts
export async function confirmUnsavedChanges(
  onConfirm: () => void | Promise<void>
): Promise<void> {
  const confirmed = await showConfirm(
    'This workflow has unsaved changes. Close anyway?',
    { title: 'Unsaved Changes', confirmText: 'Close', cancelText: 'Cancel', type: 'warning' }
  )
  if (confirmed) {
    await onConfirm()
  }
}
```

---

## SOLID Principle Violations

### 1. Single Responsibility Principle (SRP) Violations

#### `useTabOperations.ts` 🔴
**Current Responsibilities:**
1. Tab creation
2. Tab closing (with confirmation)
3. Workflow closing
4. Workflow loading
5. Workflow saving
6. Workflow modification tracking

**Violation:** Too many responsibilities in one hook

**Recommendation:** Split into:
- `useTabCreation.ts` - Tab creation logic
- `useTabClosing.ts` - Tab closing with confirmation
- `useTabWorkflowSync.ts` - Workflow loading/saving sync

#### `useExecutionManagement.ts` 🟡
**Current Responsibilities:**
1. Execution start handling
2. Execution clearing
3. Execution removal
4. Execution log updates
5. Execution status updates
6. Node state updates
7. Polling for execution updates

**Violation:** Execution updates and polling could be separated

**Recommendation:** Split into:
- `useExecutionUpdates.ts` - Real-time updates (logs, status, nodes)
- `useExecutionPolling.ts` - Polling fallback logic
- Keep core operations in `useExecutionManagement.ts`

---

### 2. Dependency Inversion Principle (DIP) - Mixed Compliance

#### ✅ **Good Examples:**
- `useLocalStorage.ts` - Uses `StorageAdapter` abstraction
- `useWebSocket.ts` - Uses `WebSocketFactory` abstraction
- `useWorkflowAPI.ts` - Uses `WorkflowAPIClient` abstraction
- `useAuthenticatedApi.ts` - Uses dependency injection

#### ⚠️ **Needs Improvement:**
- `useExecutionManagement.ts` - Directly imports `api` and `logger`
- `useTemplateOperations.ts` - Directly imports `api`, `logger`, `showError`, `showSuccess`
- `useTabOperations.ts` - Directly imports `showConfirm`
- `useNodeOperations.ts` - Directly imports `showConfirm`, `showError`

**Recommendation:** Inject dependencies:
```typescript
// Before
export function useExecutionManagement({ tabs, ... }: Options) {
  // Uses api and logger directly
}

// After
export function useExecutionManagement({ 
  tabs, 
  apiClient = api,
  logger: injectedLogger = logger,
  ... 
}: Options) {
  // Uses injected dependencies
}
```

---

### 3. Open/Closed Principle (OCP) Violations

**Issue:** Tab creation and update logic is duplicated rather than extensible

**Current:** Each hook implements its own tab creation/update logic

**Recommendation:** Create composable utilities:
```typescript
// useTabOperations.utils.ts
export interface TabFactory {
  createTab(): WorkflowTabData
  createTabWithWorkflow(workflowId: string, name: string): WorkflowTabData
}

export const defaultTabFactory: TabFactory = {
  createTab: () => ({
    id: `workflow-${Date.now()}`,
    name: 'Untitled Workflow',
    workflowId: null,
    isUnsaved: true,
    executions: [],
    activeExecutionId: null
  }),
  createTabWithWorkflow: (workflowId, name) => ({
    id: `workflow-${Date.now()}`,
    name,
    workflowId,
    isUnsaved: false,
    executions: [],
    activeExecutionId: null
  })
}
```

---

## Additional Code Organization Improvements

### 1. Extract Common Tab Utilities

**Create:** `frontend/src/hooks/utils/tabUtils.ts`

**Functions to Extract:**
- `createNewTab()` - Tab creation
- `updateTab()` - Update tab by ID
- `updateTabByWorkflowId()` - Update tab by workflow ID
- `findTab()` - Find tab by ID
- `findTabByWorkflowId()` - Find tab by workflow ID
- `handleActiveTabAfterClose()` - Active tab switching logic
- `filterTabs()` - Filter tabs helper

### 2. Extract Confirmation Utilities

**Create:** `frontend/src/hooks/utils/confirmations.ts`

**Functions to Extract:**
- `confirmUnsavedChanges()` - Unsaved changes confirmation
- `confirmDelete()` - Delete confirmation
- `confirmAction()` - Generic confirmation wrapper

### 3. Extract Execution Utilities

**Create:** `frontend/src/hooks/utils/executionUtils.ts`

**Functions to Extract:**
- `createExecution()` - Create execution object
- `updateExecutionStatus()` - Update execution status
- `addExecutionLog()` - Add log to execution
- `updateExecutionNode()` - Update node state in execution
- `isPendingExecution()` - Check if execution is pending

---

## Priority Recommendations

### Phase 1: Critical DRY Violations (Week 1)
1. ✅ Extract tab creation logic to `useTabOperations.utils.ts`
2. ✅ Extract tab update utilities
3. ✅ Extract active tab switching logic

### Phase 2: SOLID Improvements (Week 2)
1. ✅ Split `useTabOperations.ts` into focused hooks
2. ✅ Add dependency injection to hooks that need it
3. ✅ Extract confirmation utilities

### Phase 3: Additional Utilities (Week 3)
1. ✅ Create execution utilities
2. ✅ Create comprehensive tab utilities module
3. ✅ Refactor hooks to use new utilities

---

## Files to Create

1. `frontend/src/hooks/utils/tabUtils.ts` - Tab manipulation utilities
2. `frontend/src/hooks/utils/confirmations.ts` - Confirmation dialog utilities
3. `frontend/src/hooks/utils/executionUtils.ts` - Execution manipulation utilities
4. `frontend/src/hooks/useTabCreation.ts` - Tab creation hook (extracted)
5. `frontend/src/hooks/useTabClosing.ts` - Tab closing hook (extracted)
6. `frontend/src/hooks/useTabWorkflowSync.ts` - Workflow sync hook (extracted)

---

## Expected Benefits

1. **Reduced Code Duplication:** ~200+ lines of duplicated code eliminated
2. **Improved Maintainability:** Single source of truth for tab operations
3. **Better Testability:** Utilities can be tested independently
4. **Easier Extension:** New tab operations can extend utilities
5. **Improved Mutation Test Scores:** Less duplication = fewer mutants to kill
6. **Better SOLID Compliance:** Clear separation of concerns

---

## Compliance Summary

| Principle | Current Status | Target Status |
|-----------|---------------|---------------|
| **Single Responsibility** | ⚠️ Some violations | ✅ Fully compliant |
| **Open/Closed** | ⚠️ Hard to extend | ✅ Extensible |
| **Liskov Substitution** | ✅ N/A (hooks) | ✅ N/A |
| **Interface Segregation** | ✅ Good | ✅ Good |
| **Dependency Inversion** | ⚠️ Mixed | ✅ Fully compliant |
| **DRY** | ⚠️ Multiple violations | ✅ Fully compliant |

---

## Next Steps

1. Review and approve recommendations
2. Implement Phase 1 (Critical DRY violations)
3. Run tests to ensure no regressions
4. Implement Phase 2 (SOLID improvements)
5. Re-run mutation tests to measure improvement
6. Implement Phase 3 (Additional utilities)
